import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import adminService from '../../services/adminService';
import AdminStatCard from '../../components/admin/AdminStatCard';
import AdminChart from '../../components/admin/AdminChart';
import AdminStatusBadge from '../../components/admin/AdminStatusBadge';
import { siteConfig } from '../../config/siteConfig';
import {
  ShoppingBag,
  Clock,
  Users,
  Package,
  AlertTriangle,
  IndianRupee,
  ArrowRight,
} from 'lucide-react';

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [period, setPeriod] = useState('30d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const [mRes, tRes] = await Promise.all([
          adminService.getDashboardMetrics(),
          adminService.getRevenueTrend(period),
        ]);
        setMetrics(mRes.data);
        setTrendData(tRes.data || []);
      } catch (err) {
        console.error('Failed to load dashboard metrics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [period]);

  if (loading) {
    return <div style={{ padding: '3rem', color: '#65776d', textAlign: 'center', fontSize: '1rem', fontWeight: 500 }}>Loading Admin Dashboard...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2.1rem', color: '#153222', margin: 0, fontFamily: 'var(--font-heading)', fontWeight: 700 }}>
            Business Dashboard
          </h1>
          <p style={{ color: '#65776d', margin: '0.35rem 0 0', fontSize: '0.95rem' }}>
            Real-time platform metrics, revenue trends, and inventory health
          </p>
        </div>
      </div>

      {/* Summary Cards with AyuVeda Organic Herbal Palette */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2.25rem' }}>
        <AdminStatCard
          title="Total Revenue"
          value={`${siteConfig.currency}${(metrics?.totalRevenue || 0).toLocaleString('en-IN')}`}
          icon={IndianRupee}
          color="#153222"
          bg="#e8f5e9"
        />
        <AdminStatCard
          title="Total Orders"
          value={metrics?.totalOrders || 0}
          icon={ShoppingBag}
          color="#2d6a4f"
          bg="#e8f5e9"
        />
        <AdminStatCard
          title="Pending Orders"
          value={metrics?.pendingOrders || 0}
          icon={Clock}
          color="#92400e"
          bg="#fef3c7"
        />
        <AdminStatCard
          title="Total Customers"
          value={metrics?.totalCustomers || 0}
          icon={Users}
          color="#52b788"
          bg="#f0fdf4"
        />
        <AdminStatCard
          title="Active Products"
          value={metrics?.totalProducts || 0}
          icon={Package}
          color="#153222"
          bg="#f3ede2"
        />
        <AdminStatCard
          title="Low Stock Items"
          value={metrics?.lowStockProducts || 0}
          icon={AlertTriangle}
          color="#dd5226"
          bg="#fee2e2"
          subtitle="Stock <= 5 units"
        />
      </div>

      {/* Revenue Trend Chart Widget */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '1.75rem',
          border: '1px solid #eae5dc',
          boxShadow: '0 2px 12px rgba(21, 50, 34, 0.04)',
          marginBottom: '2.25rem',
        }}
        className="admin-card"
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ margin: 0, color: '#153222', fontSize: '1.2rem', fontFamily: 'var(--font-heading)', fontWeight: 700 }}>
              Sales & Revenue Analytics
            </h3>
            <span style={{ fontSize: '0.84rem', color: '#65776d' }}>Performance trend over selected period</span>
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', backgroundColor: '#faf7f2', padding: '0.3rem', borderRadius: '10px', border: '1px solid #eae5dc' }}>
            {['7d', '30d', '90d', '1y'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                style={{
                  padding: '0.35rem 0.85rem',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: period === p ? '#153222' : 'transparent',
                  color: period === p ? '#ffffff' : '#65776d',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <AdminChart data={trendData} height={230} title="" />
      </div>

      {/* Recent Orders & Low Stock Tables Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.75rem' }}>
        {/* Recent Orders */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '1.75rem',
            border: '1px solid #eae5dc',
            boxShadow: '0 2px 12px rgba(21, 50, 34, 0.04)',
          }}
          className="admin-card"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ margin: 0, color: '#153222', fontSize: '1.2rem', fontFamily: 'var(--font-heading)', fontWeight: 700 }}>
              Latest Store Orders
            </h3>
            <Link
              to="/admin/orders"
              style={{
                color: '#153222',
                textDecoration: 'none',
                fontSize: '0.88rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                padding: '0.3rem 0.6rem',
                borderRadius: '8px',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f4f9f6')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              View All <ArrowRight size={15} />
            </Link>
          </div>

          {!metrics?.recentOrders || metrics.recentOrders.length === 0 ? (
            <p style={{ color: '#65776d', fontSize: '0.9rem', padding: '1.5rem 0' }}>No recent orders placed yet.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1.5px solid #eae5dc', backgroundColor: '#faf7f2', textAlign: 'left', color: '#153222' }}>
                    <th style={{ padding: '0.75rem 0.85rem', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Order No</th>
                    <th style={{ padding: '0.75rem 0.85rem', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Customer</th>
                    <th style={{ padding: '0.75rem 0.85rem', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Amount</th>
                    <th style={{ padding: '0.75rem 0.85rem', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.recentOrders.map((ord, idx) => (
                    <tr
                      key={ord._id}
                      style={{
                        borderBottom: idx === metrics.recentOrders.length - 1 ? 'none' : '1px solid #f0ece3',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fbf9f5')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '0.75rem 0.85rem', fontWeight: 700, color: '#153222' }}>
                        <Link to={`/admin/orders/${ord.orderNumber}`} style={{ color: '#153222', textDecoration: 'none' }}>
                          {ord.orderNumber}
                        </Link>
                      </td>
                      <td style={{ padding: '0.75rem 0.85rem', color: '#2a3b30' }}>
                        {ord.shippingAddress?.fullName || 'Customer'}
                      </td>
                      <td style={{ padding: '0.75rem 0.85rem', fontWeight: 700, color: '#153222' }}>
                        {siteConfig.currency}{(ord.grandTotal || 0).toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '0.75rem 0.85rem' }}>
                        <AdminStatusBadge status={ord.orderStatus} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Low Stock Widget */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '1.75rem',
            border: '1px solid #eae5dc',
            boxShadow: '0 2px 12px rgba(21, 50, 34, 0.04)',
          }}
          className="admin-card"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ margin: 0, color: '#153222', fontSize: '1.2rem', fontFamily: 'var(--font-heading)', fontWeight: 700 }}>
              Low Stock Alerts
            </h3>
            <Link
              to="/admin/inventory"
              style={{
                color: '#153222',
                textDecoration: 'none',
                fontSize: '0.88rem',
                fontWeight: 600,
                padding: '0.3rem 0.6rem',
                borderRadius: '8px',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f4f9f6')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              Manage
            </Link>
          </div>

          {!metrics?.lowStockAlerts || metrics.lowStockAlerts.length === 0 ? (
            <div style={{ padding: '1.5rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', textAlign: 'center' }}>
              <span style={{ color: '#15803d', fontSize: '0.9rem', fontWeight: 600 }}>All product inventory levels are healthy!</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {metrics.lowStockAlerts.map((prod) => (
                <div
                  key={prod._id}
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: '12px',
                    backgroundColor: '#fff7ed',
                    border: '1px solid #ffedd5',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '0.88rem', color: '#9a3412', display: 'block' }}>{prod.name}</strong>
                    <span style={{ fontSize: '0.76rem', color: '#c2410c' }}>SKU: {prod.sku || 'N/A'}</span>
                  </div>
                  <span
                    style={{
                      backgroundColor: '#dd5226',
                      color: '#ffffff',
                      padding: '0.22rem 0.65rem',
                      borderRadius: '99px',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                    }}
                  >
                    {prod.stockQuantity} left
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
