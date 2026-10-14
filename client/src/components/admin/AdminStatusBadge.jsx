import React from 'react';

const AdminStatusBadge = ({ status, type = 'order' }) => {
  const getColors = () => {
    const s = String(status || '').toUpperCase();

    if (s === 'CONFIRMED' || s === 'PAID' || s === 'DELIVERED' || s === 'APPROVED' || s === 'IN_STOCK' || s === 'ACTIVE' || status === true) {
      return { bg: '#e8f5e9', color: '#1b4332', border: '1px solid #c8e6c9' };
    }
    if (s === 'PROCESSING' || s === 'SHIPPED' || s === 'LOW_STOCK' || s === 'PENDING') {
      return { bg: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' };
    }
    if (s === 'CANCELLED' || s === 'FAILED' || s === 'REFUNDED' || s === 'OUT_OF_STOCK' || s === 'REJECTED' || s === 'INACTIVE' || status === false) {
      return { bg: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' };
    }
    return { bg: '#f3ede2', color: '#647369', border: '1px solid #ded7cb' };
  };

  const { bg, color, border } = getColors();
  const label = typeof status === 'boolean' ? (status ? 'Active' : 'Inactive') : status;

  return (
    <span
      style={{
        backgroundColor: bg,
        color: color,
        border: border,
        padding: '0.22rem 0.75rem',
        borderRadius: '99px',
        fontSize: '0.74rem',
        fontWeight: 700,
        display: 'inline-block',
        textTransform: 'capitalize',
        letterSpacing: '0.3px',
      }}
    >
      {label}
    </span>
  );
};

export default AdminStatusBadge;
