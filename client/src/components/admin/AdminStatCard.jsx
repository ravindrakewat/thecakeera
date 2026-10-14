import React from 'react';

const AdminStatCard = ({ title, value, icon: Icon, color = '#153222', bg = '#e8f5e9', subtitle }) => {
  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '1.35rem 1.6rem',
        border: '1px solid #eae5dc',
        boxShadow: '0 2px 10px rgba(21, 50, 34, 0.04)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
      className="admin-card"
    >
      <div>
        <span style={{ fontSize: '0.84rem', color: '#647369', fontWeight: 600, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {title}
        </span>
        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#153222', marginTop: '0.25rem', fontFamily: 'var(--font-heading)' }}>
          {value}
        </div>
        {subtitle && (
          <span style={{ fontSize: '0.78rem', color: '#8e9e94', marginTop: '0.25rem', display: 'block' }}>
            {subtitle}
          </span>
        )}
      </div>

      {Icon && (
        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            backgroundColor: bg,
            border: '1px solid rgba(21, 50, 34, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color,
            flexShrink: 0,
          }}
        >
          <Icon size={24} strokeWidth={2} />
        </div>
      )}
    </div>
  );
};

export default AdminStatCard;
