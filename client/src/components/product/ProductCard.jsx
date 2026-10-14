import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Star } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { siteConfig } from '../../config/siteConfig';
import { getProductImage } from '../../utils/imageUtils';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  if (!product) return null;

  const sellingPrice = Number(product.sellingPrice ?? product.price ?? 0) || 0;
  const mrp = Number(product.mrp ?? product.originalPrice ?? 0);
  const isDiscounted = mrp > sellingPrice;
  const discountPercent = isDiscounted && mrp > 0 ? Math.round(((mrp - sellingPrice) / mrp) * 100) : 0;

  const isLiked = isInWishlist(product._id || product.id);
  const imageUrl = getProductImage(product);
  const subtitle = product.shortDescription || '';

  // Extract authentic benefit tags from product data
  const tags =
    Array.isArray(product.benefits) && product.benefits.length > 0
      ? product.benefits
          .slice(0, 3)
          .map((b) =>
            typeof b === 'string'
              ? b.replace(/^(Reduces|Enhances|Supports|Promotes|Calms|Soothes|Restores|Deeply)\s+/i, '').split('&')[0].trim()
              : ''
          )
          .filter(Boolean)
      : [product.category?.name || 'Herbal'].filter(Boolean);

  const hasRating = Boolean(product.averageRating || product.rating);
  const ratingVal = product.averageRating || product.rating;
  const reviewCountVal = product.reviewCount ?? product.numReviews;

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        border: '1px solid #eae5dc',
        boxShadow: '0 4px 16px rgba(21, 50, 34, 0.04)',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 10px 24px rgba(21, 50, 34, 0.09)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(21, 50, 34, 0.04)';
      }}
    >
      {/* Top Image Container */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '4 / 3',
          backgroundColor: '#f6f2ec',
          overflow: 'hidden',
        }}
      >
        <Link
          to={`/product/${product.slug}`}
          style={{ display: 'block', width: '100%', height: '100%' }}
        >
          <img
            src={imageUrl}
            alt={product.name}
            loading="lazy"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.35s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.04)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1.0)')}
          />
        </Link>

        {/* Floating Wishlist Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            toggleWishlist(product);
          }}
          aria-label={isLiked ? 'Remove from wishlist' : 'Add to wishlist'}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            backgroundColor: '#ffffff',
            border: '1px solid rgba(0, 0, 0, 0.06)',
            borderRadius: '50%',
            width: '34px',
            height: '34px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            transition: 'transform 0.2s ease, background-color 0.2s ease',
            zIndex: 2,
          }}
        >
          <Heart
            size={17}
            color={isLiked ? '#e63946' : '#5c6e63'}
            fill={isLiked ? '#e63946' : 'none'}
          />
        </button>
      </div>

      {/* Card Content Body */}
      <div
        style={{
          padding: '1.15rem',
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          justifyContent: 'space-between',
          gap: '0.85rem',
        }}
      >
        <div>
          {/* Rating Row with Stars only when real rating exists */}
          {hasRating && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                marginBottom: '0.45rem',
                fontSize: '0.82rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1px', color: '#f59e0b' }}>
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    fill={i < Math.round(ratingVal) ? '#f59e0b' : 'none'}
                    color={i < Math.round(ratingVal) ? '#f59e0b' : '#d1d5db'}
                  />
                ))}
              </div>
              <span style={{ fontWeight: 700, color: '#153222', marginLeft: '0.2rem' }}>
                {ratingVal}
              </span>
              {reviewCountVal !== undefined && reviewCountVal !== null && (
                <span style={{ color: '#7c8c82', fontSize: '0.78rem' }}>({reviewCountVal})</span>
              )}
            </div>
          )}

          {/* Product Name */}
          <Link
            to={`/product/${product.slug}`}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <h3
              style={{
                fontSize: '1.02rem',
                color: '#153222',
                fontWeight: 700,
                marginBottom: subtitle ? '0.25rem' : '0.55rem',
                lineHeight: 1.3,
                fontFamily: 'var(--font-body)',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
              title={product.name}
            >
              {product.name}
            </h3>
          </Link>

          {/* Subtitle / Short Benefit Tagline */}
          {subtitle && (
            <p
              style={{
                fontSize: '0.8rem',
                color: '#65776d',
                marginBottom: '0.65rem',
                lineHeight: 1.35,
                display: '-webkit-box',
                WebkitLineClamp: 1,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {subtitle}
            </p>
          )}

          {/* Pricing Row with Selling Price, MRP, and Discount Pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.75rem',
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: '#dd5226',
                fontFamily: 'var(--font-body)',
              }}
            >
              {siteConfig.currency}
              {sellingPrice.toLocaleString('en-IN')}
            </span>

            {isDiscounted && (
              <span
                style={{
                  fontSize: '0.88rem',
                  color: '#8e9e94',
                  textDecoration: 'line-through',
                }}
              >
                {siteConfig.currency}
                {mrp.toLocaleString('en-IN')}
              </span>
            )}

            {isDiscounted && discountPercent > 0 && (
              <span
                style={{
                  backgroundColor: '#e8f5e9',
                  color: '#2e7d32',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '0.15rem 0.5rem',
                  borderRadius: '99px',
                  letterSpacing: '0.2px',
                }}
              >
                {discountPercent}% OFF
              </span>
            )}
          </div>

          {/* Benefit / Category Tags Row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {tags.map((tag, idx) => (
              <span
                key={idx}
                style={{
                  backgroundColor: '#f6f2ec',
                  color: '#55665b',
                  fontSize: '0.7rem',
                  fontWeight: 500,
                  padding: '0.22rem 0.6rem',
                  borderRadius: '6px',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Action Button: Terracotta Orange Add to Cart */}
        <button
          onClick={() => addToCart(product, 1)}
          disabled={product.stockStatus === 'OUT_OF_STOCK'}
          style={{
            width: '100%',
            padding: '0.68rem 1rem',
            backgroundColor: product.stockStatus === 'OUT_OF_STOCK' ? '#9ca3af' : '#dd5226',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.9rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.45rem',
            cursor: product.stockStatus === 'OUT_OF_STOCK' ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s ease, transform 0.15s ease',
            boxShadow: '0 3px 10px rgba(221, 82, 38, 0.25)',
          }}
          onMouseEnter={(e) => {
            if (product.stockStatus !== 'OUT_OF_STOCK') {
              e.currentTarget.style.backgroundColor = '#c5431b';
            }
          }}
          onMouseLeave={(e) => {
            if (product.stockStatus !== 'OUT_OF_STOCK') {
              e.currentTarget.style.backgroundColor = '#dd5226';
            }
          }}
        >
          <ShoppingBag size={16} />
          <span>{product.stockStatus === 'OUT_OF_STOCK' ? 'Out of Stock' : 'Add to cart'}</span>
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
