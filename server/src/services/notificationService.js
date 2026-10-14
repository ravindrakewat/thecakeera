const { Notification } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Helper function to create customer notifications idempotently
 */
const createNotification = async ({ user, title, message, type = 'SYSTEM', order = null, orderNumber = '', referenceId = null }) => {
  try {
    if (referenceId) {
      const existing = await Notification.findOne({ user, referenceId });
      if (existing) return existing;
    }
    return await Notification.create({
      user,
      title,
      message,
      type,
      order,
      orderNumber,
      referenceId,
    });
  } catch (error) {
    if (error.code === 11000) {
      return await Notification.findOne({ user, referenceId });
    }
    console.error('Failed to create notification:', error.message);
  }
};

/**
 * Get User Notifications (Paginated)
 */
const getUserNotifications = async (userId, queryParams = {}) => {
  const page = Math.max(1, parseInt(queryParams.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(queryParams.limit) || 20));
  const skip = (page - 1) * limit;

  const filter = { user: userId };
  if (queryParams.isRead !== undefined) {
    filter.isRead = queryParams.isRead === 'true';
  }

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .select('title message type order orderNumber referenceId isRead createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: userId, isRead: false }),
  ]);

  return {
    notifications,
    unreadCount,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1,
    },
  };
};

const getUnreadCount = async (userId) => {
  const unreadCount = await Notification.countDocuments({ user: userId, isRead: false });
  return { unreadCount };
};

const markAsRead = async (userId, notificationId) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { isRead: true },
    { new: true }
  );
  if (!notification) {
    throw new ApiError(404, 'Notification not found');
  }
  return notification;
};

const markAllAsRead = async (userId) => {
  await Notification.updateMany({ user: userId, isRead: false }, { isRead: true });
  return { message: 'All notifications marked as read' };
};

const deleteNotification = async (userId, notificationId) => {
  const notification = await Notification.findOneAndDelete({ _id: notificationId, user: userId });
  if (!notification) {
    throw new ApiError(404, 'Notification not found');
  }
  return { message: 'Notification deleted successfully' };
};

module.exports = {
  createNotification,
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
