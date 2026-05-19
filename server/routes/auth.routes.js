import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import OTP from '../models/OTP.js';
import ActivityLog from '../models/ActivityLog.js';
import { sendOTPEmail } from '../utils/email.js';

const router = express.Router();

// Step 1: Request OTP for registration
router.post('/register/request-otp', async (req, res) => {
    try {
        const { email, fullName } = req.body;

        // Validate university email - allow multiple domains from env
        const allowedDomains = process.env.ALLOWED_DOMAINS 
            ? process.env.ALLOWED_DOMAINS.split(',').map(d => d.trim())
            : ['isb.nu.edu.pk', 'nu.edu.pk'];
        const isValidDomain = allowedDomains.some(domain => email.endsWith(domain));

        if (!isValidDomain) {
            return res.status(400).json({
                error: `Please use a valid email domain (${allowedDomains.join(', ')})`
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Delete any existing OTPs for this email
        await OTP.deleteMany({ email });

        // Save OTP with expiration from env
        const expirationMinutes = parseInt(process.env.OTP_EXPIRES_IN_MINUTES) || 5;
        const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000);
        await OTP.create({
            email,
            otp,
            expiresAt
        });

        // Send OTP email
        const emailSent = await sendOTPEmail(email, fullName, otp);

        if (!emailSent) {
            return res.status(500).json({ error: 'Failed to send OTP email. Please try again.' });
        }

        res.json({
            message: 'OTP sent to your email. Please check your inbox.',
            email
        });
    } catch (error) {
        console.error('Request OTP error:', error);
        res.status(500).json({ error: 'Failed to send OTP' });
    }
});

// Step 2: Verify OTP and complete registration
router.post('/register/verify-otp', async (req, res) => {
    try {
        const { email, otp, password, fullName, phoneNumber } = req.body;

        // Validate university email - allow multiple domains from env
        const allowedDomains = process.env.ALLOWED_DOMAINS 
            ? process.env.ALLOWED_DOMAINS.split(',').map(d => d.trim())
            : ['isb.nu.edu.pk', 'nu.edu.pk'];
        const isValidDomain = allowedDomains.some(domain => email.endsWith(domain));

        if (!isValidDomain) {
            return res.status(400).json({
                error: `Please use a valid email domain (${allowedDomains.join(', ')})`
            });
        }

        // Validate phone number
        if (!phoneNumber || phoneNumber.trim() === '') {
            return res.status(400).json({ error: 'Phone number is required' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Find OTP
        const otpRecord = await OTP.findOne({ email, otp });

        if (!otpRecord) {
            return res.status(400).json({ error: 'Invalid OTP code' });
        }

        // Check if OTP is expired
        if (new Date() > otpRecord.expiresAt) {
            await OTP.deleteOne({ _id: otpRecord._id });
            return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user
        const user = await User.create({
            email,
            password_hash: passwordHash,
            full_name: fullName,
            phone_number: phoneNumber
        });

        // Delete used OTP
        await OTP.deleteOne({ _id: otpRecord._id });

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.status(201).json({
            message: 'Registration successful',
            token,
            user: {
                id: user._id,
                email: user.email,
                fullName: user.full_name,
                phoneNumber: user.phone_number,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Test endpoint to verify email configuration
router.post('/test-email', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        // Check if email credentials are configured
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            return res.status(500).json({
                error: 'Email credentials not configured',
                details: {
                    EMAIL_USER: process.env.EMAIL_USER ? 'Set' : 'Not set',
                    EMAIL_PASS: process.env.EMAIL_PASS ? 'Set' : 'Not set'
                }
            });
        }

        // Generate test OTP
        const testOTP = '123456';

        // Try to send email
        const emailSent = await sendOTPEmail(email, 'Test User', testOTP);

        if (emailSent) {
            res.json({
                message: 'Test email sent successfully!',
                email,
                note: 'Check your inbox for the test OTP email'
            });
        } else {
            res.status(500).json({
                error: 'Failed to send test email',
                note: 'Check server logs for details'
            });
        }
    } catch (error) {
        console.error('Test email error:', error);
        res.status(500).json({
            error: 'Test email failed',
            message: error.message
        });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Check if user is banned
        if (user.status === 'banned') {
            return res.status(403).json({ error: 'Your account has been suspended' });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        // Log admin login
        if (user.role === 'admin') {
            await ActivityLog.create({
                admin_id: user._id,
                action_type: 'system',
                item_type: 'system',
                item_id: 'auth',
                description: 'Admin logged in'
            });
        }

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                email: user.email,
                fullName: user.full_name,
                role: user.role,
                phoneNumber: user.phone_number,
                whatsappNumber: user.whatsapp_number
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Forgot Password - Step 1: Request OTP
router.post('/forgot-password/request-otp', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        // Check if user exists
        const user = await User.findOne({ email: email.toLowerCase().trim() });

        if (!user) {
            // Don't reveal if email exists for security, but show helpful message
            return res.status(404).json({
                error: 'No account found with this email address. Please create an account first.',
                showRegisterLink: true
            });
        }

        // Check if user is banned
        if (user.status === 'banned') {
            return res.status(403).json({ error: 'Your account has been suspended' });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Delete any existing password reset OTPs for this email
        const PasswordReset = (await import('../models/PasswordReset.js')).default;
        await PasswordReset.deleteMany({ email: email.toLowerCase().trim() });

        // Save OTP with expiration from env
        const expirationMinutes = parseInt(process.env.OTP_EXPIRES_IN_MINUTES) || 10;
        const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000);
        await PasswordReset.create({
            email: email.toLowerCase().trim(),
            otp,
            expiresAt
        });

        // Send OTP email
        const { sendPasswordResetOTP } = await import('../utils/email.js');
        const emailSent = await sendPasswordResetOTP(email, user.full_name, otp);

        if (!emailSent) {
            return res.status(500).json({ error: 'Failed to send OTP email. Please try again.' });
        }

        res.json({
            message: 'Password reset OTP sent to your email. Please check your inbox.',
            email: email.toLowerCase().trim()
        });
    } catch (error) {
        console.error('Request password reset OTP error:', error);
        res.status(500).json({ error: 'Failed to send password reset OTP' });
    }
});

// Forgot Password - Step 2: Verify OTP
router.post('/forgot-password/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ error: 'Email and OTP are required' });
        }

        // Find OTP
        const PasswordReset = (await import('../models/PasswordReset.js')).default;
        const resetRecord = await PasswordReset.findOne({
            email: email.toLowerCase().trim(),
            otp
        });

        if (!resetRecord) {
            return res.status(400).json({ error: 'Invalid OTP code' });
        }

        // Check if OTP is expired
        if (new Date() > resetRecord.expiresAt) {
            await PasswordReset.deleteOne({ _id: resetRecord._id });
            return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
        }

        res.json({
            message: 'OTP verified successfully. You can now reset your password.',
            email: email.toLowerCase().trim()
        });
    } catch (error) {
        console.error('Verify password reset OTP error:', error);
        res.status(500).json({ error: 'OTP verification failed' });
    }
});

// Forgot Password - Step 3: Reset Password
router.post('/forgot-password/reset', async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({ error: 'Email, OTP, and new password are required' });
        }

        // Validate password strength
        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }

        // Find and verify OTP
        const PasswordReset = (await import('../models/PasswordReset.js')).default;
        const resetRecord = await PasswordReset.findOne({
            email: email.toLowerCase().trim(),
            otp
        });

        if (!resetRecord) {
            return res.status(400).json({ error: 'Invalid OTP code' });
        }

        // Check if OTP is expired
        if (new Date() > resetRecord.expiresAt) {
            await PasswordReset.deleteOne({ _id: resetRecord._id });
            return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
        }

        // Find user
        const user = await User.findOne({ email: email.toLowerCase().trim() });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Hash new password
        const passwordHash = await bcrypt.hash(newPassword, 10);

        // Update user password
        user.password_hash = passwordHash;
        await user.save();

        // Delete used OTP
        await PasswordReset.deleteOne({ _id: resetRecord._id });

        // Generate new JWT token
        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.json({
            message: 'Password reset successful. You can now login with your new password.',
            token,
            user: {
                id: user._id,
                email: user.email,
                fullName: user.full_name,
                phoneNumber: user.phone_number,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({ error: 'Password reset failed' });
    }
});

export default router;
