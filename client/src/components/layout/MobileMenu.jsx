import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, Home, ShoppingBag, Heart, User, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { siteConfig } from '../../config/siteConfig';

const MobileMenu = ({ isOpen, onClose }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleNav = (path) => {
    onClose();
    navigate(path);
  };

  const handleLogout = async () => {
    onClose();
    await logout();
    navigate('/');
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
        zIndex: 10000,
        display: 'flex',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '80%',
          maxWidth: '320px',
          height: '100%',
          backgroundColor: '#ffffff',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '4px 0 20px rgba(0,0,0,0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1b4332' }}>{siteConfig.brandName}</span>
          <button onClick={onClose} aria-label="Close menu" style={{ background: 'none', border: 'none', padding: '0.4rem' }}>
            <X size={24} color="#1b4332" />
          </button>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontSize: '1rem', fontWeight: 500 }}>
          <div onClick={() => handleNav('/')} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', color: '#1b4332' }}>
            <Home size={20} color="#2d6a4f" /> Home
          </div>
          <div onClick={() => handleNav('/shop')} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', color: '#1b4332' }}>
            <ShoppingBag size={20} color="#2d6a4f" /> Shop All Products
          </div>
          <div onClick={() => handleNav('/wishlist')} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', color: '#1b4332' }}>
            <Heart size={20} color="#2d6a4f" /> My Wishlist
          </div>
          <div onClick={() => handleNav('/cart')} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', color: '#1b4332' }}>
            <ShoppingBag size={20} color="#2d6a4f" /> Cart
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #e2e8e4', margin: '0.5rem 0' }} />

          {isAuthenticated ? (
            <>
              <div onClick={() => handleNav('/profile')} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', color: '#1b4332' }}>
                <User size={20} color="#2d6a4f" /> Profile & Addresses ({user?.firstName})
              </div>
              {user?.role === 'admin' && (
                <div onClick={() => handleNav('/admin')} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', color: '#b7094c', fontWeight: 600 }}>
                  <ShieldCheck size={20} /> Admin Dashboard
                </div>
              )}
              <div onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', color: '#dc2626', marginTop: '1rem' }}>
                <LogOut size={20} /> Logout
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
              <button onClick={() => handleNav('/login')} className="btn btn-primary" style={{ width: '100%' }}>
                Login
              </button>
              <button onClick={() => handleNav('/register')} className="btn btn-outline" style={{ width: '100%' }}>
                Create Account
              </button>
            </div>
          )}
        </nav>
      </div>
    </div>
  );
};

export default MobileMenu;
