import React from 'react';
import { useCart } from '../../context/CartContext';
import { CheckCircle } from 'lucide-react';

const Toast = () => {
  const { toastMessage } = useCart();

  if (!toastMessage) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        backgroundColor: '#1b4332',
        color: '#ffffff',
        padding: '0.85rem 1.4rem',
        borderRadius: '99px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
        zIndex: 9999,
        fontSize: '0.9rem',
        fontWeight: 500,
        animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <CheckCircle size={18} color="#52b788" />
      <span>{toastMessage}</span>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Toast;
