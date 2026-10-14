const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true, trim: true },
  sku: { type: String, trim: true, default: '' },
  thumbnail: { type: String, trim: true, default: '' },
  quantity: { type: Number, required: true, min: [1, 'Quantity must be at least 1'] },
  mrp: { type: Number, required: true, min: 0 },
  sellingPrice: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  couponCode: { type: String, trim: true, default: '' },
  hsnCode: { type: String, trim: true, default: '' },
  gstRate: { type: Number, default: 0, min: 0 },
  taxInclusive: { type: Boolean, default: true },
  subtotal: { type: Number, required: true, min: 0 },
});

const addressSnapshotSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  addressLine1: { type: String, required: true, trim: true },
  addressLine2: { type: String, trim: true, default: '' },
  area: { type: String, trim: true, default: '' },
  city: { type: String, required: true, trim: true },
  state: { type: String, required: true, trim: true },
  pincode: { type: String, required: true, trim: true },
  landmark: { type: String, trim: true, default: '' },
  country: { type: String, default: 'India' },
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true, uppercase: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: {
      type: [orderItemSchema],
      validate: {
        validator: function (val) {
          return val && val.length > 0;
        },
        message: 'Order must contain at least one item.',
      },
    },
    shippingAddress: { type: addressSnapshotSchema, required: true },
    billingAddress: { type: addressSnapshotSchema },
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    shippingCharge: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    grandTotal: { type: Number, required: true, min: 0 },
    paymentMethod: {
      type: String,
      enum: ['ONLINE', 'COD'],
      default: 'ONLINE',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED', 'REFUND_PENDING'],
      default: 'PENDING',
      index: true,
    },
    orderStatus: {
      type: String,
      enum: [
        'PAYMENT_PENDING',
        'PLACED',
        'CONFIRMED',
        'PROCESSING',
        'PACKED',
        'SHIPPED',
        'DELIVERED',
        'CANCELLED',
        'OUT_OF_STOCK_PENDING_REFUND',
      ],
      default: 'PAYMENT_PENDING',
      index: true,
    },
    razorpayOrderId: { type: String, index: true, default: '' },
    idempotencyKey: { type: String, index: true, default: '' },
    placedAt: { type: Date },
    cancelledAt: { type: Date },
    cancelReason: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

// High-performance compound indexes for user orders & admin order management
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1, createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
