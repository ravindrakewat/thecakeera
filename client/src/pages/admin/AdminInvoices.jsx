import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import adminService from '../../services/adminService';
import AdminStatusBadge from '../../components/admin/AdminStatusBadge';
import AdminPagination from '../../components/admin/AdminPagination';
import { siteConfig } from '../../config/siteConfig';
import { FileText, Search, Download, Eye, Calendar } from 'lucide-react';

const AdminInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [downloadingId, setDownloadingId] = useState('');

  const fetchInvoices = async (pageNum = 1) => {
    try {
      setLoading(true);
      const res = await adminService.getAdminInvoices({
        page: pageNum,
        limit: 15,
        search,
      });
      const data = res.data?.data || res.data || res;
      setInvoices(data.invoices || []);
      setPagination(data.pagination || { total: 0, pages: 1 });
    } catch (err) {
      console.error('Failed to fetch invoices', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices(page);
  }, [page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchInvoices(1);
  };

  const handleDownloadPDF = async (orderNumber, invoiceNumber) => {
    try {
      setDownloadingId(invoiceNumber);
      const blob = await adminService.downloadAdminOrderInvoice(orderNumber);
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download invoice PDF.');
    } finally {
      setDownloadingId('');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: '#1b4332', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={24} color="#52b788" /> GST Invoices & Bills of Supply
          </h1>
          <p style={{ color: '#5c6e63', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
            View and download tax-compliant customer invoice records
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ backgroundColor: '#fff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8e4', marginBottom: '1.5rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', maxWidth: '450px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} color="#8e9e94" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search by Invoice #, Order #, or Customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '0.55rem 0.75rem 0.55rem 2.2rem', borderRadius: '8px', border: '1px solid #c8d6ce', fontSize: '0.85rem' }}
            />
          </div>
          <button type="submit" style={{ backgroundColor: '#1b4332', color: '#fff', border: 'none', padding: '0.55rem 1rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
            Search
          </button>
        </form>
      </div>

      {/* Invoices Table */}
      <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8e4', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8faf9', borderBottom: '1px solid #e2e8e4', color: '#1b4332' }}>
              <th style={{ padding: '0.85rem 1rem' }}>Invoice No.</th>
              <th style={{ padding: '0.85rem 1rem' }}>Order No.</th>
              <th style={{ padding: '0.85rem 1rem' }}>Recipient</th>
              <th style={{ padding: '0.85rem 1rem' }}>Date</th>
              <th style={{ padding: '0.85rem 1rem' }}>Taxable Val.</th>
              <th style={{ padding: '0.85rem 1rem' }}>GST Total</th>
              <th style={{ padding: '0.85rem 1rem' }}>Grand Total</th>
              <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: '#8e9e94' }}>
                  Loading invoice records...
                </td>
              </tr>
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: '#8e9e94' }}>
                  No invoices generated yet.
                </td>
              </tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv._id} style={{ borderBottom: '1px solid #f0f4f2' }}>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#1b4332' }}>
                    {inv.invoiceNumber}
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <Link to={`/admin/orders/${inv.orderNumber}`} style={{ color: '#2d6a4f', textDecoration: 'none', fontWeight: 600 }}>
                      #{inv.orderNumber}
                    </Link>
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>{inv.buyerSnapshot?.fullName || 'Customer'}</td>
                  <td style={{ padding: '0.85rem 1rem', color: '#5c6e63' }}>
                    {new Date(inv.invoiceDate).toLocaleDateString('en-IN')}
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    {siteConfig.currency}{(inv.taxableValue || 0).toLocaleString('en-IN')}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', color: '#2d6a4f', fontWeight: 600 }}>
                    {siteConfig.currency}{(inv.totalTax || 0).toLocaleString('en-IN')}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#1b4332' }}>
                    {siteConfig.currency}{(inv.grandTotal || 0).toLocaleString('en-IN')}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                    <button
                      onClick={() => handleDownloadPDF(inv.orderNumber, inv.invoiceNumber)}
                      disabled={downloadingId === inv.invoiceNumber}
                      style={{
                        backgroundColor: '#e8f5e9',
                        border: '1px solid #52b788',
                        color: '#1b4332',
                        padding: '0.35rem 0.75rem',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: downloadingId === inv.invoiceNumber ? 'wait' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                      }}
                    >
                      <Download size={13} /> {downloadingId === inv.invoiceNumber ? 'PDF...' : 'PDF'}
                    </button>
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

export default AdminInvoices;
