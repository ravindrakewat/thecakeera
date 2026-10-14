import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, Leaf, Flower2, Sparkles } from 'lucide-react';
import bannerService from '../../services/bannerService';

const DEFAULT_SLIDES = [
  {
    id: 'nature-chosen',
    image: '/images/hero-slide-1.jpg',
    eyebrow: 'Ancient Wisdom • Modern Wellness',
    title: 'Nature, thoughtfully chosen.',
    subtitle: 'Daily rituals for balance, calm and natural care.',
    ctaText: 'Explore the collection',
    ctaLink: '/shop',
    badges: [
      { icon: Leaf, label: 'Pure & Natural' },
      { icon: Flower2, label: 'Plant-Based Formulas' },
      { icon: Sparkles, label: 'Ayurvedic Inspired' },
    ],
    accentTag: 'Herbal Wellness for a Better You 🍃',
  },
  {
    id: 'ayurvedic-wellness',
    image: '/images/hero-slide-2.jpg',
    eyebrow: 'Himalayan Adaptogens & Botanicals',
    title: 'Ayurvedic Wellness for Everyday Health.',
    subtitle: 'Thoughtfully crafted herbal supplements, roots & pure elixirs.',
    ctaText: 'Shop Ayurvedic Range',
    ctaLink: '/category/ayurvedic-supplements',
    badges: [
      { icon: Leaf, label: '100% Plant Based' },
      { icon: Sparkles, label: 'Quality Tested' },
      { icon: Flower2, label: 'Small Batch Made' },
    ],
    accentTag: 'Traditional Wisdom, Modern Purity ✨',
  },
  {
    id: 'organic-teas',
    image: '/images/hero-slide-3.jpg',
    eyebrow: 'Organic Teas & Daily Infusions',
    title: 'Golden Elixirs & Soothing Teas.',
    subtitle: 'Chamomile, holy basil and calming herbal blends for restful days.',
    ctaText: 'Explore Herbal Teas',
    ctaLink: '/category/herbal-teas',
    badges: [
      { icon: Leaf, label: 'Pure Whole Herbs' },
      { icon: Flower2, label: 'Chamomile & Tulsi' },
      { icon: Sparkles, label: 'Caffeine Free' },
    ],
    accentTag: 'Sip Calm, Live Well ☕',
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
              'Ancient Wisdom • Modern Wellness',
            title: b.title,
            subtitle:
              b.subtitle || 'Daily rituals for balance, calm and natural care.',
            ctaText: b.linkUrl?.includes('tea')
              ? 'Explore Herbal Teas'
              : b.linkUrl?.includes('supplements')
              ? 'Shop Ayurvedic Range'
              : 'Explore the collection',
            ctaLink: b.linkUrl || '/shop',
            badges: DEFAULT_SLIDES[idx % DEFAULT_SLIDES.length]?.badges || [
              { icon: Leaf, label: 'Pure & Natural' },
              { icon: Flower2, label: 'Plant-Based Formulas' },
              { icon: Sparkles, label: 'Ayurvedic Inspired' },
            ],
            accentTag:
              DEFAULT_SLIDES[idx % DEFAULT_SLIDES.length]?.accentTag ||
              'Herbal Wellness for a Better You 🍃',
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
