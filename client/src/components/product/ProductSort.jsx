import React from 'react';

const ProductSort = ({ value = 'newest', onChange }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
      <label style={{ color: '#5c6e63', fontWeight: 500 }}>Sort By:</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          padding: '0.45rem 1rem',
          borderRadius: '99px',
          border: '1px solid #e2e8e4',
          backgroundColor: '#ffffff',
          color: '#1b4332',
          fontWeight: 600,
          outline: 'none',
          cursor: 'pointer',
        }}
      >
        <option value="newest">Newest Arrivals</option>
        <option value="oldest">Oldest First</option>
        <option value="priceLow">Price: Low to High</option>
        <option value="priceHigh">Price: High to Low</option>
        <option value="rating">Top Rated</option>
        <option value="popular">Most Popular</option>
      </select>
    </div>
  );
};

export default ProductSort;
