const mongoose = require('mongoose');
const dotenv = require('dotenv');
const crypto = require('crypto');
dotenv.config();

// Ensure test environment is explicit
process.env.NODE_ENV = 'test';

const { User, Product, Category, Order, Payment, Cart, Address, Coupon, Session } = require('../models');
const { createRazorpayOrder, verifyRazorpayPayment } = require('../services/paymentService');
const { createOrder, cancelOrder, validateAndCalculateCheckout } = require('../services/orderService');
const { validateCoupon, redeemCoupon, releaseCoupon } = require('../services/couponService');
const { getJwtSecret } = require('../utils/authUtils');
const ApiError = require('../utils/ApiError');

const runRemediationTests = async () => {
  console.log('--------------------------------------------------');
  console.log('🧪 Starting REMEDIATION PHASE A Validation Suite');
  console.log('--------------------------------------------------');

  const { MongoMemoryServer } = require('mongodb-memory-server');
  const mongodInstance = await MongoMemoryServer.create();
  const mongoUri = mongodInstance.getUri();
  await mongoose.connect(mongoUri);
  console.log('⚡ Connected to In-Memory MongoDB for Remediation tests.');

  let passed = 0;
  let total = 10;

  try {
    // ----------------------------------------------------
    // TEST 1: Razorpay SDK Availability
    // ----------------------------------------------------
    console.log('\n▶ Test 1: Razorpay Official SDK Dependency');
    const Razorpay = require('razorpay');
    if (typeof Razorpay === 'function') {
      console.log('  ✅ Razorpay Node.js SDK is installed and loadable.');
      passed++;
    } else {
      throw new Error('Razorpay SDK is not a function');
    }

    // ----------------------------------------------------
    // TEST 2: Mock Signature Bypass Rejected in Non-Test (Simulated Production)
    // ----------------------------------------------------
    console.log('\n▶ Test 2: Mock Signature Verification Strict Bypass Guard');
    const testUser = await User.create({
      firstName: 'Test',
      lastName: 'Payer',
      name: 'Test Payer',
      email: 'payer@remediation.com',
      phone: '9876543210',
      password: 'Password123!',
      role: 'user',
    });

    const category = await Category.create({
      name: 'Herbs',
      slug: 'herbs-rem',
    });

    const product = await Product.create({
      name: 'Brahmi Extract',
      slug: 'brahmi-rem',
      sku: 'BRAHMI-001',
      description: 'Herbal extract',
      mrp: 500,
      sellingPrice: 400,
      stockQuantity: 10,
      category: category._id,
      images: [{ url: 'https://example.com/b.jpg' }],
    });

    const address = await Address.create({
      user: testUser._id,
      fullName: 'Test Payer',
      phone: '9876543210',
      addressLine1: 'Street 1',
      city: 'Bhopal',
      state: 'Madhya Pradesh',
      pincode: '462001',
      country: 'India',
    });

    await Cart.create({
      user: testUser._id,
      items: [{ product: product._id, quantity: 1, price: 400 }],
    });

    const rzpOrder = await createRazorpayOrder(testUser._id, address._id);

    // Temporarily simulate production environment
    process.env.NODE_ENV = 'production';
    let prodBypassBlocked = false;
    try {
      await verifyRazorpayPayment(testUser._id, {
        razorpayOrderId: rzpOrder.razorpayOrderId,
        razorpayPaymentId: 'pay_fake_123',
        razorpaySignature: 'invalid_signature_attempt',
      });
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 400) {
        prodBypassBlocked = true;
      }
    } finally {
      process.env.NODE_ENV = 'test';
    }

    if (prodBypassBlocked) {
      console.log('  ✅ Mock signature bypass strictly rejected when NODE_ENV === "production".');
      passed++;
    } else {
      throw new Error('Signature verification bypass allowed forged signature in production mode!');
    }

    // ----------------------------------------------------
    // TEST 3: Legitimate HMAC Signature Verification in Test Mode
    // ----------------------------------------------------
    console.log('\n▶ Test 3: Valid Cryptographic HMAC-SHA256 Signature Passes');
    const secret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_mock_secret';
    process.env.RAZORPAY_KEY_SECRET = secret;

    const fakePaymentId = 'pay_legit_999888';
    const validSignature = crypto
      .createHmac('sha256', secret)
      .update(`${rzpOrder.razorpayOrderId}|${fakePaymentId}`)
      .digest('hex');

    const confirmedOrder = await verifyRazorpayPayment(testUser._id, {
      razorpayOrderId: rzpOrder.razorpayOrderId,
      razorpayPaymentId: fakePaymentId,
      razorpaySignature: validSignature,
    });

    if (confirmedOrder.paymentStatus === 'PAID' && confirmedOrder.orderStatus === 'CONFIRMED') {
      console.log('  ✅ Legitimate HMAC SHA-256 signature accepted and order confirmed.');
      passed++;
    } else {
      throw new Error('Valid HMAC signature verification failed');
    }

    // ----------------------------------------------------
    // TEST 4: Atomic Inventory Deduction on Concurrent Exhaustion (Out-of-Stock Recovery)
    // ----------------------------------------------------
    console.log('\n▶ Test 4: Inventory Deduction Check & Safe Recovery on Stock Depletion');
    const scarceProduct = await Product.create({
      name: 'Rare Saffron',
      slug: 'rare-saffron',
      sku: 'SAFFRON-001',
      description: 'Limited saffron',
      mrp: 1000,
      sellingPrice: 900,
      stockQuantity: 1, // Only 1 unit in stock!
      category: category._id,
      images: [{ url: 'https://example.com/s.jpg' }],
    });

    await Cart.findOneAndUpdate(
      { user: testUser._id },
      { $set: { items: [{ product: scarceProduct._id, quantity: 1, price: 900 }] } },
      { upsert: true }
    );

    // Customer initiates online order
    const rzpOrder2 = await createRazorpayOrder(testUser._id, address._id);

    // Another buyer depletes the stock to 0 concurrently before payment confirmation
    await Product.updateOne({ _id: scarceProduct._id }, { $set: { stockQuantity: 0 } });

    // Customer completes payment, but stock is now 0!
    let oosHandled = false;
    try {
      const sig2 = crypto
        .createHmac('sha256', secret)
        .update(`${rzpOrder2.razorpayOrderId}|pay_oos_111`)
        .digest('hex');

      await verifyRazorpayPayment(testUser._id, {
        razorpayOrderId: rzpOrder2.razorpayOrderId,
        razorpayPaymentId: 'pay_oos_111',
        razorpaySignature: sig2,
      });
    } catch (err) {
      if (err.statusCode === 409) {
        oosHandled = true;
      }
    }

    const updatedOrder2 = await Order.findOne({ razorpayOrderId: rzpOrder2.razorpayOrderId });
    const updatedPayment2 = await Payment.findOne({ providerOrderId: rzpOrder2.razorpayOrderId });

    if (
      oosHandled &&
      updatedOrder2.orderStatus === 'OUT_OF_STOCK_PENDING_REFUND' &&
      updatedOrder2.paymentStatus === 'REFUND_PENDING' &&
      updatedPayment2.refundStatus === 'PENDING'
    ) {
      console.log('  ✅ Concurrent stock exhaustion safely transitioned to OUT_OF_STOCK_PENDING_REFUND.');
      passed++;
    } else {
      throw new Error(`Out of stock recovery failed: status=${updatedOrder2?.orderStatus}`);
    }

    // ----------------------------------------------------
    // TEST 5: Partial Inventory Failure Compensating Rollback
    // ----------------------------------------------------
    console.log('\n▶ Test 5: Multi-Item COD Order Stock Deduction Rollback on Partial Depletion');
    const itemA = await Product.create({
      name: 'Item A',
      slug: 'item-a',
      sku: 'ITEM-A',
      description: 'Desc A',
      mrp: 300,
      sellingPrice: 200,
      stockQuantity: 5,
      category: category._id,
      images: [{ url: 'https://example.com/a.jpg' }],
    });

    const itemB = await Product.create({
      name: 'Item B',
      slug: 'item-b',
      sku: 'ITEM-B',
      description: 'Desc B',
      mrp: 300,
      sellingPrice: 200,
      stockQuantity: 0, // Out of stock!
      category: category._id,
      images: [{ url: 'https://example.com/b.jpg' }],
    });

    // Populate cart with Item A (in stock) and Item B (out of stock)
    await Cart.updateOne(
      { user: testUser._id },
      {
        $set: {
          items: [
            { product: itemA._id, quantity: 1, price: 200 },
            { product: itemB._id, quantity: 1, price: 200 },
          ],
        },
      }
    );

    let partialFailed = false;
    try {
      await createOrder(testUser._id, { addressId: address._id, paymentMethod: 'COD' });
    } catch (err) {
      if (err.statusCode === 400 || err.statusCode === 409) {
        partialFailed = true;
      }
    }

    // Verify Item A was NOT permanently deducted
    const recheckedItemA = await Product.findById(itemA._id);
    if (partialFailed && recheckedItemA.stockQuantity === 5) {
      console.log('  ✅ Compensating rollback verified: Item A inventory remained intact (5).');
      passed++;
    } else {
      throw new Error(`Inventory rollback failed: Item A stock is ${recheckedItemA?.stockQuantity}`);
    }

    // ----------------------------------------------------
    // TEST 6: Atomic Coupon Usage Limit Enforcement
    // ----------------------------------------------------
    console.log('\n▶ Test 6: Coupon Global Usage Limit Enforcement');
    const singleUseCoupon = await Coupon.create({
      code: 'FLASH100',
      discountType: 'fixed',
      discountAmount: 100,
      minPurchaseAmount: 100,
      expiryDate: new Date(Date.now() + 86400000),
      usageLimit: 1, // Only 1 use allowed globally!
      usedCount: 0,
      isActive: true,
    });

    const orderId1 = new mongoose.Types.ObjectId();
    const orderId2 = new mongoose.Types.ObjectId();

    // First redemption succeeds
    const redeem1 = await redeemCoupon('FLASH100', testUser._id, orderId1);
    const couponAfter1 = await Coupon.findOne({ code: 'FLASH100' });

    // Second redemption must fail
    let redeem2Failed = false;
    try {
      await redeemCoupon('FLASH100', testUser._id, orderId2);
    } catch (err) {
      redeem2Failed = true;
    }

    if (redeem1 === true && couponAfter1.usedCount === 1 && redeem2Failed) {
      console.log('  ✅ Global usage limit (1) enforced: Second redemption blocked.');
      passed++;
    } else {
      throw new Error(`Coupon usage limit failed: usedCount=${couponAfter1?.usedCount}`);
    }

    // ----------------------------------------------------
    // TEST 7: Per-User Coupon Limit Enforcement
    // ----------------------------------------------------
    console.log('\n▶ Test 7: Per-User Coupon Redemption Limit');
    await Coupon.create({
      code: 'WELCOME50',
      discountType: 'fixed',
      discountAmount: 50,
      minPurchaseAmount: 100,
      expiryDate: new Date(Date.now() + 86400000),
      usageLimit: 100, // Global limit high
      userUsageLimit: 1, // 1 per user
      usedCount: 0,
      isActive: true,
    });

    const userB = await User.create({
      firstName: 'Second',
      lastName: 'User',
      email: 'userb@rem.com',
      phone: '9876543219',
      password: 'Password123!',
      role: 'user',
    });

    // TestUser redeems once
    await redeemCoupon('WELCOME50', testUser._id, new mongoose.Types.ObjectId());

    // TestUser attempts second redemption (should fail)
    let userRepeatFailed = false;
    try {
      await redeemCoupon('WELCOME50', testUser._id, new mongoose.Types.ObjectId());
    } catch (err) {
      userRepeatFailed = true;
    }

    // User B attempts redemption (should succeed)
    const userBRedeem = await redeemCoupon('WELCOME50', userB._id, new mongoose.Types.ObjectId());

    if (userRepeatFailed && userBRedeem === true) {
      console.log('  ✅ Per-user coupon limit enforced: Repeat user blocked, new user accepted.');
      passed++;
    } else {
      throw new Error('Per-user coupon limit enforcement failed');
    }

    // ----------------------------------------------------
    // TEST 8: Paid Order Cancellation & Refund Pending Transition
    // ----------------------------------------------------
    console.log('\n▶ Test 8: Paid Order Cancellation & Idempotent Refund Workflow');
    const orderToCancel = await Order.create({
      orderNumber: 'ORD-REF-TEST-001',
      user: testUser._id,
      items: [
        {
          product: itemA._id,
          name: 'Item A',
          quantity: 2,
          mrp: 300,
          sellingPrice: 200,
          subtotal: 400,
        },
      ],
      shippingAddress: address,
      billingAddress: address,
      subtotal: 400,
      shippingCharge: 50,
      tax: 0,
      grandTotal: 450,
      paymentMethod: 'ONLINE',
      paymentStatus: 'PAID',
      orderStatus: 'CONFIRMED',
      placedAt: new Date(),
    });

    await Payment.create({
      user: testUser._id,
      order: orderToCancel._id,
      provider: 'RAZORPAY',
      providerOrderId: 'order_test_ref_123',
      amount: 450,
      status: 'PAID',
      method: 'ONLINE',
    });

    const initialStockItemA = (await Product.findById(itemA._id)).stockQuantity;

    // Customer cancels the order
    const cancelledOrder = await cancelOrder(testUser._id, orderToCancel.orderNumber, 'Customer changed mind');
    const recheckedPayment = await Payment.findOne({ order: orderToCancel._id });
    const stockAfterCancel = (await Product.findById(itemA._id)).stockQuantity;

    // Verify second cancellation is rejected idempotently
    let secondCancelBlocked = false;
    try {
      await cancelOrder(testUser._id, orderToCancel.orderNumber);
    } catch (err) {
      if (err.statusCode === 400) {
        secondCancelBlocked = false || true;
      }
    }

    const stockAfterSecondCancel = (await Product.findById(itemA._id)).stockQuantity;

    if (
      cancelledOrder.orderStatus === 'CANCELLED' &&
      cancelledOrder.paymentStatus === 'REFUND_PENDING' &&
      recheckedPayment.status === 'REFUND_PENDING' &&
      recheckedPayment.refundStatus === 'PENDING' &&
      recheckedPayment.refundAmount === 450 &&
      stockAfterCancel === initialStockItemA + 2 &&
      stockAfterSecondCancel === stockAfterCancel &&
      secondCancelBlocked
    ) {
      console.log('  ✅ Paid cancellation correctly set REFUND_PENDING and restored stock exactly once.');
      passed++;
    } else {
      throw new Error('Paid order cancellation / refund workflow verification failed');
    }

    // ----------------------------------------------------
    // TEST 9: JWT Secret Validation (Production Enforced)
    // ----------------------------------------------------
    console.log('\n▶ Test 9: JWT Secret Configuration Fast-Fail in Production');
    process.env.NODE_ENV = 'production';
    delete process.env.JWT_SECRET;

    let prodSecretThrew = false;
    try {
      getJwtSecret();
    } catch (err) {
      prodSecretThrew = true;
    } finally {
      process.env.NODE_ENV = 'test';
      process.env.JWT_SECRET = 'herbal_test_jwt_secret_configured_2026';
    }

    const validSecretRetrieved = getJwtSecret();

    if (prodSecretThrew && validSecretRetrieved === 'herbal_test_jwt_secret_configured_2026') {
      console.log('  ✅ Missing JWT_SECRET correctly throws in production and succeeds when configured.');
      passed++;
    } else {
      throw new Error('JWT secret production enforcement failed');
    }

    // ----------------------------------------------------
    // TEST 10: Coupon Release on Order Cancellation
    // ----------------------------------------------------
    console.log('\n▶ Test 10: Coupon Usage Count Decremented on Order Cancellation');
    const releaseTestCoupon = await Coupon.create({
      code: 'RELEASE10',
      discountType: 'fixed',
      discountAmount: 10,
      minPurchaseAmount: 100,
      expiryDate: new Date(Date.now() + 86400000),
      usageLimit: 10,
      usedCount: 0,
      isActive: true,
    });

    const dummyOrderId = new mongoose.Types.ObjectId();
    await redeemCoupon('RELEASE10', testUser._id, dummyOrderId);
    const countBeforeRelease = (await Coupon.findOne({ code: 'RELEASE10' })).usedCount;

    await releaseCoupon('RELEASE10', dummyOrderId);
    const countAfterRelease = (await Coupon.findOne({ code: 'RELEASE10' })).usedCount;

    if (countBeforeRelease === 1 && countAfterRelease === 0) {
      console.log('  ✅ Coupon usage count successfully decremented from 1 to 0 upon order release.');
      passed++;
    } else {
      throw new Error(`Coupon release failed: before=${countBeforeRelease}, after=${countAfterRelease}`);
    }

    console.log('\n==================================================');
    console.log(`🎉 ALL REMEDIATION PHASE A TESTS PASSED: ${passed} / ${total} (100%)`);
    console.log('==================================================');

    await mongodInstance.stop();
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ REMEDIATION TEST FAILED:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

runRemediationTests();
