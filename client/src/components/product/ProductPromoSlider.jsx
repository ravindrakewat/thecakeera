import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * ProductPromoSlider Component
 * Displays a full-width promotional hero banner carousel on the Product Details page.
 * 100% Dynamic: Configurable per-product via Admin Panel with show/hide toggle.
 */
const ProductPromoSlider = ({
  product,
  slides: customSlides,
  show = true,
  autoPlayInterval = 5000,
  style = {},
}) => {
  // Determine if this slider should be shown
  const isVisible = show && product?.showPromoSlider !== false;

  // Determine slide images:
  // 1. Custom slides prop
  // 2. Product's saved promoSliderImages from DB/Admin
  // 3. Fallback for Sea Buckthorn
  // 4. Fallback for other herbal products
  const getSlides = () => {
    if (customSlides && customSlides.length > 0) return customSlides;

    if (
      product?.promoSliderImages &&
      Array.isArray(product.promoSliderImages) &&
      product.promoSliderImages.length > 0
    ) {
      return product.promoSliderImages;
    }

    return [
      'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=1600',
      'https://images.unsplash.com/photo-1535141192574-5d4897c13136?q=80&w=1600',
    ];
  };

  const slides = getSlides();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(0);

  // Auto-play interval
  useEffect(() => {
    if (!isVisible || slides.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, autoPlayInterval);

    return () => clearInterval(timer);
  }, [isVisible, slides.length, isPaused, autoPlayInterval]);

  if (!isVisible || slides.length === 0) return null;

  const handlePrev = (e) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 50) handleNext();
    if (diff < -50) handlePrev();
  };

  return (
    <section
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        position: 'relative',
        borderRadius: '24px',
        overflow: 'hidden',
        border: '1px solid #ebe5dc',
        boxShadow: '0 8px 30px rgba(21, 50, 34, 0.04)',
        backgroundColor: '#faf7f2',
        marginBottom: '4.5rem',
        ...style,
      }}
      className="product-promo-slider"
      aria-label="Product Highlights Slider"
    >
      {/* Sliding Track */}
      <div
        style={{
          display: 'flex',
          width: `${slides.length * 100}%`,
          transform: `translateX(-${(currentIndex * 100) / slides.length}%)`,
          transition: 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)',
          willChange: 'transform',
        }}
      >
        {slides.map((slideUrl, idx) => (
          <div
            key={idx}
            style={{
              width: `${100 / slides.length}%`,
              position: 'relative',
              lineHeight: 0,
            }}
          >
            <img
              src={slideUrl}
              alt={`${product?.name || 'Herbal Product'} Feature Banner ${idx + 1}`}
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
                aspectRatio: '16/9',
                objectFit: 'cover',
                maxHeight: '520px',
              }}
              onError={(e) => {
                e.currentTarget.src = '/images/sea-buckthorn-banner-1.jpg';
              }}
              loading={idx === 0 ? 'eager' : 'lazy'}
            />
          </div>
        ))}
      </div>

      {/* Navigation Arrows (Only shown if more than 1 slide) */}
      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous Slide"
            style={{
              position: 'absolute',
              top: '50%',
              left: 'clamp(0.65rem, 2vw, 1.5rem)',
              transform: 'translateY(-50%)',
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.88)',
              backdropFilter: 'blur(8px)',
              border: '1px solid #ebe5dc',
              color: '#153222',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.12)',
              transition: 'background-color 0.2s ease, transform 0.15s ease',
              zIndex: 3,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.88)';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
            }}
          >
            <ChevronLeft size={22} />
          </button>

          <button
            type="button"
            onClick={handleNext}
            aria-label="Next Slide"
            style={{
              position: 'absolute',
              top: '50%',
              right: 'clamp(0.65rem, 2vw, 1.5rem)',
              transform: 'translateY(-50%)',
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.88)',
              backdropFilter: 'blur(8px)',
              border: '1px solid #ebe5dc',
              color: '#153222',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.12)',
              transition: 'background-color 0.2s ease, transform 0.15s ease',
              zIndex: 3,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.88)';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
            }}
          >
            <ChevronRight size={22} />
          </button>

          {/* Dots Indicator */}
          <div
            style={{
              position: 'absolute',
              bottom: '1rem',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: '0.45rem',
              alignItems: 'center',
              padding: '0.35rem 0.75rem',
              borderRadius: '999px',
              backgroundColor: 'rgba(21, 50, 34, 0.35)',
              backdropFilter: 'blur(6px)',
              zIndex: 3,
            }}
          >
            {slides.map((_, dotIdx) => {
              const isActive = dotIdx === currentIndex;
              return (
                <button
                  key={dotIdx}
                  type="button"
                  onClick={() => setCurrentIndex(dotIdx)}
                  aria-label={`Go to slide ${dotIdx + 1}`}
                  style={{
                    width: isActive ? '22px' : '7px',
                    height: '7px',
                    borderRadius: '999px',
                    backgroundColor: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.55)',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    transition: 'all 0.25s ease',
                  }}
                />
              );
            })}
          </div>
        </>
      )}
    </section>
  );
};

export default ProductPromoSlider;
