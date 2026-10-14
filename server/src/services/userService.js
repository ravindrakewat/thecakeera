const { User } = require('../models');

const findUserByEmail = async (email) => {
  return await User.findOne({ email: email.toLowerCase() });
};

const findUserById = async (id) => {
  return await User.findById(id).select('-password');
};

const createUser = async (userData) => {
  return await User.create(userData);
};

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
};
