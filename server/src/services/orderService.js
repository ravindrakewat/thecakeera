const { Order, Cart, Address, Product, Payment, Shipment, User } = require('../models');
const ApiError = require('../utils/ApiError');
const { calculateShipping, calculateShippingDetails, validatePincode } = require('./shippingService');
const { calculateTax } = require('./taxService');
const { generateOrderNumber } = require('../utils/orderNumberGenerator');
const { validateCoupon, redeemCoupon, releaseCoupon } = require('./couponService');
const { createNotification } = require('./notificationService');

/**
 * Validates cart and address, calculates complete checkout summary dynamically from DB Product prices.
 */
const validateAndCalculateCheckout = async (userId, addressId, options = {}) => {
  const cart = await Cart.findOne({ user: userId }).populate({
    path: 'items.product',
    select: 'name slug sku thumbnail sellingPrice mrp stockQuantity trackInventory isActive hsnCode gstRate taxInclusive',
  });

  if (!cart || !cart.items || cart.items.length === 0) {
    throw new ApiError(400, 'Checkout failed: Your cart is empty.');
  }

  const validAddress = await Address.findOne({ _id: addressId, user: userId }).lean();
  if (!validAddress) {
    throw new ApiError(400, 'Invalid shipping address. Please select a valid address from your account.');
  }

  // Validate Indian Pincode format
  if (!validatePincode(validAddress.pincode)) {
    throw new ApiError(400, 'Invalid shipping destination pincode. Must be a valid 6-digit Indian pincode.');
  }

  let subtotal = 0;
  const itemsSnapshot = [];

  for (const item of cart.items) {
    const prod = item.product;
    if (!prod || prod.isActive === false) {
      throw new ApiError(400, `One or more items in your cart are no longer available.`);
    }

    if (prod.stockQuantity < item.quantity) {
      throw new ApiError(
        400,
        `Insufficient stock for "${prod.name}". Available: ${prod.stockQuantity}, Requested: ${item.quantity}`
      );
    }

    const sellingPrice = prod.sellingPrice;
    const mrp = prod.mrp || sellingPrice;
    const itemSubtotal = sellingPrice * item.quantity;
    subtotal += itemSubtotal;

    itemsSnapshot.push({
      product: prod._id,
      name: prod.name,
      sku: prod.sku || '',
      thumbnail: prod.thumbnail || '',
      quantity: item.quantity,
      mrp,
      sellingPrice,
      discount: Math.max(0, mrp - sellingPrice),
      subtotal: itemSubtotal,
      hsnCode: prod.hsnCode || '',
      gstRate: prod.gstRate !== undefined ? prod.gstRate : 0,
      taxInclusive: prod.taxInclusive !== false,
      couponCode: '',
    });
  }

  // Validate coupon discount if provided
  let discount = 0;
  let appliedCouponCode = '';
  const couponParam = options.couponCode || (typeof options === 'object' ? options.couponCode : '');
  if (couponParam) {
    const couponRes = await validateCoupon(userId, couponParam, itemsSnapshot);
    discount = couponRes.discountAmount || 0;
    appliedCouponCode = couponRes.code;
    itemsSnapshot.forEach((it) => {
      it.couponCode = appliedCouponCode;
    });
  }

  const paymentMethod = typeof options === 'string' ? options : (options?.paymentMethod || 'ONLINE');
  const netSubtotal = Math.max(0, subtotal - discount);

  const shippingDetails = await calculateShippingDetails({
    subtotal: netSubtotal,
    address: validAddress,
    paymentMethod,
  });

  if (!shippingDetails.serviceable) {
    throw new ApiError(400, shippingDetails.message || 'Destination pincode is not serviceable for delivery.');
  }

  if (paymentMethod === 'COD' && shippingDetails.codAvailable === false) {
    throw new ApiError(400, 'Cash on Delivery (COD) is not available for this delivery destination.');
  }

  const shippingCharge = shippingDetails.shippingCharge !== undefined ? shippingDetails.shippingCharge : calculateShipping(netSubtotal, validAddress);
  const tax = calculateTax(netSubtotal);
  const grandTotal = netSubtotal + shippingCharge + tax;

  return {
    cart,
    addressSnapshot: {
      fullName: validAddress.fullName,
      phone: validAddress.phone,
      addressLine1: validAddress.addressLine1,
      addressLine2: validAddress.addressLine2 || '',
      area: validAddress.area || '',
      city: validAddress.city,
      state: validAddress.state,
      pincode: validAddress.pincode,
      landmark: validAddress.landmark || '',
      country: validAddress.country || 'India',
    },
    itemsSnapshot,
    subtotal,
    discount,
    appliedCouponCode,
    shippingCharge,
    tax,
    grandTotal,
    shippingDetails,
  };
};

/**
 * Preview checkout summary without creating order or deducting inventory
 */
const previewCheckout = async (userId, addressId, couponCode = '') => {
  const calc = await validateAndCalculateCheckout(userId, addressId, { couponCode });
  return {
    items: calc.itemsSnapshot,
    shippingAddress: calc.addressSnapshot,
    subtotal: calc.subtotal,
    discount: calc.discount,
    shippingCharge: calc.shippingCharge,
    tax: calc.tax,
    grandTotal: calc.grandTotal,
    serviceable: calc.shippingDetails?.serviceable ?? true,
    freeShippingApplied: calc.shippingDetails?.freeShippingApplied ?? false,
    estimatedDispatchDays: calc.shippingDetails?.estimatedDispatchDays ?? 1,
    estimatedDeliveryDays: calc.shippingDetails?.estimatedDeliveryDays ?? 4,
    zoneName: calc.shippingDetails?.zoneName ?? 'Standard',
    codAvailable: calc.shippingDetails?.codAvailable ?? true,
    message: calc.shippingDetails?.message ?? '',
  };
};

/**
 * Create Order (COD or Online initiation)
 */
const createOrder = async (userId, { addressId, paymentMethod = 'COD', couponCode = '', idempotencyKey = '' }) => {
  const calc = await validateAndCalculateCheckout(userId, addressId, { paymentMethod, couponCode });
  const orderNumber = generateOrderNumber();

  const isCOD = paymentMethod === 'COD';

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
    paymentMethod: isCOD ? 'COD' : 'ONLINE',
    paymentStatus: 'PENDING',
    orderStatus: isCOD ? 'PLACED' : 'PAYMENT_PENDING',
    idempotencyKey,
    placedAt: isCOD ? new Date() : null,
  });

  if (isCOD) {
    // Atomic inventory deduction with compensation rollback for COD
    const deductedItems = [];
    for (const item of calc.itemsSnapshot) {
      const res = await Product.updateOne(
        { _id: item.product, stockQuantity: { $gte: item.quantity } },
        { $inc: { stockQuantity: -item.quantity } }
      );

      if (res.modifiedCount === 0) {
        // Rollback any items deducted so far
        for (const prev of deductedItems) {
          await Product.updateOne(
            { _id: prev.product },
            { $inc: { stockQuantity: prev.quantity } }
          );
        }
        throw new ApiError(
          409,
          `Product "${item.name}" is no longer available in the requested quantity. Please update your cart.`
        );
      }

      deductedItems.push(item);
    }

    await order.save();

    // Redeem coupon usage atomically for COD
    if (calc.appliedCouponCode) {
      try {
        await redeemCoupon(calc.appliedCouponCode, userId, order._id);
      } catch (cErr) {
        console.warn(`[Coupon Redeem Warning] ${cErr.message}`);
      }
    }

    // Create Payment Record for COD
    await Payment.create({
      user: userId,
      order: order._id,
      provider: 'COD',
      providerOrderId: `COD_${orderNumber}`,
      amount: calc.grandTotal,
      status: 'PENDING',
      method: 'COD',
    });

    // Clear cart
    await Cart.updateOne({ user: userId }, { $set: { items: [] } });
  } else {
    await order.save();
  }

  return order;
};

/**
 * Get User Order History
 */
const getUserOrders = async (userId, page = 1, limit = 10) => {
  const p = Math.max(1, parseInt(page) || 1);
  const l = Math.min(50, Math.max(1, parseInt(limit) || 10));
  const skip = (p - 1) * l;

  const filter = { user: userId };
  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(l).lean(),
    Order.countDocuments(filter),
  ]);

  return {
    orders,
    pagination: {
      total,
      page: p,
      limit: l,
      pages: Math.ceil(total / l),
    },
  };
};

/**
 * Get Order Details with Strict IDOR check
 */
const getOrderByNumber = async (userId, orderNumber) => {
  const order = await Order.findOne({ orderNumber, user: userId }).lean();
  if (!order) {
    throw new ApiError(404, 'Order not found.');
  }
  return order;
};

/**
 * Cancel Order with strict idempotency and refund pending workflow
 */
const cancelOrder = async (userId, orderNumber, reason = '') => {
  const order = await Order.findOne({ orderNumber, user: userId });
  if (!order) {
    throw new ApiError(404, 'Order not found.');
  }

  if (order.orderStatus === 'CANCELLED') {
    throw new ApiError(400, 'Order is already cancelled.');
  }

  const cancellableStatuses = ['PAYMENT_PENDING', 'PLACED', 'CONFIRMED', 'PROCESSING', 'PACKED'];
  if (!cancellableStatuses.includes(order.orderStatus)) {
    throw new ApiError(
      400,
      `Order cannot be cancelled in its current state (${order.orderStatus}). Shipped or delivered orders cannot be cancelled.`
    );
  }

  const wasStockDeducted =
    order.orderStatus === 'CONFIRMED' ||
    order.orderStatus === 'PROCESSING' ||
    order.orderStatus === 'PACKED' ||
    order.paymentMethod === 'COD';

  const isOnlinePaid = order.paymentMethod === 'ONLINE' && order.paymentStatus === 'PAID';

  order.orderStatus = 'CANCELLED';
  order.cancelledAt = new Date();
  order.cancelReason = reason || 'Cancelled by customer';

  if (isOnlinePaid) {
    order.paymentStatus = 'REFUND_PENDING';

    await Payment.findOneAndUpdate(
      { order: order._id },
      {
        $set: {
          status: 'REFUND_PENDING',
          refundStatus: 'PENDING',
          refundAmount: order.grandTotal,
          refundReason: reason || 'Customer cancellation',
        },
      }
    );

    // Notify administrators of pending refund action
    const admins = await User.find({ role: 'admin' }).select('_id');
    for (const admin of admins) {
      await createNotification({
        user: admin._id,
        title: 'Action Required: Order Refund Pending',
        message: `Paid order #${order.orderNumber} (₹${order.grandTotal}) was cancelled. Customer refund requires processing.`,
        type: 'PAYMENT_FAILED',
        order: order._id,
        orderNumber: order.orderNumber,
        referenceId: `ADMIN_REFUND_REQ_${order.orderNumber}`,
      });
    }

    // Notify customer
    await createNotification({
      user: userId,
      title: 'Order Cancelled — Refund Pending',
      message: `Your order #${order.orderNumber} has been cancelled. A refund of ₹${order.grandTotal} is being processed.`,
      type: 'ORDER_CONFIRMED',
      order: order._id,
      orderNumber: order.orderNumber,
      referenceId: `CUST_CANCEL_REFUND_${order.orderNumber}`,
    });
  }

  await order.save();

  // Cancel any associated shipment record
  await Shipment.updateOne({ order: order._id }, { $set: { shipmentStatus: 'CANCELLED' } });

  // Restore inventory exactly once
  if (wasStockDeducted && order.items && order.items.length > 0) {
    for (const item of order.items) {
      await Product.updateOne({ _id: item.product }, { $inc: { stockQuantity: item.quantity } });
    }
  }

  // Release coupon usage if coupon was redeemed
  const usedCoupon = order.items.find((i) => i.couponCode)?.couponCode;
  if (usedCoupon) {
    await releaseCoupon(usedCoupon, order._id);
  }

  return order;
};

module.exports = {
  previewCheckout,
  createOrder,
  getUserOrders,
  getOrderByNumber,
  cancelOrder,
  validateAndCalculateCheckout,
};
