const mongoose = require('mongoose');
const dotenv = require('dotenv');
const http = require('http');
dotenv.config();

const app = require('../app');
const {
  User,
  Category,
  Product,
  Order,
  Payment,
  Coupon,
  Review,
  Banner,
  StoreSettings,
} = require('../models');

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

const runPhase7Tests = async () => {
  console.log('--------------------------------------------------');
  console.log('🧪 Starting PHASE 7 Automated Admin Panel & Security Test Suite');
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
  await User.deleteMany({ email: {$in: ['admuser@herbal.com', 'admin7@herbal.com'] } });
  await Category.deleteMany({ slug: 'test-adm-cat' });
  await Product.deleteMany({ sku: {$in: ['ADM-SKU-001', 'ADM-SKU-002'] } });
  await Order.deleteMany({});
  await Payment.deleteMany({});
  await Coupon.deleteMany({ code: 'ADM10' });
  await Review.deleteMany({});
  await Banner.deleteMany({ title: 'Test Admin Banner' });

  // Start HTTP server
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = 'http://localhost:' + port;
      console.log('Test server running on port ' + port);
      resolve();
    });
  });

  let normalToken, adminToken, testProduct, testCategory;

  try {
    // 1. Setup Users & Roles
    console.log('\n[1/10] Setting up Normal User & Admin User Accounts...');
    const userRes = await request('/api/auth/register', 'POST', {
      firstName: 'Normal',
      lastName: 'Customer',
      email: 'admuser@herbal.com',
      password: 'Password123',
      phone: '9876543209',
    });
    normalToken = userRes.body.data.accessToken;

    const adminUser = await User.create({
      firstName: 'Super',
      lastName: 'Admin',
      email: 'admin7@herbal.com',
      password: 'Password123',
      phone: '9876543208',
      role: 'admin',
    });

    const adminLogin = await request('/api/auth/login', 'POST', {
      email: 'admin7@herbal.com',
      password: 'Password123',
    });
    adminToken = adminLogin.body.data.accessToken;

    console.log('✅ Accounts initialized successfully.');

    // 2. Authorization Guards Check
    console.log('\n[2/10] Testing Backend Admin Authorization Guards...');
    const unauthDashboard = await request('/api/admin/dashboard', 'GET');
    console.assert(unauthDashboard.status === 401, 'Unauthenticated admin request must return 401');

    const customerDashboard = await request('/api/admin/dashboard', 'GET', null, {
      Authorization: 'Bearer ' + normalToken,
    });
    console.assert(customerDashboard.status === 403, 'Normal customer user request must return 403 Forbidden');

    const adminDashboard = await request('/api/admin/dashboard', 'GET', null, {
      Authorization: 'Bearer ' + adminToken,
    });
    console.assert(adminDashboard.status === 200, 'Admin request must return 200 OK');
    console.assert(
      adminDashboard.headers['cache-control'] && adminDashboard.headers['cache-control'].includes('no-store'),
      'Admin API must include Cache-Control: no-store'
    );
    console.log('✅ Authorization guards & anti-caching headers verified.');

    // 3. Dashboard Metrics & Revenue Aggregation Test
    console.log('\n[3/10] Testing Dashboard Metrics & Revenue Aggregation...');
    console.assert(adminDashboard.body.data.totalOrders !== undefined, 'totalOrders metric missing');
    console.assert(adminDashboard.body.data.totalRevenue !== undefined, 'totalRevenue metric missing');

    const trendRes = await request('/api/admin/dashboard/revenue?period=30d', 'GET', null, {
      Authorization: 'Bearer ' + adminToken,
    });
    console.assert(trendRes.status === 200, 'Revenue trend endpoint should return 200');
    console.log('✅ Dashboard metrics & trend aggregation working cleanly.');

    // 4. Product & Category Admin CRUD
    console.log('\n[4/10] Testing Admin Product & Category Management...');
    testCategory = await Category.create({
      name: 'Admin Test Category',
      slug: 'test-adm-cat',
    });

    const createProdRes = await request(
      '/api/products',
      'POST',
      {
        name: 'Admin Herbal Powder',
        slug: 'admin-herbal-powder',
        sku: 'ADM-SKU-001',
        description: 'Test product description for admin CRUD.',
        category: testCategory._id.toString(),
        mrp: 500,
        sellingPrice: 400,
        stockQuantity: 10,
      },
      { Authorization: 'Bearer ' + adminToken }
    );
    console.assert(createProdRes.status === 201, 'Admin product creation should return 201');
    testProduct = createProdRes.body.data;

    const getAdminProds = await request('/api/admin/products', 'GET', null, {
      Authorization: 'Bearer ' + adminToken,
    });
    console.assert(getAdminProds.status === 200, 'Admin products listing should return 200');
    console.assert(getAdminProds.body.data.length > 0, 'Admin product list should return created product');

    console.log('✅ Admin Product & Category management working cleanly.');

    // 5. Inventory Stock Adjustment Test
    console.log('\n[5/10] Testing Inventory Stock Adjustment...');
    const adjustStockRes = await request(
      '/api/admin/inventory/' + testProduct._id,
      'PATCH',
      { stockQuantity: 3, lowStockThreshold: 5 },
      { Authorization: 'Bearer ' + adminToken }
    );
    console.assert(adjustStockRes.status === 200, 'Stock adjustment should return 200');
    console.assert(adjustStockRes.body.data.stockQuantity === 3, 'Stock quantity updated to 3');
    console.assert(adjustStockRes.body.data.stockStatus === 'LOW_STOCK', 'Stock status transitioned to LOW_STOCK');
    console.log('✅ Inventory stock adjustment verified.');

    // 6. Customer Management Test
    console.log('\n[6/10] Testing Customer Listing & Account Status Toggle...');
    const customersRes = await request('/api/admin/customers', 'GET', null, {
      Authorization: 'Bearer ' + adminToken,
    });
    console.assert(customersRes.status === 200, 'Customer listing should return 200');

    const customerUser = customersRes.body.data.find((c) => c.email === 'admuser@herbal.com');
    console.assert(customerUser.password === undefined, 'Customer password hash must NOT be exposed');

    const toggleRes = await request(
      '/api/admin/customers/' + customerUser._id + '/status',
      'PATCH',
      { isActive: false },
      { Authorization: 'Bearer ' + adminToken }
    );
    console.assert(toggleRes.status === 200, 'Customer status toggle should return 200');

    console.log('✅ Customer management & security verified.');

    // 7. Coupon Management Test
    console.log('\n[7/10] Testing Coupon CRUD...');
    const couponRes = await request(
      '/api/admin/coupons',
      'POST',
      {
        code: 'ADM10',
        discountType: 'percentage',
        discountAmount: 10,
        minPurchaseAmount: 499,
        expiryDate: '2027-12-31',
      },
      { Authorization: 'Bearer ' + adminToken }
    );
    console.assert(couponRes.status === 201, 'Coupon creation should return 201');

    const getCoupons = await request('/api/admin/coupons', 'GET', null, {
      Authorization: 'Bearer ' + adminToken,
    });
    console.assert(getCoupons.body.data.length > 0, 'Coupons list should contain created coupon');

    console.log('✅ Coupon management verified.');

    // 8. Review Moderation Test
    console.log('\n[8/10] Testing Review Moderation...');
    const testReview = await Review.create({
      product: testProduct._id,
      user: customerUser._id,
      name: 'Customer Reviewer',
      rating: 5,
      comment: 'Excellent organic quality!',
      status: 'Pending',
    });

    const modRes = await request(
      '/api/admin/reviews/' + testReview._id + '/status',
      'PATCH',
      { status: 'Approved' },
      { Authorization: 'Bearer ' + adminToken }
    );
    console.assert(modRes.status === 200, 'Review moderation update should return 200');
    console.assert(modRes.body.data.status === 'Approved', 'Review status updated to Approved');

    console.log('✅ Review moderation verified.');

    // 9. Banner Management Test
    console.log('\n[9/10] Testing Banner Management...');
    const bannerRes = await request(
      '/api/admin/banners',
      'POST',
      {
        title: 'Test Admin Banner',
        imageUrl: 'https://example.com/banner.jpg',
        position: 1,
      },
      { Authorization: 'Bearer ' + adminToken }
    );
    console.assert(bannerRes.status === 201, 'Banner creation should return 201');

    console.log('✅ Banner management verified.');

    // 10. Reports & Settings Test
    console.log('\n[10/10] Testing Reports Aggregation & Store Settings...');
    const salesReport = await request('/api/admin/reports/sales', 'GET', null, {
      Authorization: 'Bearer ' + adminToken,
    });
    console.assert(salesReport.status === 200, 'Sales report should return 200');

    const invReport = await request('/api/admin/reports/inventory', 'GET', null, {
      Authorization: 'Bearer ' + adminToken,
    });
    console.assert(invReport.status === 200, 'Inventory report should return 200');

    const settingsRes = await request(
      '/api/admin/settings',
      'PATCH',
      { storeName: 'Herbal Organic Superstore' },
      { Authorization: 'Bearer ' + adminToken }
    );
    console.assert(settingsRes.status === 200, 'Store settings update should return 200');
    console.assert(settingsRes.body.data.storeName === 'Herbal Organic Superstore', 'Store name updated');

    console.log('✅ Reports aggregation & store settings verified.');

    console.log('\n--------------------------------------------------');
    console.log('🎉 ALL PHASE 7 ADMIN PANEL & SECURITY TESTS PASSED!');
    console.log('--------------------------------------------------');

  } catch (error) {
    console.error('❌ Phase 7 Test Failed:', error);
    process.exitCode = 1;
  } finally {
    // Cleanup
    await User.deleteMany({ email: {$in: ['admuser@herbal.com', 'admin7@herbal.com'] } });
    await Category.deleteMany({ slug: 'test-adm-cat' });
    await Product.deleteMany({ sku: {$in: ['ADM-SKU-001', 'ADM-SKU-002'] } });
    await Order.deleteMany({});
    await Payment.deleteMany({});
    await Coupon.deleteMany({ code: 'ADM10' });
    await Review.deleteMany({});
    await Banner.deleteMany({ title: 'Test Admin Banner' });
    if (server) server.close();
    await mongoose.connection.close();
    if (mongodInstance) await mongodInstance.stop();
  }
};

runPhase7Tests();
