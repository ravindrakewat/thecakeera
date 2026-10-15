const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const { User, Category, Product, Banner, Coupon } = require('../models');

const seedCakeEra = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI is missing in environment variables');
    }

    console.log(`[TheCakeEra Seed] Connecting to MongoDB: ${mongoUri.replace(/:[^:@]+@/, ':****@')}`);
    await mongoose.connect(mongoUri);

    console.log('[TheCakeEra Seed] Clearing old data...');
    await User.deleteMany();
    await Category.deleteMany();
    await Product.deleteMany();
    await Banner.deleteMany();
    await Coupon.deleteMany();

    console.log('[TheCakeEra Seed] Creating Admin & Customer Users...');
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

    console.log('[TheCakeEra Seed] Creating Bakery Categories...');
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

    const catMap = {};
    categories.forEach((cat) => {
      catMap[cat.slug] = cat._id;
    });

    console.log('[TheCakeEra Seed] Creating Gourmet Bakery Products...');
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
        category: catMap['celebration-cakes'],
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
        category: catMap['celebration-cakes'],
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
        category: catMap['designer-cakes'],
        stockQuantity: 15,
        thumbnail: 'https://images.unsplash.com/photo-1535254973040-607b474cb50d?q=80&w=800',
        images: [
          { url: 'https://images.unsplash.com/photo-1535254973040-607b474cb50d?q=80&w=800', alt: 'Royal Golden Floral Tiered Cake', sortOrder: 0, width: 800, height: 800 }
        ],
        isFeatured: true,
        averageRating: 5.0,
        reviewCount: 22,
      },
      {
        name: 'Fresh Blueberry Cheesecake Slice (Pack of 2)',
        sku: 'PAST-BERRY-004',
        slug: 'fresh-blueberry-cheesecake-slice',
        shortDescription: 'Slow-baked New York cheesecake on butter biscuit base with blueberry compote.',
        description: 'Authentic New York baked cheesecake slice topped with simmered wild blueberry compote on a buttery graham digestive crust. Creamy, tangy, and deeply satisfying.',
        brand: 'The Cake Era',
        benefits: [
          'Slow-Baked Classic Recipe',
          'Real Whole Wild Blueberries',
          'Zero Artificial Gelatin or Fillers',
          'Pack of 2 Individual Dessert Servings'
        ],
        ingredients: ['Dairy Cream Cheese', 'Wild Blueberries', 'Digestive Biscuit Base', 'Butter', 'Lemon Zest'],
        howToUse: 'Serve chilled directly from the box.',
        mrp: 450,
        sellingPrice: 349,
        category: catMap['pastries-cupcakes'],
        stockQuantity: 50,
        thumbnail: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?q=80&w=800',
        images: [
          { url: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?q=80&w=800', alt: 'Fresh Blueberry Cheesecake Slice', sortOrder: 0, width: 800, height: 800 }
        ],
        isFeatured: true,
        averageRating: 4.8,
        reviewCount: 31,
      },
      {
        name: 'Assorted Gourmet Cupcake Box (6 Pcs)',
        sku: 'PAST-CUPCAKE-005',
        slug: 'assorted-gourmet-cupcake-box-6pcs',
        shortDescription: 'Gift box of 6 handcrafted cupcakes in distinct bakery flavors.',
        description: 'Delightful gift box containing 6 signature cupcakes: 2 Dutch Chocolate, 2 Red Velvet with cream cheese swirl, and 2 Salted Caramel Biscoff.',
        brand: 'The Cake Era',
        benefits: [
          '6 Gourmet Flavours In One Box',
          '100% Eggless & Freshly Frosted',
          'Artisanal Hand-Piped Swirls',
          'Festive Gift Ready Packaging'
        ],
        ingredients: ['Wheat Flour', 'Pure Butter', 'Dutch Cocoa', 'Caramel Drizzle', 'Biscoff Biscuit Crumble', 'Cream Cheese'],
        howToUse: 'Store in a cool dry place or refrigerate in warmer weather.',
        mrp: 599,
        sellingPrice: 449,
        category: catMap['pastries-cupcakes'],
        stockQuantity: 60,
        thumbnail: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?q=80&w=800',
        images: [
          { url: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?q=80&w=800', alt: 'Assorted Gourmet Cupcake Box', sortOrder: 0, width: 800, height: 800 }
        ],
        isFeatured: true,
        averageRating: 4.9,
        reviewCount: 44,
      },
      {
        name: 'Chunky Roasted Almond & Dark Choco Cookies (300g)',
        sku: 'COOK-ALMOND-006',
        slug: 'chunky-roasted-almond-dark-choco-cookies',
        shortDescription: 'Crunchy golden butter cookies packed with roasted almonds and dark chocolate.',
        description: 'Golden oven-baked artisanal cookies loaded with toasted Californian almonds and semi-sweet dark chocolate morsels. Baked in small batches with pure butter.',
        brand: 'The Cake Era',
        benefits: [
          'Baked In Small Batches Everyday',
          'Zero Palm Oil & Zero Artificial Additives',
          'Generously Loaded With Roasted Californian Almonds',
          'Airtight Reusable Tin Container'
        ],
        ingredients: ['Rolled Oats', 'Californian Almonds', 'Dark Chocolate Chips (45%)', 'Brown Sugar', 'Pure Cow Butter', 'Vanilla Extract'],
        howToUse: 'Enjoy directly with hot milk, coffee, or as an afternoon tea treat.',
        mrp: 399,
        sellingPrice: 299,
        category: catMap['cookies-biscuits'],
        stockQuantity: 80,
        thumbnail: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?q=80&w=800',
        images: [
          { url: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?q=80&w=800', alt: 'Chunky Roasted Almond & Dark Choco Cookies', sortOrder: 0, width: 800, height: 800 }
        ],
        isFeatured: true,
        averageRating: 4.8,
        reviewCount: 52,
      },
      {
        name: 'Parisian French Butter Croissants (Pack of 4)',
        sku: 'BREAD-CROISS-007',
        slug: 'parisian-french-butter-croissants-pack-of-4',
        shortDescription: 'Flaky, golden layered croissants made with 82% butterfat European butter.',
        description: 'True artisanal croissants featuring 72 distinct pastry layers. Crisp and caramelized on the outside, feather-light and honeycomb tender on the inside.',
        brand: 'The Cake Era',
        benefits: [
          '48-Hour Cold Fermentation Process',
          'Laminated With 82% Pure Butter',
          'Reheats In 2 Minutes For Oven-Fresh Flakiness',
          'No Artificial Dough Conditioners'
        ],
        ingredients: ['Wheat Flour', 'Pure Butter (82% Fat)', 'Active Yeast', 'Sea Salt', 'Spring Water'],
        howToUse: 'Warm in preheated oven at 180°C for 2-3 minutes before eating for best crispness.',
        mrp: 399,
        sellingPrice: 319,
        category: catMap['fresh-breads'],
        stockQuantity: 40,
        thumbnail: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=800',
        images: [
          { url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=800', alt: 'Parisian French Butter Croissants', sortOrder: 0, width: 800, height: 800 }
        ],
        isFeatured: false,
        averageRating: 4.7,
        reviewCount: 19,
      },
      {
        name: 'Gooey Fudgy Walnut Brownies (Pack of 4)',
        sku: 'BROWN-WALNUT-008',
        slug: 'gooey-fudgy-walnut-brownies-pack-of-4',
        shortDescription: 'Dense, crackly-top dark chocolate brownies with toasted Kashmiri walnuts.',
        description: 'Fudge-like dense chocolate squares with shiny crackly tops, intense cocoa flavor, and generous chunks of crunchy Kashmiri walnut kernels.',
        brand: 'The Cake Era',
        benefits: [
          'Molten Fudgy Center & Crackly Top',
          'Loaded With Premium Kashmiri Walnuts',
          'Micro-heat For 15s For Gooey Heaven',
          'Pairs Exquisitely With Vanilla Bean Ice Cream'
        ],
        ingredients: ['Dark Chocolate Couverture', 'Pure Dairy Butter', 'Kashmiri Walnuts', 'Cane Brown Sugar', 'Wheat Flour'],
        howToUse: 'Microwave for 15-20 seconds for molten chocolate consistency.',
        mrp: 499,
        sellingPrice: 379,
        category: catMap['dessert-jars-brownies'],
        stockQuantity: 55,
        thumbnail: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?q=80&w=800',
        images: [
          { url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?q=80&w=800', alt: 'Gooey Fudgy Walnut Brownies', sortOrder: 0, width: 800, height: 800 }
        ],
        isFeatured: true,
        averageRating: 4.9,
        reviewCount: 59,
      },
      {
        name: 'Artisanal Sourdough Country Loaf (500g)',
        sku: 'BREAD-SOUR-009',
        slug: 'artisanal-sourdough-country-loaf',
        shortDescription: 'Naturally leavened 36-hour sourdough with blistered crust and airy crumb.',
        description: 'Handcrafted rustic sourdough loaf baked in stone hearths. Made with wild starter culture, stone-ground flour, water, and salt. Naturally low glycemic and easy to digest.',
        brand: 'The Cake Era',
        benefits: [
          'Wild Yeast 36-Hour Natural Fermentation',
          'Crispy Caramelized Blistered Crust',
          'Zero Preservatives & 100% Vegan',
          'Supreme For Avocado Toast & Soups'
        ],
        ingredients: ['Stone-Ground Whole Wheat', 'Rye Flour', 'Wild Yeast Starter Culture', 'Rock Salt', 'Filtered Water'],
        howToUse: 'Slice with serrated bread knife. Toast lightly and spread with butter or olive oil.',
        mrp: 280,
        sellingPrice: 220,
        category: catMap['fresh-breads'],
        stockQuantity: 30,
        thumbnail: 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?q=80&w=800',
        images: [
          { url: 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?q=80&w=800', alt: 'Artisanal Sourdough Country Loaf', sortOrder: 0, width: 800, height: 800 }
        ],
        isFeatured: false,
        averageRating: 4.8,
        reviewCount: 23,
      },
      {
        name: 'Exotic Fresh Fruit & Alphonso Mango Gateau',
        sku: 'CAKE-FRUIT-010',
        slug: 'exotic-fresh-fruit-alphonso-mango-gateau',
        shortDescription: 'Airy vanilla sponge with Alphonso mango cream and seasonal fruit glaze.',
        description: 'A light and refreshing celebration cake layered with silky Alphonso mango mousse and topped with glistening strawberries, kiwi, dragonfruit, and orange glaze.',
        brand: 'The Cake Era',
        benefits: [
          'Handpicked Farm-Fresh Seasonal Fruits',
          'Light, Non-Dairy Airy Whipped Cream',
          'Subtle Sweetness Perfect For All Ages',
          'Free Candles & Knife Included'
        ],
        ingredients: ['Fresh Alphonso Mango Pulp', 'Seasonal Kiwi & Strawberries', 'Airy Vanilla Sponge', 'Whipped Cream', 'Clear Fruit Glaze'],
        howToUse: 'Keep chilled until celebration. Best consumed same day for freshest fruit flavor.',
        mrp: 999,
        sellingPrice: 799,
        category: catMap['celebration-cakes'],
        stockQuantity: 25,
        thumbnail: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?q=80&w=800',
        images: [
          { url: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?q=80&w=800', alt: 'Exotic Fresh Fruit & Alphonso Mango Gateau', sortOrder: 0, width: 800, height: 800 }
        ],
        isFeatured: true,
        averageRating: 4.9,
        reviewCount: 37,
      },
    ]);

    console.log('[TheCakeEra Seed] Creating Bakery Banners...');
    await Banner.insertMany([
      {
        title: 'Artisanal Cakes Crafted for Your Special Moments',
        subtitle: 'Freshly baked with pure Belgian chocolate, dairy butter, and love.',
        imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=1600',
        linkUrl: '/shop',
        position: 1,
        isActive: true,
      },
      {
        title: 'Delicate Pastries, Cookies & Oven-Fresh Bakes',
        subtitle: 'Crispy croissants, melt-in-mouth cookies, and fudgy walnut brownies.',
        imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=1600',
        linkUrl: '/shop',
        position: 2,
        isActive: true,
      },
    ]);

    console.log('[TheCakeEra Seed] Creating Bakery Promo Coupons...');
    await Coupon.insertMany([
      {
        code: 'CAKE10',
        discountType: 'percentage',
        discountAmount: 10,
        minPurchaseAmount: 499,
        expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
        isActive: true,
      },
      {
        code: 'CELEBRATE100',
        discountType: 'fixed',
        discountAmount: 100,
        minPurchaseAmount: 699,
        expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
    ]);

    console.log('🎉 [TheCakeEra Seed] Database populated successfully with fresh Bakery items!');
    console.log('   Admin Login: admin@thecakeera.in / AdminPassword123');
    console.log('   Sample Customer: customer@thecakeera.in / CustomerPassword123');
    process.exit(0);
  } catch (error) {
    console.error('❌ [TheCakeEra Seed Error]', error);
    process.exit(1);
  }
};

seedCakeEra();
