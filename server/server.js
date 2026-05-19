// Load environment variables FIRST before any other imports
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dotenvResult = dotenv.config({ path: join(__dirname, '../.env') });
console.log('🔍 Dotenv loading result:', dotenvResult);
console.log('🔍 Process CWD:', process.cwd());
console.log('🔍 CLOUDINARY_CLOUD_NAME from process.env:', process.env.CLOUDINARY_CLOUD_NAME);

// Now import everything else
import express from 'express';
import cors from 'cors';
import connectDB from './database/db.js';

// Import routes
import authRoutes from './routes/auth.routes.js';
import itemsRoutes from './routes/items.routes.js';
import userRoutes from './routes/user.routes.js';
import adminRoutes from './routes/admin.routes.js';
import adminActivityRoutes from './routes/admin-activity.routes.js';

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running locally on port ${PORT}`);
    });
}

// CRITICAL MATCH: This must match the import in your api/index.js
export default app;

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*'
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemsRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/activity-logs', adminActivityRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Lost and Found API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start server conditionally (only if not on Vercel)
if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`📁 Uploads directory: ${join(__dirname, 'uploads')}`);
    });
}

export default app;
