import React from 'react';

const Footer = () => {
  return (
    <footer style={{ backgroundColor: '#0f1713', color: '#a3b8ab', padding: '2rem 0', marginTop: '4rem', textAlign: 'center' }}>
      <div className="container">
        <p>&copy; {new Date().getFullYear()} Herbal E-Commerce. All rights reserved. 100% Pure, Organic & Natural.</p>
      </div>
    </footer>
  );
};

export default Footer;
