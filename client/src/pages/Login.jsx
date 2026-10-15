import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Leaf, Mail, Lock, AlertCircle, ArrowRight, CheckCircle } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!formData.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errs.email = 'Enter a valid email address';
    if (!formData.password) errs.password = 'Password is required';
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
      const res = await login(formData);
      if (res?.data?.user?.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '85vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
      background: 'linear-gradient(135deg, #f0f7f4 0%, #faf9f5 50%, #e8f5e9 100%)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Decorative blobs */}
      <div style={{
        position: 'absolute', top: '-80px', right: '-80px', width: '320px', height: '320px',
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(82,183,136,0.18) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-60px', left: '-60px', width: '260px', height: '260px',
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(45,106,79,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: '460px', position: 'relative', zIndex: 1 }}>
        {/* Logo / Brand */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '1rem',
          }}>
            <img src="/logo.png" alt="The Cake Era" style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #d4af37', boxShadow: '0 8px 24px rgba(7,40,24,0.25)' }} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-heading)', color: 'var(--primary-deep)', marginBottom: '0.25rem' }}>
            Welcome Back
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Sign in to your The Cake Era account
          </p>
        </div>

        {/* Card */}
        <div className="glass-card" style={{ padding: '2.25rem 2rem' }}>
          {/* Global error */}
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
            {/* Email Field */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label htmlFor="login-email" style={{
                display: 'block', fontSize: '0.875rem', fontWeight: 600,
                color: 'var(--text-main)', marginBottom: '0.5rem',
              }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{
                  position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                  color: fieldErrors.email ? '#c0392b' : 'var(--text-muted)',
                }} />
                <input
                  id="login-email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  autoComplete="email"
                  style={{
                    width: '100%', padding: '0.8rem 0.875rem 0.8rem 2.75rem',
                    border: `1.5px solid ${fieldErrors.email ? '#e74c3c' : 'var(--border-light)'}`,
                    borderRadius: '10px', fontSize: '0.95rem',
                    fontFamily: 'var(--font-body)', color: 'var(--text-main)',
                    background: 'rgba(255,255,255,0.8)', outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#40916c';
                    e.target.style.boxShadow = '0 0 0 3px rgba(64,145,108,0.12)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = fieldErrors.email ? '#e74c3c' : 'var(--border-light)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              {fieldErrors.email && (
                <p style={{ color: '#c0392b', fontSize: '0.8rem', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <AlertCircle size={12} /> {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div style={{ marginBottom: '0.75rem' }}>
              <label htmlFor="login-password" style={{
                display: 'block', fontSize: '0.875rem', fontWeight: 600,
                color: 'var(--text-main)', marginBottom: '0.5rem',
              }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{
                  position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                  color: fieldErrors.password ? '#c0392b' : 'var(--text-muted)',
                }} />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  style={{
                    width: '100%', padding: '0.8rem 2.75rem 0.8rem 2.75rem',
                    border: `1.5px solid ${fieldErrors.password ? '#e74c3c' : 'var(--border-light)'}`,
                    borderRadius: '10px', fontSize: '0.95rem',
                    fontFamily: 'var(--font-body)', color: 'var(--text-main)',
                    background: 'rgba(255,255,255,0.8)', outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#40916c';
                    e.target.style.boxShadow = '0 0 0 3px rgba(64,145,108,0.12)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = fieldErrors.password ? '#e74c3c' : 'var(--border-light)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
                    padding: '4px', display: 'flex', alignItems: 'center',
                  }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {fieldErrors.password && (
                <p style={{ color: '#c0392b', fontSize: '0.8rem', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <AlertCircle size={12} /> {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Forgot Password */}
            <div style={{ textAlign: 'right', marginBottom: '1.5rem' }}>
              <Link to="/forgot-password" style={{
                fontSize: '0.875rem', color: 'var(--primary-light)', fontWeight: 500,
                textDecoration: 'none',
              }}>
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <button
              id="login-submit-btn"
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
                  Signing In…
                </>
              ) : (
                <>Sign In <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.5rem 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-light)' }} />
            <span style={{ color: 'var(--text-light)', fontSize: '0.8rem' }}>Don't have an account?</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-light)' }} />
          </div>

          {/* Register Link */}
          <Link
            to="/register"
            id="go-to-register-link"
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
            Create New Account
          </Link>
        </div>

        {/* Trust badges */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '1.5rem' }}>
          {['SSL Secured', '100% Natural', 'Trusted Store'].map((label) => (
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

export default Login;
