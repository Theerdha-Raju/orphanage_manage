import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import TopHeader from '../components/TopHeader';

export default function SettingsPage() {
  const { toggleSidebar } = useOutletContext();
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const [settings, setSettings] = useState({
    notifications: true,
    emailAlerts: true,
    aiSuggestions: true,
    darkMode: true,
    language: 'English',
  });

  const handleToggle = (key) => {
    setSettings(s => ({ ...s, [key]: !s[key] }));
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setMsg('Settings updated successfully.');
      setTimeout(() => setMsg(''), 3000);
    }, 1000);
  };

  return (
    <>
      <TopHeader title="System Settings" onToggleSidebar={toggleSidebar} />
      
      <div className="page-body">
        <div className="page-banner">
          <div>
            <div className="section-label">System</div>
            <div className="page-banner-title">Platform Settings</div>
            <div className="page-banner-sub">Configure notifications, AI preferences, and system defaults</div>
          </div>
        </div>

        {msg && <div className="alert alert-success"><i className="bi bi-check-circle-fill" />{msg}</div>}

        <div className="glass-card" style={{ maxWidth: 800, padding: '2rem' }}>
          
          {/* Notifications */}
          <h5 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>
            <i className="bi bi-bell-fill me-2" style={{ color: 'var(--accent)' }} /> 
            Notifications & Alerts
          </h5>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg-surface-2)', borderRadius: 'var(--radius-md)' }}>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Push Notifications</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Receive real-time alerts for critical events and AI insights</div>
              </div>
              <button 
                className={`btn btn-sm ${settings.notifications ? 'btn-green' : 'btn-secondary'}`}
                onClick={() => handleToggle('notifications')}
              >
                {settings.notifications ? 'Enabled' : 'Disabled'}
              </button>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg-surface-2)', borderRadius: 'var(--radius-md)' }}>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Email Summaries</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Daily digest of activities, donations, and health logs</div>
              </div>
              <button 
                className={`btn btn-sm ${settings.emailAlerts ? 'btn-green' : 'btn-secondary'}`}
                onClick={() => handleToggle('emailAlerts')}
              >
                {settings.emailAlerts ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          </div>

          <div className="divider" />

          {/* AI Preferences */}
          <h5 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>
            <i className="bi bi-cpu-fill me-2" style={{ color: '#a78bfa' }} /> 
            AI & Intelligence Preferences
          </h5>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg-surface-2)', borderRadius: 'var(--radius-md)', marginBottom: '2rem' }}>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Proactive AI Suggestions</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Allow ML models to scan data and suggest interventions automatically</div>
            </div>
            <button 
              className={`btn btn-sm ${settings.aiSuggestions ? 'btn-green' : 'btn-secondary'}`}
              onClick={() => handleToggle('aiSuggestions')}
            >
              {settings.aiSuggestions ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          <div className="divider" />

          {/* Appearance & Locale */}
          <h5 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>
            <i className="bi bi-palette-fill me-2" style={{ color: '#f59e0b' }} /> 
            Appearance & Locale
          </h5>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
            <div className="form-group">
              <label className="form-label">Theme</label>
              <select className="form-control" value={settings.darkMode ? 'dark' : 'light'} onChange={() => handleToggle('darkMode')}>
                <option value="dark">Dark Theme (Glassmorphism)</option>
                <option value="light">Light Theme</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Language</label>
              <select className="form-control" value={settings.language} onChange={e => setSettings(s => ({...s, language: e.target.value}))}>
                <option>English</option>
                <option>Hindi</option>
                <option>Spanish</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <><span className="spinner spinner-sm" /> Saving...</> : <><i className="bi bi-check-lg" /> Save Settings</>}
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
