import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import Breadcrumbs from '../components/layout/Breadcrumbs';
import EmptyState from '../components/common/EmptyState';
import LazyImage from '../components/common/LazyImage';
import { siteConfig } from '../config/siteConfig';
import { Trash2, Plus, Minus, ArrowRight, ShieldCheck, ShoppingBag } from 'lucide-react';

const Cart = () => {
  const { cartItems, updateQuantity, removeFromCart, clearCart, cartSubtotal } = useCart();

  const shippingFee = cartSubtotal >= 499 || cartSubtotal === 0 ? 0 : 50;
  const grandTotal = cartSubtotal + shippingFee;

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="container" style={{ paddingBottom: '4rem' }}>
        <Breadcrumbs items={[{ label: 'Shopping Cart' }]} />
        <EmptyState title="Your Cart is Empty" message="Looks like you haven't added any freshly baked cakes or treats to your cart yet." actionText="Explore Bakery" actionLink="/shop" />
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingBottom: '4rem' }}>
      <Breadcrumbs items={[{ label: 'Shopping Cart' }]} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '2rem', color: '#1b4332' }}>Shopping Cart ({cartItems.length} items)</h1>
        <button onClick={clearCart} style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: '0.85rem', cursor: 'pointer' }}>
          Clear All Items
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2.5rem' }}>
        
        {/* Left Cart Items List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {cartItems.map((item) => (
            <div
              key={item.product}
              className="glass-card"
              style={{
                padding: '1rem',
                borderRadius: '16px',
                backgroundColor: '#ffffff',
                display: 'grid',
                gridTemplateColumns: '80px 1fr auto',
                gap: '1rem',
                alignItems: 'center',
              }}
            >
              <div style={{ width: '80px', height: '80px', borderRadius: '12px', overflow: 'hidden' }}>
                <LazyImage src={item.image} alt={item.name} width={150} height={150} />
              </div>

              <div>
                <Link to={`/product/${item.slug}`} style={{ textDecoration: 'none' }}>
                  <h3 style={{ fontSize: '1rem', color: '#1b4332', marginBottom: '0.2rem' }}>{item.name}</h3>
                </Link>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#2d6a4f' }}>
                  {siteConfig.currency}{item.price.toLocaleString('en-IN')}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e2e8e4', borderRadius: '99px', padding: '0.2rem' }}>
                  <button onClick={() => updateQuantity(item.product, item.quantity - 1)} style={{ background: 'none', border: 'none', padding: '0.2rem 0.6rem', cursor: 'pointer' }}>
                    <Minus size={14} />
                  </button>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, padding: '0 0.5rem' }}>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.product, item.quantity + 1)} style={{ background: 'none', border: 'none', padding: '0.2rem 0.6rem', cursor: 'pointer' }}>
                    <Plus size={14} />
                  </button>
                </div>

                <button onClick={() => removeFromCart(item.product)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }} aria-label="Remove item">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Right Cart Summary */}
        <div>
          <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '20px', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', color: '#1b4332', borderBottom: '1px solid #e2e8e4', paddingBottom: '0.75rem' }}>Order Summary</h2>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', color: '#5c6e63' }}>
              <span>Subtotal</span>
              <span style={{ fontWeight: 600, color: '#1b4332' }}>{siteConfig.currency}{cartSubtotal.toLocaleString('en-IN')}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', color: '#5c6e63' }}>
              <span>Estimated Shipping</span>
              <span style={{ fontWeight: 600, color: shippingFee === 0 ? '#2d6a4f' : '#1b4332' }}>
                {shippingFee === 0 ? 'FREE' : `${siteConfig.currency}${shippingFee}`}
              </span>
            </div>

            {shippingFee > 0 && (
              <p style={{ fontSize: '0.78rem', color: '#2d6a4f', backgroundColor: '#d8f3dc', padding: '0.4rem 0.75rem', borderRadius: '8px' }}>
                Add {siteConfig.currency}{(499 - cartSubtotal).toLocaleString('en-IN')} more to qualify for FREE Shipping!
              </p>
            )}

            <hr style={{ border: 'none', borderTop: '1px solid #e2e8e4' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 700, color: '#1b4332' }}>
              <span>Total</span>
              <span>{siteConfig.currency}{grandTotal.toLocaleString('en-IN')}</span>
            </div>

            <Link
              to="/checkout"
              className="btn btn-primary"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                marginTop: '0.5rem',
                textDecoration: 'none',
                padding: '0.85rem',
                fontSize: '1rem',
                fontWeight: 600,
              }}
            >
              Proceed to Checkout <ArrowRight size={18} />
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#5c6e63', marginTop: '0.5rem' }}>
              <ShieldCheck size={16} color="#52b788" /> 100% Safe &amp; Secure Checkout Guarantee
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
