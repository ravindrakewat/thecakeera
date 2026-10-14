const wishlistService = require('../services/wishlistService');
const { sendSuccess } = require('../utils/apiResponse');

const getWishlist = async (req, res, next) => {
  try {
    const wishlist = await wishlistService.getUserWishlist(req.user._id);
    return sendSuccess(res, 200, 'Wishlist fetched successfully', wishlist);
  } catch (error) {
    next(error);
  }
};

const addItem = async (req, res, next) => {
  try {
    const productId = req.params.productId || req.body.productId;
    const wishlist = await wishlistService.addToWishlist(req.user._id, productId);
    return sendSuccess(res, 200, 'Product added to wishlist', wishlist);
  } catch (error) {
    next(error);
  }
};

const removeItem = async (req, res, next) => {
  try {
    const wishlist = await wishlistService.removeFromWishlist(req.user._id, req.params.productId);
    return sendSuccess(res, 200, 'Product removed from wishlist', wishlist);
  } catch (error) {
    next(error);
  }
};

const clearWishlist = async (req, res, next) => {
  try {
    const wishlist = await wishlistService.clearUserWishlist(req.user._id);
    return sendSuccess(res, 200, 'Wishlist cleared successfully', wishlist);
  } catch (error) {
    next(error);
  }
};

const mergeWishlist = async (req, res, next) => {
  try {
    const { productIds } = req.body;
    const wishlist = await wishlistService.mergeGuestWishlist(req.user._id, productIds || []);
    return sendSuccess(res, 200, 'Guest wishlist merged successfully', wishlist);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWishlist,
  addItem,
  removeItem,
  clearWishlist,
  mergeWishlist,
};
