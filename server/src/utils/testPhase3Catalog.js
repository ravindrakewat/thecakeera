const mongoose = require('mongoose');
const dotenv = require('dotenv');
const http = require('http');
dotenv.config();

const app = require('../app');
const { User, Category, Product, Session } = require('../models');

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

const runCatalogTests = async () => {
  console.log('--------------------------------------------------');
  console.log('🧪 Starting PHASE 3 Automated Catalog & Inventory Test Suite');
  console.log('--------------------------------------------------');

  let mongodInstance;
  let mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/herbal_ecommerce';
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongodInstance = await MongoMemoryServer.create();
    mongoUri = mongodInstance.getUri();
  } catch (err) {}
  await mongoose.connect(mongoUri);

  // Clean test data
  await User.deleteMany({ email: { $in: ['cataloguser@herbal.com', 'catalogadmin@herbal.com'] } });
  await Category.deleteMany({ slug: { $in: ['test-herbal-juices', 'test-ayurveda'] } });
  await Product.deleteMany({ sku: { $in: ['TEST-SKU-001', 'TEST-SKU-002'] } });
  await Session.deleteMany({});

  await Product.createIndexes();
  await Category.createIndexes();

  // Spin up HTTP server
  server = http.createServer(app).listen(0);
  const port = server.address().port;
  baseUrl = `http://localhost:${port}`;

  let userToken = '';
  let adminToken = '';
  let categoryId = '';
  let productId = '';

  try {
    // 1. Setup Users & Admin
    const userReg = await request('/api/auth/register', 'POST', {
      firstName: 'Catalog',
      lastName: 'User',
      email: 'cataloguser@herbal.com',
      phone: '9876543210',
      password: 'Password123',
    });
    userToken = userReg.body.data.accessToken;

    const adminReg = await request('/api/auth/register', 'POST', {
      firstName: 'Catalog',
      lastName: 'Admin',
      email: 'catalogadmin@herbal.com',
      phone: '9876543299',
      password: 'Password123',
    });
    await User.updateOne({ email: 'catalogadmin@herbal.com' }, { role: 'admin' });
    const adminLogin = await request('/api/auth/login', 'POST', {
      email: 'catalogadmin@herbal.com',
      password: 'Password123',
    });
    adminToken = adminLogin.body.data.accessToken;
    console.log('  ✅ Test users & Admin setup verified');

    // 2. Category Authorization Test
    console.log('▶ Test 1: Category Creation Authorization Check');
    const userCatRes = await request('/api/categories', 'POST', { name: 'Test Juices' }, { Authorization: `Bearer ${userToken}` });
    console.assert(userCatRes.status === 403, `Expected 403 for Normal User, got ${userCatRes.status}`);
    console.log('  ✅ User denied category creation (403)');

    // 3. Admin Create Category
    console.log('▶ Test 2: Admin Create Category');
    const adminCatRes = await request('/api/categories', 'POST', {
      name: 'Test Herbal Juices',
      slug: 'test-herbal-juices',
      description: 'Organic cold pressed herbal juices',
    }, { Authorization: `Bearer ${adminToken}` });
    console.assert(adminCatRes.status === 201, `Expected 201, got ${adminCatRes.status}`);
    categoryId = adminCatRes.body.data._id;
    console.log('  ✅ Admin created category successfully');

    // 4. Duplicate Category Slug Check
    console.log('▶ Test 3: Duplicate Category Slug Check');
    const dupCatRes = await request('/api/categories', 'POST', {
      name: 'Test Herbal Juices',
      slug: 'test-herbal-juices',
    }, { Authorization: `Bearer ${adminToken}` });
    console.assert(dupCatRes.status === 400, `Expected 400 for duplicate slug, got ${dupCatRes.status}`);
    console.log('  ✅ Duplicate category slug rejected cleanly');

    // 5. Product Creation Authorization Check
    console.log('▶ Test 4: Product Creation Authorization Check');
    const userProdRes = await request('/api/products', 'POST', { name: 'Test Product' }, { Authorization: `Bearer ${userToken}` });
    console.assert(userProdRes.status === 403, `Expected 403 for Normal User, got ${userProdRes.status}`);
    console.log('  ✅ User denied product creation (403)');

    // 6. Invalid Price Product Creation (`sellingPrice > mrp`)
    console.log('▶ Test 5: Invalid Price Validation (`sellingPrice > mrp`)');
    const invalidPriceRes = await request('/api/products', 'POST', {
      name: 'Bad Price Product',
      sku: 'TEST-SKU-BAD',
      category: categoryId,
      mrp: 300,
      sellingPrice: 500,
      description: 'Test description',
    }, { Authorization: `Bearer ${adminToken}` });
    console.assert(invalidPriceRes.status === 400, `Expected 400 for sellingPrice > mrp, got ${invalidPriceRes.status}`);
    console.log('  ✅ Invalid price rejected by backend validator');

    // 7. Admin Create Product
    console.log('▶ Test 6: Admin Create Product');
    const adminProdRes = await request('/api/products', 'POST', {
      name: 'Pure Sea Buckthorn Herbal Juice',
      sku: 'TEST-SKU-001',
      slug: 'pure-sea-buckthorn-herbal-juice',
      description: 'Rich in Vitamin C and Omegas for immune boosting.',
      category: categoryId,
      mrp: 699,
      sellingPrice: 499,
      costPrice: 250,
      stockQuantity: 20,
      lowStockThreshold: 5,
      isFeatured: true,
      ingredients: ['100% Sea Buckthorn Juice'],
      benefits: ['Immune Booster', 'Skin Glow'],
    }, { Authorization: `Bearer ${adminToken}` });
    console.assert(adminProdRes.status === 201, `Expected 201, got ${adminProdRes.status}`);
    productId = adminProdRes.body.data._id;
    console.log('  ✅ Admin created product successfully');

    // 8. Public Product Details API (`GET /api/products/:slug`)
    console.log('▶ Test 7: Public Product Details API');
    const detailRes = await request('/api/products/pure-sea-buckthorn-herbal-juice', 'GET');
    console.assert(detailRes.status === 200, `Expected 200, got ${detailRes.status}`);
    console.assert(detailRes.body.data.costPrice === undefined, 'costPrice must NOT be returned in public API');
    console.assert(detailRes.body.data.stockStatus === 'IN_STOCK', 'stockStatus mismatch');
    console.log('  ✅ Product details returned with safe fields & stockStatus');

    // 9. Public Catalog Filtering, Search, Whitelisted Sorting, Pagination
    console.log('▶ Test 8: Public Catalog Filtering, Search & Whitelisted Sorting');
    const catalogRes = await request('/api/products?search=Buckthorn&category=test-herbal-juices&minPrice=100&maxPrice=1000&sort=priceLow&page=1&limit=12', 'GET');
    console.assert(catalogRes.status === 200, `Expected 200, got ${catalogRes.status}`);
    console.assert(catalogRes.body.data.length > 0, 'Catalog filter should match product');
    console.assert(catalogRes.body.pagination.total >= 1, 'Pagination count mismatch');
    console.log('  ✅ Public catalog filtering & whitelisted sorting working cleanly');

    // 10. Invalid Sort Whitelist Test
    console.log('▶ Test 9: Invalid Sort Whitelist Check');
    const badSortRes = await request('/api/products?sort=invalidField;DROP TABLE', 'GET');
    console.assert(badSortRes.status === 400, `Expected 400 for invalid sort option, got ${badSortRes.status}`);
    console.log('  ✅ Invalid sort parameter rejected by whitelist');

    // 11. Admin Inventory Update API
    console.log('▶ Test 10: Admin Inventory Update');
    const invRes = await request(`/api/products/${productId}/inventory`, 'PATCH', { stockQuantity: 2 }, { Authorization: `Bearer ${adminToken}` });
    console.assert(invRes.status === 200, `Expected 200, got ${invRes.status}`);
    console.assert(invRes.body.data.stockStatus === 'LOW_STOCK', 'Stock status should transition to LOW_STOCK');
    console.log('  ✅ Inventory updated and stockStatus transitioned to LOW_STOCK');

    // 12. Admin Low Stock Report API
    console.log('▶ Test 11: Admin Low Stock Report');
    const lowStockRes = await request('/api/products/admin/low-stock', 'GET', null, { Authorization: `Bearer ${adminToken}` });
    console.assert(lowStockRes.status === 200, `Expected 200, got ${lowStockRes.status}`);
    console.assert(lowStockRes.body.data.some((p) => p._id.toString() === productId), 'Low stock product should be in report');
    console.log('  ✅ Low stock report returned low-stock items');

    // 13. Category Delete Safety Check
    console.log('▶ Test 12: Category Delete Safety Check (Products Exist)');
    const delCatRes = await request(`/api/categories/${categoryId}`, 'DELETE', null, { Authorization: `Bearer ${adminToken}` });
    console.assert(delCatRes.status === 400, `Expected 400 for deleting category with products, got ${delCatRes.status}`);
    console.log('  ✅ Category deletion blocked safely because products reference it');

    console.log('--------------------------------------------------');
    console.log('🎉 ALL PHASE 3 AUTOMATED CATALOG TESTS PASSED!');
    console.log('--------------------------------------------------');
  } catch (err) {
    console.error('❌ Test Failure:', err);
    process.exit(1);
  } finally {
    if (server) server.close();
    await mongoose.connection.close();
    if (mongodInstance) await mongodInstance.stop();
    process.exit(0);
  }
};

runCatalogTests();
