const cartService = require('../services/cartService');
const { sendSuccess } = require('../utils/apiResponse');

const getCart = async (req, res, next) => {
  try {
    const cart = await cartService.getUserCart(req.user._id);
    return sendSuccess(res, 200, 'Cart fetched successfully', cart);
  } catch (error) {
    next(error);
  }
};

const addItem = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    const cart = await cartService.addItemToCart(req.user._id, productId, quantity || 1);
    return sendSuccess(res, 200, 'Item added to cart successfully', cart);
  } catch (error) {
    next(error);
  }
};

const updateQuantity = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const cart = await cartService.updateCartItemQuantity(req.user._id, req.params.productId, quantity);
    return sendSuccess(res, 200, 'Cart item quantity updated', cart);
  } catch (error) {
    next(error);
  }
};

const removeItem = async (req, res, next) => {
  try {
    const cart = await cartService.removeCartItem(req.user._id, req.params.productId);
    return sendSuccess(res, 200, 'Item removed from cart', cart);
  } catch (error) {
    next(error);
  }
};

const clearCart = async (req, res, next) => {
  try {
    const cart = await cartService.clearUserCart(req.user._id);
    return sendSuccess(res, 200, 'Cart cleared successfully', cart);
  } catch (error) {
    next(error);
  }
};

const mergeCart = async (req, res, next) => {
  try {
    const { items } = req.body;
    const cart = await cartService.mergeGuestCart(req.user._id, items || []);
    return sendSuccess(res, 200, 'Guest cart merged successfully', cart);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCart,
  addItem,
  updateQuantity,
  removeItem,
  clearCart,
  mergeCart,
};
