import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import adminService from '../../services/adminService';
import AdminStatusBadge from '../../components/admin/AdminStatusBadge';
import { siteConfig } from '../../config/siteConfig';
import { 
  ArrowLeft, 
  Save, 
  MapPin, 
  CreditCard, 
  ShieldCheck, 
  Truck, 
  Package, 
  FileText, 
  Download, 
  ExternalLink,
  CheckCircle,
  Clock
} from 'lucide-react';

const AdminOrderDetail = () => {
  const { orderNumber } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newOrderStatus, setNewOrderStatus] = useState('');
  const [newPaymentStatus, setNewPaymentStatus] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Shipment Form state
  const [carrier, setCarrier] = useState('Blue Dart');
  const [awbNumber, setAwbNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [estimatedDeliveryAt, setEstimatedDeliveryAt] = useState('');
  const [shipmentProcessing, setShipmentProcessing] = useState(false);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await adminService.getAdminOrderDetail(orderNumber);
      setData(res.data);
      if (res.data?.order) {
        setNewOrderStatus(res.data.order.orderStatus);
        setNewPaymentStatus(res.data.order.paymentStatus);
      }
      if (res.data?.shipment) {
        setCarrier(res.data.shipment.carrier || 'Blue Dart');
        setAwbNumber(res.data.shipment.awbNumber || '');
        setTrackingUrl(res.data.shipment.trackingUrl || '');
        if (res.data.shipment.estimatedDeliveryAt) {
          setEstimatedDeliveryAt(new Date(res.data.shipment.estimatedDeliveryAt).toISOString().split('T')[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch order detail', err);
      setErrorMsg(err.response?.data?.message || 'Failed to fetch order specification');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [orderNumber]);

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    try {
      setUpdating(true);
      setSuccessMsg('');
      setErrorMsg('');
      await adminService.updateAdminOrderStatus(orderNumber, {
        orderStatus: newOrderStatus,
        paymentStatus: newPaymentStatus,
      });
      setSuccessMsg('Order status updated successfully!');
      fetchDetail();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const handleCreateShipment = async (e) => {
    e.preventDefault();
    try {
      setShipmentProcessing(true);
      setSuccessMsg('');
      setErrorMsg('');
      await adminService.createAdminShipment(orderNumber, {
        carrier,
        awbNumber,
        trackingUrl,
        estimatedDeliveryAt,
      });
      setSuccessMsg('Shipment record created and order moved to PACKED!');
      fetchDetail();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to create shipment');
    } finally {
      setShipmentProcessing(false);
    }
  };

  const handleDispatchShipment = async () => {
    if (!data?.shipment?._id) return;
    try {
      setShipmentProcessing(true);
      setSuccessMsg('');
      setErrorMsg('');
      await adminService.dispatchAdminShipment(data.shipment._id, {
        carrier,
        awbNumber,
        trackingUrl,
        estimatedDeliveryAt,
      });
      setSuccessMsg('Shipment dispatched and marked SHIPPED!');
      fetchDetail();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to dispatch shipment');
    } finally {
      setShipmentProcessing(false);
    }
  };

  const handleDeliverShipment = async () => {
    if (!data?.shipment?._id) return;
    if (!window.confirm('Are you sure you want to confirm package delivery?')) return;
    try {
      setShipmentProcessing(true);
      setSuccessMsg('');
      setErrorMsg('');
      await adminService.deliverAdminShipment(data.shipment._id);
      setSuccessMsg('Shipment and Order marked DELIVERED successfully!');
      fetchDetail();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to mark delivery');
    } finally {
      setShipmentProcessing(false);
    }
  };

  const handleDownloadInvoice = async () => {
    try {
      setDownloadingInvoice(true);
      const blob = await adminService.downloadAdminOrderInvoice(orderNumber);
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Tax-Invoice-${orderNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Invoice download failed', err);
      alert('Invoice download failed. Please try again.');
    } finally {
      setDownloadingInvoice(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', color: '#5c6e63' }}>Loading order specification...</div>;
  }

  const { order, payment, shipment } = data || {};
  if (!order) {
    return <div style={{ padding: '2rem', color: '#5c6e63' }}>Order not found.</div>;
  }

  return (
    <div style={{ maxWidth: '980px', paddingBottom: '3rem' }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/admin/orders" style={{ color: '#5c6e63', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}>
            <ArrowLeft size={18} /> Back to Orders
          </Link>
          <h1 style={{ fontSize: '1.8rem', color: '#1b4332', margin: 0 }}>
            Order Specification #{order.orderNumber}
          </h1>
        </div>

        <button
          onClick={handleDownloadInvoice}
          disabled={downloadingInvoice}
          style={{
            backgroundColor: '#2d6a4f',
            color: '#fff',
            border: 'none',
            padding: '0.55rem 1rem',
            borderRadius: '8px',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: downloadingInvoice ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <Download size={16} /> {downloadingInvoice ? 'Generating PDF...' : 'Download GST Invoice (PDF)'}
        </button>
      </div>

      {successMsg && (
        <div style={{ backgroundColor: '#d8f3dc', color: '#1b4332', padding: '0.85rem 1rem', borderRadius: '10px', marginBottom: '1.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldCheck size={18} /> <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div style={{ backgroundColor: '#ffebee', color: '#c62828', padding: '0.85rem 1rem', borderRadius: '10px', marginBottom: '1.5rem', fontWeight: 600 }}>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Grid Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem' }}>
        {/* Left Column: Items, Customer Details & Fulfillment Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Purchased Items Snapshot */}
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '1.5rem', border: '1px solid #e2e8e4' }}>
            <h3 style={{ margin: '0 0 1rem', color: '#1b4332', fontSize: '1.1rem' }}>Purchased Items Snapshot</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
              {order.items &&
                order.items.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f4f2', paddingBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {item.thumbnail && (
                        <img src={item.thumbnail} alt={item.name} style={{ width: '42px', height: '42px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #e2e8e4' }} />
                      )}
                      <div>
                        <strong style={{ color: '#1b4332', fontSize: '0.9rem', display: 'block' }}>{item.name}</strong>
                        <span style={{ fontSize: '0.75rem', color: '#8e9e94' }}>
                          Price: {siteConfig.currency}{item.sellingPrice} × {item.quantity} units {item.sku ? `(SKU: ${item.sku})` : ''}
                        </span>
                      </div>
                    </div>
                    <strong style={{ color: '#1b4332', fontSize: '0.95rem' }}>
                      {siteConfig.currency}{(item.subtotal || 0).toLocaleString('en-IN')}
                    </strong>
                  </div>
                ))}
            </div>

            {/* Financial Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.9rem', color: '#5c6e63', borderTop: '2px solid #e2e8e4', paddingTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotal:</span>
                <span>{siteConfig.currency}{(order.subtotal || 0).toLocaleString('en-IN')}</span>
              </div>
              {order.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#52b788' }}>
                  <span>Discount:</span>
                  <span>-{siteConfig.currency}{order.discount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Shipping Charge:</span>
                <span>{siteConfig.currency}{order.shippingCharge || 0}</span>
              </div>
              {order.tax > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>GST Tax:</span>
                  <span>{siteConfig.currency}{order.tax}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 800, color: '#1b4332', marginTop: '0.5rem', borderTop: '1px solid #e2e8e4', paddingTop: '0.5rem' }}>
                <span>Grand Total:</span>
                <span>{siteConfig.currency}{(order.grandTotal || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Shipment & Fulfillment Management Card */}
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '1.5rem', border: '1px solid #e2e8e4' }}>
            <h3 style={{ margin: '0 0 1rem', color: '#1b4332', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Truck size={20} color="#52b788" /> Shipment & Courier Dispatch
            </h3>

            {shipment ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', backgroundColor: '#f8faf9', padding: '1rem', borderRadius: '10px' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#8e9e94', display: 'block' }}>Shipment No.</span>
                    <strong style={{ color: '#1b4332', fontSize: '0.85rem' }}>{shipment.shipmentNumber}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#8e9e94', display: 'block' }}>Carrier</span>
                    <strong style={{ color: '#1b4332', fontSize: '0.85rem' }}>{shipment.carrier || 'Manual Courier'}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#8e9e94', display: 'block' }}>AWB Number</span>
                    <strong style={{ color: '#1b4332', fontSize: '0.85rem' }}>{shipment.awbNumber || 'Pending'}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#8e9e94', display: 'block' }}>Shipment Status</span>
                    <AdminStatusBadge status={shipment.shipmentStatus} />
                  </div>
                </div>

                {/* Dispatch Controls */}
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {shipment.shipmentStatus !== 'SHIPPED' && shipment.shipmentStatus !== 'DELIVERED' && (
                    <button
                      onClick={handleDispatchShipment}
                      disabled={shipmentProcessing}
                      style={{ backgroundColor: '#1b4332', color: '#fff', padding: '0.6rem 1rem', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
                    >
                      <Truck size={16} /> Mark Dispatched (SHIPPED)
                    </button>
                  )}

                  {shipment.shipmentStatus !== 'DELIVERED' && (
                    <button
                      onClick={handleDeliverShipment}
                      disabled={shipmentProcessing}
                      style={{ backgroundColor: '#2d6a4f', color: '#fff', padding: '0.6rem 1rem', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
                    >
                      <CheckCircle size={16} /> Mark DELIVERED
                    </button>
                  )}
                </div>

                {/* Tracking Events Timeline */}
                {shipment.trackingEvents && shipment.trackingEvents.length > 0 && (
                  <div style={{ borderTop: '1px solid #f0f4f2', paddingTop: '1rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1b4332', display: 'block', marginBottom: '0.5rem' }}>Fulfillment Log</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {shipment.trackingEvents.map((evt, idx) => (
                        <div key={idx} style={{ fontSize: '0.8rem', color: '#5c6e63', padding: '0.4rem 0.6rem', backgroundColor: '#f8faf9', borderRadius: '6px' }}>
                          <strong style={{ color: '#1b4332' }}>{evt.status}</strong> — {evt.description} ({new Date(evt.timestamp).toLocaleString('en-IN')})
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleCreateShipment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#5c6e63' }}>
                  No shipment registered yet. Assign a carrier and AWB to move this order into packed/fulfillment state.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#1b4332', marginBottom: '0.25rem' }}>Carrier Name</label>
                    <input
                      type="text"
                      value={carrier}
                      onChange={(e) => setCarrier(e.target.value)}
                      placeholder="e.g. Blue Dart, Delhivery, DTDC"
                      style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #c8d6ce', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#1b4332', marginBottom: '0.25rem' }}>AWB / Tracking Number</label>
                    <input
                      type="text"
                      value={awbNumber}
                      onChange={(e) => setAwbNumber(e.target.value)}
                      placeholder="e.g. BD123456789IN"
                      style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #c8d6ce', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#1b4332', marginBottom: '0.25rem' }}>Tracking URL</label>
                    <input
                      type="url"
                      value={trackingUrl}
                      onChange={(e) => setTrackingUrl(e.target.value)}
                      placeholder="https://track.carrier.com/..."
                      style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #c8d6ce', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#1b4332', marginBottom: '0.25rem' }}>Estimated Delivery Date</label>
                    <input
                      type="date"
                      value={estimatedDeliveryAt}
                      onChange={(e) => setEstimatedDeliveryAt(e.target.value)}
                      style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #c8d6ce', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={shipmentProcessing}
                  style={{ backgroundColor: '#1b4332', color: '#fff', padding: '0.65rem 1rem', borderRadius: '8px', border: 'none', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.85rem', width: 'fit-content' }}
                >
                  <Package size={16} /> {shipmentProcessing ? 'Creating...' : 'Create Shipment & Mark PACKED'}
                </button>
              </form>
            )}
          </div>

          {/* Customer & Address Information */}
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '1.5rem', border: '1px solid #e2e8e4' }}>
            <h3 style={{ margin: '0 0 1rem', color: '#1b4332', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={18} color="#52b788" /> Shipping Address & Customer
            </h3>

            <p style={{ margin: '0 0 0.5rem', color: '#2d3748', fontSize: '0.9rem', lineHeight: 1.5 }}>
              <strong>Recipient:</strong> {order.shippingAddress?.fullName}<br />
              <strong>Phone:</strong> {order.shippingAddress?.phone}<br />
              <strong>Address:</strong> {order.shippingAddress?.addressLine1}{order.shippingAddress?.addressLine2 ? ', ' + order.shippingAddress.addressLine2 : ''}<br />
              <strong>City/State:</strong> {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}
            </p>
          </div>
        </div>

        {/* Right Column: Status Controls & Payment Metadata */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Status Update Form */}
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '1.5rem', border: '1px solid #e2e8e4' }}>
            <h3 style={{ margin: '0 0 1rem', color: '#1b4332', fontSize: '1.1rem' }}>Fulfillment Status Control</h3>

            <form onSubmit={handleUpdateStatus} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1b4332', marginBottom: '0.3rem' }}>Order Status</label>
                <select
                  value={newOrderStatus}
                  onChange={(e) => setNewOrderStatus(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #c8d6ce', backgroundColor: '#fff', fontSize: '0.9rem' }}
                >
                  <option value="PAYMENT_PENDING">PAYMENT_PENDING</option>
                  <option value="PLACED">PLACED</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="PROCESSING">PROCESSING</option>
                  <option value="PACKED">PACKED</option>
                  <option value="SHIPPED">SHIPPED</option>
                  <option value="DELIVERED">DELIVERED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1b4332', marginBottom: '0.3rem' }}>Payment Status</label>
                <select
                  value={newPaymentStatus}
                  onChange={(e) => setNewPaymentStatus(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #c8d6ce', backgroundColor: '#fff', fontSize: '0.9rem' }}
                >
                  <option value="PENDING">PENDING</option>
                  <option value="PAID">PAID</option>
                  <option value="FAILED">FAILED</option>
                  <option value="REFUNDED">REFUNDED</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={updating}
                style={{ backgroundColor: '#1b4332', color: '#fff', padding: '0.75rem', borderRadius: '8px', border: 'none', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem' }}
              >
                <Save size={18} /> {updating ? 'Updating...' : 'Save Order Status'}
              </button>
            </form>
          </div>

          {/* Payment & Transaction Info */}
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '1.5rem', border: '1px solid #e2e8e4' }}>
            <h3 style={{ margin: '0 0 1rem', color: '#1b4332', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CreditCard size={18} color="#52b788" /> Payment Information
            </h3>

            <div style={{ fontSize: '0.85rem', color: '#5c6e63', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div>
                <span>Payment Method: </span>
                <strong style={{ color: '#1b4332' }}>{order.paymentMethod}</strong>
              </div>
              <div>
                <span>Payment Status: </span>
                <AdminStatusBadge status={order.paymentStatus} />
              </div>
              {order.razorpayOrderId && (
                <div>
                  <span>Provider Order ID: </span>
                  <strong style={{ color: '#1b4332', wordBreak: 'break-all', display: 'block', fontSize: '0.8rem' }}>{order.razorpayOrderId}</strong>
                </div>
              )}
              {payment && (
                <div>
                  <span>Provider Payment ID: </span>
                  <strong style={{ color: '#1b4332', wordBreak: 'break-all', display: 'block', fontSize: '0.8rem' }}>{payment.providerPaymentId || 'N/A'}</strong>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOrderDetail;
