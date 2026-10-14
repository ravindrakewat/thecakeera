import React, { useEffect, useState } from 'react';
import adminService from '../../services/adminService';
import AdminTable from '../../components/admin/AdminTable';
import AdminPagination from '../../components/admin/AdminPagination';
import AdminStatusBadge from '../../components/admin/AdminStatusBadge';
import { Edit3, Search, X, Save } from 'lucide-react';

const AdminInventory = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Quick Adjustment Modal
  const [selectedItem, setSelectedItem] = useState(null);
  const [newStock, setNewStock] = useState(0);
  const [newThreshold, setNewThreshold] = useState(5);
  const [saving, setSaving] = useState(false);

  const fetchInventory = async (p = 1, s = search, st = status) => {
    try {
      setLoading(true);
      const res = await adminService.getAdminInventory({ page: p, limit: 15, search: s, status: st });
      setInventory(res.data || []);
      if (res.pagination) {
        setTotal(res.pagination.total);
        setTotalPages(res.pagination.pages);
      }
    } catch (err) {
      console.error('Failed to fetch inventory', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory(page, search, status);
  }, [page, status]);

  const handleOpenEdit = (item) => {
    setSelectedItem(item);
    setNewStock(item.stockQuantity);
    setNewThreshold(item.lowStockThreshold || 5);
  };

  const handleSaveStock = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;

    try {
      setSaving(true);
      await adminService.updateAdminInventory(selectedItem._id, {
        stockQuantity: Number(newStock),
        lowStockThreshold: Number(newThreshold),
      });
      setSelectedItem(null);
      fetchInventory(page, search, status);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update stock');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      header: 'Product Name',
      render: (row) => (
        <div>
          <strong style={{ color: '#1b4332', fontSize: '0.9rem' }}>{row.name}</strong>
          <span style={{ fontSize: '0.75rem', color: '#8e9e94', display: 'block' }}>SKU: {row.sku || 'N/A'}</span>
        </div>
      ),
    },
    {
      header: 'Current Stock',
      render: (row) => (
        <span style={{ fontWeight: 800, fontSize: '1rem', color: row.stockQuantity <= 5 ? '#e53e3e' : '#1b4332' }}>
          {row.stockQuantity} units
        </span>
      ),
    },
    {
      header: 'Low Threshold',
      render: (row) => `${row.lowStockThreshold || 5} units`,
    },
    {
      header: 'Stock Status',
      render: (row) => <AdminStatusBadge status={row.stockStatus} />,
    },
    {
      header: 'Actions',
      render: (row) => (
        <button
          onClick={() => handleOpenEdit(row)}
          style={{ padding: '0.35rem 0.75rem', borderRadius: '6px', border: '1px solid #1b4332', backgroundColor: '#f4f9f6', color: '#1b4332', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
        >
          <Edit3 size={14} /> Adjust Stock
        </button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.8rem', color: '#1b4332', margin: 0 }}>Inventory Control Panel</h1>
        <p style={{ color: '#5c6e63', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
          Monitor stock availability, low-stock alerts, and raw inventory counts
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div style={{ backgroundColor: '#fff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8e4', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, display: 'flex', gap: '0.5rem', minWidth: '260px' }}>
          <input
            type="text"
            placeholder="Search product name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, padding: '0.5rem 0.85rem', borderRadius: '8px', border: '1px solid #c8d6ce', fontSize: '0.9rem' }}
          />
          <button onClick={() => fetchInventory(1, search, status)} style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', backgroundColor: '#1b4332', color: '#fff', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Search size={16} /> Search
          </button>
        </div>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          style={{ padding: '0.5rem 0.85rem', borderRadius: '8px', border: '1px solid #c8d6ce', fontSize: '0.9rem', backgroundColor: '#fff' }}
        >
          <option value="">All Stock Status</option>
          <option value="IN_STOCK">In Stock</option>
          <option value="LOW_STOCK">Low Stock Alert</option>
          <option value="OUT_OF_STOCK">Out of Stock</option>
        </select>
      </div>

      <AdminTable columns={columns} data={inventory} loading={loading} />
      <AdminPagination page={page} totalPages={totalPages} total={total} onPageChange={(p) => setPage(p)} />

      {/* Modal for Stock Adjustment */}
      {selectedItem && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '1.75rem', width: '90%', maxWidth: '450px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: '#1b4332' }}>Adjust Stock Level</h3>
              <button onClick={() => setSelectedItem(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <p style={{ color: '#5c6e63', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
              Product: <strong style={{ color: '#1b4332' }}>{selectedItem.name}</strong> (SKU: {selectedItem.sku || 'N/A'})
            </p>

            <form onSubmit={handleSaveStock} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1b4332', marginBottom: '0.3rem' }}>Stock Quantity (Units) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={newStock}
                  onChange={(e) => setNewStock(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #c8d6ce', fontSize: '1rem', fontWeight: 700 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1b4332', marginBottom: '0.3rem' }}>Low Stock Alert Threshold</label>
                <input
                  type="number"
                  min="0"
                  value={newThreshold}
                  onChange={(e) => setNewThreshold(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #c8d6ce' }}
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                style={{ backgroundColor: '#1b4332', color: '#fff', padding: '0.75rem', borderRadius: '8px', border: 'none', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem' }}
              >
                <Save size={18} /> {saving ? 'Saving...' : 'Update Stock'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInventory;
