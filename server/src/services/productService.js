const mongoose = require('mongoose');
const { Product, Category } = require('../models');
const ApiError = require('../utils/ApiError');

// Public Catalog API with Filters, Whitelisted Sorting, Search, and Pagination
const getPublicProductsCatalog = async (queryParams = {}) => {
  const page = Math.max(1, parseInt(queryParams.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(queryParams.limit) || 12));
  const skip = (page - 1) * limit;

  const filter = { isActive: true };

  // Category Filter (by slug or ObjectId)
  if (queryParams.category) {
    const categoryDoc = await Category.findOne({
      $or: [
        { slug: queryParams.category.toLowerCase() },
        { _id: queryParams.category.match(/^[0-9a-fA-F]{24}$/) ? queryParams.category : null },
      ],
      isActive: true,
    });
    if (categoryDoc) {
      filter.category = categoryDoc._id;
    } else {
      // If category specified does not exist, return empty dataset cleanly
      return { products: [], pagination: { total: 0, page, pages: 0, limit } };
    }
  }

  // Text Search
  if (queryParams.search && queryParams.search.trim().length > 0) {
    filter.$text = { $search: queryParams.search.trim() };
  }

  // Price Filter
  if (queryParams.minPrice !== undefined || queryParams.maxPrice !== undefined) {
    filter.sellingPrice = {};
    if (queryParams.minPrice !== undefined) filter.sellingPrice.$gte = parseFloat(queryParams.minPrice);
    if (queryParams.maxPrice !== undefined) filter.sellingPrice.$lte = parseFloat(queryParams.maxPrice);
  }

  // Rating Filter
  if (queryParams.minRating !== undefined) {
    filter.averageRating = { $gte: parseFloat(queryParams.minRating) };
  }

  // Featured Filter
  if (queryParams.featured !== undefined) {
    filter.isFeatured = queryParams.featured === 'true';
  }

  // Whitelisted Sorting Options
  const sortOptionMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    priceLow: { sellingPrice: 1 },
    priceHigh: { sellingPrice: -1 },
    rating: { averageRating: -1 },
    popular: { reviewCount: -1 },
  };
  const sort = sortOptionMap[queryParams.sort] || { createdAt: -1 };

  const [productsRaw, total] = await Promise.all([
    Product.find(filter)
      .select('name slug thumbnail images sellingPrice mrp category averageRating reviewCount stockQuantity lowStockThreshold trackInventory isFeatured')
      .populate('category', 'name slug')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ]);

  // Format stock status without exposing raw inventory quantity to public users
  const products = productsRaw.map((prod) => {
    let stockStatus = 'IN_STOCK';
    if (prod.trackInventory) {
      if (prod.stockQuantity <= 0) stockStatus = 'OUT_OF_STOCK';
      else if (prod.stockQuantity <= (prod.lowStockThreshold || 5)) stockStatus = 'LOW_STOCK';
    }
    return {
      _id: prod._id,
      name: prod.name,
      slug: prod.slug,
      thumbnail: prod.thumbnail || prod.images?.[0]?.url || '',
      images: prod.images,
      sellingPrice: prod.sellingPrice,
      mrp: prod.mrp,
      category: prod.category,
      averageRating: prod.averageRating,
      reviewCount: prod.reviewCount,
      stockStatus,
      isFeatured: prod.isFeatured,
    };
  });

  return {
    products,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
      limit,
    },
  };
};

// Public Product Details by Slug or ID
const getPublicProductBySlug = async (slugOrId) => {
  if (!slugOrId) {
    throw new ApiError(400, 'Product identifier is required');
  }

  const isObjectId = mongoose.Types.ObjectId.isValid(slugOrId);
  const filter = isObjectId
    ? { $or: [{ _id: slugOrId }, { slug: slugOrId.toLowerCase() }], isActive: true }
    : { slug: slugOrId.toLowerCase(), isActive: true };

  const product = await Product.findOne(filter)
    .populate('category', 'name slug description')
    .populate('subCategory', 'name slug')
    .lean();

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  let stockStatus = 'IN_STOCK';
  if (product.trackInventory) {
    if (product.stockQuantity <= 0) stockStatus = 'OUT_OF_STOCK';
    else if (product.stockQuantity <= product.lowStockThreshold) stockStatus = 'LOW_STOCK';
  }

  // Omit internal costPrice and return clean public product payload
  delete product.costPrice;

  return {
    ...product,
    stockStatus,
  };
};

// Admin Product Services
const createProduct = async (productData) => {
  const normalizedName = productData.name.trim();
  const normalizedSku = productData.sku.toUpperCase().trim();
  const slug = productData.slug
    ? productData.slug.toLowerCase().trim()
    : normalizedName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

  // Check unique constraints
  const [existingSku, existingSlug] = await Promise.all([
    Product.findOne({ sku: normalizedSku }),
    Product.findOne({ slug }),
  ]);

  if (existingSku) {
    throw new ApiError(400, `Product SKU '${normalizedSku}' already exists`);
  }
  if (existingSlug) {
    throw new ApiError(400, `Product slug '${slug}' already exists`);
  }

  const product = await Product.create({
    ...productData,
    name: normalizedName,
    sku: normalizedSku,
    slug,
  });

  return product;
};

const updateProduct = async (id, updateData) => {
  const product = await Product.findById(id);
  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  if (updateData.sku) {
    const newSku = updateData.sku.toUpperCase().trim();
    if (newSku !== product.sku) {
      const existingSku = await Product.findOne({ sku: newSku });
      if (existingSku) throw new ApiError(400, `Product SKU '${newSku}' already exists`);
      product.sku = newSku;
    }
  }

  if (updateData.slug) {
    const newSlug = updateData.slug.toLowerCase().trim();
    if (newSlug !== product.slug) {
      const existingSlug = await Product.findOne({ slug: newSlug });
      if (existingSlug) throw new ApiError(400, `Product slug '${newSlug}' already exists`);
      product.slug = newSlug;
    }
  }

  // Update allowed fields
  Object.keys(updateData).forEach((key) => {
    if (!['createdAt', 'updatedAt', 'reviewCount', 'averageRating', '_id'].includes(key)) {
      product[key] = updateData[key];
    }
  });

  await product.save();
  return product;
};

const softDeleteProduct = async (id) => {
  const product = await Product.findById(id);
  if (!product) {
    throw new ApiError(404, 'Product not found');
  }
  product.isActive = false;
  await product.save();
  return { message: `Product '${product.name}' archived (soft-deleted) successfully` };
};

const toggleProductStatus = async (id, isActive) => {
  const product = await Product.findById(id);
  if (!product) {
    throw new ApiError(404, 'Product not found');
  }
  product.isActive = isActive;
  await product.save();
  return product;
};

const updateProductInventory = async (id, inventoryData) => {
  const product = await Product.findById(id);
  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  if (inventoryData.stockQuantity !== undefined) {
    if (inventoryData.stockQuantity < 0) {
      throw new ApiError(400, 'Stock quantity cannot be negative');
    }
    product.stockQuantity = inventoryData.stockQuantity;
  } else if (inventoryData.adjustment !== undefined) {
    const newStock = product.stockQuantity + inventoryData.adjustment;
    if (newStock < 0) {
      throw new ApiError(400, `Stock adjustment results in negative stock (${newStock})`);
    }
    product.stockQuantity = newStock;
  }

  await product.save();
  return product;
};

const getLowStockProductsAdmin = async () => {
  return await Product.find({
    trackInventory: true,
    $expr: { $lte: ['$stockQuantity', '$lowStockThreshold'] },
  })
    .populate('category', 'name slug')
    .sort({ stockQuantity: 1 })
    .lean();
};

module.exports = {
  getPublicProductsCatalog,
  getPublicProductBySlug,
  getProductById: getPublicProductBySlug,
  createProduct,
  updateProduct,
  softDeleteProduct,
  toggleProductStatus,
  updateProductInventory,
  getLowStockProductsAdmin,
};
