import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, Heart, User, Menu, ShieldCheck, Bell, LogOut } from 'lucide-react';
import notificationService from '../../services/notificationService';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { siteConfig } from '../../config/siteConfig';
import MobileMenu from './MobileMenu';

const Header = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  React.useEffect(() => {
    if (isAuthenticated) {
      notificationService
        .getUnreadCount()
        .then((res) => setUnreadNotifCount(res.data?.unreadCount || 0))
        .catch(() => {});
    }
  }, [isAuthenticated]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim().length > 0) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const isHome = location.pathname === '/';
  const isShop = location.pathname.startsWith('/shop');

  return (
    <header
      style={{
        backgroundColor: '#ffffff',
        color: '#153222',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        borderBottom: '1px solid #eae5dc',
        boxShadow: '0 2px 12px rgba(21, 50, 34, 0.04)',
      }}
    >
      <div
        className="container-fluid"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '0.85rem',
          paddingBottom: '0.85rem',
          gap: '1.25rem',
        }}
      >
        {/* Brand Logo & Mobile Menu Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Open navigation menu"
            className="mobile-only"
            style={{
              background: 'none',
              border: 'none',
              color: '#153222',
              cursor: 'pointer',
              padding: '0.2rem',
            }}
          >
            <Menu size={24} />
          </button>

          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              textDecoration: 'none',
            }}
          >
            {/* Elegant Botanical Twin Leaf Mark */}
            <svg
              width="34"
              height="34"
              viewBox="0 0 36 36"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ flexShrink: 0 }}
            >
              <path
                d="M18 32C18 32 15 23 7 20C7 10 14 5 21 6C20 12 18 19 18 32Z"
                fill="#153222"
              />
              <path
                d="M18 32C18 32 21 21 29 17C29 8 22 4 16 6C17 12 18 20 18 32Z"
                fill="#2d6a4f"
                opacity="0.9"
              />
            </svg>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span
                style={{
                  fontSize: '1.45rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-serif)',
                  color: '#153222',
                  letterSpacing: '-0.3px',
                  lineHeight: 1.1,
                }}
              >
                {siteConfig.brandName}
              </span>
              <span
                style={{
                  fontSize: '0.58rem',
                  fontWeight: 600,
                  letterSpacing: '2.4px',
                  color: '#55685c',
                  textTransform: 'uppercase',
                  marginTop: '1px',
                }}
              >
                Pure Herbal Wellness
              </span>
            </div>
          </Link>
        </div>

        {/* Centered Search Field (Desktop) */}
        <form
          onSubmit={handleSearchSubmit}
          className="desktop-only"
          style={{ flex: 1, maxWidth: '440px', position: 'relative' }}
        >
          <Search
            size={17}
            color="#78887e"
            style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            placeholder="Search herbal teas, ashwagandha, skin oils, immunity..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.62rem 1.25rem 0.62rem 2.6rem',
              borderRadius: '99px',
              border: '1.5px solid #ded7cb',
              backgroundColor: '#fbfaf7',
              color: '#1a2e22',
              fontSize: '0.86rem',
              outline: 'none',
              transition: 'var(--transition)',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#153222';
              e.target.style.backgroundColor = '#ffffff';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#ded7cb';
              e.target.style.backgroundColor = '#fbfaf7';
            }}
          />
        </form>

        {/* Navigation Links & Action Controls */}
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.4rem',
            fontSize: '0.92rem',
            fontWeight: 500,
          }}
        >
          {/* Home Link with active indicator */}
          <Link
            to="/"
            className="desktop-only"
            style={{
              color: isHome ? '#153222' : '#45564c',
              fontWeight: isHome ? 600 : 500,
              position: 'relative',
              paddingBottom: '4px',
              textDecoration: 'none',
            }}
          >
            Home
            {isHome && (
              <span
                style={{
                  position: 'absolute',
                  bottom: '-8px',
                  left: 0,
                  right: 0,
                  height: '2px',
                  backgroundColor: '#153222',
                  borderRadius: '2px',
                }}
              />
            )}
          </Link>

          {/* Shop Link */}
          <Link
            to="/shop"
            className="desktop-only"
            style={{
              color: isShop ? '#153222' : '#45564c',
              fontWeight: isShop ? 600 : 500,
              position: 'relative',
              paddingBottom: '4px',
              textDecoration: 'none',
            }}
          >
            Shop
            {isShop && (
              <span
                style={{
                  position: 'absolute',
                  bottom: '-8px',
                  left: 0,
                  right: 0,
                  height: '2px',
                  backgroundColor: '#153222',
                  borderRadius: '2px',
                }}
              />
            )}
          </Link>

          {/* Wishlist */}
          <Link
            to="/wishlist"
            style={{
              color: '#153222',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
            }}
            aria-label="Wishlist"
          >
            <Heart size={21} strokeWidth={1.8} color="#153222" />
            {wishlistCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-7px',
                  right: '-9px',
                  backgroundColor: '#dd5226',
                  color: '#ffffff',
                  borderRadius: '50%',
                  width: '18px',
                  height: '18px',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* Notifications (if authenticated) */}
          {isAuthenticated && (
            <Link
              to="/notifications"
              style={{
                color: '#153222',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
              }}
              aria-label="Notifications"
            >
              <Bell size={21} strokeWidth={1.8} color="#153222" />
              {unreadNotifCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-7px',
                    right: '-9px',
                    backgroundColor: '#dd5226',
                    color: '#ffffff',
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {unreadNotifCount}
                </span>
              )}
            </Link>
          )}

          {/* Cart Icon with Orange Pill/Circle Badge */}
          <Link
            to="/cart"
            style={{
              color: '#153222',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
            }}
            aria-label="Shopping Cart"
          >
            <ShoppingBag size={21} strokeWidth={1.8} color="#153222" />
            {cartCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-7px',
                  right: '-10px',
                  backgroundColor: '#dd5226',
                  color: '#ffffff',
                  borderRadius: '50%',
                  width: '19px',
                  height: '19px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 5px rgba(221, 82, 38, 0.4)',
                }}
              >
                {cartCount}
              </span>
            )}
          </Link>

          {/* User Account / Login */}
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Link
                to="/profile"
                style={{
                  color: '#153222',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  textDecoration: 'none',
                  fontWeight: 500,
                }}
              >
                <User size={20} strokeWidth={1.8} />
                <span className="desktop-only">{user?.firstName}</span>
              </Link>
              {user?.role === 'admin' && (
                <Link
                  to="/admin"
                  title="Admin Dashboard"
                  className="desktop-only"
                  style={{ color: '#2d6a4f', display: 'flex', alignItems: 'center' }}
                >
                  <ShieldCheck size={20} />
                </Link>
              )}
              <button
                onClick={handleLogout}
                title="Logout"
                style={{
                  background: 'rgba(221, 82, 38, 0.08)',
                  border: '1px solid rgba(221, 82, 38, 0.25)',
                  color: '#dd5226',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  padding: '0.35rem 0.65rem',
                  borderRadius: '8px',
                  transition: 'all 0.2s',
                }}
              >
                <LogOut size={15} color="#dd5226" />
                <span className="desktop-only">Logout</span>
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                color: '#153222',
                fontWeight: 500,
                textDecoration: 'none',
                padding: '0.4rem 0.6rem',
                borderRadius: '8px',
              }}
            >
              <User size={19} strokeWidth={1.8} color="#153222" />
              <span>Login</span>
            </Link>
          )}
        </nav>
      </div>

      {/* Mobile Search Form Bar */}
      <div className="mobile-only" style={{ padding: '0 1.5rem 0.75rem 1.5rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ position: 'relative', width: '100%' }}>
          <Search
            size={16}
            color="#78887e"
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            placeholder="Search herbal teas, ashwagandha, skin oils..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.52rem 1rem 0.52rem 2.4rem',
              borderRadius: '99px',
              border: '1.5px solid #ded7cb',
              backgroundColor: '#fbfaf7',
              fontSize: '0.85rem',
              outline: 'none',
            }}
          />
        </form>
      </div>

      {/* Mobile Navigation Drawer */}
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
    </header>
  );
};

export default Header;
