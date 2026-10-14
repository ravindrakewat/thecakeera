const orderService = require('../services/orderService');
const shipmentService = require('../services/shipmentService');
const invoiceService = require('../services/invoiceService');
const { sendSuccess } = require('../utils/apiResponse');

const previewOrder = async (req, res, next) => {
  try {
    const summary = await orderService.previewCheckout(req.user._id, req.body.addressId, req.body.couponCode);
    return sendSuccess(res, 200, 'Checkout preview calculated successfully', summary);
  } catch (error) {
    next(error);
  }
};

const createOrder = async (req, res, next) => {
  try {
    const order = await orderService.createOrder(req.user._id, req.body);
    return sendSuccess(res, 201, 'Order created successfully', order);
  } catch (error) {
    next(error);
  }
};

const getUserOrders = async (req, res, next) => {
  try {
    const { orders, pagination } = await orderService.getUserOrders(
      req.user._id,
      req.query.page,
      req.query.limit
    );
    return sendSuccess(res, 200, 'Orders retrieved successfully', orders, pagination);
  } catch (error) {
    next(error);
  }
};

const getOrderByNumber = async (req, res, next) => {
  try {
    const order = await orderService.getOrderByNumber(req.user._id, req.params.orderNumber);
    return sendSuccess(res, 200, 'Order details fetched successfully', order);
  } catch (error) {
    next(error);
  }
};

const cancelOrder = async (req, res, next) => {
  try {
    const order = await orderService.cancelOrder(
      req.user._id,
      req.params.orderNumber,
      req.body.reason
    );
    return sendSuccess(res, 200, 'Order cancelled successfully', order);
  } catch (error) {
    next(error);
  }
};

const getOrderShipment = async (req, res, next) => {
  try {
    const shipment = await shipmentService.getOrderShipment(req.params.orderNumber, req.user._id, false);
    return sendSuccess(res, 200, 'Shipment details fetched successfully', shipment);
  } catch (error) {
    next(error);
  }
};

const downloadInvoice = async (req, res, next) => {
  try {
    const invoice = await invoiceService.getOrCreateInvoiceForOrder(req.params.orderNumber, req.user._id, false);
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

const getOrderInvoiceData = async (req, res, next) => {
  try {
    const invoice = await invoiceService.getOrCreateInvoiceForOrder(req.params.orderNumber, req.user._id, false);
    return sendSuccess(res, 200, 'Invoice details fetched successfully', invoice);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  previewOrder,
  createOrder,
  getUserOrders,
  getOrderByNumber,
  cancelOrder,
  getOrderShipment,
  downloadInvoice,
  getOrderInvoiceData,
};

