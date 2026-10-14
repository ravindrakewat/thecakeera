const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const { User, Category, Product, Banner, Coupon } = require('../models');

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/herbal_ecommerce';
    console.log(`[Seed] Connecting to MongoDB: ${mongoUri}`);
    await mongoose.connect(mongoUri);

    console.log('[Seed] Clearing existing collections...');
    await User.deleteMany();
    await Category.deleteMany();
    await Product.deleteMany();
    await Banner.deleteMany();
    await Coupon.deleteMany();

    console.log('[Seed] Seeding Users...');
    await User.create({
      name: 'Herbal Admin',
      email: 'admin@herbal.com',
      password: 'adminpassword123',
      role: 'admin',
      isVerified: true,
    });

    await User.create({
      name: 'Organic Customer',
      email: 'customer@herbal.com',
      password: 'customerpassword123',
      role: 'user',
      isVerified: true,
    });

    console.log('[Seed] Seeding Categories...');
    const categories = await Category.insertMany([
      {
        name: 'Herbal Teas',
        slug: 'herbal-teas',
        description: 'Organic handpicked loose herbal tea infusions for relaxation & immunity.',
        image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?q=80&w=800',
      },
      {
        name: 'Ayurvedic Supplements',
        slug: 'ayurvedic-supplements',
        description: 'Traditional Ayurvedic churnas, capsules, and pure botanical extracts.',
        image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?q=80&w=800',
      },
      {
        name: 'Essential Oils',
        slug: 'essential-oils',
        description: '100% Pure steam-distilled aromatic plant & flower essential oils.',
        image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?q=80&w=800',
      },
      {
        name: 'Organic Skincare',
        slug: 'organic-skincare',
        description: 'Chemical-free herbal facial serums, ubtans, and botanical moisturizers.',
        image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=800',
      },
    ]);

    console.log('[Seed] Seeding Products...');
    await Product.insertMany([
      {
        name: 'Pure Himalayan Ashwagandha Extract',
        sku: 'HERB-ASHWA-001',
        slug: 'pure-himalayan-ashwagandha-extract',
        description: 'Premium organic Ashwagandha (Withania somnifera) root powder for stress relief and vitality.',
        benefits: ['Reduces Stress & Anxiety', 'Enhances Stamina & Muscle Recovery', 'Supports Immune Health'],
        ingredients: ['100% Organic Ashwagandha Root Extract (KSM-66 grade)'],
        usageInstructions: 'Take 1 teaspoon (3g) daily with warm milk or honey water before sleep.',
        price: 499,
        originalPrice: 699,
        category: categories[1]._id,
        stock: 50,
        images: ['https://images.unsplash.com/photo-1615485290382-441e4d049cb5?q=80&w=800'],
        isFeatured: true,
        rating: 4.9,
        numReviews: 38,
        tags: ['ashwagandha', 'ayurveda', 'stress relief', 'energy'],
      },
      {
        name: 'Chamomile & Tulsi Sleep Tea',
        sku: 'HERB-TEA-002',
        slug: 'chamomile-tulsi-sleep-tea',
        description: 'Soothing blend of Egyptian Chamomile flowers and Holy Basil (Tulsi) for deep, restful sleep.',
        benefits: ['Promotes Peaceful Sleep', 'Calms Nervous System', 'Supports Digestion'],
        ingredients: ['Organic Chamomile Flowers', 'Krishna Tulsi', 'Vana Tulsi', 'Lavender Buds'],
        usageInstructions: 'Steep 1 tea bag or 2g in boiling water for 5 minutes.',
        price: 349,
        originalPrice: 450,
        category: categories[0]._id,
        stock: 100,
        images: ['https://images.unsplash.com/photo-1576092768241-dec231879fc3?q=80&w=800'],
        isFeatured: true,
        rating: 4.8,
        numReviews: 24,
        tags: ['tea', 'chamomile', 'sleep', 'tulsi'],
      },
      {
        name: 'Wild Lavender Therapeutic Essential Oil',
        sku: 'HERB-OIL-003',
        slug: 'wild-lavender-therapeutic-essential-oil',
        description: '100% Pure steam-distilled Lavandula angustifolia essential oil for aromatherapy and skin calming.',
        benefits: ['Aromatherapy Relaxation', 'Soothes Minor Skin Irritations', 'Natural Room Fragrance'],
        ingredients: ['100% Pure Steam-Distilled Lavender Essential Oil'],
        usageInstructions: 'Add 3-5 drops to an oil diffuser or mix with a carrier oil for skin application.',
        price: 599,
        originalPrice: 799,
        category: categories[2]._id,
        stock: 30,
        images: ['https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?q=80&w=800'],
        isFeatured: true,
        rating: 5.0,
        numReviews: 15,
        tags: ['essential oil', 'lavender', 'aromatherapy'],
      },
      {
        name: 'Kumkumadi Radiance Facial Glow Oil',
        sku: 'HERB-SKIN-004',
        slug: 'kumkumadi-radiance-facial-glow-oil',
        description: 'Authentic 26-herb Ayurvedic formulation infused with Kashmiri Saffron for radiant, even-toned skin.',
        benefits: ['Restores Natural Radiance', 'Reduces Hyperpigmentation', 'Deeply Hydrates'],
        ingredients: ['Saffron (Kumkuma)', 'Sandalwood (Chandana)', 'Manjistha', 'Sesame Oil Base'],
        usageInstructions: 'Apply 3-4 drops on cleansed face and massage gently in upward circular motions.',
        price: 1299,
        originalPrice: 1699,
        category: categories[3]._id,
        stock: 25,
        images: ['https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=800'],
        isFeatured: true,
        rating: 4.9,
        numReviews: 42,
        tags: ['kumkumadi', 'skincare', 'saffron', 'face oil'],
      },
    ]);

    console.log('[Seed] Seeding Banners...');
    await Banner.insertMany([
      {
        title: 'Nurture Your Soul with Pure Herbal Wisdom',
        subtitle: 'Hand-picked organic herbs sourced sustainably from Himalayan farms.',
        imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=1200',
        linkUrl: '/shop',
        position: 1,
        isActive: true,
      },
    ]);

    console.log('[Seed] Seeding Coupons...');
    await Coupon.insertMany([
      {
        code: 'HERBAL10',
        discountType: 'percentage',
        discountAmount: 10,
        minPurchaseAmount: 499,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        isActive: true,
      },
    ]);

    console.log('✅ [Seed] Database seeded successfully!');
    console.log(`   Admin User: admin@herbal.com / adminpassword123`);
    console.log(`   Sample User: customer@herbal.com / customerpassword123`);
    process.exit(0);
  } catch (error) {
    console.error('❌ [Seed Error]', error);
    process.exit(1);
  }
};

seedDatabase();
