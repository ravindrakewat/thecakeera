const { User, Category, Product, Banner, Coupon } = require('../models');

const seedIfEmpty = async () => {
  // ── PRODUCTION SAFETY GUARD ──────────────────────────────────────────────
  // Auto-seeding of demo data and admin credentials must never run in
  // production. This function is a development/test convenience only.
  if (process.env.NODE_ENV === 'production') {
    console.warn('[AutoSeed] Skipped: auto-seeding is disabled in production.');
    return;
  }
  // ─────────────────────────────────────────────────────────────────────────
  try {
    const categoryCount = await Category.countDocuments();
    if (categoryCount > 0) {
      return;
    }

    console.log('[AutoSeed] Database is empty. Seeding initial data...');

    await User.create({
      firstName: 'Herbal',
      lastName: 'Admin',
      name: 'Herbal Admin',
      email: 'admin@herbal.com',
      phone: '9876543210',
      password: 'AdminPassword123',
      role: 'admin',
      isVerified: true,
    });

    await User.create({
      firstName: 'Organic',
      lastName: 'Customer',
      name: 'Organic Customer',
      email: 'customer@herbal.com',
      phone: '9876543211',
      password: 'CustomerPassword123',
      role: 'user',
      isVerified: true,
    });

    const categories = await Category.insertMany([
      {
        name: 'Herbal Teas',
        slug: 'herbal-teas',
        description: 'Organic handpicked loose herbal tea infusions for relaxation & immunity.',
        image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?q=80&w=800',
        isActive: true,
      },
      {
        name: 'Ayurvedic Supplements',
        slug: 'ayurvedic-supplements',
        description: 'Traditional Ayurvedic churnas, capsules, and pure botanical extracts.',
        image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?q=80&w=800',
        isActive: true,
      },
      {
        name: 'Essential Oils',
        slug: 'essential-oils',
        description: '100% Pure steam-distilled aromatic plant & flower essential oils.',
        image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?q=80&w=800',
        isActive: true,
      },
      {
        name: 'Organic Skincare',
        slug: 'organic-skincare',
        description: 'Chemical-free herbal facial serums, ubtans, and botanical moisturizers.',
        image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=800',
        isActive: true,
      },
    ]);

    await Product.insertMany([
      {
        name: 'Pure Himalayan Ashwagandha Extract',
        sku: 'HERB-ASHWA-001',
        slug: 'pure-himalayan-ashwagandha-extract',
        shortDescription: 'Organic root powder for stress relief and energy.',
        description: 'Premium organic Ashwagandha (Withania somnifera) root powder for stress relief and vitality.',
        benefits: ['Reduces Stress & Anxiety', 'Enhances Stamina & Muscle Recovery', 'Supports Immune Health'],
        ingredients: ['100% Organic Ashwagandha Root Extract (KSM-66 grade)'],
        howToUse: 'Take 1 teaspoon (3g) daily with warm milk or honey water before sleep.',
        mrp: 699,
        sellingPrice: 499,
        category: categories[1]._id,
        stockQuantity: 50,
        thumbnail: '/images/ashwagandha.jpg',
        images: [
          { url: '/images/ashwagandha.jpg', alt: 'Pure Himalayan Ashwagandha Extract Jar - Studio View', sortOrder: 0, width: 800, height: 800 },
          { url: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?q=80&w=800', alt: 'Raw Organic Ashwagandha Roots & Herbal Powder', sortOrder: 1, width: 800, height: 800 }
        ],
        isFeatured: true,
        averageRating: 4.9,
        reviewCount: 38,
      },
      {
        name: 'Chamomile & Tulsi Sleep Tea',
        sku: 'HERB-TEA-002',
        slug: 'chamomile-tulsi-sleep-tea',
        shortDescription: 'Soothing organic herbal tea blend for deep sleep.',
        description: 'Soothing blend of Egyptian Chamomile flowers and Holy Basil (Tulsi) for deep, restful sleep.',
        benefits: ['Promotes Peaceful Sleep', 'Calms Nervous System', 'Supports Digestion'],
        ingredients: ['Organic Chamomile Flowers', 'Krishna Tulsi', 'Vana Tulsi', 'Lavender Buds'],
        howToUse: 'Steep 1 tea bag or 2g in boiling water for 5 minutes.',
        mrp: 450,
        sellingPrice: 349,
        category: categories[0]._id,
        stockQuantity: 100,
        thumbnail: '/images/chamomile-tea.jpg',
        images: [
          { url: '/images/chamomile-tea.jpg', alt: 'Chamomile & Tulsi Sleep Tea Eco-Pouch', sortOrder: 0, width: 800, height: 800 },
          { url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?q=80&w=800', alt: 'Freshly Brewed Chamomile Herbal Infusion', sortOrder: 1, width: 800, height: 800 }
        ],
        isFeatured: true,
        averageRating: 4.8,
        reviewCount: 24,
      },
      {
        name: 'Wild Lavender Therapeutic Essential Oil',
        sku: 'HERB-OIL-003',
        slug: 'wild-lavender-therapeutic-essential-oil',
        shortDescription: '100% Pure steam-distilled Lavender essential oil.',
        description: '100% Pure steam-distilled Lavandula angustifolia essential oil for aromatherapy and skin calming.',
        benefits: ['Aromatherapy Relaxation', 'Soothes Minor Skin Irritations', 'Natural Room Fragrance'],
        ingredients: ['100% Pure Steam-Distilled Lavender Essential Oil'],
        howToUse: 'Add 3-5 drops to an oil diffuser or mix with a carrier oil for skin application.',
        mrp: 799,
        sellingPrice: 599,
        category: categories[2]._id,
        stockQuantity: 30,
        thumbnail: '/images/lavender-oil.jpg',
        images: [
          { url: '/images/lavender-oil.jpg', alt: 'Wild Lavender Therapeutic Essential Oil Bottle', sortOrder: 0, width: 800, height: 800 },
          { url: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?q=80&w=800', alt: 'Steam-Distilled Pure Wild Lavender Botanicals', sortOrder: 1, width: 800, height: 800 }
        ],
        isFeatured: true,
        averageRating: 5.0,
        reviewCount: 15,
      },
      {
        name: 'Kumkumadi Radiance Facial Glow Oil',
        sku: 'HERB-SKIN-004',
        slug: 'kumkumadi-radiance-facial-glow-oil',
        shortDescription: 'Ayurvedic saffron formulation for glowing skin.',
        description: 'Authentic 26-herb Ayurvedic formulation infused with Kashmiri Saffron for radiant, even-toned skin.',
        benefits: ['Restores Natural Radiance', 'Reduces Hyperpigmentation', 'Deeply Hydrates'],
        ingredients: ['Saffron (Kumkuma)', 'Sandalwood (Chandana)', 'Manjistha', 'Sesame Oil Base'],
        howToUse: 'Apply 3-4 drops on cleansed face and massage gently in upward circular motions.',
        mrp: 1699,
        sellingPrice: 1299,
        category: categories[3]._id,
        stockQuantity: 25,
        thumbnail: '/images/kumkumadi-oil.jpg',
        images: [
          { url: '/images/kumkumadi-oil.jpg', alt: 'Kumkumadi Radiance Facial Glow Oil Dropper Bottle', sortOrder: 0, width: 800, height: 800 },
          { url: '/images/kumkumadi-oil-2.jpg', alt: 'Pure Kashmiri Saffron & Herbal Extracts - Botanical Macro Angle', sortOrder: 1, width: 800, height: 800 }
        ],
        isFeatured: true,
        averageRating: 4.9,
        reviewCount: 42,
      },
    ]);

    await Banner.insertMany([
      {
        title: 'Nature, thoughtfully chosen.',
        subtitle: 'Daily rituals for balance, calm and natural care.',
        imageUrl: '/images/hero-slide-1.jpg',
        linkUrl: '/shop',
        position: 1,
        isActive: true,
      },
      {
        title: 'Ayurvedic Wellness for Everyday Health',
        subtitle: 'Thoughtfully crafted herbal supplements, roots & pure elixirs.',
        imageUrl: '/images/hero-slide-2.jpg',
        linkUrl: '/category/ayurvedic-supplements',
        position: 2,
        isActive: true,
      },
      {
        title: 'Golden Elixirs & Soothing Teas',
        subtitle: 'Chamomile, holy basil and calming herbal blends for restful days.',
        imageUrl: '/images/hero-slide-3.jpg',
        linkUrl: '/category/herbal-teas',
        position: 3,
        isActive: true,
      },
    ]);

    await Coupon.insertMany([
      {
        code: 'HERBAL10',
        discountType: 'percentage',
        discountAmount: 10,
        minPurchaseAmount: 499,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
    ]);

    console.log('✅ [AutoSeed] Initial database seed completed successfully!');
  } catch (error) {
    console.error('[AutoSeed Error]', error.message);
  }
};

module.exports = { seedIfEmpty };
