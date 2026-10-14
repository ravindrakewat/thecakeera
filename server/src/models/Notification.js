const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: [
        'ORDER_PLACED',
        'PAYMENT_SUCCESS',
        'PAYMENT_FAILED',
        'ORDER_CONFIRMED',
        'ORDER_PROCESSING',
        'ORDER_PACKED',
        'ORDER_SHIPPED',
        'SHIPMENT_TRACKING',
        'SHIPMENT_EXCEPTION',
        'ORDER_DELIVERED',
        'ORDER_CANCELLED',
        'COUPON',
        'PROMOTION',
        'SYSTEM',
        'order',
        'system',
        'promotion',
      ],
      default: 'SYSTEM',
      index: true,
    },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', index: true },
    orderNumber: { type: String, trim: true, default: '' },
    referenceId: { type: String, index: true },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ user: 1, referenceId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Notification', notificationSchema);
