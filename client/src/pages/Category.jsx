import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { categoryService } from '../services/categoryService';
import { productService } from '../services/productService';
import ProductGrid from '../components/product/ProductGrid';
import ProductSort from '../components/product/ProductSort';
import Breadcrumbs from '../components/layout/Breadcrumbs';
import ErrorState from '../components/common/ErrorState';
import LazyImage from '../components/common/LazyImage';
import { siteConfig } from '../config/siteConfig';

const Category = () => {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1, limit: 12 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const sort = searchParams.get('sort') || 'newest';
  const page = parseInt(searchParams.get('page')) || 1;

  const fetchCategoryData = async () => {
    try {
      setLoading(true);
      setError(null);

      const catRes = await categoryService.getPublicCategoryBySlug(slug);
      setCategory(catRes.data);

      const prodRes = await productService.getProducts({
        category: slug,
        sort,
        page,
        limit: 12,
      });

      setProducts(prodRes.data || []);
      setPagination(prodRes.pagination || { total: 0, page: 1, pages: 1, limit: 12 });
    } catch (err) {
      console.error('Failed to load category products', err);
      setError('Unable to load category details. The category may not exist.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategoryData();
  }, [slug, sort, page]);

  useEffect(() => {
    if (category) {
      document.title = `${category.name} | ${siteConfig.brandName}`;
    }
  }, [category]);

  const handleSortChange = (newSort) => {
    const params = new URLSearchParams(searchParams);
    params.set('sort', newSort);
    params.set('page', '1');
    setSearchParams(params);
  };

  return (
    <div className="container" style={{ paddingBottom: '4rem' }}>
      <Breadcrumbs items={[{ label: 'Shop', link: '/shop' }, { label: category?.name || slug }]} />

      {error && <ErrorState message={error} onRetry={fetchCategoryData} />}

      {category && (
        <div
          className="glass-card"
          style={{
            padding: '2rem',
            borderRadius: '20px',
            marginBottom: '2rem',
            backgroundColor: '#ffffff',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '2rem',
            alignItems: 'center',
          }}
        >
          <div>
            <span style={{ fontSize: '0.8rem', color: '#52b788', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Category</span>
            <h1 style={{ fontSize: '2.2rem', color: '#1b4332', marginBottom: '0.5rem' }}>{category.name}</h1>
            <p style={{ color: '#5c6e63', fontSize: '0.95rem', lineHeight: 1.6 }}>{category.description}</p>
          </div>
          {category.image && (
            <div style={{ height: '180px', borderRadius: '16px', overflow: 'hidden' }}>
              <LazyImage src={category.image} alt={category.name} width={500} height={300} />
            </div>
          )}
        </div>
      )}

      {/* Catalog Header Bar */}
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
          Found <strong>{pagination.total}</strong> products in {category?.name || 'this category'}
        </span>
        <ProductSort value={sort} onChange={handleSortChange} />
      </div>

      <ProductGrid products={products} loading={loading} emptyMessage={`No active products available in ${category?.name || 'this category'}.`} />
    </div>
  );
};

export default Category;
