import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('');
  const [submitted, setSubmit]= useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmit(true);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: 64, height: 64, background: 'linear-gradient(135deg, #2563eb, #7c3aed)', borderRadius: 'var(--radius-xl)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', color: '#fff', margin: '0 auto 1.25rem' }}>
            <i className="bi bi-key-fill" />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Forgot Password?
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '2rem' }}>
          {submitted ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, background: 'var(--green-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: '#4ade80', margin: '0 auto 1rem' }}>
                <i className="bi bi-check-lg" />
              </div>
              <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Check Your Email</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                If <strong style={{ color: 'var(--text-primary)' }}>{email}</strong> is registered, you'll receive a reset link shortly.
              </p>
              <Link to="/login" className="btn btn-primary" style={{ marginTop: '1.5rem', width: '100%', justifyContent: 'center' }}>
                <i className="bi bi-arrow-left" /> Back to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div className="input-wrap">
                  <i className="bi bi-envelope input-icon" />
                  <input
                    type="email"
                    className="form-control"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary w-full" style={{ justifyContent: 'center' }}>
                <i className="bi bi-send-fill" /> Send Reset Link
              </button>

              <div className="divider" />
              <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Remembered it?{' '}
                <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Login →</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
