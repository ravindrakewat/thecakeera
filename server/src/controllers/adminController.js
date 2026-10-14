const { createNotification } = require('../services/notificationService');
const shipmentService = require('../services/shipmentService');
const invoiceService = require('../services/invoiceService');
const { recalculateProductRating } = require('../services/reviewService');
const mongoose = require('mongoose');
const {
  User,
  Category,
  Product,
  Order,
  Payment,
  Coupon,
  Review,
  Banner,
  StoreSettings,
  Shipment,
  Invoice,
} = require('../models');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');

// 1. Dashboard Overview Metrics
const getDashboardMetrics = async (req, res, next) => {
  try {
    const [
      totalOrders,
      pendingOrders,
      totalCustomers,
      totalProducts,
      lowStockCount,
      revenueResult,
      recentOrders,
      lowStockProducts,
    ] = await Promise.all([
      Order.countDocuments({ orderStatus: { $ne: 'CANCELLED' } }),
      Order.countDocuments({ orderStatus: { $in: ['PLACED', 'PAYMENT_PENDING', 'PROCESSING'] } }),
      User.countDocuments({ role: { $ne: 'admin' } }),
      Product.countDocuments({ isActive: true }),
      Product.countDocuments({ trackInventory: true, stockQuantity: { $lte: 5 } }),
      Order.aggregate([
        { $match: { $or: [{ paymentStatus: 'PAID' }, { orderStatus: { $in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] } }] } },
        { $group: { _id: null, total: { $sum: '$grandTotal' } } },
      ]),
      Order.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('user', 'firstName lastName email')
        .lean(),
      Product.find({ trackInventory: true, stockQuantity: { $lte: 5 } })
        .select('name sku stockQuantity stockStatus sellingPrice')
        .limit(5)
        .lean(),
    ]);

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    return sendSuccess(res, 200, 'Dashboard metrics fetched successfully', {
      totalOrders,
      pendingOrders,
      totalCustomers,
      totalProducts,
      lowStockProducts: lowStockCount,
      totalRevenue,
      recentOrders,
      lowStockAlerts: lowStockProducts,
    });
  } catch (error) {
    next(error);
  }
};

// 2. Dashboard Revenue Trend Aggregation
const getRevenueTrend = async (req, res, next) => {
  try {
    const period = req.query.period || '30d';
    let days = 30;
    if (period === '7d') days = 7;
    if (period === '90d') days = 90;
    if (period === '1y') days = 365;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const trend = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          $or: [{ paymentStatus: 'PAID' }, { orderStatus: { $in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] } }],
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$grandTotal' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return sendSuccess(res, 200, 'Revenue trend aggregated successfully', trend);
  } catch (error) {
    next(error);
  }
};

// 3. Admin Product Listing
const getAdminProducts = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.search) {
      filter[$or] = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { sku: { $regex: req.query.search, $options: 'i' } },
        { slug: { $regex: req.query.search, $options: 'i' } },
      ];
    }
    if (req.query.category) {
      filter.category = req.query.category;
    }
    if (req.query.status) {
      if (req.query.status === 'active') filter.isActive = true;
      if (req.query.status === 'inactive') filter.isActive = false;
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    return sendSuccess(res, 200, 'Admin products fetched successfully', products, {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

// 4. Admin Inventory Management List
const getAdminInventory = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.search) {
      filter[$or] = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { sku: { $regex: req.query.search, $options: 'i' } },
      ];
    }
    if (req.query.status) {
      if (req.query.status === 'IN_STOCK') filter.stockStatus = 'IN_STOCK';
      if (req.query.status === 'LOW_STOCK') filter.stockStatus = 'LOW_STOCK';
      if (req.query.status === 'OUT_OF_STOCK') filter.stockStatus = 'OUT_OF_STOCK';
    }

    const [inventory, total] = await Promise.all([
      Product.find(filter)
        .select('name sku stockQuantity lowStockThreshold stockStatus trackInventory sellingPrice')
        .sort({ stockQuantity: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    return sendSuccess(res, 200, 'Inventory list fetched successfully', inventory, {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

// Update Inventory Stock Quantity
const updateAdminInventory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { stockQuantity, lowStockThreshold } = req.body;

    const parsedStock = parseInt(stockQuantity);
    if (isNaN(parsedStock) || parsedStock < 0) {
      throw new ApiError(400, 'Stock quantity must be a non-negative integer.');
    }

    const product = await Product.findById(id);
    if (!product) {
      throw new ApiError(404, 'Product not found');
    }

    product.stockQuantity = parsedStock;
    if (lowStockThreshold !== undefined) {
      product.lowStockThreshold = Math.max(0, parseInt(lowStockThreshold) || 5);
    }

    // Update stockStatus
    if (product.trackInventory) {
      if (product.stockQuantity <= 0) {
        product.stockStatus = 'OUT_OF_STOCK';
      } else if (product.stockQuantity <= product.lowStockThreshold) {
        product.stockStatus = 'LOW_STOCK';
      } else {
        product.stockStatus = 'IN_STOCK';
      }
    }

    await product.save();
    return sendSuccess(res, 200, 'Inventory stock updated successfully', product);
  } catch (error) {
    next(error);
  }
};

// 5. Admin Orders Listing
const getAdminOrders = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.search) {
      filter[$or] = [
        { orderNumber: { $regex: req.query.search, $options: 'i' } },
        { 'shippingAddress.fullName': { $regex: req.query.search, $options: 'i' } },
        { 'shippingAddress.phone': { $regex: req.query.search, $options: 'i' } },
      ];
    }
    if (req.query.orderStatus) {
      filter.orderStatus = req.query.orderStatus;
    }
    if (req.query.paymentStatus) {
      filter.paymentStatus = req.query.paymentStatus;
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('user', 'firstName lastName email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
    ]);

    return sendSuccess(res, 200, 'Admin orders fetched successfully', orders, {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

// Get Admin Order Detail
const getAdminOrderDetail = async (req, res, next) => {
  try {
    const { orderNumber } = req.params;
    const order = await Order.findOne({ orderNumber }).populate('user', 'firstName lastName email phone').lean();
    if (!order) {
      throw new ApiError(404, 'Order not found');
    }

    const [payment, shipment, invoice] = await Promise.all([
      Payment.findOne({ order: order._id }).lean(),
      Shipment.findOne({ order: order._id }).lean(),
      Invoice.findOne({ order: order._id }).lean(),
    ]);

    return sendSuccess(res, 200, 'Order details fetched successfully', {
      order,
      payment,
      shipment,
      invoice,
    });
  } catch (error) {
    next(error);
  }
};

// Update Admin Order Status
const updateAdminOrderStatus = async (req, res, next) => {
  try {
    const { orderNumber } = req.params;
    const { orderStatus, paymentStatus } = req.body;

    const allowedStatuses = [
      'PAYMENT_PENDING',
      'PLACED',
      'CONFIRMED',
      'PROCESSING',
      'PACKED',
      'SHIPPED',
      'DELIVERED',
      'CANCELLED',
    ];
    if (orderStatus && !allowedStatuses.includes(orderStatus)) {
      throw new ApiError(400, 'Invalid orderStatus: ' + orderStatus);
    }

    const order = await Order.findOne({ orderNumber });
    if (!order) {
      throw new ApiError(404, 'Order not found');
    }

    // State transition guard: Shipped or delivered orders cannot be cancelled
    if (orderStatus === 'CANCELLED' && ['SHIPPED', 'DELIVERED'].includes(order.orderStatus)) {
      throw new ApiError(400, `Cannot cancel an order that is already ${order.orderStatus}.`);
    }

    // State transition guard: Delivered orders cannot revert to previous states
    if (order.orderStatus === 'DELIVERED' && orderStatus && orderStatus !== 'DELIVERED') {
      throw new ApiError(400, 'Delivered orders cannot be transitioned to another status.');
    }

    // Payment security: Admins cannot arbitrarily mark Razorpay (ONLINE) orders as PAID without verified gateway completion
    if (paymentStatus === 'PAID' && order.paymentMethod === 'ONLINE' && order.paymentStatus !== 'PAID') {
      throw new ApiError(400, 'Online payments cannot be manually marked as paid. Must be verified through payment gateway.');
    }

    if (orderStatus) order.orderStatus = orderStatus;
    if (paymentStatus && ['PENDING', 'PAID', 'FAILED', 'REFUNDED'].includes(paymentStatus)) {
      order.paymentStatus = paymentStatus;
    }

    await order.save();
    if (orderStatus) {
      const notifMap = {
        CONFIRMED: { title: 'Order Confirmed', message: 'Your order #' + order.orderNumber + ' has been confirmed.', type: 'ORDER_CONFIRMED' },
        PROCESSING: { title: 'Order Processing', message: 'Your order #' + order.orderNumber + ' is being prepared.', type: 'ORDER_PROCESSING' },
        PACKED: { title: 'Order Packed', message: 'Your order #' + order.orderNumber + ' has been packed.', type: 'ORDER_PACKED' },
        SHIPPED: { title: 'Order Shipped', message: 'Your order #' + order.orderNumber + ' has been shipped!', type: 'ORDER_SHIPPED' },
        DELIVERED: { title: 'Order Delivered', message: 'Your order #' + order.orderNumber + ' has been delivered. Thank you!', type: 'ORDER_DELIVERED' },
        CANCELLED: { title: 'Order Cancelled', message: 'Your order #' + order.orderNumber + ' has been cancelled.', type: 'ORDER_CANCELLED' },
      };
      if (notifMap[orderStatus]) {
        await createNotification({
          user: order.user,
          title: notifMap[orderStatus].title,
          message: notifMap[orderStatus].message,
          type: notifMap[orderStatus].type,
          order: order._id,
          orderNumber: order.orderNumber,
          referenceId: orderStatus + '_' + order.orderNumber,
        });
      }
    }
    return sendSuccess(res, 200, 'Order status updated successfully', order);
  } catch (error) {
    next(error);
  }
};

// 6. Admin Customer Management
const getAdminCustomers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = { role: { $ne: 'admin' } };
    if (req.query.search) {
      filter[$or] = [
        { firstName: { $regex: req.query.search, $options: 'i' } },
        { lastName: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
        { phone: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(filter),
    ]);

    return sendSuccess(res, 200, 'Customers fetched successfully', users, {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

// Customer Detail & Orders
const getAdminCustomerDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('-password').lean();
    if (!user) {
      throw new ApiError(404, 'Customer not found');
    }

    const orders = await Order.find({ user: id }).sort({ createdAt: -1 }).lean();
    return sendSuccess(res, 200, 'Customer details fetched successfully', { customer: user, orders });
  } catch (error) {
    next(error);
  }
};

// Toggle Customer Account Status
const toggleCustomerStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      throw new ApiError(404, 'Customer not found');
    }

    user.isActive = req.body.isActive !== undefined ? req.body.isActive : !user.isActive;
    await user.save();
    return sendSuccess(res, 200, 'Customer status updated successfully', {
      _id: user._id,
      isActive: user.isActive,
    });
  } catch (error) {
    next(error);
  }
};

// 7. Coupon Management APIs
const getAdminCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
    return sendSuccess(res, 200, 'Coupons fetched successfully', coupons);
  } catch (error) {
    next(error);
  }
};

const createAdminCoupon = async (req, res, next) => {
  try {
    const { code, discountType, discountAmount, minPurchaseAmount, maxDiscountAmount, expiryDate, usageLimit } = req.body;
    if (!code || !discountAmount || !expiryDate) {
      throw new ApiError(400, 'Code, discountAmount, and expiryDate are required.');
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      discountType: discountType || 'percentage',
      discountAmount,
      minPurchaseAmount: minPurchaseAmount || 0,
      maxDiscountAmount: maxDiscountAmount || 0,
      expiryDate,
      usageLimit: usageLimit || 100,
    });
    return sendSuccess(res, 201, 'Coupon created successfully', coupon);
  } catch (error) {
    next(error);
  }
};

const updateAdminCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findByIdAndUpdate(id, req.body, { new: true });
    if (!coupon) throw new ApiError(404, 'Coupon not found');
    return sendSuccess(res, 200, 'Coupon updated successfully', coupon);
  } catch (error) {
    next(error);
  }
};

const deleteAdminCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Coupon.findByIdAndDelete(id);
    return sendSuccess(res, 200, 'Coupon deleted successfully');
  } catch (error) {
    next(error);
  }
};

// 8. Review Moderation APIs
const getAdminReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find()
      .populate('product', 'name slug')
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .lean();
    return sendSuccess(res, 200, 'Reviews fetched successfully', reviews);
  } catch (error) {
    next(error);
  }
};

const updateReviewStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['Pending', 'Approved', 'Rejected'].includes(status)) {
      throw new ApiError(400, 'Status must be Pending, Approved, or Rejected');
    }

    const review = await Review.findByIdAndUpdate(id, { status }, { new: true });
    if (!review) throw new ApiError(404, 'Review not found');

    if (review.product) {
      await recalculateProductRating(review.product);
    }

    return sendSuccess(res, 200, 'Review status updated successfully', review);
  } catch (error) {
    next(error);
  }
};

const deleteAdminReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const review = await Review.findByIdAndDelete(id);
    if (review && review.product) {
      await recalculateProductRating(review.product);
    }
    return sendSuccess(res, 200, 'Review deleted successfully');
  } catch (error) {
    next(error);
  }
};

// 9. Banner Management APIs
const getAdminBanners = async (req, res, next) => {
  try {
    const banners = await Banner.find().sort({ position: 1, createdAt: -1 }).lean();
    return sendSuccess(res, 200, 'Banners fetched successfully', banners);
  } catch (error) {
    next(error);
  }
};

const createAdminBanner = async (req, res, next) => {
  try {
    const { title, subtitle, imageUrl, linkUrl, position, isActive } = req.body;
    if (!title || !imageUrl) {
      throw new ApiError(400, 'Title and imageUrl are required.');
    }

    const banner = await Banner.create({
      title,
      subtitle: subtitle || '',
      imageUrl,
      linkUrl: linkUrl || '/shop',
      position: position || 0,
      isActive: isActive !== undefined ? isActive : true,
    });
    return sendSuccess(res, 201, 'Banner created successfully', banner);
  } catch (error) {
    next(error);
  }
};

const updateAdminBanner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findByIdAndUpdate(id, req.body, { new: true });
    if (!banner) throw new ApiError(404, 'Banner not found');
    return sendSuccess(res, 200, 'Banner updated successfully', banner);
  } catch (error) {
    next(error);
  }
};

const deleteAdminBanner = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Banner.findByIdAndDelete(id);
    return sendSuccess(res, 200, 'Banner deleted successfully');
  } catch (error) {
    next(error);
  }
};

// 10. Reports Aggregation APIs
const getSalesReport = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const filter = {
      orderStatus: { $ne: 'CANCELLED' },
    };

    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt[$gte] = new Date(from);
      if (to) filter.createdAt[$lte] = new Date(to);
    }

    const report = await Order.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          grossSales: { $sum: '$subtotal' },
          discount: { $sum: '$discount' },
          shipping: { $sum: '$shippingCharge' },
          tax: { $sum: '$tax' },
          netSales: { $sum: '$grandTotal' },
        },
      },
    ]);

    const result = report.length > 0 ? report[0] : {
      totalOrders: 0,
      grossSales: 0,
      discount: 0,
      shipping: 0,
      tax: 0,
      netSales: 0,
    };

    return sendSuccess(res, 200, 'Sales report generated successfully', result);
  } catch (error) {
    next(error);
  }
};

const getInventoryReport = async (req, res, next) => {
  try {
    const [totalProducts, inStock, lowStock, outOfStock, topLowStock] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ stockStatus: 'IN_STOCK' }),
      Product.countDocuments({ stockStatus: 'LOW_STOCK' }),
      Product.countDocuments({ stockStatus: 'OUT_OF_STOCK' }),
      Product.find({ stockQuantity: { $lte: 5 } })
        .select('name sku stockQuantity stockStatus sellingPrice')
        .sort({ stockQuantity: 1 })
        .limit(10)
        .lean(),
    ]);

    return sendSuccess(res, 200, 'Inventory report generated successfully', {
      totalProducts,
      inStock,
      lowStock,
      outOfStock,
      topLowStock,
    });
  } catch (error) {
    next(error);
  }
};

// 11. Admin Store Settings API
const getAdminSettings = async (req, res, next) => {
  try {
    let settings = await StoreSettings.findOne().lean();
    if (!settings) {
      settings = await StoreSettings.create({});
    }
    return sendSuccess(res, 200, 'Store settings fetched successfully', settings);
  } catch (error) {
    next(error);
  }
};

const updateAdminSettings = async (req, res, next) => {
  try {
    let settings = await StoreSettings.findOne();
    if (!settings) {
      settings = new StoreSettings(req.body);
    } else {
      // Whitelist update fields to protect internal settings
      const allowed = [
        'storeName',
        'supportEmail',
        'supportPhone',
        'currency',
        'freeShippingThreshold',
        'defaultShippingCharge',
        'codAvailable',
        'prepaidAvailable',
        'minOrderValue',
        'maxOrderValue',
        'estimatedDispatchDays',
        'estimatedDeliveryDays',
        'shippingActive',
        'serviceablePincodes',
        'excludedPincodes',
        'shippingZones',
        'taxRate',
        'legalBusinessName',
        'businessAddress',
        'gstin',
        'stateCode',
        'stateName',
        'invoicePrefix',
        'invoiceContactPhone',
        'invoiceContactEmail',
        'pricesIncludeTax',
      ];
      for (const key of allowed) {
        if (req.body[key] !== undefined) {
          settings[key] = req.body[key];
        }
      }
    }
    await settings.save();
    return sendSuccess(res, 200, 'Store settings updated successfully', settings);
  } catch (error) {
    next(error);
  }
};

// 12. Admin Shipment Management APIs
const getAdminShipments = async (req, res, next) => {
  try {
    const { shipments, pagination } = await shipmentService.listAdminShipments(req.query);
    return sendSuccess(res, 200, 'Shipments fetched successfully', shipments, pagination);
  } catch (error) {
    next(error);
  }
};

const getAdminShipmentDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const shipment = await Shipment.findById(id)
      .populate('order')
      .populate('user', 'firstName lastName email phone')
      .lean();
    if (!shipment) {
      throw new ApiError(404, 'Shipment not found');
    }
    return sendSuccess(res, 200, 'Shipment details fetched successfully', shipment);
  } catch (error) {
    next(error);
  }
};

const createAdminShipment = async (req, res, next) => {
  try {
    const { orderNumber } = req.params;
    const shipment = await shipmentService.createShipmentForOrder(orderNumber, req.body);
    return sendSuccess(res, 201, 'Shipment created successfully', shipment);
  } catch (error) {
    next(error);
  }
};

const updateAdminShipment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const shipment = await shipmentService.updateShipmentDetails(id, req.body);
    return sendSuccess(res, 200, 'Shipment updated successfully', shipment);
  } catch (error) {
    next(error);
  }
};

const dispatchAdminShipment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const shipment = await shipmentService.dispatchShipment(id, req.body);
    return sendSuccess(res, 200, 'Shipment dispatched successfully', shipment);
  } catch (error) {
    next(error);
  }
};

const deliverAdminShipment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const shipment = await shipmentService.deliverShipment(id, req.body);
    return sendSuccess(res, 200, 'Shipment marked as delivered successfully', shipment);
  } catch (error) {
    next(error);
  }
};

// 13. Admin Invoice Management APIs
const getAdminInvoices = async (req, res, next) => {
  try {
    const { invoices, pagination } = await invoiceService.listAdminInvoices(req.query);
    return sendSuccess(res, 200, 'Invoices fetched successfully', invoices, pagination);
  } catch (error) {
    next(error);
  }
};

const getAdminOrderInvoice = async (req, res, next) => {
  try {
    const { orderNumber } = req.params;
    const invoice = await invoiceService.getOrCreateInvoiceForOrder(orderNumber, null, true);

    if (req.query.format === 'pdf' || req.query.download === 'pdf') {
      const pdfBuffer = await invoiceService.generateInvoicePDFBuffer(invoice);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="Invoice-${invoice.invoiceNumber}.pdf"`);
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      return res.end(pdfBuffer);
    }

    return sendSuccess(res, 200, 'Invoice fetched successfully', invoice);
  } catch (error) {
    next(error);
  }
};

const downloadAdminOrderInvoice = async (req, res, next) => {
  try {
    const { orderNumber } = req.params;
    const invoice = await invoiceService.getOrCreateInvoiceForOrder(orderNumber, null, true);
    const pdfBuffer = await invoiceService.generateInvoicePDFBuffer(invoice);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Invoice-${invoice.invoiceNumber}.pdf"`);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    return res.end(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardMetrics,
  getRevenueTrend,
  getAdminProducts,
  getAdminInventory,
  updateAdminInventory,
  getAdminOrders,
  getAdminOrderDetail,
  updateAdminOrderStatus,
  getAdminCustomers,
  getAdminCustomerDetail,
  toggleCustomerStatus,
  getAdminCoupons,
  createAdminCoupon,
  updateAdminCoupon,
  deleteAdminCoupon,
  getAdminReviews,
  updateReviewStatus,
  deleteAdminReview,
  getAdminBanners,
  createAdminBanner,
  updateAdminBanner,
  deleteAdminBanner,
  getSalesReport,
  getInventoryReport,
  getAdminSettings,
  updateAdminSettings,
  getAdminShipments,
  getAdminShipmentDetail,
  createAdminShipment,
  updateAdminShipment,
  dispatchAdminShipment,
  deliverAdminShipment,
  getAdminInvoices,
  getAdminOrderInvoice,
  downloadAdminOrderInvoice,
};

