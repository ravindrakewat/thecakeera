import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Eye, EyeOff, Leaf, Mail, Lock, User, Phone,
  AlertCircle, ArrowRight, CheckCircle, ShieldCheck,
} from 'lucide-react';

const passwordStrength = (pw) => {
  if (!pw) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const map = [
    { label: 'Too short', color: '#e74c3c' },
    { label: 'Weak', color: '#e67e22' },
    { label: 'Fair', color: '#f1c40f' },
    { label: 'Good', color: '#2ecc71' },
    { label: 'Strong', color: '#27ae60' },
  ];
  return { score, ...map[score] };
};

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [agreed, setAgreed] = useState(false);

  const strength = passwordStrength(formData.password);

  const validate = () => {
    const errs = {};
    if (!formData.firstName.trim()) errs.firstName = 'First name is required';
    if (!formData.lastName.trim()) errs.lastName = 'Last name is required';
    if (!formData.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errs.email = 'Enter a valid email address';
    if (!formData.phone.trim()) errs.phone = 'Phone number is required';
    else if (!/^[6-9]\d{9}$/.test(formData.phone.trim())) errs.phone = 'Enter a valid 10-digit Indian phone number';
    if (!formData.password) errs.password = 'Password is required';
    else if (formData.password.length < 8) errs.password = 'Password must be at least 8 characters';
    if (!formData.confirmPassword) errs.confirmPassword = 'Please confirm your password';
    else if (formData.password !== formData.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (!agreed) errs.agreed = 'You must agree to continue';
    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    setLoading(true);
    setError('');
    try {
      await register({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        password: formData.password,
      });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (field) => ({
    width: '100%',
    padding: '0.8rem 0.875rem 0.8rem 2.75rem',
    border: `1.5px solid ${fieldErrors[field] ? '#e74c3c' : 'var(--border-light)'}`,
    borderRadius: '10px',
    fontSize: '0.95rem',
    fontFamily: 'var(--font-body)',
    color: 'var(--text-main)',
    background: 'rgba(255,255,255,0.8)',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  });

  const iconStyle = (field) => ({
    position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
    color: fieldErrors[field] ? '#c0392b' : 'var(--text-muted)',
  });

  const onFocus = (e) => {
    e.target.style.borderColor = '#40916c';
    e.target.style.boxShadow = '0 0 0 3px rgba(64,145,108,0.12)';
  };
  const onBlur = (e, field) => {
    e.target.style.borderColor = fieldErrors[field] ? '#e74c3c' : 'var(--border-light)';
    e.target.style.boxShadow = 'none';
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      padding: '3rem 1rem',
      background: 'linear-gradient(135deg, #f0f7f4 0%, #faf9f5 50%, #e8f5e9 100%)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Decorative blobs */}
      <div style={{
        position: 'fixed', top: '-80px', right: '-80px', width: '320px', height: '320px',
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(82,183,136,0.18) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />
      <div style={{
        position: 'fixed', bottom: '-60px', left: '-60px', width: '260px', height: '260px',
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(45,106,79,0.12) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      <div style={{ width: '100%', maxWidth: '480px', position: 'relative', zIndex: 1 }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '1rem',
          }}>
            <img src="/logo.png" alt="The Cake Era" style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #d4af37', boxShadow: '0 8px 24px rgba(7,40,24,0.25)' }} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-heading)', color: 'var(--primary-deep)', marginBottom: '0.25rem' }}>
            Create Account
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Join The Cake Era family for special celebration delights
          </p>
        </div>

        {/* Card */}
        <div className="glass-card" style={{ padding: '2.25rem 2rem' }}>
          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.6rem',
              padding: '0.875rem 1rem', borderRadius: '10px',
              background: 'rgba(220,53,69,0.08)', border: '1px solid rgba(220,53,69,0.2)',
              color: '#c0392b', fontSize: '0.9rem', marginBottom: '1.5rem',
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* First + Last Name Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              {/* First Name */}
              <div>
                <label htmlFor="reg-firstName" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                  First Name
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={iconStyle('firstName')} />
                  <input
                    id="reg-firstName"
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Rahul"
                    autoComplete="given-name"
                    style={inputStyle('firstName')}
                    onFocus={onFocus}
                    onBlur={(e) => onBlur(e, 'firstName')}
                  />
                </div>
                {fieldErrors.firstName && (
                  <p style={{ color: '#c0392b', fontSize: '0.78rem', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <AlertCircle size={11} /> {fieldErrors.firstName}
                  </p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label htmlFor="reg-lastName" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                  Last Name
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={iconStyle('lastName')} />
                  <input
                    id="reg-lastName"
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Sharma"
                    autoComplete="family-name"
                    style={inputStyle('lastName')}
                    onFocus={onFocus}
                    onBlur={(e) => onBlur(e, 'lastName')}
                  />
                </div>
                {fieldErrors.lastName && (
                  <p style={{ color: '#c0392b', fontSize: '0.78rem', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <AlertCircle size={11} /> {fieldErrors.lastName}
                  </p>
                )}
              </div>
            </div>

            {/* Email */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label htmlFor="reg-email" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={iconStyle('email')} />
                <input
                  id="reg-email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  autoComplete="email"
                  style={inputStyle('email')}
                  onFocus={onFocus}
                  onBlur={(e) => onBlur(e, 'email')}
                />
              </div>
              {fieldErrors.email && (
                <p style={{ color: '#c0392b', fontSize: '0.78rem', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <AlertCircle size={11} /> {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Phone */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label htmlFor="reg-phone" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                Mobile Number
              </label>
              <div style={{ position: 'relative' }}>
                <Phone size={16} style={iconStyle('phone')} />
                <input
                  id="reg-phone"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="9876543210"
                  autoComplete="tel"
                  maxLength={10}
                  style={inputStyle('phone')}
                  onFocus={onFocus}
                  onBlur={(e) => onBlur(e, 'phone')}
                />
              </div>
              {fieldErrors.phone && (
                <p style={{ color: '#c0392b', fontSize: '0.78rem', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <AlertCircle size={11} /> {fieldErrors.phone}
                </p>
              )}
            </div>

            {/* Password */}
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="reg-password" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={iconStyle('password')} />
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                  style={{ ...inputStyle('password'), paddingRight: '2.75rem' }}
                  onFocus={onFocus}
                  onBlur={(e) => onBlur(e, 'password')}
                />
                <button type="button" onClick={() => setShowPassword(v => !v)} style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px',
                }} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {/* Password Strength Meter */}
              {formData.password && (
                <div style={{ marginTop: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} style={{
                        flex: 1, height: '4px', borderRadius: '2px',
                        background: i <= strength.score ? strength.color : 'var(--border-light)',
                        transition: 'background 0.3s',
                      }} />
                    ))}
                  </div>
                  <p style={{ fontSize: '0.78rem', color: strength.color, fontWeight: 500 }}>
                    {strength.label}
                  </p>
                </div>
              )}
              {fieldErrors.password && (
                <p style={{ color: '#c0392b', fontSize: '0.78rem', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <AlertCircle size={11} /> {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="reg-confirm" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                Confirm Password
              </label>
              <div style={{ position: 'relative' }}>
                <ShieldCheck size={16} style={iconStyle('confirmPassword')} />
                <input
                  id="reg-confirm"
                  type={showConfirm ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  style={{ ...inputStyle('confirmPassword'), paddingRight: '2.75rem' }}
                  onFocus={onFocus}
                  onBlur={(e) => onBlur(e, 'confirmPassword')}
                />
                <button type="button" onClick={() => setShowConfirm(v => !v)} style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px',
                }} aria-label={showConfirm ? 'Hide' : 'Show'}>
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p style={{ color: '#c0392b', fontSize: '0.78rem', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <AlertCircle size={11} /> {fieldErrors.confirmPassword}
                </p>
              )}
              {formData.confirmPassword && formData.password === formData.confirmPassword && (
                <p style={{ color: '#27ae60', fontSize: '0.78rem', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <CheckCircle size={11} /> Passwords match
                </p>
              )}
            </div>

            {/* Terms */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  id="reg-agree"
                  checked={agreed}
                  onChange={(e) => {
                    setAgreed(e.target.checked);
                    if (fieldErrors.agreed) setFieldErrors((p) => ({ ...p, agreed: '' }));
                  }}
                  style={{ marginTop: '3px', accentColor: '#2d6a4f', width: '16px', height: '16px', cursor: 'pointer', flexShrink: 0 }}
                />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  I agree to the{' '}
                  <Link to="/terms" style={{ color: 'var(--primary-light)', fontWeight: 500 }}>Terms of Service</Link>
                  {' '}and{' '}
                  <Link to="/privacy" style={{ color: 'var(--primary-light)', fontWeight: 500 }}>Privacy Policy</Link>
                </span>
              </label>
              {fieldErrors.agreed && (
                <p style={{ color: '#c0392b', fontSize: '0.78rem', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <AlertCircle size={11} /> {fieldErrors.agreed}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              id="register-submit-btn"
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '0.9rem 1.5rem',
                background: loading
                  ? 'rgba(45,106,79,0.6)'
                  : 'linear-gradient(135deg, #2d6a4f 0%, #1b4332 100%)',
                color: '#ffffff', border: 'none', borderRadius: '10px',
                fontFamily: 'var(--font-body)', fontSize: '1rem', fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                boxShadow: loading ? 'none' : '0 4px 14px rgba(27,67,50,0.3)',
                transition: 'all 0.25s ease',
              }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
            >
              {loading ? (
                <>
                  <span style={{
                    width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.4)',
                    borderTopColor: '#fff', borderRadius: '50%',
                    animation: 'spin 0.7s linear infinite', display: 'inline-block',
                  }} />
                  Creating Account…
                </>
              ) : (
                <>Create Account <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          {/* Login link */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.5rem 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-light)' }} />
            <span style={{ color: 'var(--text-light)', fontSize: '0.8rem' }}>Already have an account?</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-light)' }} />
          </div>

          <Link
            to="/login"
            id="go-to-login-link"
            style={{
              display: 'block', textAlign: 'center', padding: '0.8rem 1.5rem',
              border: '1.5px solid var(--primary)', borderRadius: '10px',
              color: 'var(--primary)', fontWeight: 600, fontSize: '0.95rem',
              textDecoration: 'none', transition: 'all 0.25s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--primary)';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--primary)';
            }}
          >
            Sign In Instead
          </Link>
        </div>

        {/* Trust badges */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '1.5rem' }}>
          {['SSL Secured', 'Free Shipping', 'Easy Returns'].map((label) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
              <CheckCircle size={13} color="#40916c" />
              {label}
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default Register;
