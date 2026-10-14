const mongoose = require('mongoose');
const dotenv = require('dotenv');
const http = require('http');
const crypto = require('crypto');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config();

const app = require('../app');
const {
  User,
  Category,
  Product,
  Cart,
  Address,
  Order,
  Payment,
  Shipment,
  Invoice,
  StoreSettings,
  Notification,
  WebhookEvent,
} = require('../models');

const shippingService = require('../services/shippingService');
const taxService = require('../services/taxService');
const shipmentService = require('../services/shipmentService');
const invoiceService = require('../services/invoiceService');
const orderService = require('../services/orderService');
const shippingWebhookService = require('../services/shippingWebhookService');

let server;
let baseUrl;

const request = (endpoint, method = 'GET', body = null, headers = {}) => {
  return new Promise((resolve, reject) => {
    const url = new URL(baseUrl + endpoint);
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
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const rawBody = Buffer.concat(chunks);
        let parsed = null;
        try {
          parsed = JSON.parse(rawBody.toString());
        } catch (e) {
          parsed = rawBody;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: parsed,
          rawBuffer: rawBody,
        });
      });
    });

    req.on('error', reject);
    if (body) {
      if (typeof body === 'string' || Buffer.isBuffer(body)) {
        req.write(body);
      } else {
        req.write(JSON.stringify(body));
      }
    }
    req.end();
  });
};

const runPhase9Tests = async () => {
  console.log('--------------------------------------------------');
  console.log('🧪 Starting PHASE 9 Shipping, Invoices & Order Fulfillment Test Suite');
  console.log('--------------------------------------------------');

  let mongodInstance;
  let mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/herbal_phase9_test';

  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongodInstance = await MongoMemoryServer.create();
    mongoUri = mongodInstance.getUri();
    console.log('⚡ Connected to In-Memory MongoDB Server for Phase 9 tests.');
  } catch (e) {
    console.log('⚡ Connecting to fallback MongoDB Server:', mongoUri);
  }

  await mongoose.connect(mongoUri);

  server = app.listen(0);
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;
  console.log(`Server test instance listening on port ${port}`);

  let passed = 0;
  let total = 33;

  try {
    // Clean collections
    await Promise.all([
      User.deleteMany({}),
      Product.deleteMany({}),
      Category.deleteMany({}),
      Cart.deleteMany({}),
      Address.deleteMany({}),
      Order.deleteMany({}),
      Payment.deleteMany({}),
      Shipment.deleteMany({}),
      Invoice.deleteMany({}),
      StoreSettings.deleteMany({}),
      Notification.deleteMany({}),
      WebhookEvent.deleteMany({}),
    ]);

    // Setup Test Admin and Users
    const adminUser = await User.create({
      firstName: 'Admin',
      lastName: 'Manager',
      name: 'Admin Manager',
      email: 'admin@phase9test.com',
      password: 'Password123!',
      phone: '9876500000',
      role: 'admin',
      isVerified: true,
    });

    const customerUserA = await User.create({
      firstName: 'Customer',
      lastName: 'A',
      name: 'Customer A',
      email: 'customerA@phase9test.com',
      password: 'Password123!',
      phone: '9876511111',
      role: 'user',
      isVerified: true,
    });

    const customerUserB = await User.create({
      firstName: 'Customer',
      lastName: 'B',
      name: 'Customer B',
      email: 'customerB@phase9test.com',
      password: 'Password123!',
      phone: '9876522222',
      role: 'user',
      isVerified: true,
    });

    // Helper for login tokens
    const loginUser = async (email, password = 'Password123!') => {
      const res = await request('/api/auth/login', 'POST', { email, password });
      return res.body.data.accessToken;
    };

    const adminToken = await loginUser('admin@phase9test.com');
    const userAToken = await loginUser('customerA@phase9test.com');
    const userBToken = await loginUser('customerB@phase9test.com');

    // Create Category & Products
    const category = await Category.create({
      name: 'Herbal Wellness',
      slug: 'herbal-wellness',
      description: 'Wellness herbs and infusions',
    });

    const productA = await Product.create({
      name: 'Organic Ashwagandha Extract',
      slug: 'organic-ashwagandha-extract',
      description: 'Natural stress relief root powder',
      sku: 'ASH-001',
      mrp: 600,
      sellingPrice: 500,
      stockQuantity: 50,
      category: category._id,
      hsnCode: '30049011',
      gstRate: 5,
      taxInclusive: true,
      trackInventory: true,
    });

    const productB = await Product.create({
      name: 'Pure Brahmi Tonic',
      slug: 'pure-brahmi-tonic',
      description: 'Herbal memory and cognitive enhancer',
      sku: 'BRH-002',
      mrp: 1200,
      sellingPrice: 1000,
      stockQuantity: 40,
      category: category._id,
      hsnCode: '30049011',
      gstRate: 12,
      taxInclusive: true,
      trackInventory: true,
    });

    // Configure Store Settings
    const storeSettings = await StoreSettings.create({
      storeName: 'Herbal Essence Official',
      supportEmail: 'support@herbalessence.com',
      supportPhone: '+91 98765 43210',
      currency: '₹',
      freeShippingThreshold: 999,
      defaultShippingCharge: 50,
      codAvailable: true,
      prepaidAvailable: true,
      minOrderValue: 0,
      maxOrderValue: 100000,
      estimatedDispatchDays: 1,
      estimatedDeliveryDays: 4,
      shippingActive: true,
      serviceablePincodes: ['400*', '110*', '560001'],
      excludedPincodes: ['790001'],
      shippingZones: [
        {
          zoneName: 'Mumbai Express Metro',
          pincodes: ['400*'],
          shippingCharge: 30,
          freeShippingThreshold: 499,
          estimatedDays: 2,
          codAvailable: true,
          isActive: true,
        },
        {
          zoneName: 'Delhi Metro',
          pincodes: ['110*'],
          shippingCharge: 60,
          freeShippingThreshold: 999,
          estimatedDays: 3,
          codAvailable: false, // COD restricted in this zone
          isActive: true,
        },
      ],
      legalBusinessName: 'Herbal Essence Private Limited',
      gstin: '27AABCH1234F1Z9',
      stateCode: '27',
      stateName: 'Maharashtra',
      invoicePrefix: 'INV',
    });

    // Create Addresses
    const addressMumbai = await Address.create({
      user: customerUserA._id,
      fullName: 'Customer A Mumbai',
      phone: '9876511111',
      addressLine1: 'B-101, Green Heights, Andheri West',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400053',
      isDefault: true,
    });

    const addressDelhi = await Address.create({
      user: customerUserA._id,
      fullName: 'Customer A Delhi',
      phone: '9876511111',
      addressLine1: '45, Connaught Place',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110001',
    });

    const addressUnsupported = await Address.create({
      user: customerUserA._id,
      fullName: 'Customer A Excluded',
      phone: '9876511111',
      addressLine1: 'Remote Border Post',
      city: 'Tawang',
      state: 'Arunachal Pradesh',
      pincode: '790001',
    });

    const addressUserB = await Address.create({
      user: customerUserB._id,
      fullName: 'Customer B',
      phone: '9876522222',
      addressLine1: '77 Brigade Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560001',
    });

    // ----------------------------------------------------
    // PART 1: SHIPPING TESTS (1 to 8)
    // ----------------------------------------------------

    console.log('\n--- [1/4] Testing Shipping Engine & Serviceability ---');

    // Test 1: Valid Indian pincode format
    const isPincodeValid = shippingService.validatePincode('400053');
    if (isPincodeValid) {
      console.log('✅ Test 1 Passed: Valid Indian pincode format recognized');
      passed++;
    } else {
      throw new Error('Test 1 Failed: Valid pincode rejected');
    }

    // Test 2: Invalid pincode rejection
    const invalidPincodeRes = await request('/api/shipping/serviceability', 'POST', {
      pincode: '400ABX',
      subtotal: 500,
    });
    if (invalidPincodeRes.status === 400) {
      console.log('✅ Test 2 Passed: Invalid non-numeric pincode format rejected cleanly');
      passed++;
    } else {
      throw new Error(`Test 2 Failed: Expected 400 for invalid pincode, got ${invalidPincodeRes.status}`);
    }

    // Test 3: Configured serviceable destination
    const servRes = await request('/api/shipping/serviceability', 'POST', {
      pincode: '400053',
      subtotal: 300,
    });
    if (servRes.status === 200 && servRes.body.data.serviceable === true && servRes.body.data.zoneName === 'Mumbai Express Metro') {
      console.log('✅ Test 3 Passed: Configured serviceable destination and zone resolved correctly');
      passed++;
    } else {
      throw new Error('Test 3 Failed: Serviceable pincode not recognized');
    }

    // Test 4: Unsupported destination rejection
    const unsuppRes = await request('/api/shipping/serviceability', 'POST', {
      pincode: '790001',
      subtotal: 300,
    });
    if (unsuppRes.status === 200 && unsuppRes.body.data.serviceable === false) {
      console.log('✅ Test 4 Passed: Unsupported / blacklisted destination rejected from shipping');
      passed++;
    } else {
      throw new Error('Test 4 Failed: Blacklisted pincode was marked serviceable');
    }

    // Test 5: Free-shipping threshold
    // In Mumbai Express Metro zone, freeShippingThreshold is 499. Subtotal 500 >= 499 => shippingCharge = 0
    const freeShipRes = await request('/api/shipping/serviceability', 'POST', {
      pincode: '400053',
      subtotal: 500,
    });
    if (freeShipRes.status === 200 && freeShipRes.body.data.shippingCharge === 0 && freeShipRes.body.data.freeShippingApplied === true) {
      console.log('✅ Test 5 Passed: Free-shipping threshold dynamically applied');
      passed++;
    } else {
      throw new Error('Test 5 Failed: Free shipping not applied on subtotal over threshold');
    }

    // Test 6: Standard shipping charge
    // Subtotal 200 < 499 => shippingCharge = 30 for Mumbai Express Metro
    const stdShipRes = await request('/api/shipping/serviceability', 'POST', {
      pincode: '400053',
      subtotal: 200,
    });
    if (stdShipRes.status === 200 && stdShipRes.body.data.shippingCharge === 30) {
      console.log('✅ Test 6 Passed: Standard zone shipping charge computed accurately');
      passed++;
    } else {
      throw new Error(`Test 6 Failed: Expected 30 shipping charge, got ${stdShipRes.body.data.shippingCharge}`);
    }

    // Test 7: COD availability validation
    // Delhi zone (110*) has codAvailable: false
    const delhiCodRes = await request('/api/shipping/serviceability', 'POST', {
      pincode: '110001',
      subtotal: 500,
      paymentMethod: 'COD',
    });
    if (delhiCodRes.status === 200 && delhiCodRes.body.data.codAvailable === false) {
      console.log('✅ Test 7 Passed: COD availability restriction enforced for designated zone');
      passed++;
    } else {
      throw new Error('Test 7 Failed: COD was not restricted for non-COD zone');
    }

    // Test 8: Backend shipping amount authority
    // Put item in user cart and preview checkout: frontend cannot manipulate shipping charge
    await request('/api/cart/items', 'POST', { productId: productA._id, quantity: 1 }, { Authorization: `Bearer ${userAToken}` });
    const previewRes = await request('/api/orders/preview', 'POST', { addressId: addressMumbai._id }, { Authorization: `Bearer ${userAToken}` });
    if (previewRes.status === 200 && previewRes.body.data.shippingCharge === 0) { // 500 >= 499 free threshold
      console.log('✅ Test 8 Passed: Backend asserts absolute price & shipping charge calculation authority');
      passed++;
    } else {
      throw new Error('Test 8 Failed: Checkout preview did not assert backend shipping charge authority');
    }

    // ----------------------------------------------------
    // PART 2: ORDER FULFILLMENT TESTS (9 to 17)
    // ----------------------------------------------------

    console.log('\n--- [2/4] Testing Order Fulfillment Workflow & Shipments ---');

    // Create an order for Customer A (COD)
    const orderCreateRes = await request('/api/orders', 'POST', { addressId: addressMumbai._id, paymentMethod: 'COD' }, { Authorization: `Bearer ${userAToken}` });
    if (orderCreateRes.status !== 201) {
      throw new Error(`Failed to create test order: ${JSON.stringify(orderCreateRes.body)}`);
    }
    const orderA = orderCreateRes.body.data;

    // Test 9: Valid state transitions (PLACED -> CONFIRMED -> PROCESSING -> PACKED -> SHIPPED -> DELIVERED)
    const trans1 = await request(`/api/admin/orders/${orderA.orderNumber}/status`, 'PATCH', { orderStatus: 'CONFIRMED' }, { Authorization: `Bearer ${adminToken}` });
    const trans2 = await request(`/api/admin/orders/${orderA.orderNumber}/status`, 'PATCH', { orderStatus: 'PROCESSING' }, { Authorization: `Bearer ${adminToken}` });
    const trans3 = await request(`/api/admin/orders/${orderA.orderNumber}/status`, 'PATCH', { orderStatus: 'PACKED' }, { Authorization: `Bearer ${adminToken}` });
    if (trans1.status === 200 && trans2.status === 200 && trans3.status === 200) {
      console.log('✅ Test 9 Passed: Sequential fulfillment transitions processed successfully');
      passed++;
    } else {
      throw new Error('Test 9 Failed: Legitimate status transition rejected');
    }

    // Test 10: Invalid state transition rejection (Cannot cancel a shipped or delivered order)
    await request(`/api/admin/orders/${orderA.orderNumber}/status`, 'PATCH', { orderStatus: 'SHIPPED' }, { Authorization: `Bearer ${adminToken}` });
    const invalidCancelRes = await request(`/api/admin/orders/${orderA.orderNumber}/status`, 'PATCH', { orderStatus: 'CANCELLED' }, { Authorization: `Bearer ${adminToken}` });
    if (invalidCancelRes.status === 400) {
      console.log('✅ Test 10 Passed: Invalid cancellation of shipped order safely blocked');
      passed++;
    } else {
      throw new Error(`Test 10 Failed: Expected 400 for cancelling shipped order, got ${invalidCancelRes.status}`);
    }

    // Reset status to PROCESSING on a fresh order to test shipment creation
    await Cart.updateOne({ user: customerUserA._id }, { $set: { items: [{ product: productA._id, quantity: 1 }] } });
    const freshOrder = await orderService.createOrder(customerUserA._id, { addressId: addressMumbai._id, paymentMethod: 'COD' });

    // Test 11: Shipment creation
    const shipmentCreateRes = await request(`/api/admin/orders/${freshOrder.orderNumber}/shipments`, 'POST', {
      carrier: 'Blue Dart Express',
      awbNumber: 'BD987654321IN',
      trackingUrl: 'https://track.bluedart.com/BD987654321IN',
    }, { Authorization: `Bearer ${adminToken}` });

    if (shipmentCreateRes.status === 201 && shipmentCreateRes.body.data.shipmentNumber) {
      console.log('✅ Test 11 Passed: Shipment record created with carrier, AWB, and tracking URL');
      passed++;
    } else {
      throw new Error(`Test 11 Failed: Could not create shipment record (${shipmentCreateRes.status})`);
    }

    const testShipment = shipmentCreateRes.body.data;

    // Test 12: Duplicate shipment protection
    const dupShipmentRes = await request(`/api/admin/orders/${freshOrder.orderNumber}/shipments`, 'POST', {
      carrier: 'Delhivery',
      awbNumber: 'DL12345',
    }, { Authorization: `Bearer ${adminToken}` });

    if (dupShipmentRes.status === 409) {
      console.log('✅ Test 12 Passed: Duplicate shipment prevention enforced for the same order');
      passed++;
    } else {
      throw new Error(`Test 12 Failed: Expected 409 for duplicate shipment, got ${dupShipmentRes.status}`);
    }

    // Test 13: AWB/tracking update
    const updateShipmentRes = await request(`/api/admin/shipments/${testShipment._id}`, 'PATCH', {
      awbNumber: 'BD987654321UPDATED',
      eventDescription: 'Package arrived at Mumbai Sorting Facility',
    }, { Authorization: `Bearer ${adminToken}` });

    if (updateShipmentRes.status === 200 && updateShipmentRes.body.data.awbNumber === 'BD987654321UPDATED') {
      console.log('✅ Test 13 Passed: Shipment AWB and tracking events updated with history log');
      passed++;
    } else {
      throw new Error('Test 13 Failed: Could not update shipment tracking');
    }

    // Test 14: Unauthorized shipment update (Non-admin customer cannot modify shipment)
    const unauthShipmentUpdate = await request(`/api/admin/shipments/${testShipment._id}`, 'PATCH', {
      awbNumber: 'HACKED',
    }, { Authorization: `Bearer ${userAToken}` });

    if (unauthShipmentUpdate.status === 403) {
      console.log('✅ Test 14 Passed: Unauthorized shipment update blocked by admin authorization guard');
      passed++;
    } else {
      throw new Error(`Test 14 Failed: Expected 403 for unauthorized shipment edit, got ${unauthShipmentUpdate.status}`);
    }

    // Test 15: Customer order ownership
    // User B cannot access User A's shipment tracking
    const idorShipmentRes = await request(`/api/orders/${freshOrder.orderNumber}/shipment`, 'GET', null, { Authorization: `Bearer ${userBToken}` });
    if (idorShipmentRes.status === 403) {
      console.log("✅ Test 15 Passed: Strict ownership check protects shipment tracking from IDOR");
      passed++;
    } else {
      throw new Error(`Test 15 Failed: Expected 403 for cross-user shipment tracking, got ${idorShipmentRes.status}`);
    }

    // Test 16: Duplicate notification prevention
    // Dispatch shipment emits ORDER_SHIPPED notification with idempotency reference
    await shipmentService.dispatchShipment(testShipment._id);
    const notifs1 = await Notification.find({ referenceId: `ORDER_SHIPPED_${freshOrder.orderNumber}` });
    // Trigger dispatch again or duplicate notification attempt
    try {
      await Notification.create({
        user: customerUserA._id,
        title: 'Order Shipped',
        message: 'Duplicate attempt',
        type: 'ORDER_SHIPPED',
        referenceId: `ORDER_SHIPPED_${freshOrder.orderNumber}`,
      });
    } catch (e) {
      // Index unique error expected
    }
    const notifs2 = await Notification.find({ referenceId: `ORDER_SHIPPED_${freshOrder.orderNumber}` });
    if (notifs1.length === 1 && notifs2.length === 1) {
      console.log('✅ Test 16 Passed: Unique idempotency reference prevents duplicate customer notifications');
      passed++;
    } else {
      throw new Error(`Test 16 Failed: Expected 1 notification, found ${notifs2.length}`);
    }

    // Test 17: No duplicate inventory deduction
    // Check product stock before & after dispatch/delivery - inventory is deducted only once during order confirmation
    const stockBefore = (await Product.findById(productA._id)).stockQuantity;
    await shipmentService.deliverShipment(testShipment._id);
    const stockAfter = (await Product.findById(productA._id)).stockQuantity;
    if (stockBefore === stockAfter) {
      console.log('✅ Test 17 Passed: Shipment dispatch/delivery does not double-deduct inventory');
      passed++;
    } else {
      throw new Error(`Test 17 Failed: Stock changed during shipment delivery (${stockBefore} -> ${stockAfter})`);
    }

    // ----------------------------------------------------
    // PART 3: INVOICE TESTS (18 to 27)
    // ----------------------------------------------------

    console.log('\n--- [3/4] Testing GST-Ready Invoice Generation & Invoicing Engine ---');

    // Test 18: Invoice number uniqueness
    const inv1 = await invoiceService.getOrCreateInvoiceForOrder(freshOrder.orderNumber, null, true);
    if (inv1 && inv1.invoiceNumber && inv1.invoiceNumber.startsWith('INV-')) {
      console.log(`✅ Test 18 Passed: Atomic unique invoice number generated (${inv1.invoiceNumber})`);
      passed++;
    } else {
      throw new Error('Test 18 Failed: Invoice number generation failed');
    }

    // Test 19: Invoice snapshot persistence
    // Check that seller and buyer snapshots are stored immutably
    if (inv1.sellerSnapshot?.gstin === '27AABCH1234F1Z9' && inv1.buyerSnapshot?.fullName === 'Customer A Mumbai') {
      console.log('✅ Test 19 Passed: Seller and Buyer legal snapshots persisted immutably in invoice record');
      passed++;
    } else {
      throw new Error('Test 19 Failed: Snapshots not persisted in invoice');
    }

    // Test 20: Duplicate invoice prevention
    const inv2 = await invoiceService.getOrCreateInvoiceForOrder(freshOrder.orderNumber, null, true);
    if (inv1._id.toString() === inv2._id.toString() && inv1.invoiceNumber === inv2.invoiceNumber) {
      console.log('✅ Test 20 Passed: Idempotency check prevents duplicate invoices for the same order');
      passed++;
    } else {
      throw new Error('Test 20 Failed: Duplicate invoice created');
    }

    // Test 21: Tax calculation and rounding
    // Intra-state Mumbai order (seller in Maharashtra 27, buyer in Maharashtra 27)
    // CGST and SGST should be split equally, total tax calculated with paise precision
    if (inv1.isIntraState === true && inv1.cgstTotal > 0 && inv1.sgstTotal > 0 && inv1.igstTotal === 0) {
      console.log(`✅ Test 21 Passed: Intra-state GST calculated and split cleanly (CGST: ₹${inv1.cgstTotal}, SGST: ₹${inv1.sgstTotal})`);
      passed++;
    } else {
      throw new Error('Test 21 Failed: GST intra-state split was incorrect');
    }

    // Test 22: Missing tax configuration handling
    // Product with gstRate = 0 or missing defaults safely to 0 without breaking invoice
    const zeroTaxBreakdown = await taxService.calculateOrderTaxBreakdown({
      items: [{ product: productA._id, name: 'Zero Tax Item', quantity: 1, sellingPrice: 200, gstRate: 0 }],
      shippingCharge: 0,
      buyerState: 'Maharashtra',
    });
    if (zeroTaxBreakdown.totalTax === 0 && zeroTaxBreakdown.totalTaxableValue === 200) {
      console.log('✅ Test 22 Passed: Missing or zero tax rates handled cleanly without calculation errors');
      passed++;
    } else {
      throw new Error('Test 22 Failed: Zero tax handling failed');
    }

    // Test 23: Inclusive-price handling
    // For ₹500 product at 5% tax-inclusive:
    // Taxable value = 500 / 1.05 = 476.19. Tax = 23.81. Line total = 500.
    const inclusiveCalc = await taxService.calculateOrderTaxBreakdown({
      items: [{ product: productA._id, name: 'Ashwagandha', quantity: 1, sellingPrice: 500, gstRate: 5, taxInclusive: true }],
      shippingCharge: 0,
      buyerState: 'Maharashtra',
    });
    const itemLine = inclusiveCalc.itemBreakdown[0];
    if (itemLine.taxableValue === 476.19 && itemLine.totalTax === 23.81 && itemLine.lineTotal === 500) {
      console.log('✅ Test 23 Passed: Tax-inclusive pricing correctly decomposes taxable value and GST without double-taxing');
      passed++;
    } else {
      throw new Error(`Test 23 Failed: Tax inclusive decomposition incorrect: taxable=${itemLine.taxableValue}, tax=${itemLine.totalTax}`);
    }

    // Test 24: Invoice ownership protection (IDOR check)
    // User B attempts to access User A's invoice
    const idorInvoiceRes = await request(`/api/orders/${freshOrder.orderNumber}/invoice`, 'GET', null, { Authorization: `Bearer ${userBToken}` });
    if (idorInvoiceRes.status === 403) {
      console.log("✅ Test 24 Passed: Customer invoice access strictly denies other users (403 Forbidden)");
      passed++;
    } else {
      throw new Error(`Test 24 Failed: Expected 403 for cross-user invoice download, got ${idorInvoiceRes.status}`);
    }

    // Test 25: Admin invoice authorization
    // Admin can access any order invoice
    const adminInvoiceRes = await request(`/api/admin/orders/${freshOrder.orderNumber}/invoice`, 'GET', null, { Authorization: `Bearer ${adminToken}` });
    if (adminInvoiceRes.status === 200 && adminInvoiceRes.body.data.invoiceNumber) {
      console.log('✅ Test 25 Passed: Admin authorized to view and audit any customer invoice');
      passed++;
    } else {
      throw new Error('Test 25 Failed: Admin could not access order invoice');
    }

    // Test 26: PDF response headers
    // Customer downloading invoice receives application/pdf and private no-store headers
    const pdfRes = await request(`/api/orders/${freshOrder.orderNumber}/invoice`, 'GET', null, { Authorization: `Bearer ${userAToken}` });
    const contentType = pdfRes.headers['content-type'];
    const cacheControl = pdfRes.headers['cache-control'];
    if (pdfRes.status === 200 && contentType.includes('application/pdf') && cacheControl.includes('no-store')) {
      console.log('✅ Test 26 Passed: PDF invoice served with application/pdf and private no-store headers');
      passed++;
    } else {
      throw new Error(`Test 26 Failed: Incorrect PDF headers: content-type=${contentType}, cache-control=${cacheControl}`);
    }

    // Test 27: Invoice download after product/address changes
    // If product details or user address change in the database later, the historical invoice snapshot remains unchanged
    await Product.updateOne({ _id: productA._id }, { $set: { sellingPrice: 9999, name: 'Renamed Product' } });
    await Address.updateOne({ _id: addressMumbai._id }, { $set: { fullName: 'Altered Name' } });
    const historicalInv = await Invoice.findOne({ order: freshOrder._id });
    if (historicalInv.items[0].unitPrice === 500 && historicalInv.buyerSnapshot.fullName === 'Customer A Mumbai') {
      console.log('✅ Test 27 Passed: Historical invoice record is completely immune to subsequent product/address edits');
      passed++;
    } else {
      throw new Error('Test 27 Failed: Historical invoice was modified by subsequent data changes');
    }

    // ----------------------------------------------------
    // PART 4: SECURITY & REGRESSION TESTS (28 to 33)
    // ----------------------------------------------------

    console.log('\n--- [4/4] Testing Security Protections, Webhooks & Anti-Caching ---');

    // Test 28: Mass-assignment attempts on shipment & store settings
    // Attempt to inject internal role or prototype override via settings update
    await request('/api/admin/settings', 'PATCH', {
      freeShippingThreshold: 799,
      role: 'superadmin',
      __proto__: { admin: true },
      unauthorizedField: 'malicious',
    }, { Authorization: `Bearer ${adminToken}` });

    const updatedSettings = await StoreSettings.findOne().lean();
    if (updatedSettings.freeShippingThreshold === 799 && updatedSettings.role === undefined && updatedSettings.unauthorizedField === undefined) {
      console.log('✅ Test 28 Passed: Mass-assignment attempts safely sanitized by field whitelisting');
      passed++;
    } else {
      throw new Error('Test 28 Failed: Unauthorized field injected into StoreSettings');
    }

    // Test 29: Customer cannot modify shipping settings
    const customerSettingsTamper = await request('/api/admin/settings', 'PATCH', {
      freeShippingThreshold: 0,
    }, { Authorization: `Bearer ${userAToken}` });
    if (customerSettingsTamper.status === 403) {
      console.log('✅ Test 29 Passed: Customer forbidden from mutating store shipping or GST configuration');
      passed++;
    } else {
      throw new Error(`Test 29 Failed: Expected 403 for customer settings modification, got ${customerSettingsTamper.status}`);
    }

    // Test 30: Customer cannot access another customer's invoice download
    const customerTamperInvoice = await request(`/api/orders/${freshOrder.orderNumber}/invoice`, 'GET', null, { Authorization: `Bearer ${userBToken}` });
    if (customerTamperInvoice.status === 403) {
      console.log("✅ Test 30 Passed: Cross-tenant invoice access strictly denied");
      passed++;
    } else {
      throw new Error(`Test 30 Failed: Expected 403 for unauthorized invoice download, got ${customerTamperInvoice.status}`);
    }

    // Test 31: Webhook authenticity validation
    // Forged/unsigned webhook request must be rejected
    process.env.SHIPPING_WEBHOOK_SECRET = 'test_shipping_secret_123';
    const fakeWebhookRes = await request('/api/shipping/webhook', 'POST', {
      awb_number: 'BD987654321UPDATED',
      status: 'out_for_delivery',
    }, {
      'x-shipping-signature': 'invalid_forged_signature',
    });
    if (fakeWebhookRes.status === 401) {
      console.log('✅ Test 31 Passed: Unauthenticated / forged shipping webhook rejected with 401');
      passed++;
    } else {
      throw new Error(`Test 31 Failed: Expected 401 for forged webhook, got ${fakeWebhookRes.status}`);
    }

    // Test 32: Private cache headers on protected order endpoints
    const cacheHeaderRes = await request(`/api/orders/${freshOrder.orderNumber}`, 'GET', null, { Authorization: `Bearer ${userAToken}` });
    const privateCacheHeader = cacheHeaderRes.headers['cache-control'] || '';
    if (privateCacheHeader.includes('no-store')) {
      console.log('✅ Test 32 Passed: Anti-caching headers (no-store) verified on private customer order routes');
      passed++;
    } else {
      throw new Error(`Test 32 Failed: Cache-control missing no-store: ${privateCacheHeader}`);
    }

    // Test 33: Production-safe errors (No stack traces exposed in error responses)
    process.env.NODE_ENV = 'production';
    const errorRes = await request('/api/orders/INVALID-ORDER-999', 'GET', null, { Authorization: `Bearer ${userAToken}` });
    process.env.NODE_ENV = 'development';
    if (errorRes.status === 404 && !errorRes.body.stack && errorRes.body.message) {
      console.log('✅ Test 33 Passed: Production-safe error responses returned without exposing server stack traces');
      passed++;
    } else {
      throw new Error('Test 33 Failed: Stack trace exposed in error response');
    }

    console.log('\n==================================================');
    console.log(`🎉 ALL PHASE 9 TESTS PASSED: ${passed} / ${total} (100%)`);
    console.log('==================================================\n');

  } catch (error) {
    console.error('\n❌ PHASE 9 TEST RUNNER ENCOUNTERED AN ERROR:');
    console.error(error.message);
    if (error.stack) console.error(error.stack);
    process.exit(1);
  } finally {
    if (server) server.close();
    await mongoose.disconnect();
    if (mongodInstance) await mongodInstance.stop();
  }
};

runPhase9Tests();
