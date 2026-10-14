const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
    userAgent: { type: String, default: '' },
    ipAddress: { type: String, default: '' },
    isRevoked: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

sessionSchema.index({ user: 1, isRevoked: 1 });

module.exports = mongoose.model('Session', sessionSchema);
