import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import TopHeader from '../components/TopHeader';

const API = 'http://localhost:8000/api';

const emptyForm = {
  full_name: '',
  email: '',
  password: '',
  phone_number: '',
  address: '',
  status: 'Active',
};

export default function DonorManagementPage() {
  const { toggleSidebar } = useOutletContext();
  const [donors, setDonors]       = useState([]);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editDonor, setEditDonor] = useState(null);
  const [form, setForm]           = useState(emptyForm);
  const [saving, setSaving]       = useState(false);
  const [msg, setMsg]             = useState('');
  const [search, setSearch]       = useState('');
  const [showPassMap, setShowPassMap] = useState({});

  const toggleShowPass = (id) => {
    setShowPassMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetch(`${API}/donors/`).then(r => r.json()).catch(() => []),
      fetch(`${API}/donations/`).then(r => r.json()).catch(() => []),
    ]).then(([d, dn]) => {
      setDonors(Array.isArray(d) ? d : []);
      setDonations(Array.isArray(dn) ? dn : []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const openAdd = () => {
    setEditDonor(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (donor) => {
    setEditDonor(donor);
    setForm({
      full_name: donor.full_name || '',
      email: donor.email || '',
      password: donor.password || '',
      phone_number: donor.phone_number || '',
      address: donor.address || '',
      status: donor.status || 'Active',
    });
    setShowModal(true);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete donor "${name}"? This cannot be undone.`)) return;
    try {
      const r = await fetch(`${API}/donors/${id}/`, { method: 'DELETE' });
      if (r.ok || r.status === 204) {
        setMsg(`Donor "${name}" deleted.`);
        setTimeout(() => setMsg(''), 3000);
        loadData();
      }
    } catch { alert('Failed to delete donor.'); }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    // --- FORM VALIDATION ---
    if (!form.full_name || form.full_name.trim().length < 2) {
      alert('Validation Error: Full Name is required and must be at least 2 characters.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email || !emailRegex.test(form.email.trim())) {
      alert('Validation Error: Please enter a valid email address.');
      return;
    }

    if (form.phone_number && form.phone_number.trim()) {
      const cleanPhone = form.phone_number.trim().replace(/[\s\-]/g, '');
      if (!/^\+?\d{10,15}$/.test(cleanPhone)) {
        alert('Validation Error: Please enter a valid phone number (at least 10 digits).');
        return;
      }
    }

    setSaving(true);
    try {
      const url = editDonor ? `${API}/donors/${editDonor.donor_id}/` : `${API}/donors/`;
      const method = editDonor ? 'PATCH' : 'POST';
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (r.ok) {
        setShowModal(false);
        setEditDonor(null);
        setMsg(editDonor ? `Donor "${form.full_name}" updated successfully.` : `Donor "${form.full_name}" added.`);
        setTimeout(() => setMsg(''), 3000);
        loadData();
      } else {
        const err = await r.json();
        alert('Error: ' + JSON.stringify(err));
      }
    } catch {
      alert('Unable to connect to server.');
    } finally {
      setSaving(false);
    }
  };

  const getDonorTotal = (donorId) => {
    return donations
      .filter(d => d.donor === donorId && d.donation_type === 'Money')
      .reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);
  };

  const getDonorCount = (donorId) => donations.filter(d => d.donor === donorId).length;

  const filtered = donors.filter(d =>
    d.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    d.email?.toLowerCase().includes(search.toLowerCase()) ||
    d.phone_number?.includes(search)
  );

  const totalMoney = donations.filter(d => d.donation_type === 'Money').reduce((a, d) => a + parseFloat(d.amount || 0), 0);
  const activeDonors = donors.filter(d => d.status === 'Active').length;
  const itemDonations = donations.filter(d => d.donation_type === 'Item').length;

  return (
    <>
      <TopHeader title="Donor Management" onToggleSidebar={toggleSidebar} />

      <div className="page-body">
        {/* Banner */}
        <div className="page-banner">
          <div>
            <div className="section-label">Finance & Donors</div>
            <div className="page-banner-title">Donor Directory ({donors.length})</div>
            <div className="page-banner-sub">View, add, edit, and manage all donor profiles and their contributions</div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-primary" onClick={openAdd}>
              <i className="bi bi-person-plus-fill" /> Add Donor
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
          {[
            { label: 'Total Donors',       value: donors.length,                             icon: 'bi-person-heart',           cls: 'stat-icon-accent' },
            { label: 'Active Donors',      value: activeDonors,                              icon: 'bi-person-check-fill',      cls: 'stat-icon-green' },
            { label: 'Total Cash Raised',  value: `₹${(totalMoney/100000).toFixed(1)}L`,    icon: 'bi-cash-stack',             cls: 'stat-icon-amber' },
            { label: 'Item Donations',     value: itemDonations,                             icon: 'bi-box-seam-fill',          cls: 'stat-icon-violet' },
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
          <div className="input-wrap" style={{ flex: 1, maxWidth: 420 }}>
            <i className="bi bi-search input-icon" />
            <input
              type="text"
              className="form-control"
              placeholder="Search by name, email or phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Donor Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {loading ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <span className="spinner" style={{ margin: '0 auto' }} />
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <i className="bi bi-inbox" style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }} />
              No donors found
            </div>
          ) : filtered.map((d) => {
            const donorTotal = getDonorTotal(d.donor_id);
            const donorCount = getDonorCount(d.donor_id);
            const initials = d.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
            return (
              <div key={d.donor_id} className="stat-card" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 0, padding: '1.25rem', borderRadius: 'var(--radius-lg)' }}>
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1rem' }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem', color: '#fff',
                    flexShrink: 0,
                  }}>
                    {initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.full_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.email}</div>
                  </div>
                  <span className={`badge ${d.status === 'Active' ? 'badge-green' : 'badge-muted'}`} style={{ flexShrink: 0 }}>
                    {d.status}
                  </span>
                </div>

                {/* Credentials & Info rows */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <i className="bi bi-key-fill" style={{ color: '#a78bfa', fontSize: '0.75rem', width: 14 }} />
                    <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Pass:</span>
                    <code style={{ background: 'rgba(167,139,250,0.15)', color: '#c4b5fd', padding: '0.1rem 0.4rem', borderRadius: 4, fontSize: '0.75rem' }}>
                      {showPassMap[d.donor_id] ? d.password || 'Donor@123' : '••••••••'}
                    </code>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '0 0.25rem', height: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)' }}
                      onClick={() => toggleShowPass(d.donor_id)}
                      title="Toggle password view"
                    >
                      <i className={`bi ${showPassMap[d.donor_id] ? 'bi-eye-slash' : 'bi-eye'}`} />
                    </button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <i className="bi bi-telephone-fill" style={{ color: 'var(--accent)', fontSize: '0.75rem', width: 14 }} />
                    {d.phone_number || '—'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <i className="bi bi-geo-alt-fill" style={{ color: '#f59e0b', fontSize: '0.75rem', width: 14 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.address || '—'}</span>
                  </div>
                </div>

                {/* Contribution summary */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem', padding: '0.75rem', background: 'var(--bg-surface-3)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem', color: '#4ade80' }}>
                      ₹{donorTotal > 0 ? (donorTotal / 1000).toFixed(0) + 'K' : '0'}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Cash Given</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem', color: '#fbbf24' }}>
                      {donorCount}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Donations</div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => openEdit(d)}
                  >
                    <i className="bi bi-pencil-fill" /> Edit Profile
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(d.donor_id, d.full_name)}
                    title="Delete Donor"
                  >
                    <i className="bi bi-trash" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h4 style={{ color: 'var(--text-primary)', margin: 0 }}>
                <i className="bi bi-person-heart" style={{ color: 'var(--accent)', marginRight: '0.5rem' }} />
                {editDonor ? 'Edit Donor Profile' : 'Add New Donor'}
              </h4>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>
                <i className="bi bi-x-lg" />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Full Name / Organization *</label>
                <input
                  type="text" className="form-control"
                  placeholder="e.g. Mehta Family Foundation"
                  value={form.full_name}
                  onChange={e => set('full_name', e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email" className="form-control"
                    placeholder="donor@email.com"
                    value={form.email}
                    onChange={e => set('email', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Login Password *</label>
                  <input
                    type="text" className="form-control"
                    placeholder="e.g. Donor@123"
                    value={form.password}
                    onChange={e => set('password', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="text" className="form-control"
                    placeholder="+91 98000 00000"
                    value={form.phone_number}
                    onChange={e => set('phone_number', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-control" value={form.status} onChange={e => set('status', e.target.value)}>
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Address</label>
                <input
                  type="text" className="form-control"
                  placeholder="City, State"
                  value={form.address}
                  onChange={e => set('address', e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving
                    ? <><span className="spinner spinner-sm" /> Saving...</>
                    : <><i className="bi bi-check-lg" /> {editDonor ? 'Update Donor' : 'Add Donor'}</>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
