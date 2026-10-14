const notificationService = require('../services/notificationService');
const { sendSuccess } = require('../utils/apiResponse');

const getUserNotifications = async (req, res, next) => {
  try {
    const { notifications, unreadCount, pagination } = await notificationService.getUserNotifications(req.user._id, req.query);
    return res.status(200).json({
      success: true,
      message: 'Notifications fetched successfully',
      data: notifications,
      unreadCount,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};

const getUnreadCount = async (req, res, next) => {
  try {
    const result = await notificationService.getUnreadCount(req.user._id);
    return sendSuccess(res, 200, 'Unread count fetched successfully', result);
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const notification = await notificationService.markAsRead(req.user._id, req.params.id);
    return sendSuccess(res, 200, 'Notification marked as read', notification);
  } catch (error) {
    next(error);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    const result = await notificationService.markAllAsRead(req.user._id);
    return sendSuccess(res, 200, result.message);
  } catch (error) {
    next(error);
  }
};

const deleteNotification = async (req, res, next) => {
  try {
    const result = await notificationService.deleteNotification(req.user._id, req.params.id);
    return sendSuccess(res, 200, result.message);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
