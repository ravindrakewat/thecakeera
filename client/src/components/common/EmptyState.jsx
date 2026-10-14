import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf } from 'lucide-react';

const EmptyState = ({ title = 'No Products Found', message = 'We could not find any items matching your criteria.', actionText = 'Explore Shop', actionLink = '/shop' }) => {
  return (
    <div className="glass-card" style={{ padding: '3.5rem 1.5rem', textAlign: 'center', margin: '2rem 0' }}>
      <div style={{ display: 'inline-flex', padding: '1rem', background: '#d8f3dc', borderRadius: '50%', color: '#1b4332', marginBottom: '1rem' }}>
        <Leaf size={36} />
      </div>
      <h3 style={{ fontSize: '1.4rem', color: '#1b4332', marginBottom: '0.5rem' }}>{title}</h3>
      <p style={{ color: '#5c6e63', maxWidth: '450px', margin: '0 auto 1.5rem', fontSize: '0.95rem' }}>{message}</p>
      {actionLink && (
        <Link to={actionLink} className="btn btn-primary">
          {actionText}
        </Link>
      )}
    </div>
  );
};

export default EmptyState;
