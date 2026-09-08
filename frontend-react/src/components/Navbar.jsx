import React, { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = [
    { href: '#features',    label: 'Features' },
    { href: '#ai-services', label: 'AI Services' },
    { href: '#stats',       label: 'Impact' },
    { href: '#about-us',    label: 'About Us' },
    { href: '#donate',      label: 'Donate' },
    { href: '#testimonials',label: 'Testimonials' },
    { href: '#contact',     label: 'Contact' },
  ];

  return (
    <nav className="public-nav" style={{ boxShadow: scrolled ? '0 4px 30px rgba(0,0,0,0.3)' : 'none' }}>
      <div className="public-nav-inner">
        {/* Logo */}
        <Link to="/" className="nav-logo">
          <div className="nav-logo-icon">
            <i className="bi bi-house-heart-fill" />
          </div>
          <span className="nav-logo-name" style={{ fontSize: '1.2rem', whiteSpace: 'nowrap' }}>
            Orphanage <span>Management</span>
          </span>
        </Link>

        {/* Desktop Links */}
        <ul className="nav-links">
          {links.map(l => (
            <li key={l.href}>
              <a href={l.href}>{l.label}</a>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <div className="nav-actions">
          <Link to="/login" className="btn btn-ghost btn-sm">Login</Link>
          <Link to="/register" className="btn btn-primary btn-sm">Sign Up</Link>
          {/* Mobile menu toggle */}
          <button
            className="btn btn-ghost btn-sm hide-desktop"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
            style={{ display: 'none' }}
          >
            <i className={`bi bi-${mobileOpen ? 'x-lg' : 'list'}`} />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          padding: '1rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}>
          {links.map(l => (
            <a
              key={l.href}
              href={l.href}
              style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '0.4rem 0' }}
              onClick={() => setMobileOpen(false)}
            >
              {l.label}
            </a>
          ))}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
            <Link to="/login" className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>Login</Link>
            <Link to="/register" className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>Register</Link>
          </div>
        </div>
      )}
    </nav>
  );
}
