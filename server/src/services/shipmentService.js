const { Order, Shipment, User } = require('../models');
const { createNotification } = require('./notificationService');
const ApiError = require('../utils/ApiError');
const ManualShippingProvider = require('./shippingProviders/manualShippingProvider');

const manualProvider = new ManualShippingProvider();

/**
 * Generate a unique atomic shipment number
 */
const generateShipmentNumber = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `SHP-${dateStr}-${randomSuffix}`;
};

/**
 * Validate tracking URL scheme: only absolute http:// and https:// URLs allowed.
 * Rejects javascript:, data:, file:, relative, or malformed URLs.
 */
const validateTrackingUrl = (url) => {
  if (url === undefined || url === null || url === '') {
    return true;
  }
  if (typeof url !== 'string') {
    throw new ApiError(400, 'Tracking URL must be a string.');
  }
  const trimmed = url.trim();
  if (trimmed === '') {
    return true;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new ApiError(400, `Invalid tracking URL protocol '${parsed.protocol}'. Only http:// and https:// URLs are allowed.`);
    }
    if (!parsed.hostname || parsed.hostname.length === 0) {
      throw new ApiError(400, 'Invalid tracking URL: missing valid hostname.');
    }
    return true;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(400, 'Invalid tracking URL format. Must be an absolute http:// or https:// URL.');
  }
};

/**
 * Valid order status transitions for fulfillment
 */
const ALLOWED_FULFILLMENT_TRANSITIONS = {
  PLACED: ['CONFIRMED', 'PROCESSING', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'PACKED', 'CANCELLED'],
  PROCESSING: ['PACKED', 'SHIPPED', 'CANCELLED'],
  PACKED: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'], // Shipped orders cannot be cancelled via normal status change
  DELIVERED: [], // Terminal state
  CANCELLED: [], // Terminal state
};

/**
 * Create a new shipment for an order (Admin Only)
 */
const createShipmentForOrder = async (orderNumber, shipmentData) => {
  const order = await Order.findOne({ orderNumber });
  if (!order) {
    throw new ApiError(404, 'Order not found.');
  }

  if (order.orderStatus === 'CANCELLED') {
    throw new ApiError(400, 'Cannot create shipment for a cancelled order.');
  }

  // Prevent duplicate shipments for the same order
  const existingShipment = await Shipment.findOne({ order: order._id });
  if (existingShipment) {
    throw new ApiError(409, `Shipment already exists for order #${orderNumber} (${existingShipment.shipmentNumber}).`);
  }

  // Field whitelist to prevent mass-assignment
  const { carrier, awbNumber, trackingUrl, estimatedDeliveryAt, notes } = shipmentData;

  if (trackingUrl) {
    validateTrackingUrl(trackingUrl);
  }

  const shipmentNumber = generateShipmentNumber();
  const providerResult = await manualProvider.createShipment(order, {
    carrier,
    awbNumber,
    trackingUrl,
  });

  const trackingEvents = [
    {
      timestamp: new Date(),
      status: 'PACKED',
      location: 'Fulfillment Center',
      description: 'Shipment created and ready for courier pickup.',
    },
  ];

  if (awbNumber) {
    trackingEvents.push({
      timestamp: new Date(),
      status: 'AWB_ASSIGNED',
      location: 'Logistics Hub',
      description: `AWB ${awbNumber} assigned for ${carrier || 'courier'}.`,
    });
  }

  const shipment = new Shipment({
    order: order._id,
    orderNumber: order.orderNumber,
    user: order.user,
    shipmentNumber,
    carrier: carrier || 'Standard Courier',
    provider: 'MANUAL',
    providerShipmentId: providerResult.providerShipmentId,
    awbNumber: awbNumber || '',
    trackingUrl: trackingUrl || '',
    shipmentStatus: 'PACKED',
    estimatedDeliveryAt: estimatedDeliveryAt ? new Date(estimatedDeliveryAt) : null,
    trackingEvents,
    metadata: { notes: notes || '' },
  });

  await shipment.save();

  // Transition order status to PACKED if currently in CONFIRMED/PROCESSING
  if (['CONFIRMED', 'PROCESSING', 'PLACED'].includes(order.orderStatus)) {
    order.orderStatus = 'PACKED';
    await order.save();

    await createNotification({
      user: order.user,
      title: 'Order Packed',
      message: `Your order #${order.orderNumber} has been packed and is awaiting courier pickup.`,
      type: 'ORDER_PACKED',
      order: order._id,
      orderNumber: order.orderNumber,
      referenceId: `ORDER_PACKED_${order.orderNumber}`,
    });
  }

  return shipment;
};

/**
 * Dispatch a shipment (Admin Only)
 */
const dispatchShipment = async (shipmentId, dispatchData = {}) => {
  const shipment = await Shipment.findById(shipmentId);
  if (!shipment) {
    throw new ApiError(404, 'Shipment record not found.');
  }

  const order = await Order.findById(shipment.order);
  if (!order) {
    throw new ApiError(404, 'Associated order not found.');
  }

  if (shipment.shipmentStatus === 'DELIVERED') {
    throw new ApiError(400, 'Cannot dispatch a shipment that has already been delivered.');
  }

  const { carrier, awbNumber, trackingUrl, estimatedDeliveryAt } = dispatchData;

  if (trackingUrl) {
    validateTrackingUrl(trackingUrl);
  }

  if (carrier) shipment.carrier = carrier;
  if (awbNumber) shipment.awbNumber = awbNumber;
  if (trackingUrl) shipment.trackingUrl = trackingUrl;
  if (estimatedDeliveryAt) shipment.estimatedDeliveryAt = new Date(estimatedDeliveryAt);

  shipment.shipmentStatus = 'SHIPPED';
  shipment.shippedAt = new Date();

  shipment.trackingEvents.push({
    timestamp: new Date(),
    status: 'SHIPPED',
    location: 'Dispatched from Warehouse',
    description: `Package handed over to carrier ${shipment.carrier}.${shipment.awbNumber ? ` AWB: ${shipment.awbNumber}` : ''}`,
  });

  await shipment.save();

  // Update order status
  order.orderStatus = 'SHIPPED';
  await order.save();

  // Notify customer with idempotency reference
  await createNotification({
    user: shipment.user,
    title: 'Order Shipped',
    message: `Your order #${order.orderNumber} has been dispatched with ${shipment.carrier}.${shipment.awbNumber ? ` Tracking AWB: ${shipment.awbNumber}` : ''}`,
    type: 'ORDER_SHIPPED',
    order: order._id,
    orderNumber: order.orderNumber,
    referenceId: `ORDER_SHIPPED_${order.orderNumber}`,
  });

  return shipment;
};

/**
 * Record delivery of a shipment (Admin Only)
 */
const deliverShipment = async (shipmentId, deliveryData = {}) => {
  const shipment = await Shipment.findById(shipmentId);
  if (!shipment) {
    throw new ApiError(404, 'Shipment record not found.');
  }

  const order = await Order.findById(shipment.order);
  if (!order) {
    throw new ApiError(404, 'Associated order not found.');
  }

  shipment.shipmentStatus = 'DELIVERED';
  shipment.deliveredAt = new Date();

  shipment.trackingEvents.push({
    timestamp: new Date(),
    status: 'DELIVERED',
    location: deliveryData.location || order.shippingAddress.city || 'Destination Address',
    description: deliveryData.description || 'Package delivered successfully to recipient.',
  });

  await shipment.save();

  // Update Order status
  order.orderStatus = 'DELIVERED';
  // If payment was COD, update payment status to PAID upon verified delivery
  if (order.paymentMethod === 'COD' && order.paymentStatus !== 'PAID') {
    order.paymentStatus = 'PAID';
  }
  await order.save();

  // Notify customer
  await createNotification({
    user: shipment.user,
    title: 'Order Delivered',
    message: `Your order #${order.orderNumber} has been delivered. Thank you for shopping with Herbal Essence!`,
    type: 'ORDER_DELIVERED',
    order: order._id,
    orderNumber: order.orderNumber,
    referenceId: `ORDER_DELIVERED_${order.orderNumber}`,
  });

  return shipment;
};

/**
 * Update shipment tracking details (Admin Only)
 */
const updateShipmentDetails = async (shipmentId, updateData) => {
  const shipment = await Shipment.findById(shipmentId);
  if (!shipment) {
    throw new ApiError(404, 'Shipment record not found.');
  }

  // Field whitelist to prevent prototype pollution or mass-assignment
  const allowedFields = ['carrier', 'awbNumber', 'trackingUrl', 'estimatedDeliveryAt', 'notes'];
  if (updateData.trackingUrl !== undefined) {
    validateTrackingUrl(updateData.trackingUrl);
  }
  for (const field of allowedFields) {
    if (updateData[field] !== undefined) {
      if (field === 'notes') {
        shipment.metadata = { ...shipment.metadata, notes: updateData.notes };
      } else if (field === 'estimatedDeliveryAt') {
        shipment.estimatedDeliveryAt = updateData.estimatedDeliveryAt ? new Date(updateData.estimatedDeliveryAt) : null;
      } else {
        shipment[field] = updateData[field];
      }
    }
  }

  // Add tracking event if description is provided
  if (updateData.eventDescription) {
    shipment.trackingEvents.push({
      timestamp: new Date(),
      status: updateData.eventStatus || shipment.shipmentStatus,
      location: updateData.eventLocation || '',
      description: updateData.eventDescription,
    });
  }

  await shipment.save();
  return shipment;
};

/**
 * Get shipment by orderNumber (Customer or Admin)
 */
const getOrderShipment = async (orderNumber, userId, isAdmin = false) => {
  const order = await Order.findOne({ orderNumber });
  if (!order) {
    throw new ApiError(404, 'Order not found.');
  }

  // Strict IDOR ownership check
  if (!isAdmin && String(order.user) !== String(userId)) {
    throw new ApiError(403, 'Forbidden: You do not have access to tracking for this order.');
  }

  const shipment = await Shipment.findOne({ order: order._id }).lean();
  if (!shipment) {
    return {
      orderNumber,
      orderStatus: order.orderStatus,
      hasShipment: false,
      message: 'Fulfillment and tracking details are not yet available for this order.',
    };
  }

  return {
    ...shipment,
    hasShipment: true,
  };
};

/**
 * List shipments for Admin with pagination and search
 */
const listAdminShipments = async (queryParams = {}) => {
  const page = Math.max(1, parseInt(queryParams.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(queryParams.limit) || 20));
  const skip = (page - 1) * limit;

  const filter = {};
  if (queryParams.search) {
    const s = queryParams.search.trim();
    filter.$or = [
      { orderNumber: { $regex: s, $options: 'i' } },
      { shipmentNumber: { $regex: s, $options: 'i' } },
      { awbNumber: { $regex: s, $options: 'i' } },
      { carrier: { $regex: s, $options: 'i' } },
    ];
  }
  if (queryParams.status) {
    filter.shipmentStatus = queryParams.status;
  }

  const [shipments, total] = await Promise.all([
    Shipment.find(filter)
      .populate('user', 'firstName lastName email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Shipment.countDocuments(filter),
  ]);

  return {
    shipments,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
};

module.exports = {
  createShipmentForOrder,
  dispatchShipment,
  deliverShipment,
  updateShipmentDetails,
  getOrderShipment,
  listAdminShipments,
  ALLOWED_FULFILLMENT_TRANSITIONS,
  validateTrackingUrl,
};
