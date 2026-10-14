// Public cache control middleware for static/catalog data (Products/Categories)
const setCacheHeaders = (maxAgeSeconds = 300) => {
  return (req, res, next) => {
    if (req.method === 'GET') {
      res.set('Cache-Control', `public, max-age=${maxAgeSeconds}, s-maxage=${maxAgeSeconds}, stale-while-revalidate=60`);
    } else {
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    }
    next();
  };
};

// Strict anti-caching middleware for private user data (Auth, User, Orders, Cart, Payment)
const preventCache = (req, res, next) => {
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, private, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
  });
  next();
};

module.exports = { setCacheHeaders, preventCache };
