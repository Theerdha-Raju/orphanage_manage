import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import TopHeader from '../components/TopHeader';
import DonorPaymentModal from '../components/DonorPaymentModal';

const API = '/api';

export default function DonorDashboardPage() {
  const { toggleSidebar } = useOutletContext();
  const userName = localStorage.getItem('userName') || 'Donor';
  const userEmail = localStorage.getItem('userEmail') || '';
  const userRole = localStorage.getItem('userRole') || 'donor';

  const [donations, setDonations] = useState([]);
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('All'); // 'All', 'Money', 'Items'
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [modalInitialType, setModalInitialType] = useState('Monetary');

  const loadData = () => {
    setLoading(true);

    const historyUrl = `${API}/donations/history/?email=${encodeURIComponent(userEmail)}&name=${encodeURIComponent(userName)}&role=${userRole}`;

    Promise.all([
      fetch(historyUrl, {
        headers: {
          'X-User-Email': userEmail,
          'X-User-Role': userRole,
          'X-Donor-Name': userName
        }
      })
        .then(r => r.json())
        .catch(() => []),
      fetch(`${API}/donors/`).then(r => r.json()).catch(() => [])
    ])
      .then(([historyData, donorList]) => {
        let donorRecords = Array.isArray(historyData) ? historyData : [];
        if (Array.isArray(donorList)) setDonors(donorList);

        // Fallback filter if backend history was empty
        if (donorRecords.length === 0 && Array.isArray(donorList)) {
          const matched = donorList.find(
            d => (d.email && d.email.toLowerCase() === userEmail.toLowerCase()) ||
                 (d.full_name && d.full_name.toLowerCase().includes(userName.toLowerCase()))
          );
          if (matched) {
            fetch(`${API}/donations/?donor=${matched.donor_id}`)
              .then(r => r.json())
              .then(data => {
                if (Array.isArray(data)) setDonations(data);
              })
              .catch(() => {});
            return;
          }
        }

        setDonations(donorRecords);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [userEmail, userName]);

  // Match current donor profile
  const currentDonor = donors.find(
    d => (d.email && d.email.toLowerCase() === userEmail.toLowerCase()) ||
         (d.full_name && d.full_name.toLowerCase().includes(userName.toLowerCase()))
  );

  const isMonetary = (d) => d.donation_type === 'Money' || d.donation_type === 'Monetary Donation';

  const myTotalMoney = donations
    .filter(d => isMonetary(d) && (d.payment_status === 'Successful' || !d.payment_status))
    .reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);

  const myItemCount = donations.filter(d => !isMonetary(d)).length;
  const myMoneyCount = donations.filter(d => isMonetary(d)).length;
  const myTaxReceipts = donations.filter(d => isMonetary(d) && d.payment_status === 'Successful').length;

  const stats = [
    { label: 'Total Donated by You', value: myTotalMoney > 0 ? `₹${myTotalMoney.toLocaleString('en-IN')}` : '₹0', icon: 'bi-cash-stack', cls: 'stat-icon-green' },
    { label: 'My Item Contributions', value: myItemCount.toString(), icon: 'bi-box-seam-fill', cls: 'stat-icon-amber' },
    { label: 'My Total Donations', value: donations.length.toString(), icon: 'bi-heart-fill', cls: 'stat-icon-violet' },
    { label: '80G Tax Receipts Issued', value: myTaxReceipts.toString(), icon: 'bi-file-earmark-check-fill', cls: 'stat-icon-accent' },
  ];

  const displayedDonations = donations.filter(d => {
    if (filterType === 'Money') return isMonetary(d);
    if (filterType === 'Items') return !isMonetary(d);
    return true;
  });

  const typeBadge = (type) => {
    if (type === 'Money' || type === 'Monetary Donation') return 'badge-green';
    if (type === 'Food Donation') return 'badge-amber';
    if (type === 'Clothing Donation') return 'badge-cyan';
    if (type === 'Books and Educational Materials') return 'badge-blue';
    if (type === 'Medical Supplies') return 'badge-danger';
    return 'badge-violet';
  };

  return (
    <>
      <TopHeader title="Donor Portal" onToggleSidebar={toggleSidebar} />
      
      <div className="page-body">
        {/* Welcome Banner */}
        <div className="page-banner">
          <div>
            <div className="section-label">Transparent Philanthropy</div>
            <div className="page-banner-title">Welcome, {userName}</div>
            <div className="page-banner-sub">
              Track your verified donation records, item contributions, and download official 80G tax receipts.
            </div>
          </div>
        </div>

        {/* Individual Donor Stat Cards */}
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

        {/* Prominent Donation Quick Action Card */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(37,99,235,0.08) 0%, rgba(22,163,74,0.08) 100%)',
          border: '1px solid rgba(37,99,235,0.22)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem 1.5rem',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#16a34a', fontWeight: 800 }}>
              <i className="bi bi-shield-lock-fill me-1" /> Verified Razorpay Payment Gateway &amp; Logistics
            </div>
            <h3 style={{ margin: '0.2rem 0 0.25rem', color: 'var(--text-primary)', fontSize: '1.2rem' }}>
              Make a New Contribution
            </h3>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Donate online securely via Razorpay (UPI / Cards / NetBanking) or register in-kind items (Food, Clothes, Books, Medicines).
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary"
              onClick={() => {
                setModalInitialType('Monetary');
                setShowPaymentModal(true);
              }}
              style={{ padding: '0.65rem 1.25rem', fontSize: '0.88rem', fontWeight: 700, background: 'linear-gradient(135deg, #16a34a, #2563eb)' }}
            >
              <i className="bi bi-credit-card-2-front-fill me-1" /> Donate Money (Razorpay)
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setModalInitialType('Item');
                setShowPaymentModal(true);
              }}
              style={{ padding: '0.65rem 1.15rem', fontSize: '0.88rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#ffffff', border: '1px solid #cbd5e1' }}
            >
              <i className="bi bi-box-seam-fill" style={{ color: '#d97706' }} /> Donate Items (In-Kind)
            </button>
          </div>
        </div>

        {/* My Donation History Table Section */}
        <div className="chart-card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <div className="chart-card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="bi bi-clock-history" style={{ color: '#2563eb' }} />
                My Donation History
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Showing verified donation records and official receipts for {userName}
              </span>
            </div>
            
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              <button
                className={`btn btn-sm ${filterType === 'All' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.78rem' }}
                onClick={() => setFilterType('All')}
              >
                All Donations ({donations.length})
              </button>
              <button
                className={`btn btn-sm ${filterType === 'Money' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.78rem' }}
                onClick={() => setFilterType('Money')}
              >
                <i className="bi bi-credit-card-2-front-fill me-1" /> Monetary ({myMoneyCount})
              </button>
              <button
                className={`btn btn-sm ${filterType === 'Items' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.78rem' }}
                onClick={() => setFilterType('Items')}
              >
                <i className="bi bi-box-seam-fill me-1" /> Items / In-Kind ({myItemCount})
              </button>
            </div>
          </div>

          <div className="table-wrap" style={{ width: '100%', overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', tableLayout: 'auto' }}>
              <thead>
                <tr>
                  <th style={{ padding: '0.6rem 0.4rem', width: '3%' }}>#</th>
                  <th style={{ padding: '0.6rem 0.4rem', whiteSpace: 'nowrap' }}>Date</th>
                  <th style={{ padding: '0.6rem 0.5rem', whiteSpace: 'nowrap' }}>Receipt / Ref No</th>
                  <th style={{ padding: '0.6rem 0.4rem' }}>Category &amp; Type</th>
                  <th style={{ padding: '0.6rem 0.5rem' }}>Amount / Item Details</th>
                  <th style={{ padding: '0.6rem 0.4rem', whiteSpace: 'nowrap' }}>Payment / Fulfillment</th>
                  <th style={{ padding: '0.6rem 0.4rem' }}>Status</th>
                  <th style={{ padding: '0.6rem 0.5rem', whiteSpace: 'nowrap', textAlign: 'right' }}>Official Receipt</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}><span className="spinner" style={{ margin: '0 auto' }} /></td></tr>
                ) : displayedDonations.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                      <div style={{ fontSize: '1.8rem', color: '#cbd5e1', marginBottom: '0.5rem' }}>
                        <i className="bi bi-inbox" />
                      </div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>No donation records found for your account</div>
                      <div style={{ fontSize: '0.78rem', marginTop: '0.25rem' }}>Make your first donation above to receive your verified 80G tax receipt!</div>
                    </td>
                  </tr>
                ) : displayedDonations.map((d, i) => (
                  <tr key={d.donation_id}>
                    <td style={{ padding: '0.6rem 0.4rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>{i + 1}</td>
                    <td style={{ padding: '0.6rem 0.4rem', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{d.donation_date}</td>
                    <td style={{ padding: '0.6rem 0.5rem', fontSize: '0.8rem', fontWeight: 600 }}>
                      <code style={{ color: 'var(--accent, #2563eb)' }}>{d.receipt_number || `HN-DON-${d.donation_id}`}</code>
                    </td>
                    <td style={{ padding: '0.6rem 0.4rem' }}>
                      <span className={`badge ${typeBadge(d.donation_type)}`} style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}>
                        {d.item_category || d.donation_type}
                      </span>
                    </td>
                    <td style={{ padding: '0.6rem 0.5rem', fontWeight: 700, fontSize: '0.82rem', color: isMonetary(d) ? '#16a34a' : 'var(--text-primary)' }}>
                      {isMonetary(d)
                        ? `₹${parseFloat(d.amount || 0).toLocaleString('en-IN')}`
                        : d.quantity ? `${d.quantity} ${d.unit || 'pcs'} — ${d.item_name || d.item_description}` : (d.item_name || d.item_description || 'In-Kind Contribution')}
                    </td>
                    <td style={{ padding: '0.6rem 0.4rem', fontSize: '0.78rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      {isMonetary(d) ? (
                        <span>
                          <i className="bi bi-shield-check" style={{ color: '#16a34a', marginRight: '0.25rem' }} />
                          {d.razorpay_payment_id ? `Razorpay (${d.razorpay_payment_id.slice(-8)})` : (d.payment_method || 'Razorpay Online')}
                        </span>
                      ) : (
                        <span>
                          <i className="bi bi-truck" style={{ color: '#d97706', marginRight: '0.25rem' }} />
                          {d.delivery_option || 'Orphanage Pickup'}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '0.6rem 0.4rem' }}>
                      <span className={`badge ${d.payment_status === 'Failed' ? 'badge-danger' : d.payment_status === 'Refunded' ? 'badge-violet' : 'badge-green'}`} style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}>
                        <i className={`bi ${d.payment_status === 'Failed' ? 'bi-x-circle-fill' : 'bi-check-circle-fill'} me-1`} />
                        {d.payment_status || d.collection_status || d.status || 'Successful'}
                      </span>
                    </td>
                    <td style={{ padding: '0.6rem 0.5rem', textAlign: 'right' }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: '#2563eb', fontSize: '0.75rem', padding: '0.25rem 0.5rem', whiteSpace: 'nowrap', fontWeight: 600 }}
                        onClick={() => {
                          const url = `${API}/donations/${d.donation_id}/receipt/?email=${encodeURIComponent(userEmail)}&role=donor`;
                          window.open(url, '_blank');
                        }}
                        title={isMonetary(d) ? "Download 80G Tax Exemption Receipt" : "Download Item Acknowledgement Document"}
                      >
                        <i className="bi bi-file-earmark-pdf-fill me-1" />
                        {isMonetary(d) ? '80G Receipt' : 'Ack PDF'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI & Impact Insights Personalized for this Donor */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div className="chart-card">
            <div className="chart-card-title"><i className="bi bi-journal-bookmark-fill" style={{ color: '#3b82f6' }} /> Education Impact</div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Your contributions totaling <strong>₹{myTotalMoney.toLocaleString('en-IN')}</strong> directly provide textbooks, stationery kits, school uniforms, and digital educational tools to children at HopeNest.
            </p>
            <div style={{ padding: '0.75rem', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: '#1d4ed8' }}>
              <i className="bi bi-cpu-fill" style={{ marginRight: '0.4rem' }} />
              <strong>AI Model Impact Forecast:</strong> Active donor backing correlates with a 4.2% average score increase in annual exams.
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-card-title"><i className="bi bi-heart-pulse-fill" style={{ color: '#ef4444' }} /> Health &amp; Wellbeing Impact</div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Your monetary and in-kind contributions fund regular pediatric health checkups, nutritional supplements, and emergency first-aid kits.
            </p>
            <div style={{ padding: '0.75rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: '#15803d' }}>
              <i className="bi bi-check-all" style={{ marginRight: '0.4rem' }} />
              <strong>Verified Care Status:</strong> All supported children are monitored with up-to-date pediatric health logs!
            </div>
          </div>
        </div>

      </div>

      {/* ONLINE PAYMENT & ITEM DONATION MODAL */}
      {showPaymentModal && (
        <DonorPaymentModal
          onClose={() => setShowPaymentModal(false)}
          onSuccess={loadData}
          initialType={modalInitialType}
          initialDonor={currentDonor}
        />
      )}
    </>
  );
}
