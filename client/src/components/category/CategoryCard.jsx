import React from 'react';
import { Link } from 'react-router-dom';
import LazyImage from '../common/LazyImage';
import { ArrowRight } from 'lucide-react';

const CategoryCard = ({ category }) => {
  if (!category) return null;

  return (
    <Link
      to={`/category/${category.slug}`}
      className="glass-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '16px',
        overflow: 'hidden',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        textDecoration: 'none',
      }}
    >
      <div style={{ width: '100%', height: '160px', overflow: 'hidden' }}>
        <LazyImage src={category.image} alt={category.name} width={400} height={250} />
      </div>
      <div style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ fontSize: '1.15rem', color: '#1b4332', marginBottom: '0.3rem' }}>{category.name}</h3>
          {category.description && (
            <p style={{ fontSize: '0.85rem', color: '#5c6e63', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.5 }}>
              {category.description}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#2d6a4f', fontSize: '0.85rem', fontWeight: 600, marginTop: '1rem' }}>
          <span>Explore Category</span>
          <ArrowRight size={14} />
        </div>
      </div>
    </Link>
  );
};

export default CategoryCard;
