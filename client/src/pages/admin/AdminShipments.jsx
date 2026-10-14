import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import adminService from '../../services/adminService';
import AdminStatusBadge from '../../components/admin/AdminStatusBadge';
import AdminPagination from '../../components/admin/AdminPagination';
import { Truck, Search, CheckCircle, Package, ExternalLink, Eye } from 'lucide-react';

const AdminShipments = () => {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  const fetchShipments = async (pageNum = 1) => {
    try {
      setLoading(true);
      const res = await adminService.getAdminShipments({
        page: pageNum,
        limit: 15,
        search,
        status: statusFilter,
      });
      const data = res.data?.data || res.data || res;
      setShipments(data.shipments || []);
      setPagination(data.pagination || { total: 0, pages: 1 });
    } catch (err) {
      console.error('Failed to fetch shipments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments(page);
  }, [page, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchShipments(1);
  };

  const handleQuickDispatch = async (id) => {
    try {
      await adminService.dispatchAdminShipment(id);
      fetchShipments(page);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to dispatch shipment');
    }
  };

  const handleQuickDeliver = async (id) => {
    if (!window.confirm('Confirm delivery for this shipment?')) return;
    try {
      await adminService.deliverAdminShipment(id);
      fetchShipments(page);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record delivery');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: '#1b4332', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Truck size={24} color="#52b788" /> Order Shipments & Fulfillment
          </h1>
          <p style={{ color: '#5c6e63', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
            Manage courier assignments, dispatch queue, and delivery tracking
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ backgroundColor: '#fff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8e4', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', flex: 1, minWidth: '240px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} color="#8e9e94" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search by Order #, Shipment #, or AWB..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '0.55rem 0.75rem 0.55rem 2.2rem', borderRadius: '8px', border: '1px solid #c8d6ce', fontSize: '0.85rem' }}
            />
          </div>
          <button type="submit" style={{ backgroundColor: '#1b4332', color: '#fff', border: 'none', padding: '0.55rem 1rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
            Filter
          </button>
        </form>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: '#5c6e63' }}>Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            style={{ padding: '0.55rem', borderRadius: '8px', border: '1px solid #c8d6ce', backgroundColor: '#fff', fontSize: '0.85rem' }}
          >
            <option value="">All Shipments</option>
            <option value="PACKED">PACKED</option>
            <option value="SHIPPED">SHIPPED</option>
            <option value="DELIVERED">DELIVERED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>
      </div>

      {/* Shipments Table */}
      <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8e4', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8faf9', borderBottom: '1px solid #e2e8e4', color: '#1b4332' }}>
              <th style={{ padding: '0.85rem 1rem' }}>Shipment No.</th>
              <th style={{ padding: '0.85rem 1rem' }}>Order Number</th>
              <th style={{ padding: '0.85rem 1rem' }}>Carrier</th>
              <th style={{ padding: '0.85rem 1rem' }}>AWB Number</th>
              <th style={{ padding: '0.85rem 1rem' }}>Status</th>
              <th style={{ padding: '0.85rem 1rem' }}>Created / Shipped</th>
              <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#8e9e94' }}>
                  Loading shipment queue...
                </td>
              </tr>
            ) : shipments.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#8e9e94' }}>
                  No shipments found matching criteria.
                </td>
              </tr>
            ) : (
              shipments.map((s) => (
                <tr key={s._id} style={{ borderBottom: '1px solid #f0f4f2' }}>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#1b4332' }}>{s.shipmentNumber}</td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <Link to={`/admin/orders/${s.orderNumber}`} style={{ color: '#2d6a4f', textDecoration: 'none', fontWeight: 600 }}>
                      #{s.orderNumber}
                    </Link>
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>{s.carrier || 'Manual Courier'}</td>
                  <td style={{ padding: '0.85rem 1rem' }}>{s.awbNumber || '—'}</td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <AdminStatusBadge status={s.shipmentStatus} />
                  </td>
                  <td style={{ padding: '0.85rem 1rem', color: '#5c6e63' }}>
                    {new Date(s.createdAt).toLocaleDateString('en-IN')}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                      {s.shipmentStatus !== 'SHIPPED' && s.shipmentStatus !== 'DELIVERED' && (
                        <button
                          onClick={() => handleQuickDispatch(s._id)}
                          style={{ backgroundColor: '#e8f5e9', border: '1px solid #52b788', color: '#1b4332', padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                          title="Mark Dispatched"
                        >
                          Dispatch
                        </button>
                      )}
                      {s.shipmentStatus === 'SHIPPED' && (
                        <button
                          onClick={() => handleQuickDeliver(s._id)}
                          style={{ backgroundColor: '#d8f3dc', border: '1px solid #2d6a4f', color: '#1b4332', padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                          title="Record Delivery"
                        >
                          Deliver
                        </button>
                      )}
                      <Link
                        to={`/admin/orders/${s.orderNumber}`}
                        style={{ backgroundColor: '#f0f4f2', border: '1px solid #c8d6ce', color: '#1b4332', padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                      >
                        <Eye size={12} /> View
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '1rem' }}>
        <AdminPagination
          page={page}
          totalPages={pagination.pages}
          onPageChange={(p) => setPage(p)}
        />
      </div>
    </div>
  );
};

export default AdminShipments;
