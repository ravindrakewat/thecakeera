import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import orderService from '../services/orderService';
import Breadcrumbs from '../components/layout/Breadcrumbs';
import { CheckCircle, Package, ArrowRight, MapPin, CreditCard } from 'lucide-react';
import { siteConfig } from '../config/siteConfig';

const OrderSuccess = () => {
  const { orderNumber } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await orderService.getOrderByNumber(orderNumber);
        setOrder(res.data);
      } catch (err) {
        console.error('Failed to fetch order details', err);
      } finally {
        setLoading(false);
      }
    };
    if (orderNumber) {
      fetchOrder();
    }
  }, [orderNumber]);

  if (loading) {
    return (
      <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
        <p style={{ color: '#5c6e63' }}>Loading your order confirmation...</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingBottom: '5rem' }}>
      <Breadcrumbs items={[{ label: 'Order Confirmation' }]} />

      <div className="glass-card" style={{ maxWidth: '750px', margin: '2rem auto 0', padding: '2.5rem', borderRadius: '20px', backgroundColor: '#fff', textAlign: 'center' }}>
        <CheckCircle size={64} color="#52b788" style={{ marginBottom: '1rem' }} />
        <h1 style={{ fontSize: '2rem', color: '#1b4332', marginBottom: '0.5rem' }}>Order Confirmed!</h1>
        <p style={{ color: '#5c6e63', fontSize: '1.05rem', marginBottom: '1.5rem' }}>
          Thank you for choosing Herbal E-Commerce. Your order has been placed successfully.
        </p>

        <div style={{ backgroundColor: '#f4f9f6', padding: '1.25rem', borderRadius: '12px', display: 'inline-block', marginBottom: '2rem' }}>
          <span style={{ fontSize: '0.9rem', color: '#5c6e63' }}>Order Reference Number:</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1b4332', letterSpacing: '1px', marginTop: '0.2rem' }}>
            {order ? order.orderNumber : orderNumber}
          </div>
        </div>

        {order && (
          <div style={{ textAlign: 'left', borderTop: '1px solid #e2e8e4', paddingTop: '1.5rem', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem', color: '#1b4332', marginBottom: '1rem' }}>Order Details</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div>
                <strong style={{ color: '#1b4332', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.4rem' }}>
                  <MapPin size={16} color="#52b788" /> Shipping Address
                </strong>
                <p style={{ fontSize: '0.85rem', color: '#5c6e63', margin: 0, lineHeight: 1.4 }}>
                  {order.shippingAddress.fullName}<br />
                  {order.shippingAddress.addressLine1}, {order.shippingAddress.city}<br />
                  {order.shippingAddress.state} - {order.shippingAddress.pincode}<br />
                  Phone: {order.shippingAddress.phone}
                </p>
              </div>

              <div>
                <strong style={{ color: '#1b4332', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.4rem' }}>
                  <CreditCard size={16} color="#52b788" /> Payment Info
                </strong>
                <p style={{ fontSize: '0.85rem', color: '#5c6e63', margin: 0, lineHeight: 1.4 }}>
                  Method: <strong>{order.paymentMethod}</strong><br />
                  Payment Status: <strong style={{ color: order.paymentStatus === 'PAID' ? '#52b788' : '#e67e22' }}>{order.paymentStatus}</strong><br />
                  Order Status: <strong>{order.orderStatus}</strong>
                </p>
              </div>
            </div>

            <h4 style={{ fontSize: '0.95rem', color: '#1b4332', marginBottom: '0.75rem' }}>Purchased Items</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {order.items.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', borderBottom: '1px border-dashed #e2e8e4', paddingBottom: '0.4rem' }}>
                  <span style={{ color: '#2d3748' }}>{item.name} × {item.quantity}</span>
                  <strong style={{ color: '#1b4332' }}>{siteConfig.currency}{item.subtotal.toLocaleString('en-IN')}</strong>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid #e2e8e4', paddingTop: '1rem' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1b4332' }}>Grand Total Paid:</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1b4332' }}>
                {siteConfig.currency}{order.grandTotal.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link to="/orders" className="btn" style={{ border: '1px solid #1b4332', color: '#1b4332', padding: '0.75rem 1.5rem' }}>
            <Package size={18} style={{ marginRight: '0.4rem' }} /> View All Orders
          </Link>
          <Link to="/shop" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
            Continue Shopping <ArrowRight size={18} style={{ marginLeft: '0.4rem' }} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
