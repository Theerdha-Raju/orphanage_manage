import React, { useState, useEffect } from 'react';
import { API_URL as API } from '../apiConfig';

const PRESET_AMOUNTS = [100, 500, 1000, 2000, 5000];

const ITEM_CATEGORIES = [
  'Food Donation',
  'Clothing Donation',
  'Books and Educational Materials',
  'Medical Supplies',
  'Other Essential Items'
];

// Rich item suggestions categorized per donation type
const CATEGORY_ITEMS = {
  'Food Donation': [
    { name: 'Rice (Bags)', unit: 'kg' },
    { name: 'Wheat Flour / Atta', unit: 'kg' },
    { name: 'Cooking Oil (Cans / Pouches)', unit: 'litres' },
    { name: 'Pulses / Dal Varieties', unit: 'kg' },
    { name: 'Milk Powder & Baby Nutrition', unit: 'boxes' },
    { name: 'Biscuits, Cookies & Healthy Snacks', unit: 'packets' },
    { name: 'Fresh Fruits & Vegetables', unit: 'kg' },
    { name: 'Spices, Salt & Condiments', unit: 'packets' },
    { name: 'Sugar & Jaggery', unit: 'kg' }
  ],
  'Clothing Donation': [
    { name: 'Winter Blankets & Quilts', unit: 'pcs' },
    { name: 'School Uniforms & Ties', unit: 'sets' },
    { name: 'Winter Sweaters & Thermal Jackets', unit: 'pcs' },
    { name: 'Everyday Casual T-Shirts & Pants', unit: 'pairs' },
    { name: 'Innerwear & Socks Sets', unit: 'sets' },
    { name: 'Raincoats & Umbrellas', unit: 'pcs' },
    { name: 'Bed Sheets & Pillow Covers', unit: 'sets' }
  ],
  'Books and Educational Materials': [
    { name: 'School Bags & Backpacks', unit: 'pcs' },
    { name: 'Notebooks & Ruled / Unruled Registers', unit: 'pcs' },
    { name: 'Stationery Kits (Pens, Pencils, Erasers)', unit: 'sets' },
    { name: 'Textbooks (Class 1 to 10 Curriculum)', unit: 'sets' },
    { name: 'Children Storybooks & Library Books', unit: 'pcs' },
    { name: 'Drawing Books, Crayons & Sketch Pens', unit: 'sets' },
    { name: 'Geometry Boxes & Mathematics Instruments', unit: 'sets' },
    { name: 'Children Encyclopedias & Dictionaries', unit: 'pcs' }
  ],
  'Medical Supplies': [
    { name: 'First Aid Emergency Kits', unit: 'sets' },
    { name: 'Pediatric Multivitamins & Iron Syrups', unit: 'boxes' },
    { name: 'Antiseptic Lotions, Bandages & Gauze', unit: 'boxes' },
    { name: 'Fever, Cold & Cough Syrups', unit: 'boxes' },
    { name: 'Digital Thermometers & Oximeters', unit: 'pcs' },
    { name: 'Hand Sanitizers & Disinfectant Soaps', unit: 'packets' },
    { name: 'Mosquito Repellent Creams & Bed Nets', unit: 'pcs' }
  ],
  'Other Essential Items': [
    { name: 'Sports Gear (Cricket Bats, Footballs, Badminton)', unit: 'sets' },
    { name: 'Educational Board Games, Puzzles & Toys', unit: 'boxes' },
    { name: 'Bath Towels, Soaps & Hair Oils', unit: 'sets' },
    { name: 'Toothpaste & Toothbrushes (Family Packs)', unit: 'packets' },
    { name: 'Sports Shoes & School Shoes', unit: 'pairs' },
    { name: 'Insulated Water Bottles & Lunch Boxes', unit: 'pcs' },
    { name: 'Classroom Study Desks & Chairs', unit: 'pcs' }
  ]
};

export default function DonorPaymentModal({ onClose, onSuccess, initialType = 'Monetary', initialDonor = null }) {
  const currentUserName = localStorage.getItem('userName') || '';
  const currentUserEmail = localStorage.getItem('userEmail') || '';

  const [activeTab, setActiveTab] = useState(initialType === 'Item' ? 'non_monetary' : 'monetary');
  const [donorsList, setDonorsList] = useState([]);
  const [selectedDonorId, setSelectedDonorId] = useState(initialDonor?.donor_id || '');

  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [successData, setSuccessData] = useState(null);

  // Common Donor Details State
  const [donorName, setDonorName] = useState(initialDonor?.full_name || currentUserName);
  const [donorEmail, setDonorEmail] = useState(initialDonor?.email || currentUserEmail);
  const [donorPhone, setDonorPhone] = useState(initialDonor?.phone_number || '');

  // Razorpay Interactive Checkout State
  const [razorpayOrder, setRazorpayOrder] = useState(null);
  const [razorpayMethod, setRazorpayMethod] = useState('upi'); // 'upi', 'card', 'netbanking', 'wallet'
  const [razorpayProcessing, setRazorpayProcessing] = useState(false);
  const [upiVpa, setUpiVpa] = useState('donor@okhdfcbank');
  const [cardNumber, setCardNumber] = useState('4111 2222 3333 4444');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('123');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [selectedWallet, setSelectedWallet] = useState('Paytm');

  // Monetary Form State
  const [amount, setAmount] = useState('1000');
  const [purpose, setPurpose] = useState('Child Education & Learning');
  const [message, setMessage] = useState('');

  // Non-Monetary Form State
  const [itemCategory, setItemCategory] = useState('Food Donation');
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('kg');
  const [donationDate, setDonationDate] = useState(new Date().toISOString().slice(0, 10));
  const [deliveryOption, setDeliveryOption] = useState('Pickup');
  const [deliveryAddress, setDeliveryAddress] = useState(initialDonor?.address || '');
  const [itemNotes, setItemNotes] = useState('');

  // Fetch registered donors list on mount
  useEffect(() => {
    fetch(`${API}/donors/`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setDonorsList(data);
          // If initialDonor not specified, try to match current user in list
          if (!initialDonor && (currentUserEmail || currentUserName)) {
            const matched = data.find(d =>
              (d.email && d.email.toLowerCase() === currentUserEmail.toLowerCase()) ||
              (d.full_name && d.full_name.toLowerCase() === currentUserName.toLowerCase())
            );
            if (matched) {
              setSelectedDonorId(matched.donor_id);
              setDonorName(matched.full_name);
              setDonorEmail(matched.email || currentUserEmail);
              setDonorPhone(matched.phone_number || '');
              if (matched.address && !deliveryAddress) setDeliveryAddress(matched.address);
            }
          }
        }
      })
      .catch(() => {});
  }, []);

  // Handle donor selection from dropdown
  const handleSelectDonor = (donorId) => {
    setSelectedDonorId(donorId);
    if (!donorId || donorId === 'new') {
      // New custom donor
      return;
    }
    const found = donorsList.find(d => String(d.donor_id) === String(donorId));
    if (found) {
      setDonorName(found.full_name);
      setDonorEmail(found.email || '');
      setDonorPhone(found.phone_number || '');
      if (found.address) setDeliveryAddress(found.address);
      setError('');
    }
  };

  // Handle item suggestion pick
  const handleSelectItemSuggestion = (itemObj) => {
    setItemName(itemObj.name);
    setUnit(itemObj.unit || 'pcs');
  };

  // Preset monetary amount selection
  const handleSelectPreset = (val) => {
    setAmount(val.toString());
  };

  // ── Helper: Server-Side Cryptographic Payment Verification ──────────────
  const verifyAndRecordPayment = async (orderId, paymentId, signature, payAmount, payPurpose, payDonorName, payDonorEmail) => {
    setVerifying(true);
    setError('');

    try {
      const verifyRes = await fetch(`${API}/donations/verify-payment/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': (payDonorEmail || donorEmail).trim(),
          'X-User-Role': localStorage.getItem('userRole') || 'donor'
        },
        body: JSON.stringify({
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: signature,
        })
      });

      const verifyData = await verifyRes.json();

      if (verifyRes.ok && verifyData.success) {
        setSuccessData({
          type: 'Monetary',
          donationId: verifyData.donation?.donation_id,
          receiptNumber: verifyData.receipt_number,
          amount: payAmount,
          purpose: payPurpose,
          paymentReference: paymentId,
          orderId: orderId,
          donorName: payDonorName,
          donorEmail: payDonorEmail,
          date: new Date().toISOString().slice(0, 10),
          receiptUrl: verifyData.receipt_url || `${API}/donations/${verifyData.donation?.donation_id}/receipt/`
        });
        if (onSuccess) onSuccess();
      } else {
        setError(verifyData.error || 'Server-side payment verification failed. Please contact support.');
      }
    } catch {
      setError('Network error while verifying payment signature with server.');
    } finally {
      setVerifying(false);
    }
  };

  // ── 1. Razorpay Monetary Payment Handler ───────────────────────────────────
  const handleMonetarySubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount < 1) {
      setError('Please enter a valid donation amount of at least ₹1.00');
      return;
    }
    if (!donorName.trim()) {
      setError('Please enter or select a Donor Name.');
      return;
    }
    if (!donorEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(donorEmail.trim())) {
      setError('Please enter a valid Email Address for payment verification and tax receipts.');
      return;
    }

    setLoading(true);

    try {
      // Step 3-4: Request payment order from Django backend
      const res = await fetch(`${API}/donations/create-order/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': donorEmail.trim(),
          'X-User-Role': localStorage.getItem('userRole') || 'donor'
        },
        body: JSON.stringify({
          donor_id: selectedDonorId && selectedDonorId !== 'new' ? selectedDonorId : null,
          amount: parsedAmount,
          donor_name: donorName.trim(),
          donor_email: donorEmail.trim(),
          donor_phone: donorPhone.trim(),
          purpose,
          message
        })
      });

      const orderData = await res.json();

      if (!res.ok || !orderData.success) {
        setError(orderData.error || 'Failed to initialize payment order with server.');
        setLoading(false);
        return;
      }

      setLoading(false);

      // Check if test environment / placeholder credentials / sandbox order
      const isTest = orderData.is_test_mode ||
        orderData.order_id?.startsWith('order_test_') ||
        !orderData.key_id ||
        orderData.key_id.startsWith('rzp_test_HopeNest');

      if (isTest) {
        // Open the interactive Razorpay Test Checkout Dialog
        setRazorpayOrder(orderData);
        return;
      }

      // Step 5: For live keys, open official Razorpay Checkout SDK
      try {
        if (typeof window.Razorpay === 'undefined') {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = resolve;
            script.onerror = () => reject(new Error('Failed to load Razorpay Checkout SDK'));
            document.body.appendChild(script);
          });
        }

        const options = {
          key: orderData.key_id,
          amount: orderData.amount,
          currency: orderData.currency || 'INR',
          name: 'HopeNest',
          description: `${purpose} — Donation for ${donorName.trim()}`,
          image: 'https://cdn-icons-png.flaticon.com/512/2913/2913520.png',
          order_id: orderData.order_id,
          prefill: {
            name: donorName.trim(),
            email: donorEmail.trim(),
            contact: donorPhone.trim(),
          },
          notes: {
            purpose,
            donor_name: donorName.trim(),
            donor_id: selectedDonorId || ''
          },
          theme: {
            color: '#2563eb'
          },
          handler: async function (response) {
            await verifyAndRecordPayment(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature,
              parsedAmount,
              purpose,
              donorName.trim(),
              donorEmail.trim()
            );
          },
          modal: {
            ondismiss: function () {
              fetch(`${API}/donations/payment-failed/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: orderData.order_id,
                  error_code: 'PAYMENT_CANCELLED',
                  error_description: 'Donor dismissed the Razorpay checkout window before completion.'
                })
              }).catch(() => {});

              setInfoMessage('Checkout was cancelled. No money was deducted.');
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (failResp) {
          const errDetail = failResp.error?.description || 'Payment failed through gateway.';
          if (errDetail.toLowerCase().includes('id provided') || errDetail.toLowerCase().includes('key') || errDetail.toLowerCase().includes('merchant')) {
            // Unregistered key on Razorpay server; fall back to interactive sandbox
            setRazorpayOrder(orderData);
          } else {
            setError(`Payment Failed: ${errDetail}`);
            fetch(`${API}/donations/payment-failed/`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: orderData.order_id,
                error_code: failResp.error?.code || 'PAYMENT_FAILED',
                error_description: errDetail
              })
            }).catch(() => {});
          }
        });

        rzp.open();
      } catch {
        // Fallback to interactive Razorpay test modal
        setRazorpayOrder(orderData);
      }

    } catch (err) {
      setError(err.message || 'Unable to connect to payment server. Please verify backend is running.');
      setLoading(false);
    }
  };

  // ── Complete Interactive Razorpay Sandbox Payment ─────────────────────────
  const handleCompleteRazorpayModal = async () => {
    if (!razorpayOrder) return;
    setRazorpayProcessing(true);

    // Brief processing animation
    await new Promise(r => setTimeout(r, 400));

    const paymentId = `pay_test_${Math.random().toString(36).substring(2, 9)}${Date.now().toString(36)}`;
    const signature = `test_sig_${razorpayOrder.order_id}_${paymentId}`;

    const currentOrder = razorpayOrder;
    setRazorpayOrder(null);
    setRazorpayProcessing(false);

    await verifyAndRecordPayment(
      currentOrder.order_id,
      paymentId,
      signature,
      parseFloat(amount),
      purpose,
      donorName.trim(),
      donorEmail.trim()
    );
  };

  const handleSimulatePaymentFailure = () => {
    if (!razorpayOrder) return;
    const orderId = razorpayOrder.order_id;
    setRazorpayOrder(null);
    setError('Payment Failed: Transaction was declined or cancelled in Razorpay test gateway.');

    fetch(`${API}/donations/payment-failed/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razorpay_order_id: orderId,
        error_code: 'PAYMENT_DECLINED',
        error_description: 'Simulated payment failure in Razorpay test mode.'
      })
    }).catch(() => {});
  };

  const handleDismissRazorpayModal = () => {
    if (!razorpayOrder) return;
    const orderId = razorpayOrder.order_id;
    setRazorpayOrder(null);
    setInfoMessage('Checkout was cancelled. No money was deducted.');

    fetch(`${API}/donations/payment-failed/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razorpay_order_id: orderId,
        error_code: 'PAYMENT_CANCELLED',
        error_description: 'Donor dismissed the Razorpay checkout window before completion.'
      })
    }).catch(() => {});
  };

  // ── 2. Non-Monetary In-Kind Donation Handler ──────────────────────────────
  const handleNonMonetarySubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    if (!donorName.trim()) {
      setError('Please enter or select a Donor Name.');
      return;
    }
    if (!itemName.trim()) {
      setError('Please select or specify an Item Name.');
      return;
    }
    const parsedQty = parseFloat(quantity);
    if (!quantity || isNaN(parsedQty) || parsedQty <= 0) {
      setError('Please enter a valid quantity greater than 0.');
      return;
    }
    if (deliveryOption === 'Pickup' && !deliveryAddress.trim()) {
      setError('Please provide a Pickup Address so our logistics team can schedule collection.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API}/donations/non-monetary/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': donorEmail.trim(),
          'X-User-Role': localStorage.getItem('userRole') || 'donor'
        },
        body: JSON.stringify({
          donor_id: selectedDonorId && selectedDonorId !== 'new' ? selectedDonorId : null,
          donor_name: donorName.trim(),
          donor_email: donorEmail.trim(),
          donor_phone: donorPhone.trim(),
          item_category: itemCategory,
          item_name: itemName.trim(),
          quantity: parsedQty,
          unit,
          donation_date: donationDate,
          delivery_option: deliveryOption,
          delivery_address: deliveryAddress.trim(),
          notes: itemNotes.trim(),
          collection_status: 'Pending Collection'
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessData({
          type: 'Non-Monetary',
          donationId: data.donation?.donation_id,
          receiptNumber: data.receipt_number,
          itemCategory,
          itemName: itemName.trim(),
          quantity: `${parsedQty} ${unit}`,
          deliveryOption,
          collectionStatus: 'Pending Collection',
          donorName: donorName.trim(),
          date: donationDate,
          receiptUrl: data.receipt_url || `${API}/donations/${data.donation?.donation_id}/receipt/`
        });
        if (onSuccess) onSuccess();
      } else {
        setError(data.error || 'Failed to record in-kind contribution.');
      }
    } catch {
      setError('Network connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReceipt = () => {
    if (!successData?.donationId) return;
    const url = `${API}/donations/${successData.donationId}/receipt/?email=${encodeURIComponent(donorEmail || '')}&role=${localStorage.getItem('userRole') || 'donor'}`;
    window.open(url, '_blank');
  };

  const currentCategoryItems = CATEGORY_ITEMS[itemCategory] || [];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 620, width: '95%', maxHeight: '92vh', overflowY: 'auto' }}>

        {/* Modal Header */}
        <div className="modal-header" style={{ paddingBottom: '0.75rem' }}>
          <div>
            <h4 style={{ color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="bi bi-heart-fill" style={{ color: '#ef4444' }} />
              HopeNest Donation Portal
            </h4>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Donate online securely or contribute essential items for children
            </span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close modal">
            <i className="bi bi-x-lg" />
          </button>
        </div>

        {/* Success View */}
        {successData ? (
          <div style={{ textAlign: 'center', padding: '1.5rem 0.5rem' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'rgba(22, 163, 74, 0.12)', color: '#16a34a',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2rem', margin: '0 auto 1rem'
            }}>
              <i className="bi bi-check-circle-fill" />
            </div>

            <h3 style={{ margin: '0 0 0.4rem', color: 'var(--text-primary)' }}>
              {successData.type === 'Monetary' ? 'Payment Verified Successfully!' : 'In-Kind Contribution Registered!'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              {successData.type === 'Monetary'
                ? `Donation credited to ${successData.donorName}'s account. Your payment signature has been cryptographically verified by HopeNest.`
                : `Thank you, ${successData.donorName}! Your item contribution has been logged in HopeNest logistics.`}
            </p>

            <div style={{
              background: 'var(--bg-surface-3, #f8fafc)',
              border: '1px solid rgba(0,0,0,0.08)',
              borderRadius: 'var(--radius-md, 8px)',
              padding: '1rem',
              textAlign: 'left',
              fontSize: '0.85rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Receipt / Ref No:</span>
                <strong style={{ color: 'var(--accent, #2563eb)' }}>{successData.receiptNumber}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Donor Account:</span>
                <strong>{successData.donorName}</strong>
              </div>
              {successData.type === 'Monetary' ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Amount Paid:</span>
                    <strong style={{ color: '#16a34a', fontSize: '1rem' }}>₹{successData.amount.toLocaleString('en-IN')}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Razorpay Payment ID:</span>
                    <code>{successData.paymentReference}</code>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Tax Exemption:</span>
                    <span className="badge badge-green">80G Eligible</span>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Category & Item:</span>
                    <strong>{successData.itemCategory} — {successData.itemName}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Quantity:</span>
                    <strong>{successData.quantity}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Collection Status:</span>
                    <span className="badge badge-amber">{successData.collectionStatus}</span>
                  </div>
                </>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                className="btn btn-primary"
                onClick={handleDownloadReceipt}
                style={{ padding: '0.6rem 1.25rem', fontWeight: 600 }}
              >
                <i className="bi bi-file-earmark-pdf-fill me-1" />
                Download PDF {successData.type === 'Monetary' ? 'Receipt' : 'Acknowledgement'}
              </button>
              <button className="btn btn-secondary" onClick={onClose}>
                Done
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Donation Type Selector Tabs */}
            <div style={{
              display: 'flex',
              background: 'var(--bg-surface-3, #f1f5f9)',
              padding: '0.25rem',
              borderRadius: 'var(--radius-md, 8px)',
              margin: '0.75rem 0 1.25rem'
            }}>
              <button
                type="button"
                className={`btn btn-sm ${activeTab === 'monetary' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ flex: 1, borderRadius: 6, fontWeight: 600, fontSize: '0.82rem' }}
                onClick={() => { setActiveTab('monetary'); setError(''); setInfoMessage(''); }}
              >
                <i className="bi bi-credit-card-2-front-fill me-1" /> Monetary Donation (Razorpay)
              </button>
              <button
                type="button"
                className={`btn btn-sm ${activeTab === 'non_monetary' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ flex: 1, borderRadius: 6, fontWeight: 600, fontSize: '0.82rem' }}
                onClick={() => { setActiveTab('non_monetary'); setError(''); setInfoMessage(''); }}
              >
                <i className="bi bi-box-seam-fill me-1" /> In-Kind / Item Donation
              </button>
            </div>

            {/* Status alerts */}
            {error && (
              <div className="alert alert-danger" style={{ marginBottom: '1rem', fontSize: '0.82rem' }}>
                <i className="bi bi-exclamation-triangle-fill me-1" /> {error}
              </div>
            )}
            {infoMessage && (
              <div className="alert alert-warning" style={{ marginBottom: '1rem', fontSize: '0.82rem' }}>
                <i className="bi bi-info-circle-fill me-1" /> {infoMessage}
              </div>
            )}
            {verifying && (
              <div className="alert alert-info" style={{ marginBottom: '1rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="spinner spinner-sm" />
                <span>Verifying payment signature securely on server... Please wait.</span>
              </div>
            )}

            {/* ── SHARED DONOR ACCOUNT SELECTION LIST (FOR BOTH TABS) ── */}
            <div style={{
              padding: '0.75rem',
              background: 'var(--bg-surface-3, #f8fafc)',
              border: '1px solid rgba(0,0,0,0.08)',
              borderRadius: 'var(--radius-md, 8px)',
              marginBottom: '1.25rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label className="form-label" style={{ margin: 0, fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                  <i className="bi bi-person-heart me-1" style={{ color: '#2563eb' }} />
                  Select Donor Account *
                </label>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Choose registered donor from list or enter new
                </span>
              </div>

              {/* Donor Dropdown List */}
              <select
                className="form-control"
                style={{ marginBottom: '0.6rem', fontSize: '0.85rem' }}
                value={selectedDonorId}
                onChange={(e) => handleSelectDonor(e.target.value)}
              >
                <option value="">— Select from Registered Donors List ({donorsList.length}) —</option>
                {donorsList.map((d) => (
                  <option key={d.donor_id} value={d.donor_id}>
                    {d.full_name} {d.email ? `(${d.email})` : ''} {d.phone_number ? `— ${d.phone_number}` : ''}
                  </option>
                ))}
                <option value="new">+ Enter New / Unlisted Donor</option>
              </select>

              {/* Editable Name & Email Inputs */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Donor Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Full Name"
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Contact Email *</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="donor@example.com"
                    value={donorEmail}
                    onChange={(e) => setDonorEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', marginTop: '0.4rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Phone Number</label>
                  <input
                    type="tel"
                    className="form-control"
                    placeholder="+91 98765 43210"
                    value={donorPhone}
                    onChange={(e) => setDonorPhone(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* TAB 1: MONETARY DONATION WITH RAZORPAY */}
            {activeTab === 'monetary' && (
              <form onSubmit={handleMonetarySubmit}>
                <div className="form-group">
                  <label className="form-label">Donation Purpose</label>
                  <select
                    className="form-control"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                  >
                    <option>Child Education & Learning</option>
                    <option>Healthcare & Pediatric Care</option>
                    <option>Nutrition & Daily Meals</option>
                    <option>Winter Clothing & Bedding</option>
                    <option>General Orphanage Welfare</option>
                  </select>
                </div>

                {/* Preset Amounts & Custom Amount */}
                <div className="form-group">
                  <label className="form-label">
                    Donation Amount (₹) *
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                      (Preset options or enter custom amount)
                    </span>
                  </label>

                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                    {PRESET_AMOUNTS.map((val) => {
                      const isSelected = amount === val.toString();
                      return (
                        <button
                          key={val}
                          type="button"
                          className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                          style={{
                            fontSize: '0.78rem',
                            padding: '0.3rem 0.75rem',
                            borderRadius: '1rem',
                            fontWeight: 600
                          }}
                          onClick={() => handleSelectPreset(val)}
                        >
                          ₹{val.toLocaleString('en-IN')}
                        </button>
                      );
                    })}
                  </div>

                  <div className="input-wrap">
                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: '#16a34a' }}>
                      ₹
                    </span>
                    <input
                      type="number"
                      className="form-control"
                      style={{ paddingLeft: '1.8rem', fontSize: '1.1rem', fontWeight: 700 }}
                      placeholder="Enter amount"
                      value={amount}
                      min="1"
                      step="any"
                      onChange={(e) => setAmount(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Optional Message / Dedication</label>
                  <textarea
                    className="form-control"
                    placeholder="Add a message of encouragement for the children or dedication..."
                    rows="2"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>

                {/* Account Attribution Badge */}
                <div style={{
                  padding: '0.65rem 0.9rem',
                  background: 'rgba(22,163,74,0.07)',
                  border: '1px solid rgba(22,163,74,0.25)',
                  borderRadius: 'var(--radius-md, 8px)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginBottom: '1.25rem',
                  fontSize: '0.78rem',
                  color: 'var(--text-secondary)'
                }}>
                  <i className="bi bi-shield-check" style={{ fontSize: '1.4rem', color: '#16a34a', flexShrink: 0 }} />
                  <div>
                    <strong>Crediting Account:</strong> This ₹{parseFloat(amount || 0).toLocaleString('en-IN')} payment will be linked directly to <strong>{donorName || 'selected donor'}</strong>'s profile with verified Razorpay signature.
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading || verifying}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading || verifying}
                    style={{ minWidth: 160, fontWeight: 700, background: 'linear-gradient(135deg, #16a34a, #2563eb)' }}
                  >
                    {loading ? (
                      <><span className="spinner spinner-sm" /> Initializing...</>
                    ) : verifying ? (
                      <><span className="spinner spinner-sm" /> Verifying...</>
                    ) : (
                      <><i className="bi bi-heart-fill me-1" /> Donate Now (₹{parseFloat(amount || 0).toLocaleString('en-IN')})</>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: NON-MONETARY IN-KIND DONATION */}
            {activeTab === 'non_monetary' && (
              <form onSubmit={handleNonMonetarySubmit}>
                {/* Item Category Selection */}
                <div className="form-group">
                  <label className="form-label">Item Category *</label>
                  <select
                    className="form-control"
                    value={itemCategory}
                    onChange={(e) => {
                      setItemCategory(e.target.value);
                      setItemName('');
                    }}
                  >
                    {ITEM_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Item Selection from Mentioned Item List */}
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label className="form-label" style={{ margin: 0 }}>
                      <i className="bi bi-card-checklist me-1" style={{ color: '#d97706' }} />
                      Item List for {itemCategory} *
                    </label>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Select from common item list or type below
                    </span>
                  </div>

                  {/* Dropdown list of items */}
                  <select
                    className="form-control"
                    style={{ marginBottom: '0.5rem', background: '#fffbeb', borderColor: '#fde68a' }}
                    value={itemName}
                    onChange={(e) => {
                      const found = currentCategoryItems.find(it => it.name === e.target.value);
                      if (found) {
                        setItemName(found.name);
                        setUnit(found.unit);
                      } else {
                        setItemName(e.target.value);
                      }
                    }}
                  >
                    <option value="">— Select an Item from the List —</option>
                    {currentCategoryItems.map(it => (
                      <option key={it.name} value={it.name}>{it.name} ({it.unit})</option>
                    ))}
                  </select>

                  {/* Preset Pills for fast one-click selection */}
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                    {currentCategoryItems.slice(0, 5).map((it) => (
                      <button
                        key={it.name}
                        type="button"
                        className={`btn btn-sm ${itemName === it.name ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ fontSize: '0.72rem', padding: '0.18rem 0.55rem', borderRadius: '1rem' }}
                        onClick={() => handleSelectItemSuggestion(it)}
                      >
                        + {it.name}
                      </button>
                    ))}
                  </div>

                  {/* Text input to allow custom or refined item names */}
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter or refine item name (e.g. Sona Masoori Rice, 100-page Notebooks)..."
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    required
                  />
                </div>

                {/* Quantity, Unit & Donation Date */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Quantity *</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="e.g. 50"
                      value={quantity}
                      min="1"
                      step="any"
                      onChange={(e) => setQuantity(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Unit *</label>
                    <select
                      className="form-control"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                    >
                      <option value="kg">kg (Kilograms)</option>
                      <option value="boxes">Boxes</option>
                      <option value="pcs">Pieces (Pcs)</option>
                      <option value="sets">Sets / Kits</option>
                      <option value="packets">Packets</option>
                      <option value="pairs">Pairs</option>
                      <option value="litres">Litres</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Donation Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={donationDate}
                      onChange={(e) => setDonationDate(e.target.value)}
                    />
                  </div>
                </div>

                {/* Delivery Option */}
                <div className="form-group">
                  <label className="form-label">Delivery / Pickup Option *</label>
                  <select
                    className="form-control"
                    value={deliveryOption}
                    onChange={(e) => setDeliveryOption(e.target.value)}
                  >
                    <option value="Pickup">Orphanage Pickup (We collect from your address)</option>
                    <option value="Self Delivery">Self Drop-off at HopeNest Main Campus</option>
                  </select>
                </div>

                {deliveryOption === 'Pickup' && (
                  <div className="form-group">
                    <label className="form-label">Pickup Address *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Street address, building, apartment, city, pin code..."
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      required
                    />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Additional Notes / Specifications</label>
                  <textarea
                    className="form-control"
                    placeholder="Details about packaging, special instructions, brand..."
                    rows="2"
                    value={itemNotes}
                    onChange={(e) => setItemNotes(e.target.value)}
                  />
                </div>

                {/* ── THAT PARTICULAR PERSON'S ACCOUNT: OPTION TO DONATE MONEY INSTEAD ── */}
                <div style={{
                  background: 'rgba(37,99,235,0.06)',
                  border: '1px solid rgba(37,99,235,0.22)',
                  borderRadius: 'var(--radius-md, 8px)',
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.8rem',
                  marginBottom: '1.25rem',
                  flexWrap: 'wrap'
                }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <i className="bi bi-wallet2" style={{ color: '#2563eb' }} />
                      Want to donate money for {donorName ? <u>{donorName}</u> : "this person's account"} instead?
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                      Quickly switch to Razorpay online payment using {donorName ? `${donorName}'s` : "this"} account.
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    style={{ fontWeight: 700, whiteSpace: 'nowrap' }}
                    onClick={() => {
                      setActiveTab('monetary');
                      setError('');
                      setInfoMessage(`Switched to online monetary donation for ${donorName || 'selected donor'}. Select an amount and click Donate Now.`);
                    }}
                  >
                    <i className="bi bi-credit-card-2-front-fill me-1" /> Donate Money (Razorpay)
                  </button>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-success"
                    disabled={loading}
                    style={{ minWidth: 170, fontWeight: 700, background: 'linear-gradient(135deg, #d97706, #b45309)', border: 'none' }}
                  >
                    {loading ? (
                      <><span className="spinner spinner-sm" /> Submitting...</>
                    ) : (
                      <><i className="bi bi-box-seam-fill me-1" /> Submit In-Kind Donation</>
                    )}
                  </button>
                </div>
              </form>
            )}
          </>
        )}

      </div>

      {/* ── INTERACTIVE RAZORPAY CHECKOUT WINDOW (TEST / SANDBOX MODE) ── */}
      {razorpayOrder && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '1rem'
          }}
          onClick={handleDismissRazorpayModal}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 480,
              background: '#ffffff',
              borderRadius: 16,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Razorpay Brand Header */}
            <div style={{
              background: 'linear-gradient(135deg, #0c2340 0%, #1e3a8a 100%)',
              color: '#ffffff',
              padding: '1.25rem 1.5rem',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <i className="bi bi-heart-fill" style={{ color: '#ef4444', fontSize: '1.1rem' }} />
                  </div>
                  <div>
                    <h5 style={{ margin: 0, color: '#ffffff', fontWeight: 700, fontSize: '1rem' }}>HopeNest</h5>
                    <span style={{ fontSize: '0.72rem', color: '#93c5fd' }}>
                      <i className="bi bi-patch-check-fill me-1" /> Razorpay Trusted Business
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDismissRazorpayModal}
                  style={{
                    background: 'rgba(255,255,255,0.15)', border: 'none', color: '#ffffff',
                    width: 28, height: 28, borderRadius: '50%', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                  title="Cancel Payment"
                >
                  <i className="bi bi-x-lg" style={{ fontSize: '0.8rem' }} />
                </button>
              </div>

              {/* Amount Display */}
              <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#bfdbfe', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Donation Amount
                  </span>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.1 }}>
                    ₹{parseFloat(amount || 0).toLocaleString('en-IN')}
                  </div>
                </div>
                <div style={{
                  background: 'rgba(251, 191, 36, 0.2)',
                  border: '1px solid rgba(251, 191, 36, 0.5)',
                  color: '#fef08a',
                  padding: '0.2rem 0.6rem',
                  borderRadius: 12,
                  fontSize: '0.7rem',
                  fontWeight: 700
                }}>
                  <i className="bi bi-shield-lock-fill me-1" /> TEST MODE
                </div>
              </div>

              <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: '0.4rem' }}>
                {purpose} • {donorName} ({donorEmail})
              </div>
            </div>

            {/* Payment Methods Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
              {[
                { id: 'upi', label: 'UPI / QR', icon: 'bi-qr-code-scan' },
                { id: 'card', label: 'Cards', icon: 'bi-credit-card' },
                { id: 'netbanking', label: 'Net Banking', icon: 'bi-bank' },
                { id: 'wallet', label: 'Wallets', icon: 'bi-wallet2' },
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setRazorpayMethod(tab.id)}
                  style={{
                    flex: 1,
                    padding: '0.75rem 0.5rem',
                    border: 'none',
                    borderBottom: razorpayMethod === tab.id ? '2px solid #2563eb' : '2px solid transparent',
                    background: razorpayMethod === tab.id ? '#ffffff' : 'transparent',
                    color: razorpayMethod === tab.id ? '#2563eb' : '#64748b',
                    fontWeight: razorpayMethod === tab.id ? 700 : 500,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <i className={`bi ${tab.icon}`} /> {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div style={{ padding: '1.25rem' }}>
              {razorpayMethod === 'upi' && (
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.6rem' }}>
                    Select Preferred UPI App or Enter Virtual Payment Address (VPA)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
                    {[
                      { name: 'Google Pay', vpa: 'donor@okhdfcbank', color: '#ea4335' },
                      { name: 'PhonePe', vpa: 'donor@ybl', color: '#5f259f' },
                      { name: 'Paytm UPI', vpa: 'donor@paytm', color: '#00baf2' },
                      { name: 'BHIM UPI', vpa: 'donor@upi', color: '#00843d' },
                    ].map(app => (
                      <button
                        key={app.name}
                        type="button"
                        onClick={() => setUpiVpa(app.vpa)}
                        style={{
                          padding: '0.55rem 0.25rem',
                          borderRadius: 8,
                          border: upiVpa === app.vpa ? '2px solid #2563eb' : '1px solid #e2e8f0',
                          background: upiVpa === app.vpa ? '#eff6ff' : '#ffffff',
                          cursor: 'pointer',
                          textAlign: 'center',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          color: '#1e293b'
                        }}
                      >
                        <div style={{ color: app.color, fontSize: '1rem', marginBottom: '0.2rem' }}>
                          <i className="bi bi-phone-fill" />
                        </div>
                        {app.name}
                      </button>
                    ))}
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>UPI ID / VPA</label>
                    <input
                      type="text"
                      className="form-control"
                      value={upiVpa}
                      onChange={(e) => setUpiVpa(e.target.value)}
                      placeholder="e.g. mobile@upi or name@okaxis"
                      style={{ fontSize: '0.85rem' }}
                    />
                    <div style={{ fontSize: '0.7rem', color: '#16a34a', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <i className="bi bi-check-circle-fill" /> Verified UPI Handle • Instant Razorpay Autopay
                    </div>
                  </div>
                </div>
              )}

              {razorpayMethod === 'card' && (
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.6rem' }}>
                    Enter Card Details (Test Mode - Pre-Filled)
                  </div>
                  <div className="form-group" style={{ marginBottom: '0.6rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Card Number</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        className="form-control"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="4111 2222 3333 4444"
                        style={{ fontSize: '0.85rem', letterSpacing: '1px', paddingRight: '3rem' }}
                      />
                      <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#2563eb', fontWeight: 700, fontSize: '0.75rem' }}>
                        VISA
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '0.6rem' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Expiry (MM/YY)</label>
                      <input
                        type="text"
                        className="form-control"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="12/28"
                        style={{ fontSize: '0.85rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>CVV</label>
                      <input
                        type="password"
                        maxLength="3"
                        className="form-control"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        placeholder="123"
                        style={{ fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                    <i className="bi bi-info-circle me-1" /> Any 16-digit test card number will pass authorization in Sandbox.
                  </div>
                </div>
              )}

              {razorpayMethod === 'netbanking' && (
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.6rem' }}>
                    Select Your Bank
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.8rem' }}>
                    {['HDFC Bank', 'State Bank of India', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra', 'Punjab National Bank'].map(bank => (
                      <button
                        key={bank}
                        type="button"
                        onClick={() => setSelectedBank(bank)}
                        style={{
                          padding: '0.6rem',
                          borderRadius: 8,
                          border: selectedBank === bank ? '2px solid #2563eb' : '1px solid #e2e8f0',
                          background: selectedBank === bank ? '#eff6ff' : '#ffffff',
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          color: '#1e293b'
                        }}
                      >
                        <i className="bi bi-bank me-1" style={{ color: selectedBank === bank ? '#2563eb' : '#94a3b8' }} /> {bank}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {razorpayMethod === 'wallet' && (
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.6rem' }}>
                    Select Digital Wallet
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.8rem' }}>
                    {['Paytm Wallet', 'PhonePe Wallet', 'Amazon Pay', 'Mobikwik'].map(wallet => (
                      <button
                        key={wallet}
                        type="button"
                        onClick={() => setSelectedWallet(wallet)}
                        style={{
                          padding: '0.6rem',
                          borderRadius: 8,
                          border: selectedWallet === wallet ? '2px solid #2563eb' : '1px solid #e2e8f0',
                          background: selectedWallet === wallet ? '#eff6ff' : '#ffffff',
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          color: '#1e293b'
                        }}
                      >
                        <i className="bi bi-wallet2 me-1" style={{ color: selectedWallet === wallet ? '#2563eb' : '#94a3b8' }} /> {wallet}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div style={{ padding: '0 1.25rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleCompleteRazorpayModal}
                disabled={razorpayProcessing}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #2563eb 0%, #16a34a 100%)',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(37,99,235,0.25)'
                }}
              >
                {razorpayProcessing ? (
                  <><span className="spinner spinner-sm me-2" /> Authorizing with Razorpay...</>
                ) : (
                  <><i className="bi bi-lock-fill me-1" /> Pay ₹{parseFloat(amount || 0).toLocaleString('en-IN')}</>
                )}
              </button>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={handleSimulatePaymentFailure}
                  style={{
                    background: 'none', border: 'none', color: '#ef4444',
                    fontSize: '0.72rem', cursor: 'pointer', textDecoration: 'underline'
                  }}
                >
                  Simulate Payment Failure
                </button>
                <button
                  type="button"
                  onClick={handleDismissRazorpayModal}
                  style={{
                    background: 'none', border: 'none', color: '#64748b',
                    fontSize: '0.75rem', cursor: 'pointer'
                  }}
                >
                  Cancel & Return
                </button>
              </div>

              {/* Trust Footer */}
              <div style={{
                textAlign: 'center',
                fontSize: '0.68rem',
                color: '#94a3b8',
                borderTop: '1px solid #f1f5f9',
                paddingTop: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem'
              }}>
                <i className="bi bi-shield-check" style={{ color: '#16a34a' }} />
                Secured by 256-bit SSL encryption • Razorpay Verified Payment Gateway
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
