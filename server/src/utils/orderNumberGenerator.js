const crypto = require('crypto');

/**
 * Generates a unique, human-readable order number
 * Example: HERB-20261008-482910
 */
const generateOrderNumber = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  return `HERB-${dateStr}-${randomSuffix}`;
};

module.exports = {
  generateOrderNumber,
};
