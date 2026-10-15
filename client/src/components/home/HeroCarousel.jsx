import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, Leaf, Flower2, Sparkles } from 'lucide-react';
import bannerService from '../../services/bannerService';

const DEFAULT_SLIDES = [
  {
    id: 'celebration-cakes',
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=1600',
    eyebrow: 'A New Era Of Celebration • Freshly Baked',
    title: 'Artisanal Cakes, Crafted for Your Special Moments.',
    subtitle: 'Rich belgian chocolate, red velvet, and exotic fruit cakes baked fresh on order.',
    ctaText: 'Explore Celebration Cakes',
    ctaLink: '/shop',
    badges: [
      { icon: Sparkles, label: 'Freshly Baked Daily' },
      { icon: Sparkles, label: '100% Eggless Options' },
      { icon: Sparkles, label: 'Pure Belgian Cocoa' },
    ],
    accentTag: '100% Freshly Baked Everyday 🎂',
  },
  {
    id: 'designer-cakes',
    image: 'https://images.unsplash.com/photo-1535141192574-5d4897c13136?q=80&w=1600',
    eyebrow: 'Custom Celebrations • Handcrafted Perfection',
    title: 'Designer Cakes That Make Every Birthday Magical.',
    subtitle: 'Tiered & thematic cakes customized with love, fresh berries, and silky creams.',
    ctaText: 'Order Designer Cakes',
    ctaLink: '/shop',
    badges: [
      { icon: Sparkles, label: 'Custom Designs' },
      { icon: Sparkles, label: 'Premium Butter' },
      { icon: Sparkles, label: 'Delivered On-Time' },
    ],
    accentTag: 'Custom Creations Available ✨',
  },
  {
    id: 'bakery-pastries',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=1600',
    eyebrow: 'Gourmet Bakery • Fresh From The Oven',
    title: 'Delicate Pastries, Cookies & Oven-Fresh Bakes.',
    subtitle: 'Melt-in-mouth cookies, flaky puff pastries, and golden baked artisan breads.',
    ctaText: 'Explore Bakery Treats',
    ctaLink: '/shop',
    badges: [
      { icon: Sparkles, label: 'Oven Fresh' },
      { icon: Sparkles, label: 'Artisanal Recipes' },
      { icon: Sparkles, label: 'No Preservatives' },
    ],
    accentTag: 'Oven Fresh & Pure Butter 🥐',
  },
];

const HeroCarousel = () => {
  const [slides, setSlides] = useState(DEFAULT_SLIDES);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const touchStartX = useRef(null);
  const slideCount = slides.length;

  // Fetch live banners managed from Admin Panel (/admin/banners)
  useEffect(() => {
    const fetchLiveBanners = async () => {
      try {
        const res = await bannerService.getPublicBanners();
        const dbBanners = res.data || [];
        if (Array.isArray(dbBanners) && dbBanners.length > 0) {
          const mapped = dbBanners.map((b, idx) => ({
            id: b._id || `banner-${idx}`,
            image: b.imageUrl,
            eyebrow:
              DEFAULT_SLIDES[idx % DEFAULT_SLIDES.length]?.eyebrow ||
              'A New Era Of Celebration • Freshly Baked',
            title: b.title,
            subtitle:
              b.subtitle || 'Fresh handcrafted celebration cakes and bakery delights.',
            ctaText: b.linkUrl?.includes('pastry')
              ? 'Explore Pastries'
              : b.linkUrl?.includes('cake')
              ? 'Shop Celebration Cakes'
              : 'Explore the collection',
            ctaLink: b.linkUrl || '/shop',
            badges: DEFAULT_SLIDES[idx % DEFAULT_SLIDES.length]?.badges || [
              { icon: Sparkles, label: 'Freshly Baked' },
              { icon: Sparkles, label: 'Eggless Options' },
              { icon: Sparkles, label: 'Pure Ingredients' },
            ],
            accentTag:
              DEFAULT_SLIDES[idx % DEFAULT_SLIDES.length]?.accentTag ||
              'A New Era Of Celebration 🎂',
          }));
          setSlides(mapped);
        }
      } catch (err) {
        console.warn('Failed to load banners from API, using fallback slides:', err);
      }
    };
    fetchLiveBanners();
  }, []);

  // Auto-rotation (pauses on hover and honors prefers-reduced-motion)
  useEffect(() => {
    if (isHovered) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slideCount);
    }, 5500);

    return () => clearInterval(timer);
  }, [isHovered, slideCount]);

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + slideCount) % slideCount);
  };

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slideCount);
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (diff > 50) {
      handleNext();
    } else if (diff < -50) {
      handlePrev();
    }
    touchStartX.current = null;
  };

  return (
    <section
      aria-label="Promotional Hero Carousel"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        position: 'relative',
        width: '100%',
        overflow: 'hidden',
        backgroundColor: '#f5efe4',
      }}
    >
      {/* Slides Container */}
      <div
        style={{
          display: 'flex',
          width: `${slideCount * 100}%`,
          transform: `translateX(-${(currentSlide * 100) / slideCount}%)`,
          transition: 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)',
        }}
      >
        {slides.map((slide, index) => {
          return (
            <div
              key={slide.id}
              style={{
                width: `${100 / slideCount}%`,
                position: 'relative',
                minHeight: 'clamp(380px, 46vw, 540px)',
                display: 'flex',
                alignItems: 'center',
                boxSizing: 'border-box',
              }}
            >
              {/* Background Image Container */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: `url(${slide.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center right',
                  backgroundRepeat: 'no-repeat',
                }}
              />

              {/* Refined Directional Gradient Overlay ensuring crisp botanical photography & sharp text */}
              <div className="hero-gradient-overlay" />

              {/* Text Content Area */}
              <div
                className="container-fluid"
                style={{
                  position: 'relative',
                  zIndex: 2,
                  paddingTop: '2.5rem',
                  paddingBottom: '2.5rem',
                }}
              >
                <div style={{ maxWidth: '640px' }}>
                  {/* Eyebrow */}
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      color: '#5e5043',
                      letterSpacing: '2.4px',
                      textTransform: 'uppercase',
                      marginBottom: '0.85rem',
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    {slide.eyebrow}
                  </div>

                  {/* Headline */}
                  <h1
                    style={{
                      fontSize: 'clamp(2rem, 4.2vw, 3.4rem)',
                      color: '#153222',
                      fontFamily: 'var(--font-serif)',
                      fontWeight: 600,
                      lineHeight: 1.15,
                      marginBottom: '1rem',
                      letterSpacing: '-0.3px',
                      textWrap: 'balance',
                    }}
                  >
                    {slide.title}
                  </h1>

                  {/* Subtitle */}
                  <p
                    style={{
                      fontSize: 'clamp(0.95rem, 1.4vw, 1.12rem)',
                      color: '#2d4335',
                      marginBottom: '1.65rem',
                      lineHeight: 1.55,
                      maxWidth: '520px',
                      fontWeight: 450,
                    }}
                  >
                    {slide.subtitle}
                  </p>

                  {/* Badges Row */}
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.75rem 1.25rem',
                      marginBottom: '2rem',
                    }}
                  >
                    {slide.badges.map((b, bIdx) => {
                      const IconComp = b.icon;
                      return (
                        <div
                          key={bIdx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.45rem',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            color: '#283c30',
                          }}
                        >
                          <div
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              backgroundColor: 'rgba(21, 50, 34, 0.08)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#153222',
                            }}
                          >
                            <IconComp size={13} strokeWidth={2.2} />
                          </div>
                          <span>{b.label}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* CTA Action */}
                  <div>
                    <Link
                      to={slide.ctaLink}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.55rem',
                        padding: '0.85rem 2.2rem',
                        fontSize: '0.96rem',
                        fontWeight: 600,
                        backgroundColor: '#153222',
                        color: '#ffffff',
                        borderRadius: '99px',
                        textDecoration: 'none',
                        boxShadow: '0 4px 16px rgba(21, 50, 34, 0.25)',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#1d442f';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#153222';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      {slide.ctaText} <ArrowRight size={17} />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Script Watermark (Desktop only) */}
              <div
                className="desktop-only"
                style={{
                  position: 'absolute',
                  top: '24px',
                  right: 'clamp(2rem, 5vw, 4rem)',
                  fontFamily: 'var(--font-editorial)',
                  fontStyle: 'italic',
                  fontSize: '1.25rem',
                  color: '#284133',
                  textAlign: 'right',
                  lineHeight: 1.2,
                  pointerEvents: 'none',
                  zIndex: 2,
                  textShadow: '0 1px 3px rgba(255, 255, 255, 0.9)',
                }}
              >
                {slide.accentTag}
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Arrow Controls */}
      <button
        onClick={handlePrev}
        aria-label="Previous slide"
        style={{
          position: 'absolute',
          left: 'clamp(0.75rem, 2vw, 1.75rem)',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 255, 255, 0.88)',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#153222',
          cursor: 'pointer',
          zIndex: 10,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(6px)',
          transition: 'all 0.2s ease',
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
        onClick={handleNext}
        aria-label="Next slide"
        style={{
          position: 'absolute',
          right: 'clamp(0.75rem, 2vw, 1.75rem)',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 255, 255, 0.88)',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#153222',
          cursor: 'pointer',
          zIndex: 10,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(6px)',
          transition: 'all 0.2s ease',
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

      {/* Pagination Indicators (Dots / Pill) */}
      <div
        style={{
          position: 'absolute',
          bottom: '18px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: 10,
        }}
      >
        {slides.map((_, dotIdx) => (
          <button
            key={dotIdx}
            onClick={() => setCurrentSlide(dotIdx)}
            aria-label={`Go to slide ${dotIdx + 1}`}
            style={{
              width: currentSlide === dotIdx ? '28px' : '9px',
              height: '9px',
              borderRadius: '99px',
              backgroundColor: currentSlide === dotIdx ? '#153222' : 'rgba(21, 50, 34, 0.25)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              padding: 0,
            }}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroCarousel;
