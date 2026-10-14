const mongoose = require('mongoose');

const trackingEventSchema = new mongoose.Schema(
  {
    timestamp: { type: Date, default: Date.now },
    status: { type: String, required: true, trim: true },
    location: { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const shipmentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      unique: true, // Prevents duplicate shipments for the same order
      index: true,
    },
    orderNumber: { type: String, required: true, index: true, uppercase: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    shipmentNumber: { type: String, required: true, unique: true, index: true, uppercase: true },
    carrier: { type: String, default: 'Manual Delivery', trim: true },
    provider: {
      type: String,
      enum: ['MANUAL', 'SHIPROCKET', 'DELHIVERY'],
      default: 'MANUAL',
    },
    providerShipmentId: { type: String, default: '', trim: true },
    awbNumber: { type: String, default: '', trim: true, index: true },
    trackingUrl: {
      type: String,
      default: '',
      trim: true,
      validate: {
        validator: function (v) {
          if (!v || v.trim() === '') return true;
          try {
            const parsed = new URL(v.trim());
            return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && Boolean(parsed.hostname);
          } catch (_) {
            return false;
          }
        },
        message: 'Invalid tracking URL scheme: only absolute http:// and https:// URLs are permitted.',
      },
    },
    shipmentStatus: {
      type: String,
      enum: [
        'PENDING',
        'PACKED',
        'DISPATCHED',
        'SHIPPED',
        'IN_TRANSIT',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'FAILED',
        'CANCELLED',
      ],
      default: 'PENDING',
      index: true,
    },
    shippedAt: { type: Date },
    estimatedDeliveryAt: { type: Date },
    deliveredAt: { type: Date },
    trackingEvents: [trackingEventSchema],
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

// High-performance compound indexes
shipmentSchema.index({ user: 1, createdAt: -1 });
shipmentSchema.index({ shipmentStatus: 1, createdAt: -1 });

module.exports = mongoose.model('Shipment', shipmentSchema);
