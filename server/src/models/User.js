const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: [true, 'First name is required'], trim: true },
    lastName: { type: String, required: [true, 'Last name is required'], trim: true },
    name: { type: String, trim: true },
    email: { 
      type: String, 
      required: [true, 'Email is required'], 
      unique: true, 
      lowercase: true, 
      trim: true,
    },
    password: { type: String, required: [true, 'Password is required'], minlength: 8, select: false },
    phone: { type: String, required: [true, 'Phone number is required'], trim: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user', index: true },
    avatar: { type: String, default: '' },
    isActive: { type: Boolean, default: true, index: true },
    isVerified: { type: Boolean, default: false },
    passwordResetTokenHash: { type: String, select: false },
    passwordResetExpiresAt: { type: Date, select: false },
  },
  { timestamps: true }
);

userSchema.index({ role: 1, createdAt: -1 });

// Synchronize full name pre-save
userSchema.pre('save', async function (next) {
  this.name = `${this.firstName || ''} ${this.lastName || ''}`.trim();
  
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Safe user JSON formatter (omits password, hashes, and internal keys)
userSchema.methods.toSafeObject = function () {
  return {
    id: this._id,
    firstName: this.firstName,
    lastName: this.lastName,
    name: this.name,
    email: this.email,
    phone: this.phone,
    role: this.role,
    avatar: this.avatar,
    isActive: this.isActive,
    isVerified: this.isVerified,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
