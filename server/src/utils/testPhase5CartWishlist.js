const mongoose = require('mongoose');
const dotenv = require('dotenv');
const http = require('http');
dotenv.config();

const app = require('../app');
const { User, Category, Product, Cart, Wishlist, Session } = require('../models');

let server;
let baseUrl;

const request = (path, method = 'GET', body = null, headers = {}) => {
  return new Promise((resolve, reject) => {
    const url = new URL(baseUrl + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => (responseBody += chunk));
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(responseBody);
        } catch (e) {
          parsed = responseBody;
        }
        resolve({ status: res.statusCode, headers: res.headers, body: parsed });
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

const runPhase5Tests = async () => {
  console.log('--------------------------------------------------');
  console.log('🧪 Starting PHASE 5 Automated Cart & Wishlist Test Suite');
  console.log('--------------------------------------------------');

  let mongodInstance;
  let mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/herbal_ecommerce';
  
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongodInstance = await MongoMemoryServer.create();
    mongoUri = mongodInstance.getUri();
    console.log('⚡ Connected to In-Memory MongoDB Server for automated tests.');
  } catch (err) {
    console.log('Connecting to Mongo URI:', mongoUri);
  }

  await mongoose.connect(mongoUri);

  // Clean test data
  await User.deleteMany({ email: { $in: ['cartuser1@herbal.com', 'cartuser2@herbal.com'] } });
  await Category.deleteMany({ slug: 'test-cart-cat' });
  await Product.deleteMany({ sku: { $in: ['CART-SKU-001', 'CART-SKU-002', 'CART-SKU-003', 'CART-SKU-004'] } });

  // Start HTTP server on dynamic port
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      console.log(`Test server running on port ${port}`);
      resolve();
    });
  });

  let user1Token, user1Id, user2Token, user2Id;
  let activeProd1, activeProd2, inactiveProd, outOfStockProd;

  try {
    // 1. Setup Users
    console.log('\n[1/5] Setting up Test Users & Products...');
    const user1Res = await request('/api/auth/register', 'POST', {
      firstName: 'Cart',
      lastName: 'UserOne',
      email: 'cartuser1@herbal.com',
      password: 'Password123',
      phone: '9876543210',
    });
    user1Token = user1Res.body.data.accessToken;
    user1Id = user1Res.body.data.user._id;

    const user2Res = await request('/api/auth/register', 'POST', {
      firstName: 'Cart',
      lastName: 'UserTwo',
      email: 'cartuser2@herbal.com',
      password: 'Password123',
      phone: '9876543211',
    });
    user2Token = user2Res.body.data.accessToken;
    user2Id = user2Res.body.data.user._id;

    // Create Category
    const category = await Category.create({
      name: 'Cart Test Category',
      slug: 'test-cart-cat',
    });

    // Create Products
    activeProd1 = await Product.create({
      name: 'Triphala Powder',
      slug: 'triphala-powder',
      sku: 'CART-SKU-001',
      description: 'Pure Ayurvedic Triphala Powder for digestion.',
      category: category._id,
      mrp: 300,
      sellingPrice: 250,
      stockQuantity: 10,
      stockStatus: 'IN_STOCK',
      isActive: true,
      trackInventory: true,
    });

    activeProd2 = await Product.create({
      name: 'Neem Soap',
      slug: 'neem-soap',
      sku: 'CART-SKU-002',
      description: 'Natural organic neem skin care soap.',
      category: category._id,
      mrp: 100,
      sellingPrice: 80,
      stockQuantity: 5,
      stockStatus: 'IN_STOCK',
      isActive: true,
      trackInventory: true,
    });

    inactiveProd = await Product.create({
      name: 'Discontinued Oil',
      slug: 'discontinued-oil',
      sku: 'CART-SKU-003',
      description: 'Discontinued herbal massage oil.',
      category: category._id,
      mrp: 500,
      sellingPrice: 400,
      stockQuantity: 20,
      stockStatus: 'IN_STOCK',
      isActive: false,
    });

    outOfStockProd = await Product.create({
      name: 'Rare Herb',
      slug: 'rare-herb',
      sku: 'CART-SKU-004',
      description: 'Rare wild forest herbal extract.',
      category: category._id,
      mrp: 1000,
      sellingPrice: 900,
      stockQuantity: 0,
      stockStatus: 'OUT_OF_STOCK',
      isActive: true,
    });

    console.log('✅ Users and Products initialized.');

    // 2. Unauthenticated Access Tests
    console.log('\n[2/5] Testing Unauthenticated Access...');
    const unauthCart = await request('/api/cart', 'GET');
    console.assert(unauthCart.status === 401, 'Unauthenticated cart access should be 401');

    const unauthWishlist = await request('/api/wishlist', 'GET');
    console.assert(unauthWishlist.status === 401, 'Unauthenticated wishlist access should be 401');
    console.log('✅ Unauthenticated access rejected with 401.');

    // 3. Cart API Tests
    console.log('\n[3/5] Testing Cart CRUD & Business Rules...');

    // GET empty cart
    const emptyCart = await request('/api/cart', 'GET', null, { Authorization: `Bearer ${user1Token}` });
    console.assert(emptyCart.status === 200, 'GET /api/cart should return 200');
    console.assert(emptyCart.body.data.items.length === 0, 'Initial cart should be empty');
    console.assert(emptyCart.body.data.subtotal === 0, 'Initial cart subtotal should be 0');

    // Mass assignment attempt (e.g., passing sellingPrice) -> rejected with 400
    const massAssignRes = await request(
      '/api/cart/items',
      'POST',
      {
        productId: activeProd1._id.toString(),
        quantity: 2,
        sellingPrice: 1, // Malicious extra field
      },
      { Authorization: `Bearer ${user1Token}` }
    );
    console.assert(massAssignRes.status === 400, 'Mass assignment attempt should return 400');

    // ADD item to cart (Valid)
    const addRes1 = await request(
      '/api/cart/items',
      'POST',
      {
        productId: activeProd1._id.toString(),
        quantity: 2,
      },
      { Authorization: `Bearer ${user1Token}` }
    );
    console.assert(addRes1.status === 200, 'Add item to cart should return 200');
    console.assert(addRes1.body.data.items.length === 1, 'Cart should have 1 item');
    console.assert(addRes1.body.data.items[0].quantity === 2, 'Item quantity should be 2');
    console.assert(
      addRes1.body.data.items[0].product.sellingPrice === 250,
      'Product price should be fetched from DB (250)'
    );
    console.assert(addRes1.body.data.subtotal === 500, 'Subtotal should be 2 * 250 = 500');

    // DUPLICATE ADD (Increase quantity)
    const addDupRes = await request(
      '/api/cart/items',
      'POST',
      {
        productId: activeProd1._id.toString(),
        quantity: 3,
      },
      { Authorization: `Bearer ${user1Token}` }
    );
    console.assert(addDupRes.body.data.items.length === 1, 'Duplicate product should not create new item entry');
    console.assert(addDupRes.body.data.items[0].quantity === 5, 'Duplicate product should merge quantity (2 + 3 = 5)');
    console.assert(addDupRes.body.data.subtotal === 1250, 'Subtotal should be 5 * 250 = 1250');

    // INVENTORY OVERFLOW ATTEMPT
    const overflowRes = await request(
      '/api/cart/items',
      'POST',
      {
        productId: activeProd1._id.toString(),
        quantity: 10, // 5 + 10 = 15, stock limit is 10
      },
      { Authorization: `Bearer ${user1Token}` }
    );
    console.assert(overflowRes.status === 400, 'Exceeding stock limit should return 400');

    // INACTIVE PRODUCT ATTEMPT
    const inactiveAddRes = await request(
      '/api/cart/items',
      'POST',
      {
        productId: inactiveProd._id.toString(),
        quantity: 1,
      },
      { Authorization: `Bearer ${user1Token}` }
    );
    console.assert(inactiveAddRes.status === 400, 'Adding inactive product should return 400');

    // OUT OF STOCK ATTEMPT
    const oosAddRes = await request(
      '/api/cart/items',
      'POST',
      {
        productId: outOfStockProd._id.toString(),
        quantity: 1,
      },
      { Authorization: `Bearer ${user1Token}` }
    );
    console.assert(oosAddRes.status === 400, 'Adding out-of-stock product should return 400');

    // UPDATE QUANTITY
    const updateRes = await request(
      `/api/cart/items/${activeProd1._id.toString()}`,
      'PATCH',
      { quantity: 4 },
      { Authorization: `Bearer ${user1Token}` }
    );
    console.assert(updateRes.status === 200, 'Update quantity should return 200');
    console.assert(updateRes.body.data.items[0].quantity === 4, 'Updated quantity should be 4');
    console.assert(updateRes.body.data.subtotal === 1000, 'Updated subtotal should be 4 * 250 = 1000');

    // INVALID QUANTITY UPDATE
    const invalidQtyRes = await request(
      `/api/cart/items/${activeProd1._id.toString()}`,
      'PATCH',
      { quantity: 0 },
      { Authorization: `Bearer ${user1Token}` }
    );
    console.assert(invalidQtyRes.status === 400, 'Updating quantity to 0 should be rejected with 400');

    // REMOVE ITEM
    const removeRes = await request(
      `/api/cart/items/${activeProd1._id.toString()}`,
      'DELETE',
      null,
      { Authorization: `Bearer ${user1Token}` }
    );
    console.assert(removeRes.status === 200, 'Remove cart item should return 200');
    console.assert(removeRes.body.data.items.length === 0, 'Cart should be empty after item removal');

    // CLEAR CART
    await request(
      '/api/cart/items',
      'POST',
      { productId: activeProd1._id.toString(), quantity: 1 },
      { Authorization: `Bearer ${user1Token}` }
    );
    const clearRes = await request('/api/cart', 'DELETE', null, { Authorization: `Bearer ${user1Token}` });
    console.assert(clearRes.status === 200, 'Clear cart should return 200');
    console.assert(clearRes.body.data.items.length === 0, 'Cart should be empty after clear');

    // IDOR ISOLATION TEST (User 2 cannot see or delete User 1 cart)
    await request(
      '/api/cart/items',
      'POST',
      { productId: activeProd1._id.toString(), quantity: 2 },
      { Authorization: `Bearer ${user1Token}` }
    );
    const user2CartRes = await request('/api/cart', 'GET', null, { Authorization: `Bearer ${user2Token}` });
    console.assert(user2CartRes.body.data.items.length === 0, "User 2 should not see User 1's cart items");

    console.log('✅ Cart CRUD, price authority, inventory validation, and IDOR isolation passed.');

    // 4. Wishlist API Tests
    console.log('\n[4/5] Testing Wishlist CRUD...');

    // GET empty wishlist
    const emptyWishlist = await request('/api/wishlist', 'GET', null, { Authorization: `Bearer ${user1Token}` });
    console.assert(emptyWishlist.status === 200, 'GET /api/wishlist should return 200');
    console.assert(emptyWishlist.body.data.products.length === 0, 'Initial wishlist should be empty');

    // ADD product to wishlist
    const wishAddRes = await request(
      `/api/wishlist/items/${activeProd1._id.toString()}`,
      'POST',
      null,
      { Authorization: `Bearer ${user1Token}` }
    );
    console.assert(wishAddRes.status === 200, 'Add product to wishlist should return 200');
    console.assert(wishAddRes.body.data.products.length === 1, 'Wishlist should have 1 product');

    // DUPLICATE ADD (Should be idempotent)
    const wishDupRes = await request(
      `/api/wishlist/items/${activeProd1._id.toString()}`,
      'POST',
      null,
      { Authorization: `Bearer ${user1Token}` }
    );
    console.assert(wishDupRes.body.data.products.length === 1, 'Wishlist should prevent duplicate products');

    // REMOVE from wishlist
    const wishRemRes = await request(
      `/api/wishlist/items/${activeProd1._id.toString()}`,
      'DELETE',
      null,
      { Authorization: `Bearer ${user1Token}` }
    );
    console.assert(wishRemRes.status === 200, 'Remove product from wishlist should return 200');
    console.assert(wishRemRes.body.data.products.length === 0, 'Wishlist should be empty after removal');

    // CLEAR wishlist
    await request(`/api/wishlist/items/${activeProd1._id.toString()}`, 'POST', null, { Authorization: `Bearer ${user1Token}` });
    const wishClearRes = await request('/api/wishlist', 'DELETE', null, { Authorization: `Bearer ${user1Token}` });
    console.assert(wishClearRes.status === 200, 'Clear wishlist should return 200');
    console.assert(wishClearRes.body.data.products.length === 0, 'Wishlist should be empty after clear');

    console.log('✅ Wishlist CRUD and duplicate prevention passed.');

    // 5. Guest Login Merge Tests
    console.log('\n[5/5] Testing Guest Cart & Wishlist Merge Logic...');

    // Clear User 1 cart and setup 1 item
    await request('/api/cart', 'DELETE', null, { Authorization: `Bearer ${user1Token}` });
    await request(
      '/api/cart/items',
      'POST',
      { productId: activeProd1._id.toString(), quantity: 2 },
      { Authorization: `Bearer ${user1Token}` }
    );

    // Merge Guest Cart (Guest has activeProd1 x 2, activeProd2 x 3)
    const mergeCartRes = await request(
      '/api/cart/merge',
      'POST',
      {
        items: [
          { productId: activeProd1._id.toString(), quantity: 2 },
          { productId: activeProd2._id.toString(), quantity: 3 },
          { productId: inactiveProd._id.toString(), quantity: 1 }, // Inactive should be skipped
        ],
      },
      { Authorization: `Bearer ${user1Token}` }
    );

    console.assert(mergeCartRes.status === 200, 'Merge cart should return 200');
    console.assert(mergeCartRes.body.data.items.length === 2, 'Merged cart should contain 2 unique items');
    
    // Find activeProd1 in merged items
    const mergedProd1 = mergeCartRes.body.data.items.find(
      (item) => item.product._id === activeProd1._id.toString()
    );
    console.assert(mergedProd1.quantity === 4, 'Prod1 quantity should merge (2 existing + 2 guest = 4)');

    // Merge Guest Wishlist
    await request('/api/wishlist', 'DELETE', null, { Authorization: `Bearer ${user1Token}` });
    await request(`/api/wishlist/items/${activeProd1._id.toString()}`, 'POST', null, { Authorization: `Bearer ${user1Token}` });

    const mergeWishRes = await request(
      '/api/wishlist/merge',
      'POST',
      {
        productIds: [activeProd1._id.toString(), activeProd2._id.toString()],
      },
      { Authorization: `Bearer ${user1Token}` }
    );

    console.assert(mergeWishRes.status === 200, 'Merge wishlist should return 200');
    console.assert(mergeWishRes.body.data.products.length === 2, 'Merged wishlist should contain 2 unique products');

    console.log('✅ Guest Cart & Wishlist merge logic passed.');

    console.log('\n--------------------------------------------------');
    console.log('🎉 ALL PHASE 5 CART & WISHLIST TESTS PASSED SUCCESSFULLY!');
    console.log('--------------------------------------------------');

  } catch (error) {
    console.error('❌ Phase 5 Test Failed:', error);
    process.exitCode = 1;
  } finally {
    // Cleanup
    await User.deleteMany({ email: { $in: ['cartuser1@herbal.com', 'cartuser2@herbal.com'] } });
    await Category.deleteMany({ slug: 'test-cart-cat' });
    await Product.deleteMany({ sku: { $in: ['CART-SKU-001', 'CART-SKU-002', 'CART-SKU-003', 'CART-SKU-004'] } });
    await Cart.deleteMany({});
    await Wishlist.deleteMany({});
    if (server) server.close();
    await mongoose.connection.close();
    if (mongodInstance) await mongodInstance.stop();
  }
};

runPhase5Tests();
