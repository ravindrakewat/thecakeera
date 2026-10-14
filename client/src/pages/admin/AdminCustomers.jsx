import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import adminService from '../../services/adminService';
import AdminTable from '../../components/admin/AdminTable';
import AdminPagination from '../../components/admin/AdminPagination';
import AdminStatusBadge from '../../components/admin/AdminStatusBadge';
import { Search, Eye, UserX, UserCheck } from 'lucide-react';

const AdminCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchCustomers = async (p = 1, s = search) => {
    try {
      setLoading(true);
      const res = await adminService.getAdminCustomers({ page: p, limit: 15, search: s });
      setCustomers(res.data || []);
      if (res.pagination) {
        setTotal(res.pagination.total);
        setTotalPages(res.pagination.pages);
      }
    } catch (err) {
      console.error('Failed to fetch customers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(page, search);
  }, [page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchCustomers(1, search);
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const actionText = currentStatus ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${actionText} this user account?`)) return;

    try {
      await adminService.toggleCustomerStatus(id, !currentStatus);
      fetchCustomers(page, search);
    } catch (err) {
      alert(err.response?.data?.message || `Failed to ${actionText} customer account`);
    }
  };

  const columns = [
    {
      header: 'Customer Name',
      render: (row) => (
        <div>
          <strong style={{ color: '#1b4332', fontSize: '0.9rem', display: 'block' }}>
            {row.firstName || ''} {row.lastName || ''}
          </strong>
          <span style={{ fontSize: '0.75rem', color: '#8e9e94' }}>Role: {row.role || 'customer'}</span>
        </div>
      ),
    },
    { header: 'Email', accessor: 'email' },
    { header: 'Phone', render: (row) => row.phone || 'N/A' },
    {
      header: 'Account Status',
      render: (row) => <AdminStatusBadge status={row.isActive !== false} />,
    },
    {
      header: 'Joined Date',
      render: (row) => new Date(row.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    },
    {
      header: 'Actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link
            to={`/admin/customers/${row._id}`}
            title="View Profile & Orders"
            style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', border: '1px solid #1b4332', color: '#1b4332', textDecoration: 'none', fontWeight: 600, fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
          >
            <Eye size={14} /> Profile
          </Link>
          <button
            onClick={() => handleToggleStatus(row._id, row.isActive !== false)}
            title={row.isActive !== false ? 'Deactivate Account' : 'Activate Account'}
            style={{
              padding: '0.35rem 0.65rem',
              borderRadius: '6px',
              border: row.isActive !== false ? '1px solid #e63946' : '1px solid #52b788',
              color: row.isActive !== false ? '#e63946' : '#1b4332',
              backgroundColor: row.isActive !== false ? '#fff' : '#d8f3dc',
              fontWeight: 600,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
            }}
          >
            {row.isActive !== false ? <UserX size={14} /> : <UserCheck size={14} />}
            {row.isActive !== false ? 'Disable' : 'Enable'}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.8rem', color: '#1b4332', margin: 0 }}>Customer Account Management</h1>
        <p style={{ color: '#5c6e63', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
          View registered customer accounts, order activity, and manage account access
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div style={{ backgroundColor: '#fff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8e4', marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ flex: 1, display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            placeholder="Search by customer name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, padding: '0.5rem 0.85rem', borderRadius: '8px', border: '1px solid #c8d6ce', fontSize: '0.9rem' }}
          />
          <button type="submit" style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', backgroundColor: '#1b4332', color: '#fff', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Search size={16} /> Search
          </button>
        </form>
      </div>

      <AdminTable columns={columns} data={customers} loading={loading} />
      <AdminPagination page={page} totalPages={totalPages} total={total} onPageChange={(p) => setPage(p)} />
    </div>
  );
};

export default AdminCustomers;
