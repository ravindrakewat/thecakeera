import React, { useEffect, useState } from 'react';
import adminService from '../../services/adminService';
import { Save, CheckCircle, Settings, ShieldAlert, Truck, FileText } from 'lucide-react';

const AdminSettings = () => {
  const [form, setForm] = useState({
    storeName: 'The Cake Era',
    supportEmail: 'contact@thecakeera.in',
    supportPhone: '+91 98765 43210',
    currency: '₹',
    freeShippingThreshold: 499,
    defaultShippingCharge: 50,
    codAvailable: true,
    prepaidAvailable: true,
    estimatedDispatchDays: 1,
    estimatedDeliveryDays: 2,
    serviceablePincodes: '',
    excludedPincodes: '',
    legalBusinessName: 'The Cake Era Gourmet Bakery',
    gstin: '',
    stateCode: '27',
    stateName: 'Maharashtra',
    invoicePrefix: 'TCE',
    invoiceContactEmail: 'contact@thecakeera.in',
    invoiceContactPhone: '+91 98765 43210',
    pricesIncludeTax: true,
    taxRate: 0.00,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const res = await adminService.getAdminSettings();
        const d = res.data?.data || res.data;
        if (d) {
          setForm({
            storeName: d.storeName || 'Herbal E-Commerce',
            supportEmail: d.supportEmail || 'support@herbal.com',
            supportPhone: d.supportPhone || '+91 98765 43210',
            currency: d.currency || '₹',
            freeShippingThreshold: d.freeShippingThreshold !== undefined ? d.freeShippingThreshold : 999,
            defaultShippingCharge: d.defaultShippingCharge !== undefined ? d.defaultShippingCharge : 50,
            codAvailable: d.codAvailable !== false,
            prepaidAvailable: d.prepaidAvailable !== false,
            estimatedDispatchDays: d.estimatedDispatchDays || 1,
            estimatedDeliveryDays: d.estimatedDeliveryDays || 4,
            serviceablePincodes: Array.isArray(d.serviceablePincodes) ? d.serviceablePincodes.join(', ') : '',
            excludedPincodes: Array.isArray(d.excludedPincodes) ? d.excludedPincodes.join(', ') : '',
            legalBusinessName: d.legalBusinessName || 'Herbal Essence Private Limited',
            gstin: d.gstin || '',
            stateCode: d.stateCode || '27',
            stateName: d.stateName || 'Maharashtra',
            invoicePrefix: d.invoicePrefix || 'INV',
            invoiceContactEmail: d.invoiceContactEmail || 'billing@herbal.com',
            invoiceContactPhone: d.invoiceContactPhone || '+91 98765 43210',
            pricesIncludeTax: d.pricesIncludeTax !== false,
            taxRate: d.taxRate !== undefined ? d.taxRate : 0.00,
          });
        }
      } catch (err) {
        console.error('Failed to fetch store settings', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setSuccessMsg('');

      const serviceableArray = form.serviceablePincodes
        ? form.serviceablePincodes.split(',').map((p) => p.trim()).filter(Boolean)
        : [];
      const excludedArray = form.excludedPincodes
        ? form.excludedPincodes.split(',').map((p) => p.trim()).filter(Boolean)
        : [];

      await adminService.updateAdminSettings({
        storeName: form.storeName,
        supportEmail: form.supportEmail,
        supportPhone: form.supportPhone,
        currency: form.currency,
        freeShippingThreshold: Number(form.freeShippingThreshold),
        defaultShippingCharge: Number(form.defaultShippingCharge),
        codAvailable: Boolean(form.codAvailable),
        prepaidAvailable: Boolean(form.prepaidAvailable),
        estimatedDispatchDays: Number(form.estimatedDispatchDays),
        estimatedDeliveryDays: Number(form.estimatedDeliveryDays),
        serviceablePincodes: serviceableArray,
        excludedPincodes: excludedArray,
        legalBusinessName: form.legalBusinessName,
        gstin: form.gstin.trim(),
        stateCode: form.stateCode.trim(),
        stateName: form.stateName.trim(),
        invoicePrefix: form.invoicePrefix.trim(),
        invoiceContactEmail: form.invoiceContactEmail.trim(),
        invoiceContactPhone: form.invoiceContactPhone.trim(),
        pricesIncludeTax: Boolean(form.pricesIncludeTax),
        taxRate: Number(form.taxRate),
      });

      setSuccessMsg('Store, shipping, and GST configuration saved successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update store settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', color: '#5c6e63' }}>Loading store configuration...</div>;
  }

  return (
    <div style={{ maxWidth: '850px', paddingBottom: '3rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.8rem', color: '#1b4332', margin: 0 }}>Store Configuration & Settings</h1>
        <p style={{ color: '#5c6e63', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
          Configure business thresholds, shipping rules, serviceability zones, and GST invoicing
        </p>
      </div>

      {successMsg && (
        <div style={{ backgroundColor: '#d8f3dc', color: '#1b4332', padding: '0.85rem 1rem', borderRadius: '10px', marginBottom: '1.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle size={18} /> <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '1.75rem', border: '1px solid #e2e8e4', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Section 1: Store Identity */}
        <div>
          <h3 style={{ margin: '0 0 1rem', color: '#1b4332', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Settings size={20} color="#52b788" /> Store Identity & Support
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1b4332', marginBottom: '0.3rem' }}>Store Display Name</label>
              <input type="text" name="storeName" value={form.storeName} onChange={handleChange} style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #c8d6ce' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1b4332', marginBottom: '0.3rem' }}>Currency Symbol</label>
              <input type="text" name="currency" value={form.currency} onChange={handleChange} style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #c8d6ce' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1b4332', marginBottom: '0.3rem' }}>Customer Support Email</label>
              <input type="email" name="supportEmail" value={form.supportEmail} onChange={handleChange} style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #c8d6ce' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1b4332', marginBottom: '0.3rem' }}>Customer Support Phone</label>
              <input type="text" name="supportPhone" value={form.supportPhone} onChange={handleChange} style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #c8d6ce' }} />
            </div>
          </div>
        </div>

        {/* Section 2: Shipping & Delivery Configuration */}
        <div style={{ borderTop: '1px solid #e2e8e4', paddingTop: '1.25rem' }}>
          <h3 style={{ margin: '0 0 1rem', color: '#1b4332', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Truck size={20} color="#52b788" /> Shipping & Fulfillment Engine
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1b4332', marginBottom: '0.3rem' }}>Free Shipping Threshold (₹)</label>
              <input type="number" min="0" name="freeShippingThreshold" value={form.freeShippingThreshold} onChange={handleChange} style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #c8d6ce' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1b4332', marginBottom: '0.3rem' }}>Default Standard Shipping Charge (₹)</label>
              <input type="number" min="0" name="defaultShippingCharge" value={form.defaultShippingCharge} onChange={handleChange} style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #c8d6ce' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1b4332', marginBottom: '0.3rem' }}>Estimated Dispatch Window (Days)</label>
              <input type="number" min="0" name="estimatedDispatchDays" value={form.estimatedDispatchDays} onChange={handleChange} style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #c8d6ce' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1b4332', marginBottom: '0.3rem' }}>Estimated Delivery Window (Days)</label>
              <input type="number" min="0" name="estimatedDeliveryDays" value={form.estimatedDeliveryDays} onChange={handleChange} style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #c8d6ce' }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: '#1b4332', cursor: 'pointer' }}>
              <input type="checkbox" name="codAvailable" checked={form.codAvailable} onChange={handleChange} />
              <span>Enable Cash on Delivery (COD)</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: '#1b4332', cursor: 'pointer' }}>
              <input type="checkbox" name="prepaidAvailable" checked={form.prepaidAvailable} onChange={handleChange} />
              <span>Enable Online Prepaid Checkout</span>
            </label>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1b4332', marginBottom: '0.3rem' }}>Serviceable Pincodes (Optional whitelist, comma-separated e.g. 400*, 110001)</label>
            <input type="text" name="serviceablePincodes" value={form.serviceablePincodes} onChange={handleChange} placeholder="Leave blank to serve all valid 6-digit Indian pincodes" style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #c8d6ce', fontSize: '0.85rem' }} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1b4332', marginBottom: '0.3rem' }}>Excluded / Blocked Pincodes (Optional blacklist, comma-separated)</label>
            <input type="text" name="excludedPincodes" value={form.excludedPincodes} onChange={handleChange} placeholder="e.g. 790001, 792*" style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #c8d6ce', fontSize: '0.85rem' }} />
          </div>
        </div>

        {/* Section 3: GST & Tax Invoicing */}
        <div style={{ borderTop: '1px solid #e2e8e4', paddingTop: '1.25rem' }}>
          <h3 style={{ margin: '0 0 1rem', color: '#1b4332', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={20} color="#52b788" /> GST & Tax Invoice Settings
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1b4332', marginBottom: '0.3rem' }}>Legal Registered Business Name</label>
              <input type="text" name="legalBusinessName" value={form.legalBusinessName} onChange={handleChange} style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #c8d6ce' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1b4332', marginBottom: '0.3rem' }}>GSTIN (Leave blank if unregistered / composite)</label>
              <input type="text" name="gstin" value={form.gstin} onChange={handleChange} placeholder="e.g. 27AAAAA0000A1Z5" style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #c8d6ce', textTransform: 'uppercase' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1b4332', marginBottom: '0.3rem' }}>Seller State Code</label>
              <input type="text" name="stateCode" value={form.stateCode} onChange={handleChange} placeholder="e.g. 27" style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #c8d6ce' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1b4332', marginBottom: '0.3rem' }}>Seller State Name</label>
              <input type="text" name="stateName" value={form.stateName} onChange={handleChange} placeholder="e.g. Maharashtra" style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #c8d6ce' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1b4332', marginBottom: '0.3rem' }}>Invoice Number Prefix</label>
              <input type="text" name="invoicePrefix" value={form.invoicePrefix} onChange={handleChange} placeholder="e.g. INV" style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #c8d6ce', textTransform: 'uppercase' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1b4332', marginBottom: '0.3rem' }}>Billing / Invoice Contact Email</label>
              <input type="email" name="invoiceContactEmail" value={form.invoiceContactEmail} onChange={handleChange} style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #c8d6ce' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1b4332', marginBottom: '0.3rem' }}>Billing Contact Phone</label>
              <input type="text" name="invoiceContactPhone" value={form.invoiceContactPhone} onChange={handleChange} style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #c8d6ce' }} />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input type="checkbox" id="taxInc" name="pricesIncludeTax" checked={form.pricesIncludeTax} onChange={handleChange} />
            <label htmlFor="taxInc" style={{ fontSize: '0.9rem', color: '#1b4332', cursor: 'pointer' }}>
              Prices on storefront are GST tax-inclusive (Standard retail pricing model)
            </label>
          </div>
        </div>

        <div style={{ backgroundColor: '#fff3cd', color: '#856404', padding: '0.85rem', borderRadius: '10px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldAlert size={18} />
          <span>Manual shipping mode is active. Courier credentials & gateway secrets remain protected on the server environment.</span>
        </div>

        <button
          type="submit"
          disabled={saving}
          style={{ backgroundColor: '#1b4332', color: '#fff', padding: '0.85rem 1.5rem', borderRadius: '10px', border: 'none', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem' }}
        >
          <Save size={18} /> {saving ? 'Saving Configurations...' : 'Save All Configurations'}
        </button>
      </form>
    </div>
  );
};

export default AdminSettings;
