import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import TopHeader from '../components/TopHeader';

const API = 'http://localhost:8000/api';

const STATUS_BADGE = { Active: 'badge-green', Inactive: 'badge-muted', 'On Leave': 'badge-amber' };

const emptyForm = {
  full_name: '',
  email: '',
  password: '',
  phone_number: '',
  skills: '',
  availability: 'Weekends',
  status: 'Active'
};

export default function VolunteerManagementPage() {
  const { toggleSidebar } = useOutletContext();
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [showModal, setShowModal]   = useState(false);
  const [editVol, setEditVol]       = useState(null);
  const [form, setForm]             = useState(emptyForm);
  const [saving, setSaving]         = useState(false);
  const [msg, setMsg]               = useState('');
  const [error, setError]           = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const fetchVolunteers = () => {
    setLoading(true);
    fetch(`${API}/volunteers/`)
      .then(r => r.json())
      .then(data => setVolunteers(Array.isArray(data) ? data : []))
      .catch(() => setVolunteers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchVolunteers(); }, []);

  const openAdd = () => {
    setEditVol(null);
    setForm(emptyForm);
    setError('');
    setShowModal(true);
  };

  const openEdit = (vol) => {
    setEditVol(vol);
    setForm({
      full_name: vol.full_name,
      email: vol.email || '',
      password: vol.password || '',
      phone_number: vol.phone_number || '',
      skills: vol.skills || '',
      availability: vol.availability || 'Weekends',
      status: vol.status || 'Active'
    });
    setError('');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');

    // --- FORM VALIDATION ---
    if (!form.full_name || form.full_name.trim().length < 2) {
      setError('Validation Error: Full Name is required and must be at least 2 characters.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email || !emailRegex.test(form.email.trim())) {
      setError('Validation Error: Please enter a valid email address (e.g. name@domain.com).');
      return;
    }

    if (form.phone_number && form.phone_number.trim()) {
      const cleanPhone = form.phone_number.trim().replace(/[\s\-]/g, '');
      if (!/^\+?\d{10,15}$/.test(cleanPhone)) {
        setError('Validation Error: Please enter a valid phone number (at least 10 digits).');
        return;
      }
    }

    if (form.password && form.password.trim().length < 6) {
      setError('Validation Error: Password must be at least 6 characters long.');
      return;
    }

    setSaving(true);
    const url = editVol ? `${API}/volunteers/${editVol.volunteer_id}/` : `${API}/volunteers/`;
    const method = editVol ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        fetchVolunteers();
        setShowModal(false);
        setForm(emptyForm);
        setMsg(editVol ? 'Volunteer profile updated.' : 'Volunteer added successfully.');
        setTimeout(() => setMsg(''), 3000);
      } else {
        const errData = await res.json();
        setError(JSON.stringify(errData));
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this volunteer profile?')) return;
    try {
      await fetch(`${API}/volunteers/${id}/`, { method: 'DELETE' });
      setVolunteers(prev => prev.filter(v => v.volunteer_id !== id));
      setMsg('Volunteer profile deleted.');
      setTimeout(() => setMsg(''), 3000);
    } catch {}
  };

  const filtered = volunteers.filter(v =>
    v.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    v.skills?.toLowerCase().includes(search.toLowerCase()) ||
    v.email?.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = volunteers.filter(v => v.status === 'Active').length;

  return (
    <>
      <TopHeader title="Volunteer Management" onToggleSidebar={toggleSidebar} />

      <div className="page-body">
        <div className="page-banner">
          <div>
            <div className="section-label">Community</div>
            <div className="page-banner-title">Volunteer Network ({volunteers.length})</div>
            <div className="page-banner-sub">Manage schedules, skills, and activities of all registered volunteers</div>
          </div>
          <button className="btn btn-primary" onClick={openAdd}>
            <i className="bi bi-person-plus-fill" /> Add Volunteer
          </button>
        </div>

        <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
          {[
            { label: 'Total Volunteers', value: volunteers.length, icon: 'bi-people-fill', cls: 'stat-icon-violet' },
            { label: 'Active Now',       value: activeCount, icon: 'bi-person-check-fill', cls: 'stat-icon-green' },
            { label: 'Skills Available', value: [...new Set(volunteers.flatMap(v => v.skills?.split(',') || []))].filter(Boolean).length, icon: 'bi-stars', cls: 'stat-icon-accent' },
            { label: 'On Leave',         value: volunteers.filter(v => v.status === 'On Leave').length, icon: 'bi-person-dash-fill', cls: 'stat-icon-amber' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className={`stat-icon ${s.cls}`}><i className={`bi ${s.icon}`} /></div>
              <div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value">{s.value}</div>
              </div>
            </div>
          ))}
        </div>

        {msg && <div className="alert alert-success" style={{ marginBottom: '1rem' }}><i className="bi bi-check-circle-fill" /> {msg}</div>}

        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="input-wrap" style={{ flex: 1, minWidth: 200 }}>
            <i className="bi bi-search input-icon" />
            <input type="text" className="form-control" placeholder="Search by name, email or skills..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="table-wrap" style={{ borderRadius: '0.85rem', border: '1px solid rgba(255, 255, 255, 0.08)', overflowX: 'auto', background: 'var(--bg-card)' }}>
          <table className="table" style={{ width: '100%', margin: 0, minWidth: '850px' }}>
            <thead>
              <tr style={{ background: 'rgba(15, 23, 42, 0.95)' }}>
                <th style={{ padding: '0.6rem 0.4rem', color: '#94a3b8', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em', textAlign: 'center', width: '30px' }}>#</th>
                <th style={{ padding: '0.6rem 0.4rem', color: '#94a3b8', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>NAME</th>
                <th style={{ padding: '0.6rem 0.4rem', color: '#94a3b8', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>EMAIL</th>
                <th style={{ padding: '0.6rem 0.4rem', color: '#94a3b8', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>PASSWORD</th>
                <th style={{ padding: '0.6rem 0.4rem', color: '#94a3b8', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>PHONE</th>
                <th style={{ padding: '0.6rem 0.4rem', color: '#94a3b8', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em', minWidth: '130px' }}>SKILLS</th>
                <th style={{ padding: '0.6rem 0.4rem', color: '#94a3b8', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>AVAILABILITY</th>
                <th style={{ padding: '0.6rem 0.4rem', color: '#94a3b8', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em', textAlign: 'center', minWidth: '85px', whiteSpace: 'nowrap' }}>STATUS</th>
                <th style={{ padding: '0.6rem 0.4rem', color: '#94a3b8', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em', textAlign: 'center', minWidth: '80px', whiteSpace: 'nowrap' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  <span className="spinner" style={{ margin: '0 auto' }} />
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  <i className="bi bi-people" style={{ fontSize: '1.8rem', display: 'block', marginBottom: '0.5rem' }} />
                  No volunteers found
                </td></tr>
              ) : filtered.map((v, i) => {
                const avatarBg = ['#4f46e5', '#7c3aed', '#2563eb', '#059669', '#d97706'][i % 5];
                return (
                  <tr key={v.volunteer_id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 600, padding: '0.55rem 0.4rem', textAlign: 'center' }}>{i + 1}</td>
                    <td style={{ padding: '0.55rem 0.4rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <div style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          background: avatarBg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          color: '#ffffff',
                          flexShrink: 0
                        }}>
                          {v.full_name?.charAt(0)}
                        </div>
                        <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>{v.full_name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '0.55rem 0.4rem', fontSize: '0.78rem', color: '#cbd5e1', whiteSpace: 'nowrap', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis' }} title={v.email}>
                      {v.email || '—'}
                    </td>
                    <td style={{ padding: '0.55rem 0.4rem' }}>
                      <code style={{ background: 'rgba(167,139,250,0.15)', color: '#c4b5fd', padding: '0.12rem 0.35rem', borderRadius: 4, fontSize: '0.72rem', display: 'inline-block', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v.password || 'Vol@123'}>
                        {v.password || 'Vol@123'}
                      </code>
                    </td>
                    <td style={{ padding: '0.55rem 0.4rem', fontSize: '0.78rem', color: '#cbd5e1', whiteSpace: 'nowrap' }}>{v.phone_number || '—'}</td>
                    <td style={{ padding: '0.55rem 0.4rem', maxWidth: '160px' }}>
                      <div style={{
                        background: 'rgba(30, 41, 59, 0.85)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '0.5rem',
                        padding: '0.2rem 0.45rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontSize: '0.72rem',
                        color: '#f1f5f9',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '150px'
                      }} title={v.skills || 'General'}>
                        <i className="bi bi-award-fill" style={{ color: '#a78bfa', flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.skills || 'General'}</span>
                      </div>
                    </td>
                    <td style={{ padding: '0.55rem 0.4rem', fontSize: '0.78rem', color: '#cbd5e1', whiteSpace: 'nowrap' }}>{v.availability || '—'}</td>
                    <td style={{ padding: '0.55rem 0.4rem', textAlign: 'center', minWidth: '85px', whiteSpace: 'nowrap' }}>
                      <span className={`badge ${STATUS_BADGE[v.status] || 'badge-muted'}`} style={{ fontWeight: 700, padding: '0.2rem 0.55rem', fontSize: '0.72rem', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        {v.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.55rem 0.4rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                        <button
                          type="button"
                          onClick={() => openEdit(v)}
                          title="Edit Volunteer"
                          style={{
                            width: 26, height: 26,
                            borderRadius: '5px',
                            background: 'rgba(30, 41, 59, 0.9)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            color: '#f8fafc',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer'
                          }}
                        >
                          <i className="bi bi-pencil" style={{ fontSize: '0.72rem' }} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(v.volunteer_id)}
                          title="Delete Volunteer"
                          style={{
                            width: 26, height: 26,
                            borderRadius: '5px',
                            background: 'rgba(153, 27, 27, 0.45)',
                            border: '1px solid rgba(248, 113, 113, 0.35)',
                            color: '#f87171',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer'
                          }}
                        >
                          <i className="bi bi-trash" style={{ fontSize: '0.72rem' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h4 style={{ color: 'var(--text-primary)', margin: 0 }}>
                <i className="bi bi-person-plus-fill" style={{ color: 'var(--accent)', marginRight: '0.5rem' }} />
                {editVol ? 'Edit Volunteer' : 'Add Volunteer'}
              </h4>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}><i className="bi bi-x-lg" /></button>
            </div>
            <form onSubmit={handleSave}>
              {error && (
                <div className="alert alert-danger" style={{ marginBottom: '1rem', fontSize: '0.8rem' }}>
                  <i className="bi bi-exclamation-triangle-fill" /> {error}
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input type="text" className="form-control" placeholder="e.g. John Doe" value={form.full_name} onChange={e => set('full_name', e.target.value)} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-control" placeholder="john@example.com" value={form.email} onChange={e => set('email', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Login Password</label>
                  <input type="text" className="form-control" placeholder="e.g. Vol@123" value={form.password} onChange={e => set('password', e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input type="tel" className="form-control" placeholder="+91 9876543210" value={form.phone_number} onChange={e => set('phone_number', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Availability</label>
                  <select className="form-control" value={form.availability} onChange={e => set('availability', e.target.value)}>
                    <option>Weekends</option><option>Weekdays</option><option>Evenings</option><option>Flexible</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Skills / Expertise</label>
                <input type="text" className="form-control" placeholder="e.g. Teaching, First Aid, Event Planning" value={form.skills} onChange={e => set('skills', e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Availability</label>
                  <select className="form-control" value={form.availability} onChange={e => set('availability', e.target.value)}>
                    <option>Weekends</option><option>Weekdays</option><option>Evenings</option><option>Flexible</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-control" value={form.status} onChange={e => set('status', e.target.value)}>
                    <option>Active</option><option>Inactive</option><option>On Leave</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><span className="spinner spinner-sm" /> Saving...</> : <><i className="bi bi-check-lg" /> {editVol ? 'Update Profile' : 'Save Profile'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
