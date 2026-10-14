const { calculateShippingDetails, validatePincode } = require('../services/shippingService');
const { sendSuccess } = require('../utils/apiResponse');
const ApiError = require('../utils/ApiError');

const checkServiceability = async (req, res, next) => {
  try {
    const { pincode, subtotal, paymentMethod } = req.body;
    if (!pincode) {
      throw new ApiError(400, 'Pincode is required to check serviceability.');
    }

    if (!validatePincode(pincode)) {
      throw new ApiError(400, 'Invalid 6-digit Indian pincode format.');
    }

    const result = await calculateShippingDetails({
      subtotal: parseFloat(subtotal) || 0,
      address: { pincode },
      paymentMethod: paymentMethod || 'ONLINE',
    });

    return sendSuccess(res, 200, 'Serviceability checked successfully', result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  checkServiceability,
};
