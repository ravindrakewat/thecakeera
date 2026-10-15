import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import ProductCard from './ProductCard';
import { ProductCardSkeleton } from '../common/LoadingSkeleton';

const ProductCarousel = ({
  products = [],
  loading = false,
  title = 'Bestsellers',
  subtitle = 'Freshly baked artisan cakes, treats & celebration favourites',
  viewAllLink = '/shop',
}) => {
  const trackRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollability = useCallback(() => {
    if (!trackRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = trackRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    checkScrollability();
    el.addEventListener('scroll', checkScrollability, { passive: true });
    window.addEventListener('resize', checkScrollability);

    return () => {
      el.removeEventListener('scroll', checkScrollability);
      window.removeEventListener('resize', checkScrollability);
    };
  }, [products, loading, checkScrollability]);

  const handleScroll = (direction) => {
    if (!trackRef.current) return;
    const { clientWidth } = trackRef.current;
    // Scroll approximately 1 page or large block
    const scrollAmount = clientWidth * 0.75;
    trackRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <section aria-label={`${title} Carousel`} style={{ width: '100%' }}>
      {/* Header with Title, Subtitle, View All Link, and Arrow Buttons */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.85rem', flexWrap: 'wrap' }}>
          <h2
            style={{
              fontSize: 'clamp(1.75rem, 3.2vw, 2.25rem)',
              color: '#153222',
              fontFamily: 'var(--font-serif)',
              fontWeight: 700,
              margin: 0,
            }}
          >
            {title}
          </h2>
          {subtitle && (
            <span style={{ fontSize: '0.94rem', color: '#65776d', fontWeight: 400 }}>
              {subtitle}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {viewAllLink && (
            <Link
              to={viewAllLink}
              style={{
                color: '#153222',
                fontWeight: 600,
                fontSize: '0.92rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                textDecoration: 'none',
                transition: 'gap 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.gap = '0.55rem')}
              onMouseLeave={(e) => (e.currentTarget.style.gap = '0.35rem')}
            >
              View all products <ArrowRight size={16} />
            </Link>
          )}

          {/* Left / Right Carousel Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => handleScroll('left')}
              disabled={!canScrollLeft}
              aria-label="Previous products"
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                backgroundColor: canScrollLeft ? '#ffffff' : '#f0ece3',
                color: canScrollLeft ? '#153222' : '#a8b3aa',
                border: '1px solid #ded7cb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: canScrollLeft ? 'pointer' : 'not-allowed',
                boxShadow: canScrollLeft ? '0 2px 8px rgba(21, 50, 34, 0.08)' : 'none',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (canScrollLeft) {
                  e.currentTarget.style.backgroundColor = '#153222';
                  e.currentTarget.style.color = '#ffffff';
                }
              }}
              onMouseLeave={(e) => {
                if (canScrollLeft) {
                  e.currentTarget.style.backgroundColor = '#ffffff';
                  e.currentTarget.style.color = '#153222';
                }
              }}
            >
              <ChevronLeft size={20} />
            </button>

            <button
              onClick={() => handleScroll('right')}
              disabled={!canScrollRight}
              aria-label="Next products"
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                backgroundColor: canScrollRight ? '#ffffff' : '#f0ece3',
                color: canScrollRight ? '#153222' : '#a8b3aa',
                border: '1px solid #ded7cb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: canScrollRight ? 'pointer' : 'not-allowed',
                boxShadow: canScrollRight ? '0 2px 8px rgba(21, 50, 34, 0.08)' : 'none',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (canScrollRight) {
                  e.currentTarget.style.backgroundColor = '#153222';
                  e.currentTarget.style.color = '#ffffff';
                }
              }}
              onMouseLeave={(e) => {
                if (canScrollRight) {
                  e.currentTarget.style.backgroundColor = '#ffffff';
                  e.currentTarget.style.color = '#153222';
                }
              }}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontally Scrollable Carousel Track */}
      <div ref={trackRef} className="product-carousel-track">
        {loading ? (
          Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="product-carousel-item">
              <ProductCardSkeleton />
            </div>
          ))
        ) : Array.isArray(products) && products.length > 0 ? (
          products.map((product) => (
            <div key={product._id || product.id} className="product-carousel-item">
              <ProductCard product={product} />
            </div>
          ))
        ) : (
          <div style={{ padding: '2rem 0', color: '#65776d' }}>
            No products available at the moment.
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductCarousel;
