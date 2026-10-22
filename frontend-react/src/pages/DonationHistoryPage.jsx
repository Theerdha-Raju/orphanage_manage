import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import TopHeader from '../components/TopHeader';
import DonorPaymentModal from '../components/DonorPaymentModal';

const API = '/api';

export default function DonationHistoryPage() {
  const { toggleSidebar } = useOutletContext();
  const userName = localStorage.getItem('userName') || 'Donor';
  const userEmail = localStorage.getItem('userEmail') || '';
  const userRole = localStorage.getItem('userRole') || 'donor';

  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const loadHistory = () => {
    setLoading(true);
    setError('');

    const historyUrl = `${API}/donations/history/?email=${encodeURIComponent(userEmail)}&name=${encodeURIComponent(userName)}&role=${userRole}`;

    fetch(historyUrl, {
      headers: {
        'X-User-Email': userEmail,
        'X-User-Role': userRole,
        'X-Donor-Name': userName
      }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to load private donation records.');
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setDonations(data);
        } else {
          // Fallback matching by donor ID
          fetch(`${API}/donors/`)
            .then(r => r.json())
            .then(donorList => {
              if (Array.isArray(donorList)) {
                const matched = donorList.find(
                  d => (d.email && d.email.toLowerCase() === userEmail.toLowerCase()) ||
                       (d.full_name && d.full_name.toLowerCase().includes(userName.toLowerCase()))
                );
                if (matched) {
                  fetch(`${API}/donations/history/?donor_id=${matched.donor_id}`)
                    .then(r => r.json())
                    .then(historyItems => {
                      if (Array.isArray(historyItems)) setDonations(historyItems);
                    })
                    .catch(() => {});
                }
              }
            })
            .catch(() => {});
        }
      })
      .catch(err => {
        setError(err.message || 'Unable to connect to server.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadHistory();
  }, [userEmail]);

  const isMonetary = (d) => d.donation_type === 'Money' || d.donation_type === 'Monetary Donation';

  const myTotalCash = donations
    .filter(d => isMonetary(d) && (d.payment_status === 'Successful' || !d.payment_status))
    .reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);

  const myItemCount = donations.filter(d => !isMonetary(d)).length;

  const handleDownloadReceipt = (donationId) => {
    const url = `${API}/donations/${donationId}/receipt/?email=${encodeURIComponent(userEmail)}&role=${userRole}`;
    window.open(url, '_blank');
  };

  const filtered = donations.filter(d => {
    if (filterType === 'Monetary') return isMonetary(d);
    if (filterType === 'InKind') return !isMonetary(d);
    return true;
  });

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
      <TopHeader title="My Donation History" onToggleSidebar={toggleSidebar} />

      <div className="page-body">
        {/* Banner */}
        <div className="page-banner">
          <div>
            <div className="section-label">Donor Portal</div>
            <div className="page-banner-title">Donation History &amp; Receipts</div>
            <div className="page-banner-sub">
              Private record of your financial gifts, in-kind contributions, and official 80G tax certificates
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button
              className="btn btn-primary"
              onClick={() => setShowPaymentModal(true)}
              style={{ fontWeight: 600, background: 'linear-gradient(135deg, #16a34a, #2563eb)' }}
            >
              <i className="bi bi-heart-fill me-1" /> New Donation
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
          {[
            { label: 'Total Given by You', value: `₹${myTotalCash.toLocaleString('en-IN')}`, icon: 'bi-cash-stack', cls: 'stat-icon-green' },
            { label: 'In-Kind Contributions', value: myItemCount, icon: 'bi-box-seam-fill', cls: 'stat-icon-amber' },
            { label: 'Verified Tax Receipts', value: donations.filter(d => isMonetary(d) && (d.payment_status === 'Successful' || !d.payment_status)).length, icon: 'bi-file-earmark-check-fill', cls: 'stat-icon-accent' },
            { label: 'Total Support Events', value: donations.length, icon: 'bi-calendar-heart', cls: 'stat-icon-violet' },
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

        {error && <div className="alert alert-danger"><i className="bi bi-exclamation-triangle-fill" /> {error}</div>}

        {/* Private Donations Table */}
        <div className="chart-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div className="chart-card-title" style={{ margin: 0 }}>
              <i className="bi bi-clock-history me-1" /> Your Personal Giving Records ({filtered.length})
            </div>

            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {[
                { key: 'All', label: `All (${donations.length})`, icon: 'bi-grid' },
                { key: 'Monetary', label: `Monetary (${donations.filter(isMonetary).length})`, icon: 'bi-cash-stack' },
                { key: 'InKind', label: `In-Kind (${donations.filter(d => !isMonetary(d)).length})`, icon: 'bi-box-seam-fill' },
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
                <tr>
                  <th>Donation ID</th>
                  <th>Donation Type</th>
                  <th>Amount / Item Details</th>
                  <th>Donation Date</th>
                  <th>Payment Status</th>
                  <th>Payment Reference</th>
                  <th style={{ textAlign: 'right' }}>Receipt Download</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}><span className="spinner" style={{ margin: '0 auto' }} /></td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    <i className="bi bi-heart" style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }} />
                    No donation records found. Thank you for supporting the children of HopeNest!
                  </td></tr>
                ) : filtered.map((d) => (
                  <tr key={d.donation_id}>
                    <td>
                      <code style={{ fontSize: '0.78rem', color: 'var(--accent)' }}>
                        HN-DON-{d.donation_id}
                      </code>
                    </td>
                    <td>
                      <span className={`badge ${getTypeBadgeClass(d.donation_type)}`} style={{ fontSize: '0.72rem' }}>
                        {d.donation_type}
                      </span>
                    </td>
                    <td>
                      {isMonetary(d) ? (
                        <div>
                          <strong style={{ color: '#16a34a', fontSize: '0.92rem' }}>₹{parseFloat(d.amount || 0).toLocaleString('en-IN')}</strong>
                          {d.purpose && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{d.purpose}</div>}
                        </div>
                      ) : (
                        <div>
                          <strong>{d.item_name || d.item_description}</strong>
                          {d.quantity && <span style={{ color: 'var(--text-muted)', marginLeft: '0.3rem' }}>({d.quantity} {d.unit})</span>}
                          {d.collection_status && (
                            <div><span className="badge badge-amber" style={{ fontSize: '0.68rem' }}>{d.collection_status}</span></div>
                          )}
                        </div>
                      )}
                    </td>
                    <td style={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>{d.donation_date}</td>
                    <td>{getStatusBadge(d.payment_status || (isMonetary(d) ? 'Successful' : 'N/A'))}</td>
                    <td>
                      <div style={{ fontSize: '0.76rem', fontFamily: 'monospace' }}>
                        {d.razorpay_payment_id || d.payment_method || '—'}
                      </div>
                      {d.receipt_number && (
                        <div style={{ fontSize: '0.72rem', color: '#2563eb' }}>
                          Ref: {d.receipt_number}
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: '#2563eb', padding: '0.3rem 0.6rem', fontSize: '0.75rem', fontWeight: 600 }}
                        onClick={() => handleDownloadReceipt(d.donation_id)}
                        title="Download official PDF receipt"
                      >
                        <i className="bi bi-file-earmark-pdf-fill me-1" />
                        {isMonetary(d) ? 'Download 80G Receipt' : 'Download Ack'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {showPaymentModal && (
        <DonorPaymentModal
          onClose={() => setShowPaymentModal(false)}
          onSuccess={loadHistory}
        />
      )}
    </>
  );
}
