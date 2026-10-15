export const PRODUCT_IMAGE_MAP = {
  'belgian-dark-truffle-celebration-cake': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=800',
  'classic-red-velvet-cream-cheese-cake': 'https://images.unsplash.com/photo-1616541823729-00fe0aacd32c?q=80&w=800',
  'royal-golden-floral-tiered-cake': 'https://images.unsplash.com/photo-1535141192574-5d4897c13136?q=80&w=800',
  'fresh-blueberry-cheesecake-slice': 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?q=80&w=800',
  'assorted-gourmet-cupcake-box-6pcs': 'https://images.unsplash.com/photo-1587314168485-3236d6710814?q=80&w=800',
  'chunky-roasted-almond-dark-choco-cookies': 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?q=80&w=800',
  'parisian-french-butter-croissants-pack-of-4': 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=800',
  'gooey-fudgy-walnut-brownies-pack-of-4': 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?q=80&w=800',
  'artisanal-sourdough-country-loaf': 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?q=80&w=800',
  'exotic-fresh-fruit-alphonso-mango-gateau': 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?q=80&w=800',
};

const DEFAULT_CAKE_IMAGE = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=800';

/**
 * Returns the best authentic bakery product image for a given product object.
 */
export const getProductImage = (product) => {
  if (!product) return DEFAULT_CAKE_IMAGE;
  const slug = product.slug || '';
  if (PRODUCT_IMAGE_MAP[slug]) {
    return PRODUCT_IMAGE_MAP[slug];
  }
  return product.thumbnail || product.images?.[0]?.url || product.image || DEFAULT_CAKE_IMAGE;
};

/**
 * Formats image URLs for CDN image optimization & WebP format delivery.
 */
export const getOptimizedImageUrl = (url, options = {}) => {
  if (!url) return DEFAULT_CAKE_IMAGE;

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
