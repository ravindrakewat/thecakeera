const mongoose = require('mongoose');

let memoryServer = null;

/**
 * Sanitizes a MongoDB URI for safe logging — strips credentials.
 * Input:  mongodb+srv://user:pass@host/db
 * Output: mongodb+srv://[credentials]@host/db
 */
const sanitizeUri = (uri) => {
  try {
    return uri.replace(/:\/\/[^@]+@/, '://[credentials]@');
  } catch (_) {
    return '[uri redacted]';
  }
};

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/herbal_ecommerce';
  const isProd = process.env.NODE_ENV === 'production';

  // In production, never seed automatically — require explicit opt-in
  const { seedIfEmpty } = isProd
    ? { seedIfEmpty: () => Promise.resolve() }
    : require('../utils/autoSeed');

  try {
    console.log('[Database] Connecting to MongoDB...');
    const dbName = process.env.MONGO_DB_NAME || 'herbal_ecommerce';
    const conn = await mongoose.connect(uri, {
      dbName,
      serverSelectionTimeoutMS: 5000,
    });
    // Never log the host in a way that reveals credentials
    const safeHost = conn.connection.host ? conn.connection.host.split('.')[0] + '.***' : 'connected';
    console.log(`[Database] MongoDB Connected: ${safeHost} / ${conn.connection.name}`);

    if (!isProd) {
      await seedIfEmpty();
    }

    return conn;
  } catch (error) {
    // Sanitize error message — Atlas errors often echo the URI
    const safeMsg = error.message
      ? error.message.replace(/:\/\/[^@]+@/, '://[credentials]@')
      : 'Connection failed';

    console.warn(`[Database Warning] Could not connect to remote MongoDB: ${safeMsg}`);

    if (isProd) {
      console.error('[Database Error] Production startup cannot continue without a database connection. Exiting.');
      process.exit(1);
    }

    // Development-only: fall back to in-memory MongoDB
    try {
      console.log('[Database] Starting local in-memory MongoDB instance for development...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      memoryServer = await MongoMemoryServer.create();
      const memUri = memoryServer.getUri();
      const conn = await mongoose.connect(memUri);
      console.log('[Database] Connected to In-Memory MongoDB (development fallback)');
      const { seedIfEmpty: devSeed } = require('../utils/autoSeed');
      await devSeed();
      return conn;
    } catch (fallbackError) {
      console.error(`[Database Error] In-memory database also failed: ${fallbackError.message}`);
      process.exit(1);
    }
  }
};

/**
 * Disconnect from MongoDB and stop in-memory server if running.
 */
const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (memoryServer) {
      await memoryServer.stop();
      memoryServer = null;
    }
    console.log('[Database] Disconnected cleanly.');
  } catch (err) {
    console.error('[Database] Error during disconnect:', err.message);
  }
};

connectDB.connectDB = connectDB;
connectDB.disconnectDB = disconnectDB;

module.exports = connectDB;
