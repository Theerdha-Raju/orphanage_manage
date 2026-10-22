import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import TopHeader from '../components/TopHeader';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement,
  PointElement, LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { requestApi } from '../apiConfig';

const API = '/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const chartOpts = (label) => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: '#64748b', font: { size: 11 } } },
    title: { display: false }
  },
  scales: {
    y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: '#64748b', font: { size: 11 } } },
    x: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: '#64748b', font: { size: 11 } } }
  }
});

const donutOpts = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'bottom', labels: { color: '#64748b', font: { size: 11 }, padding: 12 } } }
};

export default function ReportsPage() {
  const { toggleSidebar } = useOutletContext();
  const userRole = localStorage.getItem('userRole') || 'donor';
  const userName = localStorage.getItem('userName') || 'Donor';
  const userEmail = localStorage.getItem('userEmail') || '';
  const isDonor = userRole === 'donor';

  const [reportType, setReportType] = useState(() =>
    isDonor ? 'My 80G Tax Exemption & Contribution Statement' : 'Child Health & Growth Summary'
  );
  const [period, setPeriod]         = useState('All Time');
  const [format, setFormat]         = useState('CSV Format (Standard Spreadsheet)');
  const [loading, setLoading]       = useState(false);
  const [msg, setMsg]               = useState('');

  // Analytics state
  const [stats, setStats]           = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [activeChart, setActiveChart]   = useState('donations');

  // Donor-specific contribution history & database summary state
  const [donorDonations, setDonorDonations] = useState([]);
  const [donorLoading, setDonorLoading]     = useState(false);
  const [dbSummary, setDbSummary]           = useState({
    total_donated: 0,
    total_contributions: 0,
    tax_receipts_count: 0,
    item_donations_count: 0
  });
  const [dbAnalytics, setDbAnalytics]       = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage]       = useState(1);
  const [pageSize, setPageSize]             = useState(10);
  const [totalCount, setTotalCount]         = useState(0);
  const [totalPages, setTotalPages]         = useState(1);

  // Filters and Search state
  const [filterType, setFilterType]                     = useState('All');
  const [filterPaymentStatus, setFilterPaymentStatus]   = useState('All');
  const [filterCollectionStatus, setFilterCollectionStatus] = useState('All');
  const [filterPurpose, setFilterPurpose]               = useState('All');
  const [dateFrom, setDateFrom]                         = useState('');
  const [dateTo, setDateTo]                             = useState('');
  const [searchTerm, setSearchTerm]                     = useState('');

  // Details modal state
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [downloadingReceiptId, setDownloadingReceiptId] = useState(null);

  // Admin Alerts modal
  const [showAlerts, setShowAlerts] = useState(false);
  const [alerts, setAlerts]         = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(false);

  const openAlerts = () => {
    if (isDonor) return;
    setShowAlerts(true);
    if (alerts.length > 0) return;
    setAlertsLoading(true);
    requestApi('/api/alerts/')
      .then(r => r.json())
      .then(data => {
        setAlerts(Array.isArray(data) ? data.filter(a => a.status === 'Open') : []);
        setAlertsLoading(false);
      })
      .catch(() => setAlertsLoading(false));
  };

  // Fetch overall admin stats
  useEffect(() => {
    if (!isDonor) {
      setStatsLoading(true);
      requestApi('/api/dashboard/stats/')
        .then(r => r.json())
        .then(data => {
          setStats(data);
          setStatsLoading(false);
        })
        .catch(() => setStatsLoading(false));
    }
  }, [isDonor]);

  // Fetch donor's own donations from PostgreSQL via Django REST Framework
  const fetchDonorHistory = useCallback(() => {
    if (!isDonor) return;
    setDonorLoading(true);

    const params = new URLSearchParams({
      email: userEmail,
      role: userRole,
      name: userName,
      paginated: 'true',
      page: String(currentPage),
      page_size: String(pageSize),
    });

    if (filterType !== 'All') params.append('type', filterType);
    if (filterPaymentStatus !== 'All') params.append('payment_status', filterPaymentStatus);
    if (filterCollectionStatus !== 'All') params.append('collection_status', filterCollectionStatus);
    if (filterPurpose !== 'All') params.append('purpose', filterPurpose);
    if (period !== 'All Time' && period !== 'Custom') params.append('period', period);
    if (dateFrom) params.append('date_from', dateFrom);
    if (dateTo) params.append('date_to', dateTo);
    if (searchTerm.trim()) params.append('search', searchTerm.trim());

    fetch(`${API}/donations/history/?${params.toString()}`, {
      headers: {
        'X-User-Email': userEmail,
        'X-User-Role': userRole,
        'X-Donor-Name': userName
      }
    })
      .then(r => {
        if (!r.ok) throw new Error('Failed to load private donation records.');
        return r.json();
      })
      .then(data => {
        if (data && typeof data === 'object') {
          const records = Array.isArray(data) ? data : (data.results || []);
          setDonorDonations(records);
          if (data.count !== undefined) setTotalCount(data.count);
          if (data.total_pages !== undefined) setTotalPages(data.total_pages);
          if (data.summary) setDbSummary(data.summary);
          if (data.analytics) setDbAnalytics(data.analytics);
        }
      })
      .catch(err => {
        console.error('Error fetching donor contribution history:', err);
      })
      .finally(() => {
        setDonorLoading(false);
        setStatsLoading(false);
      });
  }, [isDonor, userEmail, userRole, userName, currentPage, pageSize, filterType, filterPaymentStatus, filterCollectionStatus, filterPurpose, period, dateFrom, dateTo, searchTerm]);

  useEffect(() => {
    fetchDonorHistory();
  }, [fetchDonorHistory]);

  // Reset all filters
  const resetFilters = () => {
    setFilterType('All');
    setFilterPaymentStatus('All');
    setFilterCollectionStatus('All');
    setFilterPurpose('All');
    setPeriod('All Time');
    setDateFrom('');
    setDateTo('');
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Download official PDF receipt
  const downloadReceipt = async (donationId, receiptNumber) => {
    setDownloadingReceiptId(donationId);
    try {
      const res = await fetch(`${API}/donations/${donationId}/receipt/`, {
        headers: {
          'X-User-Email': userEmail,
          'X-User-Role': userRole,
          'X-Donor-Name': userName
        }
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Receipt could not be downloaded.');
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `HopeNest_Receipt_${receiptNumber || donationId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setMsg(`✅ Receipt ${receiptNumber || donationId} downloaded successfully.`);
      setTimeout(() => setMsg(''), 4000);
    } catch (err) {
      alert('Failed to connect to the receipt generator server.');
    } finally {
      setDownloadingReceiptId(null);
    }
  };

  // Handle Generate Report Download (CSV)
  const handleGenerate = async (e) => {
    e && e.preventDefault();
    setLoading(true);
    try {
      let data = [];
      let filename = 'report.csv';

      if (isDonor) {
        // Fetch full dataset for the donor (up to 1000 records) to ensure complete export
        const exportUrl = `${API}/donations/history/?email=${encodeURIComponent(userEmail)}&name=${encodeURIComponent(userName)}&role=${userRole}&period=${encodeURIComponent(period)}&page_size=1000`;
        const resp = await fetch(exportUrl, {
          headers: {
            'X-User-Email': userEmail,
            'X-User-Role': userRole,
            'X-Donor-Name': userName
          }
        });
        const exportJson = await resp.json();
        const allRecords = Array.isArray(exportJson) ? exportJson : (exportJson.results || []);

        const monetaryRecords = allRecords.filter(d => d.donation_type === 'Money' || d.donation_type === 'Monetary Donation' || (d.amount !== null && parseFloat(d.amount) > 0));
        const itemRecords = allRecords.filter(d => d.donation_type !== 'Money' && d.donation_type !== 'Monetary Donation' && (!d.amount || parseFloat(d.amount) === 0));

        if (reportType.includes('80G') || reportType.includes('Tax')) {
          filename = `80G_Tax_Exemption_Statement_${userName.replace(/\s+/g, '_')}.csv`;
          const successfulMonetary = monetaryRecords.filter(d => d.payment_status === 'Successful');
          data = successfulMonetary.map(d => ({
            'Receipt Number': d.receipt_number || `HN-REC-${d.donation_id}`,
            'Donation Date': d.donation_date,
            'Donor Name': userName,
            'PAN / Tax Reference': 'AAATH1234F',
            'Amount (INR)': d.amount,
            'Purpose / Scheme': d.purpose || 'General Child Welfare',
            'Payment Mode': d.payment_method || 'Razorpay Online',
            'Payment Reference': d.razorpay_payment_id || d.razorpay_order_id || '—',
            '80G Exemption Status': 'Eligible (50% Deduction under IT Act Sec 80G)'
          }));
        } else if (reportType.includes('Monetary')) {
          filename = `Monetary_Donation_Ledger_${userName.replace(/\s+/g, '_')}.csv`;
          data = monetaryRecords.map(d => ({
            'Donation ID': d.donation_id,
            'Receipt Number': d.receipt_number || `HN-REC-${d.donation_id}`,
            'Date': d.donation_date,
            'Amount (INR)': d.amount,
            'Purpose': d.purpose,
            'Payment Method': d.payment_method,
            'Payment Status': d.payment_status || 'Successful',
            'Razorpay Order ID': d.razorpay_order_id || '—',
            'Razorpay Payment ID': d.razorpay_payment_id || '—',
            'Notes': d.message || '—'
          }));
        } else if (reportType.includes('In-Kind') || reportType.includes('Item')) {
          filename = `In_Kind_Item_Contributions_${userName.replace(/\s+/g, '_')}.csv`;
          data = itemRecords.map(d => ({
            'Donation ID': d.donation_id,
            'Ack Number': d.receipt_number || `HN-ACK-${d.donation_id}`,
            'Date': d.donation_date,
            'Item Category': d.item_category || d.donation_type,
            'Item Name': d.item_name || d.item_description || 'Physical Goods',
            'Description': d.item_description || '—',
            'Quantity': d.quantity || 1,
            'Unit': d.unit || 'pcs',
            'Delivery Option': d.delivery_option || 'Pickup',
            'Collection Status': d.collection_status || 'In Orphanage Inventory',
            'Notes': d.message || '—'
          }));
        } else if (reportType.includes('Purpose') || reportType.includes('Allocation')) {
          filename = `Philanthropic_Fund_Allocation_${userName.replace(/\s+/g, '_')}.csv`;
          data = monetaryRecords.map(d => ({
            'Program / Purpose': d.purpose,
            'Amount Contributed (INR)': d.amount,
            'Donation Date': d.donation_date,
            'Payment Status': d.payment_status,
            'Receipt Reference': d.receipt_number || '—',
            'Impact Sector': (d.purpose || '').includes('Education') ? 'Education & Learning' : (d.purpose || '').includes('Health') ? 'Healthcare & Medicine' : (d.purpose || '').includes('Food') ? 'Nutrition & Sustenance' : 'General Child Welfare'
          }));
        } else {
          filename = `HopeNest_Comprehensive_Donations_${userName.replace(/\s+/g, '_')}.csv`;
          data = allRecords.map(d => ({
            'Donation ID': d.donation_id,
            'Date': d.donation_date,
            'Type': d.donation_type,
            'Purpose': d.purpose,
            'Item Name': d.item_name || '—',
            'Quantity & Unit': d.quantity ? `${d.quantity} ${d.unit || 'pcs'}` : '—',
            'Monetary Amount (INR)': d.amount || '—',
            'Payment Method': d.payment_method || '—',
            'Payment Reference': d.razorpay_payment_id || d.razorpay_order_id || '—',
            'Payment Status': d.payment_status || '—',
            'Collection Status': d.collection_status || '—',
            'Receipt Number': d.receipt_number || '—'
          }));
        }
      } else {
        // Admin general reports
        if (reportType.includes('Health')) {
          const res = await requestApi('/api/health/');
          data = await res.json();
          filename = 'child_health_report.csv';
        } else if (reportType.includes('Academic')) {
          const res = await requestApi('/api/education/');
          data = await res.json();
          filename = 'academic_progress_report.csv';
        } else if (reportType.includes('Donation') || reportType.includes('Financial')) {
          const [donRes, expRes] = await Promise.all([
            requestApi('/api/donations/').then(r => r.json()),
            requestApi('/api/expenses/').then(r => r.json()),
          ]);
          data = [...(Array.isArray(donRes) ? donRes : []), ...(Array.isArray(expRes) ? expRes : [])];
          filename = 'financial_expense_audit.csv';
        } else if (reportType.includes('Volunteer')) {
          const res = await requestApi('/api/volunteers/');
          data = await res.json();
          filename = 'volunteer_activity_report.csv';
        } else {
          const res = await requestApi('/api/children/');
          data = await res.json();
          filename = 'orphanage_children_demographics.csv';
        }
      }

      if (Array.isArray(data) && data.length > 0) {
        const headers = Object.keys(data[0]).join(',');
        const rows = data.map(obj => Object.values(obj).map(v => `"${v ?? ''}"`).join(','));
        const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setMsg(`✅ ${reportType} exported successfully (${data.length} records).`);
      } else {
        setMsg('No matching records found for the selected export criteria.');
      }
      setTimeout(() => setMsg(''), 4000);
    } catch (err) {
      console.error('Export error:', err);
      setMsg('Failed to export report. Ensure the backend server is running.');
      setTimeout(() => setMsg(''), 4000);
    } finally {
      setLoading(false);
    }
  };

  // Build chart datasets dynamically from database analytics
  const donationChartData = useMemo(() => {
    if (isDonor) {
      if (dbAnalytics?.trend?.length > 0) {
        return {
          labels: dbAnalytics.trend.map(t => t.month),
          datasets: [{
            label: 'Verified Monetary Contributions (₹)',
            data: dbAnalytics.trend.map(t => t.amount),
            backgroundColor: 'rgba(16,185,129,0.75)',
            borderColor: '#10b981',
            borderRadius: 6,
            borderWidth: 2,
          }]
        };
      }
      return null;
    }
    return stats?.donations?.trend?.length > 0 ? {
      labels: stats.donations.trend.map(d => d.month),
      datasets: [{
        label: 'Donations (₹)',
        data: stats.donations.trend.map(d => d.amount),
        backgroundColor: 'rgba(37,99,235,0.75)',
        borderColor: '#2563eb',
        borderRadius: 6,
        borderWidth: 2,
      }]
    } : null;
  }, [isDonor, dbAnalytics, stats]);

  // Donor Categories Chart
  const donorCategoriesChartData = useMemo(() => {
    if (!isDonor || !dbAnalytics?.categories) return null;
    const catObj = dbAnalytics.categories;
    const labels = Object.keys(catObj).filter(k => catObj[k] > 0);
    const dataVals = labels.map(k => catObj[k]);
    if (dataVals.length === 0) return null;

    return {
      labels: labels,
      datasets: [{
        data: dataVals,
        backgroundColor: [
          'rgba(16,185,129,0.85)',
          'rgba(37,99,235,0.85)',
          'rgba(139,92,246,0.85)',
          'rgba(245,158,11,0.85)',
          'rgba(239,68,68,0.85)'
        ],
        borderColor: ['#10b981', '#2563eb', '#8b5cf6', '#f59e0b', '#ef4444'],
        borderWidth: 1,
      }]
    };
  }, [isDonor, dbAnalytics]);

  // Donor Purpose Chart
  const donorPurposeChartData = useMemo(() => {
    if (!isDonor || !dbAnalytics?.purposes) return null;
    const pObj = dbAnalytics.purposes;
    const labels = Object.keys(pObj).filter(k => pObj[k] > 0);
    const dataVals = labels.map(k => pObj[k]);
    if (dataVals.length === 0) return null;

    return {
      labels: labels.map(k => k.length > 22 ? k.slice(0, 20) + '…' : k),
      datasets: [{
        label: 'Allocated Amount (₹)',
        data: dataVals,
        backgroundColor: [
          'rgba(16,185,129,0.75)',
          'rgba(59,130,246,0.75)',
          'rgba(245,158,11,0.75)',
          'rgba(139,92,246,0.75)',
          'rgba(236,72,153,0.75)'
        ],
        borderColor: ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'],
        borderRadius: 6,
        borderWidth: 1,
      }]
    };
  }, [isDonor, dbAnalytics]);

  // Admin Health & Academic datasets
  const healthChartData = !isDonor && stats?.health ? {
    labels: ['Healthy / Optimal', 'At Risk / Attention'],
    datasets: [{
      data: [stats.health.healthy || 0, stats.health.at_risk || 0],
      backgroundColor: ['rgba(16,185,129,0.75)', 'rgba(239,68,68,0.75)'],
      borderColor: ['#10b981', '#ef4444'],
      borderWidth: 2,
    }]
  } : null;

  const subjectChartData = !isDonor && stats?.academic?.subject_averages?.length > 0 ? {
    labels: stats.academic.subject_averages.map(s => s.subject.replace(' Language', '').replace('Environmental ', 'Env. ')),
    datasets: [{
      label: 'Average Score %',
      data: stats.academic.subject_averages.map(s => s.avg),
      backgroundColor: 'rgba(139,92,246,0.75)',
      borderColor: '#8b5cf6',
      borderRadius: 6,
      borderWidth: 2,
    }]
  } : null;

  const expenseChartData = !isDonor && stats?.expenses?.by_category?.length > 0 ? {
    labels: stats.expenses.by_category.map(e => e.category),
    datasets: [{
      data: stats.expenses.by_category.map(e => e.amount),
      backgroundColor: [
        'rgba(37,99,235,0.75)', 'rgba(16,185,129,0.75)', 'rgba(245,158,11,0.75)',
        'rgba(139,92,246,0.75)', 'rgba(239,68,68,0.75)', 'rgba(251,146,60,0.75)',
        'rgba(20,184,166,0.75)', 'rgba(107,114,128,0.75)'
      ],
      borderColor: ['#2563eb','#10b981','#f59e0b','#8b5cf6','#ef4444','#fb923c','#14b8a6','#6b7280'],
      borderWidth: 1,
    }]
  } : null;

  const fmt = (v) => {
    if (!v && v !== 0) return '—';
    if (v >= 100000) return '₹' + (v / 100000).toFixed(1) + 'L';
    if (v >= 1000) return '₹' + (v / 1000).toFixed(1) + 'K';
    return '₹' + Number(v).toLocaleString('en-IN');
  };

  // Report options & cards based on role
  const reportOptions = isDonor ? [
    'My 80G Tax Exemption & Contribution Statement',
    'Monetary Donations Ledger (Razorpay Verified)',
    'In-Kind Item Contribution & Fulfillment Report',
    'Philanthropic Fund Purpose Allocation Report',
    'HopeNest Comprehensive Donation Transparency Audit'
  ] : [
    'Child Health & Growth Summary',
    'Academic Performance & Trajectory',
    'Donation & Financial Statement',
    'Children Demographics',
    'Volunteer Activity Log'
  ];

  const quickExportButtons = isDonor ? [
    { title: 'My 80G Annual Tax Statement', type: 'Tax', icon: 'bi-file-earmark-check-fill', color: '#10b981' },
    { title: 'Monetary Donations Receipt Ledger', type: 'Monetary', icon: 'bi-credit-card-2-front-fill', color: '#2563eb' },
    { title: 'In-Kind Item Contribution Delivery Log', type: 'Item', icon: 'bi-box-seam-fill', color: '#f59e0b' },
    { title: 'Philanthropic Fund Purpose Allocation', type: 'Purpose', icon: 'bi-pie-chart-fill', color: '#8b5cf6' },
  ] : [
    { title: 'Monthly Child Health & BMI Summary', type: 'Health', icon: 'bi-heart-pulse-fill', color: '#ef4444' },
    { title: 'Academic Progress & Term Trajectory', type: 'Academic', icon: 'bi-graph-up-arrow', color: '#3b82f6' },
    { title: 'Donation & Financial Statement', type: 'Donation', icon: 'bi-cash-stack', color: '#10b981' },
    { title: 'Children Demographics Report', type: 'Children', icon: 'bi-people-fill', color: '#8b5cf6' },
    { title: 'Volunteer Activity Log', type: 'Volunteer', icon: 'bi-person-check-fill', color: '#f59e0b' },
  ];

  const chartTabs = isDonor ? [
    { id: 'donations', label: 'Donation Trend', icon: 'bi-cash-stack' },
    { id: 'categories', label: 'Donation Categories', icon: 'bi-pie-chart-fill' },
    { id: 'purpose', label: 'Fund Purpose', icon: 'bi-tag-fill' },
  ] : [
    { id: 'donations', label: 'Donation Trend', icon: 'bi-cash-stack' },
    { id: 'health',    label: 'Health Status',  icon: 'bi-heart-pulse' },
    { id: 'academic',  label: 'Academic Avg',   icon: 'bi-graph-up-arrow' },
    { id: 'expenses',  label: 'Expenses',        icon: 'bi-wallet2' },
  ];

  const availableReportCards = isDonor ? [
    {
      icon: 'bi-file-earmark-check-fill',
      color: '#10b981',
      title: '80G Tax Exemption Statement',
      desc: 'Official annual tax deduction summary with 80G registration numbers, transaction IDs, and verified deductible amounts.',
      type: 'My 80G Tax Exemption & Contribution Statement'
    },
    {
      icon: 'bi-credit-card-2-front-fill',
      color: '#2563eb',
      title: 'Monetary Donations Ledger',
      desc: 'Itemized log of verified online monetary contributions completed via Razorpay UPI, NetBanking, and Cards.',
      type: 'Monetary Donations Ledger (Razorpay Verified)'
    },
    {
      icon: 'bi-box-seam-fill',
      color: '#f59e0b',
      title: 'In-Kind Item Contributions',
      desc: 'Record of physical items (clothing, educational books, nutrition, medical supplies) and warehouse intake status.',
      type: 'In-Kind Item Contribution & Fulfillment Report'
    },
    {
      icon: 'bi-pie-chart-fill',
      color: '#8b5cf6',
      title: 'Fund Purpose & Program Allocation',
      desc: 'Breakdown of how contributed funds directly empower children\'s education, healthcare, nutrition, and infrastructure.',
      type: 'Philanthropic Fund Purpose Allocation Report'
    },
  ] : [
    { icon: 'bi-heart-pulse-fill', color: '#ef4444', title: 'Health & Growth Summary', desc: 'BMI, vaccination status, health conditions, growth metrics for all children.', type: 'Child Health & Growth Summary' },
    { icon: 'bi-mortarboard-fill', color: '#3b82f6', title: 'Academic Performance', desc: 'Subject-wise marks, trends, term scores, and attendance correlation.', type: 'Academic Performance & Trajectory' },
    { icon: 'bi-cash-coin', color: '#10b981', title: 'Financial Statement', desc: 'Donation records, expense audit, income vs expenditure summary.', type: 'Donation & Financial Statement' },
    { icon: 'bi-people-fill', color: '#8b5cf6', title: 'Children Demographics', desc: 'Admission records, guardian info, status distribution, demographics.', type: 'Children Demographics' },
    { icon: 'bi-person-check-fill', color: '#f59e0b', title: 'Volunteer Activity Log', desc: 'Volunteer hours, assignment statuses, contributions overview.', type: 'Volunteer Activity Log' },
  ];

  return (
    <>
      <TopHeader
        title={isDonor ? "Contribution Logs & Donation Reports" : "Reports & Analytics"}
        onToggleSidebar={toggleSidebar}
      />
      
      <div className="page-body">
        {/* Banner */}
        <div className="page-banner" style={{ borderLeft: `4px solid ${isDonor ? '#10b981' : '#2563eb'}` }}>
          <div>
            <div className="section-label" style={{ color: isDonor ? '#10b981' : undefined }}>
              {isDonor ? 'DONOR CONTRIBUTION REPORTS' : 'ANALYTICS'}
            </div>
            <div className="page-banner-title">
              {isDonor ? 'Contribution Logs & Donation Reports' : 'Data Reports & Insights'}
            </div>
            <div className="page-banner-sub">
              {isDonor
                ? `Generate and export official tax-exempt donation statements, fund allocations, and item contributions for ${userName}.`
                : 'Generate and export comprehensive real-time reports on health, academics, donations, and finances.'}
            </div>
          </div>
        </div>

        {msg && <div className={`alert ${msg.startsWith('✅') ? 'alert-success' : 'alert-warning'}`} style={{ marginBottom: '1.5rem' }}>{msg}</div>}

        {/* ── TOP KPI OVERVIEW (Requirement 5) ── */}
        {isDonor ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            {[
              {
                label: 'Total Donated',
                value: dbSummary.total_donated > 0 ? `₹${Number(dbSummary.total_donated).toLocaleString('en-IN')}` : '₹0',
                sub: 'Sum of verified successful monetary funds',
                icon: 'bi-cash-stack',
                color: '#10b981'
              },
              {
                label: 'My Total Contributions',
                value: `${dbSummary.total_contributions}`,
                sub: `${dbSummary.total_contributions - dbSummary.item_donations_count} Monetary • ${dbSummary.item_donations_count} In-Kind`,
                icon: 'bi-heart-fill',
                color: '#2563eb'
              },
              {
                label: 'Tax Receipts Issued',
                value: `${dbSummary.tax_receipts_count}`,
                sub: 'Eligible 80G tax-deductible receipts',
                icon: 'bi-file-earmark-check-fill',
                color: '#8b5cf6'
              },
              {
                label: 'In-Kind Item Donations',
                value: `${dbSummary.item_donations_count}`,
                sub: 'Physical item records (non-monetary)',
                icon: 'bi-box-seam-fill',
                color: '#f59e0b'
              },
            ].map((s, i) => (
              <div
                key={i}
                className="glass-card"
                style={{
                  padding: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  borderLeft: `4px solid ${s.color}`
                }}
              >
                <div style={{
                  width: '2.75rem', height: '2.75rem', borderRadius: '0.6rem',
                  background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <i className={`bi ${s.icon}`} style={{ color: s.color, fontSize: '1.25rem' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)' }}>{s.value}</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{s.label}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.sub}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Admin full system cards */
          !statsLoading && stats && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
              {[
                { label: 'Total Children', value: stats.children.total, icon: 'bi-person-heart', color: '#2563eb', clickable: false },
                { label: 'Monthly Donations', value: fmt(stats.donations.this_month), icon: 'bi-cash-stack', color: '#10b981', clickable: false },
                { label: 'Academic Avg', value: `${stats.academic.overall_average}%`, icon: 'bi-graph-up-arrow', color: '#8b5cf6', clickable: false },
                { label: 'Open Alerts', value: stats.alerts.open, icon: 'bi-bell-fill', color: stats.alerts.high_priority > 0 ? '#ef4444' : '#f59e0b', clickable: true },
              ].map((s, i) => (
                <div
                  key={i}
                  className="glass-card"
                  style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: s.clickable ? 'pointer' : 'default', transition: 'box-shadow 0.2s, transform 0.2s' }}
                  onClick={s.clickable ? openAlerts : undefined}
                  onMouseEnter={e => s.clickable && (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.12)', e.currentTarget.style.transform = 'translateY(-2px)')}
                  onMouseLeave={e => s.clickable && (e.currentTarget.style.boxShadow = '', e.currentTarget.style.transform = '')}
                  title={s.clickable ? 'Click to view all open alerts' : ''}
                >
                  <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.5rem', background: `${s.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    <i className={`bi ${s.icon}`} style={{ color: s.color, fontSize: '1.1rem' }} />
                    {s.clickable && s.value > 0 && (
                      <span style={{ position: 'absolute', top: '-4px', right: '-4px', width: '14px', height: '14px', background: '#ef4444', borderRadius: '50%', fontSize: '0.6rem', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{s.value > 9 ? '9+' : s.value}</span>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>{s.value}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {s.label}
                      {s.clickable && <span style={{ marginLeft: '0.35rem', color: s.color, fontSize: '0.7rem' }}>→ View</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* ── TWO-COLUMN SECTION: GENERATOR + LIVE CHARTS (Requirements 7 & 8) ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          
          {/* Generate Form */}
          <div className="glass-card" style={{ padding: '2rem', height: 'fit-content' }}>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="bi bi-cloud-arrow-down-fill" style={{ color: isDonor ? '#10b981' : 'var(--accent)' }} /> 
              {isDonor ? 'Export Donation Reports' : 'Generate Live Report'}
            </h4>
            
            <form onSubmit={handleGenerate}>
              <div className="form-group">
                <label className="form-label">{isDonor ? 'Select Donation Report' : 'Report Type'}</label>
                <select
                  className="form-control"
                  value={reportType}
                  onChange={e => setReportType(e.target.value)}
                  style={{ fontSize: '0.85rem' }}
                >
                  {reportOptions.map((opt, idx) => (
                    <option key={idx} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">Time Period</label>
                <select className="form-control" value={period} onChange={e => { setPeriod(e.target.value); setCurrentPage(1); }} style={{ fontSize: '0.85rem' }}>
                  <option>All Time</option>
                  <option>Financial Year 2026-2027</option>
                  <option>Financial Year 2025-2026</option>
                  <option>Last 30 Days</option>
                  <option>Last Quarter</option>
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">Export Format</label>
                <select className="form-control" value={format} onChange={e => setFormat(e.target.value)} style={{ fontSize: '0.85rem' }}>
                  <option>CSV Format (Standard Spreadsheet)</option>
                </select>
              </div>
              
              <button
                type="submit"
                className="btn btn-primary w-full mt-3"
                disabled={loading}
                style={{
                  justifyContent: 'center',
                  background: isDonor ? 'linear-gradient(135deg, #10b981, #2563eb)' : undefined
                }}
              >
                {loading ? (
                  <><span className="spinner spinner-sm" /> Exporting...</>
                ) : (
                  <><i className="bi bi-download me-1" /> Export Donation Report</>
                )}
              </button>
            </form>

            {/* Quick Export Buttons */}
            <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
              <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.75rem', fontWeight: 700 }}>
                {isDonor ? 'Quick Donor Statements' : 'Quick Exports'}
              </div>
              {quickExportButtons.map((r, i) => (
                <button
                  key={i}
                  className="btn btn-ghost w-full"
                  style={{ justifyContent: 'flex-start', marginBottom: '0.4rem', fontSize: '0.82rem' }}
                  onClick={() => {
                    const matched = isDonor ? (
                      r.type === 'Tax' ? 'My 80G Tax Exemption & Contribution Statement' :
                      r.type === 'Monetary' ? 'Monetary Donations Ledger (Razorpay Verified)' :
                      r.type === 'Item' ? 'In-Kind Item Contribution & Fulfillment Report' :
                      'Philanthropic Fund Purpose Allocation Report'
                    ) : (
                      r.title.includes('Health') ? 'Child Health & Growth Summary' :
                      r.title.includes('Academic') ? 'Academic Performance & Trajectory' :
                      r.title.includes('Donation') || r.title.includes('Financial') ? 'Donation & Financial Statement' :
                      r.title.includes('Volunteer') ? 'Volunteer Activity Log' :
                      'Children Demographics'
                    );
                    setReportType(matched);
                    setTimeout(() => handleGenerate(null), 100);
                  }}
                >
                  <i className={`bi ${r.icon} me-2`} style={{ color: r.color }} />
                  {r.title}
                </button>
              ))}
            </div>
          </div>

          {/* Live Analytics Charts (Requirement 8) */}
          <div className="chart-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div className="chart-card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <i className="bi bi-bar-chart-fill" style={{ color: isDonor ? '#10b981' : '#2563eb' }} />
                {isDonor ? 'Contribution Analytics & Trends' : 'Live Analytics Dashboard'}
              </div>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                {chartTabs.map(t => (
                  <button
                    key={t.id}
                    className={`btn btn-sm ${activeChart === t.id ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setActiveChart(t.id)}
                    style={{ fontSize: '0.75rem', padding: '0.3rem 0.7rem' }}
                  >
                    <i className={`bi ${t.icon}`} /> {t.label}
                  </button>
                ))}
              </div>
            </div>

            {donorLoading && (
              <div style={{ height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', color: 'var(--text-muted)' }}>
                <span className="spinner" />
                <span style={{ fontSize: '0.85rem' }}>Loading live contribution analytics...</span>
              </div>
            )}

            {!donorLoading && (
              <div style={{ height: '300px' }}>
                {/* 1. Donation Trend (Both Donor and Admin) */}
                {activeChart === 'donations' && (
                  donationChartData ? (
                    <Bar data={donationChartData} options={chartOpts('Donations')} />
                  ) : (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', flexDirection: 'column', gap: '0.5rem' }}>
                      <i className="bi bi-bar-chart" style={{ fontSize: '2.5rem' }} />
                      <span>No verified monetary donations in the selected period.</span>
                    </div>
                  )
                )}

                {/* 2. Donor: Categories Doughnut */}
                {isDonor && activeChart === 'categories' && (
                  donorCategoriesChartData ? (
                    <Doughnut data={donorCategoriesChartData} options={donutOpts} />
                  ) : (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', flexDirection: 'column', gap: '0.5rem' }}>
                      <i className="bi bi-pie-chart" style={{ fontSize: '2.5rem' }} />
                      <span>No donation category records available.</span>
                    </div>
                  )
                )}

                {/* 3. Donor: Purpose Bar */}
                {isDonor && activeChart === 'purpose' && (
                  donorPurposeChartData ? (
                    <Bar data={donorPurposeChartData} options={chartOpts('Purpose Allocation')} />
                  ) : (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', flexDirection: 'column', gap: '0.5rem' }}>
                      <i className="bi bi-tag" style={{ fontSize: '2.5rem' }} />
                      <span>No fund purpose allocations recorded.</span>
                    </div>
                  )
                )}

                {/* Admin-only Charts (hidden for donor) */}
                {!isDonor && activeChart === 'health' && (
                  healthChartData ? (
                    <Doughnut data={healthChartData} options={donutOpts} />
                  ) : (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No health data</div>
                  )
                )}
                {!isDonor && activeChart === 'academic' && (
                  subjectChartData ? (
                    <Bar data={subjectChartData} options={chartOpts('Academic')} />
                  ) : (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No academic data</div>
                  )
                )}
                {!isDonor && activeChart === 'expenses' && (
                  expenseChartData ? (
                    <Doughnut data={expenseChartData} options={donutOpts} />
                  ) : (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No expense data</div>
                  )
                )}
              </div>
            )}

            {/* Key Metrics below chart */}
            {isDonor ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginTop: '1.25rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#10b981' }}>₹{Number(dbSummary.total_donated).toLocaleString('en-IN')}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Total Verified Donated</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#2563eb' }}>{dbSummary.total_contributions} Records</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Total Contributions</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f59e0b' }}>{dbSummary.item_donations_count} Shipments</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>In-Kind Item Donated</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#8b5cf6' }}>{dbSummary.tax_receipts_count} Receipts</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>80G Tax Deductible</div>
                </div>
              </div>
            ) : (
              stats && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginTop: '1.25rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#10b981' }}>{fmt(stats.donations?.total)}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Total Donations</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ef4444' }}>{fmt(stats.expenses?.total)}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Total Expenses</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#2563eb' }}>{stats.attendance?.avg_percentage ?? '—'}%</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Avg Attendance</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#8b5cf6' }}>{stats.academic?.overall_average ?? '—'}%</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Academic Avg</div>
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        {/* ── MY CONTRIBUTION HISTORY SECTION (Requirement 1, 2, 3, 4, 6) ── */}
        {isDonor && (
          <div className="glass-card" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <div className="section-label" style={{ color: '#10b981', marginBottom: '0.25rem' }}>
                  LOGGED-IN DONOR CONTRIBUTION LEDGER
                </div>
                <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <i className="bi bi-clock-history" style={{ color: '#10b981' }} /> My Contribution History
                </h3>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Complete database-connected ledger of all monetary payments and in-kind physical contributions for <strong>{userName}</strong>.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() => {
                    resetFilters();
                    fetchDonorHistory();
                  }}
                  title="Reset all filters and refresh data from database"
                >
                  <i className="bi bi-arrow-counterclockwise me-1" /> Reset Filters
                </button>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={fetchDonorHistory}
                  disabled={donorLoading}
                  style={{ background: '#10b981' }}
                  title="Reload records"
                >
                  <i className="bi bi-arrow-clockwise me-1" /> {donorLoading ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
            </div>

            {/* Filter and Search Controls (Requirement 6) */}
            <div style={{
              background: 'var(--bg-surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              marginBottom: '1.5rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '1rem',
              alignItems: 'flex-end'
            }}>
              {/* Search by Donation ID or Item Name */}
              <div style={{ gridColumn: 'span 2' }}>
                <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: '0.35rem' }}>
                  <i className="bi bi-search me-1" /> Search Contributions
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by ID (#HN-DON-74), item name, purpose, reference..."
                    value={searchTerm}
                    onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    style={{ fontSize: '0.82rem', paddingRight: searchTerm ? '2rem' : undefined }}
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => { setSearchTerm(''); setCurrentPage(1); }}
                      style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.9rem' }}
                    >
                      <i className="bi bi-x-circle-fill" />
                    </button>
                  )}
                </div>
              </div>

              {/* Donation Type Filter */}
              <div>
                <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: '0.35rem' }}>
                  <i className="bi bi-funnel me-1" /> Donation Type
                </label>
                <select
                  className="form-control"
                  value={filterType}
                  onChange={e => { setFilterType(e.target.value); setCurrentPage(1); }}
                  style={{ fontSize: '0.82rem' }}
                >
                  <option value="All">All Types</option>
                  <option value="Monetary">Monetary Only (₹)</option>
                  <option value="Item">In-Kind Items Only</option>
                  <option value="Clothing Donation">Clothing Donation</option>
                  <option value="Books and Educational Materials">Books & Education</option>
                  <option value="Food Donation">Food & Nutrition</option>
                  <option value="Medical Supplies">Medical Supplies</option>
                </select>
              </div>

              {/* Payment Status Filter (for monetary donations) */}
              <div>
                <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: '0.35rem' }}>
                  <i className="bi bi-credit-card me-1" /> Payment Status
                </label>
                <select
                  className="form-control"
                  value={filterPaymentStatus}
                  onChange={e => { setFilterPaymentStatus(e.target.value); setCurrentPage(1); }}
                  style={{ fontSize: '0.82rem' }}
                >
                  <option value="All">All Payment Statuses</option>
                  <option value="Successful">Successful</option>
                  <option value="Pending">Pending</option>
                  <option value="Failed">Failed</option>
                  <option value="Refunded">Refunded</option>
                </select>
              </div>

              {/* Collection Status Filter (for item donations) */}
              <div>
                <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: '0.35rem' }}>
                  <i className="bi bi-box-seam me-1" /> Collection Status
                </label>
                <select
                  className="form-control"
                  value={filterCollectionStatus}
                  onChange={e => { setFilterCollectionStatus(e.target.value); setCurrentPage(1); }}
                  style={{ fontSize: '0.82rem' }}
                >
                  <option value="All">All Collection Statuses</option>
                  <option value="Pending Collection">Pending Collection</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Collected">Collected</option>
                  <option value="In Orphanage Inventory">In Orphanage Inventory</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              {/* Date Period Selector */}
              <div>
                <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: '0.35rem' }}>
                  <i className="bi bi-calendar3 me-1" /> Date Period
                </label>
                <select
                  className="form-control"
                  value={period}
                  onChange={e => { setPeriod(e.target.value); setCurrentPage(1); }}
                  style={{ fontSize: '0.82rem' }}
                >
                  <option value="All Time">All Time</option>
                  <option value="Financial Year 2026-2027">FY 2026-2027</option>
                  <option value="Financial Year 2025-2026">FY 2025-2026</option>
                  <option value="Last 30 Days">Last 30 Days</option>
                  <option value="Last Quarter">Last Quarter</option>
                  <option value="Custom">Custom Range...</option>
                </select>
              </div>

              {/* Custom Date Range */}
              {period === 'Custom' && (
                <>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: '0.35rem' }}>From Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={dateFrom}
                      onChange={e => { setDateFrom(e.target.value); setCurrentPage(1); }}
                      style={{ fontSize: '0.82rem' }}
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: '0.35rem' }}>To Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={dateTo}
                      onChange={e => { setDateTo(e.target.value); setCurrentPage(1); }}
                      style={{ fontSize: '0.82rem' }}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Contribution Records Table (Requirement 1, 3, 4) */}
            <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-surface-3)', borderBottom: '2px solid var(--border)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '0.85rem 0.75rem', fontWeight: 700, width: '100px' }}>Donation ID</th>
                    <th style={{ padding: '0.85rem 0.75rem', fontWeight: 700, width: '110px' }}>Date</th>
                    <th style={{ padding: '0.85rem 0.75rem', fontWeight: 700, width: '130px' }}>Type</th>
                    <th style={{ padding: '0.85rem 0.75rem', fontWeight: 700 }}>Purpose</th>
                    <th style={{ padding: '0.85rem 0.75rem', fontWeight: 700 }}>Item Name</th>
                    <th style={{ padding: '0.85rem 0.75rem', fontWeight: 700, width: '90px' }}>Qty</th>
                    <th style={{ padding: '0.85rem 0.75rem', fontWeight: 700, width: '110px' }}>Monetary (₹)</th>
                    <th style={{ padding: '0.85rem 0.75rem', fontWeight: 700 }}>Payment Method</th>
                    <th style={{ padding: '0.85rem 0.75rem', fontWeight: 700 }}>Payment Reference</th>
                    <th style={{ padding: '0.85rem 0.75rem', fontWeight: 700, width: '120px' }}>Payment Status</th>
                    <th style={{ padding: '0.85rem 0.75rem', fontWeight: 700, width: '140px' }}>Collection Status</th>
                    <th style={{ padding: '0.85rem 0.75rem', fontWeight: 700, width: '150px', textAlign: 'center' }}>Receipt / Details</th>
                  </tr>
                </thead>
                <tbody>
                  {donorLoading && (
                    <tr>
                      <td colSpan={12} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <span className="spinner" style={{ marginBottom: '0.5rem', display: 'inline-block' }} /><br />
                        Querying database records for {userName}...
                      </td>
                    </tr>
                  )}

                  {!donorLoading && donorDonations.length === 0 && (
                    <tr>
                      <td colSpan={12} style={{ padding: '3.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <div style={{ maxWidth: '420px', margin: '0 auto' }}>
                          <i className="bi bi-inbox" style={{ fontSize: '2.5rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.75rem' }} />
                          <strong style={{ fontSize: '1rem', color: 'var(--text-primary)', display: 'block', marginBottom: '0.25rem' }}>No Contributions Found</strong>
                          <p style={{ fontSize: '0.82rem', margin: 0, lineHeight: 1.5 }}>
                            No donation records matched your active filter settings. Try adjusting your search query, type filter, or date range.
                          </p>
                          <button
                            className="btn btn-sm btn-ghost mt-3"
                            onClick={resetFilters}
                            style={{ fontSize: '0.8rem', border: '1px solid var(--border)' }}
                          >
                            <i className="bi bi-arrow-counterclockwise me-1" /> Reset All Filters
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}

                  {!donorLoading && donorDonations.map((d) => {
                    const isMonetary = d.donation_type === 'Money' || d.donation_type === 'Monetary Donation' || (d.amount !== null && parseFloat(d.amount) > 0);
                    const isEligibleReceipt = isMonetary ? d.payment_status === 'Successful' : true;
                    
                    // Format formatted date
                    const formattedDate = d.donation_date
                      ? new Date(d.donation_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                      : '—';

                    return (
                      <tr
                        key={d.donation_id}
                        style={{ borderBottom: '1px solid var(--border)', transition: 'background-color 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-surface-2)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
                      >
                        {/* Donation ID */}
                        <td style={{ padding: '0.75rem', fontWeight: 700, color: 'var(--accent)' }}>
                          #HN-DON-{d.donation_id}
                        </td>

                        {/* Date */}
                        <td style={{ padding: '0.75rem', whiteSpace: 'nowrap' }}>
                          <i className="bi bi-calendar-event me-1 text-muted" style={{ fontSize: '0.75rem' }} />
                          {formattedDate}
                        </td>

                        {/* Type */}
                        <td style={{ padding: '0.75rem' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '999px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            background: isMonetary ? 'rgba(16,185,129,0.12)' : 'rgba(37,99,235,0.12)',
                            color: isMonetary ? '#10b981' : '#2563eb'
                          }}>
                            <i className={`bi ${isMonetary ? 'bi-cash-coin' : 'bi-box-seam'}`} />
                            {d.donation_type}
                          </span>
                        </td>

                        {/* Purpose */}
                        <td style={{ padding: '0.75rem', maxWidth: '200px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={d.purpose}>
                            {d.purpose || 'General Welfare'}
                          </div>
                        </td>

                        {/* Item Name */}
                        <td style={{ padding: '0.75rem', maxWidth: '180px' }}>
                          {isMonetary ? (
                            <span style={{ color: 'var(--text-muted)' }}>—</span>
                          ) : (
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }} title={d.item_name || d.item_description}>
                              {d.item_name || d.item_description || 'Physical Goods'}
                            </div>
                          )}
                        </td>

                        {/* Quantity */}
                        <td style={{ padding: '0.75rem', whiteSpace: 'nowrap' }}>
                          {isMonetary ? (
                            <span style={{ color: 'var(--text-muted)' }}>—</span>
                          ) : (
                            <strong>{d.quantity ? `${d.quantity} ${d.unit || 'pcs'}` : '1 unit'}</strong>
                          )}
                        </td>

                        {/* Monetary Amount */}
                        <td style={{ padding: '0.75rem', whiteSpace: 'nowrap' }}>
                          {isMonetary ? (
                            <span style={{ fontWeight: 800, color: '#10b981' }}>
                              ₹{parseFloat(d.amount || 0).toLocaleString('en-IN')}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontStyle: 'italic' }}>— (In-Kind)</span>
                          )}
                        </td>

                        {/* Payment Method */}
                        <td style={{ padding: '0.75rem', whiteSpace: 'nowrap' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {d.payment_method || (isMonetary ? 'Razorpay Online' : 'Fulfillment Intake')}
                          </span>
                        </td>

                        {/* Payment Reference */}
                        <td style={{ padding: '0.75rem', whiteSpace: 'nowrap' }}>
                          {isMonetary ? (
                            <code style={{ fontSize: '0.72rem', background: 'var(--bg-surface-3)', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                              {d.razorpay_payment_id || d.razorpay_order_id || d.receipt_number || '—'}
                            </code>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>N/A (Item)</span>
                          )}
                        </td>

                        {/* Payment Status (for monetary donations) */}
                        <td style={{ padding: '0.75rem' }}>
                          {isMonetary ? (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              padding: '0.2rem 0.55rem',
                              borderRadius: '999px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              background:
                                d.payment_status === 'Successful' ? 'rgba(16,185,129,0.15)' :
                                d.payment_status === 'Pending' ? 'rgba(245,158,11,0.15)' :
                                d.payment_status === 'Refunded' ? 'rgba(139,92,246,0.15)' :
                                'rgba(239,68,68,0.15)',
                              color:
                                d.payment_status === 'Successful' ? '#10b981' :
                                d.payment_status === 'Pending' ? '#f59e0b' :
                                d.payment_status === 'Refunded' ? '#8b5cf6' :
                                '#ef4444',
                            }}>
                              <i className={`bi ${
                                d.payment_status === 'Successful' ? 'bi-check-circle-fill' :
                                d.payment_status === 'Pending' ? 'bi-hourglass-split' :
                                d.payment_status === 'Refunded' ? 'bi-arrow-counterclockwise' :
                                'bi-x-circle-fill'
                              }`} />
                              {d.payment_status || 'Successful'}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>— (In-Kind)</span>
                          )}
                        </td>

                        {/* Collection Status (for item donations) */}
                        <td style={{ padding: '0.75rem' }}>
                          {!isMonetary ? (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              padding: '0.2rem 0.55rem',
                              borderRadius: '999px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              background:
                                d.collection_status === 'In Orphanage Inventory' ? 'rgba(16,185,129,0.15)' :
                                d.collection_status === 'Collected' ? 'rgba(6,182,212,0.15)' :
                                d.collection_status === 'Scheduled' ? 'rgba(37,99,235,0.15)' :
                                d.collection_status === 'Cancelled' ? 'rgba(239,68,68,0.15)' :
                                'rgba(245,158,11,0.15)',
                              color:
                                d.collection_status === 'In Orphanage Inventory' ? '#10b981' :
                                d.collection_status === 'Collected' ? '#06b6d4' :
                                d.collection_status === 'Scheduled' ? '#2563eb' :
                                d.collection_status === 'Cancelled' ? '#ef4444' :
                                '#f59e0b',
                            }}>
                              <i className={`bi ${
                                d.collection_status === 'In Orphanage Inventory' ? 'bi-box-seam-fill' :
                                d.collection_status === 'Collected' ? 'bi-truck' :
                                d.collection_status === 'Scheduled' ? 'bi-calendar-check' :
                                d.collection_status === 'Cancelled' ? 'bi-x-circle' :
                                'bi-clock-history'
                              }`} />
                              {d.collection_status || 'Pending Collection'}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>— (Monetary)</span>
                          )}
                        </td>

                        {/* Receipt or Details Action (Requirement 1, 3, 4) */}
                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                            {isEligibleReceipt ? (
                              <button
                                className="btn btn-sm btn-ghost"
                                onClick={() => downloadReceipt(d.donation_id, d.receipt_number)}
                                disabled={downloadingReceiptId === d.donation_id}
                                title={isMonetary ? 'Download Official 80G Tax Exemption Receipt (PDF)' : 'Download In-Kind Item Acknowledgement (PDF)'}
                                style={{
                                  fontSize: '0.72rem',
                                  padding: '0.25rem 0.55rem',
                                  color: isMonetary ? '#10b981' : '#f59e0b',
                                  border: `1px solid ${isMonetary ? '#10b98140' : '#f59e0b40'}`,
                                  background: isMonetary ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)'
                                }}
                              >
                                {downloadingReceiptId === d.donation_id ? (
                                  <><span className="spinner spinner-sm" /> PDF</>
                                ) : (
                                  <><i className={`bi ${isMonetary ? 'bi-file-earmark-check-fill' : 'bi-file-earmark-arrow-down-fill'} me-1`} /> {isMonetary ? '80G Receipt' : 'Ack Receipt'}</>
                                )}
                              </button>
                            ) : (
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '0.2rem 0.4rem', background: 'var(--bg-surface-3)', borderRadius: '4px' }} title={`Receipt unavailable because payment status is ${d.payment_status}`}>
                                Ineligible ({d.payment_status})
                              </span>
                            )}

                            <button
                              className="btn btn-sm btn-ghost"
                              onClick={() => setSelectedDonation(d)}
                              title="View full donation & fulfillment breakdown"
                              style={{ padding: '0.25rem 0.5rem', color: 'var(--text-secondary)' }}
                            >
                              <i className="bi bi-eye-fill" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls (Requirement 6) */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
              marginTop: '1.25rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border)'
            }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Showing <strong>{donorDonations.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</strong> to <strong>{Math.min(currentPage * pageSize, totalCount)}</strong> of <strong>{totalCount}</strong> contributions
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  <span>Rows:</span>
                  <select
                    className="form-control"
                    value={pageSize}
                    onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                    style={{ fontSize: '0.78rem', padding: '0.2rem 0.5rem', width: 'auto' }}
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage <= 1 || donorLoading}
                    style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem' }}
                  >
                    <i className="bi bi-chevron-left" /> Prev
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                    <button
                      key={pageNum}
                      className={`btn btn-sm ${currentPage === pageNum ? 'btn-primary' : 'btn-ghost'}`}
                      onClick={() => setCurrentPage(pageNum)}
                      disabled={donorLoading}
                      style={{
                        fontSize: '0.78rem',
                        padding: '0.3rem 0.65rem',
                        background: currentPage === pageNum ? '#10b981' : undefined
                      }}
                    >
                      {pageNum}
                    </button>
                  ))}

                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages || donorLoading}
                    style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem' }}
                  >
                    Next <i className="bi bi-chevron-right" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── AVAILABLE REPORT TYPES CARDS ── */}
        <div className="chart-card">
          <div className="chart-card-title">
            <i className={`bi ${isDonor ? 'bi-gift-fill' : 'bi-files'}`} style={{ color: isDonor ? '#10b981' : undefined }} />
            {isDonor ? 'Available Donation Reports & Statements' : 'Available Report Types'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
            {availableReportCards.map((r, i) => (
              <div
                key={i}
                style={{
                  padding: '1.25rem',
                  background: 'var(--bg-surface-3)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s, transform 0.15s'
                }}
                onClick={() => { setReportType(r.type); handleGenerate(null); }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = ''}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div style={{ width: '2.4rem', height: '2.4rem', borderRadius: '0.5rem', background: `${r.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className={`bi ${r.icon}`} style={{ color: r.color, fontSize: '1.1rem' }} />
                  </div>
                  <strong style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>{r.title}</strong>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0, lineHeight: 1.5 }}>{r.desc}</p>
                <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: isDonor ? '#10b981' : 'var(--accent)', fontWeight: 700 }}>
                  <i className="bi bi-download me-1" /> Click to Export Report
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── CONTRIBUTION DETAILS MODAL ─────────────────── */}
      {selectedDonation && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={e => e.target === e.currentTarget && setSelectedDonation(null)}
        >
          <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)', border: '1px solid var(--border)' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.5rem', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="bi bi-receipt" style={{ color: '#10b981', fontSize: '1.2rem' }} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                    Donation #HN-DON-{selectedDonation.donation_id}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Registered on {selectedDonation.donation_date} • {selectedDonation.donation_type}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedDonation(null)}
                style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '0.4rem 0.7rem', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem' }}
              >
                <i className="bi bi-x-lg" />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '1.5rem' }}>
              {/* Highlight Card */}
              <div style={{
                background: selectedDonation.amount ? 'rgba(16,185,129,0.08)' : 'rgba(37,99,235,0.08)',
                border: `1px solid ${selectedDonation.amount ? '#10b98130' : '#2563eb30'}`,
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                marginBottom: '1.25rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', fontWeight: 700 }}>
                    {selectedDonation.amount ? 'Verified Contribution Amount' : 'In-Kind Contribution Goods'}
                  </div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: selectedDonation.amount ? '#10b981' : '#2563eb', marginTop: '0.2rem' }}>
                    {selectedDonation.amount ? `₹${parseFloat(selectedDonation.amount).toLocaleString('en-IN')}` : `${selectedDonation.quantity || 1} ${selectedDonation.unit || 'pcs'} ${selectedDonation.item_name || ''}`}
                  </div>
                </div>
                <div>
                  {selectedDonation.amount ? (
                    <span style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: '999px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      background: selectedDonation.payment_status === 'Successful' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)',
                      color: selectedDonation.payment_status === 'Successful' ? '#10b981' : '#f59e0b'
                    }}>
                      Payment: {selectedDonation.payment_status || 'Successful'}
                    </span>
                  ) : (
                    <span style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: '999px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      background: 'rgba(37,99,235,0.2)',
                      color: '#2563eb'
                    }}>
                      Status: {selectedDonation.collection_status || 'In Inventory'}
                    </span>
                  )}
                </div>
              </div>

              {/* Grid of Details */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', fontSize: '0.85rem' }}>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.2rem' }}>Donor Name</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedDonation.donor_name || userName}</div>
                </div>

                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.2rem' }}>Donation Purpose</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedDonation.purpose || 'General Welfare'}</div>
                </div>

                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.2rem' }}>Payment Method</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedDonation.payment_method || 'Razorpay Gateway'}</div>
                </div>

                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.2rem' }}>Official Receipt / Ack Number</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedDonation.receipt_number || `HN-REC-${selectedDonation.donation_id}`}</div>
                </div>

                {selectedDonation.razorpay_order_id && (
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.2rem' }}>Razorpay Order Reference</div>
                    <code style={{ fontSize: '0.75rem' }}>{selectedDonation.razorpay_order_id}</code>
                  </div>
                )}

                {selectedDonation.razorpay_payment_id && (
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.2rem' }}>Razorpay Payment ID</div>
                    <code style={{ fontSize: '0.75rem' }}>{selectedDonation.razorpay_payment_id}</code>
                  </div>
                )}

                {selectedDonation.item_category && (
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.2rem' }}>Item Category</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedDonation.item_category}</div>
                  </div>
                )}

                {selectedDonation.delivery_option && (
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.2rem' }}>Delivery / Pickup Option</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedDonation.delivery_option}</div>
                  </div>
                )}
              </div>

              {selectedDonation.item_description && (
                <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.2rem' }}>Item Specifications & Description</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{selectedDonation.item_description}</div>
                </div>
              )}

              {selectedDonation.message && (
                <div style={{ marginTop: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.2rem' }}>Donor Message / Fulfillment Notes</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>"{selectedDonation.message}"</div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                HopeNest Security: Sensitive credentials & webhook secrets are concealed.
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {((selectedDonation.donation_type === 'Money' && selectedDonation.payment_status === 'Successful') || selectedDonation.donation_type !== 'Money') && (
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => downloadReceipt(selectedDonation.donation_id, selectedDonation.receipt_number)}
                    disabled={downloadingReceiptId === selectedDonation.donation_id}
                    style={{ background: '#10b981', border: 'none' }}
                  >
                    <i className="bi bi-file-earmark-arrow-down-fill me-1" />
                    {selectedDonation.donation_type === 'Money' ? 'Download 80G Tax Receipt' : 'Download Ack Receipt'}
                  </button>
                )}
                <button className="btn btn-sm btn-ghost" onClick={() => setSelectedDonation(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Admin-Only Alerts Modal (never opened for donor) ─────────────────── */}
      {!isDonor && showAlerts && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={e => e.target === e.currentTarget && setShowAlerts(false)}
        >
          <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '720px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', border: '1px solid var(--border)' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: '0.5rem', background: '#f59e0b20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="bi bi-bell-fill" style={{ color: '#f59e0b', fontSize: '1rem' }} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>Open Alerts</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{alerts.length} alerts requiring attention</div>
                </div>
              </div>
              <button
                onClick={() => setShowAlerts(false)}
                style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '0.4rem 0.7rem', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem' }}
              >
                <i className="bi bi-x-lg" />
              </button>
            </div>

            <div style={{ overflowY: 'auto', padding: '1rem 1.5rem', flex: 1 }}>
              {alertsLoading && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem', gap: '0.75rem', color: 'var(--text-muted)' }}>
                  <span className="spinner" /> Loading alerts...
                </div>
              )}

              {!alertsLoading && alerts.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  <i className="bi bi-check-circle-fill" style={{ fontSize: '2.5rem', color: '#10b981', display: 'block', marginBottom: '0.75rem' }} />
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>No open alerts!</div>
                  <div style={{ fontSize: '0.82rem', marginTop: '0.25rem' }}>All alerts have been resolved.</div>
                </div>
              )}

              {!alertsLoading && alerts.map((alert) => {
                const priorityMap = {
                  High:   { bg: '#ef444420', border: '#ef4444', color: '#ef4444', icon: 'bi-exclamation-triangle-fill' },
                  Medium: { bg: '#f59e0b20', border: '#f59e0b', color: '#f59e0b', icon: 'bi-exclamation-circle-fill' },
                  Low:    { bg: '#10b98120', border: '#10b981', color: '#10b981', icon: 'bi-info-circle-fill' },
                };
                const typeIconMap = {
                  Academic: 'bi-mortarboard-fill',
                  Health:   'bi-heart-pulse-fill',
                  Finance:  'bi-cash-stack',
                  General:  'bi-bell-fill',
                };
                const p = priorityMap[alert.priority] || priorityMap.Medium;
                const typeIcon = typeIconMap[alert.alert_type] || 'bi-bell-fill';
                const dateStr = alert.created_date
                  ? new Date(alert.created_date).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                  : '—';

                return (
                  <div
                    key={alert.alert_id}
                    style={{ display: 'flex', gap: '1rem', padding: '1rem', marginBottom: '0.75rem', background: p.bg, border: `1px solid ${p.border}40`, borderLeft: `3px solid ${p.border}`, borderRadius: '0.6rem' }}
                  >
                    <div style={{ flexShrink: 0, paddingTop: '0.1rem' }}>
                      <i className={`bi ${p.icon}`} style={{ color: p.color, fontSize: '1.1rem' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                        <span style={{ background: p.color + '22', color: p.color, fontSize: '0.68rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '999px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                          {alert.priority}
                        </span>
                        <span style={{ background: 'var(--bg-surface-2)', color: 'var(--text-muted)', fontSize: '0.68rem', padding: '0.15rem 0.5rem', borderRadius: '999px', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <i className={`bi ${typeIcon}`} /> {alert.alert_type}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                          <i className="bi bi-clock me-1" />{dateStr}
                        </span>
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
                        <i className="bi bi-person-fill me-1" style={{ color: '#2563eb' }} />{alert.child_name}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {alert.message}
                      </div>
                      {alert.assigned_to_name && (
                        <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <i className="bi bi-person-check-fill" style={{ color: '#10b981' }} />
                          Assigned to: <strong style={{ color: 'var(--text-primary)' }}>{alert.assigned_to_name}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setShowAlerts(false)} style={{ fontSize: '0.85rem' }}>
                <i className="bi bi-x me-1" /> Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
