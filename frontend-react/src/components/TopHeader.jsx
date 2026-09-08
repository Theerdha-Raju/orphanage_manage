import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function TopHeader({ title, onToggleSidebar }) {
  const navigate = useNavigate();
  const userName = localStorage.getItem('userName') || 'User';
  const userRole = localStorage.getItem('userRole') || '';

  const initials = userName.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <header className="top-header">
      <div className="top-header-left">
        <button
          className="header-btn toggle-sidebar-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          <i className="bi bi-list" />
        </button>

        {title && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="page-title">{title}</span>
          </div>
        )}
      </div>

      <div className="top-header-right">
        {/* Search */}
        <button className="header-btn hide-mobile" title="Search" aria-label="Search">
          <i className="bi bi-search" />
        </button>

        {/* Notifications */}
        <button className="header-btn" title="Notifications" aria-label="Notifications" style={{ position: 'relative' }}>
          <i className="bi bi-bell" />
          <span className="notif-dot" />
        </button>

        {/* Divider */}
        <div style={{ width: 1, height: 24, background: 'var(--border)' }} />

        {/* User */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div className="header-avatar" title={userName}>
            {initials}
          </div>
          <div className="hide-mobile" style={{ lineHeight: 1.2 }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {userName}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
              {userRole}
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          className="header-btn"
          onClick={handleLogout}
          title="Logout"
          aria-label="Logout"
          style={{ color: '#f87171' }}
        >
          <i className="bi bi-box-arrow-right" />
        </button>
      </div>
    </header>
  );
}
