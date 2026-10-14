const PDFDocument = require('pdfkit');
const { Order, Invoice, StoreSettings, User, Product } = require('../models');
const { calculateOrderTaxBreakdown, roundPaise } = require('./taxService');
const ApiError = require('../utils/ApiError');

/**
 * Generate unique atomic invoice number
 */
const generateInvoiceNumber = async (orderNumber, prefix = 'INV') => {
  const d = new Date();
  const dateStr = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${dateStr}-${orderNumber ? orderNumber.slice(-4) : suffix}`;
};

/**
 * Convert number to Indian currency words
 */
const numberToWords = (num) => {
  const a = [
    '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ',
    'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ',
    'Seventeen ', 'Eighteen ', 'Nineteen '
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (n) => {
    if (n === 0) return 'Zero';
    let str = '';
    const crore = Math.floor(n / 10000000);
    n %= 10000000;
    const lakh = Math.floor(n / 100000);
    n %= 100000;
    const thousand = Math.floor(n / 1000);
    n %= 1000;
    const hundred = Math.floor(n / 100);
    n %= 100;

    if (crore > 0) str += inWords(crore) + ' Crore ';
    if (lakh > 0) str += inWords(lakh) + ' Lakh ';
    if (thousand > 0) str += inWords(thousand) + ' Thousand ';
    if (hundred > 0) str += inWords(hundred) + ' Hundred ';
    if (n > 0) {
      if (str !== '') str += 'and ';
      if (n < 20) str += a[n];
      else str += b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    }
    return str.trim();
  };

  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);
  let result = inWords(rupees) + ' Rupees';
  if (paise > 0) {
    result += ' and ' + inWords(paise) + ' Paise';
  }
  return result + ' Only';
};

/**
 * Get or create GST-Ready Invoice Record atomically
 */
const getOrCreateInvoiceForOrder = async (orderNumber, userId = null, isAdmin = false) => {
  const order = await Order.findOne({ orderNumber }).populate('user', 'firstName lastName email phone');
  if (!order) {
    throw new ApiError(404, 'Order not found.');
  }

  // Strict IDOR ownership check for customers
  if (!isAdmin && userId && String(order.user._id || order.user) !== String(userId)) {
    throw new ApiError(403, 'Forbidden: You do not have access to this order invoice.');
  }

  // Invoicing eligibility: Paid, Confirmed, Processing, Packed, Shipped, Delivered, or Placed COD
  const eligibleStatuses = ['PLACED', 'CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'DELIVERED'];
  if (!eligibleStatuses.includes(order.orderStatus)) {
    throw new ApiError(400, `Invoice cannot be generated for order in ${order.orderStatus} state.`);
  }

  // Idempotency: Return existing invoice if already created
  let existingInvoice = await Invoice.findOne({ order: order._id });
  if (existingInvoice) {
    return existingInvoice;
  }

  // Retrieve current store settings for seller snapshot
  let settings = await StoreSettings.findOne().lean();
  if (!settings) {
    settings = {
      legalBusinessName: 'Herbal Essence Private Limited',
      businessAddress: {
        addressLine1: 'Plot 42, Herbal Knowledge Park',
        addressLine2: 'MIDC Industrial Area',
        city: 'Mumbai',
        state: 'Maharashtra',
        stateCode: '27',
        pincode: '400093',
        country: 'India',
      },
      gstin: '',
      stateCode: '27',
      stateName: 'Maharashtra',
      invoicePrefix: 'INV',
      invoiceContactPhone: '+91 98765 43210',
      invoiceContactEmail: 'billing@herbal.com',
      pricesIncludeTax: true,
    };
  }

  const sellerAddressStr = settings.businessAddress
    ? `${settings.businessAddress.addressLine1 || ''}, ${settings.businessAddress.addressLine2 || ''}, ${settings.businessAddress.city || ''}, ${settings.businessAddress.state || ''} - ${settings.businessAddress.pincode || ''}`
    : 'Plot 42, Herbal Knowledge Park, MIDC, Mumbai, Maharashtra - 400093';

  const sellerSnapshot = {
    legalBusinessName: settings.legalBusinessName || 'Herbal Essence Private Limited',
    businessAddress: sellerAddressStr,
    gstin: settings.gstin || '',
    stateCode: settings.stateCode || '27',
    stateName: settings.stateName || 'Maharashtra',
    email: settings.invoiceContactEmail || 'billing@herbal.com',
    phone: settings.invoiceContactPhone || '+91 98765 43210',
  };

  const buyerAddr = order.shippingAddress;
  const buyerSnapshot = {
    fullName: buyerAddr.fullName,
    phone: buyerAddr.phone,
    email: order.user?.email || '',
    addressLine1: buyerAddr.addressLine1,
    addressLine2: buyerAddr.addressLine2 || '',
    city: buyerAddr.city,
    state: buyerAddr.state,
    pincode: buyerAddr.pincode,
    country: buyerAddr.country || 'India',
    stateCode: '', // Resolved dynamically in tax breakdown
  };

  // Tax Breakdown Calculation with fallback for historical orders
  const itemsWithTax = await Promise.all(
    (order.items || []).map(async (item) => {
      let gstRate = item.gstRate;
      let hsnCode = item.hsnCode;
      let taxInclusive = item.taxInclusive;

      if ((gstRate === undefined || gstRate === null) && item.product) {
        try {
          const p = await Product.findById(item.product).select('gstRate hsnCode taxInclusive').lean();
          if (p) {
            gstRate = p.gstRate;
            hsnCode = hsnCode || p.hsnCode;
            if (taxInclusive === undefined) taxInclusive = p.taxInclusive;
          }
        } catch (e) {
          // ignore lookup error
        }
      }

      return {
        ...(item.toObject ? item.toObject() : item),
        gstRate: gstRate !== undefined && gstRate !== null ? Number(gstRate) : (settings.defaultGstRate || 0),
        hsnCode: hsnCode || '',
        taxInclusive: taxInclusive !== false,
      };
    })
  );

  const taxCalc = await calculateOrderTaxBreakdown({
    items: itemsWithTax,
    shippingCharge: order.shippingCharge || 0,
    buyerState: buyerAddr.state,
    buyerStateCode: '',
  });

  const invoiceNumber = await generateInvoiceNumber(order.orderNumber, settings.invoicePrefix || 'INV');

  try {
    const invoice = new Invoice({
      invoiceNumber,
      order: order._id,
      orderNumber: order.orderNumber,
      user: order.user._id || order.user,
      invoiceDate: new Date(),
      sellerSnapshot,
      buyerSnapshot,
      items: taxCalc.itemBreakdown,
      subtotal: order.subtotal,
      discount: order.discount || 0,
      shippingCharge: order.shippingCharge || 0,
      shippingTax: taxCalc.shippingTax,
      taxableValue: taxCalc.totalTaxableValue,
      cgstTotal: taxCalc.totalCgst,
      sgstTotal: taxCalc.totalSgst,
      igstTotal: taxCalc.totalIgst,
      totalTax: taxCalc.totalTax,
      grandTotal: order.grandTotal,
      isIntraState: taxCalc.isIntraState,
      currency: 'INR',
      status: 'ISSUED',
    });

    await invoice.save();
    return invoice;
  } catch (err) {
    // If concurrent race condition occurred, fetch the existing invoice safely
    if (err.code === 11000) {
      return await Invoice.findOne({ order: order._id });
    }
    throw err;
  }
};

/**
 * Generate PDF buffer for an Invoice
 */
const generateInvoicePDFBuffer = (invoice) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const buffers = [];

      doc.on('data', (data) => buffers.push(data));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const isRegisteredGst = Boolean(invoice.sellerSnapshot.gstin);
      const invoiceTitle = isRegisteredGst ? 'TAX INVOICE' : 'RETAIL INVOICE / BILL OF SUPPLY';

      // --- HEADER ---
      doc
        .fontSize(16)
        .font('Helvetica-Bold')
        .fillColor('#1b4332')
        .text(invoice.sellerSnapshot.legalBusinessName, 40, 40);

      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#4a5568')
        .text(invoice.sellerSnapshot.businessAddress, 40, 60, { width: 300 })
        .text(`Email: ${invoice.sellerSnapshot.email} | Phone: ${invoice.sellerSnapshot.phone}`, 40, 85);

      if (isRegisteredGst) {
        doc.font('Helvetica-Bold').text(`GSTIN: ${invoice.sellerSnapshot.gstin}`, 40, 98);
        doc.font('Helvetica').text(`State: ${invoice.sellerSnapshot.stateName} (Code: ${invoice.sellerSnapshot.stateCode})`, 40, 110);
      }

      // Title & Invoice Meta (Right-aligned)
      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .fillColor('#2d6a4f')
        .text(invoiceTitle, 360, 40, { align: 'right' });

      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#2d3748')
        .text(`Invoice No: ${invoice.invoiceNumber}`, 360, 60, { align: 'right' })
        .text(`Invoice Date: ${new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}`, 360, 73, { align: 'right' })
        .text(`Order No: #${invoice.orderNumber}`, 360, 86, { align: 'right' })
        .text(`Place of Supply: ${invoice.buyerSnapshot.state}`, 360, 99, { align: 'right' });

      // Horizontal Divider
      doc.strokeColor('#cbd5e0').lineWidth(1).moveTo(40, 130).lineTo(555, 130).stroke();

      // --- BUYER / BILL TO SECTION ---
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#1b4332')
        .text('BILL TO / SHIP TO:', 40, 140);

      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#2d3748')
        .text(invoice.buyerSnapshot.fullName, 40, 155)
        .text(
          `${invoice.buyerSnapshot.addressLine1}${invoice.buyerSnapshot.addressLine2 ? ', ' + invoice.buyerSnapshot.addressLine2 : ''}`,
          40,
          168,
          { width: 280 }
        )
        .text(
          `${invoice.buyerSnapshot.city}, ${invoice.buyerSnapshot.state} - ${invoice.buyerSnapshot.pincode}, ${invoice.buyerSnapshot.country}`,
          40,
          183,
          { width: 280 }
        )
        .text(`Phone: ${invoice.buyerSnapshot.phone} ${invoice.buyerSnapshot.email ? '| Email: ' + invoice.buyerSnapshot.email : ''}`, 40, 198);

      // --- ITEMS TABLE HEADER ---
      let y = 225;
      doc.rect(40, y, 515, 22).fill('#e8f5e9');

      doc
        .fontSize(8)
        .font('Helvetica-Bold')
        .fillColor('#1b4332')
        .text('Sr.', 45, y + 6)
        .text('Item Description', 65, y + 6)
        .text('HSN', 230, y + 6)
        .text('Qty', 280, y + 6)
        .text('Rate (₹)', 315, y + 6)
        .text('Taxable (₹)', 375, y + 6);

      if (invoice.isIntraState) {
        doc.text('CGST/SGST', 445, y + 6);
      } else {
        doc.text('IGST', 455, y + 6);
      }
      doc.text('Total (₹)', 505, y + 6, { align: 'right' });

      y += 24;

      // --- TABLE ROWS ---
      invoice.items.forEach((item, index) => {
        const itemY = y;
        doc
          .fontSize(8)
          .font('Helvetica')
          .fillColor('#2d3748')
          .text(String(index + 1), 45, itemY)
          .text(item.name.substring(0, 34), 65, itemY)
          .text(item.hsnCode || '30049011', 230, itemY)
          .text(String(item.quantity), 285, itemY)
          .text(item.unitPrice.toFixed(2), 315, itemY)
          .text(item.taxableValue.toFixed(2), 375, itemY);

        if (invoice.isIntraState) {
          const combinedRate = item.gstRate ? `${item.gstRate}%` : '0%';
          doc.text(`${combinedRate} (₹${item.totalTax.toFixed(2)})`, 440, itemY);
        } else {
          doc.text(`${item.gstRate}% (₹${item.igstAmount.toFixed(2)})`, 455, itemY);
        }

        doc.text(item.lineTotal.toFixed(2), 500, itemY, { align: 'right' });

        y += 18;
      });

      // Horizontal Divider
      doc.strokeColor('#e2e8f0').lineWidth(0.5).moveTo(40, y).lineTo(555, y).stroke();
      y += 10;

      // --- FINANCIAL TOTALS (Right-aligned) ---
      const rightColX = 360;
      doc.fontSize(9).font('Helvetica').fillColor('#4a5568');

      doc.text('Subtotal:', rightColX, y).text(`₹${invoice.subtotal.toFixed(2)}`, 490, y, { align: 'right' });
      y += 14;

      if (invoice.discount > 0) {
        doc.text('Discount:', rightColX, y).text(`-₹${invoice.discount.toFixed(2)}`, 490, y, { align: 'right' });
        y += 14;
      }

      doc.text('Shipping & Delivery:', rightColX, y).text(`₹${invoice.shippingCharge.toFixed(2)}`, 490, y, { align: 'right' });
      y += 14;

      if (invoice.totalTax > 0) {
        if (invoice.isIntraState) {
          doc.text(`CGST:`, rightColX, y).text(`₹${invoice.cgstTotal.toFixed(2)}`, 490, y, { align: 'right' });
          y += 14;
          doc.text(`SGST:`, rightColX, y).text(`₹${invoice.sgstTotal.toFixed(2)}`, 490, y, { align: 'right' });
          y += 14;
        } else {
          doc.text(`IGST:`, rightColX, y).text(`₹${invoice.igstTotal.toFixed(2)}`, 490, y, { align: 'right' });
          y += 14;
        }
      }

      // Grand Total Box
      doc.rect(rightColX - 10, y + 2, 205, 24).fill('#d8f3dc');
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#1b4332')
        .text('Grand Total:', rightColX, y + 8)
        .text(`₹${invoice.grandTotal.toFixed(2)}`, 485, y + 8, { align: 'right' });

      y += 38;

      // Amount in words
      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .fillColor('#1b4332')
        .text('Amount in Words: ', 40, y)
        .font('Helvetica')
        .text(numberToWords(invoice.grandTotal), 130, y);

      y += 24;

      // --- DECLARATION & SIGNATURE ---
      doc
        .fontSize(8)
        .font('Helvetica')
        .fillColor('#718096')
        .text(
          'Declaration: We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct. Computer-generated invoice; does not require physical signature under Indian IT Act.',
          40,
          y,
          { width: 340 }
        );

      doc
        .fontSize(8)
        .font('Helvetica-Bold')
        .fillColor('#1b4332')
        .text(`For ${invoice.sellerSnapshot.legalBusinessName}`, 400, y, { align: 'right' })
        .font('Helvetica')
        .text('Authorized Signatory', 400, y + 30, { align: 'right' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * List Invoices for Admin with search, pagination, and date filtering
 */
const listAdminInvoices = async (queryParams = {}) => {
  const page = Math.max(1, parseInt(queryParams.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(queryParams.limit) || 20));
  const skip = (page - 1) * limit;

  const filter = {};
  if (queryParams.search) {
    const s = queryParams.search.trim();
    filter.$or = [
      { invoiceNumber: { $regex: s, $options: 'i' } },
      { orderNumber: { $regex: s, $options: 'i' } },
      { 'buyerSnapshot.fullName': { $regex: s, $options: 'i' } },
      { 'buyerSnapshot.phone': { $regex: s, $options: 'i' } },
    ];
  }
  if (queryParams.status) {
    filter.status = queryParams.status;
  }
  if (queryParams.from || queryParams.to) {
    filter.invoiceDate = {};
    if (queryParams.from) filter.invoiceDate.$gte = new Date(queryParams.from);
    if (queryParams.to) filter.invoiceDate.$lte = new Date(queryParams.to);
  }

  const [invoices, total] = await Promise.all([
    Invoice.find(filter)
      .populate('user', 'firstName lastName email')
      .sort({ invoiceDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Invoice.countDocuments(filter),
  ]);

  return {
    invoices,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
};

module.exports = {
  getOrCreateInvoiceForOrder,
  generateInvoicePDFBuffer,
  listAdminInvoices,
  numberToWords,
};
