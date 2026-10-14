const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: { type: String, required: true, trim: true },
    sku: { type: String, trim: true, default: '' },
    hsnCode: { type: String, trim: true, default: '' },
    quantity: { type: Number, required: true, min: 1 },
    mrp: { type: Number, required: true, min: 0 },
    unitPrice: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    taxableValue: { type: Number, required: true, min: 0 },
    gstRate: { type: Number, default: 0, min: 0 },
    cgstAmount: { type: Number, default: 0, min: 0 },
    sgstAmount: { type: Number, default: 0, min: 0 },
    igstAmount: { type: Number, default: 0, min: 0 },
    totalTax: { type: Number, default: 0, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const sellerSnapshotSchema = new mongoose.Schema(
  {
    legalBusinessName: { type: String, required: true, trim: true },
    businessAddress: { type: String, required: true, trim: true },
    gstin: { type: String, trim: true, default: '' },
    stateCode: { type: String, trim: true, default: '27' },
    stateName: { type: String, trim: true, default: 'Maharashtra' },
    email: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const buyerSnapshotSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, default: '' },
    addressLine1: { type: String, required: true, trim: true },
    addressLine2: { type: String, trim: true, default: '' },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    country: { type: String, default: 'India' },
    stateCode: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true, index: true, uppercase: true },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      unique: true, // Prevents duplicate invoices for the same order
      index: true,
    },
    orderNumber: { type: String, required: true, index: true, uppercase: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    invoiceDate: { type: Date, default: Date.now },
    sellerSnapshot: { type: sellerSnapshotSchema, required: true },
    buyerSnapshot: { type: buyerSnapshotSchema, required: true },
    items: {
      type: [invoiceItemSchema],
      validate: {
        validator: function (val) {
          return val && val.length > 0;
        },
        message: 'Invoice must contain at least one line item.',
      },
    },
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    shippingCharge: { type: Number, default: 0, min: 0 },
    shippingTax: { type: Number, default: 0, min: 0 },
    taxableValue: { type: Number, required: true, min: 0 },
    cgstTotal: { type: Number, default: 0, min: 0 },
    sgstTotal: { type: Number, default: 0, min: 0 },
    igstTotal: { type: Number, default: 0, min: 0 },
    totalTax: { type: Number, default: 0, min: 0 },
    grandTotal: { type: Number, required: true, min: 0 },
    isIntraState: { type: Boolean, default: true },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: ['ISSUED', 'CANCELLED'],
      default: 'ISSUED',
      index: true,
    },
  },
  { timestamps: true }
);

invoiceSchema.index({ user: 1, createdAt: -1 });
invoiceSchema.index({ invoiceDate: -1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
