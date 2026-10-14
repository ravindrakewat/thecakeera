const jwt = require('jsonwebtoken');
const { User } = require('../models');
const ApiError = require('../utils/ApiError');
const { getJwtSecret } = require('../utils/authUtils');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return next(new ApiError(401, 'Authentication token required'));
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return next(new ApiError(401, 'Authenticated user account no longer exists'));
    }

    if (user.isActive === false) {
      return next(new ApiError(401, 'Account has been deactivated'));
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Token expired'));
    }
    return next(new ApiError(401, 'Invalid authentication token'));
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ApiError(403, `Forbidden: Role '${req.user ? req.user.role : 'Guest'}' is not authorized`));
    }
    next();
  };
};

// Legacy shorthand admin middleware
const admin = authorizeRoles('admin');

module.exports = { protect, authorizeRoles, admin };
