const { User, Session } = require('../models');
const { sendSuccess, sendPaginatedSuccess } = require('../utils/apiResponse');
const ApiError = require('../utils/ApiError');

// @desc Get current user profile
// @route GET /api/users/me
const getProfile = async (req, res, next) => {
  try {
    return sendSuccess(res, 200, 'User profile fetched', req.user.toSafeObject());
  } catch (error) {
    next(error);
  }
};

// @desc Update current user profile
// @route PATCH /api/users/me
const updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, phone } = req.body;
    const user = req.user;

    if (firstName) user.firstName = firstName.trim();
    if (lastName) user.lastName = lastName.trim();
    if (phone) user.phone = phone.trim();

    await user.save();

    return sendSuccess(res, 200, 'Profile updated successfully', user.toSafeObject());
  } catch (error) {
    next(error);
  }
};

// @desc Change Password
// @route PATCH /api/users/me/password
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      throw new ApiError(400, 'Current password is incorrect');
    }

    user.password = newPassword;
    await user.save();

    // Revoke other sessions
    await Session.updateMany({ user: user._id }, { isRevoked: true });

    return sendSuccess(res, 200, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};

// @desc Get all users (Admin only)
// @route GET /api/users
const getUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find()
        .select('firstName lastName name email phone role isActive createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(),
    ]);

    return sendPaginatedSuccess(res, 200, 'Users fetched successfully', users, { total, page, pages: Math.ceil(total / limit) || 1, limit });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  getUsers,
};
