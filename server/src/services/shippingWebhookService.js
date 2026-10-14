const crypto = require('crypto');
const { Shipment, Order, WebhookEvent } = require('../models');
const { createNotification } = require('./notificationService');
const ApiError = require('../utils/ApiError');

/**
 * Handle incoming shipping provider webhook with signature verification and idempotency
 */
const handleShippingWebhook = async (rawBody, signatureHeader, eventPayload = {}) => {
  const webhookSecret = process.env.SHIPPING_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new ApiError(503, 'Shipping webhook processing is not configured on this server.');
  }

  // 1. Signature Verification
  if (!signatureHeader || !rawBody) {
    throw new ApiError(401, 'Missing webhook signature header or payload body.');
  }

  const expectedSignature = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
  if (signatureHeader !== expectedSignature) {
    throw new ApiError(401, 'Invalid webhook signature.');
  }

  // 2. Event Idempotency Check
  const eventId = eventPayload.event_id || eventPayload.id || `shp_evt_${Date.now()}`;
  const existingEvent = await WebhookEvent.findOne({ eventId });
  if (existingEvent) {
    return { status: 'already_processed', eventId };
  }

  // 3. Extract Tracking and AWB
  const awbNumber = eventPayload.awb_number || eventPayload.awb || eventPayload.tracking_number;
  const currentStatus = eventPayload.status || eventPayload.current_status;

  if (!awbNumber) {
    throw new ApiError(400, 'Malformed payload: Missing AWB number in webhook event.');
  }

  const shipment = await Shipment.findOne({ awbNumber });
  if (!shipment) {
    throw new ApiError(404, `No shipment found associated with AWB: ${awbNumber}`);
  }

  const order = await Order.findById(shipment.order);

  // 4. Allowed transitions mapping
  const statusMapping = {
    in_transit: 'IN_TRANSIT',
    out_for_delivery: 'OUT_FOR_DELIVERY',
    delivered: 'DELIVERED',
    exception: 'FAILED',
    failed: 'FAILED',
  };

  const normalizedStatus = statusMapping[String(currentStatus).toLowerCase()] || 'IN_TRANSIT';

  // Apply transition
  if (normalizedStatus === 'DELIVERED') {
    shipment.shipmentStatus = 'DELIVERED';
    shipment.deliveredAt = new Date();
    if (order) {
      order.orderStatus = 'DELIVERED';
      if (order.paymentMethod === 'COD') order.paymentStatus = 'PAID';
      await order.save();
    }
  } else if (normalizedStatus === 'OUT_FOR_DELIVERY') {
    shipment.shipmentStatus = 'OUT_FOR_DELIVERY';
  } else if (normalizedStatus === 'IN_TRANSIT') {
    shipment.shipmentStatus = 'IN_TRANSIT';
  }

  shipment.trackingEvents.push({
    timestamp: new Date(),
    status: normalizedStatus,
    location: eventPayload.location || '',
    description: eventPayload.message || eventPayload.description || `Status update from courier: ${normalizedStatus}`,
  });

  await shipment.save();

  // 5. Customer Notification
  if (order) {
    if (normalizedStatus === 'DELIVERED') {
      await createNotification({
        user: order.user,
        title: 'Order Delivered',
        message: `Your order #${order.orderNumber} has been delivered.`,
        type: 'ORDER_DELIVERED',
        order: order._id,
        orderNumber: order.orderNumber,
        referenceId: `WH_DELIVERED_${order.orderNumber}_${eventId}`,
      });
    } else if (normalizedStatus === 'OUT_FOR_DELIVERY') {
      await createNotification({
        user: order.user,
        title: 'Shipment Out for Delivery',
        message: `Your order #${order.orderNumber} is out for delivery today!`,
        type: 'SHIPMENT_TRACKING',
        order: order._id,
        orderNumber: order.orderNumber,
        referenceId: `WH_OFD_${order.orderNumber}_${eventId}`,
      });
    }
  }

  // 6. Record idempotency event
  await WebhookEvent.create({
    eventId,
    eventType: `shipping.${normalizedStatus.toLowerCase()}`,
    payload: { awbNumber, status: normalizedStatus, timestamp: new Date() },
  });

  return { status: 'success', shipmentNumber: shipment.shipmentNumber, eventId };
};

module.exports = {
  handleShippingWebhook,
};
