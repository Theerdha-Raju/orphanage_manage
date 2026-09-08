import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import TopHeader from '../components/TopHeader';

export default function ProfilePage() {
  const { toggleSidebar } = useOutletContext();
  const userName = localStorage.getItem('userName') || 'User';
  const userEmail = localStorage.getItem('userEmail') || 'user@example.com';
  const userRole = localStorage.getItem('userRole') || 'admin';
  
  const initials = userName.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();

  const [form, setForm] = useState({ name: userName, email: userEmail, phone: '+91 9876543210' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const handleSave = (e) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      localStorage.setItem('userName', form.name);
      localStorage.setItem('userEmail', form.email);
      setSaving(false);
      setMsg('Profile updated successfully!');
      setTimeout(() => setMsg(''), 3000);
    }, 1000);
  };

  return (
    <>
      <TopHeader title="My Profile" onToggleSidebar={toggleSidebar} />
      
      <div className="page-body">
        <div className="page-banner">
          <div>
            <div className="section-label">Account</div>
            <div className="page-banner-title">Profile Settings</div>
            <div className="page-banner-sub">Manage your personal information and account preferences</div>
          </div>
        </div>

        {msg && <div className="alert alert-success"><i className="bi bi-check-circle-fill" />{msg}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1.5rem' }}>
          
          {/* Sidebar Info */}
          <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', height: 'fit-content' }}>
            <div style={{ 
              width: 100, height: 100, borderRadius: '50%', 
              background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2.5rem', fontWeight: 800, color: '#fff', margin: '0 auto 1.5rem'
            }}>
              {initials}
            </div>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{userName}</h4>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem', textTransform: 'capitalize' }}>
              <i className="bi bi-person-badge me-1" /> {userRole} Account
            </div>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <div><i className="bi bi-envelope me-2" />{userEmail}</div>
              <div><i className="bi bi-telephone me-2" />{form.phone}</div>
            </div>
          </div>

          {/* Edit Form */}
          <div className="glass-card" style={{ padding: '2rem' }}>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
              <i className="bi bi-pencil-square me-2" style={{ color: 'var(--accent)' }} /> 
              Edit Personal Details
            </h4>
            
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input 
                  type="text" className="form-control" 
                  value={form.name} onChange={e => setForm({...form, name: e.target.value})} 
                  required 
                />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input 
                    type="email" className="form-control" 
                    value={form.email} onChange={e => setForm({...form, email: e.target.value})} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input 
                    type="tel" className="form-control" 
                    value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} 
                  />
                </div>
              </div>
              
              <div className="divider" />
              
              <h4 style={{ color: 'var(--text-primary)', marginBottom: '1.5rem', marginTop: '1.5rem' }}>
                <i className="bi bi-shield-lock me-2" style={{ color: '#10b981' }} /> 
                Security
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input type="password" className="form-control" placeholder="Leave blank to keep current" />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <input type="password" className="form-control" placeholder="Confirm new password" />
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><span className="spinner spinner-sm" /> Saving...</> : <><i className="bi bi-check-lg" /> Save Changes</>}
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </>
  );
}
