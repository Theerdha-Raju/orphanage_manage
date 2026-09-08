import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import TopHeader from '../components/TopHeader';

const API = 'http://localhost:8000/api';

const CATEGORIES = ['Food', 'Medical', 'Education', 'Utilities', 'Maintenance', 'Clothing', 'Transportation', 'Other'];
const STATUSES   = ['Paid', 'Pending', 'Cancelled'];

const CAT_COLORS = {
  Food: '#f59e0b', Medical: '#ef4444', Education: '#3b82f6',
  Utilities: '#8b5cf6', Maintenance: '#6b7280', Clothing: '#ec4899',
  Transportation: '#14b8a6', Other: '#64748b',
};

const STATUS_BADGE = { Paid: 'badge-green', Pending: 'badge-amber', Cancelled: 'badge-rose' };

const emptyForm = { title: '', category: 'Food', amount: '', expense_date: new Date().toISOString().slice(0,10), paid_by: '', description: '', status: 'Paid' };

export default function ExpenseManagementPage() {
  const { toggleSidebar } = useOutletContext();
  const [expenses, setExpenses]    = useState([]);
  const [loading, setLoading]      = useState(true);
  const [search, setSearch]        = useState('');
  const [filterCat, setFilterCat]  = useState('All');
  const [filterStat, setFilterStat]= useState('All');
  const [showModal, setShowModal]  = useState(false);
  const [editExpense, setEdit]     = useState(null);
  const [form, setForm]            = useState(emptyForm);
  const [saving, setSaving]        = useState(false);
  const [msg, setMsg]              = useState('');
  const [error, setError]          = useState('');

  useEffect(() => { loadExpenses(); }, []);

  const loadExpenses = () => {
    setLoading(true);
    fetch(`${API}/expenses/`)
      .then(r => r.json())
      .then(data => setExpenses(Array.isArray(data) ? data : (data.results || [])))
      .catch(() => setExpenses([]))
      .finally(() => setLoading(false));
  };

  const openAdd = () => {
    setEdit(null);
    setForm(emptyForm);
    setError('');
    setShowModal(true);
  };

  const openEdit = (ex) => {
    setEdit(ex);
    setForm({
      title: ex.title,
      category: ex.category,
      amount: ex.amount,
      expense_date: ex.expense_date,
      paid_by: ex.paid_by || '',
      description: ex.description || '',
      status: ex.status
    });
    setError('');
    setShowModal(true);
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');

    // --- FORM VALIDATION ---
    if (!form.category || !form.category.trim()) {
      setError('Validation Error: Expense Category is required.');
      return;
    }

    if (!form.description || !form.description.trim()) {
      setError('Validation Error: Expense Description is required.');
      return;
    }

    const amtVal = parseFloat(form.amount);
    if (isNaN(amtVal) || amtVal <= 0) {
      setError('Validation Error: Expense Amount must be a positive number greater than 0.');
      return;
    }

    if (!form.expense_date) {
      setError('Validation Error: Expense Date is required.');
      return;
    }

    setSaving(true);
    const url    = editExpense ? `${API}/expenses/${editExpense.expense_id}/` : `${API}/expenses/`;
    const method = editExpense ? 'PATCH' : 'POST';
    try {
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (r.ok) {
        setMsg(editExpense ? 'Expense updated successfully.' : 'Expense added successfully.');
        setTimeout(() => setMsg(''), 3000);
        setShowModal(false);
        loadExpenses();
      } else {
        const err = await r.json();
        setError('Failed to save expense: ' + JSON.stringify(err));
      }
    } catch {
      setError('Unable to connect to server.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense record?')) return;
    try {
      const r = await fetch(`${API}/expenses/${id}/`, { method: 'DELETE' });
      if (r.ok || r.status === 204) {
        setMsg('Expense record deleted.');
        setTimeout(() => setMsg(''), 3000);
        loadExpenses();
      }
    } catch {
      alert('Failed to delete expense record.');
    }
  };

  const filtered = expenses.filter(e => {
    const matchSearch = e.title?.toLowerCase().includes(search.toLowerCase()) || e.paid_by?.toLowerCase().includes(search.toLowerCase());
    const matchCat   = filterCat  === 'All' || e.category === filterCat;
    const matchStat  = filterStat === 'All' || e.status   === filterStat;
    return matchSearch && matchCat && matchStat;
  });

  const total    = filtered.reduce((a, e) => a + parseFloat(e.amount || 0), 0);
  const paid     = filtered.filter(e => e.status === 'Paid').reduce((a, e) => a + parseFloat(e.amount || 0), 0);
  const pending  = filtered.filter(e => e.status === 'Pending').reduce((a, e) => a + parseFloat(e.amount || 0), 0);

  const catSummary = CATEGORIES.map(c => ({
    name: c, total: expenses.filter(e => e.category === c).reduce((a, e) => a + parseFloat(e.amount || 0), 0)
  })).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

  return (
    <>
      <TopHeader title="Expense Management" onToggleSidebar={toggleSidebar} />

      <div className="page-body">
        <div className="page-banner">
          <div>
            <div className="section-label">Finance</div>
            <div className="page-banner-title">Expense Audit ({expenses.length})</div>
            <div className="page-banner-sub">Track, categorize and audit all real orphanage expenditures</div>
          </div>
          <button className="btn btn-primary" onClick={openAdd}>
            <i className="bi bi-plus-lg" /> Add Expense
          </button>
        </div>

        {/* Summary */}
        <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
          {[
            { label: 'Total Expenses', value: `₹${(total/1000).toFixed(1)}K`, icon: 'bi-cash-stack', cls: 'stat-icon-accent' },
            { label: 'Paid Expenses',  value: `₹${(paid/1000).toFixed(1)}K`,  icon: 'bi-check-circle-fill', cls: 'stat-icon-green' },
            { label: 'Pending',        value: `₹${(pending/1000).toFixed(1)}K`, icon: 'bi-hourglass-split', cls: 'stat-icon-amber' },
            { label: 'Categories',     value: catSummary.length,               icon: 'bi-grid-fill', cls: 'stat-icon-violet' },
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

        {/* Category bars */}
        {catSummary.length > 0 && (
          <div className="chart-card" style={{ marginBottom: '1.25rem' }}>
            <div className="chart-card-title"><i className="bi bi-pie-chart-fill" />Expense Breakdown by Category</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '0.5rem' }}>
              {catSummary.map(c => (
                <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: 110, fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', flexShrink: 0 }}>{c.name}</div>
                  <div style={{ flex: 1, height: 8, background: 'var(--bg-surface-3)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min((c.total / total) * 100, 100)}%`, background: CAT_COLORS[c.name], borderRadius: 'var(--radius-full)', transition: 'width 0.6s ease' }} />
                  </div>
                  <div style={{ width: 80, fontSize: '0.82rem', fontWeight: 700, color: CAT_COLORS[c.name], textAlign: 'right', flexShrink: 0 }}>₹{c.total.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="input-wrap" style={{ flex: 1, minWidth: 200 }}>
            <i className="bi bi-search input-icon" />
            <input type="text" className="form-control" placeholder="Search expenses by title or payer..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="form-control" style={{ width: 'auto' }} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
            <option value="All">All Categories</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <select className="form-control" style={{ width: 'auto' }} value={filterStat} onChange={e => setFilterStat(e.target.value)}>
            <option value="All">All Statuses</option>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="table-wrap" style={{ borderRadius: '1rem', border: '1px solid rgba(255, 255, 255, 0.08)', overflowX: 'auto', background: 'var(--bg-card)' }}>
          <table className="table" style={{ width: '100%', margin: 0, borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead>
              <tr style={{ background: 'rgba(15, 23, 42, 0.95)' }}>
                <th style={{ padding: '0.75rem 0.5rem', color: '#94a3b8', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em', textAlign: 'center', width: '35px' }}>#</th>
                <th style={{ padding: '0.75rem 0.6rem', color: '#94a3b8', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>TITLE</th>
                <th style={{ padding: '0.75rem 0.6rem', color: '#94a3b8', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>CATEGORY</th>
                <th style={{ padding: '0.75rem 0.6rem', color: '#94a3b8', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>AMOUNT</th>
                <th style={{ padding: '0.75rem 0.6rem', color: '#94a3b8', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>DATE</th>
                <th style={{ padding: '0.75rem 0.6rem', color: '#94a3b8', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>PAID BY</th>
                <th style={{ padding: '0.75rem 0.5rem', color: '#94a3b8', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em', textAlign: 'center' }}>STATUS</th>
                <th style={{ padding: '0.75rem 0.6rem', color: '#94a3b8', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em', textAlign: 'center', minWidth: '95px', whiteSpace: 'nowrap' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                  <span className="spinner" style={{ margin: '0 auto' }} />
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                  <i className="bi bi-receipt" style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }} />
                  No expenses found
                </td></tr>
              ) : filtered.map((e, i) => (
                <tr key={e.expense_id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, padding: '0.75rem 0.5rem', textAlign: 'center' }}>{i + 1}</td>
                  <td style={{ padding: '0.75rem 0.6rem' }}>
                    <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.88rem', whiteSpace: 'nowrap' }}>{e.title}</div>
                    {e.description && <div style={{ fontSize: '0.7rem', color: '#94a3b8', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.description}</div>}
                  </td>
                  <td style={{ padding: '0.75rem 0.6rem' }}>
                    <span className="badge" style={{ background: `${CAT_COLORS[e.category] || '#64748b'}20`, color: CAT_COLORS[e.category] || '#64748b', border: `1px solid ${CAT_COLORS[e.category] || '#64748b'}40`, fontWeight: 700, fontSize: '0.72rem' }}>
                      {e.category}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 0.6rem', fontWeight: 800, color: '#4ade80', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                    ₹{parseFloat(e.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '0.75rem 0.6rem', fontSize: '0.82rem', color: '#cbd5e1', whiteSpace: 'nowrap' }}>{e.expense_date}</td>
                  <td style={{ padding: '0.75rem 0.6rem', fontSize: '0.82rem', color: '#cbd5e1', whiteSpace: 'nowrap' }}>{e.paid_by || '—'}</td>
                  <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                    <span className={`badge ${STATUS_BADGE[e.status] || 'badge-muted'}`} style={{ fontWeight: 700, padding: '0.25rem 0.6rem', fontSize: '0.72rem' }}>
                      {e.status}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 0.6rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center' }}>
                      <button
                        type="button"
                        onClick={() => openEdit(e)}
                        title="Edit Expense"
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
                        onClick={() => handleDelete(e.expense_id)}
                        title="Delete Expense"
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
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h4 style={{ color: 'var(--text-primary)', margin: 0 }}>
                <i className="bi bi-cash-stack" style={{ color: 'var(--accent)', marginRight: '0.5rem' }} />
                {editExpense ? 'Edit Expense Record' : 'Add New Expense Record'}
              </h4>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}><i className="bi bi-x-lg" /></button>
            </div>
            <form onSubmit={handleSave}>
              {error && (
                <div className="alert alert-error" style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
                  <i className="bi bi-exclamation-triangle-fill" /> {error}
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Expense Title *</label>
                <input type="text" className="form-control" placeholder="e.g. Monthly Grocery Purchase" value={form.title} onChange={e => set('title', e.target.value)} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select className="form-control" value={form.category} onChange={e => set('category', e.target.value)}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Amount (₹) *</label>
                  <input type="number" step="0.01" className="form-control" placeholder="e.g. 15000" value={form.amount} onChange={e => set('amount', e.target.value)} required />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input type="date" className="form-control" value={form.expense_date} onChange={e => set('expense_date', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Status *</label>
                  <select className="form-control" value={form.status} onChange={e => set('status', e.target.value)}>
                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Paid By</label>
                <input type="text" className="form-control" placeholder="Name of person or account" value={form.paid_by} onChange={e => set('paid_by', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Description / Bill Notes</label>
                <textarea className="form-control" placeholder="Receipt details, vendor name or notes..." value={form.description} onChange={e => set('description', e.target.value)} style={{ minHeight: 70 }} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><span className="spinner spinner-sm" /> Saving...</> : <><i className="bi bi-check-lg" /> {editExpense ? 'Update Expense' : 'Save Expense'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
