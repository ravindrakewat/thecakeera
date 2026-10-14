import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Layers,
  Boxes,
  ShoppingBag,
  Users,
  Ticket,
  MessageSquare,
  Image,
  BarChart2,
  Settings,
  X,
  ExternalLink,
  Truck,
  FileText,
  Leaf,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
  { label: 'Products', icon: Package, path: '/admin/products' },
  { label: 'Categories', icon: Layers, path: '/admin/categories' },
  { label: 'Inventory', icon: Boxes, path: '/admin/inventory' },
  { label: 'Orders', icon: ShoppingBag, path: '/admin/orders' },
  { label: 'Shipments', icon: Truck, path: '/admin/shipments' },
  { label: 'Invoices', icon: FileText, path: '/admin/invoices' },
  { label: 'Customers', icon: Users, path: '/admin/customers' },
  { label: 'Coupons', icon: Ticket, path: '/admin/coupons' },
  { label: 'Reviews', icon: MessageSquare, path: '/admin/reviews' },
  { label: 'Banners', icon: Image, path: '/admin/banners' },
  { label: 'Reports', icon: BarChart2, path: '/admin/reports' },
  { label: 'Settings', icon: Settings, path: '/admin/settings' },
];

const AdminSidebar = ({ mobileOpen, setMobileOpen }) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 40,
          }}
        />
      )}

      <aside
        style={{
          width: '260px',
          background: 'linear-gradient(180deg, #153222 0%, #0d2116 100%)',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: 50,
          transform: mobileOpen ? 'translateX(0)' : undefined,
          transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '4px 0 20px rgba(0, 0, 0, 0.15)',
        }}
        className="admin-sidebar"
      >
        {/* Brand Header matching client site design */}
        <div
          style={{
            padding: '1.4rem 1.35rem',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'rgba(82, 183, 136, 0.16)',
                border: '1px solid rgba(82, 183, 136, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#52b788',
                flexShrink: 0,
              }}
            >
              <Leaf size={20} />
            </div>
            <div>
              <span
                style={{
                  fontSize: '1.15rem',
                  fontWeight: 800,
                  color: '#ffffff',
                  fontFamily: 'var(--font-heading)',
                  letterSpacing: '0.2px',
                  display: 'block',
                  lineHeight: 1.15,
                }}
              >
                AyuVeda
              </span>
              <span
                style={{
                  fontSize: '0.7rem',
                  color: '#74c69d',
                  fontWeight: 700,
                  letterSpacing: '0.8px',
                  textTransform: 'uppercase',
                  display: 'block',
                  marginTop: '2px',
                }}
              >
                Admin Workspace
              </span>
            </div>
          </div>
          {mobileOpen && (
            <button
              onClick={() => setMobileOpen(false)}
              style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '0.25rem' }}
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Navigation Menu */}
        <nav style={{ flex: 1, padding: '1rem 0.75rem', overflowY: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/admin' || item.path === '/admin/dashboard'}
                  onClick={() => setMobileOpen(false)}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.72rem 0.95rem',
                    borderRadius: '10px',
                    color: isActive ? '#ffffff' : '#a7c1b2',
                    backgroundColor: isActive ? '#244b36' : 'transparent',
                    boxShadow: isActive ? 'inset 3px 0 0 #52b788' : 'none',
                    fontWeight: isActive ? 700 : 500,
                    textDecoration: 'none',
                    fontSize: '0.88rem',
                    transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
                  })}
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.classList.contains('active')) {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                      e.currentTarget.style.color = '#ffffff';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!e.currentTarget.classList.contains('active')) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#a7c1b2';
                    }
                  }}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* Storefront Link */}
        <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.7rem 1rem',
              backgroundColor: 'rgba(82, 183, 136, 0.12)',
              border: '1px solid rgba(82, 183, 136, 0.25)',
              color: '#d8f3dc',
              borderRadius: '10px',
              textDecoration: 'none',
              fontSize: '0.85rem',
              fontWeight: 600,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(82, 183, 136, 0.22)';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(82, 183, 136, 0.12)';
              e.currentTarget.style.color = '#d8f3dc';
            }}
          >
            <ExternalLink size={16} /> View Storefront
          </a>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
