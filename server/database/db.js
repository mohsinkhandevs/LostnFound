import mongoose from 'mongoose';

let cachedConnection = null;
let cachedPromise = null;

const connectDB = async () => {
    // 1. If connection is already established, return it immediately
    if (mongoose.connection.readyState >= 1) {
        return mongoose.connection;
    }

    // 2. Validate environment config
    if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI environment variable is missing in process.env');
    }

    // 3. If a connection promise is in progress, reuse it
    if (cachedPromise) {
        await cachedPromise;
        return mongoose.connection;
    }

    // 4. Otherwise, establish a new connection and cache the promise
    const opts = {
        bufferCommands: false,
    };

    console.log('🔌 Connecting to MongoDB Cluster...');
    cachedPromise = mongoose.connect(process.env.MONGODB_URI, opts).then((mongooseInstance) => {
        console.log('✅ MongoDB connected successfully (cached connection)');
        return mongooseInstance;
    });

    try {
        await cachedPromise;
    } catch (error) {
        cachedPromise = null;
        console.error('❌ MongoDB connection error:', error);
        throw error;
    }

    return mongoose.connection;
};

export default connectDB;
