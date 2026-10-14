import React, { useEffect, useState } from 'react';
import adminService from '../../services/adminService';
import AdminTable from '../../components/admin/AdminTable';
import AdminStatusBadge from '../../components/admin/AdminStatusBadge';
import { Star, CheckCircle, XCircle, Trash2 } from 'lucide-react';

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await adminService.getAdminReviews();
      setReviews(res.data || []);
    } catch (err) {
      console.error('Failed to fetch reviews', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    try {
      await adminService.updateReviewStatus(id, status);
      fetchReviews();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update review status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer review?')) return;
    try {
      await adminService.deleteReview(id);
      fetchReviews();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete review');
    }
  };

  const columns = [
    {
      header: 'Product',
      render: (row) => (
        <strong style={{ color: '#1b4332', fontSize: '0.85rem' }}>
          {row.product?.name || 'Deleted Product'}
        </strong>
      ),
    },
    {
      header: 'Customer',
      render: (row) => row.name || row.user?.email || 'Anonymous',
    },
    {
      header: 'Rating',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: '#f59e0b', fontWeight: 700 }}>
          <Star size={14} fill="#f59e0b" /> {row.rating} / 5
        </div>
      ),
    },
    {
      header: 'Comment',
      render: (row) => (
        <p style={{ margin: 0, fontSize: '0.85rem', color: '#2d3748', maxWidth: '300px' }}>
          "{row.comment}"
        </p>
      ),
    },
    {
      header: 'Status',
      render: (row) => <AdminStatusBadge status={row.status || 'Approved'} />,
    },
    {
      header: 'Moderation Actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {row.status !== 'Approved' && (
            <button
              onClick={() => handleUpdateStatus(row._id, 'Approved')}
              title="Approve Review"
              style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', border: 'none', backgroundColor: '#d8f3dc', color: '#1b4332', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
            >
              <CheckCircle size={14} /> Approve
            </button>
          )}
          {row.status !== 'Rejected' && (
            <button
              onClick={() => handleUpdateStatus(row._id, 'Rejected')}
              title="Reject Review"
              style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', border: 'none', backgroundColor: '#fff3cd', color: '#856404', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
            >
              <XCircle size={14} /> Reject
            </button>
          )}
          <button
            onClick={() => handleDelete(row._id)}
            title="Delete Review"
            style={{ padding: '0.35rem', borderRadius: '6px', border: '1px solid #e63946', color: '#e63946', background: 'none', cursor: 'pointer' }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.8rem', color: '#1b4332', margin: 0 }}>Review Moderation Panel</h1>
        <p style={{ color: '#5c6e63', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
          Approve, reject, or moderate customer product reviews
        </p>
      </div>

      <AdminTable columns={columns} data={reviews} loading={loading} emptyMessage="No product reviews found." />
    </div>
  );
};

export default AdminReviews;
