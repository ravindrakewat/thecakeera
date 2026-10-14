export const PRODUCT_IMAGE_MAP = {
  'pure-himalayan-ashwagandha-extract': '/images/ashwagandha.jpg',
  'chamomile-tulsi-sleep-tea': '/images/chamomile-tea.jpg',
  'wild-lavender-therapeutic-essential-oil': '/images/lavender-oil.jpg',
  'kumkumadi-radiance-facial-glow-oil': '/images/kumkumadi-oil.jpg',
};

/**
 * Returns the best authentic product image for a given product object.
 */
export const getProductImage = (product) => {
  if (!product) return '/images/hero-banner.jpg';
  const slug = product.slug || '';
  if (PRODUCT_IMAGE_MAP[slug]) {
    return PRODUCT_IMAGE_MAP[slug];
  }
  return product.thumbnail || product.images?.[0]?.url || product.image || '/images/hero-banner.jpg';
};

/**
 * Formats image URLs for CDN image optimization & WebP format delivery.
 */
export const getOptimizedImageUrl = (url, options = {}) => {
  if (!url) return '/images/hero-banner.jpg';

  // If local public asset, return directly
  if (typeof url === 'string' && url.startsWith('/images/')) {
    return url;
  }

  const { width = 600, quality = 80, format = 'webp' } = options;

  // Handles Unsplash CDN parameters dynamically
  if (typeof url === 'string' && url.includes('images.unsplash.com')) {
    try {
      const urlObj = new URL(url);
      urlObj.searchParams.set('auto', 'format');
      urlObj.searchParams.set('fit', 'crop');
      urlObj.searchParams.set('w', width.toString());
      urlObj.searchParams.set('q', quality.toString());
      urlObj.searchParams.set('fm', format);
      return urlObj.toString();
    } catch (_) {
      return url;
    }
  }

  // Cloudinary transform support (e.g. /upload/ -> /upload/f_auto,q_auto,w_600/)
  if (typeof url === 'string' && url.includes('res.cloudinary.com')) {
    return url.replace('/upload/', `/upload/f_${format},q_${quality},w_${width}/`);
  }

  return url;
};
