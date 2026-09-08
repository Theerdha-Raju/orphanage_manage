import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import TopHeader from '../components/TopHeader';

const API = 'http://localhost:8000/api';

const getDocUrl = (doc) => {
  if (!doc) return '';
  if (typeof doc !== 'string') return '';
  if (doc.startsWith('http://') || doc.startsWith('https://')) return doc;
  if (doc.startsWith('/media/')) return `http://localhost:8000${doc}`;
  if (doc.startsWith('/')) return `http://localhost:8000${doc}`;
  return `http://localhost:8000/media/${doc}`;
};

const getDocName = (doc) => {
  if (!doc) return '';
  try {
    const raw = typeof doc === 'string' ? doc.split('/').pop().split('?')[0] : '';
    return decodeURIComponent(raw) || 'Academic_Document.pdf';
  } catch {
    return 'Academic_Document.pdf';
  }
};

const getPhotoUrl = (photo) => {
  if (!photo) return null;
  if (typeof photo !== 'string') return null;
  if (photo.startsWith('http://') || photo.startsWith('https://')) return photo;
  if (photo.startsWith('/media/')) return `http://localhost:8000${photo}`;
  if (photo.startsWith('/')) return `http://localhost:8000${photo}`;
  return `http://localhost:8000/media/${photo}`;
};

const emptyForm = {
  full_name: '',
  date_of_birth: '',
  gender: 'Male',
  admission_date: new Date().toISOString().slice(0, 10),
  guardian_name: '',
  blood_group: '',
  aadhar_number: '',
  status: 'Active',
  previous_school: '',
  academic_document: null,
  photo: null
};

export default function ChildProfilePage() {
  const { toggleSidebar } = useOutletContext();
  const [children, setChildren]     = useState([]);
  const [educationRecords, setEducationRecords] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [viewChild, setViewChild]   = useState(null);
  const [editChild, setEditChild]   = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [blobUrl, setBlobUrl]       = useState(null);
  const [docLoading, setDocLoading] = useState(false);
  const [docError, setDocError]     = useState(false);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [form, setForm]             = useState(emptyForm);
  const [saving, setSaving]         = useState(false);
  const [msg, setMsg]               = useState('');

  const [showEditSelector, setShowEditSelector] = useState(false);
  const [selectedEditId, setSelectedEditId] = useState('');
  const [showDeleteSelector, setShowDeleteSelector] = useState(false);
  const [selectedDeleteId, setSelectedDeleteId] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!previewDoc) {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
        setBlobUrl(null);
      }
      setDocLoading(false);
      setDocError(false);
      return;
    }

    setDocLoading(true);
    setDocError(false);
    let active = true;

    fetch(previewDoc.url)
      .then(res => {
        if (!res.ok) throw new Error('HTTP error ' + res.status);
        return res.blob();
      })
      .then(blob => {
        if (!active) return;
        const pdfBlob = new Blob([blob], { type: 'application/pdf' });
        const objUrl = URL.createObjectURL(pdfBlob);
        setBlobUrl(objUrl);
        setDocLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch document blob:', err);
        if (!active) return;
        setDocError(true);
        setDocLoading(false);
      });

    return () => {
      active = false;
    };
  }, [previewDoc]);

  const handleDownload = async (url, filename) => {
    try {
      if (blobUrl) {
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename || 'Academic_Document.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }
      const res = await fetch(url);
      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objUrl;
      a.download = filename || 'Academic_Document.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(objUrl), 1000);
    } catch {
      window.open(url, '_blank');
    }
  };


  const loadChildren = () => {
    setLoading(true);
    Promise.all([
      fetch(`${API}/children/`).then(r => r.json()).catch(() => []),
      fetch(`${API}/education/`).then(r => r.json()).catch(() => []),
    ]).then(([cData, eData]) => {
      setChildren(Array.isArray(cData) ? cData : []);
      setEducationRecords(Array.isArray(eData) ? eData : []);
    }).catch(() => {
      setChildren([]);
      setEducationRecords([]);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { loadChildren(); }, []);

  const openAdd = () => {
    setEditChild(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (child) => {
    setEditChild(child);
    setForm({
      full_name: child.full_name,
      date_of_birth: child.date_of_birth || '',
      gender: child.gender || 'Male',
      admission_date: child.admission_date || '',
      guardian_name: child.guardian_name || '',
      blood_group: child.blood_group || '',
      aadhar_number: child.aadhar_number || '',
      status: child.status || 'Active',
      previous_school: child.previous_school || '',
      academic_document: null,
      photo: null
    });
    setShowModal(true);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete the profile for ${name}?`)) return;
    try {
      const r = await fetch(`${API}/children/${id}/`, { method: 'DELETE' });
      if (r.ok || r.status === 204) {
        setMsg(`Profile for ${name} deleted successfully.`);
        setTimeout(() => setMsg(''), 3000);
        loadChildren();
      }
    } catch { alert('Failed to delete child profile.'); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setMsg('');

    // --- FORM VALIDATION ---
    if (!form.full_name || form.full_name.trim().length < 2) {
      alert('Validation Error: Full Name is required and must be at least 2 characters.');
      return;
    }

    if (form.date_of_birth) {
      const dobDate = new Date(form.date_of_birth);
      const today = new Date();
      if (dobDate > today) {
        alert('Validation Error: Date of Birth cannot be in the future.');
        return;
      }
    }

    if (form.aadhar_number && form.aadhar_number.trim()) {
      const cleanAadhaar = form.aadhar_number.trim().replace(/\s+/g, '');
      if (!/^\d{12}$/.test(cleanAadhaar)) {
        alert('Validation Error: Aadhaar Number must be exactly 12 numeric digits.');
        return;
      }
    }

    setSaving(true);
    try {
      const url = editChild ? `${API}/children/${editChild.child_id}/` : `${API}/children/`;
      const method = editChild ? 'PATCH' : 'POST';

      let reqOptions = {};
      const hasFile = (form.academic_document && form.academic_document instanceof File) ||
                      (form.photo && form.photo instanceof File);

      if (hasFile) {
        const formData = new FormData();
        Object.keys(form).forEach(key => {
          if (form[key] !== null && form[key] !== undefined && form[key] !== '') {
            if (key === 'photo' || key === 'academic_document') {
              if (form[key] instanceof File) {
                formData.append(key, form[key]);
              }
            } else {
              formData.append(key, form[key]);
            }
          }
        });
        reqOptions = { method, body: formData };
      } else {
        const payload = { ...form };
        delete payload.academic_document;
        delete payload.photo;
        reqOptions = {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        };
      }

      const r = await fetch(url, reqOptions);
      if (r.ok) {
        setShowModal(false);
        setEditChild(null);
        setMsg(editChild ? 'Child profile updated successfully.' : 'Child profile added successfully.');
        setForm(emptyForm);
        setTimeout(() => setMsg(''), 3000);
        loadChildren();
      } else {
        const err = await r.json();
        alert('Error saving profile: ' + JSON.stringify(err));
      }
    } catch {
      alert('Unable to connect to server to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const filtered = children.filter(c => {
    const matchesSearch = c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
                          c.guardian_name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const calcAge = (dob) => {
    if (!dob) return '—';
    const d = new Date(dob);
    const age = new Date().getFullYear() - d.getFullYear();
    return `${age} yrs`;
  };

  const statusColors = { Active: 'badge-green', Inactive: 'badge-muted', Adopted: 'badge-accent' };

  return (
    <>
      <TopHeader title="Child Profiles" onToggleSidebar={toggleSidebar} />

      <div className="page-body">
        <div className="page-banner">
          <div>
            <div className="section-label">Children Management</div>
            <div className="page-banner-title">Child Profiles ({children.length})</div>
            <div className="page-banner-sub">View, add, edit, and manage all children profiles in the orphanage</div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={openAdd}>
              <i className="bi bi-person-plus-fill" /> Add Child
            </button>
            <button className="btn btn-secondary" onClick={() => setShowEditSelector(true)}>
              <i className="bi bi-pencil-square" /> Edit Profile
            </button>
          </div>
        </div>

        {msg && <div className="alert alert-success"><i className="bi bi-check-circle-fill" /> {msg}</div>}

        {/* Search + Filter + Quick Edit */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="input-wrap" style={{ flex: 1, minWidth: 200 }}>
            <i className="bi bi-search input-icon" />
            <input type="text" className="form-control" placeholder="Search by child or guardian name..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select
            className="form-control"
            style={{ width: 'auto', borderColor: 'var(--accent)' }}
            value=""
            onChange={e => {
              if (e.target.value) {
                const found = children.find(c => c.child_id === parseInt(e.target.value));
                if (found) openEdit(found);
              }
            }}
          >
            <option value="">✏️ Quick Edit Child Profile...</option>
            {children.map(c => (
              <option key={c.child_id} value={c.child_id}>
                {c.full_name} ({c.status})
              </option>
            ))}
          </select>
          <select className="form-control" style={{ width: 'auto' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Adopted">Adopted</option>
          </select>
        </div>

        {/* Table matching the model screenshot design */}
        <div className="table-wrap" style={{ borderRadius: '1rem', border: '1px solid rgba(255, 255, 255, 0.08)', overflowX: 'auto', background: 'var(--bg-card)' }}>
          <table className="table" style={{ width: '100%', margin: 0, borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead>
              <tr style={{ background: 'rgba(15, 23, 42, 0.95)' }}>
                <th style={{ padding: '0.75rem 0.5rem', color: '#94a3b8', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em', textAlign: 'center', width: '35px' }}>#</th>
                <th style={{ padding: '0.75rem 0.6rem', color: '#94a3b8', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>NAME</th>
                <th style={{ padding: '0.75rem 0.6rem', color: '#94a3b8', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>LOGIN CREDENTIALS</th>
                <th style={{ padding: '0.75rem 0.6rem', color: '#94a3b8', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>AGE & CATEGORY</th>
                <th style={{ padding: '0.75rem 0.6rem', color: '#94a3b8', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>AADHAAR CARD NO</th>
                <th style={{ padding: '0.75rem 0.6rem', color: '#94a3b8', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>GUARDIAN</th>
                <th style={{ padding: '0.75rem 0.5rem', color: '#94a3b8', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em', textAlign: 'center' }}>BLOOD</th>
                <th style={{ padding: '0.75rem 0.5rem', color: '#94a3b8', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em', textAlign: 'center' }}>DOC</th>
                <th style={{ padding: '0.75rem 0.5rem', color: '#94a3b8', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em', textAlign: 'center' }}>STATUS</th>
                <th style={{ padding: '0.75rem 0.6rem', color: '#94a3b8', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em', textAlign: 'center', minWidth: '120px', whiteSpace: 'nowrap' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                  <span className="spinner" style={{ margin: '0 auto' }} />
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={10} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                  <i className="bi bi-inbox" style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }} />
                  No children profiles found
                </td></tr>
              ) : filtered.map((c, i) => {
                const avatarBg = ['#4f46e5', '#7c3aed', '#2563eb', '#059669', '#d97706'][i % 5];
                const ageYrs = c.date_of_birth ? (new Date().getFullYear() - new Date(c.date_of_birth).getFullYear()) : 0;
                const isBelow5 = ageYrs < 5;
                return (
                  <tr key={c.child_id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, padding: '0.75rem 0.5rem', textAlign: 'center' }}>{i + 1}</td>
                    <td style={{ padding: '0.75rem 0.6rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div style={{
                          width: 38,
                          height: 38,
                          borderRadius: '50%',
                          overflow: 'hidden',
                          background: avatarBg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.9rem',
                          fontWeight: 800,
                          color: '#ffffff',
                          flexShrink: 0,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                          border: '2px solid rgba(255, 255, 255, 0.15)',
                          position: 'relative'
                        }}>
                          {c.photo ? (
                            <img
                              src={getPhotoUrl(c.photo)}
                              alt={c.full_name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div style={{
                            width: '100%',
                            height: '100%',
                            display: c.photo ? 'none' : 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            {c.full_name?.charAt(0)}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.88rem', whiteSpace: 'nowrap' }}>{c.full_name}</div>
                          <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>ID: #{c.child_id}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 0.6rem', whiteSpace: 'nowrap' }}>
                      <div style={{ fontSize: '0.78rem', color: '#60a5fa', fontWeight: 600 }}>{c.email}</div>
                      <div style={{ marginTop: '0.15rem' }}>
                        <code style={{ background: 'rgba(167,139,250,0.15)', color: '#c4b5fd', padding: '0.1rem 0.35rem', borderRadius: 4, fontSize: '0.72rem' }}>
                          {c.password}
                        </code>
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 0.6rem', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <span style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '0.82rem' }}>{calcAge(c.date_of_birth)} ({c.gender})</span>
                        <span className={`badge ${isBelow5 ? 'badge-amber' : 'badge-cyan'}`} style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem', width: 'fit-content' }}>
                          <i className={`bi ${isBelow5 ? 'bi-balloon-fill' : 'bi-mortarboard-fill'}`} style={{ marginRight: '0.25rem' }} />
                          {isBelow5 ? 'Below 5 Yrs (Toddler)' : '5+ Yrs (School)'}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 0.6rem', whiteSpace: 'nowrap' }}>
                      <code style={{ background: 'rgba(59,130,246,0.15)', color: '#93c5fd', padding: '0.2rem 0.5rem', borderRadius: 6, fontSize: '0.78rem', fontWeight: 700 }}>
                        {c.aadhar_number || `4839 ${1020 + c.child_id * 17} ${9000 + c.child_id * 23}`}
                      </code>
                    </td>
                    <td style={{ padding: '0.75rem 0.6rem' }}>
                      <div style={{
                        background: 'rgba(30, 41, 59, 0.85)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '2rem',
                        padding: '0.3rem 0.7rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        fontSize: '0.75rem',
                        color: '#f1f5f9',
                        fontWeight: 600,
                        whiteSpace: 'nowrap'
                      }}>
                        <i className="bi bi-person-heart" style={{ color: '#60a5fa' }} />
                        {c.guardian_name || c.previous_school || 'No Guardian'}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                      {c.blood_group ? (
                        <span style={{
                          background: 'rgba(239, 68, 68, 0.15)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          color: '#f87171',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '1rem',
                          fontSize: '0.72rem',
                          fontWeight: 700
                        }}>
                          {c.blood_group}
                        </span>
                      ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>—</span>}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                      {c.academic_document ? (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          <button
                            type="button"
                            onClick={() => setPreviewDoc({
                              url: getDocUrl(c.academic_document),
                              name: getDocName(c.academic_document),
                              childName: c.full_name
                            })}
                            style={{
                              background: 'rgba(59, 130, 246, 0.15)',
                              border: '1px solid rgba(59, 130, 246, 0.3)',
                              color: '#60a5fa',
                              padding: '0.25rem 0.55rem',
                              borderRadius: '0.5rem',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              cursor: 'pointer'
                            }}
                            title="Preview Academic Document"
                          >
                            <i className="bi bi-file-earmark-pdf-fill" /> Doc
                          </button>
                          <a
                            href={getDocUrl(c.academic_document)}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              color: '#94a3b8',
                              fontSize: '0.75rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '0.2rem'
                            }}
                            title="Open in new tab"
                          >
                            <i className="bi bi-box-arrow-up-right" />
                          </a>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                      <span className={`badge ${statusColors[c.status] || 'badge-muted'}`} style={{ fontWeight: 700, padding: '0.25rem 0.6rem', fontSize: '0.72rem' }}>
                        {c.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 0.6rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center' }}>
                        <button
                          type="button"
                          onClick={() => setViewChild(c)}
                          title="View Details"
                          style={{
                            width: 30, height: 30,
                            borderRadius: '6px',
                            background: 'rgba(30, 41, 59, 0.9)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            color: '#60a5fa',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer'
                          }}
                        >
                          <i className="bi bi-eye" style={{ fontSize: '0.8rem' }} />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(c)}
                          title="Edit Profile"
                          style={{
                            width: 30, height: 30,
                            borderRadius: '6px',
                            background: 'rgba(30, 41, 59, 0.9)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            color: '#f8fafc',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer'
                          }}
                        >
                          <i className="bi bi-pencil" style={{ fontSize: '0.78rem' }} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(c.child_id, c.full_name)}
                          title="Delete Profile"
                          style={{
                            width: 30, height: 30,
                            borderRadius: '6px',
                            background: 'rgba(153, 27, 27, 0.45)',
                            border: '1px solid rgba(248, 113, 113, 0.35)',
                            color: '#f87171',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer'
                          }}
                        >
                          <i className="bi bi-trash" style={{ fontSize: '0.78rem' }} />
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

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <h4 style={{ color: 'var(--text-primary)', margin: 0 }}>
                <i className="bi bi-person-plus-fill" style={{ color: 'var(--accent)', marginRight: '0.5rem' }} />
                {editChild ? 'Edit Child Profile' : 'Add New Child'}
              </h4>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}><i className="bi bi-x-lg" /></button>
            </div>

            <form onSubmit={handleSave}>
              {/* Profile Photo Upload Header – Edit mode only */}
              {editChild && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '0.85rem 1rem',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: 'var(--radius-md, 0.5rem)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                marginBottom: '1rem'
              }}>
                <div style={{
                  width: 58,
                  height: 58,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  background: 'var(--accent, #3b82f6)',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.3rem',
                  fontWeight: 800,
                  color: '#fff',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                  border: '2px solid rgba(255, 255, 255, 0.2)'
                }}>
                  {form.photo && form.photo instanceof File ? (
                    <img
                      src={URL.createObjectURL(form.photo)}
                      alt="Preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : editChild && editChild.photo ? (
                    <img
                      src={getPhotoUrl(editChild.photo)}
                      alt={editChild.full_name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    form.full_name?.charAt(0) || <i className="bi bi-person-fill" />
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <label className="form-label" style={{ marginBottom: '0.25rem', fontSize: '0.82rem', fontWeight: 600 }}>
                    Profile Photo
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <label
                      className="btn btn-secondary btn-sm"
                      style={{ cursor: 'pointer', padding: '0.3rem 0.65rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                      <i className="bi bi-camera-fill" /> {editChild?.photo || form.photo ? 'Change Photo' : 'Upload Photo'}
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={e => {
                          if (e.target.files && e.target.files[0]) {
                            set('photo', e.target.files[0]);
                          }
                        }}
                      />
                    </label>
                    {form.photo && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ color: '#f87171', fontSize: '0.75rem', padding: '0.3rem 0.5rem' }}
                        onClick={() => set('photo', null)}
                      >
                        <i className="bi bi-x-circle" /> Remove
                      </button>
                    )}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    JPG, PNG, or WEBP portrait format
                  </div>
                </div>
              </div>
              )}

              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input type="text" className="form-control" placeholder="Child's full name" value={form.full_name} onChange={e => set('full_name', e.target.value)} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Date of Birth *</label>
                  <input type="date" className="form-control" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select className="form-control" value={form.gender} onChange={e => set('gender', e.target.value)}>
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Admission Date *</label>
                  <input type="date" className="form-control" value={form.admission_date} onChange={e => set('admission_date', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Blood Group</label>
                  <select className="form-control" value={form.blood_group} onChange={e => set('blood_group', e.target.value)}>
                    <option value="">— Unknown —</option>
                    {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Aadhaar Card Number</label>
                  <input type="text" className="form-control" placeholder="e.g. 4839 2049 1048" value={form.aadhar_number} onChange={e => set('aadhar_number', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Guardian Name</label>
                  <input type="text" className="form-control" placeholder="Guardian's name" value={form.guardian_name} onChange={e => set('guardian_name', e.target.value)} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-control" value={form.status} onChange={e => set('status', e.target.value)}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Adopted">Adopted</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Previous School</label>
                  <input type="text" className="form-control" placeholder="Previous school name" value={form.previous_school} onChange={e => set('previous_school', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Academic Document</label>
                  <input type="file" className="form-control" onChange={e => set('academic_document', e.target.files[0])} accept=".pdf,.doc,.docx,.jpg,.png" />
                  {editChild && editChild.academic_document && (
                    <div style={{ marginTop: '0.35rem', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span>Current:</span>
                      <a href={getDocUrl(editChild.academic_document)} target="_blank" rel="noreferrer" style={{ color: '#60a5fa', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <i className="bi bi-file-earmark-pdf" /> {getDocName(editChild.academic_document)}
                        <i className="bi bi-box-arrow-up-right" style={{ fontSize: '0.65rem' }} />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><span className="spinner spinner-sm" /> Saving...</> : <><i className="bi bi-check-lg" /> {editChild ? 'Update Profile' : 'Save Profile'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Drawer / Modal */}
      {viewChild && (
        <div className="modal-backdrop" onClick={() => setViewChild(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="modal-header" style={{ alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  background: 'var(--accent)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.4rem',
                  flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  border: '2px solid rgba(255, 255, 255, 0.2)'
                }}>
                  {viewChild.photo ? (
                    <img
                      src={getPhotoUrl(viewChild.photo)}
                      alt={viewChild.full_name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div style={{
                    width: '100%',
                    height: '100%',
                    display: viewChild.photo ? 'none' : 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {viewChild.full_name?.charAt(0)}
                  </div>
                </div>
                <div>
                  <h4 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '1.15rem' }}>
                    {viewChild.full_name}
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>ID: #{viewChild.child_id}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>•</span>
                    <span className={`badge ${statusColors[viewChild.status] || 'badge-muted'}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                      {viewChild.status}
                    </span>
                  </div>
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setViewChild(null)}><i className="bi bi-x-lg" /></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.5rem 0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', background: 'var(--bg-surface-3)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <div><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Date of Birth</span><div style={{ fontWeight: 600 }}>{viewChild.date_of_birth || '—'} ({calcAge(viewChild.date_of_birth)})</div></div>
                <div><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Gender</span><div style={{ fontWeight: 600 }}>{viewChild.gender}</div></div>
                <div><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Blood Group</span><div style={{ fontWeight: 600, color: 'var(--accent)' }}>{viewChild.blood_group || '—'}</div></div>
                <div><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Admission Date</span><div style={{ fontWeight: 600 }}>{viewChild.admission_date || '—'}</div></div>
                <div><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Guardian</span><div style={{ fontWeight: 600 }}>{viewChild.guardian_name || '—'}</div></div>
                <div><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Status</span><div><span className={`badge ${statusColors[viewChild.status] || 'badge-muted'}`}>{viewChild.status}</span></div></div>
              </div>

              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Previous Education</span>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-primary)' }}>{viewChild.previous_school || 'No prior school recorded'}</p>
              </div>

              {/* Academic Document Section */}
              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Academic Document</span>
                {viewChild.academic_document ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    background: 'rgba(59, 130, 246, 0.08)',
                    border: '1px solid rgba(59, 130, 246, 0.15)',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.5rem'
                  }}>
                    <i className="bi bi-file-earmark-pdf-fill" style={{ fontSize: '1.75rem', color: '#60a5fa' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {getDocName(viewChild.academic_document)}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Official Academic PDF Record</div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                        onClick={() => setPreviewDoc({
                          url: getDocUrl(viewChild.academic_document),
                          name: getDocName(viewChild.academic_document),
                          childName: viewChild.full_name
                        })}
                      >
                        <i className="bi bi-eye" /> Preview
                      </button>
                      <a
                        href={getDocUrl(viewChild.academic_document)}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                      >
                        <i className="bi bi-box-arrow-up-right" /> Open
                      </a>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: 'var(--text-muted)',
                    fontSize: '0.8rem',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.5rem'
                  }}>
                    <i className="bi bi-info-circle" />
                    <span>No academic document uploaded for this child.</span>
                  </div>
                )}
              </div>

              {/* Academic Performance Section */}
              {(() => {
                const childEdu = educationRecords.filter(r => r.child === viewChild.child_id);
                if (childEdu.length === 0) return null;
                return (
                  <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Academic Performance & Progress</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                      {childEdu.map(r => {
                        const score = parseFloat(r.marks || 0);
                        const getGrade = (m) => {
                          if (m >= 90) return 'A+';
                          if (m >= 80) return 'A';
                          if (m >= 70) return 'B';
                          if (m >= 60) return 'C';
                          if (m >= 40) return 'D';
                          return 'F';
                        };
                        const gr = getGrade(score);
                        const gc = { 'A+': 'badge-green', A: 'badge-green', B: 'badge-accent', C: 'badge-amber', D: 'badge-rose', F: 'badge-rose' }[gr] || 'badge-muted';
                        return (
                          <div key={r.education_id} style={{ background: 'var(--bg-surface-3)', border: '1px solid rgba(255, 255, 255, 0.05)', padding: '0.6rem 0.8rem', borderRadius: '0.4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f1f5f9' }}>{r.subject} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>({r.class_name})</span></div>
                              {r.remarks && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.1rem', fontStyle: 'italic' }}>"{r.remarks}"</div>}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f8fafc' }}>{score}%</span>
                              <span className={`badge ${gc}`} style={{ fontSize: '0.65rem', padding: '0.15rem 0.35rem' }}>{gr}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    const target = viewChild;
                    setViewChild(null);
                    openEdit(target);
                  }}
                >
                  <i className="bi bi-pencil" /> Edit Profile
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => {
                    const target = viewChild;
                    setViewChild(null);
                    handleDelete(target.child_id, target.full_name);
                  }}
                >
                  <i className="bi bi-trash" /> Delete
                </button>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setViewChild(null)}>Close</button>
            </div>

          </div>
        </div>
      )}

      {/* Select Child to Edit Modal */}
      {showEditSelector && (
        <div className="modal-backdrop" onClick={() => setShowEditSelector(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <h4 style={{ color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="bi bi-pencil-square" style={{ color: 'var(--accent)' }} />
                Select Child to Edit
              </h4>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowEditSelector(false)}><i className="bi bi-x-lg" /></button>
            </div>
            <div style={{ margin: '1rem 0' }}>
              <label className="form-label">Choose Child Profile</label>
              <select
                className="form-control"
                value={selectedEditId}
                onChange={e => setSelectedEditId(e.target.value)}
              >
                <option value="">-- Select Child --</option>
                {children.map(c => (
                  <option key={c.child_id} value={c.child_id}>
                    {c.full_name} — DOB: {c.date_of_birth || 'N/A'} ({c.status})
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setShowEditSelector(false)}>Cancel</button>
              <button
                className="btn btn-primary"
                disabled={!selectedEditId}
                onClick={() => {
                  const found = children.find(c => c.child_id === parseInt(selectedEditId));
                  if (found) {
                    setShowEditSelector(false);
                    setSelectedEditId('');
                    openEdit(found);
                  }
                }}
              >
                <i className="bi bi-pencil" /> Open Edit Form
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Child Selector Modal */}
      {showDeleteSelector && (
        <div className="modal-backdrop" onClick={() => setShowDeleteSelector(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <h4 style={{ color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="bi bi-trash-fill" style={{ color: '#ef4444' }} />
                Delete Child Profile
              </h4>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowDeleteSelector(false)}><i className="bi bi-x-lg" /></button>
            </div>
            <div style={{ margin: '1rem 0' }}>
              <div style={{ padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.85rem', color: '#ef4444', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <i className="bi bi-exclamation-triangle-fill" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                This action is permanent and cannot be undone. All records linked to this child will be removed.
              </div>
              <label className="form-label">Choose Child to Delete</label>
              <select
                className="form-control"
                value={selectedDeleteId}
                onChange={e => setSelectedDeleteId(e.target.value)}
              >
                <option value="">-- Select Child --</option>
                {children.map(c => (
                  <option key={c.child_id} value={c.child_id}>
                    {c.full_name} — DOB: {c.date_of_birth || 'N/A'} ({c.status})
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button className="btn btn-secondary" onClick={() => { setShowDeleteSelector(false); setSelectedDeleteId(''); }}>Cancel</button>
              <button
                className="btn btn-danger"
                disabled={!selectedDeleteId}
                onClick={() => {
                  const found = children.find(c => c.child_id === parseInt(selectedDeleteId));
                  if (found) {
                    setShowDeleteSelector(false);
                    setSelectedDeleteId('');
                    handleDelete(found.child_id, found.full_name);
                  }
                }}
              >
                <i className="bi bi-trash" /> Delete Child
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dedicated PDF Document Preview Modal */}
      {previewDoc && (
        <div className="modal-backdrop" onClick={() => setPreviewDoc(null)} style={{ zIndex: 1060 }}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 960, width: '94vw', height: '90vh', display: 'flex', flexDirection: 'column', padding: '1.25rem', background: 'var(--bg-surface-2, #1e293b)' }}>
            <div className="modal-header" style={{ marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
                <div style={{ width: 38, height: 38, borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className="bi bi-file-earmark-pdf-fill" style={{ fontSize: '1.4rem', color: '#f87171' }} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <h4 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '1.05rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {previewDoc.childName} — Academic Document
                  </h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{previewDoc.name}</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <a
                  href={previewDoc.url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem' }}
                >
                  <i className="bi bi-box-arrow-up-right" /> Open in New Tab
                </a>
                <button
                  type="button"
                  onClick={() => handleDownload(previewDoc.url, previewDoc.name)}
                  className="btn btn-primary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem' }}
                >
                  <i className="bi bi-download" /> Download
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setPreviewDoc(null)}>
                  <i className="bi bi-x-lg" />
                </button>
              </div>
            </div>
            
            <div style={{ flex: 1, position: 'relative', borderRadius: '0.5rem', overflow: 'hidden', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {docLoading && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', color: '#94a3b8' }}>
                  <span className="spinner" style={{ width: 36, height: 36 }} />
                  <span style={{ fontSize: '0.85rem' }}>Loading academic document...</span>
                </div>
              )}

              {!docLoading && docError && (
                <div style={{ textAlign: 'center', padding: '2rem', maxWidth: 460 }}>
                  <i className="bi bi-exclamation-octagon" style={{ fontSize: '3rem', color: '#f59e0b', display: 'block', marginBottom: '0.75rem' }} />
                  <h5 style={{ color: '#f8fafc', marginBottom: '0.5rem' }}>Unable to Embed Inline Preview</h5>
                  <p style={{ color: '#94a3b8', fontSize: '0.82rem', marginBottom: '1.25rem' }}>
                    Your browser or environment may restrict inline document embedding. You can open the file in a new tab or download it directly.
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
                    <a href={previewDoc.url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
                      <i className="bi bi-box-arrow-up-right" /> Open in New Tab
                    </a>
                    <button type="button" onClick={() => handleDownload(previewDoc.url, previewDoc.name)} className="btn btn-primary btn-sm">
                      <i className="bi bi-download" /> Download PDF
                    </button>
                  </div>
                </div>
              )}

              {!docLoading && !docError && (blobUrl || previewDoc.url) && (
                <object
                  data={blobUrl || previewDoc.url}
                  type="application/pdf"
                  width="100%"
                  height="100%"
                  style={{ display: 'block', border: 'none', background: '#ffffff' }}
                >
                  <iframe
                    src={blobUrl || previewDoc.url}
                    title={previewDoc.name}
                    style={{ width: '100%', height: '100%', border: 'none', background: '#ffffff' }}
                  />
                </object>
              )}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <span>Official Academic Record PDF • Click "Open in New Tab" or "Download" for native reader tools.</span>
              <button className="btn btn-secondary btn-sm" onClick={() => setPreviewDoc(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


