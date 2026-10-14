import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import userService from '../services/userService';
import orderService from '../services/orderService';
import paymentService from '../services/paymentService';
import couponService from '../services/couponService';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import Breadcrumbs from '../components/layout/Breadcrumbs';
import { siteConfig } from '../config/siteConfig';
import { 
  MapPin, 
  CreditCard, 
  ShieldCheck, 
  Plus, 
  Tag, 
  X, 
  CheckCircle,
  AlertCircle 
} from 'lucide-react';

const Checkout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cartItems, clearCart } = useCart();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('ONLINE');

  const [loading, setLoading] = useState(true);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [preview, setPreview] = useState(null);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  // Add Address Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAddress, setNewAddress] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    isDefault: true,
  });

  useEffect(() => {
    if (!cartItems || cartItems.length === 0) {
      navigate('/cart');
      return;
    }
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const res = await userService.getAddresses();
      const addrList = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res)
        ? res
        : [];
      setAddresses(addrList);
      if (addrList.length > 0) {
        const defaultAddr = addrList.find((a) => a.isDefault) || addrList[0];
        if (defaultAddr?._id) {
          setSelectedAddressId(defaultAddr._id);
        }
      }
    } catch (err) {
      console.error('Failed to load user addresses', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedAddressId) {
      fetchCheckoutPreview();
    }
  }, [selectedAddressId, appliedCoupon]);

  const fetchCheckoutPreview = async () => {
    try {
      setPreviewLoading(true);
      const res = await orderService.checkoutPreview(
        selectedAddressId,
        appliedCoupon ? appliedCoupon.code : null
      );
      const data = res.data?.data || res.data || res;
      setPreview(data);
    } catch (err) {
      console.error('Failed to fetch checkout preview', err);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    try {
      setValidatingCoupon(true);
      setCouponError(null);

      // Validate against coupon API
      const res = await couponService.validateCoupon(couponCode, cartItems);
      const couponData = res.data?.data || res.data;

      setAppliedCoupon(couponData);
      setCouponError(null);
    } catch (err) {
      console.error('Coupon validation failed:', err);
      setCouponError(err.response?.data?.message || 'Invalid coupon code');
      setAppliedCoupon(null);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError(null);
  };

  const handleAddAddressSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await userService.createAddress(newAddress);
      const created = res.data || res.data?.data || res;
      await fetchAddresses();
      if (created?._id) {
        setSelectedAddressId(created._id);
      }
      setShowAddModal(false);
      setNewAddress({
        fullName: '',
        phone: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        pincode: '',
        isDefault: true,
      });
    } catch (err) {
      const errMsg = err.response?.data?.errors?.join(', ') || err.response?.data?.message || err.message || 'Failed to add address';
      alert(errMsg);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      alert('Please select a shipping address');
      return;
    }

    try {
      setProcessing(true);

      // Handle ONLINE (Razorpay) payment vs COD
      if (paymentMethod === 'ONLINE') {
        const payRes = await paymentService.createRazorpayOrder(
          selectedAddressId,
          appliedCoupon ? appliedCoupon.code : undefined
        );
        const result = payRes.data?.data || payRes.data || payRes;

        if (!window.Razorpay) {
          alert('Razorpay SDK failed to load. Please check your internet connection.');
          setProcessing(false);
          return;
        }

        const options = {
          key: result.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: result.amount,
          currency: result.currency || 'INR',
          name: siteConfig.name,
          description: `Payment for Order #${result.orderNumber}`,
          order_id: result.razorpayOrderId,
          handler: async function (response) {
            try {
              await paymentService.verifyRazorpayPayment({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });
              clearCart();
              navigate(`/order-success/${result.orderNumber}`);
            } catch (vErr) {
              console.error('Payment verification failed:', vErr);
              navigate('/payment-failed');
            }
          },
          prefill: {
            name: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name || '' : '',
            email: user?.email || '',
            contact: user?.phone || '',
          },
          theme: {
            color: '#1b4332',
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response) {
          console.error('Razorpay payment failed:', response.error);
          navigate('/payment-failed');
        });
        rzp.open();
      } else {
        // COD Order
        const orderPayload = {
          addressId: selectedAddressId,
          paymentMethod: 'COD',
          couponCode: appliedCoupon ? appliedCoupon.code : undefined,
        };

        const res = await orderService.createOrder(orderPayload);
        const result = res.data?.data || res.data || res;

        clearCart();
        navigate(`/order-success/${result.orderNumber}`);
      }
    } catch (err) {
      console.error('Failed to create order', err);
      alert(err.response?.data?.message || 'Failed to place order.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
        <p style={{ color: '#5c6e63' }}>Loading checkout parameters...</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingBottom: '5rem' }}>
      <Breadcrumbs items={[{ label: 'Cart', link: '/cart' }, { label: 'Checkout' }]} />

      <h1 style={{ fontSize: '2rem', color: '#1b4332', marginBottom: '1.5rem' }}>
        Secure Checkout
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        {/* Left Column: Address & Payment Selection */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Section 1: Shipping Address */}
          <div className="glass-card" style={{ padding: '1.75rem', borderRadius: '16px', backgroundColor: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', color: '#1b4332', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <MapPin size={20} color="#52b788" /> 1. Select Delivery Address
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#52b788',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
              >
                <Plus size={16} /> Add New Address
              </button>
            </div>

            {addresses.length === 0 ? (
              <div style={{ padding: '1rem', backgroundColor: '#fff3cd', borderRadius: '8px', fontSize: '0.9rem', color: '#856404' }}>
                No addresses found. Please add a shipping address to proceed.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {addresses.map((addr) => (
                  <div
                    key={addr._id}
                    onClick={() => setSelectedAddressId(addr._id)}
                    style={{
                      padding: '1rem',
                      borderRadius: '12px',
                      border: selectedAddressId === addr._id ? '2px solid #1b4332' : '1px solid #e2e8e4',
                      backgroundColor: selectedAddressId === addr._id ? '#f4f9f6' : '#fff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <input
                      type="radio"
                      name="addressSelect"
                      checked={selectedAddressId === addr._id}
                      onChange={() => setSelectedAddressId(addr._id)}
                      style={{ marginTop: '0.2rem', accentColor: '#1b4332' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: '#1b4332', fontSize: '0.95rem' }}>
                        {addr.fullName} <span style={{ fontWeight: 400, color: '#5c6e63', fontSize: '0.85rem' }}>({addr.phone})</span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#5c6e63', marginTop: '0.2rem' }}>
                        {addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}, {addr.city}, {addr.state} - {addr.pincode}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Payment Method */}
          <div className="glass-card" style={{ padding: '1.75rem', borderRadius: '16px', backgroundColor: '#fff' }}>
            <h3 style={{ fontSize: '1.2rem', color: '#1b4332', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <CreditCard size={20} color="#52b788" /> 2. Select Payment Method
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <label
                style={{
                  padding: '1.25rem',
                  borderRadius: '12px',
                  border: paymentMethod === 'ONLINE' ? '2px solid #1b4332' : '1px solid #e2e8e4',
                  backgroundColor: paymentMethod === 'ONLINE' ? '#f4f9f6' : '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                }}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="ONLINE"
                  checked={paymentMethod === 'ONLINE'}
                  onChange={() => setPaymentMethod('ONLINE')}
                  style={{ accentColor: '#1b4332' }}
                />
                <div>
                  <strong style={{ color: '#1b4332', display: 'block' }}>Razorpay Online Payment (UPI, Cards, Netbanking)</strong>
                  <span style={{ fontSize: '0.85rem', color: '#5c6e63' }}>Fast & secure checkout via Official Razorpay Payment Gateway</span>
                </div>
              </label>

              <label
                style={{
                  padding: '1.25rem',
                  borderRadius: '12px',
                  border: paymentMethod === 'COD' ? '2px solid #1b4332' : '1px solid #e2e8e4',
                  backgroundColor: paymentMethod === 'COD' ? '#f4f9f6' : '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                }}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="COD"
                  checked={paymentMethod === 'COD'}
                  onChange={() => setPaymentMethod('COD')}
                  style={{ accentColor: '#1b4332' }}
                />
                <div>
                  <strong style={{ color: '#1b4332', display: 'block' }}>Cash on Delivery (COD)</strong>
                  <span style={{ fontSize: '0.85rem', color: '#5c6e63' }}>Pay in cash upon doorstep delivery</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary Preview & Coupon Code */}
        <div>
          <div className="glass-card" style={{ padding: '1.75rem', borderRadius: '16px', backgroundColor: '#fff', position: 'sticky', top: '100px' }}>
            <h3 style={{ fontSize: '1.25rem', color: '#1b4332', marginBottom: '1.25rem' }}>Order Summary</h3>

            {/* Coupon Application Box */}
            <div style={{ marginBottom: '1.25rem', borderBottom: '1px solid #e2e8e4', paddingBottom: '1rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1b4332', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.5rem' }}>
                <Tag size={16} color="#52b788" /> Apply Promo Code / Coupon
              </label>

              {appliedCoupon ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#d8f3dc', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #52b788' }}>
                  <div>
                    <strong style={{ color: '#1b4332', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <CheckCircle size={14} color="#52b788" /> {appliedCoupon.code}
                    </strong>
                    <span style={{ fontSize: '0.75rem', color: '#1b4332' }}>
                      Discount: {appliedCoupon.discountType === 'PERCENTAGE' ? `${appliedCoupon.discountValue}%` : `${siteConfig.currency}${appliedCoupon.discountValue}`}
                    </span>
                  </div>
                  <button
                    onClick={handleRemoveCoupon}
                    style={{ background: 'none', border: 'none', color: '#e63946', cursor: 'pointer', padding: '0.2rem' }}
                    title="Remove Coupon"
                  >
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Enter Coupon Code"
                    style={{ flex: 1, padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #c8d6ce', fontSize: '0.85rem', textTransform: 'uppercase' }}
                  />
                  <button
                    type="submit"
                    disabled={validatingCoupon || !couponCode.trim()}
                    style={{
                      backgroundColor: '#1b4332',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.5rem 0.85rem',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {validatingCoupon ? '...' : 'Apply'}
                  </button>
                </form>
              )}

              {couponError && (
                <div style={{ color: '#9b1c1c', fontSize: '0.75rem', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  <AlertCircle size={12} /> {couponError}
                </div>
              )}
            </div>

            {previewLoading ? (
              <p style={{ color: '#5c6e63' }}>Calculating summary...</p>
            ) : preview ? (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8e4', paddingBottom: '1rem' }}>
                  {preview.items.map((item) => (
                    <div key={item.product} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span style={{ color: '#2d3748', flex: 1, paddingRight: '0.5rem' }}>
                        {item.name} × {item.quantity}
                      </span>
                      <strong style={{ color: '#1b4332' }}>{siteConfig.currency}{item.subtotal.toLocaleString('en-IN')}</strong>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem', color: '#5c6e63', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Items Subtotal:</span>
                    <span>{siteConfig.currency}{preview.subtotal.toLocaleString('en-IN')}</span>
                  </div>

                  {preview.discount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#52b788', fontWeight: 600 }}>
                      <span>Coupon Discount:</span>
                      <span>-{siteConfig.currency}{preview.discount.toLocaleString('en-IN')}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Shipping Charge:</span>
                    <span>{preview.shippingCharge === 0 ? <strong style={{ color: '#52b788' }}>FREE</strong> : `${siteConfig.currency}${preview.shippingCharge}`}</span>
                  </div>

                  {preview.estimatedDeliveryDays && (
                    <div style={{ fontSize: '0.8rem', color: '#2d6a4f', backgroundColor: '#e8f5e9', padding: '0.4rem 0.6rem', borderRadius: '6px' }}>
                      🚚 Estimated Delivery: ~{preview.estimatedDeliveryDays} business days ({preview.zoneName || 'Standard'})
                    </div>
                  )}

                  {preview.freeShippingApplied && (
                    <div style={{ fontSize: '0.8rem', color: '#2d6a4f', fontWeight: 600 }}>
                      🎉 Free shipping applied to your order!
                    </div>
                  )}

                  {preview.serviceable === false && (
                    <div style={{ backgroundColor: '#ffebee', color: '#c62828', padding: '0.6rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <AlertCircle size={16} /> Destination pincode is not serviceable for delivery.
                    </div>
                  )}

                  {paymentMethod === 'COD' && preview.codAvailable === false && (
                    <div style={{ backgroundColor: '#fff3e0', color: '#e65100', padding: '0.6rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <AlertCircle size={16} /> Cash on Delivery (COD) is not available for this pincode. Please select ONLINE payment.
                    </div>
                  )}

                  {preview.tax > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Estimated Tax (GST):</span>
                      <span>{siteConfig.currency}{preview.tax}</span>
                    </div>
                  )}
                </div>

                <div style={{ borderTop: '2px solid #e2e8e4', paddingTop: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1b4332' }}>Grand Total:</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1b4332' }}>
                    {siteConfig.currency}{preview.grandTotal.toLocaleString('en-IN')}
                  </span>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  disabled={
                    processing ||
                    !selectedAddressId ||
                    preview.serviceable === false ||
                    (paymentMethod === 'COD' && preview.codAvailable === false)
                  }
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '1rem', fontSize: '1rem', fontWeight: 700, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                >
                  <ShieldCheck size={20} />
                  {processing
                    ? 'Processing Order...'
                    : preview.serviceable === false
                    ? 'Address Unserviceable'
                    : paymentMethod === 'COD' && preview.codAvailable === false
                    ? 'COD Not Available'
                    : paymentMethod === 'ONLINE'
                    ? `Pay ${siteConfig.currency}${preview.grandTotal.toLocaleString('en-IN')}`
                    : 'Confirm COD Order'}
                </button>
              </>
            ) : (
              <p style={{ color: '#5c6e63' }}>Select an address to view summary</p>
            )}
          </div>
        </div>
      </div>

      {/* Add Address Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ backgroundColor: '#fff', padding: '2rem', borderRadius: '16px', maxWidth: '500px', width: '100%' }}>
            <h3 style={{ fontSize: '1.25rem', color: '#1b4332', marginBottom: '1rem' }}>Add Shipping Address</h3>
            <form onSubmit={handleAddAddressSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#1b4332', fontWeight: 600 }}>Full Name *</label>
                  <input type="text" required value={newAddress.fullName} onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #c8d6ce' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#1b4332', fontWeight: 600 }}>Phone *</label>
                  <input type="text" required value={newAddress.phone} onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #c8d6ce' }} />
                </div>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.8rem', color: '#1b4332', fontWeight: 600 }}>Address Line 1 *</label>
                <input type="text" required value={newAddress.addressLine1} onChange={(e) => setNewAddress({ ...newAddress, addressLine1: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #c8d6ce' }} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.8rem', color: '#1b4332', fontWeight: 600 }}>Address Line 2</label>
                <input type="text" value={newAddress.addressLine2} onChange={(e) => setNewAddress({ ...newAddress, addressLine2: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #c8d6ce' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#1b4332', fontWeight: 600 }}>City *</label>
                  <input type="text" required value={newAddress.city} onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #c8d6ce' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#1b4332', fontWeight: 600 }}>State *</label>
                  <input type="text" required value={newAddress.state} onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #c8d6ce' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#1b4332', fontWeight: 600 }}>Pincode *</label>
                  <input type="text" required value={newAddress.pincode} onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #c8d6ce' }} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #c8d6ce', background: 'none' }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>Save Address</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
