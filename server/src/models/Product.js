const mongoose = require('mongoose');

const productImageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    alt: { type: String, default: '' },
    sortOrder: { type: Number, default: 0 },
    width: { type: Number, default: 800 },
    height: { type: Number, default: 800 },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Product name is required'], trim: true },
    slug: { type: String, required: [true, 'Product slug is required'], unique: true, lowercase: true, trim: true },
    shortDescription: { type: String, default: '' },
    description: { type: String, required: [true, 'Product description is required'] },
    brand: { type: String, default: 'Herbal Essence', trim: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: [true, 'Category is required'], index: true },
    subCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null, index: true },
    sku: { type: String, required: [true, 'SKU is required'], unique: true, uppercase: true, trim: true },

    // Pricing & Tax Classification
    mrp: { type: Number, required: [true, 'MRP is required'], min: 0 },
    sellingPrice: { type: Number, required: [true, 'Selling price is required'], min: 0 },
    costPrice: { type: Number, default: 0, min: 0, select: false }, // Internal cost price (Admin only)
    hsnCode: { type: String, trim: true, default: '' },
    gstRate: { type: Number, default: 0, min: 0, max: 28 },
    taxInclusive: { type: Boolean, default: true },

    // Inventory
    stockQuantity: { type: Number, required: true, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 5, min: 0 },
    trackInventory: { type: Boolean, default: true },

    // Media
    thumbnail: { type: String, default: '' },
    images: [productImageSchema],

    // Herbal Information
    ingredients: [{ type: String }],
    benefits: [{ type: String }],
    howToUse: { type: String, default: '' },
    nutritionalInformation: { type: String, default: '' },
    disclaimer: { type: String, default: 'Consult a healthcare practitioner before use if pregnant or taking medication.' },
    allergenInformation: { type: String, default: '' },

    // Compliance & Origin Certifications
    fssaiNumber: { type: String, default: '12723055000162', trim: true },
    countryOfOrigin: { type: String, default: 'INDIA', trim: true },

    // Botanical Anatomy & Animated Showcase
    showBotanicalShowcase: { type: Boolean, default: true },
    botanicalSubtitle: { type: String, default: 'ROOT TO FRUIT NOURISHMENT WITH', trim: true },
    botanicalTitle: { type: String, default: '', trim: true },
    botanicalAnimatedImage: { type: String, default: '', trim: true },

    // Promotional Hero Banner Slider on Product Details Page
    showPromoSlider: { type: Boolean, default: true },
    promoSliderImages: [{ type: String }],

    // SEO
    seoTitle: { type: String, default: '' },
    seoDescription: { type: String, default: '' },
    seoKeywords: [{ type: String }],

    // Status & Ratings
    isActive: { type: Boolean, default: true, index: true },
    isFeatured: { type: Boolean, default: false, index: true },
    averageRating: { type: Number, default: 5.0, min: 0, max: 5, index: true },
    reviewCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Virtual Stock Status Helper
productSchema.virtual('stockStatus').get(function () {
  if (!this.trackInventory) return 'IN_STOCK';
  if (this.stockQuantity <= 0) return 'OUT_OF_STOCK';
  if (this.stockQuantity <= this.lowStockThreshold) return 'LOW_STOCK';
  return 'IN_STOCK';
});

// Performance Compound Indexes
productSchema.index({ isActive: 1, category: 1, sellingPrice: 1 });
productSchema.index({ isActive: 1, isFeatured: 1 });
productSchema.index({ isActive: 1, createdAt: -1 });
productSchema.index({ name: 'text', description: 'text', seoKeywords: 'text' });

module.exports = mongoose.model('Product', productSchema);
