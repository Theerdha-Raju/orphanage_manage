import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import TopHeader from '../components/TopHeader';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

import DonorPaymentModal from '../components/DonorPaymentModal';

const API = '/api';

const emptyForm = { donor: '', donation_type: 'Money', amount: '', item_description: '', donation_date: new Date().toISOString().slice(0,10), status: 'Received' };

export default function DonationPage() {
  const { toggleSidebar } = useOutletContext();
  const [donations, setDonations]  = useState([]);
  const [donors, setDonors]        = useState([]);
  const [loading, setLoading]      = useState(true);
  const [showModal, setShowModal]  = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editDonation, setEdit]    = useState(null);
  const [msg, setMsg]              = useState('');
  const [form, setForm]            = useState(emptyForm);
  const [saving, setSaving]        = useState(false);
  const [filterType, setFilterType] = useState('All');
  const [chartLabels, setChartLabels] = useState([]);
  const [chartDataVals, setChartDataVals] = useState([]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetch(`${API}/donations/`).then(r => r.json()).catch(() => []),
      fetch(`${API}/donors/`).then(r => r.json()).catch(() => []),
    ]).then(([d, dn]) => {
      const donList = Array.isArray(d) ? d : [];
      setDonations(donList);
      setDonors(Array.isArray(dn) ? dn : []);

      // Group money donations by month for bar chart
      const monthsMap = {};
      donList.filter(item => item.donation_type === 'Money' && item.donation_date).forEach(item => {
        const m = item.donation_date.slice(0, 7);
        monthsMap[m] = (monthsMap[m] || 0) + parseFloat(item.amount || 0);
      });
      const sorted = Object.keys(monthsMap).sort();
      if (sorted.length > 0) {
        setChartLabels(sorted.map(m => {
          const [y, mn] = m.split('-');
          return new Date(y, mn - 1).toLocaleString('default', { month: 'short' });
        }));
        setChartDataVals(sorted.map(m => Math.round(monthsMap[m])));
      }
    }).finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const totalMoney = donations.filter(d => d.donation_type === 'Money').reduce((a, d) => a + parseFloat(d.amount || 0), 0);

  const chartData = {
    labels: chartLabels,
    datasets: [{
      label: 'Donations (₹)',
      data: chartDataVals,
      backgroundColor: 'rgba(37,99,235,0.65)',
      borderColor: '#2563eb', borderWidth: 1, borderRadius: 6,
    }]
  };

  const openAdd = () => {
    setEdit(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openAddItem = () => {
    setEdit(null);
    setForm({
      ...emptyForm,
      donation_type: 'Item',
      amount: '',
    });
    setShowModal(true);
  };

  const openEdit = (d) => {
    setEdit(d);
    setForm({
      donor: d.donor,
      donation_type: d.donation_type,
      amount: d.amount || '',
      item_description: d.item_description || '',
      donation_date: d.donation_date,
      status: d.status || 'Received'
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this donation record?')) return;
    try {
      const r = await fetch(`${API}/donations/${id}/`, { method: 'DELETE' });
      if (r.ok || r.status === 204) {
        setMsg('Donation deleted.');
        setTimeout(() => setMsg(''), 3000);
        loadData();
      }
    } catch { alert('Failed to delete donation.'); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const url = editDonation ? `${API}/donations/${editDonation.donation_id}/` : `${API}/donations/`;
    const method = editDonation ? 'PUT' : 'POST';
    try {
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (r.ok) {
        setShowModal(false);
        setMsg(editDonation ? 'Donation updated.' : 'Donation recorded.');
        setTimeout(() => setMsg(''), 3000);
        loadData();
      } else {
        alert('Failed to save donation record.');
      }
    } catch {} finally { setSaving(false); }
  };

  const typeColors = { Money: 'badge-green', Item: 'badge-amber', Service: 'badge-violet' };

  return (
    <>
      <TopHeader title="Donation Management" onToggleSidebar={toggleSidebar} />

      <div className="page-body">
        <div className="page-banner">
          <div>
            <div className="section-label">Finance</div>
            <div className="page-banner-title">Donation Management ({donations.length})</div>
            <div className="page-banner-sub">Transparent tracking of all cash and item donations</div>
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => setShowPaymentModal(true)}>
              <i className="bi bi-credit-card-2-front-fill" /> Make Online Payment
            </button>
            <button
              className="btn btn-success"
              onClick={openAddItem}
              style={{ background: 'linear-gradient(135deg, #d97706, #b45309)', border: 'none', color: '#fff', fontWeight: 600 }}
            >
              <i className="bi bi-box-seam-fill" /> Donate Items / In-Kind
            </button>
            <button className="btn btn-secondary" onClick={openAdd}>
              <i className="bi bi-plus-lg" /> Record Manual Entry
            </button>
          </div>
        </div>

        <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
          {[
            { label: 'Total Donations', value: donations.length, icon: 'bi-gift-fill', cls: 'stat-icon-accent' },
            { label: 'Cash Received',   value: `₹${(totalMoney/1000).toFixed(0)}K`, icon: 'bi-cash-stack', cls: 'stat-icon-green' },
            { label: 'Item Donations',  value: donations.filter(d => d.donation_type === 'Item').length, icon: 'bi-box-seam-fill', cls: 'stat-icon-amber' },
            { label: 'Donors',          value: donors.length, icon: 'bi-person-heart', cls: 'stat-icon-violet' },
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="chart-card">
            <div className="chart-card-title"><i className="bi bi-bar-chart-fill" />Monthly Cash Overview</div>
            <div style={{ height: 200 }}>
              <Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { grid: { color: 'rgba(0,0,0,0.06)' }, ticks: { color: '#64748b', font: { size: 10 } } }, x: { grid: { color: 'rgba(0,0,0,0.06)' }, ticks: { color: '#64748b', font: { size: 10 } } } } }} />
            </div>
          </div>
          <div className="table-wrap" style={{ maxHeight: 280, overflowY: 'auto' }}>
            <table className="table">
              <thead>
                <tr><th>Donor</th><th>Type</th><th>Amount/Item</th><th>Date</th><th>Status</th></tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}><span className="spinner" style={{ margin: '0 auto' }} /></td></tr>
                ) : donations.slice(0, 8).map((d) => (
                  <tr key={d.donation_id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{d.donor_name || `Donor #${d.donor}`}</td>
                    <td><span className={`badge ${typeColors[d.donation_type] || 'badge-muted'}`}>{d.donation_type}</span></td>
                    <td style={{ fontWeight: 600 }}>{d.donation_type === 'Money' ? `₹${parseFloat(d.amount).toLocaleString('en-IN')}` : (d.item_description?.slice(0,25) || '—')}</td>
                    <td style={{ fontSize: '0.82rem' }}>{d.donation_date}</td>
                    <td><span className="badge badge-green">{d.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* All donations table with full CRUD */}
        <div className="chart-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div className="chart-card-title" style={{ margin: 0 }}><i className="bi bi-table" /> All Donations</div>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {[
                { key: 'All', label: `All (${donations.length})`, icon: 'bi-grid' },
                { key: 'Money', label: `Cash (${donations.filter(d => d.donation_type === 'Money').length})`, icon: 'bi-cash-stack' },
                { key: 'Item', label: `Items (${donations.filter(d => d.donation_type === 'Item').length})`, icon: 'bi-box-seam-fill' },
              ].map(f => (
                <button
                  key={f.key}
                  type="button"
                  className={`btn btn-sm ${filterType === f.key ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                  onClick={() => setFilterType(f.key)}
                >
                  <i className={`bi ${f.icon} me-1`} /> {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>#</th><th>Donor</th><th>Type</th><th>Amount / Description</th><th>Date</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}><span className="spinner" style={{ margin: '0 auto' }} /></td></tr>
                ) : donations.filter(d => filterType === 'All' ? true : d.donation_type === filterType).length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    <i className="bi bi-gift" style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }} />No {filterType !== 'All' ? filterType.toLowerCase() : ''} donations found
                  </td></tr>
                ) : donations.filter(d => filterType === 'All' ? true : d.donation_type === filterType).map((d, i) => (
                  <tr key={d.donation_id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{i+1}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{d.donor_name || `Donor #${d.donor}`}</td>
                    <td><span className={`badge ${typeColors[d.donation_type] || 'badge-muted'}`}>{d.donation_type}</span></td>
                    <td style={{ fontWeight: 600 }}>{d.donation_type === 'Money' ? `₹${parseFloat(d.amount || 0).toLocaleString('en-IN')}` : (d.item_description || '—')}</td>
                    <td style={{ fontSize: '0.82rem' }}>{d.donation_date}</td>
                    <td><span className="badge badge-green">{d.status}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(d)} title="Edit"><i className="bi bi-pencil" /></button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(d.donation_id)} title="Delete"><i className="bi bi-trash" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-header">
              <h4 style={{ color: 'var(--text-primary)', margin: 0 }}>
                <i className={`bi ${form.donation_type === 'Item' ? 'bi-box-seam-fill' : 'bi-gift-fill'}`} style={{ color: form.donation_type === 'Item' ? '#d97706' : 'var(--accent)', marginRight: '0.5rem' }} />
                {editDonation ? 'Edit Donation' : (form.donation_type === 'Item' ? 'Donate Items (In-Kind)' : 'Record Donation')}
              </h4>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}><i className="bi bi-x-lg" /></button>
            </div>
            <form onSubmit={handleSave} onKeyDown={(e) => { if (e.key === 'Enter' && e.target.tagName === 'INPUT') e.preventDefault(); }}>
              <div className="form-group">
                <label className="form-label">Donor *</label>
                <select className="form-control" value={form.donor} onChange={e => set('donor', e.target.value)} required>
                  <option value="">— Select Donor —</option>
                  {donors.map(d => <option key={d.donor_id} value={d.donor_id}>{d.full_name}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Donation Type</label>
                  <select className="form-control" value={form.donation_type} onChange={e => set('donation_type', e.target.value)}>
                    <option>Money</option><option>Item</option><option>Service</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input type="date" className="form-control" value={form.donation_date} onChange={e => set('donation_date', e.target.value)} />
                </div>
              </div>
              {form.donation_type === 'Money' ? (
                <div className="form-group">
                  <label className="form-label">Amount (₹) *</label>
                  <input type="number" className="form-control" placeholder="e.g. 25000" value={form.amount} onChange={e => set('amount', e.target.value)} required />
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">
                    <i className="bi bi-box-seam-fill me-1" style={{ color: '#d97706' }} />
                    Item Description &amp; Quantity *
                  </label>
                  
                  {/* Preset Pills */}
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                    {[
                      'School Bags & Stationery Kits',
                      'Winter Blankets & Clothes',
                      'School Uniforms & Shoes',
                      'Ration, Rice & Nutrition Supplies',
                      'Desktop Computers / Laptops',
                      'Sports & Play Equipment',
                      'Pediatric Medicines & First Aid'
                    ].map(preset => (
                      <button
                        key={preset}
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', border: '1px solid #cbd5e1', borderRadius: '1rem', background: '#f8fafc', color: '#475569' }}
                        onClick={() => set('item_description', preset)}
                      >
                        + {preset}
                      </button>
                    ))}
                  </div>

                  <textarea
                    className="form-control"
                    placeholder="Describe the donated items and quantities (e.g. 50 Sets of Winter Blankets, 100 Notebooks)..."
                    value={form.item_description}
                    onChange={e => set('item_description', e.target.value)}
                    required
                    style={{ minHeight: 75 }}
                  />
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><span className="spinner spinner-sm" /> Saving...</> : <><i className="bi bi-check-lg" /> {editDonation ? 'Update' : 'Save'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPaymentModal && (
        <DonorPaymentModal
          onClose={() => setShowPaymentModal(false)}
          onSuccess={loadData}
        />
      )}
    </>
  );
}
