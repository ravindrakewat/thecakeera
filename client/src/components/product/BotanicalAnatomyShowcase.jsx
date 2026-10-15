import React, { useState, useRef } from 'react';
import { getProductImage } from '../../utils/imageUtils';

/**
 * BotanicalAnatomyShowcase Component
 * "Root to Fruit Nourishment" interactive feature section.
 * Features:
 * - 100% Dynamic: Automatically adapts to any current or newly listed product
 * - Continuous smooth floating & swaying keyframe animation of the center image
 * - Interactive 3D mouse parallax tilt on mouse move
 * - Dynamic benefit cards powered by the product's ingredients & benefits from database
 * - Rich fallback anatomy for Sea Buckthorn
 */
const BotanicalAnatomyShowcase = ({
  product,
  productName: customName,
  imageSrc: customImage,
  subtitle: customSubtitle,
  style = {},
}) => {
  const containerRef = useRef(null);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const [activeItem, setActiveItem] = useState(null);

  const productName =
    customName || product?.name?.toUpperCase() || 'BELGIAN CHOCOLATE CELEBRATION CAKE';

  const subtitle =
    customSubtitle || 'HANDCRAFTED PERFECTION & ARTISANAL LAYERS';

  const imageSrc =
    customImage ||
    product?.thumbnail ||
    product?.images?.[0]?.url ||
    getProductImage(product) ||
    'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=800';

  // Smooth mouse move parallax handler
  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 28; // -14px to +14px
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 20; // -10px to +10px
    setMouseOffset({ x, y });
  };

  const handleMouseLeave = () => {
    setMouseOffset({ x: 0, y: 0 });
    setActiveItem(null);
  };

  // ── SEA BUCKTHORN SPECIFIC ROOT-TO-FRUIT ANATOMY ──
  const seaBuckthornLeft = [
    {
      id: 'leaf',
      title: 'LEAF',
      bullets: [
        'Rich in flavonoids & polyphenols',
        'Aids cellular detoxification',
        'Helps regulate balanced blood sugar',
      ],
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2d6a4f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
          <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
        </svg>
      ),
    },
    {
      id: 'pulp',
      title: 'PULP',
      bullets: [
        'Rich in vitamin C, A & essential minerals',
        'Improves gut health & smooth digestion',
        'Promotes collagen & radiant glowing skin',
      ],
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path d="M12 2.5C12 2.5 6 10 6 15C6 18.3 8.7 21 12 21C15.3 21 18 18.3 18 15C18 10 12 2.5 12 2.5Z" fill="#F59E0B" fillOpacity="0.25" stroke="#DD5226" strokeWidth="1.8" />
          <path d="M10 13C10 13 8.5 15.5 8.5 17" stroke="#DD5226" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      id: 'dry-berry-powder',
      title: 'DRY BERRY POWDER',
      bullets: [
        'Rich in bio-stable antioxidants & active fiber',
        'Sustains clean daily metabolic energy',
        'Strengthens immune resilience naturally',
      ],
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path d="M3 17C6 17 8 15 11 15C14 15 17 19 21 19" stroke="#92400E" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="7" cy="11" r="1.5" fill="#D97706" />
          <circle cx="11" cy="9" r="1.8" fill="#F59E0B" />
          <circle cx="15" cy="12" r="1.5" fill="#D97706" />
          <circle cx="18" cy="10" r="1.2" fill="#B45309" />
          <path d="M4 21H20" stroke="#78350F" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      ),
    },
  ];

  const seaBuckthornRight = [
    {
      id: 'oil-extract',
      title: 'OIL EXTRACT',
      bullets: [
        'Rich in rare omega 3-6-7-9 & vitamin E',
        'Supports vascular & cardiovascular health',
        'Accelerates dermal repair & barrier renewal',
      ],
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path d="M10 2H14" stroke="#D97706" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M12 2V6" stroke="#D97706" strokeWidth="1.8" />
          <path d="M8 6H16L17 16C17 18.2 14.8 20 12 20C9.2 20 7 18.2 7 16L8 6Z" fill="#FEF3C7" stroke="#D97706" strokeWidth="1.8" />
          <circle cx="12" cy="14" r="2.5" fill="#DD5226" />
          <circle cx="12" cy="22" r="1" fill="#DD5226" />
        </svg>
      ),
    },
    {
      id: 'dry-berry',
      title: 'DRY BERRY',
      bullets: [
        'Highest wild-harvested vitamin C & bioflavonoids',
        'Fortifies whole-body vitality & immunity',
        'Combats environmental free radicals',
      ],
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <ellipse cx="8" cy="14" rx="4" ry="5.5" fill="#F59E0B" fillOpacity="0.3" stroke="#B45309" strokeWidth="1.6" transform="rotate(-15 8 14)" />
          <ellipse cx="16" cy="12" rx="4.5" ry="6" fill="#F59E0B" fillOpacity="0.4" stroke="#B45309" strokeWidth="1.6" transform="rotate(20 16 12)" />
          <ellipse cx="11" cy="18" rx="3.5" ry="4" fill="#D97706" fillOpacity="0.5" stroke="#92400E" strokeWidth="1.5" />
        </svg>
      ),
    },
    {
      id: 'seed-powder',
      title: 'SEED POWDER',
      bullets: [
        'Rich in essential fatty acids & botanical protein',
        'Naturally eases systemic inflammation',
        'Nourishes cognitive clarity & joint flexibility',
      ],
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path d="M4 14C4 18.4 7.6 22 12 22C16.4 22 20 18.4 20 14H4Z" fill="#E5E7EB" stroke="#4B5563" strokeWidth="1.8" />
          <path d="M12 4L14 14H10L12 4Z" fill="#9CA3AF" stroke="#374151" strokeWidth="1.6" />
          <circle cx="8" cy="11" r="1.2" fill="#6B7280" />
          <circle cx="16" cy="11" r="1.2" fill="#6B7280" />
          <circle cx="12" cy="10" r="1" fill="#4B5563" />
        </svg>
      ),
    },
  ];

  // ── DYNAMIC GENERATION FOR ANY OTHER NEW LISTED PRODUCT ──
  const getDynamicCards = () => {
    // If the product has custom botanical anatomy in database
    if (product?.botanicalAnatomy && Array.isArray(product.botanicalAnatomy)) {
      const left = product.botanicalAnatomy.slice(0, 3);
      const right = product.botanicalAnatomy.slice(3, 6);
      return { left, right };
    }

    // If it's Sea Buckthorn, return the exact verified anatomy
    if (isSeaBuckthorn) {
      return { left: seaBuckthornLeft, right: seaBuckthornRight };
    }

    // Otherwise, dynamically construct from the new product's ingredients & benefits:
    const ingredients = product?.ingredients || [];
    const benefits = product?.benefits || [];

    const dynamicLeft = [
      {
        id: 'active-botanical',
        title: ingredients[0] ? ingredients[0].toUpperCase() : 'PURE ACTIVE EXTRACT',
        bullets: [
          'Ethically harvested wild medicinal plant parts',
          'Standardized for optimal bio-availability',
          'Rich in authentic secondary metabolites',
        ],
        icon: (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2d6a4f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
            <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
          </svg>
        ),
      },
      {
        id: 'therapeutic-synergy',
        title: ingredients[1] ? ingredients[1].toUpperCase() : 'HERBAL SYNERGY',
        bullets: [
          'Formulated according to classical Ayurvedic principles',
          'Enhances digestive assimilation & absorption',
          'Zero artificial additives or chemical solvents',
        ],
        icon: (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M12 2.5C12 2.5 6 10 6 15C6 18.3 8.7 21 12 21C15.3 21 18 18.3 18 15C18 10 12 2.5 12 2.5Z" fill="#F59E0B" fillOpacity="0.25" stroke="#DD5226" strokeWidth="1.8" />
          </svg>
        ),
      },
      {
        id: 'natural-matrix',
        title: ingredients[2] ? ingredients[2].toUpperCase() : 'PLANT MATRIX',
        bullets: [
          'Preserves full-spectrum natural phytochemicals',
          'Supports sustained daily vitality & energy',
          '100% vegan, cruelty-free and natural origin',
        ],
        icon: (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M3 17C6 17 8 15 11 15C14 15 17 19 21 19" stroke="#92400E" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="7" cy="11" r="1.5" fill="#D97706" />
            <circle cx="11" cy="9" r="1.8" fill="#F59E0B" />
          </svg>
        ),
      },
    ];

    const dynamicRight = [
      {
        id: 'primary-action',
        title: benefits[0] ? 'PRIMARY BENEFIT' : 'DAILY NOURISHMENT',
        bullets: [
          benefits[0] || 'Supports internal wellness & natural balance',
          'Scientifically verified traditional healing benefits',
          'Gentle and effective for daily routine',
        ],
        icon: (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L15 9H22L16 14L18 21L12 17L6 21L8 14L2 9H9L12 2Z" fill="#FEF3C7" stroke="#D97706" strokeWidth="1.8" />
          </svg>
        ),
      },
      {
        id: 'rejuvenation',
        title: benefits[1] ? 'RESTORE & REJUVENATE' : 'RASAYANA POWER',
        bullets: [
          benefits[1] || 'Promotes deep tissue rejuvenation (Rasayana)',
          'Fortifies constitutional strength & immunity',
          'Promotes metabolic calm and equilibrium',
        ],
        icon: (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="8" fill="#F59E0B" fillOpacity="0.3" stroke="#B45309" strokeWidth="1.6" />
            <circle cx="12" cy="12" r="3" fill="#D97706" />
          </svg>
        ),
      },
      {
        id: 'longevity',
        title: benefits[2] ? 'HOLISTIC VITALITY' : 'AYURVEDIC HARMONY',
        bullets: [
          benefits[2] || 'Calms aggravated Doshas for sustained health',
          'Nourishes body and mind from within',
          'Certified pure by rigorous quality protocols',
        ],
        icon: (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M12 4V20M4 12H20" stroke="#2D6A4F" strokeWidth="2" strokeLinecap="round" />
            <circle cx="12" cy="12" r="7" stroke="#2D6A4F" strokeWidth="1.5" />
          </svg>
        ),
      },
    ];

    return { left: dynamicLeft, right: dynamicRight };
  };

  const { left: leftFeatures, right: rightFeatures } = getDynamicCards();

  return (
    <section
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        backgroundColor: '#faf7f2',
        borderRadius: '28px',
        border: '1px solid #ebe5dc',
        padding: 'clamp(2.5rem, 5vw, 4.5rem) clamp(1.25rem, 4vw, 3.5rem)',
        marginBottom: '4.5rem',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 10px 40px rgba(21, 50, 34, 0.03)',
        ...style,
      }}
      className="botanical-showcase-section"
    >
      {/* Dynamic Keyframe Animation Styles */}
      <style>{`
        @keyframes botanicalFloatSway {
          0% {
            transform: translateY(0px) translateX(0px) rotate(0deg) scale(1);
          }
          20% {
            transform: translateY(-12px) translateX(10px) rotate(2deg) scale(1.02);
          }
          40% {
            transform: translateY(-22px) translateX(2px) rotate(-1deg) scale(1.035);
          }
          65% {
            transform: translateY(-10px) translateX(-12px) rotate(-2.5deg) scale(1.02);
          }
          85% {
            transform: translateY(-4px) translateX(-5px) rotate(1deg) scale(1.01);
          }
          100% {
            transform: translateY(0px) translateX(0px) rotate(0deg) scale(1);
          }
        }

        @keyframes auraBreath {
          0%, 100% {
            opacity: 0.35;
            transform: scale(0.92);
          }
          50% {
            opacity: 0.65;
            transform: scale(1.12);
          }
        }

        .botanical-center-img {
          animation: botanicalFloatSway 7.5s ease-in-out infinite;
          will-change: transform;
          transition: filter 0.3s ease;
        }

        .botanical-center-container:hover .botanical-center-img {
          animation-play-state: running;
        }

        .anatomy-card-item {
          transition: transform 0.22s ease, opacity 0.22s ease;
        }

        .anatomy-card-item:hover {
          transform: translateY(-3px);
        }
      `}</style>

      {/* Decorative Warm Ambient Glow in the Center */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '450px',
          height: '450px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(221, 82, 38, 0.12) 0%, rgba(245, 158, 11, 0.08) 40%, transparent 70%)',
          animation: 'auraBreath 6s ease-in-out infinite',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* ── HEADER TITLE ──────────────────────────────────────────────────── */}
      <div style={{ textAlign: 'center', marginBottom: 'clamp(2rem, 4vw, 3.5rem)', position: 'relative', zIndex: 1 }}>
        <span
          style={{
            display: 'inline-block',
            color: '#dd5226',
            fontSize: 'clamp(0.8rem, 1.5vw, 0.95rem)',
            fontWeight: 800,
            letterSpacing: '2.5px',
            textTransform: 'uppercase',
            marginBottom: '0.45rem',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          {subtitle}
        </span>
        <h2
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(2.2rem, 5vw, 3.6rem)',
            color: '#153222',
            fontWeight: 800,
            letterSpacing: '3px',
            textTransform: 'uppercase',
            margin: 0,
            lineHeight: 1.15,
          }}
        >
          {productName}
        </h2>
        <div
          style={{
            width: '60px',
            height: '3px',
            backgroundColor: '#dd5226',
            margin: '0.85rem auto 0',
            borderRadius: '2px',
          }}
        />
      </div>

      {/* ── 3-COLUMN SHOWCASE LAYOUT ───────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          alignItems: 'center',
          gap: 'clamp(1.5rem, 3vw, 2.5rem)',
          position: 'relative',
          zIndex: 1,
        }}
        className="botanical-showcase-grid"
      >
        {/* ── LEFT COLUMN: 3 FEATURES ── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(1.5rem, 3.5vw, 2.75rem)',
            textAlign: 'left',
          }}
          className="botanical-col-left"
        >
          {leftFeatures.map((item) => {
            const isHovered = activeItem === item.id;
            return (
              <div
                key={item.id}
                onMouseEnter={() => setActiveItem(item.id)}
                onMouseLeave={() => setActiveItem(null)}
                className="anatomy-card-item"
                style={{
                  padding: '1rem 1.25rem',
                  borderRadius: '16px',
                  backgroundColor: isHovered ? '#ffffff' : 'transparent',
                  border: isHovered ? '1px solid #ebe5dc' : '1px solid transparent',
                  boxShadow: isHovered ? '0 8px 24px rgba(21, 50, 34, 0.05)' : 'none',
                  cursor: 'pointer',
                }}
              >
                {/* Header with Title & Icon */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '0.55rem',
                  }}
                >
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #ebe5dc',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                      flexShrink: 0,
                    }}
                  >
                    {item.icon}
                  </div>
                  <h3
                    style={{
                      fontSize: '1.05rem',
                      fontWeight: 800,
                      letterSpacing: '1px',
                      color: isHovered ? '#dd5226' : '#153222',
                      textTransform: 'uppercase',
                      margin: 0,
                      transition: 'color 0.2s ease',
                    }}
                  >
                    {item.title}
                  </h3>
                </div>

                {/* Bullets List */}
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: '1.25rem',
                    color: '#4e5d53',
                    fontSize: '0.88rem',
                    lineHeight: 1.6,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.2rem',
                  }}
                >
                  {item.bullets.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* ── CENTER COLUMN: CONTINUOUSLY ANIMATED MOVING IMAGE ── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            padding: '1rem',
            minHeight: '380px',
          }}
          className="botanical-center-container"
        >
          {/* Parallax Container responding to mouse motion */}
          <div
            style={{
              transform: `translate3d(${mouseOffset.x}px, ${mouseOffset.y}px, 0)`,
              transition: 'transform 0.18s cubic-bezier(0.2, 0, 0.4, 1)',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* The Animated Moving Image */}
            <img
              src={imageSrc}
              alt={`${productName} Botanical Branch`}
              className="botanical-center-img"
              style={{
                width: '100%',
                maxWidth: '420px',
                height: 'auto',
                aspectRatio: '1/1',
                objectFit: 'contain',
                borderRadius: '50%',
                filter: activeItem
                  ? 'drop-shadow(0 20px 30px rgba(221, 82, 38, 0.22)) contrast(1.05)'
                  : 'drop-shadow(0 16px 28px rgba(21, 50, 34, 0.12))',
                cursor: 'grab',
                userSelect: 'none',
              }}
              loading="lazy"
            />
          </div>

          {/* Interactive Floating Hint Pill */}
          <div
            style={{
              marginTop: '1.25rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.35rem 0.85rem',
              backgroundColor: '#ffffff',
              borderRadius: '999px',
              border: '1px solid #ebe5dc',
              fontSize: '0.74rem',
              fontWeight: 600,
              color: '#647369',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: '#52b788',
                display: 'inline-block',
                animation: 'pulse 1.8s infinite',
              }}
            />
            Wild Himalayan Sea Buckthorn (Organic Whole Plant)
          </div>
        </div>

        {/* ── RIGHT COLUMN: 3 FEATURES ── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(1.5rem, 3.5vw, 2.75rem)',
            textAlign: 'left',
          }}
          className="botanical-col-right"
        >
          {rightFeatures.map((item) => {
            const isHovered = activeItem === item.id;
            return (
              <div
                key={item.id}
                onMouseEnter={() => setActiveItem(item.id)}
                onMouseLeave={() => setActiveItem(null)}
                className="anatomy-card-item"
                style={{
                  padding: '1rem 1.25rem',
                  borderRadius: '16px',
                  backgroundColor: isHovered ? '#ffffff' : 'transparent',
                  border: isHovered ? '1px solid #ebe5dc' : '1px solid transparent',
                  boxShadow: isHovered ? '0 8px 24px rgba(21, 50, 34, 0.05)' : 'none',
                  cursor: 'pointer',
                }}
              >
                {/* Header with Title & Icon */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '0.55rem',
                  }}
                >
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #ebe5dc',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                      flexShrink: 0,
                    }}
                  >
                    {item.icon}
                  </div>
                  <h3
                    style={{
                      fontSize: '1.05rem',
                      fontWeight: 800,
                      letterSpacing: '1px',
                      color: isHovered ? '#dd5226' : '#153222',
                      textTransform: 'uppercase',
                      margin: 0,
                      transition: 'color 0.2s ease',
                    }}
                  >
                    {item.title}
                  </h3>
                </div>

                {/* Bullets List */}
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: '1.25rem',
                    color: '#4e5d53',
                    fontSize: '0.88rem',
                    lineHeight: 1.6,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.2rem',
                  }}
                >
                  {item.bullets.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default BotanicalAnatomyShowcase;
