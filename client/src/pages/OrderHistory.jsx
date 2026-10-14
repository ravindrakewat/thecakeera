import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import orderService from '../services/orderService';
import { siteConfig } from '../config/siteConfig';
import Breadcrumbs from '../components/layout/Breadcrumbs';
import EmptyState from '../components/common/EmptyState';
import { ChevronRight, XOctagon, Eye, FileText } from 'lucide-react';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingOrderNo, setCancellingOrderNo] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchOrders = async (pageNum = 1) => {
    try {
      setLoading(true);
      const res = await orderService.getUserOrders(pageNum, 10);
      const data = res.data?.data || res.data || res;
      setOrders(data.orders || data || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err) {
      console.error('Failed to fetch user orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(page);
  }, [page]);

  const handleCancelOrder = async (orderNumber) => {
    if (!window.confirm(`Are you sure you want to cancel Order #${orderNumber}?`)) {
      return;
    }

    try {
      setCancellingOrderNo(orderNumber);
      await orderService.cancelOrder(orderNumber, 'Customer requested cancellation from history');
      await fetchOrders(page);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel order.');
    } finally {
      setCancellingOrderNo('');
    }
  };

  const handleDownloadInvoice = async (orderNumber) => {
    try {
      const blob = await orderService.downloadInvoice(orderNumber);
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice-${orderNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Invoice is not yet available or failed to generate.');
    }
  };

  if (loading && orders.length === 0) {
    return (
      <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
        <p style={{ color: '#5c6e63' }}>Loading your order history...</p>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="container" style={{ paddingBottom: '4rem' }}>
        <Breadcrumbs items={[{ label: 'My Orders' }]} />
        <EmptyState
          title="No Orders Found"
          message="You haven't placed any orders yet. Explore our fresh organic herbal catalog!"
          actionText="Start Shopping"
          actionLink="/shop"
        />
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingBottom: '5rem' }}>
      <Breadcrumbs items={[{ label: 'My Orders' }]} />

      <h1 style={{ fontSize: '2rem', color: '#1b4332', marginBottom: '1.5rem' }}>
        My Order History
      </h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {orders.map((order) => {
          const isCancellable = ['PAYMENT_PENDING', 'PLACED', 'CONFIRMED'].includes(order.orderStatus);

          return (
            <div
              key={order._id}
              className="glass-card"
              style={{ padding: '1.5rem', borderRadius: '16px', backgroundColor: '#ffffff' }}
            >
              <div
                style={{
                  display: 'flex',
                  justify: 'space-between',
                  alignItems: 'center',
                  borderBottom: '1px solid #e2e8e4',
                  paddingBottom: '0.75rem',
                  marginBottom: '1rem',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.8rem', color: '#8e9e94' }}>Order No:</span>
                  <strong style={{ fontSize: '0.95rem', color: '#1b4332', marginLeft: '0.3rem' }}>
                    {order.orderNumber}
                  </strong>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.85rem', color: '#5c6e63' }}>
                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                  <span
                    style={{
                      backgroundColor:
                        order.orderStatus === 'CANCELLED'
                          ? '#fde8e8'
                          : order.orderStatus === 'CONFIRMED' || order.orderStatus === 'DELIVERED'
                          ? '#d8f3dc'
                          : '#fff3cd',
                      color:
                        order.orderStatus === 'CANCELLED'
                          ? '#9b1c1c'
                          : order.orderStatus === 'CONFIRMED' || order.orderStatus === 'DELIVERED'
                          ? '#1b4332'
                          : '#856404',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '99px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                    }}
                  >
                    {order.orderStatus}
                  </span>
                </div>
              </div>

              {/* Order Items Snapshot */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                {order.items &&
                  order.items.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span style={{ color: '#2d3748' }}>
                        {item.name} × {item.quantity}
                      </span>
                      <strong style={{ color: '#1b4332' }}>
                        {siteConfig.currency}{item.subtotal.toLocaleString('en-IN')}
                      </strong>
                    </div>
                  ))}
              </div>

              <div
                style={{
                  display: 'flex',
                  justify: 'space-between',
                  alignItems: 'center',
                  borderTop: '1px solid #e2e8e4',
                  paddingTop: '0.75rem',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.85rem', color: '#5c6e63' }}>Payment Method: <strong>{order.paymentMethod}</strong> ({order.paymentStatus})</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1b4332', marginTop: '0.1rem' }}>
                    Grand Total: {siteConfig.currency}{order.grandTotal.toLocaleString('en-IN')}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  {isCancellable && (
                    <button
                      onClick={() => handleCancelOrder(order.orderNumber)}
                      disabled={cancellingOrderNo === order.orderNumber}
                      style={{
                        background: 'none',
                        border: '1px solid #e63946',
                        color: '#e63946',
                        padding: '0.4rem 0.85rem',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                      }}
                    >
                      <XOctagon size={16} />
                      {cancellingOrderNo === order.orderNumber ? 'Cancelling...' : 'Cancel Order'}
                    </button>
                  )}
                  {['CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'DELIVERED'].includes(order.orderStatus) && (
                    <button
                      onClick={() => handleDownloadInvoice(order.orderNumber)}
                      style={{
                        background: '#e8f5e9',
                        border: '1px solid #52b788',
                        color: '#1b4332',
                        padding: '0.4rem 0.85rem',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                      }}
                      title="Download PDF Tax Invoice"
                    >
                      <FileText size={15} /> Invoice
                    </button>
                  )}
                  <Link
                    to={`/orders/${order.orderNumber}`}
                    className="btn btn-primary"
                    style={{
                      padding: '0.4rem 0.85rem',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                    }}
                  >
                    <Eye size={16} /> View Details & Tracking
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem' }}>
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #c8d6ce', cursor: 'pointer' }}
          >
            Previous
          </button>
          <span style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', color: '#1b4332' }}>
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #c8d6ce', cursor: 'pointer' }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
