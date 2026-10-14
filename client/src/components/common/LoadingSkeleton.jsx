import React from 'react';

export const ProductCardSkeleton = () => (
  <div className="glass-card" style={{ padding: '1rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
    <div className="skeleton-box" style={{ width: '100%', height: '180px', borderRadius: '12px' }} />
    <div className="skeleton-box" style={{ width: '40%', height: '14px', borderRadius: '4px' }} />
    <div className="skeleton-box" style={{ width: '85%', height: '18px', borderRadius: '4px' }} />
    <div className="skeleton-box" style={{ width: '60%', height: '22px', borderRadius: '4px' }} />
    <div className="skeleton-box" style={{ width: '100%', height: '38px', borderRadius: '99px', marginTop: '0.5rem' }} />
  </div>
);

export const CategoryCardSkeleton = () => (
  <div className="glass-card" style={{ padding: '1rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
    <div className="skeleton-box" style={{ width: '60px', height: '60px', borderRadius: '50%' }} />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div className="skeleton-box" style={{ width: '70%', height: '16px', borderRadius: '4px' }} />
      <div className="skeleton-box" style={{ width: '90%', height: '12px', borderRadius: '4px' }} />
    </div>
  </div>
);

export const ProductDetailSkeleton = () => (
  <div className="container" style={{ padding: '3rem 0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2.5rem' }}>
    <div className="skeleton-box" style={{ width: '100%', height: '400px', borderRadius: '16px' }} />
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="skeleton-box" style={{ width: '30%', height: '16px', borderRadius: '4px' }} />
      <div className="skeleton-box" style={{ width: '80%', height: '32px', borderRadius: '4px' }} />
      <div className="skeleton-box" style={{ width: '40%', height: '28px', borderRadius: '4px' }} />
      <div className="skeleton-box" style={{ width: '100%', height: '80px', borderRadius: '8px' }} />
      <div className="skeleton-box" style={{ width: '100%', height: '48px', borderRadius: '99px' }} />
    </div>
  </div>
);
