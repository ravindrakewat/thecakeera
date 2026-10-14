import React from 'react';
import { Link } from 'react-router-dom';
import Breadcrumbs from '../components/layout/Breadcrumbs';
import { XCircle, RefreshCw, ShoppingBag } from 'lucide-react';

const PaymentFailed = () => {
  return (
    <div className="container" style={{ paddingBottom: '5rem' }}>
      <Breadcrumbs items={[{ label: 'Payment Status' }]} />

      <div
        className="glass-card"
        style={{
          maxWidth: '600px',
          margin: '3rem auto 0',
          padding: '2.5rem',
          borderRadius: '20px',
          backgroundColor: '#fff',
          textAlign: 'center',
        }}
      >
        <XCircle size={64} color="#e63946" style={{ marginBottom: '1rem' }} />
        <h1 style={{ fontSize: '1.8rem', color: '#1b4332', marginBottom: '0.75rem' }}>
          Payment Was Not Completed
        </h1>
        <p style={{ color: '#5c6e63', fontSize: '1rem', marginBottom: '2rem', lineHeight: 1.5 }}>
          Your payment transaction was declined or interrupted. No money was deducted from your account. Your cart items are still saved so you can retry checkout.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            to="/checkout"
            className="btn btn-primary"
            style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <RefreshCw size={18} /> Retry Payment
          </Link>
          <Link
            to="/cart"
            className="btn"
            style={{ border: '1px solid #1b4332', color: '#1b4332', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <ShoppingBag size={18} /> Review Cart
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailed;
