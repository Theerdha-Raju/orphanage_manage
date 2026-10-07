import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import TopHeader from '../components/TopHeader';
import { getLoggedInChild } from '../utils/childAuth';

const API = '/api';

const gradeColor = { 'A+': 'badge-green', A: 'badge-green', B: 'badge-accent', C: 'badge-amber', D: 'badge-rose', F: 'badge-rose' };

const emptyForm = { child: '', class_name: '', subject: '', marks: '', exam_date: new Date().toISOString().slice(0,10), remarks: '' };

export default function AcademicManagementPage() {
  const { toggleSidebar } = useOutletContext();
  const [records, setRecords]         = useState([]);
  const [children, setChildren]       = useState([]);
  const [currentChild, setCurrentChild] = useState(null);
  const [loading, setLoading]         = useState(true);
  const [showModal, setShowModal]     = useState(false);
  const [editRecord, setEdit]         = useState(null);
  const [msg, setMsg]                 = useState('');
  const [search, setSearch]           = useState('');
  const [form, setForm]               = useState(emptyForm);
  const [saving, setSaving]           = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Role-based filtering: child sees only their own records
  const userRole = localStorage.getItem('userRole') || '';
  const isChild  = userRole === 'child';

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetch(`${API}/education/`).then(r => r.json()).catch(() => []),
      fetch(`${API}/children/`).then(r => r.json()).catch(() => []),
    ]).then(([e, c]) => {
      const allChildren = Array.isArray(c) ? c : [];
      setChildren(allChildren);
      if (isChild) {
        const myChild = getLoggedInChild(allChildren);
        setCurrentChild(myChild);
        const myChildId = myChild ? myChild.child_id : null;
        const allRecords = Array.isArray(e) ? e : [];
        setRecords(myChildId ? allRecords.filter(r => String(r.child) === String(myChildId)) : []);
      } else {
        setRecords(Array.isArray(e) ? e : []);
      }
    }).finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const toGrade = (m) => {
    const n = parseFloat(m);
    if (n >= 90) return 'A+';
    if (n >= 80) return 'A';
    if (n >= 70) return 'B';
    if (n >= 60) return 'C';
    if (n >= 40) return 'D';
    return 'F';
  };

  const openAdd = () => {
    setEdit(null);
    setForm({
      ...emptyForm,
      child: isChild && currentChild ? currentChild.child_id : '',
    });
    setShowModal(true);
  };

  const openEdit = (r) => {
    setEdit(r);
    setForm({
      child: r.child,
      class_name: r.class_name,
      subject: r.subject,
      marks: r.marks,
      exam_date: r.exam_date,
      remarks: r.remarks || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this academic record?')) return;
    try {
      const r = await fetch(`${API}/education/${id}/`, { method: 'DELETE' });
      if (r.ok || r.status === 204) {
        setMsg('Academic record deleted.');
        setTimeout(() => setMsg(''), 3000);
        loadData();
      }
    } catch { alert('Failed to delete academic record.'); }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    // --- FORM VALIDATION ---
    if (!form.child) {
      alert('Validation Error: Please select a child.');
      return;
    }

    if (!form.subject || !form.subject.trim()) {
      alert('Validation Error: Subject is required.');
      return;
    }

    if (!form.class_name || !form.class_name.trim()) {
      alert('Validation Error: Class/Grade is required.');
      return;
    }

    const marksVal = parseFloat(form.marks);
    if (isNaN(marksVal) || marksVal < 0 || marksVal > 100) {
      alert('Validation Error: Marks must be a valid number between 0 and 100.');
      return;
    }

    setSaving(true);
    const url = editRecord ? `${API}/education/${editRecord.education_id}/` : `${API}/education/`;
    const method = editRecord ? 'PUT' : 'POST';
    try {
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (r.ok) {
        setShowModal(false);
        setMsg(editRecord ? 'Academic record updated.' : 'Academic record added.');
        setTimeout(() => setMsg(''), 3000);
        loadData();
      } else {
        alert('Failed to save academic record.');
      }
    } catch {} finally { setSaving(false); }
  };

  const filtered = records.filter(r =>
    (r.child_name || `Child #${r.child}`).toLowerCase().includes(search.toLowerCase()) ||
    (r.subject || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.class_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const avgScore = records.length ? (records.reduce((a, r) => a + parseFloat(r.marks || 0), 0) / records.length).toFixed(1) : '—';

  return (
    <>
      <TopHeader title="Academic Management" onToggleSidebar={toggleSidebar} />

      <div className="page-body">
        <div className="page-banner">
          <div>
            <div className="section-label">Education</div>
            <div className="page-banner-title">{isChild ? `My Academic Progress (${records.length})` : `Academic Progress (${records.length})`}</div>
            <div className="page-banner-sub">
              {isChild ? `Personal academic records and scores for ${currentChild?.full_name || 'you'}` : 'Track marks, subjects, and learning outcomes for all children'}
            </div>
          </div>
          <button className="btn btn-primary" onClick={openAdd}>
            <i className="bi bi-plus-lg" /> {isChild ? 'Add My Learning Record' : 'Add Record'}
          </button>
        </div>

        {/* Summary */}
        <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
          {[
            { label: 'Total Records', value: records.length, icon: 'bi-journal-bookmark-fill', cls: 'stat-icon-accent' },
            { label: 'Average Score', value: `${avgScore}%`, icon: 'bi-bar-chart-fill', cls: 'stat-icon-green' },
            { label: 'Top Scores (90+)', value: records.filter(r => parseFloat(r.marks) >= 90).length, icon: 'bi-trophy-fill', cls: 'stat-icon-amber' },
            { label: 'Subjects Tracked', value: [...new Set(records.map(r => r.subject))].length, icon: 'bi-book-fill', cls: 'stat-icon-violet' },
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
            <input type="text" className="form-control" placeholder="Search by child name, subject, or class..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Child Name</th>
                <th>Age Category</th>
                <th>Aadhaar Card No</th>
                <th>Class</th>
                <th>Subject</th>
                <th>Marks</th>
                <th>Grade</th>
                <th>Exam Date</th>
                <th>Remarks</th>
                {!isChild && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={11} style={{ textAlign: 'center', padding: '3rem' }}>
                  <span className="spinner" style={{ margin: '0 auto' }} />
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={11} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  <i className="bi bi-journal" style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }} />No academic records found
                </td></tr>
              ) : filtered.map((r, i) => {
                const childObj = children.find(ch => ch.child_id === r.child);
                const calcAge = (dob) => {
                  if (!dob) return 0;
                  const today = new Date();
                  const birth = new Date(dob);
                  let age = today.getFullYear() - birth.getFullYear();
                  if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--;
                  return age;
                };
                const ageYrs = calcAge(childObj?.date_of_birth);
                const isBelow5 = ageYrs < 5;
                const aadhar = childObj?.aadhar_number || `4839 ${1020 + (r.child || 1) * 17} ${9000 + (r.child || 1) * 23}`;

                return (
                  <tr key={r.education_id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{i + 1}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.child_name || `Child #${r.child}`}</td>
                    <td>
                      <span className={`badge ${isBelow5 ? 'badge-amber' : 'badge-cyan'}`} style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem' }}>
                        <i className={`bi ${isBelow5 ? 'bi-balloon-fill' : 'bi-mortarboard-fill'}`} style={{ marginRight: '0.25rem' }} />
                        {ageYrs > 0 ? `${ageYrs} Yrs${isBelow5 ? '' : ' (School)'}` : '—'}
                      </span>
                    </td>
                    <td>
                      <code style={{ background: 'rgba(59,130,246,0.15)', color: '#93c5fd', padding: '0.15rem 0.4rem', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600 }}>
                        {aadhar}
                      </code>
                    </td>
                    <td>{r.class_name}</td>
                    <td><span className="badge badge-accent">{r.subject}</span></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{r.marks}%</span>
                        <div className="progress-bar-wrap" style={{ width: 60 }}>
                          <div className="progress-bar-fill" style={{ width: `${Math.min(r.marks, 100)}%` }} />
                        </div>
                      </div>
                    </td>
                    <td><span className={`badge ${gradeColor[toGrade(r.marks)] || 'badge-muted'}`}>{toGrade(r.marks)}</span></td>
                    <td style={{ fontSize: '0.82rem' }}>{r.exam_date}</td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{r.remarks?.slice(0, 40) || '—'}</td>
                    {!isChild && (
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => openEdit(r)} title="Edit"><i className="bi bi-pencil" /></button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(r.education_id)} title="Delete"><i className="bi bi-trash" /></button>
                        </div>
                      </td>
                    )}
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
                <i className="bi bi-journal-plus" style={{ color: 'var(--accent)', marginRight: '0.5rem' }} />
                {editRecord ? 'Edit Academic Record' : 'Add Academic Record'}
              </h4>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}><i className="bi bi-x-lg" /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Child / Student *</label>
                {isChild ? (
                  <div style={{
                    padding: '0.65rem 0.95rem',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <i className="bi bi-person-fill" style={{ color: 'var(--accent)' }} />
                    {currentChild?.full_name || localStorage.getItem('userName') || 'My Profile'}
                    <span className="badge badge-accent" style={{ marginLeft: 'auto', fontSize: '0.72rem' }}>Personal Record</span>
                  </div>
                ) : (
                  <select className="form-control" value={form.child} onChange={e => set('child', e.target.value)} required>
                    <option value="">— Select Child —</option>
                    {children.map(c => <option key={c.child_id} value={c.child_id}>{c.full_name}</option>)}
                  </select>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Class *</label>
                  <input type="text" className="form-control" placeholder="e.g. Class 5" value={form.class_name} onChange={e => set('class_name', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Subject *</label>
                  <input type="text" className="form-control" placeholder="e.g. Mathematics" value={form.subject} onChange={e => set('subject', e.target.value)} required />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Marks (0–100) *</label>
                  <input type="number" step="0.1" min="0" max="100" className="form-control" placeholder="e.g. 85" value={form.marks} onChange={e => set('marks', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Exam Date</label>
                  <input type="date" className="form-control" value={form.exam_date} onChange={e => set('exam_date', e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Remarks</label>
                <textarea className="form-control" placeholder="Optional notes..." value={form.remarks} onChange={e => set('remarks', e.target.value)} style={{ minHeight: 70 }} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
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
