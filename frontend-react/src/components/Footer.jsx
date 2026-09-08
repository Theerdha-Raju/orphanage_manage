import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const year = new Date().getFullYear();

  const quickLinks = [
    { href: '/',           label: 'Home' },
    { href: '#features',   label: 'Features' },
    { href: '#ai-services',label: 'AI Services' },
    { href: '/login',      label: 'Login' },
    { href: '/register',   label: 'Register' },
  ];

  const legalLinks = [
    { href: '#', label: 'Privacy Policy' },
    { href: '#', label: 'Terms of Service' },
    { href: '#', label: 'Cookie Policy' },
  ];

  const moduleLinks = [
    { href: '/admin-dashboard',  label: 'Admin Dashboard' },
    { href: '/child-profile',    label: 'Child Management' },
    { href: '/ai-prediction',    label: 'AI Predictions' },
    { href: '/donation',         label: 'Donations' },
  ];

  return (
    <footer className="public-footer">
      <div className="container">
        <div className="footer-grid">
          {/* Brand */}
          <div>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', marginBottom: '0.75rem' }}>
              <div style={{
                width: 38, height: 38,
                background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                borderRadius: 'var(--radius-md)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1rem', color: '#fff',
              }}>
                <i className="bi bi-house-heart-fill" />
              </div>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                Orphanage Management
              </span>
            </Link>
            <p className="footer-brand-desc">
              An AI-powered orphanage management platform dedicated to empowering every child's future through intelligent technology, compassionate caregiving, and transparent governance.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {[
                { icon: 'bi-twitter-x', href: '#' },
                { icon: 'bi-facebook', href: '#' },
                { icon: 'bi-linkedin', href: '#' },
                { icon: 'bi-github', href: '#' },
              ].map(s => (
                <a
                  key={s.icon}
                  href={s.href}
                  style={{
                    width: 34, height: 34,
                    background: 'var(--bg-surface-2)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '0.85rem',
                    transition: 'var(--transition)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--border-hover)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                >
                  <i className={`bi ${s.icon}`} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <div className="footer-col-title">Navigation</div>
            <ul className="footer-links">
              {quickLinks.map(l => (
                <li key={l.href}>
                  <Link to={l.href}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Modules */}
          <div>
            <div className="footer-col-title">Modules</div>
            <ul className="footer-links">
              {moduleLinks.map(l => (
                <li key={l.href}>
                  <Link to={l.href}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <div className="footer-col-title">Legal</div>
            <ul className="footer-links">
              {legalLinks.map(l => (
                <li key={l.label}>
                  <a href={l.href}>{l.label}</a>
                </li>
              ))}
            </ul>
            <div style={{ marginTop: '1.5rem' }}>
              <span className="footer-logo-name">Orphanage Management</span>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <span><i className="bi bi-envelope me-1" />admin@orphanage.org</span>
                <span><i className="bi bi-telephone me-1" />+91 98765 43210</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="footer-bottom">
          <p className="footer-bottom-text">
            © {year} Orphanage Management System. All rights reserved.
          </p>
          <p className="footer-bottom-text">
            Built with <i className="bi bi-heart-fill" style={{ color: 'var(--rose)' }} /> for every child's brighter future.
          </p>
        </div>
      </div>
    </footer>
  );
}
