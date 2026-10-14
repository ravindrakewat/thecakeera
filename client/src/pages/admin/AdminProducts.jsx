import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import adminService from '../../services/adminService';
import productService from '../../services/productService';
import AdminTable from '../../components/admin/AdminTable';
import AdminPagination from '../../components/admin/AdminPagination';
import AdminStatusBadge from '../../components/admin/AdminStatusBadge';
import AdminConfirmDialog from '../../components/admin/AdminConfirmDialog';
import { siteConfig } from '../../config/siteConfig';
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Deactivate dialog
  const [deactivateId, setDeactivateId] = useState(null);

  const fetchProducts = async (p = 1, s = search, st = status) => {
    try {
      setLoading(true);
      const res = await adminService.getAdminProducts({ page: p, limit: 15, search: s, status: st });
      setProducts(res.data || []);
      if (res.pagination) {
        setTotal(res.pagination.total);
        setTotalPages(res.pagination.pages);
      }
    } catch (err) {
      console.error('Failed to fetch admin products', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(page, search, status);
  }, [page, status]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchProducts(1, search, status);
  };

  const handleDeactivate = async () => {
    if (!deactivateId) return;
    try {
      await productService.deleteProduct(deactivateId);
      setDeactivateId(null);
      fetchProducts(page, search, status);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to deactivate product');
    }
  };

  const columns = [
    {
      header: 'Product',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <img
            src={row.thumbnail || row.images?.[0]?.url || 'https://via.placeholder.com/44'}
            alt={row.name}
            style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '10px', border: '1px solid #eae5dc' }}
          />
          <div>
            <strong style={{ color: '#153222', fontSize: '0.92rem', display: 'block' }}>{row.name}</strong>
            <span style={{ fontSize: '0.76rem', color: '#8e9e94' }}>{row.slug}</span>
          </div>
        </div>
      ),
    },
    { header: 'SKU', accessor: 'sku' },
    {
      header: 'Category',
      render: (row) => row.category?.name || 'Uncategorized',
    },
    {
      header: 'Selling Price',
      render: (row) => (
        <span style={{ fontWeight: 700, color: '#153222' }}>
          {siteConfig.currency}{(row.sellingPrice || 0).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      header: 'Stock',
      render: (row) => (
        <span style={{ fontWeight: 700, color: row.stockQuantity <= 5 ? '#dd5226' : '#153222' }}>
          {row.stockQuantity !== undefined ? row.stockQuantity : 'N/A'}
        </span>
      ),
    },
    {
      header: 'Status',
      render: (row) => <AdminStatusBadge status={row.isActive} />,
    },
    {
      header: 'Actions',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <Link
            to={`/products/${row.slug}`}
            target="_blank"
            title="View Live Storefront Page"
            style={{
              padding: '0.42rem',
              borderRadius: '8px',
              border: '1px solid #eae5dc',
              color: '#153222',
              backgroundColor: '#faf7f2',
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.15s ease',
            }}
          >
            <Eye size={15} />
          </Link>
          <Link
            to={`/admin/products/${row._id}/edit`}
            title="Edit Product Details"
            style={{
              padding: '0.42rem',
              borderRadius: '8px',
              border: '1px solid #c8e6c9',
              color: '#2d6a4f',
              backgroundColor: '#e8f5e9',
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.15s ease',
            }}
          >
            <Edit size={15} />
          </Link>
          {row.isActive && (
            <button
              onClick={() => setDeactivateId(row._id)}
              title="Deactivate Product"
              style={{
                padding: '0.42rem',
                borderRadius: '8px',
                border: '1px solid #fecaca',
                color: '#dd5226',
                backgroundColor: '#fff5f2',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                transition: 'all 0.15s ease',
              }}
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.1rem', color: '#153222', margin: 0, fontFamily: 'var(--font-heading)', fontWeight: 700 }}>
            Product Catalog Management
          </h1>
          <p style={{ color: '#65776d', margin: '0.35rem 0 0', fontSize: '0.95rem' }}>
            Manage herbal products, pricing, ingredients, and inventory specifications
          </p>
        </div>
        <Link
          to="/admin/products/new"
          style={{
            backgroundColor: '#153222',
            color: '#ffffff',
            padding: '0.7rem 1.35rem',
            borderRadius: '12px',
            textDecoration: 'none',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.92rem',
            boxShadow: '0 4px 14px rgba(21, 50, 34, 0.15)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#2d6a4f')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#153222')}
        >
          <Plus size={18} /> Add New Product
        </Link>
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
            placeholder="Search by product name, SKU, or slug..."
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
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontWeight: 700,
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
          value={status}
          onChange={(e) => setStatus(e.target.value)}
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
          <option value="">All Status</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>
      </div>

      <AdminTable columns={columns} data={products} loading={loading} emptyMessage="No products match your filter criteria." />
      <AdminPagination page={page} totalPages={totalPages} total={total} onPageChange={(p) => setPage(p)} />

      <AdminConfirmDialog
        isOpen={!!deactivateId}
        title="Deactivate Product"
        message="Are you sure you want to deactivate this product? It will no longer appear in the customer storefront catalog."
        onConfirm={handleDeactivate}
        onCancel={() => setDeactivateId(null)}
        confirmText="Deactivate"
        danger={true}
      />
    </div>
  );
};

export default AdminProducts;
