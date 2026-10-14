const dotenv = require('dotenv');
dotenv.config();

const app = require('./app');
const { connectDB, disconnectDB } = require('./config/db');

// ─────────────────────────────────────────────────────────────
// Fast-fail configuration validation — must run before DB connect
// ─────────────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret || jwtSecret.trim().length < 32) {
    console.error('[Security Fatal] Production startup blocked: JWT_SECRET must be set and at least 32 characters long.');
    process.exit(1);
  }
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.error('[Security Fatal] Production startup blocked: RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set.');
    process.exit(1);
  }
  if (!process.env.MONGO_URI) {
    console.error('[Config Fatal] Production startup blocked: MONGO_URI environment variable is required.');
    process.exit(1);
  }
}

const PORT = parseInt(process.env.PORT, 10) || 5000;

let server;

// ─────────────────────────────────────────────────────────────
// Graceful shutdown helper
// ─────────────────────────────────────────────────────────────
const gracefulShutdown = async (signal) => {
  console.log(`[Process] ${signal} received. Starting graceful shutdown...`);
  try {
    if (server) {
      await new Promise((resolve) => {
        server.close(resolve);
      });
      console.log('[Server] HTTP server closed.');
    }
    await disconnectDB();
    console.log('[Process] Shutdown complete.');
    process.exit(0);
  } catch (err) {
    console.error('[Process] Error during shutdown:', err.message);
    process.exit(1);
  }
};

// ─────────────────────────────────────────────────────────────
// Start server
// ─────────────────────────────────────────────────────────────
connectDB()
  .then(() => {
    server = app.listen(PORT, () => {
      console.log(
        `[Server] Herbal E-Commerce API running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`
      );
    });
  })
  .catch((err) => {
    // db.js already logs the error; just ensure process exits
    process.exit(1);
  });

// ─────────────────────────────────────────────────────────────
// Signal handlers
// ─────────────────────────────────────────────────────────────
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ─────────────────────────────────────────────────────────────
// Unhandled promise rejections — log without leaking sensitive data
// ─────────────────────────────────────────────────────────────
process.on('unhandledRejection', (reason) => {
  const message = reason instanceof Error ? reason.message : String(reason);
  console.error('[Process Error] Unhandled Promise Rejection:', message);
  // In production, exit so the process manager can restart cleanly
  if (process.env.NODE_ENV === 'production') {
    gracefulShutdown('unhandledRejection');
  }
});

// ─────────────────────────────────────────────────────────────
// Uncaught synchronous exceptions
// ─────────────────────────────────────────────────────────────
process.on('uncaughtException', (err) => {
  console.error('[Process Error] Uncaught Exception:', err.message);
  gracefulShutdown('uncaughtException');
});
