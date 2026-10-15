import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productService } from '../services/productService';
import ProductGrid from '../components/product/ProductGrid';
import ProductSort from '../components/product/ProductSort';
import Breadcrumbs from '../components/layout/Breadcrumbs';
import ErrorState from '../components/common/ErrorState';
import { Search } from 'lucide-react';
import { siteConfig } from '../config/siteConfig';

const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1, limit: 12 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const query = searchParams.get('q') || '';
  const sort = searchParams.get('sort') || 'newest';
  const page = parseInt(searchParams.get('page')) || 1;

  const fetchSearchResults = async () => {
    if (!query.trim()) {
      setProducts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await productService.getProducts({
        search: query.trim(),
        sort,
        page,
        limit: 12,
      });
      setProducts(res.data || []);
      setPagination(res.pagination || { total: 0, page: 1, pages: 1, limit: 12 });
    } catch (err) {
      console.error('Failed to search products', err);
      setError('Search query failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSearchResults();
    document.title = `Search Results for "${query}" | ${siteConfig.brandName}`;
  }, [query, sort, page]);

  const handleSortChange = (newSort) => {
    const params = new URLSearchParams(searchParams);
    params.set('sort', newSort);
    params.set('page', '1');
    setSearchParams(params);
  };

  return (
    <div className="container" style={{ paddingBottom: '4rem' }}>
      <Breadcrumbs items={[{ label: 'Search Results' }]} />

      <div className="glass-card" style={{ padding: '2rem 1.5rem', borderRadius: '20px', marginBottom: '2rem', backgroundColor: '#ffffff' }}>
        <h1 style={{ fontSize: '1.8rem', color: '#1b4332', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Search size={24} color="#2d6a4f" /> Search Results for "{query}"
        </h1>
        <p style={{ color: '#5c6e63', fontSize: '0.95rem', marginTop: '0.3rem' }}>
          Found {pagination.total} matching bakery items for your search query.
        </p>
      </div>

      {error && <ErrorState message={error} onRetry={fetchSearchResults} />}

      <div
        className="glass-card"
        style={{
          padding: '0.85rem 1.25rem',
          borderRadius: '14px',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#ffffff',
        }}
      >
        <span style={{ fontSize: '0.9rem', color: '#5c6e63', fontWeight: 500 }}>
          Showing <strong>{products.length}</strong> of <strong>{pagination.total}</strong> items
        </span>
        <ProductSort value={sort} onChange={handleSortChange} />
      </div>

      <ProductGrid products={products} loading={loading} emptyMessage={`No products found for "${query}". Try searching for 'ashwagandha', 'tea', or 'oil'.`} />
    </div>
  );
};

export default SearchResults;
