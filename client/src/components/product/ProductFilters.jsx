import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';

const ProductFilters = ({ categories = [], filters = {}, onFilterChange, onResetFilters }) => {
  return (
    <div className="glass-card" style={{ padding: '1.25rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8e4', paddingBottom: '0.75rem' }}>
        <h3 style={{ fontSize: '1.1rem', color: '#1b4332', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Filter size={18} color="#2d6a4f" /> Filters
        </h3>
        <button
          onClick={onResetFilters}
          style={{ background: 'none', border: 'none', color: '#5c6e63', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
        >
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      {/* Categories Filter */}
      <div>
        <h4 style={{ fontSize: '0.9rem', color: '#1b4332', marginBottom: '0.6rem' }}>Categories</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.85rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="radio"
              name="category"
              checked={!filters.category}
              onChange={() => onFilterChange({ category: '' })}
            />
            <span>All Categories</span>
          </label>
          {Array.isArray(categories) &&
            categories.map((cat) => (
              <label key={cat._id || cat.slug} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="category"
                  checked={filters.category === cat.slug}
                  onChange={() => onFilterChange({ category: cat.slug })}
                />
                <span>{cat.name}</span>
              </label>
            ))}
        </div>
      </div>

      {/* Price Range Filter */}
      <div>
        <h4 style={{ fontSize: '0.9rem', color: '#1b4332', marginBottom: '0.6rem' }}>Price Range (₹)</h4>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input
            type="number"
            placeholder="Min"
            value={filters.minPrice || ''}
            onChange={(e) => onFilterChange({ minPrice: e.target.value })}
            style={{ width: '100%', padding: '0.45rem', borderRadius: '8px', border: '1px solid #e2e8e4', fontSize: '0.85rem' }}
          />
          <span style={{ color: '#8e9e94' }}>-</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.maxPrice || ''}
            onChange={(e) => onFilterChange({ maxPrice: e.target.value })}
            style={{ width: '100%', padding: '0.45rem', borderRadius: '8px', border: '1px solid #e2e8e4', fontSize: '0.85rem' }}
          />
        </div>
      </div>

      {/* Rating Filter */}
      <div>
        <h4 style={{ fontSize: '0.9rem', color: '#1b4332', marginBottom: '0.6rem' }}>Minimum Rating</h4>
        <select
          value={filters.minRating || ''}
          onChange={(e) => onFilterChange({ minRating: e.target.value })}
          style={{ width: '100%', padding: '0.45rem', borderRadius: '8px', border: '1px solid #e2e8e4', fontSize: '0.85rem', outline: 'none' }}
        >
          <option value="">All Ratings</option>
          <option value="4.5">4.5 &amp; above</option>
          <option value="4.0">4.0 &amp; above</option>
          <option value="3.5">3.5 &amp; above</option>
        </select>
      </div>

      {/* Featured Filter */}
      <div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: '#1b4332' }}>
          <input
            type="checkbox"
            checked={filters.featured === 'true'}
            onChange={(e) => onFilterChange({ featured: e.target.checked ? 'true' : '' })}
          />
          <span>Featured Products Only</span>
        </label>
      </div>
    </div>
  );
};

export default ProductFilters;
