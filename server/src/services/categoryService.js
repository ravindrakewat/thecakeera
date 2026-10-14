const { Category, Product } = require('../models');
const ApiError = require('../utils/ApiError');

// Public Category Fetching
const getPublicCategories = async () => {
  return await Category.find({ isActive: true })
    .select('name slug description image parentCategory sortOrder seoTitle seoDescription')
    .sort({ sortOrder: 1, name: 1 })
    .lean();
};

const getPublicCategoryBySlug = async (slug) => {
  return await Category.findOne({ slug: slug.toLowerCase(), isActive: true })
    .select('name slug description image parentCategory sortOrder seoTitle seoDescription')
    .lean();
};

// Admin Category Fetching
const getAllCategoriesAdmin = async () => {
  return await Category.find()
    .populate('parentCategory', 'name slug')
    .sort({ sortOrder: 1, createdAt: -1 })
    .lean();
};

const getCategoryByIdAdmin = async (id) => {
  const category = await Category.findById(id).populate('parentCategory', 'name slug').lean();
  if (!category) {
    throw new ApiError(404, 'Category not found');
  }
  return category;
};

// Category Mutation
const createCategory = async (categoryData) => {
  const normalizedName = categoryData.name.trim();
  const slug = categoryData.slug
    ? categoryData.slug.toLowerCase().trim()
    : normalizedName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

  const existingSlug = await Category.findOne({ slug });
  if (existingSlug) {
    throw new ApiError(400, `Category slug '${slug}' already exists`);
  }

  const category = await Category.create({
    ...categoryData,
    name: normalizedName,
    slug,
  });

  return category;
};

const updateCategory = async (id, updateData) => {
  const category = await Category.findById(id);
  if (!category) {
    throw new ApiError(404, 'Category not found');
  }

  if (updateData.name) {
    category.name = updateData.name.trim();
  }

  if (updateData.slug) {
    const newSlug = updateData.slug.toLowerCase().trim();
    if (newSlug !== category.slug) {
      const existing = await Category.findOne({ slug: newSlug });
      if (existing) {
        throw new ApiError(400, `Category slug '${newSlug}' already exists`);
      }
      category.slug = newSlug;
    }
  }

  if (updateData.description !== undefined) category.description = updateData.description;
  if (updateData.image !== undefined) category.image = updateData.image;
  if (updateData.parentCategory !== undefined) category.parentCategory = updateData.parentCategory || null;
  if (updateData.sortOrder !== undefined) category.sortOrder = updateData.sortOrder;
  if (updateData.seoTitle !== undefined) category.seoTitle = updateData.seoTitle;
  if (updateData.seoDescription !== undefined) category.seoDescription = updateData.seoDescription;
  if (updateData.isActive !== undefined) category.isActive = updateData.isActive;

  await category.save();
  return category;
};

const toggleCategoryStatus = async (id, isActive) => {
  const category = await Category.findById(id);
  if (!category) {
    throw new ApiError(404, 'Category not found');
  }
  category.isActive = isActive;
  await category.save();
  return category;
};

const deleteCategorySafely = async (id) => {
  const category = await Category.findById(id);
  if (!category) {
    throw new ApiError(404, 'Category not found');
  }

  // Check product references before deleting
  const productCount = await Product.countDocuments({ category: id });
  if (productCount > 0) {
    throw new ApiError(400, `Category '${category.name}' contains ${productCount} active products and cannot be deleted. Deactivate it instead.`);
  }

  // Check child subcategories
  const childCount = await Category.countDocuments({ parentCategory: id });
  if (childCount > 0) {
    throw new ApiError(400, `Category '${category.name}' contains ${childCount} child subcategories and cannot be deleted.`);
  }

  await category.deleteOne();
  return { message: `Category '${category.name}' deleted successfully` };
};

module.exports = {
  getPublicCategories,
  getPublicCategoryBySlug,
  getAllCategoriesAdmin,
  getCategoryByIdAdmin,
  createCategory,
  updateCategory,
  toggleCategoryStatus,
  deleteCategorySafely,
};
