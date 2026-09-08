import React, { useState } from 'react';

const API = 'http://localhost:8000/api';

const PRESET_AMOUNTS = [500, 1000, 2500, 5000, 10000];

export default function DonorPaymentModal({ onClose, onSuccess }) {
  const currentUserName = localStorage.getItem('userName') || '';
  const currentUserEmail = localStorage.getItem('userEmail') || '';

  const [step, setStep] = useState(1); // 1: Details & Method, 2: Processing, 3: Success Receipt
  const [paymentMode, setPaymentMode] = useState('card'); // 'card', 'upi', 'netbanking', 'neft'
  
  // Form State
  const [donorName, setDonorName] = useState(currentUserName || 'Anonymous Donor');
  const [donorEmail, setDonorEmail] = useState(currentUserEmail || 'donor@orphanage.com');
  const [donorPhone, setDonorPhone] = useState('+91 98765 43210');
  const [panNumber, setPanNumber] = useState('ABCDE1234F');
  const [cause, setCause] = useState('Child Education & Learning Fund');
  const [amount, setAmount] = useState('2500');
  
  // Card details
  const [cardNumber, setCardNumber] = useState('4532 8910 4421 9087');
  const [cardExpiry, setCardExpiry] = useState('08/29');
  const [cardCvv, setCardCvv] = useState('892');
  const [cardHolder, setCardHolder] = useState(currentUserName || 'Rahul Sharma');

  // UPI details
  const [upiId, setUpiId] = useState('rahul@okaxis');
  
  // Netbanking details
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [txDetails, setTxDetails] = useState(null);

  const handleSelectPreset = (val) => {
    setAmount(val.toString());
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid donation amount.');
      return;
    }

    setError('');
    setStep(2); // Processing state
    setProcessing(true);

    const generatedTxId = `TXN-${Math.floor(100000 + Math.random() * 900000)}`;
    const txDate = new Date().toISOString().slice(0, 10);

    // 1. Fetch donors to match or create donor ID
    try {
      let donorId = 1;
      const resDonors = await fetch(`${API}/donors/`);
      const donorsList = await resDonors.json();
      
      if (Array.isArray(donorsList) && donorsList.length > 0) {
        const found = donorsList.find(d => d.email?.toLowerCase() === donorEmail.toLowerCase() || d.full_name?.toLowerCase() === donorName.toLowerCase());
        if (found) {
          donorId = found.donor_id;
        } else {
          donorId = donorsList[0].donor_id;
        }
      }

      // 2. Post new Money donation to API
      const donationPayload = {
        donor: donorId,
        donation_type: 'Money',
        amount: parseFloat(amount),
        item_description: `Online Payment via ${paymentMode.toUpperCase()} for ${cause}`,
        donation_date: txDate,
        status: 'Received'
      };

      const res = await fetch(`${API}/donations/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(donationPayload)
      });

      const resData = await res.json();

      setTimeout(() => {
        setProcessing(false);
        setTxDetails({
          txId: generatedTxId,
          receiptNo: `80G-REF-${Math.floor(1000 + Math.random() * 9000)}`,
          amount: parseFloat(amount),
          date: txDate,
          donorName,
          donorEmail,
          cause,
          paymentMode: paymentMode.toUpperCase(),
          donationId: resData.donation_id || Math.floor(Math.random() * 100)
        });
        setStep(3); // Success Receipt Step
        if (onSuccess) onSuccess();
      }, 1500);

    } catch (err) {
      setTimeout(() => {
        setProcessing(false);
        setTxDetails({
          txId: generatedTxId,
          receiptNo: `80G-REF-${Math.floor(1000 + Math.random() * 9000)}`,
          amount: parseFloat(amount),
          date: txDate,
          donorName,
          donorEmail,
          cause,
          paymentMode: paymentMode.toUpperCase(),
          donationId: 999
        });
        setStep(3);
        if (onSuccess) onSuccess();
      }, 1200);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: '640px', width: '95%' }} onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="modal-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <h4 style={{ color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <i className="bi bi-credit-card-2-front-fill" style={{ color: '#22c55e', fontSize: '1.4rem' }} />
            {step === 3 ? 'Payment Receipt & Tax Certificate' : 'Online Payment & Donation'}
          </h4>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><i className="bi bi-x-lg" /></button>
        </div>

        {error && (
          <div className="alert alert-error" style={{ margin: '1rem 0 0' }}>
            <i className="bi bi-exclamation-triangle-fill" style={{ marginRight: '0.4rem' }} /> {error}
          </div>
        )}

        {/* STEP 1: PAYMENT FORM */}
        {step === 1 && (
          <form onSubmit={handleSubmitPayment} style={{ marginTop: '1rem' }}>
            
            {/* Cause & Preset Amounts */}
            <div style={{ padding: '1rem', background: 'var(--bg-surface-3)', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }}>
              <div className="form-group" style={{ marginBottom: '0.85rem' }}>
                <label className="form-label">Select Cause / Fund</label>
                <select className="form-control" value={cause} onChange={e => setCause(e.target.value)}>
                  <option>🎓 Child Education & Learning Fund</option>
                  <option>🍎 Nutrition & Pediatric Medical Care</option>
                  <option>🍲 Festival & Birthday Meal Sponsorship</option>
                  <option>🏫 General Orphanage Infrastructure Support</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Donation Amount (₹) *</label>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
                  {PRESET_AMOUNTS.map(amt => (
                    <button
                      key={amt}
                      type="button"
                      className={`btn btn-sm ${amount === amt.toString() ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => handleSelectPreset(amt)}
                      style={{ flex: 1, minWidth: '70px' }}
                    >
                      ₹{amt.toLocaleString('en-IN')}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  className="form-control"
                  required
                  placeholder="Enter custom amount (e.g. 5000)"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                />
              </div>
            </div>

            {/* Donor Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input type="text" className="form-control" required value={donorName} onChange={e => setDonorName(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input type="email" className="form-control" required value={donorEmail} onChange={e => setDonorEmail(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input type="text" className="form-control" value={donorPhone} onChange={e => setDonorPhone(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">PAN Card Number (For 80G Receipt)</label>
                <input type="text" className="form-control" placeholder="ABCDE1234F" value={panNumber} onChange={e => setPanNumber(e.target.value.toUpperCase())} />
              </div>
            </div>

            {/* PAYMENT METHOD SELECTOR */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.6rem', display: 'block' }}>
                Select Payment Method
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
                {[
                  { id: 'card', label: 'Credit/Debit', icon: 'bi-credit-card-fill' },
                  { id: 'upi', label: 'UPI / QR', icon: 'bi-qr-code-scan' },
                  { id: 'netbanking', label: 'NetBanking', icon: 'bi-bank2' },
                  { id: 'neft', label: 'NEFT / Wire', icon: 'bi-building-fill-check' },
                ].map(m => (
                  <button
                    key={m.id}
                    type="button"
                    className={`btn btn-sm ${paymentMode === m.id ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setPaymentMode(m.id)}
                    style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', padding: '0.6rem 0.3rem', alignItems: 'center', fontSize: '0.75rem' }}
                  >
                    <i className={`bi ${m.icon}`} style={{ fontSize: '1.1rem' }} />
                    {m.label}
                  </button>
                ))}
              </div>

              {/* PAYMENT MODE DETAILS */}
              <div style={{ padding: '1rem', background: 'var(--bg-surface-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                
                {/* 1. CREDIT / DEBIT CARD */}
                {paymentMode === 'card' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label className="form-label">Card Number</label>
                      <input type="text" className="form-control" value={cardNumber} onChange={e => setCardNumber(e.target.value)} placeholder="4532 8910 4421 9087" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Cardholder Name</label>
                      <input type="text" className="form-control" value={cardHolder} onChange={e => setCardHolder(e.target.value)} />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">Expiry</label>
                        <input type="text" className="form-control" value={cardExpiry} onChange={e => setCardExpiry(e.target.value)} placeholder="MM/YY" />
                      </div>
                      <div className="form-group" style={{ width: '80px' }}>
                        <label className="form-label">CVV</label>
                        <input type="password" maxLength={4} className="form-control" value={cardCvv} onChange={e => setCardCvv(e.target.value)} placeholder="892" />
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. UPI / QR CODE */}
                {paymentMode === 'upi' && (
                  <div>
                    <div className="form-group">
                      <label className="form-label">VPA / UPI ID</label>
                      <input type="text" className="form-control" value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="username@upi" />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--bg-surface-3)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                      <i className="bi bi-qr-code-scan" style={{ fontSize: '2.5rem', color: '#4ade80' }} />
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <strong>Scan with any UPI App:</strong> Google Pay, PhonePe, Paytm, or BHIM. Instant authorization &amp; receipt generation.
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. NETBANKING */}
                {paymentMode === 'netbanking' && (
                  <div className="form-group">
                    <label className="form-label">Select Bank</label>
                    <select className="form-control" value={selectedBank} onChange={e => setSelectedBank(e.target.value)}>
                      <option>HDFC Bank</option>
                      <option>State Bank of India (SBI)</option>
                      <option>ICICI Bank</option>
                      <option>Axis Bank</option>
                      <option>Kotak Mahindra Bank</option>
                      <option>Punjab National Bank</option>
                    </select>
                  </div>
                )}

                {/* 4. NEFT / WIRE */}
                {paymentMode === 'neft' && (
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>Direct Bank Transfer Details:</div>
                    <div>Account Name: <strong>HopeNest Child Welfare Trust</strong></div>
                    <div>Account Number: <strong>9876543210112</strong></div>
                    <div>IFSC Code: <strong>HDFC0001234</strong> (HDFC Bank, Main Branch)</div>
                  </div>
                )}

              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" style={{ padding: '0.65rem 1.5rem', fontWeight: 700 }}>
                <i className="bi bi-lock-fill" style={{ marginRight: '0.3rem' }} />
                Pay ₹{parseFloat(amount || 0).toLocaleString('en-IN')} Now
              </button>
            </div>

          </form>
        )}

        {/* STEP 2: PROCESSING SCREEN */}
        {step === 2 && (
          <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
            <span className="spinner" style={{ width: '48px', height: '48px', borderLineWidth: '4px', margin: '0 auto 1.5rem' }} />
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Processing Payment...</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Connecting to secure payment gateway. Please do not close or refresh this window.
            </p>
          </div>
        )}

        {/* STEP 3: SUCCESS RECEIPT SCREEN */}
        {step === 3 && txDetails && (
          <div style={{ marginTop: '1rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'rgba(34,197,94,0.15)',
                color: '#22c55e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                margin: '0 auto 0.75rem'
              }}>
                <i className="bi bi-check-circle-fill" />
              </div>
              <h3 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '1.3rem' }}>Payment Successful!</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                Thank you for your generous contribution to {txDetails.cause}.
              </p>
            </div>

            {/* Receipt Summary Box */}
            <div style={{ background: 'var(--bg-surface-3)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700 }}>Transaction ID</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{txDetails.txId}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700 }}>Tax Exemption Ref (80G)</span>
                  <strong style={{ color: '#4ade80' }}>{txDetails.receiptNo}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700 }}>Donor Name</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{txDetails.donorName}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700 }}>Amount Paid</span>
                  <strong style={{ color: '#22c55e', fontSize: '1.1rem' }}>₹{txDetails.amount.toLocaleString('en-IN')}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700 }}>Payment Method</span>
                  <span className="badge badge-accent">{txDetails.paymentMode}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700 }}>Date</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{txDetails.date}</strong>
                </div>
              </div>
            </div>

            {/* Receipt Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => alert(`Downloading Official 80G Tax Receipt PDF #${txDetails.receiptNo}...`)}
              >
                <i className="bi bi-file-earmark-pdf-fill" style={{ color: '#3b82f6', marginRight: '0.3rem' }} /> Download 80G PDF
              </button>
              <button type="button" className="btn btn-primary" onClick={onClose}>
                Done &amp; Return to Dashboard
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
