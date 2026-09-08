import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';

export default function Sidebar({ isOpen, onClose }) {
  const userRole = localStorage.getItem('userRole') || 'admin';
  const userName = localStorage.getItem('userName') || 'User';
  const userEmail = localStorage.getItem('userEmail') || '';

  const initials = userName.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();

  const roleMenus = {
    admin: [
      { section: 'Overview', items: [
        { path: '/admin-dashboard', icon: 'bi-grid-fill', label: 'Dashboard' },
      ]},
      { section: 'Management', items: [
        { path: '/child-profile',           icon: 'bi-person-heart',          label: 'Child Profiles' },
        { path: '/staff-dashboard',         icon: 'bi-person-workspace',       label: 'Staff' },
        { path: '/volunteer-management',    icon: 'bi-people-fill',            label: 'Volunteers' },
        { path: '/donor-management',        icon: 'bi-heart-fill',             label: 'Donors' },
      ]},
      { section: 'Finance & Analytics', items: [
        { path: '/donation',                icon: 'bi-gift-fill',              label: 'Donations' },
        { path: '/expense-management',      icon: 'bi-cash-stack',             label: 'Expenses' },
        { path: '/reports',                 icon: 'bi-bar-chart-fill',         label: 'Reports' },
      ]},
      { section: 'Intelligence', items: [
        { path: '/ai-prediction',           icon: 'bi-cpu-fill',               label: 'AI Predictions' },
        { path: '/health-management',       icon: 'bi-heart-pulse-fill',       label: 'Health Records' },
        { path: '/academic-management',     icon: 'bi-journal-bookmark-fill',  label: 'Academics' },
      ]},
      { section: 'System', items: [
        { path: '/profile',                 icon: 'bi-person-circle',          label: 'Profile' },
        { path: '/settings',               icon: 'bi-gear-fill',              label: 'Settings' },
      ]},
    ],
    staff: [
      { section: 'Overview', items: [
        { path: '/staff-dashboard',         icon: 'bi-grid-fill',              label: 'Dashboard' },
      ]},
      { section: 'Care', items: [
        { path: '/child-profile',           icon: 'bi-person-lines-fill',      label: 'Child Records' },
        { path: '/health-management',       icon: 'bi-heart-pulse-fill',       label: 'Health Care' },
        { path: '/academic-management',     icon: 'bi-journal-bookmark-fill',  label: 'Academics' },
        { path: '/ai-prediction',           icon: 'bi-cpu-fill',               label: 'AI Hub' },
      ]},
      { section: 'Account', items: [
        { path: '/profile',                 icon: 'bi-person-circle',          label: 'My Profile' },
      ]},
    ],
    donor: [
      { section: 'Overview', items: [
        { path: '/donor-dashboard',         icon: 'bi-grid-fill',              label: 'Dashboard' },
      ]},
      { section: 'Contribute', items: [
        { path: '/donation',               icon: 'bi-gift-fill',              label: 'Make Donation' },
        { path: '/reports',               icon: 'bi-bar-chart-fill',          label: 'Contribution Logs' },
      ]},
      { section: 'Account', items: [
        { path: '/profile',               icon: 'bi-person-circle',           label: 'My Profile' },
      ]},
    ],
    volunteer: [
      { section: 'Main', items: [
        { path: '/volunteer/dashboard',    icon: 'bi-grid-fill',           label: 'Dashboard' },
        { path: '/volunteer/profile',      icon: 'bi-person-circle',       label: 'My Profile' },
        { path: '/volunteer/activities',   icon: 'bi-calendar-check-fill', label: 'Assigned Activities' },
      ]},
    ],
    child: [
      { section: 'Overview', items: [
        { path: '/child-dashboard',       icon: 'bi-stars',                   label: 'My Dashboard' },
      ]},
      { section: 'My Records', items: [
        { path: '/academic-management',  icon: 'bi-journal-bookmark-fill',    label: 'My Learning' },
        { path: '/health-management',    icon: 'bi-heart-pulse-fill',         label: 'Health Record' },
        { path: '/ai-prediction',        icon: 'bi-cpu-fill',                 label: 'AI Growth Path' },
      ]},
      { section: 'Account', items: [
        { path: '/profile',             icon: 'bi-person-circle',             label: 'My Profile' },
      ]},
    ],
  };

  const sections = roleMenus[userRole] ||
                   (['teacher', 'doctor'].includes(userRole) ? roleMenus.staff : roleMenus.admin);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            zIndex: 999, backdropFilter: 'blur(4px)',
          }}
          onClick={onClose}
        />
      )}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <Link to="/" className="sidebar-logo-mark" onClick={onClose}>
            <div className="sidebar-logo-icon">
              <i className="bi bi-house-heart-fill" />
            </div>
            <div className="sidebar-logo-text">
              <span className="sidebar-logo-name" style={{ fontSize: '1rem' }}>Orphanage</span>
              <span className="sidebar-logo-sub">Management</span>
            </div>
          </Link>
          <button className="sidebar-close" onClick={onClose} aria-label="Close sidebar">
            <i className="bi bi-x-lg" />
          </button>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {sections.map((sec) => (
            <div key={sec.section}>
              <div className="sidebar-section-label">{sec.section}</div>
              {sec.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                  onClick={onClose}
                >
                  <i className={`bi ${item.icon}`} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer / User */}
        <div className="sidebar-footer">
          <div
            className="sidebar-user"
            onClick={() => {
              localStorage.removeItem('userRole');
              localStorage.removeItem('userId');
              localStorage.removeItem('userName');
              localStorage.removeItem('userEmail');
              window.location.href = '/login';
            }}
            title="Click to logout"
          >
            <div className="sidebar-avatar">{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="sidebar-user-name">{userName}</div>
              <div className="sidebar-user-role">{userRole.charAt(0).toUpperCase() + userRole.slice(1)}</div>
            </div>
            <i className="bi bi-box-arrow-right" style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }} />
          </div>
        </div>
      </aside>
    </>
  );
}
