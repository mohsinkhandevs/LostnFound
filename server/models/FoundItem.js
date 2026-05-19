import mongoose from 'mongoose';

const foundItemSchema = new mongoose.Schema({
    unique_id: {
        type: String,
        unique: true,
        sparse: true // Allow existing documents without this field
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    item_name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    location_found: {
        type: String,
        required: true
    },
    date_found: {
        type: Date,
        required: true
    },
    image_path: {
        type: String,
        default: null
    },
    status: {
        type: String,
        enum: ['active', 'closed'],
        default: 'active'
    }
}, {
    timestamps: true
});

// Indexes for search performance
foundItemSchema.index({ item_name: 1 });
foundItemSchema.index({ category: 1 });
foundItemSchema.index({ status: 1 });
foundItemSchema.index({ user_id: 1 });
foundItemSchema.index({ item_name: 'text', description: 'text' });

export default mongoose.model('FoundItem', foundItemSchema);
