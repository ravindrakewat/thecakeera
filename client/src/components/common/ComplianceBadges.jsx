import React from 'react';

/**
 * ComplianceBadges Component
 * Renders FSSAI License badge and Country of Origin badge (Make in India / Bharat)
 * Matching authentic Indian Ayurvedic / Herbal e-commerce standards.
 */
const ComplianceBadges = ({
  fssaiNumber = '12723055000162',
  countryOfOrigin = 'INDIA',
  style = {},
}) => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '0.75rem',
        width: '100%',
        ...style,
      }}
      className="compliance-badges-grid"
    >
      {/* ── 1. FSSAI CERTIFICATION BADGE ── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0.75rem 1rem',
          borderRadius: '24px',
          border: '1.2px solid #3c5443',
          backgroundColor: '#faf7f2',
          textAlign: 'center',
          gap: '0.4rem',
          transition: 'transform 0.18s ease, box-shadow 0.18s ease',
        }}
        className="compliance-badge-card"
        title={`FSSAI Central / State License No. ${fssaiNumber}`}
      >
        {/* FSSAI Stylized Vector Logo */}
        <div style={{ display: 'flex', alignItems: 'center', height: '28px' }}>
          <svg
            width="82"
            height="28"
            viewBox="0 0 92 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* fssa navy lettering */}
            <text
              x="2"
              y="23"
              fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
              fontStyle="italic"
              fontWeight="900"
              fontSize="23"
              fill="#1b365d"
              letterSpacing="-0.5px"
            >
              fssa
            </text>

            {/* i letter stem in saffron / amber */}
            <text
              x="53"
              y="23"
              fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
              fontStyle="italic"
              fontWeight="900"
              fontSize="23"
              fill="#e65100"
            >
              ı
            </text>

            {/* Dot of 'i' in saffron */}
            <circle cx="58.5" cy="8.5" r="2.2" fill="#e65100" />

            {/* Ayurvedic herbal green leaf sprouting from the dot */}
            <path
              d="M59.5 7.5 C63 4.5 66.5 3 69 2 C 67.5 5.5 64.5 8 60.5 8 Z"
              fill="#2e7d32"
            />

            {/* Green horizontal underline bar */}
            <rect x="2" y="26.5" width="51" height="2.4" rx="1.2" fill="#2e7d32" />
          </svg>
        </div>

        {/* License Number Text */}
        <span
          style={{
            fontSize: '0.76rem',
            fontWeight: 700,
            color: '#153222',
            letterSpacing: '0.8px',
            textTransform: 'uppercase',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            whiteSpace: 'nowrap',
          }}
        >
          LIC. NO. {fssaiNumber}
        </span>
      </div>

      {/* ── 2. COUNTRY OF ORIGIN BADGE ── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0.75rem 1rem',
          borderRadius: '24px',
          border: '1.2px solid #3c5443',
          backgroundColor: '#faf7f2',
          textAlign: 'center',
          gap: '0.4rem',
          transition: 'transform 0.18s ease, box-shadow 0.18s ease',
        }}
        className="compliance-badge-card"
        title={`Country of Origin: ${countryOfOrigin}`}
      >
        {/* Crisp Tiranga (Indian Flag) Vector */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '28px',
          }}
        >
          <svg
            width="34"
            height="22"
            viewBox="0 0 36 24"
            fill="none"
            style={{
              borderRadius: '3px',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.18)',
              border: '0.5px solid rgba(0, 0, 0, 0.08)',
            }}
          >
            {/* Top Stripe: Saffron */}
            <rect width="36" height="8" fill="#FF671F" />
            {/* Middle Stripe: Pure White */}
            <rect y="8" width="36" height="8" fill="#FFFFFF" />
            {/* Bottom Stripe: India Green */}
            <rect y="16" width="36" height="8" fill="#046A38" />

            {/* Ashoka Chakra in Deep Navy Blue */}
            <circle
              cx="18"
              cy="12"
              r="3.2"
              stroke="#000080"
              strokeWidth="0.75"
              fill="none"
            />
            <circle cx="18" cy="12" r="0.8" fill="#000080" />
            {/* Spokes (24 total, rendered with 6 symmetric dual lines) */}
            <line x1="18" y1="8.9" x2="18" y2="15.1" stroke="#000080" strokeWidth="0.5" />
            <line x1="14.9" y1="12" x2="21.1" y2="12" stroke="#000080" strokeWidth="0.5" />
            <line x1="15.8" y1="9.8" x2="20.2" y2="14.2" stroke="#000080" strokeWidth="0.5" />
            <line x1="20.2" y1="9.8" x2="15.8" y2="14.2" stroke="#000080" strokeWidth="0.5" />
            <line x1="16.9" y1="9.2" x2="19.1" y2="14.8" stroke="#000080" strokeWidth="0.45" />
            <line x1="19.1" y1="9.2" x2="16.9" y2="14.8" stroke="#000080" strokeWidth="0.45" />
            <line x1="15.2" y1="10.9" x2="20.8" y2="13.1" stroke="#000080" strokeWidth="0.45" />
            <line x1="15.2" y1="13.1" x2="20.8" y2="10.9" stroke="#000080" strokeWidth="0.45" />
          </svg>
        </div>

        {/* Origin Label Text */}
        <span
          style={{
            fontSize: '0.76rem',
            fontWeight: 700,
            color: '#153222',
            letterSpacing: '0.9px',
            textTransform: 'uppercase',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            whiteSpace: 'nowrap',
          }}
        >
          COUNTRY OF ORIGIN
        </span>
      </div>
    </div>
  );
};

export default ComplianceBadges;
