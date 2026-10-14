import React, { useEffect, useState } from 'react';
import adminService from '../../services/adminService';
import AdminTable from '../../components/admin/AdminTable';
import AdminStatusBadge from '../../components/admin/AdminStatusBadge';
import { Plus, Edit, Trash2, X, Save, Ticket } from 'lucide-react';

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);

  const [form, setForm] = useState({
    code: '',
    discountType: 'percentage',
    discountAmount: 10,
    minPurchaseAmount: 499,
    maxDiscountAmount: 200,
    expiryDate: '',
    usageLimit: 100,
    isActive: true,
  });

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await adminService.getAdminCoupons();
      setCoupons(res.data || []);
    } catch (err) {
      console.error('Failed to fetch coupons', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleOpenCreate = () => {
    setEditingCoupon(null);
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setForm({
      code: '',
      discountType: 'percentage',
      discountAmount: 10,
      minPurchaseAmount: 499,
      maxDiscountAmount: 200,
      expiryDate: nextMonth.toISOString().slice(0, 10),
      usageLimit: 100,
      isActive: true,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (cp) => {
    setEditingCoupon(cp);
    setForm({
      code: cp.code || '',
      discountType: cp.discountType || 'percentage',
      discountAmount: cp.discountAmount || 0,
      minPurchaseAmount: cp.minPurchaseAmount || 0,
      maxDiscountAmount: cp.maxDiscountAmount || 0,
      expiryDate: cp.expiryDate ? new Date(cp.expiryDate).toISOString().slice(0, 10) : '',
      usageLimit: cp.usageLimit || 100,
      isActive: cp.isActive !== undefined ? cp.isActive : true,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCoupon) {
        await adminService.updateAdminCoupon(editingCoupon._id, form);
      } else {
        await adminService.createAdminCoupon(form);
      }
      setShowModal(false);
      fetchCoupons();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save coupon');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this promotional coupon?')) return;
    try {
      await adminService.deleteAdminCoupon(id);
      fetchCoupons();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete coupon');
    }
  };

  const columns = [
    {
      header: 'Coupon Code',
      render: (row) => (
        <span style={{ fontWeight: 800, color: '#1b4332', fontSize: '0.95rem', letterSpacing: '0.5px' }}>
          {row.code}
        </span>
      ),
    },
    {
      header: 'Discount',
      render: (row) => row.discountType === 'percentage' ? `${row.discountAmount}% OFF` : `₹${row.discountAmount} OFF`,
    },
    {
      header: 'Min Purchase',
      render: (row) => `₹${row.minPurchaseAmount || 0}`,
    },
    {
      header: 'Usage Count',
      render: (row) => `${row.usedCount || 0} / ${row.usageLimit || 'Unlimited'}`,
    },
    {
      header: 'Expiry Date',
      render: (row) => new Date(row.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    },
    {
      header: 'Status',
      render: (row) => <AdminStatusBadge status={row.isActive} />,
    },
    {
      header: 'Actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => handleOpenEdit(row)} style={{ padding: '0.35rem', borderRadius: '6px', border: '1px solid #1b4332', color: '#1b4332', background: 'none', cursor: 'pointer' }}>
            <Edit size={16} />
          </button>
          <button onClick={() => handleDelete(row._id)} style={{ padding: '0.35rem', borderRadius: '6px', border: '1px solid #e63946', color: '#e63946', background: 'none', cursor: 'pointer' }}>
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: '#1b4332', margin: 0 }}>Coupon Management</h1>
          <p style={{ color: '#5c6e63', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>Create & manage promotional discount codes</p>
        </div>
        <button onClick={handleOpenCreate} style={{ backgroundColor: '#1b4332', color: '#fff', padding: '0.65rem 1.25rem', borderRadius: '10px', border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={18} /> Create Coupon
        </button>
      </div>

      <AdminTable columns={columns} data={coupons} loading={loading} emptyMessage="No promotional coupons created yet." />

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '1.75rem', width: '90%', maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, color: '#1b4332' }}>{editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1b4332', marginBottom: '0.3rem' }}>Coupon Code *</label>
                <input type="text" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="e.g. HERBAL10" style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #c8d6ce' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1b4332', marginBottom: '0.3rem' }}>Discount Type</label>
                  <select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })} style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #c8d6ce', backgroundColor: '#fff' }}>
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1b4332', marginBottom: '0.3rem' }}>Discount Value *</label>
                  <input type="number" required min="1" value={form.discountAmount} onChange={(e) => setForm({ ...form, discountAmount: Number(e.target.value) })} style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #c8d6ce' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1b4332', marginBottom: '0.3rem' }}>Min Order Value (₹)</label>
                  <input type="number" min="0" value={form.minPurchaseAmount} onChange={(e) => setForm({ ...form, minPurchaseAmount: Number(e.target.value) })} style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #c8d6ce' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1b4332', marginBottom: '0.3rem' }}>Expiry Date *</label>
                  <input type="date" required value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #c8d6ce' }} />
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: '#1b4332', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} style={{ accentColor: '#1b4332' }} />
                Active Coupon
              </label>

              <button type="submit" style={{ backgroundColor: '#1b4332', color: '#fff', padding: '0.75rem', borderRadius: '8px', border: 'none', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                <Save size={18} /> Save Coupon
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCoupons;
