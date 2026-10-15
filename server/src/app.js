const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const mongoose = require('mongoose');

const { helmetMiddleware, apiLimiter } = require('./middleware/securityMiddleware');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Import routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const orderRoutes = require('./routes/orderRoutes');
const userRoutes = require('./routes/userRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const cartRoutes = require('./routes/cartRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const adminRoutes = require('./routes/adminRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const couponRoutes = require('./routes/couponRoutes');
const shippingRoutes = require('./routes/shippingRoutes');
const bannerRoutes = require('./routes/bannerRoutes');

const app = express();

// Security & Optimization Middlewares
app.use(helmetMiddleware);
app.use(compression()); // Gzip/Brotli payload compression for fast mobile loading
app.use('/api', apiLimiter);


// Global Middlewares
app.use(
  express.json({
    limit: '25mb',
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use(cookieParser());

// CORS — explicit allowlist, never wildcard with credentials
const buildAllowedOrigins = () => {
  const base = [
    process.env.CLIENT_URL || 'http://localhost:5173',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://thecakeera.in',
    'https://www.thecakeera.in',
    'http://thecakeera.in',
    'http://www.thecakeera.in',
    'https://api.thecakeera.in',
    'https://thecakeera.com',
    'https://www.thecakeera.com',
    'https://thecakeera.vercel.app',
  ];
  // Support comma-separated additional origins: EXTRA_CLIENT_URLS=https://a.com,https://b.com
  const extras = process.env.EXTRA_CLIENT_URLS
    ? process.env.EXTRA_CLIENT_URLS.split(',').map((u) => u.trim()).filter(Boolean)
    : [];
  return [...new Set([...base, ...extras])];
};

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., curl, Postman, same-server, uptime monitors)
      if (!origin) return callback(null, true);
      const allowedOrigins = buildAllowedOrigins();
      // Allow listed origins or any Vercel deployment (*.vercel.app)
      if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }
      callback(new Error(`CORS: Origin '${origin}' is not allowed.`));
    },
    credentials: true,
  })
);

app.buildAllowedOrigins = buildAllowedOrigins;

// Root & Health Check Endpoints
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'The Cake Era Bakery API is running',
    status: 'healthy',
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Herbal E-Commerce API is running',
    status: 'healthy',
  });
});

// Diagnostic detailed health check endpoint
app.get('/api/health', (req, res) => {
  const dbStatusMap = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting',
  };

  const dbState = mongoose.connection.readyState;

  res.status(200).json({
    success: true,
    message: 'Herbal E-Commerce API is running',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: Math.floor(process.uptime()),
    database: {
      status: dbStatusMap[dbState] || 'Unknown',
      host: mongoose.connection.host || 'N/A',
      name: mongoose.connection.name || 'N/A',
    },
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api/banners', bannerRoutes);

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

module.exports = app;
