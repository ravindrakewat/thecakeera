const { Wishlist, Product } = require('../models');
const ApiError = require('../utils/ApiError');

const formatWishlistProducts = (wishlistDoc) => {
  if (!wishlistDoc || !wishlistDoc.products) {
    return [];
  }

  return wishlistDoc.products
    .filter((prod) => prod && prod.isActive !== false)
    .map((prod) => {
      const sellingPrice = prod.sellingPrice || prod.price || 0;
      const mrp = prod.mrp || prod.originalPrice || sellingPrice;

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
        sellingPrice,
        mrp,
        averageRating: prod.averageRating || 5.0,
        reviewCount: prod.reviewCount || 0,
        stockStatus,
        category: prod.category,
      };
    });
};

const getUserWishlist = async (userId) => {
  let wishlist = await Wishlist.findOne({ user: userId }).populate({
    path: 'products',
    select: 'name slug thumbnail images sellingPrice mrp averageRating reviewCount stockQuantity lowStockThreshold trackInventory isActive category',
  });

  if (!wishlist) {
    wishlist = await Wishlist.create({ user: userId, products: [] });
  }

  return { products: formatWishlistProducts(wishlist) };
};

const addToWishlist = async (userId, productId) => {
  const product = await Product.findById(productId);
  if (!product || product.isActive === false) {
    throw new ApiError(400, 'Product is no longer available');
  }

  let wishlist = await Wishlist.findOne({ user: userId });
  if (!wishlist) {
    wishlist = await Wishlist.create({ user: userId, products: [] });
  }

  const exists = wishlist.products.some((id) => id.toString() === productId.toString());
  if (!exists) {
    wishlist.products.push(productId);
    await wishlist.save();
  }

  return await getUserWishlist(userId);
};

const removeFromWishlist = async (userId, productId) => {
  const wishlist = await Wishlist.findOne({ user: userId });
  if (wishlist) {
    wishlist.products = wishlist.products.filter((id) => id.toString() !== productId.toString());
    await wishlist.save();
  }
  return await getUserWishlist(userId);
};

const clearUserWishlist = async (userId) => {
  const wishlist = await Wishlist.findOne({ user: userId });
  if (wishlist) {
    wishlist.products = [];
    await wishlist.save();
  }
  return await getUserWishlist(userId);
};

const mergeGuestWishlist = async (userId, productIds = []) => {
  let wishlist = await Wishlist.findOne({ user: userId });
  if (!wishlist) {
    wishlist = await Wishlist.create({ user: userId, products: [] });
  }

  for (const pId of productIds) {
    if (!pId) continue;
    const product = await Product.findById(pId);
    if (!product || product.isActive === false) continue;

    const exists = wishlist.products.some((id) => id.toString() === pId.toString());
    if (!exists) {
      wishlist.products.push(pId);
    }
  }

  await wishlist.save();
  return await getUserWishlist(userId);
};

module.exports = {
  getUserWishlist,
  addToWishlist,
  removeFromWishlist,
  clearUserWishlist,
  mergeGuestWishlist,
};
