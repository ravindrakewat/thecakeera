const jwt = require('jsonwebtoken');
const crypto = require('crypto');

/**
 * Retrieve validated JWT Secret with strict production enforcement
 */
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (secret && secret.trim().length > 0) {
    if (process.env.NODE_ENV === 'production' && secret.trim().length < 32) {
      throw new Error('[Security Fatal] Production JWT_SECRET must be at least 32 characters long.');
    }
    return secret.trim();
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('[Security Fatal] Production startup blocked: JWT_SECRET environment variable is missing.');
  }

  // Safe isolated fallback for local test/dev environments only
  return 'herbal_jwt_dev_test_secret_key_isolated_2026';
};

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
};

const generateRefreshToken = () => {
  return crypto.randomBytes(40).toString('hex');
};

const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

const setRefreshCookie = (res, refreshToken) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/api/auth',
  });
};

const clearRefreshCookie = (res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('refreshToken', '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    expires: new Date(0),
    path: '/api/auth',
  });
};

module.exports = {
  getJwtSecret,
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  setRefreshCookie,
  clearRefreshCookie,
};
