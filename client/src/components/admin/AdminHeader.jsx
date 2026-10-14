import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Menu, LogOut, ShieldCheck, Leaf } from 'lucide-react';

const AdminHeader = ({ setMobileOpen }) => {
  const { user, logout } = useAuth();

  return (
    <header
      style={{
        height: '68px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #eae5dc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2rem',
        position: 'sticky',
        top: 0,
        zIndex: 30,
        boxShadow: '0 1px 6px rgba(21, 50, 34, 0.03)',
      }}
      className="admin-header-bar"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={() => setMobileOpen(true)}
          style={{
            background: 'none',
            border: 'none',
            color: '#153222',
            cursor: 'pointer',
            padding: '0.35rem',
            display: 'flex',
            alignItems: 'center',
            borderRadius: '8px',
          }}
          className="admin-mobile-toggle"
          aria-label="Toggle Navigation Menu"
        >
          <Menu size={22} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Leaf size={16} color="#52b788" />
          <span style={{ fontSize: '0.92rem', color: '#153222', fontWeight: 700, letterSpacing: '0.2px' }}>
            AyuVeda Operations & Management
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: '#f4f9f6',
            border: '1px solid #ded7cb',
            padding: '0.42rem 0.95rem',
            borderRadius: '99px',
          }}
        >
          <ShieldCheck size={16} color="#2d6a4f" />
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#153222' }}>
            {user ? (`${user.firstName || ''} ${user.lastName || ''}`).trim() || user.email : 'Administrator'}
          </span>
        </div>

        <button
          onClick={logout}
          title="Sign Out"
          style={{
            backgroundColor: '#fff',
            border: '1px solid #fbdcd3',
            borderRadius: '10px',
            padding: '0.45rem 0.9rem',
            cursor: 'pointer',
            color: '#dd5226',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.85rem',
            fontWeight: 600,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#fff5f2';
            e.currentTarget.style.borderColor = '#dd5226';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#fff';
            e.currentTarget.style.borderColor = '#fbdcd3';
          }}
        >
          <LogOut size={16} /> Logout
        </button>
      </div>
    </header>
  );
};

export default AdminHeader;
