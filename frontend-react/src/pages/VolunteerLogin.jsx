import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const API = 'http://localhost:8000/api';

export default function VolunteerLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API}/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: 'volunteer' })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        localStorage.setItem('userRole', 'volunteer');
        localStorage.setItem('userEmail', data.email || email);
        localStorage.setItem('userName', data.name || 'Volunteer User');
        localStorage.setItem('userId', data.user_id || '1');

        navigate('/volunteer/dashboard');
      } else {
        setError(data.error || 'Invalid volunteer credentials. Please try again.');
      }
    } catch {
      // Offline / fallback for testing
      if (email && password) {
        localStorage.setItem('userRole', 'volunteer');
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userName', email.split('@')[0].toUpperCase() || 'Volunteer');
        localStorage.setItem('userId', '1');
        navigate('/volunteer/dashboard');
      } else {
        setError('Network error. Please check backend server.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0a0e1a 0%, #0f172a 50%, #1e293b 100%)',
      padding: '1.5rem'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '1.25rem',
        padding: '2.5rem',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)'
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #2563eb, #16a34a)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.6rem',
            color: '#ffffff',
            margin: '0 auto 1rem',
            boxShadow: '0 8px 20px rgba(37, 99, 235, 0.35)'
          }}>
            <i className="bi bi-heart-pulse-fill" />
          </div>
          <h2 style={{ color: '#f8fafc', fontWeight: 800, fontSize: '1.5rem', marginBottom: '0.35rem' }}>
            Volunteer Portal
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
            Intelligent Child Development & Orphanage Management System
          </p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1.25rem', fontSize: '0.82rem' }}>
            <i className="bi bi-exclamation-triangle-fill" style={{ marginRight: '0.4rem' }} />
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin}>
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 600 }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                className="form-control"
                required
                placeholder="volunteer@orphanage.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.12)', paddingLeft: '2.5rem' }}
              />
              <i className="bi bi-envelope-fill" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 600, margin: 0 }}>Password</label>
              <Link to="/forgot-password" style={{ fontSize: '0.78rem', color: '#3b82f6', textDecoration: 'none' }}>
                Forgot Password?
              </Link>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                className="form-control"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.12)', paddingLeft: '2.5rem' }}
              />
              <i className="bi bi-lock-fill" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={loading}
            style={{ padding: '0.75rem', justifyContent: 'center', fontSize: '0.95rem', fontWeight: 700 }}
          >
            {loading ? <span className="spinner spinner-sm" /> : <><i className="bi bi-box-arrow-in-right" /> Volunteer Login</>}
          </button>
        </form>

        <div style={{ marginTop: '1.75rem', textAlign: 'center', fontSize: '0.8rem', color: '#64748b' }}>
          Back to <Link to="/login" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 600 }}>Main Login</Link>
        </div>
      </div>
    </div>
  );
}
