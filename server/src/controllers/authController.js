const crypto = require('crypto');
const { User, Session } = require('../models');
const { sendSuccess } = require('../utils/apiResponse');
const ApiError = require('../utils/ApiError');
const {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  setRefreshCookie,
  clearRefreshCookie,
} = require('../utils/authUtils');

// @desc Register User
// @route POST /api/auth/register
const registerUser = async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      throw new ApiError(400, 'An account with this email address already exists');
    }

    const user = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      password,
    });

    // Generate tokens & session
    const accessToken = generateAccessToken(user);
    const rawRefreshToken = generateRefreshToken();
    const tokenHash = hashToken(rawRefreshToken);

    await Session.create({
      user: user._id,
      tokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      userAgent: req.headers['user-agent'] || '',
      ipAddress: req.ip || '',
    });

    setRefreshCookie(res, rawRefreshToken);

    return sendSuccess(res, 201, 'User registered successfully', {
      user: user.toSafeObject(),
      accessToken,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Login User
// @route POST /api/auth/login
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    // Select password explicitly since default select is false
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      throw new ApiError(401, 'Invalid email or password');
    }

    if (user.isActive === false) {
      throw new ApiError(401, 'Account has been deactivated. Please contact support.');
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      throw new ApiError(401, 'Invalid email or password');
    }

    const accessToken = generateAccessToken(user);
    const rawRefreshToken = generateRefreshToken();
    const tokenHash = hashToken(rawRefreshToken);

    await Session.create({
      user: user._id,
      tokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      userAgent: req.headers['user-agent'] || '',
      ipAddress: req.ip || '',
    });

    setRefreshCookie(res, rawRefreshToken);

    return sendSuccess(res, 200, 'Login successful', {
      user: user.toSafeObject(),
      accessToken,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Refresh Access Token
// @route POST /api/auth/refresh
const refreshTokenHandler = async (req, res, next) => {
  try {
    const rawRefreshToken = req.cookies.refreshToken || req.headers['x-refresh-token'];
    if (!rawRefreshToken) {
      throw new ApiError(401, 'Refresh token missing');
    }

    const tokenHash = hashToken(rawRefreshToken);
    const now = new Date();

    // Atomic claim: atomically find, validate unexpired, and revoke in a single atomic operation
    const session = await Session.findOneAndUpdate(
      {
        tokenHash,
        isRevoked: false,
        expiresAt: { $gt: now },
      },
      {
        $set: { isRevoked: true },
      },
      { new: false }
    );

    if (!session) {
      clearRefreshCookie(res);
      throw new ApiError(401, 'Refresh token expired or revoked');
    }

    const user = await User.findById(session.user);
    if (!user || user.isActive === false) {
      clearRefreshCookie(res);
      throw new ApiError(401, 'User account invalid or inactive');
    }

    // Token Rotation: issue replacement tokens
    const newAccessToken = generateAccessToken(user);
    const newRawRefreshToken = generateRefreshToken();
    const newTokenHash = hashToken(newRawRefreshToken);

    await Session.create({
      user: user._id,
      tokenHash: newTokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      userAgent: req.headers['user-agent'] || '',
      ipAddress: req.ip || '',
    });

    setRefreshCookie(res, newRawRefreshToken);

    return sendSuccess(res, 200, 'Token refreshed successfully', {
      accessToken: newAccessToken,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get Authenticated User
// @route GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    return sendSuccess(res, 200, 'Current user profile fetched', {
      user: req.user.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};

// @desc Logout User
// @route POST /api/auth/logout
const logoutUser = async (req, res, next) => {
  try {
    const rawRefreshToken = req.cookies.refreshToken || req.headers['x-refresh-token'];
    if (rawRefreshToken) {
      const tokenHash = hashToken(rawRefreshToken);
      await Session.findOneAndUpdate({ tokenHash }, { isRevoked: true });
    }

    clearRefreshCookie(res);

    return sendSuccess(res, 200, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

// @desc Forgot Password
// @route POST /api/auth/forgot-password
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });
    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenHash = hashToken(resetToken);
      const minutes = parseInt(process.env.PASSWORD_RESET_EXPIRES_MINUTES) || 20;

      user.passwordResetTokenHash = resetTokenHash;
      user.passwordResetExpiresAt = new Date(Date.now() + minutes * 60 * 1000);
      await user.save();

      // In production, send via Email service. For API testing environment, include resetToken in response.
      return sendSuccess(res, 200, 'If the account exists, password reset instructions have been sent.', {
        resetToken: process.env.NODE_ENV === 'production' ? undefined : resetToken,
      });
    }

    // Generic account enumeration protection response
    return sendSuccess(res, 200, 'If the account exists, password reset instructions have been sent.');
  } catch (error) {
    next(error);
  }
};

// @desc Reset Password
// @route POST /api/auth/reset-password
const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const resetTokenHash = hashToken(token);

    const user = await User.findOne({
      passwordResetTokenHash: resetTokenHash,
      passwordResetExpiresAt: { $gt: new Date() },
    }).select('+passwordResetTokenHash +passwordResetExpiresAt');

    if (!user) {
      throw new ApiError(400, 'Invalid or expired password reset token');
    }

    user.password = password;
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpiresAt = undefined;
    await user.save();

    // Invalidate all active refresh sessions for security
    await Session.updateMany({ user: user._id }, { isRevoked: true });

    return sendSuccess(res, 200, 'Password has been reset successfully. Please log in with your new password.');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  refreshTokenHandler,
  getMe,
  logoutUser,
  forgotPassword,
  resetPassword,
};
