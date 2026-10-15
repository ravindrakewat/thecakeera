import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productService } from '../services/productService';
import { categoryService } from '../services/categoryService';
import ProductGrid from '../components/product/ProductGrid';
import ProductFilters from '../components/product/ProductFilters';
import ProductSort from '../components/product/ProductSort';
import Breadcrumbs from '../components/layout/Breadcrumbs';
import ErrorState from '../components/common/ErrorState';
import { Filter, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { siteConfig } from '../config/siteConfig';

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1, limit: 12 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Extract filter parameters from URL
  const filters = {
    category: searchParams.get('category') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    minRating: searchParams.get('minRating') || '',
    featured: searchParams.get('featured') || '',
    sort: searchParams.get('sort') || 'newest',
    page: parseInt(searchParams.get('page')) || 1,
  };

  const fetchCategories = async () => {
    try {
      const res = await categoryService.getPublicCategories();
      setCategories(res.data || []);
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        category: filters.category,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        minRating: filters.minRating,
        featured: filters.featured,
        sort: filters.sort,
        page: filters.page,
        limit: 12,
      };

      // Clean empty keys before request
      Object.keys(params).forEach((key) => {
        if (!params[key]) delete params[key];
      });

      const res = await productService.getProducts(params);
      setProducts(res.data || []);
      setPagination(res.pagination || { total: 0, page: 1, pages: 1, limit: 12 });
    } catch (err) {
      console.error('Failed to fetch products', err);
      setError(err.response?.data?.message || err.message || 'Unable to load product catalog. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [searchParams.toString()]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
    document.title = `Storefront Shop | ${siteConfig.brandName}`;
  }, [fetchProducts]);

  const updateFilters = (newFilters) => {
    const updated = { ...filters, ...newFilters, page: 1 }; // Reset to page 1 on filter change
    const params = new URLSearchParams();

    Object.keys(updated).forEach((key) => {
      if (updated[key]) {
        params.set(key, updated[key]);
      }
    });

    setSearchParams(params);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      const params = new URLSearchParams(searchParams);
      params.set('page', newPage.toString());
      setSearchParams(params);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const resetFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  return (
    <div className="container" style={{ paddingBottom: '4rem' }}>
      <Breadcrumbs items={[{ label: 'Shop Storefront' }]} />

      {/* Header Banner */}
      <div
        style={{
          padding: '2.5rem 2rem',
          borderRadius: '20px',
          marginBottom: '2rem',
          backgroundColor: '#f5efe4',
          border: '1px solid #eae2d4',
        }}
      >
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            color: '#6e6255',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            display: 'block',
            marginBottom: '0.4rem',
          }}
        >
          The Cake Era Gourmet Bakery
        </span>
        <h1
          style={{
            fontSize: '2.2rem',
            color: '#153222',
            fontFamily: 'var(--font-serif)',
            fontWeight: 700,
            marginBottom: '0.4rem',
          }}
        >
          Artisanal Bakery &amp; Celebration Cakes
        </h1>
        <p style={{ color: '#55685c', fontSize: '0.98rem' }}>
          Browse freshly baked celebration cakes, designer tiers, gourmet cupcakes, flaky croissants &amp; artisanal cookies.
        </p>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={fetchProducts} />
      ) : (
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
          {/* Desktop Filter Sidebar */}
          <div className="desktop-only" style={{ width: '280px', flexShrink: 0 }}>
            <ProductFilters
              categories={categories}
              filters={filters}
              onFilterChange={updateFilters}
              onResetFilters={resetFilters}
            />
          </div>

          {/* Main Catalog Column */}
          <div style={{ flex: 1, minWidth: 0 }}>
              
              {/* Catalog Control Bar (Mobile filter toggle + Sort dropdown + Item count) */}
              <div
                className="glass-card"
                style={{
                  padding: '0.85rem 1.25rem',
                  borderRadius: '14px',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  backgroundColor: '#ffffff',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button
                    className="mobile-only btn btn-outline"
                    onClick={() => setIsMobileFilterOpen(true)}
                    style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}
                  >
                    <Filter size={16} /> Filters
                  </button>
                  <span style={{ fontSize: '0.88rem', color: '#5c6e63', fontWeight: 500 }}>
                    Showing <strong>{Array.isArray(products) ? products.length : 0}</strong> of <strong>{pagination?.total || 0}</strong> products
                  </span>
                </div>

                <ProductSort value={filters.sort} onChange={(newSort) => updateFilters({ sort: newSort })} />
              </div>

              {/* Product Grid */}
              <ProductGrid products={products} loading={loading} />

              {/* Pagination Controls */}
              {!loading && pagination?.pages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '3rem' }}>
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="btn btn-outline"
                    style={{ padding: '0.5rem 1rem', opacity: pagination.page === 1 ? 0.4 : 1 }}
                  >
                    <ChevronLeft size={16} /> Previous
                  </button>

                  <div style={{ display: 'flex', gap: '0.3rem' }}>
                    {Array.from({ length: pagination.pages }).map((_, idx) => {
                      const p = idx + 1;
                      return (
                        <button
                          key={p}
                          onClick={() => handlePageChange(p)}
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            border: 'none',
                            backgroundColor: pagination.page === p ? '#1b4332' : '#e2e8e4',
                            color: pagination.page === p ? '#ffffff' : '#1b4332',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                          }}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                    className="btn btn-outline"
                    style={{ padding: '0.5rem 1rem', opacity: pagination.page === pagination.pages ? 0.4 : 1 }}
                  >
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
      )}

      {/* Mobile Filter Drawer Modal */}
      {isMobileFilterOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.6)',
            zIndex: 10000,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
          onClick={() => setIsMobileFilterOpen(false)}
        >
          <div
            style={{
              width: '85%',
              maxWidth: '340px',
              height: '100%',
              backgroundColor: '#ffffff',
              padding: '1.5rem',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#1b4332' }}>Filter Products</h3>
              <button onClick={() => setIsMobileFilterOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={22} color="#1b4332" />
              </button>
            </div>
            <ProductFilters
              categories={categories}
              filters={filters}
              onFilterChange={(newF) => {
                updateFilters(newF);
                setIsMobileFilterOpen(false);
              }}
              onResetFilters={() => {
                resetFilters();
                setIsMobileFilterOpen(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Shop;
