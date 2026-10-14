import React, { useEffect, useState } from 'react';
import adminService from '../../services/adminService';
import AdminTable from '../../components/admin/AdminTable';
import AdminStatusBadge from '../../components/admin/AdminStatusBadge';
import { Plus, Edit, Trash2, X, Save, Upload } from 'lucide-react';

const AdminBanners = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);

  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    imageUrl: '',
    linkUrl: '/shop',
    position: 0,
    isActive: true,
  });

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const res = await adminService.getAdminBanners();
      setBanners(res.data || []);
    } catch (err) {
      console.error('Failed to fetch banners', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleOpenCreate = () => {
    setEditingBanner(null);
    setForm({ title: '', subtitle: '', imageUrl: '', linkUrl: '/shop', position: 0, isActive: true });
    setShowModal(true);
  };

  const handleOpenEdit = (b) => {
    setEditingBanner(b);
    setForm({
      title: b.title || '',
      subtitle: b.subtitle || '',
      imageUrl: b.imageUrl || '',
      linkUrl: b.linkUrl || '/shop',
      position: b.position || 0,
      isActive: b.isActive !== undefined ? b.isActive : true,
    });
    setShowModal(true);
  };

  const compressImageFile = (file, maxWidth = 1920, quality = 0.85) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = document.createElement('img');
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          if (width > maxWidth || height > maxWidth) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxWidth) / height);
              height = maxWidth;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => resolve(event.target.result);
        img.src = event.target.result;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  const handleBannerFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressImageFile(file);
    if (compressed) {
      setForm((prev) => ({ ...prev, imageUrl: compressed }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingBanner) {
        await adminService.updateAdminBanner(editingBanner._id, form);
      } else {
        await adminService.createAdminBanner(form);
      }
      setShowModal(false);
      fetchBanners();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save banner');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this promotional banner?')) return;
    try {
      await adminService.deleteAdminBanner(id);
      fetchBanners();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete banner');
    }
  };

  const columns = [
    {
      header: 'Banner',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img src={row.imageUrl} alt={row.title} style={{ width: '80px', height: '40px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e2e8e4' }} />
          <div>
            <strong style={{ color: '#1b4332', fontSize: '0.9rem', display: 'block' }}>{row.title}</strong>
            <span style={{ fontSize: '0.75rem', color: '#8e9e94' }}>{row.subtitle}</span>
          </div>
        </div>
      ),
    },
    { header: 'Target Link', accessor: 'linkUrl' },
    { header: 'Order Position', accessor: 'position' },
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
          <h1 style={{ fontSize: '1.8rem', color: '#1b4332', margin: 0 }}>Banner & Hero Management</h1>
          <p style={{ color: '#5c6e63', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>Control homepage hero sliders & promotional banners</p>
        </div>
        <button onClick={handleOpenCreate} style={{ backgroundColor: '#1b4332', color: '#fff', padding: '0.65rem 1.25rem', borderRadius: '10px', border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={18} /> Add Banner
        </button>
      </div>

      <AdminTable columns={columns} data={banners} loading={loading} emptyMessage="No promotional banners configured." />

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '1.75rem', width: '90%', maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, color: '#1b4332' }}>{editingBanner ? 'Edit Banner' : 'Create New Banner'}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1b4332', marginBottom: '0.3rem' }}>Banner Title *</label>
                <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. 100% Organic Ayurvedic Teas" style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #c8d6ce' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1b4332', marginBottom: '0.3rem' }}>Subtitle</label>
                <input type="text" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} placeholder="e.g. Up to 25% off on inaugural offer" style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #c8d6ce' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1b4332', marginBottom: '0.3rem' }}>Banner Image *</label>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                  {form.imageUrl && (
                    <img
                      src={form.imageUrl}
                      alt="Preview"
                      style={{ width: '60px', height: '40px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #c8d6ce' }}
                      onError={(e) => { e.currentTarget.src = '/images/hero-banner.jpg'; }}
                    />
                  )}
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.85rem', backgroundColor: '#eef5f1', color: '#1b4332', borderRadius: '8px', border: '1px solid #c8d6ce', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
                    <Upload size={14} /> Upload Banner File
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleBannerFileUpload}
                    />
                  </label>
                </div>
                <input type="text" required value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="Image URL (e.g. /images/hero-slide-1.jpg or https://...)" style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #c8d6ce' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1b4332', marginBottom: '0.3rem' }}>Target Link</label>
                  <input type="text" value={form.linkUrl} onChange={(e) => setForm({ ...form, linkUrl: e.target.value })} placeholder="/shop" style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #c8d6ce' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1b4332', marginBottom: '0.3rem' }}>Sort Position</label>
                  <input type="number" min="0" value={form.position} onChange={(e) => setForm({ ...form, position: Number(e.target.value) })} style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #c8d6ce' }} />
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: '#1b4332', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} style={{ accentColor: '#1b4332' }} />
                Active Banner
              </label>

              <button type="submit" style={{ backgroundColor: '#1b4332', color: '#fff', padding: '0.75rem', borderRadius: '8px', border: 'none', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                <Save size={18} /> Save Banner
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBanners;
