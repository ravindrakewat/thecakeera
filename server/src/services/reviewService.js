const mongoose = require('mongoose');
const { Review, Order, Product, User } = require('../models');
const ApiError = require('../utils/ApiError');

const recalculateProductRating = async (productId) => {
  const pId = new mongoose.Types.ObjectId(productId);
  const stats = await Review.aggregate([
    { $match: { product: pId, status: 'Approved' } },
    { $group: { _id: '$product', averageRating: { $avg: '$rating' }, reviewCount: { $sum: 1 } } },
  ]);

  const averageRating = stats.length > 0 ? Math.round(stats[0].averageRating * 10) / 10 : 0;
  const reviewCount = stats.length > 0 ? stats[0].reviewCount : 0;

  await Product.findByIdAndUpdate(productId, { averageRating, reviewCount });
  return { averageRating, reviewCount };
};

const checkReviewEligibility = async (userId, productId) => {
  const existingReview = await Review.findOne({ user: userId, product: productId }).lean();
  if (existingReview) {
    return {
      canReview: false,
      eligible: false,
      hasReviewed: true,
      message: 'You have already reviewed this product.',
    };
  }

  const deliveredOrder = await Order.findOne({
    user: userId,
    orderStatus: { $in: ['DELIVERED', 'COMPLETED'] },
    'items.product': productId,
  }).lean();

  const user = await User.findById(userId).lean();
  const isAdmin = user && (user.role === 'admin' || user.role === 'superadmin');

  if (!deliveredOrder && !isAdmin) {
    return {
      canReview: false,
      eligible: false,
      hasReviewed: false,
      message: 'Only verified buyers with a delivered order can review this product.',
    };
  }

  return {
    canReview: true,
    eligible: true,
    hasReviewed: false,
    message: 'You are eligible to review this product.',
    orderNumber: deliveredOrder.orderNumber,
  };
};

const getProductReviews = async (productId, queryParams = {}) => {
  const page = Math.max(1, parseInt(queryParams.page) || 1);
  const limit = Math.min(30, Math.max(1, parseInt(queryParams.limit) || 10));
  const skip = (page - 1) * limit;

  const filter = {
    product: productId,
    status: 'Approved',
  };

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate('user', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Review.countDocuments(filter),
  ]);

  return {
    reviews,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1,
    },
  };
};

const createReview = async (userId, userName, productId, { rating, comment, title = '' }) => {
  if (!rating || rating < 1 || rating > 5) {
    throw new ApiError(400, 'Rating must be between 1 and 5.');
  }
  if (!comment || comment.trim().length === 0) {
    throw new ApiError(400, 'Review text cannot be empty.');
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(404, 'Product not found.');
  }

  const eligibility = await checkReviewEligibility(userId, productId);
  if (!eligibility.canReview) {
    throw new ApiError(403, eligibility.message);
  }

  const review = await Review.create({
    product: productId,
    user: userId,
    name: userName || 'Verified Buyer',
    title: title ? title.trim() : '',
    rating: Number(rating),
    comment: comment.trim(),
    isVerifiedPurchase: true,
    status: 'Pending',
  });

  await recalculateProductRating(productId);
  return review;
};

const updateReview = async (userId, reviewId, { rating, comment, title }) => {
  const review = await Review.findOne({ _id: reviewId, user: userId });
  if (!review) {
    throw new ApiError(404, 'Review not found or unauthorized.');
  }

  if (rating !== undefined) {
    if (rating < 1 || rating > 5) throw new ApiError(400, 'Rating must be between 1 and 5.');
    review.rating = Number(rating);
  }
  if (comment !== undefined) {
    if (comment.trim().length === 0) throw new ApiError(400, 'Review text cannot be empty.');
    review.comment = comment.trim();
  }
  if (title !== undefined) {
    review.title = title.trim();
  }

  await review.save();
  await recalculateProductRating(review.product);
  return review;
};

const deleteReview = async (userId, reviewId) => {
  const review = await Review.findOneAndDelete({ _id: reviewId, user: userId });
  if (!review) {
    throw new ApiError(404, 'Review not found or unauthorized.');
  }
  await recalculateProductRating(review.product);
  return { message: 'Review deleted successfully.' };
};

module.exports = {
  checkReviewEligibility,
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
  recalculateProductRating,
};
