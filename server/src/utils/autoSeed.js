const { User, Category, Product, Banner, Coupon } = require('../models');

const seedIfEmpty = async () => {
  if (process.env.NODE_ENV === 'production') {
    console.warn('[AutoSeed] Skipped: auto-seeding is disabled in production.');
    return;
  }

  try {
    const categoryCount = await Category.countDocuments();
    if (categoryCount > 0) {
      return;
    }

    console.log('[AutoSeed] Database is empty. Seeding initial The Cake Era bakery data...');

    await User.create({
      firstName: 'Cake Era',
      lastName: 'Admin',
      name: 'The Cake Era Admin',
      email: 'admin@thecakeera.in',
      phone: '9876543210',
      password: 'AdminPassword123',
      role: 'admin',
      isVerified: true,
    });

    await User.create({
      firstName: 'Celebration',
      lastName: 'Customer',
      name: 'Celebration Customer',
      email: 'customer@thecakeera.in',
      phone: '9876543211',
      password: 'CustomerPassword123',
      role: 'user',
      isVerified: true,
    });

    const categories = await Category.insertMany([
      {
        name: 'Celebration Cakes',
        slug: 'celebration-cakes',
        description: 'Multi-layered artisanal cakes freshly crafted for birthdays, anniversaries & celebrations.',
        image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=800',
        isActive: true,
      },
      {
        name: 'Designer & Themed Cakes',
        slug: 'designer-cakes',
        description: 'Opulent double-tiered, customized floral, and edible gold luxury celebration cakes.',
        image: 'https://images.unsplash.com/photo-1535141192574-5d4897c13136?q=80&w=800',
        isActive: true,
      },
      {
        name: 'Pastries & Cupcakes',
        slug: 'pastries-cupcakes',
        description: 'Velvety cheesecakes, fluffy cupcakes, and single-serve gourmet pastry slices.',
        image: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?q=80&w=800',
        isActive: true,
      },
      {
        name: 'Artisanal Cookies',
        slug: 'cookies-biscuits',
        description: 'Crunchy oven-fresh butter cookies, loaded choco-chip bites, and almond shortbreads.',
        image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?q=80&w=800',
        isActive: true,
      },
      {
        name: 'Fresh Breads & Croissants',
        slug: 'fresh-breads',
        description: 'Parisian-style flaky butter croissants, brioche loaves, and crusty sourdough baguettes.',
        image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=800',
        isActive: true,
      },
      {
        name: 'Dessert Jars & Brownies',
        slug: 'dessert-jars-brownies',
        description: 'Fudgy walnut brownies, red velvet dessert jars, and molten lava cake pots.',
        image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?q=80&w=800',
        isActive: true,
      },
    ]);

    await Product.insertMany([
      {
        name: 'Belgian Dark Truffle Celebration Cake',
        sku: 'CAKE-TRUFFLE-001',
        slug: 'belgian-dark-truffle-celebration-cake',
        shortDescription: '54% Belgian dark chocolate ganache layered with moist sponge.',
        description: 'An indulgent, showstopper cake made with 54% authentic Belgian chocolate ganache, layered between moist dark cocoa sponge and decorated with handmade golden chocolate curls. 100% freshly baked on order.',
        brand: 'The Cake Era',
        benefits: [
          '100% Eggless Option Available',
          'Made With 54% Real Belgian Chocolate Couverture',
          'Freshly Baked On Order (Zero Old Stock)',
          'Complimentary Celebration Knife & Premium Candles'
        ],
        ingredients: ['Belgian Dark Chocolate Couverture (54%)', 'Fresh Dairy Cream', 'Unbleached Wheat Flour', 'Pure Cocoa Butter', 'Madagascar Vanilla'],
        howToUse: 'Store refrigerated at 2°C–5°C. For supreme melt-in-mouth richness, take out 15 minutes before serving.',
        mrp: 899,
        sellingPrice: 699,
        category: categories[0]._id,
        stockQuantity: 40,
        thumbnail: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=800',
        images: [
          { url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=800', alt: 'Belgian Dark Truffle Celebration Cake', sortOrder: 0, width: 800, height: 800 },
          { url: 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?q=80&w=800', alt: 'Belgian Chocolate Cake Texture Slice', sortOrder: 1, width: 800, height: 800 }
        ],
        isFeatured: true,
        averageRating: 4.9,
        reviewCount: 48,
      },
      {
        name: 'Classic Red Velvet Cream Cheese Cake',
        sku: 'CAKE-REDVEL-002',
        slug: 'classic-red-velvet-cream-cheese-cake',
        shortDescription: 'Scarlet sponge frosted with decadent cream cheese frosting.',
        description: 'Velvety scarlet sponge layers frosted with rich Philadelphia-style cream cheese and finished with delicate red velvet sponge crumble. Perfectly balanced sweet and tangy flavor.',
        brand: 'The Cake Era',
        benefits: [
          'Authentic Philadelphia Cream Cheese Frosting',
          'Velvety Buttermilk & Hint of Dutch Cocoa',
          'Ideal For Anniversaries, Birthdays & Valentine',
          'Includes Free Candles & Cutting Knife'
        ],
        ingredients: ['Cultured Buttermilk', 'Philadelphia Cream Cheese', 'Pure Cow Butter', 'Refined Wheat Flour', 'Vanilla Extract'],
        howToUse: 'Keep refrigerated. Consume within 48 hours for ideal freshness.',
        mrp: 999,
        sellingPrice: 749,
        category: categories[0]._id,
        stockQuantity: 35,
        thumbnail: 'https://images.unsplash.com/photo-1616541823729-00fe0aacd32c?q=80&w=800',
        images: [
          { url: 'https://images.unsplash.com/photo-1616541823729-00fe0aacd32c?q=80&w=800', alt: 'Classic Red Velvet Cream Cheese Cake', sortOrder: 0, width: 800, height: 800 }
        ],
        isFeatured: true,
        averageRating: 4.9,
        reviewCount: 36,
      },
      {
        name: 'Royal Golden Floral Tiered Cake',
        sku: 'CAKE-TIERED-003',
        slug: 'royal-golden-floral-tiered-cake',
        shortDescription: 'Double-tier luxury centerpiece with hand-applied 24K edible gold dust.',
        description: 'Make milestone celebrations memorable with this bespoke double-tiered celebration cake. Frosted in smooth ivory buttercream, adorned with 24K edible gold leaf details and handcrafted sugar floral motifs.',
        brand: 'The Cake Era',
        benefits: [
          'Spectacular Double-Tier Visual Centerpiece',
          'Choice of Flavour (Belgian Chocolate or Madagascar Vanilla)',
          'Handcrafted Sugar Florals & Edible Gold Leaf',
          'Reinforced Safe Delivery Packaging'
        ],
        ingredients: ['Pure Butter', 'Icing Sugar', 'Madagascar Vanilla Pods', 'Edible Gold Leaf', 'Sponge Flour'],
        howToUse: 'Serve at room temperature. Internal dowel supports provide structure—remove during slicing.',
        mrp: 1999,
        sellingPrice: 1599,
        category: categories[1]._id,
        stockQuantity: 15,
        thumbnail: 'https://images.unsplash.com/photo-1535141192574-5d4897c13136?q=80&w=800',
        images: [
          { url: 'https://images.unsplash.com/photo-1535141192574-5d4897c13136?q=80&w=800', alt: 'Royal Golden Floral Tiered Cake', sortOrder: 0, width: 800, height: 800 }
        ],
        isFeatured: true,
        averageRating: 5.0,
        reviewCount: 22,
      },
    ]);

    await Banner.insertMany([
      {
        title: 'Artisanal Cakes Crafted for Your Special Moments',
        subtitle: 'Freshly baked with pure Belgian chocolate, dairy butter, and love.',
        imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=1600',
        linkUrl: '/shop',
        position: 1,
        isActive: true,
      },
    ]);

    await Coupon.insertMany([
      {
        code: 'CAKE10',
        discountType: 'percentage',
        discountAmount: 10,
        minPurchaseAmount: 499,
        expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
    ]);

    console.log('[AutoSeed] The Cake Era bakery data successfully seeded.');
  } catch (err) {
    console.error('[AutoSeed] Error during seeding:', err);
  }
};

module.exports = { seedIfEmpty };
