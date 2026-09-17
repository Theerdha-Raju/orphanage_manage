import React, { useState } from 'react';
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import GoogleSignInButton from '../components/GoogleSignInButton';
import { requestApi } from '../apiConfig';
import './LoginPage.css';

const roles = [
  { value: 'admin',     label: 'Administrator',   icon: 'bi-shield-lock-fill',   color: '#2563eb', email: 'admin@orphanage.com',     password: 'Admin@123', name: 'Alexander Wright' },
  { value: 'staff',     label: 'Caregiver/Staff', icon: 'bi-person-workspace',   color: '#10b981', email: 'staff@orphanage.com',     password: 'Staff@123', name: 'Sarah Jenkins' },
  { value: 'donor',     label: 'Donor/Sponsor',   icon: 'bi-heart-fill',         color: '#f59e0b', email: 'donor@orphanage.com',     password: 'Donor@123', name: 'Eleanor Vance' },
  { value: 'volunteer', label: 'Volunteer',       icon: 'bi-people-fill',        color: '#8b5cf6', email: 'volunteer@orphanage.com', password: 'Volunteer@123', name: 'Marcus Brody' },
  { value: 'child',     label: 'Student',         icon: 'bi-star-fill',          color: '#06b6d4', email: 'student@orphanage.com',   password: 'Student@123', name: 'Leo Carter' },
];

export default function LoginPage() {
  const [role, setRole]         = useState('admin');
  const [email, setEmail]       = useState('admin@orphanage.com');
  const [password, setPassword] = useState('Admin@123');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPwd, setShowPwd]   = useState(false);
  const [hideFullName, setHideFullName] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const navigate  = useNavigate();
  const location  = useLocation();

  const currentRoleObj = roles.find(r => r.value === role) || roles[0];

  const maskName = (str) => {
    if (!str) return '';
    return str.split(' ').map(word => word[0] + '*'.repeat(Math.max(1, word.length - 1))).join(' ');
  };


  // Already logged-in? Send to their dashboard immediately.
  const existingRole = localStorage.getItem('userRole');
  const existingId   = localStorage.getItem('userId');
  if (existingRole && existingId) {
    const roleHome = {
      admin:     '/admin-dashboard',
      staff:     '/staff-dashboard',
      teacher:   '/staff-dashboard',
      doctor:    '/staff-dashboard',
      donor:     '/donor-dashboard',
      volunteer: '/volunteer-dashboard',
      child:     '/child-dashboard',
    };
    return <Navigate to={roleHome[existingRole] || '/staff-dashboard'} replace />;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res  = await requestApi('/api/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        localStorage.setItem('userRole',  data.role);
        localStorage.setItem('userId',    data.user_id);
        localStorage.setItem('userName',  data.name);
        localStorage.setItem('userEmail', email);

        if (window.PasswordCredential) {
          try {
            const cred = new window.PasswordCredential({ id: email, password });
            await navigator.credentials.store(cred);
          } catch (_) { /* browser fallback */ }
        }

        setTimeout(() => {
          setLoading(false);
          const from = location.state?.from?.pathname;
          const routes = {
            admin: '/admin-dashboard',
            staff: '/staff-dashboard',
            teacher: '/staff-dashboard',
            doctor: '/staff-dashboard',
            donor: '/donor-dashboard',
            volunteer: '/volunteer-dashboard',
            child: '/child-dashboard',
          };
          const defaultRoute = routes[data.role] || '/staff-dashboard';
          navigate(from || defaultRoute, { replace: true });
        }, 600);
      } else {
        setError(data.error || 'Invalid email or password.');
        setLoading(false);
      }
    } catch {
      setError('Unable to connect to server. Please ensure the backend is running.');
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (googleData) => {
    setLoading(true);
    setError('');

    try {
      const res = await requestApi('/api/auth/google/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credential: googleData.credential,
          email: googleData.email,
          name: googleData.name,
          role: role
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        localStorage.setItem('userRole',  data.role);
        localStorage.setItem('userId',    data.user_id);
        localStorage.setItem('userName',  data.name);
        localStorage.setItem('userEmail', data.email);

        setTimeout(() => {
          setLoading(false);
          const from = location.state?.from?.pathname;
          const routes = {
            admin: '/admin-dashboard', staff: '/staff-dashboard',
            donor: '/donor-dashboard', volunteer: '/volunteer-dashboard',
          };
          const defaultRoute = routes[data.role] || '/child-dashboard';
          navigate(from || defaultRoute, { replace: true });
        }, 600);
      } else {
        setError(data.error || 'Google login failed.');
        setLoading(false);
      }
    } catch {
      setError('Unable to connect to server for Google login.');
      setLoading(false);
    }
  };

  return (
    <div className="orphanage-auth-wrapper">
      {/* ──────────────── Left Visual Branding Pane ──────────────── */}
      <div
        className="orphanage-left-pane"
        style={{ backgroundImage: `url('/orphanage_figma_bg.jpg')` }}
      >
        <div className="orphanage-left-overlay" />
        <div className="orphanage-orb orphanage-orb-1" />
        <div className="orphanage-orb orphanage-orb-2" />


        {/* 1. Top Bar with Live Telemetry / Care Status Pills */}
        <div className="orphanage-top-bar">
          <div className="orphanage-telemetry-pills">
            <div className="orphanage-pill">
              <i className="bi bi-people-fill" style={{ color: '#60a5fa' }} />
              <span>500+ Children</span>
            </div>
            <div className="orphanage-pill">
              <i className="bi bi-heart-pulse-fill" style={{ color: '#f87171' }} />
              <span>98% Health Index</span>
            </div>
            <div className="orphanage-pill">
              <i className="bi bi-mortarboard-fill" style={{ color: '#4ade80' }} />
              <span>94% Academic</span>
            </div>
          </div>

          <div className="orphanage-live-badge">
            <span className="orphanage-live-dot" />
            Shelter Active
          </div>
        </div>

        {/* 2. Middle 3 Floating Glassmorphic Cards */}
        <div className="orphanage-cards-grid">
          {/* Card 1: Academic & Skills Progress */}
          <div className="orphanage-glass-card">
            <div className="orphanage-card-label">
              <span>Academic Score</span>
              <i className="bi bi-graph-up-arrow" style={{ color: '#60a5fa' }} />
            </div>
            <div className="orphanage-gauge-wrapper">
              <svg width="74" height="74" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#e2e8f0"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="url(#blueVioletGrad)"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray="251.2"
                  strokeDashoffset="35"
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
                <defs>
                  <linearGradient id="blueVioletGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#2563eb" />
                    <stop offset="100%" stopColor="#60a5fa" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="orphanage-gauge-val">94%</div>
            </div>
            <div className="orphanage-card-sub">
              <span style={{ color: '#4ade80', fontWeight: 700 }}>● Optimal</span>
              <span>• 120 Enrolled</span>
            </div>
          </div>

          {/* Card 2: Essential Rations & Supplies */}
          <div className="orphanage-glass-card">
            <div className="orphanage-card-label">
              <span>Monthly Rations</span>
              <i className="bi bi-box-seam" style={{ color: '#fbbf24' }} />
            </div>
            <div className="orphanage-low-badge">LOW</div>
            <div className="orphanage-sparkline">
              <div className="orphanage-sparkline-bar" style={{ height: '70%' }} />
              <div className="orphanage-sparkline-bar" style={{ height: '85%' }} />
              <div className="orphanage-sparkline-bar" style={{ height: '60%' }} />
              <div className="orphanage-sparkline-bar" style={{ height: '45%', background: '#fbbf24' }} />
              <div className="orphanage-sparkline-bar" style={{ height: '30%', background: '#f87171' }} />
              <div className="orphanage-sparkline-bar" style={{ height: '22%', background: '#ef4444' }} />
            </div>
            <div className="orphanage-card-sub">
              <i className="bi bi-clock-history" style={{ color: '#fbbf24', fontSize: '0.65rem' }} />
              <span>Restock in 2 days</span>
            </div>
          </div>

          {/* Card 3: Healthcare & Wellness Monitoring */}
          <div className="orphanage-glass-card">
            <div className="orphanage-card-label">
              <span>Health Tracking</span>
              <i className="bi bi-shield-plus" style={{ color: '#4ade80' }} />
            </div>
            <div className="orphanage-active-badge">
              <i className="bi bi-check-circle-fill" /> Active
            </div>
            <div className="orphanage-dot-meter">
              <div className="orphanage-meter-dot on" />
              <div className="orphanage-meter-dot on" />
              <div className="orphanage-meter-dot on" />
              <div className="orphanage-meter-dot on" />
              <div className="orphanage-meter-dot green" />
            </div>
            <div className="orphanage-card-sub">
              <i className="bi bi-shield-check" style={{ fontSize: '0.65rem', color: '#4ade80' }} />
              <span>0 Critical Cases</span>
            </div>
          </div>
        </div>

        {/* 3. Bottom Hero Branding */}
        <div className="orphanage-bottom-meta">
          <div className="orphanage-feature-row">
            <div className="orphanage-feature-item">
              <i className="bi bi-stars" />
              <span>AI Health & Growth Tracking</span>
            </div>
            <div className="orphanage-feature-item">
              <i className="bi bi-heart-fill" />
              <span>Verified Donors & Sponsors</span>
            </div>
            <div className="orphanage-feature-item">
              <i className="bi bi-mortarboard-fill" />
              <span>Academic Mentorship</span>
            </div>
          </div>

          <h1 className="orphanage-hero-title">Welcome to HopeNest</h1>
          <p className="orphanage-hero-desc">
            Empowering every child with personalized care, education, healthcare tracking, and community support.
          </p>
        </div>
      </div>

      {/* ──────────────── Right Login Form Pane ──────────────── */}
      <div className="orphanage-right-pane">
        <div className="orphanage-login-card">
          {/* Header with App Logo */}
          <div className="orphanage-card-header">
            <Link to="/" style={{ textDecoration: 'none' }}>
              <div className="orphanage-brand-badge">
                <div className="orphanage-brand-icon">
                  <i className="bi bi-house-heart-fill" />
                </div>
                <span>HopeNest</span>
              </div>
            </Link>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
              <i className="bi bi-patch-check-fill text-primary me-1" />Portal v2.4
            </span>
          </div>

          {/* Central Login Avatar Badge */}
          <div className="orphanage-login-avatar-wrap">
            <div className="orphanage-avatar-box">
              <i className="bi bi-shield-lock-fill" />
            </div>
            <h2 className="orphanage-title">Login</h2>
            <p className="orphanage-subtitle">
              Sign in with your credentials to access the child management portal.
            </p>
          </div>

          {/* Role Preset Selector */}
          <div className="orphanage-role-selector">
            {roles.map(r => (
              <button
                key={r.value}
                type="button"
                className={`orphanage-role-btn ${role === r.value ? 'active' : ''}`}
                onClick={() => {
                  setRole(r.value);
                  setEmail(r.email);
                  setPassword(r.password);
                  setError('');
                }}
              >
                <i className={`bi ${r.icon}`} style={{ color: role === r.value ? r.color : '#94a3b8' }} />
                {r.label.split('/')[0]}
              </button>
            ))}
          </div>


          {/* Error Message */}
          {error && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              padding: '0.65rem 0.9rem',
              borderRadius: '0.75rem',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem'
            }}>
              <i className="bi bi-exclamation-octagon-fill" />
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} autoComplete="on">
            <div className="orphanage-form-group">
              <label className="orphanage-form-label">Email Address</label>
              <div className="orphanage-input-wrapper">
                <i className="bi bi-envelope orphanage-input-icon" />
                <input
                  type="email"
                  name="email"
                  autoComplete="username"
                  className="orphanage-input"
                  placeholder="Enter your email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="orphanage-form-group">
              <label className="orphanage-form-label">Password</label>
              <div className="orphanage-input-wrapper">
                <i className="bi bi-lock orphanage-input-icon" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  className="orphanage-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="orphanage-eye-btn"
                  onClick={() => setShowPwd(!showPwd)}
                  aria-label="Toggle password visibility"
                >
                  <i className={`bi ${showPwd ? 'bi-eye-slash' : 'bi-eye'}`} />
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="orphanage-options-row">
              <label className="orphanage-checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="orphanage-checkbox"
                />
                Remember me
              </label>
              <Link to="/forgot-password" className="orphanage-forgot-link">
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="orphanage-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Login to Dashboard</span>
                  <i className="bi bi-arrow-right" />
                </>
              )}
            </button>
          </form>

          {/* Social Divider */}
          <div className="orphanage-divider">
            <div className="orphanage-divider-line" />
            <span className="orphanage-divider-text">Or continue with</span>
            <div className="orphanage-divider-line" />
          </div>

          {/* Google Sign In Button */}
          <GoogleSignInButton
            onSuccess={handleGoogleSuccess}
            onError={(err) => setError(err)}
            role={role}
            disabled={loading}
          />

          {/* Register Link */}
          <div className="orphanage-footer-text">
            <span>Don't have an account?</span>
            <Link to="/register" className="orphanage-register-link">
              Create an account
            </Link>
          </div>

          <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
            <Link to="/" className="orphanage-home-link">
              <i className="bi bi-arrow-left" />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
