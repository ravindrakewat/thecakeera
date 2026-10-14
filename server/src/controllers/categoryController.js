const categoryService = require('../services/categoryService');
const { sendSuccess } = require('../utils/apiResponse');

// Public endpoints
const getPublicCategories = async (req, res, next) => {
  try {
    const categories = await categoryService.getPublicCategories();
    return sendSuccess(res, 200, 'Public categories fetched successfully', categories);
  } catch (error) {
    next(error);
  }
};

const getPublicCategoryBySlug = async (req, res, next) => {
  try {
    const category = await categoryService.getPublicCategoryBySlug(req.params.slug);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    return sendSuccess(res, 200, 'Category details fetched successfully', category);
  } catch (error) {
    next(error);
  }
};

// Admin endpoints
const getAllCategoriesAdmin = async (req, res, next) => {
  try {
    const categories = await categoryService.getAllCategoriesAdmin();
    return sendSuccess(res, 200, 'All categories fetched for admin', categories);
  } catch (error) {
    next(error);
  }
};

const getCategoryByIdAdmin = async (req, res, next) => {
  try {
    const category = await categoryService.getCategoryByIdAdmin(req.params.id);
    return sendSuccess(res, 200, 'Category details fetched', category);
  } catch (error) {
    next(error);
  }
};

const createCategory = async (req, res, next) => {
  try {
    const category = await categoryService.createCategory(req.body);
    return sendSuccess(res, 201, 'Category created successfully', category);
  } catch (error) {
    next(error);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const category = await categoryService.updateCategory(req.params.id, req.body);
    return sendSuccess(res, 200, 'Category updated successfully', category);
  } catch (error) {
    next(error);
  }
};

const toggleCategoryStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const category = await categoryService.toggleCategoryStatus(req.params.id, isActive !== undefined ? isActive : false);
    return sendSuccess(res, 200, `Category status updated to ${category.isActive ? 'Active' : 'Inactive'}`, category);
  } catch (error) {
    next(error);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    const result = await categoryService.deleteCategorySafely(req.params.id);
    return sendSuccess(res, 200, result.message);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPublicCategories,
  getPublicCategoryBySlug,
  getAllCategoriesAdmin,
  getCategoryByIdAdmin,
  createCategory,
  updateCategory,
  toggleCategoryStatus,
  deleteCategory,
};
