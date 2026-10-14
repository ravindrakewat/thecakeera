import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf, ShieldCheck, Truck, RefreshCw, Mail, Phone } from 'lucide-react';
import { siteConfig } from '../../config/siteConfig';

const Footer = () => {
  return (
    <footer style={{ backgroundColor: '#0d1f17', color: '#a3b8ab', paddingTop: '3.5rem', paddingBottom: '2rem', marginTop: '4rem', borderTop: '1px solid #1b4332' }}>
      <div className="container">
        
        {/* Trust Badges */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', paddingBottom: '3rem', borderBottom: '1px solid #1f2923', marginBottom: '3rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <Leaf size={28} color="#52b788" />
            <div>
              <h4 style={{ color: '#ffffff', fontSize: '0.95rem', marginBottom: '0.2rem' }}>100% Organic</h4>
              <p style={{ fontSize: '0.8rem', color: '#8e9e94' }}>Sustainably harvested Himalayan herbs</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <ShieldCheck size={28} color="#52b788" />
            <div>
              <h4 style={{ color: '#ffffff', fontSize: '0.95rem', marginBottom: '0.2rem' }}>AYUSH Certified</h4>
              <p style={{ fontSize: '0.8rem', color: '#8e9e94' }}>Lab tested authentic formulations</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <Truck size={28} color="#52b788" />
            <div>
              <h4 style={{ color: '#ffffff', fontSize: '0.95rem', marginBottom: '0.2rem' }}>Pan-India Delivery</h4>
              <p style={{ fontSize: '0.8rem', color: '#8e9e94' }}>Free shipping on orders above ₹499</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <RefreshCw size={28} color="#52b788" />
            <div>
              <h4 style={{ color: '#ffffff', fontSize: '0.95rem', marginBottom: '0.2rem' }}>Easy Returns</h4>
              <p style={{ fontSize: '0.8rem', color: '#8e9e94' }}>Hassle-free 7-day return policy</p>
            </div>
          </div>
        </div>

        {/* Footer Navigation Columns */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2.5rem', marginBottom: '3rem' }}>
          <div>
            <h3 style={{ color: '#52b788', fontSize: '1.3rem', marginBottom: '1rem' }}>{siteConfig.brandName}</h3>
            <p style={{ fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '1rem' }}>{siteConfig.description}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Mail size={15} color="#52b788" /> {siteConfig.supportEmail}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Phone size={15} color="#52b788" /> {siteConfig.supportPhone}</span>
            </div>
          </div>

          <div>
            <h4 style={{ color: '#ffffff', fontSize: '1rem', marginBottom: '1rem' }}>Quick Links</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
              <li><Link to="/shop" style={{ color: '#a3b8ab' }}>Explore All Products</Link></li>
              <li><Link to="/category/herbal-teas" style={{ color: '#a3b8ab' }}>Herbal Teas</Link></li>
              <li><Link to="/category/ayurvedic-supplements" style={{ color: '#a3b8ab' }}>Ayurvedic Supplements</Link></li>
              <li><Link to="/category/essential-oils" style={{ color: '#a3b8ab' }}>Essential Oils</Link></li>
              <li><Link to="/category/organic-skincare" style={{ color: '#a3b8ab' }}>Organic Skincare</Link></li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: '#ffffff', fontSize: '1rem', marginBottom: '1rem' }}>Customer Care</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
              <li><Link to="/profile" style={{ color: '#a3b8ab' }}>My Account</Link></li>
              <li><Link to="/orders" style={{ color: '#a3b8ab' }}>Track Orders</Link></li>
              <li><Link to="/wishlist" style={{ color: '#a3b8ab' }}>My Wishlist</Link></li>
              <li><Link to="/cart" style={{ color: '#a3b8ab' }}>Shopping Cart</Link></li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div style={{ textAlign: 'center', paddingTop: '1.5rem', borderTop: '1px solid #1f2923', fontSize: '0.8rem', color: '#5c6e63' }}>
          &copy; {new Date().getFullYear()} {siteConfig.brandName}. All rights reserved. Built with pure natural care.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
