import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import TopHeader from '../components/TopHeader';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

import DonorPaymentModal from '../components/DonorPaymentModal';
import { API_URL as API } from '../apiConfig';

const DONATION_TYPES = [
  'All',
  'Monetary Donation',
  'Food Donation',
  'Clothing Donation',
  'Books and Educational Materials',
  'Medical Supplies',
  'Other Essential Items'
];

const COLLECTION_STATUSES = [
  'Pending Collection',
  'Scheduled',
  'Collected',
  'In Orphanage Inventory',
  'Cancelled'
];

export default function DonationPage() {
  const { toggleSidebar } = useOutletContext();
  const userRole = localStorage.getItem('userRole') || 'admin';
  const isAdmin = userRole === 'admin';

  const [donations, setDonations] = useState([]);
  const [paymentOrders, setPaymentOrders] = useState([]);
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [modalInitialType, setModalInitialType] = useState('Monetary');
  const [msg, setMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Active view tab: 'donations' | 'gateway_orders' | 'collections'
  const [activeTab, setActiveTab] = useState('donations');

  // Filters
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterCollection, setFilterCollection] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Chart state
  const [chartLabels, setChartLabels] = useState([]);
  const [chartDataVals, setChartDataVals] = useState([]);

  // Load backend data
  const loadData = () => {
    setLoading(true);
    setErrorMsg('');

    // Fetch from admin dashboard endpoint if available, fallback to list
    fetch(`${API}/donations/admin-dashboard/`, {
      headers: {
        'X-User-Role': userRole,
        'X-User-Email': localStorage.getItem('userEmail') || ''
      }
    })
      .then(res => {
        if (!res.ok) throw new Error('Dashboard endpoint fallback');
        return res.json();
      })
      .then(data => {
        setDonations(Array.isArray(data.donations) ? data.donations : []);
        setPaymentOrders(Array.isArray(data.payment_orders) ? data.payment_orders : []);
        updateChartData(data.donations || []);
      })
      .catch(() => {
        // Fallback to direct /donations/ and /donors/
        Promise.all([
          fetch(`${API}/donations/`).then(r => r.json()).catch(() => []),
          fetch(`${API}/donors/`).then(r => r.json()).catch(() => []),
        ]).then(([d, dn]) => {
          const dList = Array.isArray(d) ? d : [];
          setDonations(dList);
          setDonors(Array.isArray(dn) ? dn : []);
          updateChartData(dList);
        });
      })
      .finally(() => setLoading(false));
  };

  const updateChartData = (donList) => {
    const monthsMap = {};
    donList
      .filter(item => (item.donation_type === 'Money' || item.donation_type === 'Monetary Donation') && item.donation_date)
      .forEach(item => {
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
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update non-monetary collection status
  const handleUpdateCollectionStatus = async (donationId, newStatus) => {
    try {
      const res = await fetch(`${API}/donations/${donationId}/collection-status/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': userRole,
          'X-User-Email': localStorage.getItem('userEmail') || ''
        },
        body: JSON.stringify({ collection_status: newStatus })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMsg(`Collection status updated to "${newStatus}".`);
        setTimeout(() => setMsg(''), 3000);
        loadData();
      } else {
        alert(data.error || 'Failed to update status.');
      }
    } catch {
      alert('Network error while updating collection status.');
    }
  };

  // Direct PDF Receipt Download
  const handleDownloadReceipt = (donationId) => {
    const email = localStorage.getItem('userEmail') || '';
    const url = `${API}/donations/${donationId}/receipt/?email=${encodeURIComponent(email)}&role=${userRole}`;
    window.open(url, '_blank');
  };

  // CSV Report Generator
  const handleExportCSV = () => {
    if (filteredDonations.length === 0) {
      alert('No donation records matching the current filters.');
      return;
    }

    const headers = [
      'Donation ID',
      'Donor Name',
      'Donor Email',
      'Donation Type',
      'Amount (INR)',
      'Item Description',
      'Date',
      'Payment Status',
      'Payment Reference',
      'Razorpay Order ID',
      'Collection Status',
      'Receipt Number'
    ];

    const rows = filteredDonations.map(d => [
      d.donation_id,
      `"${d.donor_name || ''}"`,
      `"${d.donor_email || ''}"`,
      `"${d.donation_type || ''}"`,
      d.amount || '0',
      `"${(d.item_description || d.item_name || '').replace(/"/g, '""')}"`,
      d.donation_date,
      d.payment_status || d.status || 'Received',
      `"${d.razorpay_payment_id || d.payment_method || ''}"`,
      `"${d.razorpay_order_id || ''}"`,
      d.collection_status || 'N/A',
      d.receipt_number || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `HopeNest_Donations_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Monetary Totals calculation
  const isMonetary = (d) => d.donation_type === 'Money' || d.donation_type === 'Monetary Donation';

  const totalMoney = donations
    .filter(d => isMonetary(d) && (d.payment_status === 'Successful' || !d.payment_status))
    .reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);

  const totalItems = donations.filter(d => !isMonetary(d)).length;
  const pendingOrdersCount = paymentOrders.filter(o => o.status === 'Pending').length;
  const successfulCount = donations.filter(d => isMonetary(d) && d.payment_status === 'Successful').length;

  // Filter application
  const filteredDonations = donations.filter(d => {
    // Type filter
    if (filterType !== 'All') {
      if (filterType === 'Monetary Donation') {
        if (!isMonetary(d)) return false;
      } else if (d.donation_type !== filterType) {
        return false;
      }
    }

    // Payment Status filter
    if (filterStatus !== 'All') {
      const pStatus = d.payment_status || (d.status === 'Received' ? 'Successful' : d.status);
      if (pStatus !== filterStatus) return false;
    }

    // Collection Status filter
    if (filterCollection !== 'All') {
      if (d.collection_status !== filterCollection) return false;
    }

    // Date range
    if (dateFrom && d.donation_date < dateFrom) return false;
    if (dateTo && d.donation_date > dateTo) return false;

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchName = d.donor_name && d.donor_name.toLowerCase().includes(term);
      const matchEmail = d.donor_email && d.donor_email.toLowerCase().includes(term);
      const matchReceipt = d.receipt_number && d.receipt_number.toLowerCase().includes(term);
      const matchItem = d.item_description && d.item_description.toLowerCase().includes(term);
      if (!matchName && !matchEmail && !matchReceipt && !matchItem) return false;
    }

    return true;
  });

  // Chart configuration
  const chartData = {
    labels: chartLabels,
    datasets: [{
      label: 'Verified Donations (₹)',
      data: chartDataVals,
      backgroundColor: 'rgba(37,99,235,0.65)',
      borderColor: '#2563eb',
      borderWidth: 1,
      borderRadius: 6,
    }]
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Successful':
      case 'Received':
        return <span className="badge badge-green"><i className="bi bi-check-circle-fill me-1" /> Successful</span>;
      case 'Pending':
        return <span className="badge badge-amber"><i className="bi bi-clock-history me-1" /> Pending</span>;
      case 'Failed':
        return <span className="badge badge-danger"><i className="bi bi-x-circle-fill me-1" /> Failed</span>;
      case 'Refunded':
        return <span className="badge badge-violet"><i className="bi bi-arrow-counterclockwise me-1" /> Refunded</span>;
      default:
        return <span className="badge badge-muted">{status || 'N/A'}</span>;
    }
  };

  const getTypeBadgeClass = (type) => {
    if (type === 'Money' || type === 'Monetary Donation') return 'badge-green';
    if (type === 'Food Donation') return 'badge-amber';
    if (type === 'Clothing Donation') return 'badge-cyan';
    if (type === 'Books and Educational Materials') return 'badge-blue';
    if (type === 'Medical Supplies') return 'badge-danger';
    return 'badge-violet';
  };

  return (
    <>
      <TopHeader title="Donation Management" onToggleSidebar={toggleSidebar} />

      <div className="page-body">
        {/* Banner */}
        <div className="page-banner">
          <div>
            <div className="section-label">Philanthropy &amp; Finance</div>
            <div className="page-banner-title">Donation Management ({donations.length})</div>
            <div className="page-banner-sub">
              Secure Razorpay online payments, in-kind contributions, and automated 80G tax receipts
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary"
              onClick={() => { setModalInitialType('Monetary'); setShowPaymentModal(true); }}
              style={{ fontWeight: 600, background: 'linear-gradient(135deg, #16a34a, #2563eb)' }}
            >
              <i className="bi bi-credit-card-2-front-fill me-1" /> Make Online Payment (Razorpay)
            </button>
            <button
              className="btn btn-success"
              onClick={() => { setModalInitialType('Item'); setShowPaymentModal(true); }}
              style={{ background: 'linear-gradient(135deg, #d97706, #b45309)', border: 'none', color: '#fff', fontWeight: 600 }}
            >
              <i className="bi bi-box-seam-fill me-1" /> Donate Items / In-Kind
            </button>
            <button className="btn btn-secondary" onClick={handleExportCSV}>
              <i className="bi bi-download me-1" /> Export Report (CSV)
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
          {[
            { label: 'Total Verified Cash', value: `₹${(totalMoney / 1000).toFixed(0)}K`, icon: 'bi-cash-stack', cls: 'stat-icon-green' },
            { label: 'In-Kind Contributions', value: totalItems, icon: 'bi-box-seam-fill', cls: 'stat-icon-amber' },
            { label: 'Successful Payments', value: successfulCount, icon: 'bi-shield-check', cls: 'stat-icon-accent' },
            { label: 'Pending / In-Review', value: pendingOrdersCount, icon: 'bi-clock-history', cls: 'stat-icon-violet' },
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
        {errorMsg && <div className="alert alert-danger"><i className="bi bi-exclamation-triangle-fill" /> {errorMsg}</div>}

        {/* Overview Chart & Recent Table */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="chart-card">
            <div className="chart-card-title"><i className="bi bi-bar-chart-fill" />Monthly Verified Cash</div>
            <div style={{ height: 200 }}>
              <Bar
                data={chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    y: { grid: { color: 'rgba(0,0,0,0.06)' }, ticks: { color: '#64748b', font: { size: 10 } } },
                    x: { grid: { color: 'rgba(0,0,0,0.06)' }, ticks: { color: '#64748b', font: { size: 10 } } }
                  }
                }}
              />
            </div>
          </div>

          <div className="table-wrap" style={{ maxHeight: 270, overflowY: 'auto' }}>
            <table className="table">
              <thead>
                <tr><th>Donor</th><th>Type</th><th>Amount / Items</th><th>Status</th><th>Receipt</th></tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}><span className="spinner" style={{ margin: '0 auto' }} /></td></tr>
                ) : donations.slice(0, 6).map((d) => (
                  <tr key={d.donation_id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{d.donor_name || `Donor #${d.donor}`}</td>
                    <td><span className={`badge ${getTypeBadgeClass(d.donation_type)}`}>{d.donation_type}</span></td>
                    <td style={{ fontWeight: 600 }}>{isMonetary(d) ? `₹${parseFloat(d.amount || 0).toLocaleString('en-IN')}` : (d.item_description?.slice(0, 30) || 'In-Kind Item')}</td>
                    <td>{getStatusBadge(d.payment_status || d.status)}</td>
                    <td>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: '#2563eb', padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                        onClick={() => handleDownloadReceipt(d.donation_id)}
                        title="Download PDF Receipt"
                      >
                        <i className="bi bi-file-earmark-pdf-fill" /> PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tab Navigation for Detailed Management */}
        <div className="chart-card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className={`btn btn-sm ${activeTab === 'donations' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTab('donations')}
              >
                <i className="bi bi-table me-1" /> All Donations ({filteredDonations.length})
              </button>
              {isAdmin && (
                <>
                  <button
                    type="button"
                    className={`btn btn-sm ${activeTab === 'gateway_orders' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setActiveTab('gateway_orders')}
                  >
                    <i className="bi bi-shield-check me-1" /> Razorpay Orders Audit ({paymentOrders.length})
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${activeTab === 'collections' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setActiveTab('collections')}
                  >
                    <i className="bi bi-truck me-1" /> In-Kind Collections ({totalItems})
                  </button>
                </>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <div className="input-wrap" style={{ width: 220 }}>
                <input
                  type="text"
                  className="form-control"
                  style={{ fontSize: '0.8rem', padding: '0.35rem 0.6rem' }}
                  placeholder="Search donor, item, receipt..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Filters Bar for Donations tab */}
          {activeTab === 'donations' && (
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              flexWrap: 'wrap',
              padding: '0.75rem',
              background: 'var(--bg-surface-3, #f8fafc)',
              borderRadius: 'var(--radius-md, 8px)',
              marginBottom: '1rem',
              alignItems: 'center'
            }}>
              {/* Type Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Type:</span>
                <select
                  className="form-control"
                  style={{ fontSize: '0.78rem', padding: '0.25rem 0.5rem', height: 'auto', width: 'auto' }}
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  {DONATION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Status Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Status:</span>
                <select
                  className="form-control"
                  style={{ fontSize: '0.78rem', padding: '0.25rem 0.5rem', height: 'auto', width: 'auto' }}
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="All">All Statuses</option>
                  <option value="Successful">Successful</option>
                  <option value="Pending">Pending</option>
                  <option value="Failed">Failed</option>
                  <option value="Refunded">Refunded</option>
                </select>
              </div>

              {/* Date Filters */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>From:</span>
                <input
                  type="date"
                  className="form-control"
                  style={{ fontSize: '0.78rem', padding: '0.25rem 0.4rem', height: 'auto', width: 125 }}
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>To:</span>
                <input
                  type="date"
                  className="form-control"
                  style={{ fontSize: '0.78rem', padding: '0.25rem 0.4rem', height: 'auto', width: 125 }}
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>

              {(filterType !== 'All' || filterStatus !== 'All' || dateFrom || dateTo || searchTerm) && (
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                  onClick={() => {
                    setFilterType('All');
                    setFilterStatus('All');
                    setDateFrom('');
                    setDateTo('');
                    setSearchTerm('');
                  }}
                >
                  <i className="bi bi-x-circle me-1" /> Reset
                </button>
              )}
            </div>
          )}

          {/* TAB 1: ALL DONATIONS TABLE */}
          {activeTab === 'donations' && (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Donor Name</th>
                    <th>Type</th>
                    <th>Amount / Items</th>
                    <th>Date</th>
                    <th>Payment Status</th>
                    <th>Reference</th>
                    <th>Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}><span className="spinner" style={{ margin: '0 auto' }} /></td></tr>
                  ) : filteredDonations.length === 0 ? (
                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      <i className="bi bi-inbox" style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }} />
                      No donations match your search/filter criteria.
                    </td></tr>
                  ) : filteredDonations.map((d, i) => (
                    <tr key={d.donation_id}>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{i + 1}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{d.donor_name || `Donor #${d.donor}`}</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{d.donor_email || d.donor_phone || '—'}</div>
                      </td>
                      <td>
                        <span className={`badge ${getTypeBadgeClass(d.donation_type)}`} style={{ fontSize: '0.72rem' }}>
                          {d.donation_type}
                        </span>
                      </td>
                      <td>
                        {isMonetary(d) ? (
                          <span style={{ fontWeight: 700, color: '#16a34a' }}>₹{parseFloat(d.amount || 0).toLocaleString('en-IN')}</span>
                        ) : (
                          <div style={{ fontSize: '0.82rem' }}>
                            <strong>{d.item_name || d.item_description}</strong>
                            {d.quantity && <span style={{ color: 'var(--text-muted)', marginLeft: '0.3rem' }}>({d.quantity} {d.unit})</span>}
                          </div>
                        )}
                        {d.purpose && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{d.purpose}</div>}
                      </td>
                      <td style={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>{d.donation_date}</td>
                      <td>{getStatusBadge(d.payment_status || (isMonetary(d) ? 'Successful' : 'N/A'))}</td>
                      <td>
                        <div style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>
                          {d.razorpay_payment_id || d.payment_method || '—'}
                        </div>
                        {d.receipt_number && (
                          <div style={{ fontSize: '0.72rem', color: '#2563eb' }}>
                            {d.receipt_number}
                          </div>
                        )}
                      </td>
                      <td>
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ color: '#2563eb', whiteSpace: 'nowrap', fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                          onClick={() => handleDownloadReceipt(d.donation_id)}
                          title="Download Official PDF Receipt"
                        >
                          <i className="bi bi-file-earmark-pdf-fill me-1" />
                          {isMonetary(d) ? 'Receipt' : 'Ack'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 2: RAZORPAY PAYMENT ORDERS AUDIT */}
          {activeTab === 'gateway_orders' && (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Order Ref</th>
                    <th>Donor</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Payment ID</th>
                    <th>Created At</th>
                    <th>Error Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentOrders.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No payment orders recorded yet.</td></tr>
                  ) : paymentOrders.map((po) => (
                    <tr key={po.order_id}>
                      <td><code style={{ fontSize: '0.78rem' }}>{po.razorpay_order_id}</code></td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{po.donor_name}</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{po.donor_email}</div>
                      </td>
                      <td style={{ fontWeight: 700, color: '#16a34a' }}>₹{parseFloat(po.amount).toLocaleString('en-IN')}</td>
                      <td>{getStatusBadge(po.status)}</td>
                      <td><code style={{ fontSize: '0.75rem' }}>{po.razorpay_payment_id || 'Pending'}</code></td>
                      <td style={{ fontSize: '0.78rem' }}>{po.created_at ? new Date(po.created_at).toLocaleString() : '—'}</td>
                      <td style={{ fontSize: '0.78rem', color: '#ef4444' }}>{po.error_reason || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: IN-KIND COLLECTION TRACKER */}
          {activeTab === 'collections' && (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Donor Name</th>
                    <th>Category</th>
                    <th>Item &amp; Quantity</th>
                    <th>Delivery Option</th>
                    <th>Pickup Address</th>
                    <th>Collection Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {donations.filter(d => !isMonetary(d)).length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No in-kind donations found.</td></tr>
                  ) : donations.filter(d => !isMonetary(d)).map((item) => (
                    <tr key={item.donation_id}>
                      <td style={{ fontWeight: 600 }}>{item.donor_name}</td>
                      <td><span className="badge badge-amber">{item.donation_type}</span></td>
                      <td>
                        <strong>{item.item_name || item.item_description}</strong>
                        {item.quantity && <div>{item.quantity} {item.unit}</div>}
                      </td>
                      <td>{item.delivery_option || 'Pickup'}</td>
                      <td style={{ fontSize: '0.8rem' }}>{item.delivery_address || '—'}</td>
                      <td>
                        <span className="badge badge-blue">
                          {item.collection_status || 'Pending Collection'}
                        </span>
                      </td>
                      <td>
                        <select
                          className="form-control"
                          style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem', height: 'auto', width: 150 }}
                          value={item.collection_status || 'Pending Collection'}
                          onChange={(e) => handleUpdateCollectionStatus(item.donation_id, e.target.value)}
                        >
                          {COLLECTION_STATUSES.map(st => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      </div>

      {/* Online Payment / Item Donation Modal */}
      {showPaymentModal && (
        <DonorPaymentModal
          initialType={modalInitialType}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={loadData}
        />
      )}
    </>
  );
}
