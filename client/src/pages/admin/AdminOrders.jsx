import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import adminService from '../../services/adminService';
import AdminTable from '../../components/admin/AdminTable';
import AdminPagination from '../../components/admin/AdminPagination';
import AdminStatusBadge from '../../components/admin/AdminStatusBadge';
import { siteConfig } from '../../config/siteConfig';
import { Search, Eye } from 'lucide-react';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [orderStatus, setOrderStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchOrders = async (p = 1, s = search, os = orderStatus, ps = paymentStatus) => {
    try {
      setLoading(true);
      const res = await adminService.getAdminOrders({
        page: p,
        limit: 15,
        search: s,
        orderStatus: os,
        paymentStatus: ps,
      });
      setOrders(res.data || []);
      if (res.pagination) {
        setTotal(res.pagination.total);
        setTotalPages(res.pagination.pages);
      }
    } catch (err) {
      console.error('Failed to fetch admin orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(page, search, orderStatus, paymentStatus);
  }, [page, orderStatus, paymentStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchOrders(1, search, orderStatus, paymentStatus);
  };

  const columns = [
    {
      header: 'Order No',
      render: (row) => (
        <strong style={{ color: '#153222', fontWeight: 700 }}>
          <Link to={`/admin/orders/${row.orderNumber}`} style={{ color: '#153222', textDecoration: 'none' }}>
            {row.orderNumber}
          </Link>
        </strong>
      ),
    },
    {
      header: 'Customer',
      render: (row) => (
        <div>
          <strong style={{ color: '#153222', fontSize: '0.88rem', display: 'block' }}>
            {row.shippingAddress?.fullName || 'N/A'}
          </strong>
          <span style={{ fontSize: '0.76rem', color: '#8e9e94' }}>{row.shippingAddress?.phone || ''}</span>
        </div>
      ),
    },
    {
      header: 'Items Count',
      render: (row) => `${row.items?.length || 0} items`,
    },
    {
      header: 'Grand Total',
      render: (row) => (
        <span style={{ fontWeight: 800, color: '#153222' }}>
          {siteConfig.currency}{(row.grandTotal || 0).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      header: 'Payment',
      render: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <span style={{ fontSize: '0.8rem', color: '#647369', fontWeight: 600 }}>{row.paymentMethod}</span>
          <AdminStatusBadge status={row.paymentStatus} />
        </div>
      ),
    },
    {
      header: 'Order Status',
      render: (row) => <AdminStatusBadge status={row.orderStatus} />,
    },
    {
      header: 'Date',
      render: (row) => (
        <span style={{ color: '#647369', fontSize: '0.82rem' }}>
          {new Date(row.createdAt).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      header: 'Action',
      render: (row) => (
        <Link
          to={`/admin/orders/${row.orderNumber}`}
          title="View Full Order Details"
          style={{
            padding: '0.45rem 0.85rem',
            borderRadius: '8px',
            border: '1.5px solid #ded7cb',
            color: '#153222',
            backgroundColor: '#ffffff',
            textDecoration: 'none',
            fontSize: '0.84rem',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f4f9f6';
            e.currentTarget.style.borderColor = '#2d6a4f';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#ffffff';
            e.currentTarget.style.borderColor = '#ded7cb';
          }}
        >
          <Eye size={15} /> View
        </Link>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.1rem', color: '#153222', margin: 0, fontFamily: 'var(--font-heading)', fontWeight: 700 }}>
          Order Fulfillment Management
        </h1>
        <p style={{ color: '#65776d', margin: '0.35rem 0 0', fontSize: '0.95rem' }}>
          Review incoming orders, process shipments, and track customer fulfillment statuses
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div
        style={{
          backgroundColor: '#ffffff',
          padding: '1.25rem',
          borderRadius: '16px',
          border: '1px solid #eae5dc',
          boxShadow: '0 2px 10px rgba(21, 50, 34, 0.03)',
          marginBottom: '1.75rem',
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
        className="admin-card"
      >
        <form onSubmit={handleSearchSubmit} style={{ flex: 1, display: 'flex', gap: '0.65rem', minWidth: '280px' }}>
          <input
            type="text"
            placeholder="Search by order no, customer name, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              padding: '0.6rem 1rem',
              borderRadius: '10px',
              border: '1.5px solid #ded7cb',
              fontSize: '0.92rem',
              outline: 'none',
              backgroundColor: '#fff',
            }}
          />
          <button
            type="submit"
            style={{
              padding: '0.6rem 1.25rem',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: '#153222',
              color: '#ffffff',
              cursor: 'pointer',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.9rem',
              transition: 'background-color 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#2d6a4f')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#153222')}
          >
            <Search size={16} /> Search
          </button>
        </form>

        <select
          value={orderStatus}
          onChange={(e) => setOrderStatus(e.target.value)}
          style={{
            padding: '0.6rem 1rem',
            borderRadius: '10px',
            border: '1.5px solid #ded7cb',
            fontSize: '0.92rem',
            backgroundColor: '#fff',
            outline: 'none',
            color: '#153222',
            fontWeight: 500,
          }}
        >
          <option value="">All Order Statuses</option>
          <option value="PAYMENT_PENDING">Payment Pending</option>
          <option value="PLACED">Placed (COD)</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="PROCESSING">Processing</option>
          <option value="SHIPPED">Shipped</option>
          <option value="DELIVERED">Delivered</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        <select
          value={paymentStatus}
          onChange={(e) => setPaymentStatus(e.target.value)}
          style={{
            padding: '0.6rem 1rem',
            borderRadius: '10px',
            border: '1.5px solid #ded7cb',
            fontSize: '0.92rem',
            backgroundColor: '#fff',
            outline: 'none',
            color: '#153222',
            fontWeight: 500,
          }}
        >
          <option value="">All Payment Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="PAID">Paid</option>
          <option value="FAILED">Failed</option>
          <option value="REFUNDED">Refunded</option>
        </select>
      </div>

      <AdminTable columns={columns} data={orders} loading={loading} />
      <AdminPagination page={page} totalPages={totalPages} total={total} onPageChange={(p) => setPage(p)} />
    </div>
  );
};

export default AdminOrders;
