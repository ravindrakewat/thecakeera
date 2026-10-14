import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import orderService from '../services/orderService';
import reviewService from '../services/reviewService';
import Breadcrumbs from '../components/layout/Breadcrumbs';
import { siteConfig } from '../config/siteConfig';
import { 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  XCircle, 
  MapPin, 
  CreditCard, 
  Star, 
  ArrowLeft,
  AlertCircle,
  Download,
  ExternalLink,
  FileText
} from 'lucide-react';

const OrderDetail = () => {
  const { orderNumber } = useParams();
  const [order, setOrder] = useState(null);
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);

  const [reviewItem, setReviewItem] = useState(null);
  const [rating, setRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState(null);
  const [reviewedProductIds, setReviewedProductIds] = useState(new Set());

  useEffect(() => {
    fetchOrderDetail();
  }, [orderNumber]);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const [orderRes, shipmentRes] = await Promise.all([
        orderService.getOrderByNumber(orderNumber),
        orderService.getShipment(orderNumber).catch(() => ({ data: { hasShipment: false } })),
      ]);
      const data = orderRes.data?.data || orderRes.data || orderRes;
      setOrder(data);

      const shipData = shipmentRes.data?.data || shipmentRes.data || shipmentRes;
      if (shipData && shipData.hasShipment) {
        setShipment(shipData);
      } else {
        setShipment(null);
      }
    } catch (err) {
      console.error('Failed to fetch order details:', err);
      setError(err.response?.data?.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = async () => {
    try {
      setDownloadingInvoice(true);
      const blob = await orderService.downloadInvoice(orderNumber);
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice-${orderNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download invoice:', err);
      alert('Invoice is not yet available or failed to generate. Please try again.');
    } finally {
      setDownloadingInvoice(false);
    }
  };

  const handleOpenReviewModal = (item) => {
    setReviewItem(item);
    setRating(5);
    setReviewTitle('');
    setComment('');
    setReviewMessage(null);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewItem) return;
    if (comment.trim().length < 10) {
      setReviewMessage({ type: 'error', text: 'Review comment must be at least 10 characters.' });
      return;
    }

    try {
      setSubmittingReview(true);
      setReviewMessage(null);
      
      const productId = reviewItem.product?._id || reviewItem.product;
      await reviewService.createReview(productId, {
        rating,
        title: reviewTitle,
        comment
      });

      setReviewMessage({ type: 'success', text: 'Thank you! Your review has been submitted for moderation.' });
      setReviewedProductIds(prev => new Set(prev).add(productId));
      
      setTimeout(() => {
        setReviewItem(null);
      }, 2000);
    } catch (err) {
      console.error('Failed to submit review:', err);
      setReviewMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Failed to submit review. You may have already reviewed this product.' 
      });
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
        <p style={{ color: '#5c6e63' }}>Loading order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container" style={{ paddingBottom: '4rem' }}>
        <Breadcrumbs items={[{ label: 'My Orders', link: '/orders' }, { label: `Order #${orderNumber}` }]} />
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', backgroundColor: '#fff', borderRadius: '16px', marginTop: '2rem' }}>
          <AlertCircle size={48} color="#e63946" style={{ margin: '0 auto 1rem auto' }} />
          <h2 style={{ color: '#1b4332', marginBottom: '0.5rem' }}>Order Not Found</h2>
          <p style={{ color: '#5c6e63', marginBottom: '1.5rem' }}>{error || 'Unable to retrieve order details.'}</p>
          <Link to="/orders" className="btn btn-primary">Back to Orders</Link>
        </div>
      </div>
    );
  }

  const steps = [
    { key: 'PLACED', label: 'Order Placed', icon: Clock },
    { key: 'CONFIRMED', label: 'Confirmed', icon: CheckCircle },
    { key: 'PROCESSING', label: 'Processing', icon: Package },
    { key: 'PACKED', label: 'Packed', icon: Package },
    { key: 'SHIPPED', label: 'Shipped', icon: Truck },
    { key: 'DELIVERED', label: 'Delivered', icon: CheckCircle },
  ];

  const statusOrder = ['PLACED', 'CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'DELIVERED'];
  const isCancelled = order.orderStatus === 'CANCELLED';
  const currentStatusIndex = isCancelled ? -1 : statusOrder.indexOf(order.orderStatus);

  return (
    <div className="container" style={{ paddingBottom: '5rem' }}>
      <Breadcrumbs items={[{ label: 'My Orders', link: '/orders' }, { label: `#${order.orderNumber}` }]} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <Link to="/orders" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#5c6e63', textDecoration: 'none', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
            <ArrowLeft size={16} /> Back to My Orders
          </Link>
          <h1 style={{ fontSize: '1.8rem', color: '#1b4332', margin: 0 }}>
            Order #{order.orderNumber}
          </h1>
          <span style={{ fontSize: '0.85rem', color: '#5c6e63' }}>
            Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {['CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'DELIVERED'].includes(order.orderStatus) && (
            <button
              onClick={handleDownloadInvoice}
              disabled={downloadingInvoice}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: '#2d6a4f',
                color: '#fff',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: 'none',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: downloadingInvoice ? 'wait' : 'pointer',
              }}
            >
              <Download size={16} /> {downloadingInvoice ? 'Preparing PDF...' : 'Download Tax Invoice'}
            </button>
          )}

          <span
            style={{
              backgroundColor: isCancelled ? '#fde8e8' : order.orderStatus === 'DELIVERED' ? '#d8f3dc' : '#fff3cd',
              color: isCancelled ? '#9b1c1c' : order.orderStatus === 'DELIVERED' ? '#1b4332' : '#856404',
              padding: '0.5rem 1rem',
              borderRadius: '99px',
              fontSize: '0.85rem',
              fontWeight: 700,
            }}
          >
            Status: {order.orderStatus}
          </span>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '2rem', borderRadius: '16px', backgroundColor: '#fff', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.1rem', color: '#1b4332', marginBottom: '1.5rem' }}>Order Timeline</h3>
        
        {isCancelled ? (
          <div style={{ padding: '1rem 1.5rem', backgroundColor: '#fde8e8', color: '#9b1c1c', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <XCircle size={24} />
            <div>
              <strong>This order was cancelled.</strong>
              {order.cancellationReason && <p style={{ fontSize: '0.85rem', margin: 0 }}>Reason: {order.cancellationReason}</p>}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', flexWrap: 'wrap', gap: '1rem' }}>
            {steps.map((step, idx) => {
              const isCompleted = currentStatusIndex >= idx;
              const isCurrent = currentStatusIndex === idx;
              const StepIcon = step.icon;

              return (
                <div key={step.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: '90px', zIndex: 2 }}>
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      backgroundColor: isCompleted ? '#1b4332' : '#e2e8e4',
                      color: isCompleted ? '#ffffff' : '#8e9e94',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '0.5rem',
                      border: isCurrent ? '3px solid #52b788' : 'none',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <StepIcon size={20} />
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: isCompleted ? 700 : 500, color: isCompleted ? '#1b4332' : '#8e9e94', textAlign: 'center' }}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-card" style={{ padding: '1.75rem', borderRadius: '16px', backgroundColor: '#fff' }}>
            <h3 style={{ fontSize: '1.1rem', color: '#1b4332', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8e4', paddingBottom: '0.75rem' }}>
              Ordered Items ({order.items?.length || 0})
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {order.items && order.items.map((item, idx) => {
                const productId = item.product?._id || item.product;
                const isReviewed = reviewedProductIds.has(productId);

                return (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: idx < order.items.length - 1 ? '1px solid #f0f4f1' : 'none', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      {item.image ? (
                        <img src={item.image} alt={item.name} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8e4' }} />
                      ) : (
                        <div style={{ width: '60px', height: '60px', backgroundColor: '#e2e8e4', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Package size={24} color="#8e9e94" />
                        </div>
                      )}
                      <div>
                        <strong style={{ color: '#1b4332', fontSize: '0.95rem', display: 'block' }}>{item.name}</strong>
                        <span style={{ fontSize: '0.85rem', color: '#5c6e63' }}>
                          Price: {siteConfig.currency}{item.price} × {item.quantity}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <strong style={{ fontSize: '1rem', color: '#1b4332' }}>
                        {siteConfig.currency}{item.subtotal.toLocaleString('en-IN')}
                      </strong>

                      {order.orderStatus === 'DELIVERED' && (
                        isReviewed ? (
                          <span style={{ fontSize: '0.8rem', color: '#52b788', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            <CheckCircle size={14} /> Reviewed
                          </span>
                        ) : (
                          <button
                            onClick={() => handleOpenReviewModal(item)}
                            style={{
                              backgroundColor: '#f4f9f6',
                              border: '1px solid #52b788',
                              color: '#1b4332',
                              padding: '0.35rem 0.75rem',
                              borderRadius: '8px',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                            }}
                          >
                            <Star size={14} fill="#ffb703" color="#ffb703" /> Write Review
                          </button>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Shipment & Courier Tracking Card */}
          <div className="glass-card" style={{ padding: '1.75rem', borderRadius: '16px', backgroundColor: '#fff' }}>
            <h3 style={{ fontSize: '1.1rem', color: '#1b4332', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Truck size={20} color="#52b788" /> Shipment & Courier Tracking
            </h3>

            {shipment ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', backgroundColor: '#f8faf9', padding: '1rem', borderRadius: '12px' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#8e9e94', display: 'block', textTransform: 'uppercase' }}>Carrier</span>
                    <strong style={{ color: '#1b4332', fontSize: '0.95rem' }}>{shipment.carrier || 'Standard Courier'}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#8e9e94', display: 'block', textTransform: 'uppercase' }}>AWB / Tracking No.</span>
                    <strong style={{ color: '#1b4332', fontSize: '0.95rem' }}>{shipment.awbNumber || 'Assigned upon pickup'}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#8e9e94', display: 'block', textTransform: 'uppercase' }}>Shipment Status</span>
                    <span style={{ display: 'inline-block', backgroundColor: '#d8f3dc', color: '#1b4332', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700 }}>
                      {shipment.shipmentStatus}
                    </span>
                  </div>
                  {shipment.estimatedDeliveryAt && (
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#8e9e94', display: 'block', textTransform: 'uppercase' }}>Estimated Delivery</span>
                      <strong style={{ color: '#1b4332', fontSize: '0.9rem' }}>
                        {new Date(shipment.estimatedDeliveryAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </strong>
                    </div>
                  )}
                </div>

                {shipment.trackingUrl && (
                  <div>
                    <a
                      href={shipment.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        color: '#2d6a4f',
                        textDecoration: 'none',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                      }}
                    >
                      <ExternalLink size={15} /> Track Package on Courier Website
                    </a>
                  </div>
                )}

                {/* Tracking Events Timeline */}
                {shipment.trackingEvents && shipment.trackingEvents.length > 0 && (
                  <div style={{ borderTop: '1px solid #e2e8e4', paddingTop: '1rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1b4332', display: 'block', marginBottom: '0.75rem' }}>
                      Shipment Activity History
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {shipment.trackingEvents.map((evt, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#52b788', marginTop: '6px' }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                              <strong style={{ color: '#1b4332' }}>{evt.status}</strong>
                              <span style={{ color: '#8e9e94', fontSize: '0.75rem' }}>
                                {new Date(evt.timestamp).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                              </span>
                            </div>
                            <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#5c6e63' }}>
                              {evt.description} {evt.location ? `— ${evt.location}` : ''}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: '1rem', backgroundColor: '#f8faf9', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#5c6e63', fontSize: '0.9rem' }}>
                <Clock size={20} color="#8e9e94" />
                <span>
                  Fulfillment in progress: Tracking details and courier dispatch will be updated soon.
                </span>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '16px', backgroundColor: '#fff' }}>
            <h3 style={{ fontSize: '1rem', color: '#1b4332', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <MapPin size={18} color="#52b788" /> Shipping Address
            </h3>
            {order.shippingAddress ? (
              <div style={{ fontSize: '0.85rem', color: '#5c6e63', lineHeight: 1.5 }}>
                <strong style={{ color: '#1b4332', display: 'block' }}>{order.shippingAddress.fullName}</strong>
                <div>{order.shippingAddress.addressLine1}</div>
                {order.shippingAddress.addressLine2 && <div>{order.shippingAddress.addressLine2}</div>}
                <div>{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}</div>
                <div style={{ marginTop: '0.3rem' }}>Phone: {order.shippingAddress.phone}</div>
              </div>
            ) : (
              <p style={{ fontSize: '0.85rem', color: '#8e9e94' }}>Address details not available</p>
            )}
          </div>

          <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '16px', backgroundColor: '#fff' }}>
            <h3 style={{ fontSize: '1rem', color: '#1b4332', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CreditCard size={18} color="#52b788" /> Payment Info
            </h3>
            <div style={{ fontSize: '0.85rem', color: '#5c6e63', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <div>Method: <strong style={{ color: '#1b4332' }}>{order.paymentMethod}</strong></div>
              <div>Status: <span style={{ fontWeight: 700, color: order.paymentStatus === 'PAID' ? '#52b788' : '#e63946' }}>{order.paymentStatus}</span></div>
              {order.paymentDetails?.razorpayPaymentId && (
                <div style={{ fontSize: '0.75rem', color: '#8e9e94', marginTop: '0.3rem' }}>
                  Ref ID: {order.paymentDetails.razorpayPaymentId}
                </div>
              )}
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '16px', backgroundColor: '#fff' }}>
            <h3 style={{ fontSize: '1rem', color: '#1b4332', marginBottom: '0.75rem' }}>Price Breakdown</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: '#5c6e63', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotal:</span>
                <span>{siteConfig.currency}{order.subtotal?.toLocaleString('en-IN')}</span>
              </div>
              {order.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#52b788' }}>
                  <span>Coupon Discount {order.couponCode ? `(${order.couponCode})` : ''}:</span>
                  <span>-{siteConfig.currency}{order.discount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Shipping Fee:</span>
                <span>{order.shippingCharge === 0 ? 'FREE' : `${siteConfig.currency}${order.shippingCharge}`}</span>
              </div>
              {order.tax > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Tax:</span>
                  <span>{siteConfig.currency}{order.tax}</span>
                </div>
              )}
            </div>

            <div style={{ borderTop: '2px solid #e2e8e4', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '1rem', color: '#1b4332' }}>Grand Total:</strong>
              <strong style={{ fontSize: '1.3rem', color: '#1b4332' }}>
                {siteConfig.currency}{order.grandTotal?.toLocaleString('en-IN')}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {reviewItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ backgroundColor: '#fff', padding: '2rem', borderRadius: '16px', maxWidth: '500px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <h3 style={{ fontSize: '1.25rem', color: '#1b4332', marginBottom: '0.5rem' }}>Write a Review</h3>
            <p style={{ fontSize: '0.9rem', color: '#5c6e63', marginBottom: '1.25rem' }}>{reviewItem.name}</p>

            {reviewMessage && (
              <div style={{ padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem', backgroundColor: reviewMessage.type === 'error' ? '#fde8e8' : '#d8f3dc', color: reviewMessage.type === 'error' ? '#9b1c1c' : '#1b4332' }}>
                {reviewMessage.text}
              </div>
            )}

            <form onSubmit={handleSubmitReview}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1b4332', marginBottom: '0.4rem' }}>Rating</label>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem' }}
                    >
                      <Star size={28} fill={star <= rating ? '#ffb703' : 'none'} color="#ffb703" />
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1b4332', marginBottom: '0.4rem' }}>Title (Optional)</label>
                <input
                  type="text"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  placeholder="Summarize your experience..."
                  maxLength={100}
                  style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #c8d6ce', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1b4332' }}>Review Text *</label>
                  <span style={{ fontSize: '0.75rem', color: '#8e9e94' }}>{comment.length} / 1000</span>
                </div>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share details of your experience with this product..."
                  rows={4}
                  maxLength={1000}
                  required
                  style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #c8d6ce', fontSize: '0.9rem', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setReviewItem(null)}
                  disabled={submittingReview}
                  style={{ padding: '0.6rem 1.25rem', borderRadius: '8px', border: '1px solid #c8d6ce', background: 'none', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="btn btn-primary"
                  style={{ padding: '0.6rem 1.25rem' }}
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetail;
