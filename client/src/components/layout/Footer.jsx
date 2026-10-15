import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, HeartHandshake, ShieldCheck, Truck, RefreshCw, Mail, Phone } from 'lucide-react';
import { siteConfig } from '../../config/siteConfig';

const Footer = () => {
  return (
    <footer style={{ backgroundColor: '#072415', color: '#a3b8ab', paddingTop: '3.5rem', paddingBottom: '2rem', marginTop: '4rem', borderTop: '1px solid #164027' }}>
      <div className="container">
        
        {/* Trust Badges */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', paddingBottom: '3rem', borderBottom: '1px solid #143521', marginBottom: '3rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <Sparkles size={28} color="#d4af37" />
            <div>
              <h4 style={{ color: '#ffffff', fontSize: '0.95rem', marginBottom: '0.2rem' }}>Freshly Baked</h4>
              <p style={{ fontSize: '0.8rem', color: '#8e9e94' }}>Baked fresh every morning on order</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <ShieldCheck size={28} color="#d4af37" />
            <div>
              <h4 style={{ color: '#ffffff', fontSize: '0.95rem', marginBottom: '0.2rem' }}>100% Eggless Options</h4>
              <p style={{ fontSize: '0.8rem', color: '#8e9e94' }}>Pure vegetarian & customized bakes</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <Truck size={28} color="#d4af37" />
            <div>
              <h4 style={{ color: '#ffffff', fontSize: '0.95rem', marginBottom: '0.2rem' }}>Express Delivery</h4>
              <p style={{ fontSize: '0.8rem', color: '#8e9e94' }}>Delivered fresh in insulated packaging</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <HeartHandshake size={28} color="#d4af37" />
            <div>
              <h4 style={{ color: '#ffffff', fontSize: '0.95rem', marginBottom: '0.2rem' }}>Celebration Ready</h4>
              <p style={{ fontSize: '0.8rem', color: '#8e9e94' }}>Free candles, knife & greeting note</p>
            </div>
          </div>
        </div>

        {/* Footer Navigation Columns */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2.5rem', marginBottom: '3rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <img src="/logo.png" alt="The Cake Era" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #d4af37' }} />
              <div>
                <h3 style={{ color: '#d4af37', fontSize: '1.3rem', margin: 0 }}>{siteConfig.brandName}</h3>
                <span style={{ fontSize: '0.65rem', color: '#9fb3a6', letterSpacing: '1px', textTransform: 'uppercase' }}>A New Era Of Celebration</span>
              </div>
            </div>
            <p style={{ fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '1rem' }}>{siteConfig.description}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Mail size={15} color="#d4af37" /> {siteConfig.supportEmail}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Phone size={15} color="#d4af37" /> {siteConfig.supportPhone}</span>
            </div>
          </div>

          <div>
            <h4 style={{ color: '#ffffff', fontSize: '1rem', marginBottom: '1rem' }}>Bakery Categories</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
              <li><Link to="/shop" style={{ color: '#a3b8ab' }}>Explore All Bakery Items</Link></li>
              <li><Link to="/category/celebration-cakes" style={{ color: '#a3b8ab' }}>Celebration Cakes</Link></li>
              <li><Link to="/category/pastries-desserts" style={{ color: '#a3b8ab' }}>Pastries & Desserts</Link></li>
              <li><Link to="/category/cookies-biscuits" style={{ color: '#a3b8ab' }}>Artisanal Cookies</Link></li>
              <li><Link to="/category/fresh-breads" style={{ color: '#a3b8ab' }}>Fresh Breads & Buns</Link></li>
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
        <div style={{ textAlign: 'center', paddingTop: '1.5rem', borderTop: '1px solid #143521', fontSize: '0.8rem', color: '#5c6e63' }}>
          &copy; {new Date().getFullYear()} {siteConfig.brandName}. All rights reserved. Baked fresh with love for every celebration.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
