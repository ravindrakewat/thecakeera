const { createNotification } = require('./notificationService');
const crypto = require('crypto');
const { Order, Payment, Product, Cart, WebhookEvent } = require('../models');
const ApiError = require('../utils/ApiError');
const { validateAndCalculateCheckout } = require('./orderService');
const { generateOrderNumber } = require('../utils/orderNumberGenerator');
const { redeemCoupon } = require('./couponService');

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || '';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || '';

/**
 * Initialize Razorpay Order
 */
const createRazorpayOrder = async (userId, addressId, couponCode = '') => {
  const isProd = process.env.NODE_ENV === 'production';
  const calc = await validateAndCalculateCheckout(userId, addressId, { paymentMethod: 'ONLINE', couponCode });
  const orderNumber = generateOrderNumber();

  // Create pending internal Order
  const order = new Order({
    orderNumber,
    user: userId,
    items: calc.itemsSnapshot,
    shippingAddress: calc.addressSnapshot,
    billingAddress: calc.addressSnapshot,
    subtotal: calc.subtotal,
    discount: calc.discount,
    shippingCharge: calc.shippingCharge,
    tax: calc.tax,
    grandTotal: calc.grandTotal,
    paymentMethod: 'ONLINE',
    paymentStatus: 'PENDING',
    orderStatus: 'PAYMENT_PENDING',
  });

  const amountInPaise = Math.round(calc.grandTotal * 100);
  let razorpayOrderId = '';

  const hasCredentials = Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

  if (hasCredentials) {
    try {
      const Razorpay = require('razorpay');
      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });

      const rzpOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: orderNumber,
        notes: { userId: userId.toString(), orderNumber },
      });
      razorpayOrderId = rzpOrder.id;
    } catch (e) {
      if (isProd) {
        throw new ApiError(502, `Payment gateway communication failure: ${e.message || 'Razorpay order creation failed'}`);
      }
      razorpayOrderId = `order_mock_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    }
  } else {
    if (isProd) {
      throw new ApiError(500, 'Payment gateway configuration missing: RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are required in production.');
    }
    razorpayOrderId = `order_mock_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  order.razorpayOrderId = razorpayOrderId;
  await order.save();

  // Create Payment record
  await Payment.create({
    user: userId,
    order: order._id,
    provider: 'RAZORPAY',
    providerOrderId: razorpayOrderId,
    amount: calc.grandTotal,
    currency: 'INR',
    status: 'PENDING',
    method: 'ONLINE',
  });

  return {
    keyId: RAZORPAY_KEY_ID,
    razorpayOrderId,
    amount: amountInPaise,
    currency: 'INR',
    orderNumber,
    grandTotal: calc.grandTotal,
  };
};

/**
 * Verify Razorpay Payment Signature & Confirm Order
 */
const verifyRazorpayPayment = async (userId, { razorpayOrderId, razorpayPaymentId, razorpaySignature }) => {
  if (!razorpayOrderId || !razorpayPaymentId) {
    throw new ApiError(400, 'Razorpay order ID and payment ID are required');
  }

  const order = await Order.findOne({ razorpayOrderId, user: userId });
  if (!order) {
    throw new ApiError(404, 'Order not found for this payment verification');
  }

  const payment = await Payment.findOne({ providerOrderId: razorpayOrderId, user: userId });
  if (!payment) {
    throw new ApiError(404, 'Payment record not found');
  }

  // Idempotency check: If already paid, return clean result immediately
  if (payment.status === 'PAID' && order.paymentStatus === 'PAID') {
    return order;
  }

  // Signature verification logic
  let isValidSignature = false;
  const secret = process.env.RAZORPAY_KEY_SECRET || RAZORPAY_KEY_SECRET;

  if (razorpaySignature && secret) {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    isValidSignature = expectedSignature === razorpaySignature;
  }

  // Strict Mock Bypass: Strictly forbidden in production; permitted only for test fixtures with order_mock_ or pay_mock_ prefix
  if (!isValidSignature && process.env.NODE_ENV !== 'production' && (razorpayOrderId.startsWith('order_mock_') || razorpayPaymentId.startsWith('pay_mock_'))) {
    isValidSignature = true;
  }

  if (!isValidSignature) {
    payment.status = 'FAILED';
    payment.failureReason = 'Signature verification failed';
    await payment.save();

    order.paymentStatus = 'FAILED';
    order.orderStatus = 'PAYMENT_PENDING';
    await order.save();

    // Notify customer of payment failure (idempotent)
    await createNotification({
      user: userId,
      title: 'Payment Failed',
      message: `Payment for order #${order.orderNumber} could not be verified. Please try again.`,
      type: 'PAYMENT_FAILED',
      order: order._id,
      orderNumber: order.orderNumber,
      referenceId: `PAYMENT_FAILED_${order.orderNumber}_${razorpayPaymentId}`,
    });

    throw new ApiError(400, 'Payment verification failed: Invalid signature.');
  }

  // Atomic Inventory Deduction with Rollback Compensation
  const deductedItems = [];
  if (order.items && order.items.length > 0) {
    for (const item of order.items) {
      const res = await Product.updateOne(
        { _id: item.product, stockQuantity: { $gte: item.quantity } },
        { $inc: { stockQuantity: -item.quantity } }
      );

      if (res.modifiedCount === 0) {
        // Rollback any items deducted in this loop
        for (const prev of deductedItems) {
          await Product.updateOne(
            { _id: prev.product },
            { $inc: { stockQuantity: prev.quantity } }
          );
        }

        // Safe recovery state: Payment captured but inventory exhausted
        order.paymentStatus = 'REFUND_PENDING';
        order.orderStatus = 'OUT_OF_STOCK_PENDING_REFUND';
        order.cancelReason = `Product "${item.name}" ran out of stock before payment confirmation.`;
        await order.save();

        payment.status = 'PAID';
        payment.providerPaymentId = razorpayPaymentId;
        payment.signatureVerified = true;
        payment.refundStatus = 'PENDING';
        payment.refundAmount = order.grandTotal;
        payment.refundReason = `Stock depleted for ${item.name}`;
        payment.failureReason = 'Out of stock at confirmation. Refund pending.';
        payment.paidAt = new Date();
        await payment.save();

        // Notify customer of refund pending
        await createNotification({
          user: userId,
          title: 'Order Out of Stock — Refund Pending',
          message: `Your payment was received, but item "${item.name}" ran out of stock. A refund of ₹${order.grandTotal} is being processed.`,
          type: 'PAYMENT_FAILED',
          order: order._id,
          orderNumber: order.orderNumber,
          referenceId: `OOS_REFUND_${order.orderNumber}`,
        });

        throw new ApiError(409, `Payment was captured, but "${item.name}" is out of stock. Order marked for refund.`);
      }

      deductedItems.push(item);
    }
  }

  // Update Payment record to confirmed PAID
  payment.status = 'PAID';
  payment.providerPaymentId = razorpayPaymentId;
  payment.providerSignature = razorpaySignature || '';
  payment.signatureVerified = true;
  payment.paidAt = new Date();
  await payment.save();

  // Update Order record
  order.paymentStatus = 'PAID';
  order.orderStatus = 'CONFIRMED';
  order.placedAt = new Date();
  await order.save();

  // Redeem coupon if applied
  const couponCode = order.items.find((i) => i.couponCode)?.couponCode;
  if (couponCode) {
    try {
      await redeemCoupon(couponCode, userId, order._id);
    } catch (couponErr) {
      console.warn(`[Coupon Notice] Could not increment coupon ${couponCode}:`, couponErr.message);
    }
  }

  await createNotification({
    user: userId,
    title: 'Payment Received',
    message: 'Payment received for order #' + order.orderNumber + '.',
    type: 'PAYMENT_SUCCESS',
    order: order._id,
    orderNumber: order.orderNumber,
    referenceId: 'PAYMENT_SUCCESS_' + order.orderNumber,
  });

  await createNotification({
    user: userId,
    title: 'Order Confirmed',
    message: 'Your order #' + order.orderNumber + ' has been confirmed.',
    type: 'ORDER_CONFIRMED',
    order: order._id,
    orderNumber: order.orderNumber,
    referenceId: 'ORDER_CONFIRMED_' + order.orderNumber,
  });

  // Clear user's cart
  await Cart.updateOne({ user: userId }, { $set: { items: [] } });

  return order;
};

/**
 * Handle Razorpay Webhook with Signature Verification & Event Idempotency
 */
const handleWebhook = async (rawBody, signatureHeader, eventPayload) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || RAZORPAY_WEBHOOK_SECRET;

  // Signature Verification
  if (signatureHeader && rawBody) {
    const expectedSignature = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    if (expectedSignature !== signatureHeader && process.env.NODE_ENV === 'production') {
      throw new ApiError(400, 'Invalid webhook signature');
    }
  }

  const eventId = eventPayload.event_id || `evt_${Date.now()}`;
  const eventType = eventPayload.event || 'payment.captured';

  // Event Idempotency check
  const existingEvent = await WebhookEvent.findOne({ eventId });
  if (existingEvent) {
    return { status: 'already_processed' };
  }

  const payloadData = eventPayload.payload || {};
  const paymentObj = payloadData.payment?.entity || {};
  const razorpayOrderId = paymentObj.order_id || payloadData.order?.entity?.id;

  if (razorpayOrderId) {
    const order = await Order.findOne({ razorpayOrderId });
    const payment = await Payment.findOne({ providerOrderId: razorpayOrderId });

    if (order && payment) {
      if (eventType === 'payment.captured' || eventType === 'order.paid') {
        if (payment.status !== 'PAID') {
          // Verify inventory deduction with rollback compensation
          const deductedItems = [];
          let stockFailed = false;

          for (const item of order.items) {
            const res = await Product.updateOne(
              { _id: item.product, stockQuantity: { $gte: item.quantity } },
              { $inc: { stockQuantity: -item.quantity } }
            );

            if (res.modifiedCount === 0) {
              stockFailed = true;
              for (const prev of deductedItems) {
                await Product.updateOne(
                  { _id: prev.product },
                  { $inc: { stockQuantity: prev.quantity } }
                );
              }
              break;
            }
            deductedItems.push(item);
          }

          if (stockFailed) {
            order.paymentStatus = 'REFUND_PENDING';
            order.orderStatus = 'OUT_OF_STOCK_PENDING_REFUND';
            order.cancelReason = 'Out of stock at webhook confirmation.';
            await order.save();

            payment.status = 'PAID';
            payment.providerPaymentId = paymentObj.id || payment.providerPaymentId;
            payment.refundStatus = 'PENDING';
            payment.refundAmount = order.grandTotal;
            payment.paidAt = new Date();
            await payment.save();
          } else {
            payment.status = 'PAID';
            payment.providerPaymentId = paymentObj.id || payment.providerPaymentId;
            payment.paidAt = new Date();
            await payment.save();

            order.paymentStatus = 'PAID';
            order.orderStatus = 'CONFIRMED';
            order.placedAt = new Date();
            await order.save();

            // Redeem coupon if present
            const couponCode = order.items.find((i) => i.couponCode)?.couponCode;
            if (couponCode) {
              try {
                await redeemCoupon(couponCode, order.user, order._id);
              } catch (cErr) {
                console.warn('[Webhook Coupon Notice]', cErr.message);
              }
            }

            await Cart.updateOne({ user: order.user }, { $set: { items: [] } });
          }
        }
      } else if (eventType === 'payment.failed') {
        payment.status = 'FAILED';
        payment.failureReason = paymentObj.error_description || 'Payment failed via webhook';
        await payment.save();

        order.paymentStatus = 'FAILED';
        await order.save();
      }
    }
  }

  // Save event identifier for idempotency
  await WebhookEvent.create({
    eventId,
    eventType,
    payload: eventPayload,
  });

  return { status: 'success' };
};

module.exports = {
  createRazorpayOrder,
  verifyRazorpayPayment,
  handleWebhook,
};
