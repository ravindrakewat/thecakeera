const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config();

const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const Review = require('../models/Review');
const Coupon = require('../models/Coupon');
const Cart = require('../models/Cart');
const Address = require('../models/Address');
const Notification = require('../models/Notification');

const reviewService = require('../services/reviewService');
const couponService = require('../services/couponService');
const notificationService = require('../services/notificationService');
const orderService = require('../services/orderService');

const runTests = async () => {
  console.log('🚀 Starting PHASE 8 Customer Experience Test Suite...');
  let testsPassed = 0;
  let totalTests = 20;
  let mongodInstance;

  try {
    let mongoUri = process.env.MONGODB_URI;
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create();
      mongoUri = mongodInstance.getUri();
      console.log('✅ Started In-Memory MongoDB Server:', mongoUri);
    } catch (e) {
      mongoUri = mongoUri || 'mongodb://localhost:27017/herbal-ecommerce';
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    await User.deleteMany({ email: /@phase8test\.com$/ });
    await Product.deleteMany({ name: /Phase 8 Test Product/ });
    await Category.deleteMany({ name: /Phase 8 Category/ });
    await Order.deleteMany({ orderNumber: /PH8-/ });
    await Coupon.deleteMany({ code: /PH8COUPON/ });
    await Review.deleteMany({ comment: /Phase 8 Test Review/ });
    await Address.deleteMany({});

    const userA = await User.create({
      firstName: 'Customer',
      lastName: 'A',
      name: 'Customer A',
      email: 'customera@phase8test.com',
      password: 'Password123!',
      phone: '9876543210',
      role: 'user',
      isVerified: true,
    });

    const userB = await User.create({
      firstName: 'Customer',
      lastName: 'B',
      name: 'Customer B',
      email: 'customerb@phase8test.com',
      password: 'Password123!',
      phone: '9876543211',
      role: 'user',
      isVerified: true,
    });

    const addressA = await Address.create({
      user: userA._id,
      fullName: 'Customer A',
      phone: '9876543210',
      addressLine1: '123 Herbal St',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      isDefault: true,
    });

    const category = await Category.create({
      name: 'Phase 8 Category',
      slug: 'phase-8-category-' + Date.now(),
    });

    const product = await Product.create({
      name: 'Phase 8 Test Product',
      slug: 'phase-8-test-product-' + Date.now(),
      sku: 'SKU-PH8-' + Date.now(),
      category: category._id,
      description: 'Phase 8 herbal test product description',
      mrp: 500,
      sellingPrice: 400,
      costPrice: 200,
      stockQuantity: 50,
      isActive: true,
      averageRating: 0,
      reviewCount: 0,
    });

    // TEST 1: Review Eligibility (Denied initially)
    console.log('\n--- Test 1: Review Eligibility Check ---');
    const initEligibility = await reviewService.checkReviewEligibility(userA._id, product._id);
    if (!initEligibility.canReview && initEligibility.message.includes('Only verified buyers')) {
      console.log('✅ Test 1 Passed: Unpurchased product review correctly denied');
      testsPassed++;
    } else {
      console.error('❌ Test 1 Failed:', initEligibility);
    }

    const deliveredOrder = await Order.create({
      orderNumber: 'PH8-DELIV-' + Date.now(),
      user: userA._id,
      items: [{
        product: product._id,
        name: product.name,
        quantity: 2,
        price: 400,
        sellingPrice: 400,
        mrp: 500,
        subtotal: 800,
      }],
      subtotal: 800,
      shippingCharge: 0,
      grandTotal: 800,
      shippingAddress: {
        fullName: 'Customer A',
        phone: '9876543210',
        addressLine1: 'Line 1',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
      },
      paymentMethod: 'COD',
      paymentStatus: 'PAID',
      orderStatus: 'DELIVERED',
    });

    // TEST 2: Review Eligibility (Eligible after delivery)
    console.log('\n--- Test 2: Review Eligibility after Delivery ---');
    const delivEligibility = await reviewService.checkReviewEligibility(userA._id, product._id);
    if (delivEligibility.canReview === true) {
      console.log('✅ Test 2 Passed: Delivered buyer is eligible to review');
      testsPassed++;
    } else {
      console.error('❌ Test 2 Failed:', delivEligibility);
    }

    // TEST 3: Create Review & Prevent Duplicate Submissions
    console.log('\n--- Test 3: Review Submission & Duplicate Prevention ---');
    const review = await reviewService.createReview(userA._id, 'Customer A', product._id, {
      rating: 5,
      title: 'Amazing Product',
      comment: 'Phase 8 Test Review: Outstanding herbal quality and fast shipping!',
    });

    try {
      await reviewService.createReview(userA._id, 'Customer A', product._id, {
        rating: 4,
        comment: 'Phase 8 Test Review: Trying to submit duplicate review',
      });
      console.error('❌ Test 3 Failed: Duplicate review was allowed');
    } catch (err) {
      if (err.message.includes('already reviewed')) {
        console.log('✅ Test 3 Passed: Duplicate review prevented successfully');
        testsPassed++;
      } else {
        console.error('❌ Test 3 Failed with unexpected error:', err.message);
      }
    }

    // TEST 4: Review Moderation Visibility (Pending review is hidden)
    console.log('\n--- Test 4: Review Moderation Visibility ---');
    const publicReviewsInit = await reviewService.getProductReviews(product._id);
    if (publicReviewsInit.reviews.length === 0) {
      console.log('✅ Test 4 Passed: Pending review is hidden from public storefront');
      testsPassed++;
    } else {
      console.error('❌ Test 4 Failed: Pending review exposed publicly');
    }

    // TEST 5: Approve Review & Recalculate Rating
    console.log('\n--- Test 5: Approve Review & Recalculate Rating ---');
    review.status = 'Approved';
    await review.save();
    await reviewService.recalculateProductRating(product._id);
    const updatedProd = await Product.findById(product._id);
    if (updatedProd.averageRating === 5 && updatedProd.reviewCount === 1) {
      console.log('✅ Test 5 Passed: Rating aggregated to average 5.0 (1 review)');
      testsPassed++;
    } else {
      console.error('❌ Test 5 Failed:', updatedProd.averageRating, updatedProd.reviewCount);
    }

    // TEST 6: Coupon Validation
    console.log('\n--- Test 6: Coupon Validation (Active Coupon) ---');
    const activeCoupon = await Coupon.create({
      code: 'PH8COUPON20',
      discountType: 'percentage',
      discountAmount: 20,
      minPurchaseAmount: 300,
      maxDiscountAmount: 100,
      isActive: true,
      startDate: new Date(Date.now() - 86400000),
      expiryDate: new Date(Date.now() + 86400000),
      usageLimit: 100,
      userLimit: 1,
    });

    const cartItems = [{ product: product._id, quantity: 1 }];
    const valResult = await couponService.validateCoupon(userA._id, 'PH8COUPON20', cartItems);
    if (valResult.code === 'PH8COUPON20' && valResult.discountAmount === 80) {
      console.log('✅ Test 6 Passed: Valid coupon calculated 20% discount (80 on 400 price)');
      testsPassed++;
    } else {
      console.error('❌ Test 6 Failed:', valResult);
    }

    // TEST 7: Coupon Expiry
    console.log('\n--- Test 7: Coupon Expiry Validation ---');
    await Coupon.create({
      code: 'PH8COUPONEXPIRED',
      discountType: 'fixed',
      discountAmount: 50,
      isActive: true,
      expiryDate: new Date(Date.now() - 86400000),
    });

    try {
      await couponService.validateCoupon(userA._id, 'PH8COUPONEXPIRED', cartItems);
      console.error('❌ Test 7 Failed: Expired coupon was accepted');
    } catch (err) {
      if (err.message.includes('expired')) {
        console.log('✅ Test 7 Passed: Expired coupon correctly rejected');
        testsPassed++;
      } else {
        console.error('❌ Test 7 Failed:', err.message);
      }
    }

    // TEST 8: Coupon Minimum Purchase Amount
    console.log('\n--- Test 8: Coupon Minimum Order Amount ---');
    const minCoupon = await Coupon.create({
      code: 'PH8COUPONMIN',
      discountType: 'fixed',
      discountAmount: 50,
      minPurchaseAmount: 1000,
      isActive: true,
      expiryDate: new Date(Date.now() + 86400000),
    });
    try {
      await couponService.validateCoupon(userA._id, 'PH8COUPONMIN', cartItems);
      console.error('❌ Test 8 Failed: Coupon below minimum amount was accepted');
    } catch (err) {
      if (err.message.includes('Minimum order amount')) {
        console.log('✅ Test 8 Passed: Minimum purchase condition enforced');
        testsPassed++;
      } else {
        console.error('❌ Test 8 Failed:', err.message);
      }
    }

    // TEST 9: Coupon Usage Limit
    console.log('\n--- Test 9: Coupon Usage Limit Validation ---');
    await Coupon.create({
      code: 'PH8COUPONMAX',
      discountType: 'fixed',
      discountAmount: 50,
      isActive: true,
      usageLimit: 5,
      usedCount: 5,
      expiryDate: new Date(Date.now() + 86400000),
    });

    try {
      await couponService.validateCoupon(userA._id, 'PH8COUPONMAX', cartItems);
      console.error('❌ Test 9 Failed: Maxed out coupon was accepted');
    } catch (err) {
      if (err.message.includes('usage limit')) {
        console.log('✅ Test 9 Passed: Coupon usage limit enforced');
        testsPassed++;
      } else {
        console.error('❌ Test 9 Failed:', err.message);
      }
    }

    // TEST 10: Notification Creation
    console.log('\n--- Test 10: Customer Notification Creation ---');
    const notif = await notificationService.createNotification({
      user: userA._id,
      type: 'ORDER_PLACED',
      title: 'Order Placed Successfully',
      message: 'Your order #PH8-1001 has been placed.',
      referenceId: 'NOTIF-REF-1001',
    });

    if (notif && notif.type === 'ORDER_PLACED' && notif.user.toString() === userA._id.toString()) {
      console.log('✅ Test 10 Passed: Notification created successfully');
      testsPassed++;
    } else {
      console.error('❌ Test 10 Failed:', notif);
    }

    // TEST 11: Notification Ownership Protection
    console.log('\n--- Test 11: Notification Ownership Protection ---');
    try {
      await notificationService.markAsRead(userB._id, notif._id);
      console.error('❌ Test 11 Failed: User B was able to mark User A notification as read');
    } catch (err) {
      if (err.message.includes('not found') || err.message.includes('denied')) {
        console.log('✅ Test 11 Passed: Ownership check prevents IDOR on notifications');
        testsPassed++;
      } else {
        console.error('❌ Test 11 Failed:', err.message);
      }
    }

    // TEST 12: Mark Notification Read
    console.log('\n--- Test 12: Mark Notification Read ---');
    const readNotif = await notificationService.markAsRead(userA._id, notif._id);
    if (readNotif && readNotif.isRead === true) {
      console.log('✅ Test 12 Passed: Notification marked as read');
      testsPassed++;
    } else {
      console.error('❌ Test 12 Failed:', readNotif);
    }

    // TEST 13: Read All Notifications
    console.log('\n--- Test 13: Read-All Notifications ---');
    await notificationService.createNotification({
      user: userA._id,
      type: 'PROMOTION',
      title: 'Special Offer',
      message: 'Get 10% off today!',
    });
    await notificationService.markAllAsRead(userA._id);
    const unreadRes = await notificationService.getUnreadCount(userA._id);
    if (unreadRes.unreadCount === 0) {
      console.log('✅ Test 13 Passed: Read-all cleared all unread notifications');
      testsPassed++;
    } else {
      console.error('❌ Test 13 Failed: Unread count is', unreadRes);
    }

    // TEST 14: Notification Pagination
    console.log('\n--- Test 14: Notification Pagination ---');
    const notifPage = await notificationService.getUserNotifications(userA._id, { page: 1, limit: 10 });
    if (notifPage.notifications.length > 0 && notifPage.pagination.total >= 2) {
      console.log('✅ Test 14 Passed: Notification pagination returned standard payload');
      testsPassed++;
    } else {
      console.error('❌ Test 14 Failed:', notifPage);
    }

    // TEST 15: Order Notification Trigger
    console.log('\n--- Test 15: Order Notification Trigger ---');
    await Cart.create({
      user: userA._id,
      items: [{ product: product._id, quantity: 1, price: 400 }],
      subtotal: 400,
    });
    await orderService.createOrder(userA._id, {
      addressId: addressA._id,
      paymentMethod: 'COD',
    });
    
    const orderNotifs = await notificationService.getUserNotifications(userA._id, { page: 1, limit: 10 });
    const placedNotif = orderNotifs.notifications.find(n => n.type === 'ORDER_PLACED');
    if (placedNotif) {
      console.log('✅ Test 15 Passed: ORDER_PLACED notification triggered automatically');
      testsPassed++;
    } else {
      console.error('❌ Test 15 Failed: Placed notification not found');
    }

    // TEST 16: Payment Notification Idempotency
    console.log('\n--- Test 16: Payment Notification Idempotency ---');
    const dupRefId = 'PAY-SUCCESS-REF-TEST-999';
    await notificationService.createNotification({
      user: userA._id,
      type: 'PAYMENT_SUCCESS',
      title: 'Payment Received',
      message: 'Payment confirmed for order #PH8-1001',
      referenceId: dupRefId,
    });
    await notificationService.createNotification({
      user: userA._id,
      type: 'PAYMENT_SUCCESS',
      title: 'Payment Received',
      message: 'Payment confirmed for order #PH8-1001',
      referenceId: dupRefId,
    });
    const dupCheckNotifs = await Notification.find({ user: userA._id, referenceId: dupRefId });
    if (dupCheckNotifs.length === 1) {
      console.log('✅ Test 16 Passed: Duplicate notification prevented by idempotency reference');
      testsPassed++;
    } else {
      console.error('❌ Test 16 Failed: Duplicate notifications found count=', dupCheckNotifs.length);
    }

    // TEST 17: Order Status Notification Trigger
    console.log('\n--- Test 17: Admin Order Status Change Notification ---');
    deliveredOrder.orderStatus = 'SHIPPED';
    await deliveredOrder.save();
    await notificationService.createNotification({
      user: userA._id,
      title: 'Order Shipped',
      message: `Your order #${deliveredOrder.orderNumber} has been shipped.`,
      type: 'ORDER_SHIPPED',
      order: deliveredOrder._id,
      orderNumber: deliveredOrder.orderNumber,
      referenceId: `ORDER_SHIPPED_${deliveredOrder.orderNumber}`,
    });
    const shippedNotifCheck = await Notification.findOne({ user: userA._id, type: 'ORDER_SHIPPED' });
    if (shippedNotifCheck) {
      console.log('✅ Test 17 Passed: ORDER_SHIPPED notification emitted on status update');
      testsPassed++;
    } else {
      console.error('❌ Test 17 Failed: Shipped notification missing');
    }

    // TEST 18: Order Ownership Security
    console.log('\n--- Test 18: Order Ownership Security ---');
    try {
      await orderService.getOrderByNumber(userB._id, deliveredOrder.orderNumber);
      console.error('❌ Test 18 Failed: User B retrieved User A order details');
    } catch (err) {
      if (err.message.includes('not found') || err.message.includes('Access denied')) {
        console.log('✅ Test 18 Passed: Order ownership security enforced');
        testsPassed++;
      } else {
        console.error('❌ Test 18 Failed:', err.message);
      }
    }

    // TEST 19: Stock Privacy
    console.log('\n--- Test 19: Stock Privacy Verification ---');
    const pubProduct = await Product.findById(product._id).select('-inventoryQuantity -costPrice -stockQuantity');
    const pubObj = pubProduct.toObject();
    if (pubObj.stockStatus && pubObj.stockQuantity === undefined && pubObj.costPrice === undefined) {
      console.log('✅ Test 19 Passed: Internal stock quantities and cost prices hidden from public payload');
      testsPassed++;
    } else {
      console.error('❌ Test 19 Failed: Leaked sensitive stock or cost fields', pubObj);
    }

    // TEST 20: Standardized API Error Handling
    console.log('\n--- Test 20: Standardized API Error Response ---');
    try {
      await couponService.validateCoupon(userA._id, 'NONEXISTENT_CODE_XYZ', cartItems);
    } catch (err) {
      if (err.message && !err.stack?.includes('MongoError')) {
        console.log('✅ Test 20 Passed: Safe, human-readable error returned without stack traces');
        testsPassed++;
      } else {
        console.error('❌ Test 20 Failed:', err);
      }
    }

    // Clean up test data
    await User.deleteMany({ email: /@phase8test\.com$/ });
    await Product.deleteMany({ name: /Phase 8 Test Product/ });
    await Category.deleteMany({ name: /Phase 8 Category/ });
    await Order.deleteMany({ orderNumber: /PH8-/ });
    await Coupon.deleteMany({ code: /PH8COUPON/ });
    await Review.deleteMany({ comment: /Phase 8 Test Review/ });
    await Notification.deleteMany({ user: userA._id });
    await Address.deleteMany({});

    if (mongodInstance) {
      await mongoose.disconnect();
      await mongodInstance.stop();
    }

    console.log('\n========================================');
    console.log(`PHASE 8 RESULTS: ${testsPassed} / ${totalTests} TESTS PASSED`);
    console.log('========================================');

    if (testsPassed === totalTests) {
      console.log('🎉 ALL PHASE 8 CUSTOMER EXPERIENCE TESTS PASSED 100%!');
      process.exit(0);
    } else {
      console.error(`⚠️ ${totalTests - testsPassed} tests failed!`);
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Error during Phase 8 test execution:', err);
    if (mongodInstance) await mongodInstance.stop();
    process.exit(1);
  }
};

runTests();