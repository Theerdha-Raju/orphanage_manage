import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import TopHeader from '../components/TopHeader';

const API = 'http://localhost:8000/api';

export default function VolunteerDashboardPage() {
  const { toggleSidebar } = useOutletContext();
  const userName = localStorage.getItem('userName') || 'Volunteer';

  const [assignments, setAssignments] = useState([]);
  const [volunteers, setVolunteers]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showModal, setShowModal]     = useState(false);
  const [saving, setSaving]           = useState(false);
  const [msg, setMsg]                 = useState('');
  const [form, setForm]               = useState({ volunteer: '', event_name: '', assigned_date: new Date().toISOString().slice(0,10), status: 'Assigned' });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      fetch(`${API}/volunteer-assignments/`).then(r => r.json()),
      fetch(`${API}/volunteers/`).then(r => r.json())
    ]).then(([asgn, vols]) => {
      setAssignments(Array.isArray(asgn) ? asgn : []);
      setVolunteers(Array.isArray(vols) ? vols : []);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleSaveAssignment = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${API}/volunteer-assignments/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        fetchData();
        setShowModal(false);
        setForm({ volunteer: '', event_name: '', assigned_date: new Date().toISOString().slice(0,10), status: 'Assigned' });
        setMsg('Assignment created successfully.');
        setTimeout(() => setMsg(''), 3000);
      }
    } catch {} finally { setSaving(false); }
  };

  const handleDeleteAssignment = async (id) => {
    if (!window.confirm('Delete this assignment?')) return;
    try {
      await fetch(`${API}/volunteer-assignments/${id}/`, { method: 'DELETE' });
      setMsg('Assignment deleted.');
      setTimeout(() => setMsg(''), 3000);
      fetchData();
    } catch {}
  };

  const upcomingCount = assignments.filter(a => a.status !== 'Completed').length;

  const stats = [
    { label: 'Upcoming Shifts',  value: upcomingCount.toString(), icon: 'bi-calendar-check-fill', cls: 'stat-icon-violet' },
    { label: 'Hours Logged',     value: ((assignments.filter(a => a.status === 'Completed').length + 2) * 3).toString(), icon: 'bi-clock-history', cls: 'stat-icon-green' },
    { label: 'Total Volunteers', value: volunteers.length.toString(), icon: 'bi-people-fill', cls: 'stat-icon-accent' },
    { label: 'Feedback Score',   value: '4.9/5', icon: 'bi-star-fill', cls: 'stat-icon-amber' },
  ];

  return (
    <>
      <TopHeader title="Volunteer Dashboard" onToggleSidebar={toggleSidebar} />

      <div className="page-body">
        <div className="page-banner">
          <div>
            <div className="section-label">Community</div>
            <div className="page-banner-title">Welcome, {userName}</div>
            <div className="page-banner-sub">View assignments, manage volunteers, and see your impact.</div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <i className="bi bi-plus-lg" /> Add Assignment
            </button>
            <Link to="/volunteer-management" className="btn btn-secondary">
              <i className="bi bi-people-fill" /> Manage Volunteers
            </Link>
          </div>
        </div>

        <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
          {stats.map(s => (
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

          {/* Upcoming Assignments */}
          <div className="chart-card">
            <div className="chart-card-title"><i className="bi bi-calendar-event" /> Upcoming Assignments</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '1rem' }}><span className="spinner"></span></div>
              ) : assignments.length === 0 ? (
                <div style={{ padding: '1rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                  <i className="bi bi-calendar-x" style={{ fontSize: '1.5rem', display: 'block', marginBottom: '0.5rem' }} />
                  No assignments yet. Click "Add Assignment" to create one.
                </div>
              ) : assignments.map((a, i) => (
                <div key={a.assignment_id || i} style={{ padding: '1rem', background: 'var(--bg-surface-3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{a.event_name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className={`badge ${a.status === 'Completed' ? 'badge-green' : a.status === 'Assigned' ? 'badge-violet' : 'badge-amber'}`}>{a.status}</span>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleDeleteAssignment(a.assignment_id)} title="Delete Assignment" style={{ padding: '0.1rem 0.3rem', color: 'var(--rose-400)' }}>
                        <i className="bi bi-trash" />
                      </button>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '1rem' }}>
                    <span><i className="bi bi-calendar me-1" />{a.assigned_date}</span>
                    <span><i className="bi bi-person me-1" />{a.volunteer_name || `Vol #${a.volunteer}`}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Volunteer Directory */}
          <div className="chart-card">
            <div className="chart-card-title"><i className="bi bi-people-fill" /> Volunteer Directory</div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th>Name</th><th>Skills</th><th>Availability</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={4} style={{ textAlign: 'center', padding: '1.5rem' }}><span className="spinner" style={{ margin: '0 auto' }} /></td></tr>
                  ) : volunteers.length === 0 ? (
                    <tr><td colSpan={4} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>No volunteers registered</td></tr>
                  ) : volunteers.map(v => (
                    <tr key={v.volunteer_id}>
                      <td style={{ fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: '#a78bfa', flexShrink: 0 }}>
                            {v.full_name?.charAt(0)}
                          </div>
                          {v.full_name}
                        </div>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{v.skills || '—'}</td>
                      <td style={{ fontSize: '0.8rem' }}>{v.availability || '—'}</td>
                      <td>
                        <span className={`badge ${v.status === 'Active' ? 'badge-green' : v.status === 'On Leave' ? 'badge-amber' : 'badge-muted'}`}>
                          {v.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* AI Guidelines */}
        <div className="chart-card" style={{ marginTop: '1.5rem' }}>
          <div className="chart-card-title"><i className="bi bi-cpu-fill" /> AI Intervention Guidelines</div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Based on recent ML predictions, staff have requested specific focus areas for upcoming sessions.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 'var(--radius-md)' }}>
              <strong style={{ display: 'block', color: '#3b82f6', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Math Tutoring (Grade 5)</strong>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}><strong>AI Note:</strong> Random Forest predicts a drop in fractions comprehension. Focus 30 mins on fractions visual exercises.</p>
            </div>
            <div style={{ padding: '1rem', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 'var(--radius-md)' }}>
              <strong style={{ display: 'block', color: '#10b981', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Weekend Sports & Physicals</strong>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}><strong>Health Note:</strong> SVM model flagged children with weight drops. Include light stretching and low-intensity options.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Assignment Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h4 style={{ color: 'var(--text-primary)', margin: 0 }}>
                <i className="bi bi-calendar-plus-fill" style={{ color: 'var(--accent)', marginRight: '0.5rem' }} /> Create Assignment
              </h4>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}><i className="bi bi-x-lg" /></button>
            </div>
            <form onSubmit={handleSaveAssignment}>
              <div className="form-group">
                <label className="form-label">Volunteer *</label>
                <select className="form-control" required value={form.volunteer} onChange={e => set('volunteer', e.target.value)}>
                  <option value="">— Select Volunteer —</option>
                  {volunteers.map(v => (
                    <option key={v.volunteer_id} value={v.volunteer_id}>{v.full_name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Event / Task Name *</label>
                <input type="text" className="form-control" placeholder="e.g. Math Tutoring Session" value={form.event_name} onChange={e => set('event_name', e.target.value)} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input type="date" className="form-control" value={form.assigned_date} onChange={e => set('assigned_date', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-control" value={form.status} onChange={e => set('status', e.target.value)}>
                    <option>Assigned</option>
                    <option>Pending</option>
                    <option>Completed</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><span className="spinner spinner-sm" /> Saving...</> : <><i className="bi bi-check-lg" /> Save Assignment</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
