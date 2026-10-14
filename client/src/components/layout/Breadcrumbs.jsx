import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const Breadcrumbs = ({ items = [] }) => {
  if (!items || items.length === 0) return null;

  return (
    <nav style={{ padding: '0.85rem 0', fontSize: '0.85rem', color: '#5c6e63' }} aria-label="Breadcrumb">
      <div className="container" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', color: '#1b4332' }}>
          <Home size={15} />
        </Link>
        {items.map((item, index) => (
          <React.Fragment key={index}>
            <ChevronRight size={14} color="#8e9e94" />
            {item.link ? (
              <Link to={item.link} style={{ color: '#2d6a4f', fontWeight: 500 }}>
                {item.label}
              </Link>
            ) : (
              <span style={{ color: '#1b4332', fontWeight: 600 }}>{item.label}</span>
            )}
          </React.Fragment>
        ))}
      </div>
    </nav>
  );
};

export default Breadcrumbs;
