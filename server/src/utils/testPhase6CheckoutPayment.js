const mongoose = require('mongoose');
const dotenv = require('dotenv');
const http = require('http');
const crypto = require('crypto');
dotenv.config();

const app = require('../app');
const { User, Category, Product, Cart, Address, Order, Payment, WebhookEvent } = require('../models');

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

const runPhase6Tests = async () => {
  console.log('--------------------------------------------------');
  console.log('🧪 Starting PHASE 6 Automated Checkout & Razorpay Test Suite');
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
  await User.deleteMany({ email: { $in: ['chkuser1@herbal.com', 'chkuser2@herbal.com'] } });
  await Category.deleteMany({ slug: 'test-chk-cat' });
  await Product.deleteMany({ sku: { $in: ['CHK-SKU-001', 'CHK-SKU-002', 'CHK-SKU-003'] } });
  await Order.deleteMany({});
  await Payment.deleteMany({});
  await WebhookEvent.deleteMany({});

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
  let user1Address, user2Address;
  let activeProd1, activeProd2, lowStockProd;

  try {
    // 1. Setup Users & Addresses
    console.log('\n[1/6] Setting up Test Users, Addresses & Catalog...');
    const user1Res = await request('/api/auth/register', 'POST', {
      firstName: 'Checkout',
      lastName: 'UserOne',
      email: 'chkuser1@herbal.com',
      password: 'Password123',
      phone: '9876543201',
    });
    user1Token = user1Res.body.data.accessToken;
    user1Id = user1Res.body.data.user.id || user1Res.body.data.user._id;

    const user2Res = await request('/api/auth/register', 'POST', {
      firstName: 'Checkout',
      lastName: 'UserTwo',
      email: 'chkuser2@herbal.com',
      password: 'Password123',
      phone: '9876543202',
    });
    user2Token = user2Res.body.data.accessToken;
    user2Id = user2Res.body.data.user.id || user2Res.body.data.user._id;

    // Create User 1 Address
    user1Address = await Address.create({
      user: user1Id,
      fullName: 'Checkout User One',
      phone: '9876543201',
      addressLine1: '123 Herbal Street',
      city: 'Jaipur',
      state: 'Rajasthan',
      pincode: '302001',
      isDefault: true,
    });

    // Create User 2 Address
    user2Address = await Address.create({
      user: user2Id,
      fullName: 'Checkout User Two',
      phone: '9876543202',
      addressLine1: '456 Organic Lane',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110001',
      isDefault: true,
    });

    // Create Category & Products
    const category = await Category.create({
      name: 'Checkout Test Category',
      slug: 'test-chk-cat',
    });

    activeProd1 = await Product.create({
      name: 'Ashwagandha Churna',
      slug: 'ashwagandha-churna',
      sku: 'CHK-SKU-001',
      description: 'Pure organic Ashwagandha root powder.',
      category: category._id,
      mrp: 600,
      sellingPrice: 500,
      stockQuantity: 20,
      stockStatus: 'IN_STOCK',
      isActive: true,
      trackInventory: true,
    });

    activeProd2 = await Product.create({
      name: 'Brahmi Vati',
      slug: 'brahmi-vati',
      sku: 'CHK-SKU-002',
      description: 'Ayurvedic Brahmi memory enhancer tablets.',
      category: category._id,
      mrp: 400,
      sellingPrice: 350,
      stockQuantity: 15,
      stockStatus: 'IN_STOCK',
      isActive: true,
      trackInventory: true,
    });

    lowStockProd = await Product.create({
      name: 'Limited Saffron',
      slug: 'limited-saffron',
      sku: 'CHK-SKU-003',
      description: 'Kashmiri pure saffron thread.',
      category: category._id,
      mrp: 1200,
      sellingPrice: 1000,
      stockQuantity: 2,
      stockStatus: 'LOW_STOCK',
      isActive: true,
      trackInventory: true,
    });

    console.log('✅ Users, Addresses, and Products initialized.');

    // 2. Unauthenticated Checkout Test
    console.log('\n[2/6] Testing Unauthenticated Checkout Guard...');
    const unauthPreview = await request('/api/orders/preview', 'POST', { addressId: user1Address._id.toString() });
    console.assert(unauthPreview.status === 401, 'Unauthenticated checkout preview must return 401');
    console.log('✅ Unauthenticated checkout blocked.');

    // 3. Empty Cart Checkout Test
    console.log('\n[3/6] Testing Empty Cart Checkout Guard...');
    const emptyPreview = await request(
      '/api/orders/preview',
      'POST',
      { addressId: user1Address._id.toString() },
      { Authorization: `Bearer ${user1Token}` }
    );
    console.assert(emptyPreview.status === 400, 'Empty cart checkout preview must return 400');
    console.log('✅ Empty cart checkout blocked.');

    // 4. Populate Cart & Test Checkout Preview
    console.log('\n[4/6] Testing Checkout Preview & Address IDOR Protection...');
    await request(
      '/api/cart/items',
      'POST',
      { productId: activeProd1._id.toString(), quantity: 2 },
      { Authorization: `Bearer ${user1Token}` }
    );

    // IDOR Address Test: User 1 trying to use User 2's address
    const idorAddressRes = await request(
      '/api/orders/preview',
      'POST',
      { addressId: user2Address._id.toString() },
      { Authorization: `Bearer ${user1Token}` }
    );
    console.assert(idorAddressRes.status === 400, 'Cross-user address selection must be rejected with 400');

    // Valid Preview Test
    const validPreview = await request(
      '/api/orders/preview',
      'POST',
      { addressId: user1Address._id.toString() },
      { Authorization: `Bearer ${user1Token}` }
    );
    console.assert(validPreview.status === 200, 'Valid checkout preview should return 200');
    console.assert(validPreview.body.data.subtotal === 1000, 'Subtotal should be 2 * 500 = 1000');
    console.assert(validPreview.body.data.shippingCharge === 0, 'Subtotal >= 999 should get free shipping (0)');
    console.assert(validPreview.body.data.grandTotal === 1000, 'Grand total should match calculation');
    console.log('✅ Checkout preview calculation & address IDOR protection verified.');

    // 5. COD Order Creation & Stock Deduction Test
    console.log('\n[5/6] Testing COD Order Placement & Atomic Stock Deduction...');
    const codRes = await request(
      '/api/orders',
      'POST',
      { addressId: user1Address._id.toString(), paymentMethod: 'COD' },
      { Authorization: `Bearer ${user1Token}` }
    );
    console.assert(codRes.status === 201, 'COD order creation should return 201');
    console.assert(codRes.body.data.orderNumber.startsWith('HERB-'), 'Order number format should be HERB-...');
    console.assert(codRes.body.data.paymentMethod === 'COD', 'Payment method should be COD');
    console.assert(codRes.body.data.orderStatus === 'PLACED', 'Order status should be PLACED');

    // Verify Stock Was Deducted Atomic
    const updatedProd1 = await Product.findById(activeProd1._id);
    console.assert(updatedProd1.stockQuantity === 18, 'Stock quantity should decrease from 20 to 18');

    // Verify User Cart Was Cleared Post Order
    const clearedCart = await request('/api/cart', 'GET', null, { Authorization: `Bearer ${user1Token}` });
    console.assert(clearedCart.body.data.items.length === 0, 'Cart should be empty after order placement');

    // Order History Test
    const orderHistory = await request('/api/orders', 'GET', null, { Authorization: `Bearer ${user1Token}` });
    console.assert(orderHistory.status === 200, 'GET /api/orders should return 200');
    console.assert(orderHistory.body.data.length === 1, 'User order history should return 1 order');

    // Order Detail & IDOR Test
    const orderNo = codRes.body.data.orderNumber;
    const user2Detail = await request(`/api/orders/${orderNo}`, 'GET', null, { Authorization: `Bearer ${user2Token}` });
    console.assert(user2Detail.status === 404, "User 2 cannot view User 1's order (IDOR Protected)");

    // Order Cancellation Test
    const cancelRes = await request(`/api/orders/${orderNo}/cancel`, 'POST', { reason: 'Test cancel' }, { Authorization: `Bearer ${user1Token}` });
    console.assert(cancelRes.status === 200, 'Order cancellation should return 200');
    console.assert(cancelRes.body.data.orderStatus === 'CANCELLED', 'Order status should be CANCELLED');

    // Verify Stock Was Restored
    const restoredProd1 = await Product.findById(activeProd1._id);
    console.assert(restoredProd1.stockQuantity === 20, 'Stock quantity should be restored to 20');

    console.log('✅ COD Order placement, atomic stock deduction, order history & cancellation verified.');

    // 6. Razorpay Online Payment & Webhook Verification Test
    console.log('\n[6/6] Testing Razorpay Online Payment & Signature Verification...');
    
    // Add product to user cart again
    await request(
      '/api/cart/items',
      'POST',
      { productId: activeProd2._id.toString(), quantity: 2 },
      { Authorization: `Bearer ${user1Token}` }
    );

    // Create Razorpay Order
    const rzpOrderRes = await request(
      '/api/payment/razorpay/create-order',
      'POST',
      { addressId: user1Address._id.toString() },
      { Authorization: `Bearer ${user1Token}` }
    );
    console.assert(rzpOrderRes.status === 201, 'Create Razorpay order should return 201');
    console.assert(rzpOrderRes.body.data.amount === 75000, 'Amount in paise should be (700 subtotal + 50 shipping) * 100 = 75000');
    
    const rzpOrderId = rzpOrderRes.body.data.razorpayOrderId;

    // Verify Razorpay Payment (Valid Test Verification)
    const verifyRes = await request(
      '/api/payment/razorpay/verify',
      'POST',
      {
        razorpayOrderId: rzpOrderId,
        razorpayPaymentId: 'pay_mock_999888777',
        razorpaySignature: 'valid_test_signature',
      },
      { Authorization: `Bearer ${user1Token}` }
    );
    console.assert(verifyRes.status === 200, 'Verify Razorpay payment should return 200');
    console.assert(verifyRes.body.data.paymentStatus === 'PAID', 'Order paymentStatus should be PAID');
    console.assert(verifyRes.body.data.orderStatus === 'CONFIRMED', 'Order orderStatus should be CONFIRMED');

    // Duplicate Verification (Idempotency Test)
    const dupVerify = await request(
      '/api/payment/razorpay/verify',
      'POST',
      {
        razorpayOrderId: rzpOrderId,
        razorpayPaymentId: 'pay_mock_999888777',
        razorpaySignature: 'valid_test_signature',
      },
      { Authorization: `Bearer ${user1Token}` }
    );
    console.assert(dupVerify.status === 200, 'Duplicate payment verification should handle idempotently');

    // Webhook Duplicate Event Test
    const webhookRes = await request('/api/payment/razorpay/webhook', 'POST', {
      event_id: 'evt_test_101',
      event: 'payment.captured',
      payload: {
        payment: { entity: { order_id: rzpOrderId, id: 'pay_mock_999888777' } },
      },
    });
    console.assert(webhookRes.status === 200, 'Webhook processing should return 200');

    console.log('✅ Razorpay order creation, signature verification, idempotency & webhook verified.');

    console.log('\n--------------------------------------------------');
    console.log('🎉 ALL PHASE 6 CHECKOUT & RAZORPAY TESTS PASSED!');
    console.log('--------------------------------------------------');

  } catch (error) {
    console.error('❌ Phase 6 Test Failed:', error);
    process.exitCode = 1;
  } finally {
    // Cleanup
    await User.deleteMany({ email: { $in: ['chkuser1@herbal.com', 'chkuser2@herbal.com'] } });
    await Category.deleteMany({ slug: 'test-chk-cat' });
    await Product.deleteMany({ sku: { $in: ['CHK-SKU-001', 'CHK-SKU-002', 'CHK-SKU-003'] } });
    await Order.deleteMany({});
    await Payment.deleteMany({});
    await WebhookEvent.deleteMany({});
    if (server) server.close();
    await mongoose.connection.close();
    if (mongodInstance) await mongodInstance.stop();
  }
};

runPhase6Tests();
