import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import adminService from '../../services/adminService';
import AdminStatusBadge from '../../components/admin/AdminStatusBadge';
import { siteConfig } from '../../config/siteConfig';
import { ArrowLeft, User, Mail, Phone, Calendar, ShoppingBag } from 'lucide-react';

const AdminCustomerDetail = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const res = await adminService.getAdminCustomerDetail(id);
        setData(res.data);
      } catch (err) {
        console.error('Failed to fetch customer detail', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  if (loading) {
    return <div style={{ padding: '2rem', color: '#5c6e63' }}>Loading customer profile...</div>;
  }

  const { customer, orders } = data || {};
  if (!customer) {
    return <div style={{ padding: '2rem', color: '#5c6e63' }}>Customer profile not found.</div>;
  }

  return (
    <div style={{ maxWidth: '900px' }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Link to="/admin/customers" style={{ color: '#5c6e63', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}>
          <ArrowLeft size={18} /> Back to Customers
        </Link>
        <h1 style={{ fontSize: '1.8rem', color: '#1b4332', margin: 0 }}>
          Customer Specification
        </h1>
      </div>

      {/* Customer Profile Card */}
      <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '1.5rem', border: '1px solid #e2e8e4', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ margin: '0 0 0.5rem', color: '#1b4332', fontSize: '1.3rem' }}>
              {customer.firstName} {customer.lastName}
            </h2>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', color: '#5c6e63', fontSize: '0.9rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Mail size={16} color="#52b788" /> {customer.email}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Phone size={16} color="#52b788" /> {customer.phone || 'No phone'}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Calendar size={16} color="#52b788" /> Joined {new Date(customer.createdAt).toLocaleDateString('en-IN')}</span>
            </div>
          </div>
          <AdminStatusBadge status={customer.isActive !== false} />
        </div>
      </div>

      {/* Customer Past Orders */}
      <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '1.5rem', border: '1px solid #e2e8e4' }}>
        <h3 style={{ margin: '0 0 1rem', color: '#1b4332', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShoppingBag size={18} color="#52b788" /> Order History ({orders?.length || 0} orders)
        </h3>

        {!orders || orders.length === 0 ? (
          <p style={{ color: '#5c6e63', fontSize: '0.9rem' }}>This customer has not placed any orders yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {orders.map((ord) => (
              <div key={ord._id} style={{ padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8e4', backgroundColor: '#f9fbfa', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <strong style={{ color: '#1b4332', fontSize: '0.95rem' }}>
                    <Link to={`/admin/orders/${ord.orderNumber}`} style={{ color: '#1b4332', textDecoration: 'none' }}>
                      Order #{ord.orderNumber}
                    </Link>
                  </strong>
                  <span style={{ display: 'block', fontSize: '0.8rem', color: '#8e9e94' }}>
                    {new Date(ord.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} • {ord.items?.length || 0} items
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontWeight: 800, color: '#1b4332', fontSize: '1rem' }}>
                    {siteConfig.currency}{(ord.grandTotal || 0).toLocaleString('en-IN')}
                  </span>
                  <AdminStatusBadge status={ord.orderStatus} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCustomerDetail;
