// 1. Load environment variables conditionally
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Only search for a physical file if we are running locally (NOT on Vercel)
if (!process.env.VERCEL) {
    dotenv.config({ path: join(__dirname, '../.env') });
}

// 2. Import standard dependencies
import express from 'express';
import cors from 'cors';
import connectDB from './database/db.js';

// 3. Import backend routing engines
import authRoutes from './routes/auth.routes.js';
import itemsRoutes from './routes/items.routes.js';
import userRoutes from './routes/user.routes.js';
import adminRoutes from './routes/admin.routes.js';
import adminActivityRoutes from './routes/admin-activity.routes.js';

// Initialize App and Connect to MongoDB Cluster
const app = express();
connectDB();

// 4. Register Global Middlewares (Must be declared before routes)
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*'
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded static local files
app.use('/uploads', express.static(join(__dirname, 'uploads')));

// 5. Mount Active API Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/items', itemsRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/activity-logs', adminActivityRoutes);

// Base API Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Lost and Found API is running smoothly' });
});

// 6. Global Catch-All Error Handler
app.use((err, req, res, next) => {
    console.error('Captured App Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error'
    });
});

// 404 Route Fallback
app.use((req, res) => {
    res.status(404).json({ error: 'Requested route not found on server' });
});

// 7. Start Server Listener ONLY when running locally (Not on Vercel serverless)
if (!process.env.VERCEL) {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`🚀 Server running locally on http://localhost:${PORT}`);
    });
}

// 8. CRITICAL MOUNT EXPORT: Feeds the server context directly to api/index.js
export default app;