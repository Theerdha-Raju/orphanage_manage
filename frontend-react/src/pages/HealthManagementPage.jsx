import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import TopHeader from '../components/TopHeader';

const API = 'http://localhost:8000/api';

const statusColor = { Healthy: 'badge-green', 'Mild Risk': 'badge-amber', Critical: 'badge-rose', Underweight: 'badge-violet' };

const emptyForm = { child: '', height_cm: '', weight_kg: '', checkup_date: new Date().toISOString().slice(0,10), notes: '', status: 'Healthy' };

export default function HealthManagementPage() {
  const { toggleSidebar } = useOutletContext();
  const [records, setRecords]     = useState([]);
  const [children, setChildren]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editRecord, setEdit]     = useState(null);
  const [msg, setMsg]             = useState('');
  const [search, setSearch]       = useState('');
  const [form, setForm]           = useState(emptyForm);
  const [saving, setSaving]       = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetch(`${API}/health/`).then(r => r.json()).catch(() => []),
      fetch(`${API}/children/`).then(r => r.json()).catch(() => []),
    ]).then(([h, c]) => {
      setRecords(Array.isArray(h) ? h : []);
      setChildren(Array.isArray(c) ? c : []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const bmi = (h, w) => {
    if (!h || !w) return '—';
    return (parseFloat(w) / Math.pow(parseFloat(h)/100, 2)).toFixed(1);
  };

  const openAdd = () => {
    setEdit(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (r) => {
    setEdit(r);
    setForm({
      child: r.child,
      height_cm: r.height_cm,
      weight_kg: r.weight_kg,
      checkup_date: r.checkup_date,
      notes: r.notes || '',
      status: r.status || 'Healthy'
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this health record?')) return;
    try {
      const r = await fetch(`${API}/health/${id}/`, { method: 'DELETE' });
      if (r.ok || r.status === 204) {
        setMsg('Health record deleted.');
        setTimeout(() => setMsg(''), 3000);
        loadData();
      }
    } catch { alert('Failed to delete health record.'); }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    // --- FORM VALIDATION ---
    if (!form.child) {
      alert('Validation Error: Please select a child for this health record.');
      return;
    }

    if (!form.checkup_date) {
      alert('Validation Error: Checkup date is required.');
      return;
    }

    if (form.height_cm !== '' && form.height_cm !== null) {
      const h = parseFloat(form.height_cm);
      if (isNaN(h) || h <= 0 || h > 250) {
        alert('Validation Error: Height must be a valid positive number up to 250 cm.');
        return;
      }
    }

    if (form.weight_kg !== '' && form.weight_kg !== null) {
      const w = parseFloat(form.weight_kg);
      if (isNaN(w) || w <= 0 || w > 200) {
        alert('Validation Error: Weight must be a valid positive number up to 200 kg.');
        return;
      }
    }

    setSaving(true);
    const url = editRecord ? `${API}/health/${editRecord.health_id}/` : `${API}/health/`;
    const method = editRecord ? 'PUT' : 'POST';
    try {
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (r.ok) {
        setShowModal(false);
        setMsg(editRecord ? 'Health record updated.' : 'Health record added.');
        setTimeout(() => setMsg(''), 3000);
        loadData();
      } else {
        alert('Failed to save health record.');
      }
    } catch {} finally { setSaving(false); }
  };

  const filtered = records.filter(r =>
    (r.child_name || `Child #${r.child}`).toLowerCase().includes(search.toLowerCase()) ||
    (r.notes || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <TopHeader title="Health Management" onToggleSidebar={toggleSidebar} />

      <div className="page-body">
        <div className="page-banner">
          <div>
            <div className="section-label">Healthcare</div>
            <div className="page-banner-title">Health Monitoring ({records.length})</div>
            <div className="page-banner-sub">Track medical checkups, BMI, and health status for all children</div>
          </div>
          <button className="btn btn-green" onClick={openAdd}>
            <i className="bi bi-plus-lg" /> Add Health Record
          </button>
        </div>

        {/* Summary cards */}
        <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
          {[
            { label: 'Total Records', value: records.length, icon: 'bi-heart-pulse-fill', cls: 'stat-icon-green' },
            { label: 'Healthy',    value: records.filter(r => r.status === 'Healthy').length, icon: 'bi-check-circle-fill', cls: 'stat-icon-green' },
            { label: 'At Risk',    value: records.filter(r => r.status !== 'Healthy').length, icon: 'bi-exclamation-triangle-fill', cls: 'stat-icon-amber' },
            { label: 'Underweight', value: records.filter(r => r.status === 'Underweight').length, icon: 'bi-activity', cls: 'stat-icon-violet' },
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

        {msg && <div className="alert alert-success"><i className="bi bi-check-circle-fill" /> {msg}</div>}

        {/* Search */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', alignItems: 'center' }}>
          <div className="input-wrap" style={{ flex: 1 }}>
            <i className="bi bi-search input-icon" />
            <input type="text" className="form-control" placeholder="Search by child name or notes..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {/* Table */}
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>#</th><th>Child</th><th>Height (cm)</th><th>Weight (kg)</th>
                <th>BMI</th><th>Checkup Date</th><th>Status</th><th>Notes</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  <span className="spinner" style={{ margin: '0 auto' }} />
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  <i className="bi bi-heart-pulse" style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }} />
                  No health records found
                </td></tr>
              ) : filtered.map((r, i) => (
                <tr key={r.health_id}>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{i+1}</td>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.child_name || `Child #${r.child}`}</td>
                  <td>{r.height_cm}</td>
                  <td>{r.weight_kg}</td>
                  <td>
                    <span style={{ fontWeight: 700, color: parseFloat(bmi(r.height_cm, r.weight_kg)) < 18.5 ? '#fbbf24' : '#4ade80' }}>
                      {bmi(r.height_cm, r.weight_kg)}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.82rem' }}>{r.checkup_date}</td>
                  <td><span className={`badge ${statusColor[r.status] || 'badge-muted'}`}>{r.status}</span></td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{r.notes?.slice(0, 40) || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(r)} title="Edit"><i className="bi bi-pencil" /></button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(r.health_id)} title="Delete"><i className="bi bi-trash" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h4 style={{ color: 'var(--text-primary)', margin: 0 }}>
                <i className="bi bi-heart-pulse-fill" style={{ color: '#4ade80', marginRight: '0.5rem' }} />
                {editRecord ? 'Edit Health Record' : 'Add Health Record'}
              </h4>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}><i className="bi bi-x-lg" /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Child *</label>
                <select className="form-control" value={form.child} onChange={e => set('child', e.target.value)} required>
                  <option value="">— Select Child —</option>
                  {children.map(c => <option key={c.child_id} value={c.child_id}>{c.full_name}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Height (cm) *</label>
                  <input type="number" step="0.1" className="form-control" placeholder="e.g. 130" value={form.height_cm} onChange={e => set('height_cm', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Weight (kg) *</label>
                  <input type="number" step="0.1" className="form-control" placeholder="e.g. 28" value={form.weight_kg} onChange={e => set('weight_kg', e.target.value)} required />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Checkup Date</label>
                  <input type="date" className="form-control" value={form.checkup_date} onChange={e => set('checkup_date', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-control" value={form.status} onChange={e => set('status', e.target.value)}>
                    <option>Healthy</option><option>Mild Risk</option><option>Critical</option><option>Underweight</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-control" placeholder="Additional notes..." value={form.notes} onChange={e => set('notes', e.target.value)} style={{ minHeight: 80 }} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-green" disabled={saving}>
                  {saving ? <><span className="spinner spinner-sm" /> Saving...</> : <><i className="bi bi-check-lg" /> {editRecord ? 'Update Record' : 'Save Record'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
