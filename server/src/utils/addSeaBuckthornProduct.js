const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const Product = require('../models/Product');
const Category = require('../models/Category');

async function updateProductWithOriginalBranding() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected successfully.');

    // Find or create category
    let category = await Category.findOne({
      $or: [
        { slug: 'wellness-juices' },
        { slug: 'ayurvedic-supplements' },
        { name: /supplements/i },
      ],
    });

    if (!category) {
      category = await Category.findOne();
    }

    const productData = {
      name: 'Pure Himalayan Sea Buckthorn Juice (Pulp) 300ml',
      slug: 'sea-buckthorn-juice-pulp-300ml',
      sku: 'HERB-BUCKTHORN-001',
      brand: 'Herbal Essence',
      shortDescription: '100% Organic wild Himalayan Sea Buckthorn pulp concentrate for radiant skin, digestive health, and cellular vitality.',
      description: 'Experience the pure nutritional power of 100% Wild Himalayan Sea Buckthorn Pulp Concentrate. Harvested from wild berries flourishing in the pristine high-altitude valleys of Ladakh and the Himalayas, this extra-thick fruit concentrate delivers nature’s rarest spectrum of nutrients. Packed with exceptional levels of natural Vitamin C, potent polyphenols, and complete Omega 3, 6, 7 & 9 fatty acids. Zero added sugar, zero artificial additives, zero shortcuts. Simply dilute 10-15ml in water daily for glowing skin hydration and robust immunity.',
      mrp: 849,
      sellingPrice: 629,
      costPrice: 280,
      category: category._id,
      stockQuantity: 120,
      thumbnail: '/images/sea-buckthorn-juice.jpg',
      images: [
        {
          url: '/images/sea-buckthorn-juice.jpg',
          alt: 'Pure Himalayan Sea Buckthorn Juice Pulp 300ml Luxury Amber Bottle',
          sortOrder: 0,
          width: 1024,
          height: 1024,
        },
        {
          url: '/images/sea-buckthorn-lifestyle.jpg',
          alt: 'Dissolving Concentrated Golden Sea Buckthorn Pulp in Water Daily Routine',
          sortOrder: 1,
          width: 1024,
          height: 1024,
        },
        {
          url: '/images/sea-buckthorn-berries.jpg',
          alt: 'Freshly Harvested Organic Himalayan Wild Sea Buckthorn Superfood Berries',
          sortOrder: 2,
          width: 1024,
          height: 1024,
        },
      ],
      ingredients: [
        '100% Pure Wild Sea Buckthorn (Hippophae rhamnoides) Whole Berry Pulp',
        'Zero Added Sugar or Preservatives',
        'Natural Source of Omega 3, 6, 7 & 9',
        'Non-GMO, Vegan & Gluten-Free',
      ],
      benefits: [
        'Hydrates & Rejuvenates Skin from Within (Rich in Rare Omega-7)',
        'Potent Immune System Support (Superior Natural Vitamin C)',
        'Supports Healthy Digestion & Gut Microbiome',
        'Protects Cells with Supercharged Bioflavonoids & Antioxidants',
      ],
      howToUse: 'Dilute 10ml to 15ml (approx. 2 teaspoons) into a glass of room temperature or warm water. Stir well and consume every morning on an empty stomach for maximum absorption.',
      nutritionalInformation: 'Per 100ml: Energy: 48 kcal | Protein: 0.9g | Carbs: 6.8g (natural fruit sugars) | Fat: 2.1g | Vitamin C: 450mg | Rare Omega 7: 680mg | Total Phenolic Content: High.',
      disclaimer: 'Pure natural concentrate. Color and thickness may naturally vary across harvest batches. Shake bottle well before every use. Store in a cool dry place and refrigerate after opening.',
      seoTitle: 'Buy Pure Himalayan Sea Buckthorn Juice (Pulp) 300ml Online | Herbal Essence',
      seoDescription: 'Shop 100% pure organic Himalayan Sea Buckthorn pulp concentrate. Rich in Omega 7, Vitamin C & antioxidants for glowing skin, gut & immunity.',
      seoKeywords: ['sea buckthorn juice', 'sea buckthorn pulp 300ml', 'omega 7 juice', 'himalayan berry pulp', 'herbal essence sea buckthorn'],
      isFeatured: true,
      isActive: true,
      averageRating: 4.9,
      reviewCount: 48,
    };

    const updated = await Product.findOneAndUpdate(
      { slug: productData.slug },
      { $set: productData },
      { upsert: true, new: true, runValidators: true }
    );

    console.log('✅ Successfully updated product with 100% original, legal branding and local images!');
    console.log('Product Name:', updated.name);
    console.log('Brand:', updated.brand);
    console.log('Thumbnail:', updated.thumbnail);
    console.log('Images:', updated.images.map(img => img.url));

    await mongoose.disconnect();
    console.log('MongoDB disconnected.');
  } catch (err) {
    console.error('❌ Error updating product:', err);
    process.exit(1);
  }
}

updateProductWithOriginalBranding();
