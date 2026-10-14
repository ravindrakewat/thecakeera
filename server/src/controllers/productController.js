const productService = require('../services/productService');
const { sendSuccess, sendPaginatedSuccess } = require('../utils/apiResponse');

// Public catalog listing
const getProducts = async (req, res, next) => {
  try {
    const { products, pagination } = await productService.getPublicProductsCatalog(req.query);
    return sendPaginatedSuccess(res, 200, 'Catalog products fetched successfully', products, pagination);
  } catch (error) {
    next(error);
  }
};

// Public product details by slug or id
const getProductBySlug = async (req, res, next) => {
  try {
    const identifier = req.params.slug || req.params.id || req.params.productId;
    const product = await productService.getPublicProductBySlug(identifier);
    return sendSuccess(res, 200, 'Product details fetched successfully', product);
  } catch (error) {
    next(error);
  }
};

// Admin create product
const createProduct = async (req, res, next) => {
  try {
    const product = await productService.createProduct(req.body);
    return sendSuccess(res, 201, 'Product created successfully', product);
  } catch (error) {
    next(error);
  }
};

// Admin update product
const updateProduct = async (req, res, next) => {
  try {
    const product = await productService.updateProduct(req.params.id, req.body);
    return sendSuccess(res, 200, 'Product updated successfully', product);
  } catch (error) {
    next(error);
  }
};

// Admin soft-delete product
const deleteProduct = async (req, res, next) => {
  try {
    const result = await productService.softDeleteProduct(req.params.id);
    return sendSuccess(res, 200, result.message);
  } catch (error) {
    next(error);
  }
};

// Admin status toggle
const toggleProductStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const product = await productService.toggleProductStatus(req.params.id, isActive !== undefined ? isActive : false);
    return sendSuccess(res, 200, `Product status updated to ${product.isActive ? 'Active' : 'Inactive'}`, product);
  } catch (error) {
    next(error);
  }
};

// Admin inventory update
const updateInventory = async (req, res, next) => {
  try {
    const product = await productService.updateProductInventory(req.params.id, req.body);
    return sendSuccess(res, 200, 'Inventory updated successfully', {
      _id: product._id,
      name: product.name,
      stockQuantity: product.stockQuantity,
      stockStatus: product.stockStatus,
    });
  } catch (error) {
    next(error);
  }
};

// Admin low stock report
const getLowStockProducts = async (req, res, next) => {
  try {
    const products = await productService.getLowStockProductsAdmin();
    return sendSuccess(res, 200, 'Low stock products fetched successfully', products);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductStatus,
  updateInventory,
  getLowStockProducts,
};
