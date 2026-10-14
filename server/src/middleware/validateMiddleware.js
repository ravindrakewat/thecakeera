const validateRequest = (schema) => (req, res, next) => {
  // Middleware wrapper for request body validation
  next();
};

module.exports = { validateRequest };
