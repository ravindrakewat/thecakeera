const { Cart, Product } = require('../models');
const ApiError = require('../utils/ApiError');

// Calculate subtotal & format safe public cart response
const calculateAndFormatCart = (cartDoc) => {
  if (!cartDoc || !cartDoc.items) {
    return { items: [], subtotal: 0, itemCount: 0 };
  }

  let subtotal = 0;
  let itemCount = 0;

  const items = [];

  for (const item of cartDoc.items) {
    const prod = item.product;
    // Skip null/inactive products cleanly
    if (!prod || prod.isActive === false) continue;

    const sellingPrice = prod.sellingPrice || prod.price || 0;
    const mrp = prod.mrp || prod.originalPrice || sellingPrice;
    const itemSubtotal = sellingPrice * item.quantity;

    subtotal += itemSubtotal;
    itemCount += item.quantity;

    let stockStatus = 'IN_STOCK';
    if (prod.trackInventory) {
      if (prod.stockQuantity <= 0) stockStatus = 'OUT_OF_STOCK';
      else if (prod.stockQuantity <= (prod.lowStockThreshold || 5)) stockStatus = 'LOW_STOCK';
    }

    items.push({
      product: {
        _id: prod._id,
        name: prod.name,
        slug: prod.slug,
        thumbnail: prod.thumbnail || prod.images?.[0]?.url || '',
        images: prod.images,
        sellingPrice,
        mrp,
        stockStatus,
        category: prod.category,
      },
      quantity: item.quantity,
      itemSubtotal,
    });
  }

  return {
    items,
    subtotal,
    itemCount,
  };
};

const getUserCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId }).populate({
    path: 'items.product',
    select: 'name slug thumbnail images sellingPrice mrp stockQuantity lowStockThreshold trackInventory isActive category',
  });

  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }

  return calculateAndFormatCart(cart);
};

const addItemToCart = async (userId, productId, quantity = 1) => {
  const product = await Product.findById(productId);
  if (!product || product.isActive === false) {
    throw new ApiError(400, 'Product is no longer available');
  }

  if (product.trackInventory && product.stockQuantity <= 0) {
    throw new ApiError(400, 'Product is currently out of stock');
  }

  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }

  const existingIndex = cart.items.findIndex((item) => item.product.toString() === productId.toString());
  const currentQty = existingIndex > -1 ? cart.items[existingIndex].quantity : 0;
  const targetQty = currentQty + quantity;

  if (product.trackInventory && targetQty > product.stockQuantity) {
    throw new ApiError(400, `Only ${product.stockQuantity} units are available in stock`);
  }

  if (existingIndex > -1) {
    cart.items[existingIndex].quantity = targetQty;
  } else {
    cart.items.push({ product: productId, quantity });
  }

  await cart.save();
  return await getUserCart(userId);
};

const updateCartItemQuantity = async (userId, productId, quantity) => {
  const product = await Product.findById(productId);
  if (!product || product.isActive === false) {
    throw new ApiError(400, 'Product is no longer available');
  }

  if (product.trackInventory && quantity > product.stockQuantity) {
    throw new ApiError(400, `Only ${product.stockQuantity} units are available in stock`);
  }

  const cart = await Cart.findOne({ user: userId });
  if (!cart) {
    throw new ApiError(404, 'Cart not found');
  }

  const itemIndex = cart.items.findIndex((item) => item.product.toString() === productId.toString());
  if (itemIndex === -1) {
    throw new ApiError(404, 'Item not found in cart');
  }

  cart.items[itemIndex].quantity = quantity;
  await cart.save();
  return await getUserCart(userId);
};

const removeCartItem = async (userId, productId) => {
  const cart = await Cart.findOne({ user: userId });
  if (cart) {
    cart.items = cart.items.filter((item) => item.product.toString() !== productId.toString());
    await cart.save();
  }
  return await getUserCart(userId);
};

const clearUserCart = async (userId) => {
  const cart = await Cart.findOne({ user: userId });
  if (cart) {
    cart.items = [];
    await cart.save();
  }
  return await getUserCart(userId);
};

const mergeGuestCart = async (userId, guestItems = []) => {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }

  for (const gItem of guestItems) {
    if (!gItem.productId) continue;
    const product = await Product.findById(gItem.productId);
    if (!product || product.isActive === false) continue;

    const requestedQty = parseInt(gItem.quantity) || 1;
    const existingIndex = cart.items.findIndex((i) => i.product.toString() === gItem.productId.toString());
    const currentQty = existingIndex > -1 ? cart.items[existingIndex].quantity : 0;

    let targetQty = currentQty + requestedQty;
    if (product.trackInventory && targetQty > product.stockQuantity) {
      targetQty = Math.max(1, product.stockQuantity);
    }

    if (existingIndex > -1) {
      cart.items[existingIndex].quantity = targetQty;
    } else {
      cart.items.push({ product: gItem.productId, quantity: targetQty });
    }
  }

  await cart.save();
  return await getUserCart(userId);
};

module.exports = {
  getUserCart,
  addItemToCart,
  updateCartItemQuantity,
  removeCartItem,
  clearUserCart,
  mergeGuestCart,
};
