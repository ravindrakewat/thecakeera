const { Address } = require('../models');
const { sendSuccess } = require('../utils/apiResponse');
const ApiError = require('../utils/ApiError');

// @desc Create Address
// @route POST /api/users/me/addresses
const createAddress = async (req, res, next) => {
  try {
    const { fullName, phone, addressLine1, addressLine2, area, city, state, pincode, landmark, country, isDefault } = req.body;

    const existingCount = await Address.countDocuments({ user: req.user._id });
    const shouldBeDefault = isDefault || existingCount === 0;

    if (shouldBeDefault) {
      await Address.updateMany({ user: req.user._id }, { isDefault: false });
    }

    const address = await Address.create({
      user: req.user._id,
      fullName: fullName.trim(),
      phone: phone.trim(),
      addressLine1: addressLine1.trim(),
      addressLine2: addressLine2 ? addressLine2.trim() : '',
      area: area ? area.trim() : '',
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      landmark: landmark ? landmark.trim() : '',
      country: country || 'India',
      isDefault: shouldBeDefault,
    });

    return sendSuccess(res, 201, 'Address added successfully', address);
  } catch (error) {
    next(error);
  }
};

// @desc Get User Addresses
// @route GET /api/users/me/addresses
const getMyAddresses = async (req, res, next) => {
  try {
    const addresses = await Address.find({ user: req.user._id }).sort({ isDefault: -1, createdAt: -1 }).lean();
    return sendSuccess(res, 200, 'Addresses fetched successfully', addresses);
  } catch (error) {
    next(error);
  }
};

// @desc Get Address by ID
// @route GET /api/users/me/addresses/:id
const getAddressById = async (req, res, next) => {
  try {
    // Strict IDOR protection: Address MUST belong to authenticated user
    const address = await Address.findOne({ _id: req.params.id, user: req.user._id }).lean();
    if (!address) {
      throw new ApiError(404, 'Address not found or unauthorized');
    }
    return sendSuccess(res, 200, 'Address details fetched', address);
  } catch (error) {
    next(error);
  }
};

// @desc Update Address
// @route PATCH /api/users/me/addresses/:id
const updateAddress = async (req, res, next) => {
  try {
    const { fullName, phone, addressLine1, addressLine2, area, city, state, pincode, landmark, country, isDefault } = req.body;

    // Strict IDOR protection
    const address = await Address.findOne({ _id: req.params.id, user: req.user._id });
    if (!address) {
      throw new ApiError(404, 'Address not found or unauthorized');
    }

    if (isDefault) {
      await Address.updateMany({ user: req.user._id }, { isDefault: false });
      address.isDefault = true;
    }

    if (fullName) address.fullName = fullName.trim();
    if (phone) address.phone = phone.trim();
    if (addressLine1) address.addressLine1 = addressLine1.trim();
    if (addressLine2 !== undefined) address.addressLine2 = addressLine2.trim();
    if (area !== undefined) address.area = area.trim();
    if (city) address.city = city.trim();
    if (state) address.state = state.trim();
    if (pincode) address.pincode = pincode.trim();
    if (landmark !== undefined) address.landmark = landmark.trim();
    if (country) address.country = country;

    await address.save();

    return sendSuccess(res, 200, 'Address updated successfully', address);
  } catch (error) {
    next(error);
  }
};

// @desc Delete Address
// @route DELETE /api/users/me/addresses/:id
const deleteAddress = async (req, res, next) => {
  try {
    // Strict IDOR protection
    const address = await Address.findOne({ _id: req.params.id, user: req.user._id });
    if (!address) {
      throw new ApiError(404, 'Address not found or unauthorized');
    }

    const wasDefault = address.isDefault;
    await address.deleteOne();

    // Default Address Consistency Logic
    if (wasDefault) {
      const remainingAddress = await Address.findOne({ user: req.user._id }).sort({ createdAt: -1 });
      if (remainingAddress) {
        remainingAddress.isDefault = true;
        await remainingAddress.save();
      }
    }

    return sendSuccess(res, 200, 'Address deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAddress,
  getMyAddresses,
  getAddressById,
  updateAddress,
  deleteAddress,
};
