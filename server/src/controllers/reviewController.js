const reviewService = require('../services/reviewService');
const { sendSuccess } = require('../utils/apiResponse');

const getProductReviews = async (req, res, next) => {
  try {
    const { reviews, pagination } = await reviewService.getProductReviews(req.params.productId, req.query);
    return res.status(200).json({
      success: true,
      message: 'Product reviews fetched successfully',
      data: reviews,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};

const checkEligibility = async (req, res, next) => {
  try {
    const result = await reviewService.checkReviewEligibility(req.user._id, req.params.productId);
    return sendSuccess(res, 200, 'Review eligibility checked', result);
  } catch (error) {
    next(error);
  }
};

const createReview = async (req, res, next) => {
  try {
    const userName = (req.user.firstName || 'User') + ' ' + (req.user.lastName || '');
    const review = await reviewService.createReview(req.user._id, userName.trim(), req.params.productId, req.body);
    return sendSuccess(res, 201, 'Review submitted successfully', review);
  } catch (error) {
    next(error);
  }
};

const updateReview = async (req, res, next) => {
  try {
    const review = await reviewService.updateReview(req.user._id, req.params.id, req.body);
    return sendSuccess(res, 200, 'Review updated successfully', review);
  } catch (error) {
    next(error);
  }
};

const deleteReview = async (req, res, next) => {
  try {
    const result = await reviewService.deleteReview(req.user._id, req.params.id);
    return sendSuccess(res, 200, result.message);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProductReviews,
  checkEligibility,
  createReview,
  updateReview,
  deleteReview,
};
