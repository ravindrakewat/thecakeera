import React from 'react';

/**
 * PaymentTrustStrip component rendering crisp, authentic payment badges:
 * American Express, Mastercard, VISA, BHIM UPI, and RuPay.
 */
const PaymentTrustStrip = ({ style = {}, showLabel = true, labelText = 'Guaranteed Safe & Secure Checkout' }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.65rem',
        padding: '0.85rem 1rem',
        backgroundColor: '#faf7f2',
        borderRadius: '12px',
        border: '1px solid #eae5dc',
        ...style,
      }}
      className="payment-trust-strip"
    >
      {showLabel && (
        <span
          style={{
            fontSize: '0.78rem',
            color: '#647369',
            fontWeight: 600,
            letterSpacing: '0.4px',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2d6a4f" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          {labelText}
        </span>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: '1.15rem',
        }}
      >
        {/* 1. American Express (AMEX) */}
        <div style={{ display: 'inline-flex', alignItems: 'center' }} title="American Express">
          <svg width="38" height="24" viewBox="0 0 38 24" fill="none">
            <rect width="38" height="24" rx="4" fill="#006FCF" />
            <text
              x="50%"
              y="56%"
              dominantBaseline="middle"
              textAnchor="middle"
              fill="#FFFFFF"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="900"
              fontSize="8.5"
              letterSpacing="0.8"
            >
              AMEX
            </text>
          </svg>
        </div>

        {/* 2. Mastercard */}
        <div style={{ display: 'inline-flex', alignItems: 'center' }} title="Mastercard">
          <svg width="38" height="24" viewBox="0 0 38 24" fill="none">
            <rect width="38" height="24" rx="4" fill="#FFFFFF" stroke="#EAE5DC" />
            <circle cx="15" cy="12" r="7" fill="#EB001B" />
            <circle cx="23" cy="12" r="7" fill="#F79E1B" fillOpacity="0.85" />
          </svg>
        </div>

        {/* 3. VISA */}
        <div style={{ display: 'inline-flex', alignItems: 'center' }} title="Visa">
          <svg width="46" height="24" viewBox="0 0 46 24" fill="none">
            <rect width="46" height="24" rx="4" fill="#FFFFFF" stroke="#EAE5DC" />
            <text
              x="50%"
              y="58%"
              dominantBaseline="middle"
              textAnchor="middle"
              fill="#1A1F71"
              fontFamily="'Segoe UI', Roboto, sans-serif"
              fontWeight="900"
              fontStyle="italic"
              fontSize="12.5"
              letterSpacing="0.5"
            >
              VISA
            </text>
            <polygon points="12,7 15,7 13.5,10" fill="#F7B600" />
          </svg>
        </div>

        {/* 4. BHIM UPI */}
        <div style={{ display: 'inline-flex', alignItems: 'center' }} title="BHIM UPI">
          <svg width="84" height="24" viewBox="0 0 84 24" fill="none">
            <rect width="84" height="24" rx="4" fill="#FFFFFF" stroke="#EAE5DC" />
            {/* BHIM Text */}
            <text
              x="22"
              y="14.5"
              textAnchor="middle"
              fill="#263238"
              fontFamily="system-ui, sans-serif"
              fontWeight="900"
              fontSize="9"
              letterSpacing="0.4"
            >
              BHIM
            </text>
            {/* Tricolor Triangles for BHIM */}
            <polygon points="34,8 37,12 34,16" fill="#00A859" />
            <polygon points="36,8 39,12 36,16" fill="#F26522" />

            {/* Separator line */}
            <line x1="43" y1="5" x2="43" y2="19" stroke="#CFD8DC" strokeWidth="1" />

            {/* UPI Text */}
            <text
              x="58"
              y="14.5"
              textAnchor="middle"
              fill="#37474F"
              fontFamily="system-ui, sans-serif"
              fontWeight="900"
              fontStyle="italic"
              fontSize="10"
              letterSpacing="0.5"
            >
              UPI
            </text>
            {/* UPI green/orange arrows */}
            <polygon points="69,8 72,12 69,16" fill="#00A859" />
            <polygon points="71,8 74,12 71,16" fill="#F26522" />
          </svg>
        </div>

        {/* 5. RuPay */}
        <div style={{ display: 'inline-flex', alignItems: 'center' }} title="RuPay">
          <svg width="66" height="24" viewBox="0 0 66 24" fill="none">
            <rect width="66" height="24" rx="4" fill="#FFFFFF" stroke="#EAE5DC" />
            <text
              x="28"
              y="15.5"
              textAnchor="middle"
              fill="#092E6B"
              fontFamily="system-ui, sans-serif"
              fontWeight="900"
              fontStyle="italic"
              fontSize="11"
              letterSpacing="0.2"
            >
              RuPay
            </text>
            {/* RuPay Tricolor Chevron Arrow */}
            <polygon points="49,7 54,12 49,17" fill="#009639" />
            <polygon points="53,7 58,12 53,17" fill="#F26522" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default PaymentTrustStrip;
