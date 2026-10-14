const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    provider: {
      type: String,
      enum: ['RAZORPAY', 'COD'],
      default: 'RAZORPAY',
    },
    providerOrderId: { type: String, required: true, index: true },
    providerPaymentId: { type: String, default: '', index: true },
    providerSignature: { type: String, default: '' },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED', 'REFUND_PENDING'],
      default: 'PENDING',
      index: true,
    },
    method: { type: String, default: '' },
    signatureVerified: { type: Boolean, default: false },
    refundStatus: {
      type: String,
      enum: ['NONE', 'PENDING', 'PROCESSED', 'FAILED'],
      default: 'NONE',
      index: true,
    },
    refundAmount: { type: Number, default: 0 },
    refundReason: { type: String, default: '' },
    refundedAt: { type: Date },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    failureReason: { type: String, default: '' },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

paymentSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
