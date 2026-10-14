const mongoose = require('mongoose');

const storeSettingsSchema = new mongoose.Schema(
  {
    storeName: { type: String, default: 'Herbal E-Commerce' },
    supportEmail: { type: String, default: 'support@herbal.com' },
    supportPhone: { type: String, default: '+91 98765 43210' },
    currency: { type: String, default: '₹' },

    // Shipping Configuration
    freeShippingThreshold: { type: Number, default: 999, min: 0 },
    defaultShippingCharge: { type: Number, default: 50, min: 0 },
    codAvailable: { type: Boolean, default: true },
    prepaidAvailable: { type: Boolean, default: true },
    minOrderValue: { type: Number, default: 0, min: 0 },
    maxOrderValue: { type: Number, default: 100000, min: 0 },
    estimatedDispatchDays: { type: Number, default: 1, min: 0 },
    estimatedDeliveryDays: { type: Number, default: 4, min: 0 },
    shippingActive: { type: Boolean, default: true },
    serviceablePincodes: [{ type: String, trim: true }], // empty means all valid Indian pincodes
    excludedPincodes: [{ type: String, trim: true }],
    shippingZones: [
      {
        zoneName: { type: String, required: true, trim: true },
        pincodes: [{ type: String, trim: true }],
        shippingCharge: { type: Number, default: 50, min: 0 },
        freeShippingThreshold: { type: Number, default: 999, min: 0 },
        estimatedDays: { type: Number, default: 4, min: 0 },
        codAvailable: { type: Boolean, default: true },
        isActive: { type: Boolean, default: true },
      },
    ],

    // GST & Tax Configuration
    taxRate: { type: Number, default: 0.00, min: 0 },
    legalBusinessName: { type: String, default: 'Herbal Essence Private Limited', trim: true },
    businessAddress: {
      addressLine1: { type: String, default: 'Plot 42, Herbal Knowledge Park', trim: true },
      addressLine2: { type: String, default: 'MIDC Industrial Area', trim: true },
      city: { type: String, default: 'Mumbai', trim: true },
      state: { type: String, default: 'Maharashtra', trim: true },
      stateCode: { type: String, default: '27', trim: true },
      pincode: { type: String, default: '400093', trim: true },
      country: { type: String, default: 'India', trim: true },
    },
    gstin: { type: String, default: '', trim: true, uppercase: true },
    stateCode: { type: String, default: '27', trim: true },
    stateName: { type: String, default: 'Maharashtra', trim: true },
    invoicePrefix: { type: String, default: 'INV', trim: true, uppercase: true },
    invoiceContactPhone: { type: String, default: '+91 98765 43210', trim: true },
    invoiceContactEmail: { type: String, default: 'billing@herbal.com', trim: true },
    pricesIncludeTax: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('StoreSettings', storeSettingsSchema);

