const StoreSettings = require('../models/StoreSettings');

const PINCODE_REGEX = /^\d{6}$/;

/**
 * Validate Indian 6-digit Pincode format
 */
const validatePincode = (pincode) => {
  if (!pincode) return false;
  return PINCODE_REGEX.test(String(pincode).trim());
};

/**
 * Check if a pincode matches a rule pattern (exact or prefix with wildcard, e.g. "40*" or "110001")
 */
const matchesPincodePattern = (pincode, pattern) => {
  if (!pincode || !pattern) return false;
  const p = String(pincode).trim();
  const pat = String(pattern).trim();
  if (pat === '*' || pat === p) return true;
  if (pat.endsWith('*')) {
    const prefix = pat.slice(0, -1);
    return p.startsWith(prefix);
  }
  return false;
};

/**
 * Centralized Serviceability and Shipping Calculation Engine
 */
const calculateShippingDetails = async ({ subtotal = 0, address = null, paymentMethod = 'ONLINE' }) => {
  // Load Store Settings or use defaults
  let settings = await StoreSettings.findOne().lean();
  if (!settings) {
    settings = {
      freeShippingThreshold: parseFloat(process.env.FREE_SHIPPING_THRESHOLD || '999'),
      defaultShippingCharge: parseFloat(process.env.DEFAULT_SHIPPING_CHARGE || '50'),
      codAvailable: true,
      prepaidAvailable: true,
      minOrderValue: 0,
      maxOrderValue: 100000,
      estimatedDispatchDays: 1,
      estimatedDeliveryDays: 4,
      shippingActive: true,
      serviceablePincodes: [],
      excludedPincodes: [],
      shippingZones: [],
    };
  }

  if (settings.shippingActive === false) {
    return {
      serviceable: false,
      shippingCharge: 0,
      freeShippingApplied: false,
      codAvailable: false,
      estimatedDispatchDays: null,
      estimatedDeliveryDays: null,
      message: 'Shipping is currently disabled by store administration.',
    };
  }

  // Address pincode check
  const pincode = address?.pincode ? String(address.pincode).trim() : null;
  if (address && !validatePincode(pincode)) {
    return {
      serviceable: false,
      shippingCharge: 0,
      freeShippingApplied: false,
      codAvailable: false,
      estimatedDispatchDays: null,
      estimatedDeliveryDays: null,
      message: 'Invalid 6-digit Indian pincode format.',
    };
  }

  // Check excluded pincodes
  if (pincode && settings.excludedPincodes && settings.excludedPincodes.length > 0) {
    const isExcluded = settings.excludedPincodes.some((pat) => matchesPincodePattern(pincode, pat));
    if (isExcluded) {
      return {
        serviceable: false,
        shippingCharge: 0,
        freeShippingApplied: false,
        codAvailable: false,
        estimatedDispatchDays: null,
        estimatedDeliveryDays: null,
        message: 'Destination pincode is not serviceable by our delivery network.',
      };
    }
  }

  // Check serviceable pincodes whitelist if configured
  if (pincode && settings.serviceablePincodes && settings.serviceablePincodes.length > 0) {
    const hasWildcardAll = settings.serviceablePincodes.includes('*');
    if (!hasWildcardAll) {
      const isAllowed = settings.serviceablePincodes.some((pat) => matchesPincodePattern(pincode, pat));
      if (!isAllowed) {
        return {
          serviceable: false,
          shippingCharge: 0,
          freeShippingApplied: false,
          codAvailable: false,
          estimatedDispatchDays: null,
          estimatedDeliveryDays: null,
          message: 'Destination pincode is not serviceable under current store rules.',
        };
      }
    }
  }

  // Resolve Shipping Zone
  let activeCharge = settings.defaultShippingCharge ?? 50;
  let activeFreeThreshold = settings.freeShippingThreshold ?? 999;
  let activeDeliveryDays = settings.estimatedDeliveryDays ?? 4;
  let activeCodAvailable = settings.codAvailable !== false;
  let zoneName = 'Standard National';

  if (pincode && settings.shippingZones && settings.shippingZones.length > 0) {
    const matchedZone = settings.shippingZones.find(
      (z) => z.isActive !== false && z.pincodes && z.pincodes.some((pat) => matchesPincodePattern(pincode, pat))
    );
    if (matchedZone) {
      zoneName = matchedZone.zoneName;
      activeCharge = matchedZone.shippingCharge !== undefined ? matchedZone.shippingCharge : activeCharge;
      activeFreeThreshold = matchedZone.freeShippingThreshold !== undefined ? matchedZone.freeShippingThreshold : activeFreeThreshold;
      activeDeliveryDays = matchedZone.estimatedDays !== undefined ? matchedZone.estimatedDays : activeDeliveryDays;
      if (matchedZone.codAvailable !== undefined) {
        activeCodAvailable = matchedZone.codAvailable;
      }
    }
  }

  // Validate Order Value boundaries
  if (settings.minOrderValue > 0 && subtotal < settings.minOrderValue) {
    return {
      serviceable: false,
      shippingCharge: 0,
      freeShippingApplied: false,
      codAvailable: false,
      estimatedDispatchDays: null,
      estimatedDeliveryDays: null,
      message: `Minimum order value for delivery is ₹${settings.minOrderValue}.`,
    };
  }

  if (settings.maxOrderValue > 0 && subtotal > settings.maxOrderValue) {
    return {
      serviceable: false,
      shippingCharge: 0,
      freeShippingApplied: false,
      codAvailable: false,
      estimatedDispatchDays: null,
      estimatedDeliveryDays: null,
      message: `Maximum allowable order value is ₹${settings.maxOrderValue}.`,
    };
  }

  // Free shipping calculation
  const isFree = subtotal >= activeFreeThreshold;
  const finalShippingCharge = isFree ? 0 : activeCharge;

  return {
    serviceable: true,
    shippingCharge: finalShippingCharge,
    freeShippingApplied: isFree,
    estimatedDispatchDays: settings.estimatedDispatchDays || 1,
    estimatedDeliveryDays: activeDeliveryDays,
    zoneName,
    codAvailable: activeCodAvailable,
    prepaidAvailable: settings.prepaidAvailable !== false,
    message: isFree
      ? `Free shipping unlocked on orders over ₹${activeFreeThreshold}! (Configuration-based)`
      : `Standard delivery charge ₹${finalShippingCharge} applied. Free delivery on orders ₹${activeFreeThreshold}+. (Configuration-based)`,
  };
};

/**
 * Synchronous backward-compatible calculator for existing callers
 */
const calculateShipping = (subtotal, shippingAddress = null) => {
  const FREE_SHIPPING_THRESHOLD = parseFloat(process.env.FREE_SHIPPING_THRESHOLD || '999');
  const DEFAULT_SHIPPING_CHARGE = parseFloat(process.env.DEFAULT_SHIPPING_CHARGE || '50');

  if (!subtotal || subtotal <= 0) return 0;
  if (subtotal >= FREE_SHIPPING_THRESHOLD) {
    return 0;
  }
  return DEFAULT_SHIPPING_CHARGE;
};

module.exports = {
  validatePincode,
  calculateShipping,
  calculateShippingDetails,
  FREE_SHIPPING_THRESHOLD: parseFloat(process.env.FREE_SHIPPING_THRESHOLD || '999'),
  DEFAULT_SHIPPING_CHARGE: parseFloat(process.env.DEFAULT_SHIPPING_CHARGE || '50'),
};
