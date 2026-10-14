import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, User, Leaf } from 'lucide-react';

const Navbar = () => {
  return (
    <header style={{ backgroundColor: '#1b4332', color: '#ffffff', padding: '1rem 0', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.4rem', fontWeight: '700', color: '#52b788' }}>
          <Leaf size={28} color="#52b788" />
          <span>Herbal Essence</span>
        </Link>
        <nav style={{ display: 'flex', gap: '2rem', fontSize: '1rem', fontWeight: '500' }}>
          <Link to="/" style={{ color: '#ffffff' }}>Home</Link>
          <Link to="/shop" style={{ color: '#ffffff' }}>Shop</Link>
          <Link to="/cart" style={{ color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <ShoppingBag size={20} />
            <span>Cart</span>
          </Link>
          <Link to="/login" style={{ color: '#52b788', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <User size={20} />
            <span>Account</span>
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
