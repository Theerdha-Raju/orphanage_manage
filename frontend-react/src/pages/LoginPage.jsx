import React, { useState } from 'react';
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import GoogleSignInButton from '../components/GoogleSignInButton';

const roles = [
  { value: 'admin',     label: 'Administrator',   icon: 'bi-shield-lock-fill',   color: '#60a5fa', email: 'admin@orphanage.com',     password: 'Admin@123' },
  { value: 'staff',     label: 'Caregiver/Staff', icon: 'bi-person-workspace',   color: '#4ade80', email: '',                        password: '' },
  { value: 'donor',     label: 'Donor/Sponsor',   icon: 'bi-heart-fill',         color: '#fbbf24', email: '',                        password: '' },
  { value: 'volunteer', label: 'Volunteer',       icon: 'bi-people-fill',        color: '#a78bfa', email: '',                        password: '' },
  { value: 'child',     label: 'Student',         icon: 'bi-star-fill',          color: '#22d3ee', email: '',                        password: '' },
];

export default function LoginPage() {
  const [role, setRole]         = useState('admin');
  const [email, setEmail]       = useState('admin@orphanage.com');
  const [password, setPassword] = useState('Admin@123');
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const navigate  = useNavigate();
  const location  = useLocation();

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
      const res  = await fetch('http://localhost:8000/api/auth/login/', {
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

        // Tell the browser to save these credentials (triggers "Save password?" prompt)
        if (window.PasswordCredential) {
          try {
            const cred = new window.PasswordCredential({ id: email, password });
            await navigator.credentials.store(cred);
          } catch (_) { /* silently ignore if browser doesn't support */ }
        }

        setTimeout(() => {
          setLoading(false);
          // Go back to where they tried to visit, or fall back to their home
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
        }, 700);
      } else {
        setError(data.error || 'Invalid email or password.');
        setLoading(false);
      }
    } catch {
      setError('Unable to connect to server. Please try again.');
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (googleData) => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('http://localhost:8000/api/auth/google/', {
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
        }, 700);
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
    <div className="auth-wrapper">
      {/* Left */}
      <div className="auth-left" style={{ justifyContent: 'space-between' }}>
        <div className="auth-left-orb auth-left-orb-1" />
        <div className="auth-left-orb auth-left-orb-2" />

        {/* Logo — top section */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', position: 'relative', zIndex: 2 }}>
          <div style={{ width: 42, height: 42, background: 'linear-gradient(135deg, #2563eb, #7c3aed)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', color: '#fff', flexShrink: 0, boxShadow: '0 4px 15px rgba(37,99,235,0.4)' }}>
            <i className="bi bi-house-heart-fill" />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)', lineHeight: 1.2 }}>Orphanage Management</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>Caring for Every Child</div>
          </div>
        </Link>

        {/* Middle — Student Image Card */}
        <div style={{ position: 'relative', zIndex: 1, flex: '0 0 auto' }}>
          <div style={{
            borderRadius: '1.5rem',
            overflow: 'hidden',
            boxShadow: '0 25px 70px rgba(0,0,0,0.5)',
            border: '1.5px solid rgba(255,255,255,0.1)',
            position: 'relative',
            height: 240,
          }}>
            <img
              src="/login-students.png"
              alt="Happy orphanage children smiling together"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center 30%',
                display: 'block',
                filter: 'brightness(0.88) saturate(1.15) contrast(1.05)',
              }}
            />
            {/* Top tint */}
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0,
              height: '35%',
              background: 'linear-gradient(to bottom, rgba(10,14,26,0.55) 0%, transparent 100%)',
            }} />
            {/* Bottom gradient */}
            <div style={{
              position: 'absolute',
              bottom: 0, left: 0, right: 0,
              height: '50%',
              background: 'linear-gradient(to top, rgba(10,14,26,0.85) 0%, transparent 100%)',
            }} />
            {/* Top-right floating badge */}
            <div style={{
              position: 'absolute',
              top: '0.85rem',
              right: '0.85rem',
              background: 'rgba(16,185,129,0.92)',
              backdropFilter: 'blur(8px)',
              borderRadius: '2rem',
              padding: '0.3rem 0.8rem',
              fontSize: '0.68rem',
              fontWeight: 700,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', display: 'inline-block', animation: 'pulse 2s infinite' }} />
              Live Updates
            </div>
            {/* Bottom badges */}
            <div style={{
              position: 'absolute',
              bottom: '0.9rem',
              left: '0.9rem',
              right: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span style={{
                background: 'rgba(34,197,94,0.88)',
                backdropFilter: 'blur(6px)',
                borderRadius: '2rem',
                padding: '0.3rem 0.8rem',
                fontSize: '0.7rem',
                fontWeight: 700,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                boxShadow: '0 3px 10px rgba(0,0,0,0.3)',
              }}>
                <i className="bi bi-heart-fill" style={{ fontSize: '0.6rem' }} />
                Our Happy Students
              </span>
              <span style={{
                background: 'rgba(37,99,235,0.88)',
                backdropFilter: 'blur(6px)',
                borderRadius: '2rem',
                padding: '0.3rem 0.8rem',
                fontSize: '0.7rem',
                fontWeight: 700,
                color: '#fff',
                boxShadow: '0 3px 10px rgba(0,0,0,0.3)',
              }}>
                500+ Children
              </span>
            </div>
          </div>
        </div>

        {/* Bottom — Stats + Text */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Stats row */}
          <div style={{ display: 'flex', gap: '1.25rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            {[
              { value: '500+', label: 'Children',    icon: 'bi-people-fill',    color: '#60a5fa' },
              { value: '95%',  label: 'AI Accuracy', icon: 'bi-graph-up-arrow', color: '#4ade80' },
              { value: '300+', label: 'Donors',      icon: 'bi-heart-fill',     color: '#f87171' },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <i className={`bi ${s.icon}`} style={{ fontSize: '0.85rem', color: s.color }} />
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>{s.value}</span>
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '1.35rem' }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '0.35rem' }}>
            Welcome Back
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '0.5rem', lineHeight: 1.2 }}>
            Empowering Every<br /><span className="gradient-text">Child's Future</span>
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.65, maxWidth: 420 }}>
            Login to access child profiles, health records, academic tracking, AI predictions, and more.
          </p>

          {/* Feature pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '1rem' }}>
            {['AI Predictions', 'Health Monitoring', 'Academic Tracking', 'Donations'].map(f => (
              <span key={f} style={{ background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.25)', borderRadius: 'var(--radius-full)', padding: '0.25rem 0.7rem', fontSize: '0.7rem', fontWeight: 600, color: '#60a5fa' }}>
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right */}
      <div className="auth-right">
        <div className="auth-card">
          {/* Header */}
          <div style={{ marginBottom: '2rem' }}>
            <h1 className="auth-title">Login</h1>
            <p className="auth-sub">Select your role and enter your credentials to access your dashboard.</p>
          </div>

          {/* Role Pills */}
          <div className="role-pills">
            {roles.map(r => (
              <button
                key={r.value}
                type="button"
                className={`role-pill ${role === r.value ? 'active' : ''}`}
                onClick={() => {
                  setRole(r.value);
                  setEmail(r.email);
                  setPassword(r.password);
                  setError('');
                }}
              >
                <i className={`bi ${r.icon}`} style={{ color: role === r.value ? r.color : 'var(--text-muted)' }} />
                {r.label}
              </button>
            ))}
          </div>



          {/* Error */}
          {error && (
            <div className="alert alert-error">
              <i className="bi bi-exclamation-triangle-fill" />
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} autoComplete="on">
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-wrap">
                <i className="bi bi-envelope input-icon" />
                <input
                  type="email"
                  name="email"
                  autoComplete="username"
                  className="form-control"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

            </div>


            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label className="form-label" style={{ margin: 0 }}>Password</label>
                <Link to="/forgot-password" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Forgot password?</Link>
              </div>
              <div className="input-wrap">
                <i className="bi bi-lock input-icon" />
                {/* Hidden input always type="password" so browser saves credentials */}
                <input
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{ display: 'none' }}
                  tabIndex={-1}
                  aria-hidden="true"
                  readOnly={showPwd}
                />
                {/* Visible input for show/hide toggle */}
                <input
                  type={showPwd ? 'text' : 'password'}
                  className="form-control"
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button type="button" className="input-action" onClick={() => setShowPwd(!showPwd)}>
                  <i className={`bi ${showPwd ? 'bi-eye-slash' : 'bi-eye'}`} />
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full"
              style={{ marginTop: '0.5rem', justifyContent: 'center' }}
              disabled={loading}
            >
              {loading ? (
                <><span className="spinner spinner-sm" /> Authenticating...</>
              ) : (
                <><i className="bi bi-box-arrow-in-right" /> Login to Dashboard</>
              )}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', margin: '1.25rem 0', gap: '0.75rem' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.12)' }} />
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>Or continue with</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.12)' }} />
          </div>

          <GoogleSignInButton
            onSuccess={handleGoogleSuccess}
            onError={(err) => setError(err)}
            role={role}
            disabled={loading}
          />

          <div className="divider" />

          <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 600 }}>Create one free →</Link>
          </p>

          <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
            <Link to="/" style={{ color: 'var(--text-muted)' }}>
              <i className="bi bi-arrow-left" style={{ marginRight: '0.25rem' }} />Back to Home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
