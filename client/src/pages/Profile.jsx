import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import Breadcrumbs from '../components/layout/Breadcrumbs';
import ErrorState from '../components/common/ErrorState';
import { User, MapPin, Plus, Trash2, CheckCircle, LogOut } from 'lucide-react';

const Profile = () => {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Profile form state
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [profileMsg, setProfileMsg] = useState('');

  // Add Address Form state
  const [showAddAddr, setShowAddAddr] = useState(false);
  const [newAddr, setNewAddr] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    isDefault: false,
  });

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const res = await authService.getAddresses();
      setAddresses(res.data || []);
    } catch (err) {
      console.error('Failed to fetch addresses', err);
      setError('Unable to load addresses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setProfileMsg('');
      const res = await authService.updateProfile({ firstName, lastName, phone });
      setUser(res.data);
      setProfileMsg('Profile details updated successfully!');
      setTimeout(() => setProfileMsg(''), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      await authService.addAddress(newAddr);
      setShowAddAddr(false);
      setNewAddr({ fullName: user?.name || '', phone: user?.phone || '', addressLine1: '', addressLine2: '', city: '', state: '', pincode: '', isDefault: false });
      fetchAddresses();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add address');
    }
  };

  const handleDeleteAddress = async (id) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      try {
        await authService.deleteAddress(id);
        fetchAddresses();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete address');
      }
    }
  };

  return (
    <div className="container" style={{ paddingBottom: '4rem' }}>
      <Breadcrumbs items={[{ label: 'My Profile' }]} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontSize: '2rem', color: '#1b4332', margin: 0 }}>My Account &amp; Saved Addresses</h1>
        <button
          onClick={async () => {
            await logout();
            navigate('/');
          }}
          className="btn btn-outline"
          style={{
            borderColor: '#dc2626',
            color: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.5rem 1.1rem',
            borderRadius: '99px',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <LogOut size={16} /> Logout
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2.5rem' }}>
        
        {/* Left Profile Details Form */}
        <div className="glass-card" style={{ padding: '1.75rem', borderRadius: '20px', backgroundColor: '#ffffff' }}>
          <h2 style={{ fontSize: '1.25rem', color: '#1b4332', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={20} color="#2d6a4f" /> Personal Information
          </h2>

          {profileMsg && (
            <div style={{ backgroundColor: '#d8f3dc', color: '#1b4332', padding: '0.6rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle size={16} /> {profileMsg}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.85rem', color: '#5c6e63', fontWeight: 600 }}>First Name</label>
              <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #e2e8e4', marginTop: '0.2rem' }} />
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', color: '#5c6e63', fontWeight: 600 }}>Last Name</label>
              <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #e2e8e4', marginTop: '0.2rem' }} />
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', color: '#5c6e63', fontWeight: 600 }}>Email Address (Non-editable)</label>
              <input type="email" value={user?.email || ''} disabled style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #e2e8e4', backgroundColor: '#f4f6f4', color: '#8e9e94', marginTop: '0.2rem' }} />
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', color: '#5c6e63', fontWeight: 600 }}>Phone Number</label>
              <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} required style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #e2e8e4', marginTop: '0.2rem' }} />
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
              Save Profile Changes
            </button>
          </form>
        </div>

        {/* Right Saved Addresses Section */}
        <div className="glass-card" style={{ padding: '1.75rem', borderRadius: '20px', backgroundColor: '#ffffff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.25rem', color: '#1b4332', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={20} color="#2d6a4f" /> Saved Addresses
            </h2>
            <button onClick={() => setShowAddAddr(!showAddAddr)} className="btn btn-secondary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}>
              <Plus size={14} /> Add New Address
            </button>
          </div>

          {/* Add Address Form Toggle */}
          {showAddAddr && (
            <form onSubmit={handleAddAddress} style={{ backgroundColor: '#f4f6f4', padding: '1.25rem', borderRadius: '14px', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <h4 style={{ fontSize: '0.95rem', color: '#1b4332' }}>New Delivery Address</h4>
              <input type="text" placeholder="Full Recipient Name" value={newAddr.fullName} onChange={(e) => setNewAddr({ ...newAddr, fullName: e.target.value })} required style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #e2e8e4' }} />
              <input type="text" placeholder="Phone Number" value={newAddr.phone} onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })} required style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #e2e8e4' }} />
              <input type="text" placeholder="Address Line 1 (House/Flat, Street)" value={newAddr.addressLine1} onChange={(e) => setNewAddr({ ...newAddr, addressLine1: e.target.value })} required style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #e2e8e4' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <input type="text" placeholder="City" value={newAddr.city} onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })} required style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #e2e8e4' }} />
                <input type="text" placeholder="State" value={newAddr.state} onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })} required style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #e2e8e4' }} />
              </div>
              <input type="text" placeholder="6-Digit Pincode" value={newAddr.pincode} onChange={(e) => setNewAddr({ ...newAddr, pincode: e.target.value })} required style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #e2e8e4' }} />
              <label style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <input type="checkbox" checked={newAddr.isDefault} onChange={(e) => setNewAddr({ ...newAddr, isDefault: e.target.checked })} />
                Set as Default Shipping Address
              </label>
              <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem' }}>Save Address</button>
            </form>
          )}

          {/* Addresses List */}
          {addresses.length === 0 ? (
            <p style={{ color: '#8e9e94', fontSize: '0.9rem' }}>No saved addresses found. Click "Add New Address" to save one.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {addresses.map((addr) => (
                <div key={addr._id} style={{ border: '1px solid #e2e8e4', borderRadius: '12px', padding: '1rem', backgroundColor: addr.isDefault ? '#f4fbf6' : '#ffffff', position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                    <span style={{ fontWeight: 700, color: '#1b4332' }}>{addr.fullName}</span>
                    {addr.isDefault && <span style={{ backgroundColor: '#d8f3dc', color: '#1b4332', fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '99px' }}>DEFAULT</span>}
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#5c6e63', lineHeight: 1.5 }}>
                    {addr.addressLine1}, {addr.addressLine2 ? `${addr.addressLine2}, ` : ''}{addr.city}, {addr.state} - {addr.pincode}
                  </p>
                  <p style={{ fontSize: '0.8rem', color: '#8e9e94', marginTop: '0.3rem' }}>Phone: {addr.phone}</p>
                  <button onClick={() => handleDeleteAddress(addr._id)} style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }} aria-label="Delete address">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
