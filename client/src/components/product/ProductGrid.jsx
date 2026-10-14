import React from 'react';
import ProductCard from './ProductCard';
import { ProductCardSkeleton } from '../common/LoadingSkeleton';
import EmptyState from '../common/EmptyState';

const ProductGrid = ({ products = [], loading = false, emptyMessage = 'No products match your current filters.' }) => {
  if (loading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem' }}>
        {Array.from({ length: 8 }).map((_, idx) => (
          <ProductCardSkeleton key={idx} />
        ))}
      </div>
    );
  }

  if (!Array.isArray(products) || products.length === 0) {
    return <EmptyState title="No Products Available" message={emptyMessage} actionText="Clear Filters" actionLink="/shop" />;
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem' }}>
      {products.map((product) => (
        <ProductCard key={product._id || product.id} product={product} />
      ))}
    </div>
  );
};

export default ProductGrid;
