import React, { useEffect, useState } from 'react';
import adminService from '../../services/adminService';
import AdminStatCard from '../../components/admin/AdminStatCard';
import AdminTable from '../../components/admin/AdminTable';
import AdminStatusBadge from '../../components/admin/AdminStatusBadge';
import { siteConfig } from '../../config/siteConfig';
import { Calendar, BarChart2, DollarSign, Tag, Truck, ShieldAlert } from 'lucide-react';

const AdminReports = () => {
  const [salesReport, setSalesReport] = useState(null);
  const [inventoryReport, setInventoryReport] = useState(null);
  const [loading, setLoading] = useState(true);

  // Date Filters
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const fetchReports = async (fromDate = from, toDate = to) => {
    try {
      setLoading(true);
      const [sRes, iRes] = await Promise.all([
        adminService.getSalesReport(fromDate, toDate),
        adminService.getInventoryReport(),
      ]);
      setSalesReport(sRes.data);
      setInventoryReport(iRes.data);
    } catch (err) {
      console.error('Failed to fetch reports', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchReports(from, to);
  };

  const lowStockColumns = [
    { header: 'Product Name', accessor: 'name' },
    { header: 'SKU', accessor: 'sku' },
    {
      header: 'Current Stock',
      render: (row) => <strong style={{ color: '#e53e3e' }}>{row.stockQuantity} units</strong>,
    },
    {
      header: 'Status',
      render: (row) => <AdminStatusBadge status={row.stockStatus} />,
    },
    {
      header: 'Selling Price',
      render: (row) => `${siteConfig.currency}${row.sellingPrice || 0}`,
    },
  ];

  if (loading) {
    return <div style={{ padding: '2rem', color: '#5c6e63' }}>Generating business reports...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.8rem', color: '#1b4332', margin: 0 }}>Business & Financial Reports</h1>
        <p style={{ color: '#5c6e63', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
          Real-time backend aggregations for sales performance & inventory status
        </p>
      </div>

      {/* Date Filter Bar */}
      <div style={{ backgroundColor: '#fff', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid #e2e8e4', marginBottom: '2rem' }}>
        <form onSubmit={handleFilterSubmit} style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={18} color="#52b788" />
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1b4332' }}>Date Range Filter:</span>
          </div>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            style={{ padding: '0.4rem 0.75rem', borderRadius: '8px', border: '1px solid #c8d6ce', fontSize: '0.85rem' }}
          />
          <span style={{ color: '#5c6e63' }}>to</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            style={{ padding: '0.4rem 0.75rem', borderRadius: '8px', border: '1px solid #c8d6ce', fontSize: '0.85rem' }}
          />
          <button type="submit" style={{ padding: '0.45rem 1rem', borderRadius: '8px', border: 'none', backgroundColor: '#1b4332', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>
            Apply Filter
          </button>
        </form>
      </div>

      {/* Section 1: Financial Sales Breakdown */}
      <h3 style={{ color: '#1b4332', fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <DollarSign size={20} color="#52b788" /> Financial Sales Breakdown
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        <AdminStatCard
          title="Net Revenue" value={`${siteConfig.currency}${(salesReport?.netSales || 0).toLocaleString('en-IN')}`}
          icon={BarChart2}
          color="#1b4332"
          bg="#d8f3dc"
          subtitle="Final received amount"
        />
        <AdminStatCard
          title="Gross Catalog Sales" value={`${siteConfig.currency}${(salesReport?.grossSales || 0).toLocaleString('en-IN')}`}
          icon={DollarSign}
          color="#2b6cb0"
          bg="#ebf8ff"
        />
        <AdminStatCard
          title="Discounts Given" value={`${siteConfig.currency}${(salesReport?.discount || 0).toLocaleString('en-IN')}`}
          icon={Tag}
          color="#d69e2e"
          bg="#fefcbf"
        />
        <AdminStatCard
          title="Collected Shipping" value={`${siteConfig.currency}${(salesReport?.shipping || 0).toLocaleString('en-IN')}`}
          icon={Truck}
          color="#805ad5"
          bg="#faf5ff"
        />
      </div>

      {/* Section 2: Inventory Breakdown */}
      <h3 style={{ color: '#1b4332', fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <ShieldAlert size={20} color="#e63946" /> Inventory Distribution Summary
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <AdminStatCard
          title="Total Products"
          value={inventoryReport?.totalProducts || 0}
          color="#1b4332"
          bg="#f4f9f6"
        />
        <AdminStatCard
          title="Healthy Stock"
          value={inventoryReport?.inStock || 0}
          color="#52b788"
          bg="#d8f3dc"
        />
        <AdminStatCard
          title="Low Stock Alert"
          value={inventoryReport?.lowStock || 0}
          color="#d69e2e"
          bg="#fefcbf"
        />
        <AdminStatCard
          title="Out of Stock"
          value={inventoryReport?.outOfStock || 0}
          color="#e53e3e"
          bg="#fff5f5"
        />
      </div>

      {/* Top Low Stock Table */}
      <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '1.5rem', border: '1px solid #e2e8e4' }}>
        <h4 style={{ margin: '0 0 1rem', color: '#1b4332' }}>Priority Low Stock Products</h4>
        <AdminTable columns={lowStockColumns} data={inventoryReport?.topLowStock || []} emptyMessage="No low stock items reported." />
      </div>
    </div>
  );
};

export default AdminReports;
