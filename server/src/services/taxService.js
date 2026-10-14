const StoreSettings = require('../models/StoreSettings');

const TAX_RATE = parseFloat(process.env.TAX_RATE || '0.00');

/**
 * Standard rounding helper for paise precision
 */
const roundPaise = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

/**
 * Backward-compatible simple tax calculator
 */
const calculateTax = (subtotal) => {
  if (!subtotal || subtotal <= 0) return 0;
  return Math.round(subtotal * TAX_RATE);
};

/**
 * Normalizes state name / state code to determine intra-state vs inter-state
 */
const isIntraStateTransaction = (sellerStateCode, buyerStateCode, sellerStateName, buyerStateName) => {
  if (sellerStateCode && buyerStateCode) {
    return String(sellerStateCode).trim().toLowerCase() === String(buyerStateCode).trim().toLowerCase();
  }
  if (sellerStateName && buyerStateName) {
    return String(sellerStateName).trim().toLowerCase() === String(buyerStateName).trim().toLowerCase();
  }
  // Default to intra-state if unresolvable
  return true;
};

/**
 * Calculates itemized GST tax breakdown and totals
 * Supports tax-inclusive pricing (retail standard in India) and tax-exclusive pricing
 */
const calculateOrderTaxBreakdown = async ({
  items = [],
  shippingCharge = 0,
  buyerState = '',
  buyerStateCode = '',
}) => {
  let settings = await StoreSettings.findOne().lean();
  if (!settings) {
    settings = {
      stateCode: '27',
      stateName: 'Maharashtra',
      gstin: '',
      pricesIncludeTax: true,
      defaultGstRate: 0,
    };
  }

  const sellerStateCode = settings.stateCode || '27';
  const sellerStateName = settings.stateName || 'Maharashtra';
  const isIntraState = isIntraStateTransaction(
    sellerStateCode,
    buyerStateCode,
    sellerStateName,
    buyerState
  );

  let totalTaxableValue = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;
  let totalTax = 0;

  const itemBreakdown = items.map((item) => {
    const qty = item.quantity || 1;
    const unitPrice = item.sellingPrice || item.price || 0;
    const mrp = item.mrp || unitPrice;
    const lineSubtotal = roundPaise(unitPrice * qty);
    const gstRate = item.gstRate !== undefined ? Number(item.gstRate) : (settings.defaultGstRate || 0);
    const taxInclusive = item.taxInclusive !== false && settings.pricesIncludeTax !== false;

    let taxableValue = 0;
    let lineTax = 0;

    if (gstRate <= 0) {
      taxableValue = lineSubtotal;
      lineTax = 0;
    } else if (taxInclusive) {
      // In tax-inclusive: Selling Price = Taxable Value + Tax
      // Taxable Value = Selling Price / (1 + Rate / 100)
      taxableValue = roundPaise(lineSubtotal / (1 + gstRate / 100));
      lineTax = roundPaise(lineSubtotal - taxableValue);
    } else {
      // In tax-exclusive: Tax = Selling Price * (Rate / 100)
      taxableValue = lineSubtotal;
      lineTax = roundPaise(lineSubtotal * (gstRate / 100));
    }

    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (lineTax > 0) {
      if (isIntraState) {
        cgst = roundPaise(lineTax / 2);
        sgst = roundPaise(lineTax - cgst); // Prevents rounding discrepancy
      } else {
        igst = lineTax;
      }
    }

    totalTaxableValue += taxableValue;
    totalCgst += cgst;
    totalSgst += sgst;
    totalIgst += igst;
    totalTax += lineTax;

    return {
      product: item.product || item._id,
      name: item.name,
      sku: item.sku || '',
      hsnCode: item.hsnCode || '30049011', // Standard Ayurvedic/Herbal HSN if configured
      quantity: qty,
      mrp,
      unitPrice,
      discount: item.discount || 0,
      taxableValue,
      gstRate,
      cgstAmount: cgst,
      sgstAmount: sgst,
      igstAmount: igst,
      totalTax: lineTax,
      lineTotal: taxInclusive ? lineSubtotal : roundPaise(lineSubtotal + lineTax),
    };
  });

  // Calculate tax on shipping if applicable (e.g. 18% standard on logistics or 0% for retail exemption)
  const shippingTaxRate = 0; // Configured at 0% default for retail customer transparency
  let shippingTax = 0;
  if (shippingTaxRate > 0 && shippingCharge > 0) {
    shippingTax = roundPaise(shippingCharge * (shippingTaxRate / 100));
    totalTax += shippingTax;
    if (isIntraState) {
      const half = roundPaise(shippingTax / 2);
      totalCgst += half;
      totalSgst += roundPaise(shippingTax - half);
    } else {
      totalIgst += shippingTax;
    }
  }

  return {
    isIntraState,
    sellerStateCode,
    sellerStateName,
    itemBreakdown,
    totalTaxableValue: roundPaise(totalTaxableValue),
    totalCgst: roundPaise(totalCgst),
    totalSgst: roundPaise(totalSgst),
    totalIgst: roundPaise(totalIgst),
    shippingTax: roundPaise(shippingTax),
    totalTax: roundPaise(totalTax),
  };
};

module.exports = {
  calculateTax,
  calculateOrderTaxBreakdown,
  roundPaise,
  isIntraStateTransaction,
  TAX_RATE,
};
