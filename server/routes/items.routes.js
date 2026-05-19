import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import LostItem from '../models/LostItem.js';
import FoundItem from '../models/FoundItem.js';
import User from '../models/User.js';
import Match from '../models/Match.js';
import Claim from '../models/Claim.js';
import { upload } from '../config/cloudinary.js';
import emailQueue from '../utils/emailQueue.js';
import ActivityLog from '../models/ActivityLog.js';
import { generateUniqueId, logActivity } from '../utils/itemHelpers.js';

const router = express.Router();

// Helper function to check for matches using advanced Automated Match Engine scoring
const checkForMatches = async (newItem, type) => {
    try {
        console.log(`\n🔍 Running Intelligent Match Engine for new ${type} item: "${newItem.item_name}"`);

        const TargetModel = type === 'lost' ? FoundItem : LostItem;
        const targetItems = await TargetModel.find({ status: 'active' });

        let matchCount = 0;

        for (const targetItem of targetItems) {
            // Requirement 1: Category must match exactly (if not, score is 0 and skip)
            if (newItem.category !== targetItem.category) {
                continue;
            }

            let score = 30; // Category match awards +30 points automatically

            // Requirement 2: Location comparison
            const newItemLocation = (type === 'lost' ? newItem.last_known_location : newItem.location_found) || '';
            const targetItemLocation = (type === 'lost' ? targetItem.location_found : targetItem.last_known_location) || '';

            const loc1 = newItemLocation.toLowerCase().trim();
            const loc2 = targetItemLocation.toLowerCase().trim();

            if (loc1 === loc2) {
                score += 30;
            } else if (loc1.includes(loc2) || loc2.includes(loc1)) {
                score += 15;
            }

            // Requirement 3: Keyword overlaps in Title and Description
            const cleanText = (text) => {
                if (!text) return [];
                return text
                    .toLowerCase()
                    .replace(/[^\w\s]/g, '')
                    .split(/\s+/)
                    .filter(word => word.length > 2)
                    .filter(word => !['the', 'and', 'or', 'for', 'with', 'lost', 'found', 'this', 'that', 'from', 'near', 'under', 'next', 'some', 'about', 'your', 'have', 'been'].includes(word));
            };

            const newTokens = [...new Set([...cleanText(newItem.item_name), ...cleanText(newItem.description)])];
            const targetTokens = [...new Set([...cleanText(targetItem.item_name), ...cleanText(targetItem.description)])];

            const overlaps = newTokens.filter(token => targetTokens.includes(token));
            const overlapScore = overlaps.length * 10;
            score += Math.min(overlapScore, 40); // Cap text keyword overlaps at +40 points

            console.log(`  Checking potential match with "${targetItem.item_name}" - Calculated Score: ${score}/100`);

            // Confidence threshold met (score >= 50)
            if (score >= 50) {
                matchCount++;
                const lostItem = type === 'lost' ? newItem : targetItem;
                const foundItem = type === 'lost' ? targetItem : newItem;

                // Insert or update match entry in MongoDB
                await Match.findOneAndUpdate(
                    { lost_item_id: lostItem._id, found_item_id: foundItem._id },
                    { score, status: 'pending' },
                    { upsert: true, new: true }
                );

                console.log(`  ✓ Intelligent Match Saved! "${lostItem.item_name}" ↔ "${foundItem.item_name}" (Score: ${score})`);

                const lostUser = type === 'lost' ? await User.findById(newItem.user_id) : targetItem.user_id;
                const foundUser = type === 'lost' ? targetItem.user_id : await User.findById(newItem.user_id);

                if (lostUser && foundUser) {
                    emailQueue.addToQueue({
                        lostItem,
                        foundItem,
                        lostUser,
                        foundUser
                    });
                }
            }
        }

        if (matchCount === 0) {
            console.log(`❌ No matches found for "${newItem.item_name}"`);
        } else {
            console.log(`🎉 Found ${matchCount} match(es) for "${newItem.item_name}"`);
        }
    } catch (error) {
        console.error('Error running Automated Match Engine:', error);
    }
};

// Create lost item
router.post('/lost', authMiddleware, upload.single('image'), async (req, res) => {
    try {
        const { itemName, description, category, lastKnownLocation, dateLost } = req.body;
        const imagePath = req.file ? req.file.path : null;

        // Generate unique ID
        const uniqueId = await generateUniqueId('lost');

        const lostItem = await LostItem.create({
            unique_id: uniqueId,
            user_id: req.user.id,
            item_name: itemName,
            description,
            category,
            last_known_location: lastKnownLocation,
            date_lost: dateLost,
            image_path: imagePath
        });

        // Log item creation
        await logActivity({
            userId: req.user.id,
            actionType: 'create_item',
            itemType: 'lost',
            itemId: lostItem._id.toString(),
            itemUniqueId: uniqueId,
            itemName: itemName,
            description: `User created lost item report`,
            metadata: { category, location: lastKnownLocation, date: dateLost }
        });

        // Check for matches asynchronously
        checkForMatches(lostItem, 'lost');

        res.status(201).json({
            message: 'Lost item reported successfully',
            itemId: lostItem._id,
            uniqueId: uniqueId
        });
    } catch (error) {
        console.error('Create lost item error:', error);
        res.status(500).json({ error: 'Failed to create lost item report' });
    }
});

// Get all lost items (with filters)
router.get('/lost', async (req, res) => {
    try {
        const { keyword, category, location, dateFrom, dateTo, sort } = req.query;

        let query = { status: 'active' };

        if (keyword) {
            query.$or = [
                { item_name: { $regex: keyword, $options: 'i' } },
                { description: { $regex: keyword, $options: 'i' } }
            ];
        }

        if (category) {
            query.category = category;
        }

        if (location) {
            query.last_known_location = { $regex: location, $options: 'i' };
        }

        if (dateFrom || dateTo) {
            query.date_lost = {};
            if (dateFrom) query.date_lost.$gte = new Date(dateFrom);
            if (dateTo) query.date_lost.$lte = new Date(dateTo);
        }

        const sortOrder = sort === 'oldest' ? 1 : -1;

        const items = await LostItem.find(query)
            .populate('user_id', 'full_name email status')
            .sort({ createdAt: sortOrder });

        // Filter out posts from banned users (unless requester is admin)
        const token = req.headers.authorization?.split(' ')[1];
        let isAdmin = false;

        if (token) {
            try {
                const jwt = await import('jsonwebtoken');
                const decoded = jwt.default.verify(token, process.env.JWT_SECRET);
                isAdmin = decoded.role === 'admin';
            } catch (err) {
                // Token invalid or expired, treat as non-admin
            }
        }

        const filteredItems = isAdmin
            ? items
            : items.filter(item => item.user_id?.status === 'active');

        const transformedItems = filteredItems.map(item => ({
            id: item._id,
            unique_id: item.unique_id,
            item_name: item.item_name,
            description: item.description,
            category: item.category,
            last_known_location: item.last_known_location,
            date_lost: item.date_lost,
            image_path: item.image_path,
            status: item.status,
            created_at: item.createdAt,
            updated_at: item.updatedAt,
            full_name: item.user_id?.full_name,
            email: item.user_id?.email,
            user_status: item.user_id?.status
        }));

        res.json(transformedItems);
    } catch (error) {
        console.error('Get lost items error:', error);
        res.status(500).json({ error: 'Failed to fetch lost items' });
    }
});

// Get user's lost items
router.get('/lost/my', authMiddleware, async (req, res) => {
    try {
        const items = await LostItem.find({ user_id: req.user.id })
            .sort({ createdAt: -1 });

        const transformedItems = items.map(item => ({
            id: item._id,
            unique_id: item.unique_id,
            item_name: item.item_name,
            description: item.description,
            category: item.category,
            last_known_location: item.last_known_location,
            date_lost: item.date_lost,
            image_path: item.image_path,
            status: item.status,
            created_at: item.createdAt,
            updated_at: item.updatedAt
        }));

        res.json(transformedItems);
    } catch (error) {
        console.error('Get my lost items error:', error);
        res.status(500).json({ error: 'Failed to fetch your lost items' });
    }
});

// Get specific lost item
router.get('/lost/:id', async (req, res) => {
    try {
        const item = await LostItem.findById(req.params.id)
            .populate('user_id', 'full_name email phone_number whatsapp_number');

        if (!item) {
            return res.status(404).json({ error: 'Lost item not found' });
        }

        const transformedItem = {
            id: item._id,
            unique_id: item.unique_id,
            user_id: item.user_id._id,
            item_name: item.item_name,
            description: item.description,
            category: item.category,
            last_known_location: item.last_known_location,
            date_lost: item.date_lost,
            image_path: item.image_path,
            status: item.status,
            created_at: item.createdAt,
            updated_at: item.updatedAt,
            full_name: item.user_id.full_name,
            email: item.user_id.email,
            phone_number: item.user_id.phone_number,
            whatsapp_number: item.user_id.whatsapp_number
        };

        res.json(transformedItem);
    } catch (error) {
        console.error('Get lost item error:', error);
        res.status(500).json({ error: 'Failed to fetch lost item' });
    }
});

// Update lost item
router.put('/lost/:id', authMiddleware, upload.single('image'), async (req, res) => {
    try {
        const { itemName, description, category, lastKnownLocation, dateLost } = req.body;

        const item = await LostItem.findById(req.params.id);
        if (!item || item.user_id.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const updateData = {
            item_name: itemName,
            description,
            category,
            last_known_location: lastKnownLocation,
            date_lost: dateLost
        };

        if (req.file) {
            updateData.image_path = req.file.path;
        }

        await LostItem.findByIdAndUpdate(req.params.id, updateData);

        res.json({ message: 'Lost item updated successfully' });
    } catch (error) {
        console.error('Update lost item error:', error);
        res.status(500).json({ error: 'Failed to update lost item' });
    }
});

// Mark as recovered
router.patch('/lost/:id/recover', authMiddleware, async (req, res) => {
    try {
        const item = await LostItem.findById(req.params.id);
        if (!item || item.user_id.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        await LostItem.findByIdAndUpdate(req.params.id, { status: 'recovered' });

        res.json({ message: 'Item marked as recovered' });
    } catch (error) {
        console.error('Mark recovered error:', error);
        res.status(500).json({ error: 'Failed to mark item as recovered' });
    }
});

// Delete lost item
router.delete('/lost/:id', authMiddleware, async (req, res) => {
    try {
        const item = await LostItem.findById(req.params.id);
        if (!item || item.user_id.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        // Log deletion
        await logActivity({
            userId: req.user.id,
            actionType: 'delete_item',
            itemType: 'lost',
            itemId: req.params.id,
            itemUniqueId: item.unique_id,
            itemName: item.item_name,
            description: `User deleted own item`
        });

        await LostItem.findByIdAndDelete(req.params.id);

        res.json({ message: 'Lost item deleted successfully' });
    } catch (error) {
        console.error('Delete lost item error:', error);
        res.status(500).json({ error: 'Failed to delete lost item' });
    }
});

// ===== FOUND ITEMS =====

// Create found item
router.post('/found', authMiddleware, upload.single('image'), async (req, res) => {
    try {
        const { itemName, description, category, locationFound, dateFound } = req.body;
        const imagePath = req.file ? req.file.path : null;

        // Generate unique ID
        const uniqueId = await generateUniqueId('found');

        const foundItem = await FoundItem.create({
            unique_id: uniqueId,
            user_id: req.user.id,
            item_name: itemName,
            description,
            category,
            location_found: locationFound,
            date_found: dateFound,
            image_path: imagePath
        });

        // Log item creation
        await logActivity({
            userId: req.user.id,
            actionType: 'create_item',
            itemType: 'found',
            itemId: foundItem._id.toString(),
            itemUniqueId: uniqueId,
            itemName: itemName,
            description: `User created found item report`,
            metadata: { category, location: locationFound, date: dateFound }
        });

        // Check for matches asynchronously
        checkForMatches(foundItem, 'found');

        res.status(201).json({
            message: 'Found item reported successfully',
            itemId: foundItem._id,
            uniqueId: uniqueId
        });
    } catch (error) {
        console.error('Create found item error:', error);
        res.status(500).json({ error: 'Failed to create found item report' });
    }
});

// Get all found items (with filters)
router.get('/found', async (req, res) => {
    try {
        const { keyword, category, location, dateFrom, dateTo, sort } = req.query;

        let query = { status: 'active' };

        if (keyword) {
            query.$or = [
                { item_name: { $regex: keyword, $options: 'i' } },
                { description: { $regex: keyword, $options: 'i' } }
            ];
        }

        if (category) {
            query.category = category;
        }

        if (location) {
            query.location_found = { $regex: location, $options: 'i' };
        }

        if (dateFrom || dateTo) {
            query.date_found = {};
            if (dateFrom) query.date_found.$gte = new Date(dateFrom);
            if (dateTo) query.date_found.$lte = new Date(dateTo);
        }

        const sortOrder = sort === 'oldest' ? 1 : -1;

        const items = await FoundItem.find(query)
            .populate('user_id', 'full_name email status')
            .sort({ createdAt: sortOrder });

        // Filter out posts from banned users (unless requester is admin)
        const token = req.headers.authorization?.split(' ')[1];
        let isAdmin = false;

        if (token) {
            try {
                const jwt = await import('jsonwebtoken');
                const decoded = jwt.default.verify(token, process.env.JWT_SECRET);
                isAdmin = decoded.role === 'admin';
            } catch (err) {
                // Token invalid or expired, treat as non-admin
            }
        }

        const filteredItems = isAdmin
            ? items
            : items.filter(item => item.user_id?.status === 'active');

        const transformedItems = filteredItems.map(item => ({
            id: item._id,
            unique_id: item.unique_id,
            item_name: item.item_name,
            description: item.description,
            category: item.category,
            location_found: item.location_found,
            date_found: item.date_found,
            image_path: item.image_path,
            status: item.status,
            created_at: item.createdAt,
            updated_at: item.updatedAt,
            full_name: item.user_id?.full_name,
            email: item.user_id?.email,
            user_status: item.user_id?.status
        }));

        res.json(transformedItems);
    } catch (error) {
        console.error('Get found items error:', error);
        res.status(500).json({ error: 'Failed to fetch found items' });
    }
});

// Get user's found items
router.get('/found/my', authMiddleware, async (req, res) => {
    try {
        const items = await FoundItem.find({ user_id: req.user.id })
            .sort({ createdAt: -1 });

        const transformedItems = items.map(item => ({
            id: item._id,
            unique_id: item.unique_id,
            item_name: item.item_name,
            description: item.description,
            category: item.category,
            location_found: item.location_found,
            date_found: item.date_found,
            image_path: item.image_path,
            status: item.status,
            created_at: item.createdAt,
            updated_at: item.updatedAt
        }));

        res.json(transformedItems);
    } catch (error) {
        console.error('Get my found items error:', error);
        res.status(500).json({ error: 'Failed to fetch your found items' });
    }
});

// Get specific found item
router.get('/found/:id', async (req, res) => {
    try {
        const item = await FoundItem.findById(req.params.id)
            .populate('user_id', 'full_name email phone_number whatsapp_number');

        if (!item) {
            return res.status(404).json({ error: 'Found item not found' });
        }

        const transformedItem = {
            id: item._id,
            unique_id: item.unique_id,
            user_id: item.user_id._id,
            item_name: item.item_name,
            description: item.description,
            category: item.category,
            location_found: item.location_found,
            date_found: item.date_found,
            image_path: item.image_path,
            status: item.status,
            created_at: item.createdAt,
            updated_at: item.updatedAt,
            full_name: item.user_id.full_name,
            email: item.user_id.email,
            phone_number: item.user_id.phone_number,
            whatsapp_number: item.user_id.whatsapp_number
        };

        res.json(transformedItem);
    } catch (error) {
        console.error('Get found item error:', error);
        res.status(500).json({ error: 'Failed to fetch found item' });
    }
});

// Update found item
router.put('/found/:id', authMiddleware, upload.single('image'), async (req, res) => {
    try {
        const { itemName, description, category, locationFound, dateFound } = req.body;

        const item = await FoundItem.findById(req.params.id);
        if (!item || item.user_id.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const updateData = {
            item_name: itemName,
            description,
            category,
            location_found: locationFound,
            date_found: dateFound
        };

        if (req.file) {
            updateData.image_path = req.file.path;
        }

        await FoundItem.findByIdAndUpdate(req.params.id, updateData);

        res.json({ message: 'Found item updated successfully' });
    } catch (error) {
        console.error('Update found item error:', error);
        res.status(500).json({ error: 'Failed to update found item' });
    }
});

// Delete found item
router.delete('/found/:id', authMiddleware, async (req, res) => {
    try {
        const item = await FoundItem.findById(req.params.id);
        if (!item || item.user_id.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        // Log deletion
        await logActivity({
            userId: req.user.id,
            actionType: 'delete_item',
            itemType: 'found',
            itemId: req.params.id,
            itemUniqueId: item.unique_id,
            itemName: item.item_name,
            description: `User deleted own item`
        });

        await FoundItem.findByIdAndDelete(req.params.id);

        res.json({ message: 'Found item deleted successfully' });
    } catch (error) {
        console.error('Delete found item error:', error);
        res.status(500).json({ error: 'Failed to delete found item' });
    }
});

// ===== INTELLIGENT MATCHING & OPTIMIZATION ENDPOINTS =====

// 1. Get matches for logged-in user (where their lost item or found item is involved)
router.get('/matches', authMiddleware, async (req, res) => {
    try {
        // Find lost and found items belonging to current user
        const myLost = await LostItem.find({ user_id: req.user.id });
        const myLostIds = myLost.map(item => item._id);

        const myFound = await FoundItem.find({ user_id: req.user.id });
        const myFoundIds = myFound.map(item => item._id);

        // Retrieve active/pending matches involving user's items
        const matches = await Match.find({
            $or: [
                { lost_item_id: { $in: myLostIds } },
                { found_item_id: { $in: myFoundIds } }
            ],
            status: 'pending'
        })
        .populate({
            path: 'lost_item_id',
            populate: { path: 'user_id', select: 'full_name email phone_number whatsapp_number' }
        })
        .populate({
            path: 'found_item_id',
            populate: { path: 'user_id', select: 'full_name email phone_number whatsapp_number' }
        });

        res.json(matches);
    } catch (error) {
        console.error('Get matches error:', error);
        res.status(500).json({ error: 'Failed to fetch matches' });
    }
});

// 2. Get overall recently reported active items for homepage feed optimization (3 lost + 3 found)
router.get('/recent', async (req, res) => {
    try {
        const lost = await LostItem.find({ status: 'active' })
            .populate('user_id', 'full_name email status')
            .sort({ createdAt: -1 })
            .limit(6);

        const found = await FoundItem.find({ status: 'active' })
            .populate('user_id', 'full_name email status')
            .sort({ createdAt: -1 })
            .limit(6);

        const lostItems = lost.map(item => ({
            id: item._id,
            unique_id: item.unique_id,
            item_name: item.item_name,
            description: item.description,
            category: item.category,
            last_known_location: item.last_known_location,
            date_lost: item.date_lost,
            image_path: item.image_path,
            status: item.status,
            created_at: item.createdAt,
            updated_at: item.updatedAt,
            full_name: item.user_id?.full_name,
            email: item.user_id?.email,
            user_status: item.user_id?.status,
            type: 'lost'
        }));

        const foundItems = found.map(item => ({
            id: item._id,
            unique_id: item.unique_id,
            item_name: item.item_name,
            description: item.description,
            category: item.category,
            location_found: item.location_found,
            date_found: item.date_found,
            image_path: item.image_path,
            status: item.status,
            created_at: item.createdAt,
            updated_at: item.updatedAt,
            full_name: item.user_id?.full_name,
            email: item.user_id?.email,
            user_status: item.user_id?.status,
            type: 'found'
        }));

        const combined = [...lostItems, ...foundItems]
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 6);

        res.json(combined);
    } catch (error) {
        console.error('Fetch recent items error:', error);
        res.status(500).json({ error: 'Failed to fetch recently reported items' });
    }
});

// 3. Get lightweight dynamic resolved activity ticker messages
router.get('/ticker', async (req, res) => {
    try {
        const resolvedLost = await LostItem.find({ status: 'recovered' })
            .sort({ updatedAt: -1 })
            .limit(3);

        const resolvedFound = await FoundItem.find({ status: 'closed' })
            .sort({ updatedAt: -1 })
            .limit(3);

        const messages = [];

        resolvedLost.forEach(item => {
            messages.push(`✨ ${item.item_name} verified & reunited at ${item.last_known_location || 'Campus'}!`);
        });

        resolvedFound.forEach(item => {
            messages.push(`✨ ${item.item_name} resolved & returned at ${item.location_found || 'Campus'}!`);
        });

        const defaults = [
            "✨ iPhone 13 Pro verified & reunited at CS Dept!",
            "✨ Leather wallet matching verified at Library!",
            "✨ AirPods Pro resolved & returned at Math Building!",
            "✨ Student ID Card match verified by Desk Team!",
            "✨ Scientific Calculator returned at Engineering Block!"
        ];

        const combinedMessages = [...messages, ...defaults].slice(0, 5);
        res.json(combinedMessages);
    } catch (error) {
        console.error('Fetch ticker error:', error);
        res.status(500).json({ error: 'Failed to fetch activity ticker' });
    }
});

// 4. Submit ownership claim verification for a found item
router.post('/found/:id/claim', authMiddleware, async (req, res) => {
    try {
        const foundItemId = req.params.id;
        const claimantId = req.user.id;
        const { studentId, proofText } = req.body;

        if (!studentId || !proofText) {
            return res.status(400).json({ error: 'Student ID and detailed proof text are required' });
        }

        const foundItem = await FoundItem.findById(foundItemId);
        if (!foundItem) {
            return res.status(404).json({ error: 'Found item not found' });
        }

        // Strict guardrail check: Finder cannot claim their own found item
        if (foundItem.user_id.toString() === claimantId.toString()) {
            return res.status(400).json({ error: 'You cannot submit an ownership claim for an item you reported as found.' });
        }

        // Prevent duplicate claims
        const existingClaim = await Claim.findOne({ found_item_id: foundItemId, claimant_id: claimantId });
        if (existingClaim) {
            return res.status(400).json({ error: 'You have already submitted a claim for this item.' });
        }

        const newClaim = await Claim.create({
            found_item_id: foundItemId,
            claimant_id: claimantId,
            student_id: studentId,
            proof_text: proofText
        });

        await logActivity({
            userId: claimantId,
            actionType: 'submit_claim',
            itemType: 'found',
            itemId: foundItemId,
            itemUniqueId: foundItem.unique_id,
            itemName: foundItem.item_name,
            description: `User filed an ownership claim`,
            metadata: { studentId }
        });

        res.status(201).json({
            message: 'Ownership claim verification submitted successfully',
            claimId: newClaim._id
        });
    } catch (error) {
        console.error('Submit claim error:', error);
        res.status(500).json({ error: 'Failed to submit ownership claim' });
    }
});

// 5. Get incoming claims submitted for found items reported by current user (strict owner check)
router.get('/claims/incoming', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        const myFoundItems = await FoundItem.find({ user_id: userId });
        const myFoundItemIds = myFoundItems.map(item => item._id);

        const claims = await Claim.find({ found_item_id: { $in: myFoundItemIds } })
            .populate('found_item_id')
            .populate('claimant_id', 'full_name email phone_number whatsapp_number');

        // Strictly verify that the logged-in user is the original finder before exposing claimant Student IDs or proof texts
        const securedClaims = claims.filter(claim => {
            return claim.found_item_id && claim.found_item_id.user_id.toString() === userId.toString();
        });

        const transformed = securedClaims.map(claim => ({
            id: claim._id,
            found_item_id: claim.found_item_id._id,
            item_name: claim.found_item_id.item_name,
            unique_id: claim.found_item_id.unique_id,
            claimant_name: claim.claimant_id?.full_name,
            claimant_email: claim.claimant_id?.email,
            claimant_phone: claim.claimant_id?.phone_number,
            claimant_whatsapp: claim.claimant_id?.whatsapp_number,
            student_id: claim.student_id, // Safely exposed only to the verified finder
            proof_text: claim.proof_text, // Safely exposed only to the verified finder
            status: claim.status,
            created_at: claim.createdAt
        }));

        res.json(transformed);
    } catch (error) {
        console.error('Get incoming claims error:', error);
        res.status(500).json({ error: 'Failed to fetch incoming claims' });
    }
});

// 6. Get claims submitted by the current user (to track status)
router.get('/claims/my', authMiddleware, async (req, res) => {
    try {
        const claims = await Claim.find({ claimant_id: req.user.id })
            .populate('found_item_id');

        const transformed = claims.map(claim => ({
            id: claim._id,
            found_item_id: claim.found_item_id?._id,
            item_name: claim.found_item_id?.item_name,
            unique_id: claim.found_item_id?.unique_id,
            location_found: claim.found_item_id?.location_found,
            status: claim.status,
            created_at: claim.createdAt
        }));

        res.json(transformed);
    } catch (error) {
        console.error('Get my claims error:', error);
        res.status(500).json({ error: 'Failed to fetch your claims' });
    }
});

// 7. Approve an ownership claim (Marks found item as closed/resolved)
router.patch('/claims/:id/approve', authMiddleware, async (req, res) => {
    try {
        const claimId = req.params.id;
        const claim = await Claim.findById(claimId).populate('found_item_id');

        if (!claim) {
            return res.status(404).json({ error: 'Claim not found' });
        }

        // Strict guardrail check: Finder who posted the FoundItem must be the one approving
        if (claim.found_item_id.user_id.toString() !== req.user.id.toString()) {
            return res.status(403).json({ error: 'Unauthorized. You are not the finder of this item.' });
        }

        // Update claim status to approved
        claim.status = 'approved';
        await claim.save();

        // Update FoundItem status to closed
        await FoundItem.findByIdAndUpdate(claim.found_item_id._id, { status: 'closed' });

        // Reject other pending claims for this same found item
        await Claim.updateMany(
            { found_item_id: claim.found_item_id._id, _id: { $ne: claimId }, status: 'pending' },
            { status: 'rejected' }
        );

        // Update matches involving this found item to resolved
        await Match.updateMany(
            { found_item_id: claim.found_item_id._id },
            { status: 'resolved' }
        );

        // Auto-recover associated lost item belonging to claimant in same category
        const matchedLostItem = await LostItem.findOne({
            user_id: claim.claimant_id,
            category: claim.found_item_id.category,
            status: 'active'
        });

        if (matchedLostItem) {
            matchedLostItem.status = 'recovered';
            await matchedLostItem.save();

            // Notify via email queue
            const lostUser = await User.findById(claim.claimant_id);
            const founderUser = await User.findById(req.user.id);
            if (lostUser && founderUser) {
                emailQueue.addToQueue({
                    type: 'item_recovered_notification',
                    lostItem: matchedLostItem,
                    foundItem: claim.found_item_id,
                    founderUser,
                    lostUser
                });
            }
        }

        await logActivity({
            userId: req.user.id,
            actionType: 'approve_claim',
            itemType: 'found',
            itemId: claim.found_item_id._id.toString(),
            itemUniqueId: claim.found_item_id.unique_id,
            itemName: claim.found_item_id.item_name,
            description: `Finder approved ownership claim for student ID ${claim.student_id}`
        });

        res.json({ message: 'Claim approved successfully and item marked as resolved.' });
    } catch (error) {
        console.error('Approve claim error:', error);
        res.status(500).json({ error: 'Failed to approve claim' });
    }
});

// 8. Reject an ownership claim
router.patch('/claims/:id/reject', authMiddleware, async (req, res) => {
    try {
        const claimId = req.params.id;
        const claim = await Claim.findById(claimId).populate('found_item_id');

        if (!claim) {
            return res.status(404).json({ error: 'Claim not found' });
        }

        // Strict guardrail check: Finder who posted the FoundItem must be the one rejecting
        if (claim.found_item_id.user_id.toString() !== req.user.id.toString()) {
            return res.status(403).json({ error: 'Unauthorized. You are not the finder of this item.' });
        }

        claim.status = 'rejected';
        await claim.save();

        await logActivity({
            userId: req.user.id,
            actionType: 'reject_claim',
            itemType: 'found',
            itemId: claim.found_item_id._id.toString(),
            itemUniqueId: claim.found_item_id.unique_id,
            itemName: claim.found_item_id.item_name,
            description: `Finder rejected claim by student ID ${claim.student_id}`
        });

        res.json({ message: 'Claim rejected.' });
    } catch (error) {
        console.error('Reject claim error:', error);
        res.status(500).json({ error: 'Failed to reject claim' });
    }
});

export default router;
