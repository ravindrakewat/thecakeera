const { Coupon, Cart, Product } = require('../models');
const ApiError = require('../utils/ApiError');

const validateCoupon = async (userId, code, cartItems = []) => {
  if (!code || typeof code !== 'string' || code.trim().length === 0) {
    throw new ApiError(400, 'Coupon code is required.');
  }

  const cleanCode = code.toUpperCase().trim();
  const coupon = await Coupon.findOne({ code: cleanCode, isActive: true }).lean();
  if (!coupon) {
    throw new ApiError(404, 'Invalid or expired coupon code.');
  }

  if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
    throw new ApiError(400, 'Coupon code has expired.');
  }

  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
    throw new ApiError(400, 'Coupon usage limit reached.');
  }

  // Check per-user usage limit if configured
  if (coupon.userUsageLimit > 0 && userId && coupon.usedBy && Array.isArray(coupon.usedBy)) {
    const userCount = coupon.usedBy.filter(
      (entry) => entry.user && entry.user.toString() === userId.toString()
    ).length;
    if (userCount >= coupon.userUsageLimit) {
      throw new ApiError(400, `You have reached the maximum allowed redemptions (${coupon.userUsageLimit}) for coupon ${cleanCode}.`);
    }
  }

  let subtotal = 0;
  if (cartItems && Array.isArray(cartItems) && cartItems.length > 0) {
    for (const item of cartItems) {
      const prodId = item.product?._id || item.product;
      const prod = await Product.findById(prodId).select('sellingPrice isActive').lean();
      if (prod && prod.isActive !== false) {
        subtotal += (prod.sellingPrice || 0) * (item.quantity || 1);
      }
    }
  } else {
    const cart = await Cart.findOne({ user: userId }).populate('items.product', 'sellingPrice isActive').lean();
    if (cart && cart.items && cart.items.length > 0) {
      for (const item of cart.items) {
        if (item.product && item.product.isActive !== false) {
          subtotal += (item.product.sellingPrice || 0) * (item.quantity || 1);
        }
      }
    }
  }

  if (subtotal <= 0) {
    throw new ApiError(400, 'Cannot apply coupon to an empty cart.');
  }

  if (coupon.minPurchaseAmount > 0 && subtotal < coupon.minPurchaseAmount) {
    throw new ApiError(400, 'Minimum order amount of ' + '₹' + coupon.minPurchaseAmount + ' required for coupon ' + cleanCode + '.');
  }

  let discount = 0;
  if (coupon.discountType === 'percentage') {
    const rawDiscount = Math.round((subtotal * coupon.discountAmount) / 100);
    discount = coupon.maxDiscountAmount > 0 ? Math.min(rawDiscount, coupon.maxDiscountAmount) : rawDiscount;
  } else {
    discount = Math.min(coupon.discountAmount, subtotal);
  }

  return {
    code: coupon.code,
    discountType: coupon.discountType,
    discountAmount: discount,
    minPurchaseAmount: coupon.minPurchaseAmount,
    message: 'Coupon code applied successfully.',
  };
};

/**
 * Atomically redeem a coupon and increment its usage counter
 */
const redeemCoupon = async (code, userId, orderId) => {
  if (!code || typeof code !== 'string' || code.trim().length === 0) return false;
  const cleanCode = code.toUpperCase().trim();

  const coupon = await Coupon.findOne({ code: cleanCode, isActive: true });
  if (!coupon) return false;

  // Check per-user limit
  if (coupon.userUsageLimit > 0 && userId && coupon.usedBy && Array.isArray(coupon.usedBy)) {
    const userCount = coupon.usedBy.filter(
      (entry) => entry.user && entry.user.toString() === userId.toString()
    ).length;
    if (userCount >= coupon.userUsageLimit) {
      throw new ApiError(400, `You have reached the maximum allowed redemptions (${coupon.userUsageLimit}) for coupon ${cleanCode}.`);
    }
  }

  // Atomic update enforcing usage limit
  const query = {
    code: cleanCode,
    isActive: true,
  };
  if (coupon.usageLimit > 0) {
    query.usedCount = { $lt: coupon.usageLimit };
  }

  const res = await Coupon.updateOne(query, {
    $inc: { usedCount: 1 },
    $push: {
      usedBy: {
        user: userId,
        orderId: orderId,
        usedAt: new Date(),
      },
    },
  });

  if (res.modifiedCount === 0) {
    throw new ApiError(400, `Coupon ${cleanCode} usage limit has been reached.`);
  }

  return true;
};

/**
 * Release a previously redeemed coupon (e.g. order cancelled)
 */
const releaseCoupon = async (code, orderId) => {
  if (!code || typeof code !== 'string' || code.trim().length === 0) return false;
  const cleanCode = code.toUpperCase().trim();

  await Coupon.updateOne(
    { code: cleanCode, usedCount: { $gt: 0 } },
    {
      $inc: { usedCount: -1 },
      $pull: { usedBy: { orderId: orderId } },
    }
  );

  return true;
};

module.exports = {
  validateCoupon,
  redeemCoupon,
  releaseCoupon,
};
