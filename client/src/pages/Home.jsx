import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Award, Package } from 'lucide-react';
import { productService } from '../services/productService';
import { categoryService } from '../services/categoryService';
import HeroCarousel from '../components/home/HeroCarousel';
import ProductCarousel from '../components/product/ProductCarousel';
import CategoryCard from '../components/category/CategoryCard';
import { CategoryCardSkeleton } from '../components/common/LoadingSkeleton';
import ErrorState from '../components/common/ErrorState';

const Home = () => {
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [catRes, prodRes] = await Promise.all([
        categoryService.getPublicCategories(),
        productService.getProducts({ limit: 12 }),
      ]);
      setCategories(catRes.data || []);
      const prods = prodRes.data || [];
      const bestsellers = prods.filter((p) => p.isFeatured);
      setFeaturedProducts(bestsellers.length > 0 ? bestsellers : prods);
    } catch (err) {
      console.error('Failed to load home data', err);
      setError('Unable to load storefront data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomeData();
  }, []);

  return (
    <div style={{ backgroundColor: '#fbf9f5', minHeight: '100vh' }}>
      {/* 1. EDGE-TO-EDGE FULL-WIDTH HERO CAROUSEL */}
      <HeroCarousel />

      {/* 2. MAIN WIDE CONTENT CONTAINER */}
      <div className="container" style={{ paddingTop: '3.5rem', paddingBottom: '4rem' }}>
        {error && <ErrorState message={error} onRetry={fetchHomeData} />}

        {/* 2. BESTSELLERS HORIZONTALLY SCROLLABLE PRODUCT CAROUSEL */}
        <div style={{ marginBottom: '4.5rem' }}>
          <ProductCarousel
            products={featuredProducts}
            loading={loading}
            title="Bestsellers"
            subtitle="Freshly baked artisan cakes, treats & celebration favourites"
            viewAllLink="/shop"
          />
        </div>

        {/* 3. TRUST STRIP (Bakery Theme) */}
        <section
          style={{
            padding: '3rem 1rem 1rem 1rem',
            borderTop: '1px solid #eae5dc',
            position: 'relative',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '2.5rem',
              alignItems: 'center',
            }}
          >
            {/* 1. Freshly Baked */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.1rem' }}>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '12px',
                  border: '1.5px solid #ded7cb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#153222',
                  flexShrink: 0,
                  backgroundColor: '#faf7f2',
                }}
              >
                <Award size={26} strokeWidth={1.7} />
              </div>
              <div>
                <h4
                  style={{
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: '#153222',
                    marginBottom: '0.2rem',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  Freshly Baked Everyday
                </h4>
                <p style={{ fontSize: '0.84rem', color: '#65776d', margin: 0 }}>
                  Baked fresh on order with pure butter &amp; cocoa
                </p>
              </div>
            </div>

            {/* 2. Secure checkout */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.1rem' }}>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '12px',
                  border: '1.5px solid #ded7cb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#153222',
                  flexShrink: 0,
                  backgroundColor: '#faf7f2',
                }}
              >
                <ShieldCheck size={26} strokeWidth={1.7} />
              </div>
              <div>
                <h4
                  style={{
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: '#153222',
                    marginBottom: '0.2rem',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  Secure checkout
                </h4>
                <p style={{ fontSize: '0.84rem', color: '#65776d', margin: 0 }}>
                  100% safe payments &amp; Cash on Delivery
                </p>
              </div>
            </div>

            {/* 3. Celebration packaging */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.1rem' }}>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '12px',
                  border: '1.5px solid #ded7cb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#153222',
                  flexShrink: 0,
                  backgroundColor: '#faf7f2',
                }}
              >
                <Package size={26} strokeWidth={1.7} />
              </div>
              <div>
                <h4
                  style={{
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: '#153222',
                    marginBottom: '0.2rem',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  Celebration Packaging
                </h4>
                <p style={{ fontSize: '0.84rem', color: '#65776d', margin: 0 }}>
                  Insulated packaging, free knife &amp; candles
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 4. EXPLORE ORGANIC CATEGORIES SECTION (Preserved) */}
        {categories.length > 0 && (
          <section style={{ marginTop: '4rem' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                marginBottom: '1.85rem',
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '0.8rem',
                    color: '#2d6a4f',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                  }}
                >
                  Fresh From Our Oven
                </span>
                <h3
                  style={{
                    fontSize: '1.8rem',
                    color: '#153222',
                    fontFamily: 'var(--font-serif)',
                    marginTop: '0.2rem',
                  }}
                >
                  Explore Bakery Collections
                </h3>
              </div>
              <Link
                to="/shop"
                style={{
                  color: '#153222',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  textDecoration: 'none',
                }}
              >
                View all categories <ArrowRight size={15} />
              </Link>
            </div>

            {loading ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                  gap: '1.5rem',
                }}
              >
                {Array.from({ length: 4 }).map((_, idx) => (
                  <CategoryCardSkeleton key={idx} />
                ))}
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                  gap: '1.5rem',
                }}
              >
                {categories.map((category) => (
                  <CategoryCard key={category._id} category={category} />
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
};

export default Home;
