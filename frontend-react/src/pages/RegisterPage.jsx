import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import GoogleSignInButton from '../components/GoogleSignInButton';

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirm: '',
    phone: '', gender: '', role: 'volunteer',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

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
          role: form.role
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
          const routes = {
            admin: '/admin-dashboard', staff: '/staff-dashboard',
            donor: '/donor-dashboard', volunteer: '/volunteer-dashboard',
          };
          navigate(routes[data.role] || '/child-dashboard');
        }, 700);
      } else {
        setError(data.error || 'Google registration failed.');
        setLoading(false);
      }
    } catch {
      setError('Unable to connect to server for Google registration.');
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setError('Passwords do not match.'); return;
    }
    setLoading(true); setError('');

    try {
      const res  = await fetch('http://localhost:8000/api/auth/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password, phone: form.phone, role: form.role }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess('Registration successful! Redirecting to login...');
        setTimeout(() => navigate('/login'), 1800);
      } else {
        setError(data.error || 'Registration failed. Try again.');
      }
    } catch {
      setError('Unable to connect to server.');
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { value: 'staff',     label: 'Caregiver/Staff', icon: 'bi-person-workspace' },
    { value: 'donor',     label: 'Donor/Sponsor',   icon: 'bi-heart-fill' },
    { value: 'volunteer', label: 'Volunteer',       icon: 'bi-people-fill' },
  ];

  return (
    <div className="auth-wrapper">
      {/* Left */}
      <div className="auth-left" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflowY: 'auto' }}>
        <div className="auth-left-orb auth-left-orb-1" />
        <div className="auth-left-orb auth-left-orb-2" />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', marginBottom: '1.5rem' }}>
            <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg, #2563eb, #7c3aed)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <i className="bi bi-house-heart-fill" />
            </div>
            <span style={{ fontWeight: 800, fontSize: '1.2rem', color: '#fff' }}>Orphanage Management</span>
          </Link>

          <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', marginBottom: '1.5rem', lineHeight: 1.1 }}>
            Empowering lives, <br /> one child at a time.
          </h2>
          
          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
            {[
              { label: 'Active Children', value: '500+',  icon: 'bi-people-fill',    color: '#60a5fa' },
              { label: 'Verified Staff',  value: '120+',  icon: 'bi-person-badge',   color: '#4ade80' },
              { label: 'Donors',          value: '300+',  icon: 'bi-heart-fill',     color: '#fb7185' },
              { label: 'Volunteers',      value: '150+',  icon: 'bi-star-fill',      color: '#fbbf24' },
            ].map((stat, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.08)', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <i className={`bi ${stat.icon}`} style={{ color: stat.color, fontSize: '1.1rem' }} />
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{stat.value}</div>
                  <div style={{ fontSize: '0.65rem', opacity: 0.7, color: '#fff', marginTop: '0.15rem' }}>{stat.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Feature Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
            {[
              { icon: 'bi-person-heart',         color: '#60a5fa', bg: 'rgba(96,165,250,0.15)',  title: 'Child Profiles',    desc: 'Full history & records' },
              { icon: 'bi-heart-pulse-fill',      color: '#4ade80', bg: 'rgba(74,222,128,0.15)',  title: 'Health Tracking',   desc: 'BMI, checkups & alerts' },
              { icon: 'bi-journal-bookmark-fill', color: '#a78bfa', bg: 'rgba(167,139,250,0.15)', title: 'Academics',         desc: 'Marks, grades & reports' },
              { icon: 'bi-cpu-fill',              color: '#fb7185', bg: 'rgba(251,113,133,0.15)', title: 'AI Predictions',    desc: 'ML-powered risk analysis' },
              { icon: 'bi-gift-fill',             color: '#fbbf24', bg: 'rgba(251,191,36,0.15)',  title: 'Donations',         desc: 'Receipts & audit logs' },
              { icon: 'bi-bell-fill',             color: '#22d3ee', bg: 'rgba(34,211,238,0.15)',  title: 'Smart Alerts',      desc: 'Proactive notifications' },
            ].map(f => (
              <div key={f.title} style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
                padding: '0.75rem',
                display: 'flex',
                gap: '0.6rem',
                alignItems: 'flex-start',
              }}>
                <div style={{ width: 30, height: 30, borderRadius: '8px', background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className={`bi ${f.icon}`} style={{ color: f.color, fontSize: '0.85rem' }} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff', marginBottom: '0.1rem' }}>{f.title}</div>
                  <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.35 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.1)', padding: '1.5rem', borderRadius: '16px', marginTop: '2rem' }}>
          <i className="bi bi-quote" style={{ fontSize: '1.5rem', color: '#60a5fa' }} />
          <p style={{ color: '#fff', fontSize: '0.9rem', fontStyle: 'italic', margin: '0.5rem 0' }}>
            "This platform transformed how we track health and education. It’s been a game changer for our children."
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#fff' }} />
            <div style={{ color: '#fff' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>Sarah Jenkins</div>
              <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>Lead Caregiver</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right */}
      <div className="auth-right" style={{ overflowY: 'auto' }}>
        <div className="auth-card">
          <h1 className="auth-title">Registration</h1>
          <p className="auth-sub">Fill in the details below to join Orphanage Management.</p>

          {error   && <div className="alert alert-error"><i className="bi bi-exclamation-triangle-fill" />{error}</div>}
          {success && <div className="alert alert-success"><i className="bi bi-check-circle-fill" />{success}</div>}

          <form onSubmit={handleSubmit}>
            {/* Role */}
            <div className="form-group">
              <label className="form-label">Join As</label>
              <div className="role-pills">
                {roles.map(r => (
                  <button
                    key={r.value}
                    type="button"
                    className={`role-pill ${form.role === r.value ? 'active' : ''}`}
                    onClick={() => set('role', r.value)}
                  >
                    <i className={`bi ${r.icon}`} /> {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div className="input-wrap">
                <i className="bi bi-person input-icon" />
                <input type="text" className="form-control" placeholder="Your full name" value={form.name} onChange={e => set('name', e.target.value)} required />
              </div>
            </div>

            {/* Email */}
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-wrap">
                <i className="bi bi-envelope input-icon" />
                <input type="email" className="form-control" placeholder="you@example.com" value={form.email} onChange={e => set('email', e.target.value)} required />
              </div>
            </div>

            {/* Phone */}
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <div className="input-wrap">
                <i className="bi bi-telephone input-icon" />
                <input type="tel" className="form-control" placeholder="+91 98765 43210" value={form.phone} onChange={e => set('phone', e.target.value)} />
              </div>
            </div>

            {/* Password row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input type="password" className="form-control" placeholder="Create password" value={form.password} onChange={e => set('password', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm</label>
                <input type="password" className="form-control" placeholder="Confirm it" value={form.confirm} onChange={e => set('confirm', e.target.value)} required />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-green w-full"
              style={{ justifyContent: 'center', marginTop: '0.5rem' }}
              disabled={loading}
            >
              {loading ? (
                <><span className="spinner spinner-sm" /> Creating Account...</>
              ) : (
                <><i className="bi bi-person-plus-fill" /> Register</>
              )}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', margin: '1.25rem 0', gap: '0.75rem' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.12)' }} />
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>Or sign up with</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.12)' }} />
          </div>

          <GoogleSignInButton
            onSuccess={handleGoogleSuccess}
            onError={(err) => setError(err)}
            role={form.role}
            text="signup_with"
            disabled={loading}
          />

          <div className="divider" />
          <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Login →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
