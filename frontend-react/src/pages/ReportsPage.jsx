import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import TopHeader from '../components/TopHeader';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement,
  PointElement, LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const API = 'http://localhost:8000/api';

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
  const [reportType, setReportType] = useState('Child Health & Growth Summary');
  const [period, setPeriod]         = useState('All Time');
  const [format, setFormat]         = useState('CSV Format');
  const [loading, setLoading]       = useState(false);
  const [msg, setMsg]               = useState('');

  // Analytics state
  const [stats, setStats]           = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [activeChart, setActiveChart]   = useState('donations');

  useEffect(() => {
    setStatsLoading(true);
    fetch(`${API}/dashboard/stats/`)
      .then(r => r.json())
      .then(data => {
        setStats(data);
        setStatsLoading(false);
      })
      .catch(() => setStatsLoading(false));
  }, []);

  const handleGenerate = async (e) => {
    e && e.preventDefault();
    setLoading(true);
    try {
      let data = [];
      let filename = 'report.csv';

      if (reportType.includes('Health')) {
        const res = await fetch(`${API}/health/`);
        data = await res.json();
        filename = 'child_health_report.csv';
      } else if (reportType.includes('Academic')) {
        const res = await fetch(`${API}/education/`);
        data = await res.json();
        filename = 'academic_progress_report.csv';
      } else if (reportType.includes('Donation') || reportType.includes('Financial')) {
        const [donRes, expRes] = await Promise.all([
          fetch(`${API}/donations/`).then(r => r.json()),
          fetch(`${API}/expenses/`).then(r => r.json()),
        ]);
        data = [...(Array.isArray(donRes) ? donRes : []), ...(Array.isArray(expRes) ? expRes : [])];
        filename = 'financial_expense_audit.csv';
      } else if (reportType.includes('Volunteer')) {
        const res = await fetch(`${API}/volunteers/`);
        data = await res.json();
        filename = 'volunteer_activity_report.csv';
      } else {
        const res = await fetch(`${API}/children/`);
        data = await res.json();
        filename = 'orphanage_children_demographics.csv';
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
        setMsg('No data found for the selected report type.');
      }
      setTimeout(() => setMsg(''), 4000);
    } catch {
      setMsg('Failed to export report. Ensure the backend is running.');
      setTimeout(() => setMsg(''), 4000);
    } finally {
      setLoading(false);
    }
  };

  // Build chart data from stats
  const donationChartData = stats ? {
    labels: stats.donations.trend.map(d => d.month),
    datasets: [{
      label: 'Donations (₹)',
      data: stats.donations.trend.map(d => d.amount),
      backgroundColor: 'rgba(37,99,235,0.7)',
      borderColor: '#2563eb',
      borderRadius: 6,
    }]
  } : null;

  const healthChartData = stats ? {
    labels: ['Healthy', 'At Risk'],
    datasets: [{
      data: [stats.health.healthy, stats.health.at_risk],
      backgroundColor: ['rgba(16,185,129,0.7)', 'rgba(239,68,68,0.7)'],
      borderColor: ['#10b981', '#ef4444'],
      borderWidth: 1,
    }]
  } : null;

  const subjectChartData = stats && stats.academic.subject_averages.length > 0 ? {
    labels: stats.academic.subject_averages.map(s => s.subject),
    datasets: [{
      label: 'Average Score %',
      data: stats.academic.subject_averages.map(s => s.avg),
      backgroundColor: 'rgba(139,92,246,0.7)',
      borderColor: '#8b5cf6',
      borderRadius: 6,
    }]
  } : null;

  const expenseChartData = stats && stats.expenses.by_category.length > 0 ? {
    labels: stats.expenses.by_category.map(e => e.category),
    datasets: [{
      data: stats.expenses.by_category.map(e => e.amount),
      backgroundColor: [
        'rgba(37,99,235,0.7)', 'rgba(16,185,129,0.7)', 'rgba(245,158,11,0.7)',
        'rgba(139,92,246,0.7)', 'rgba(239,68,68,0.7)', 'rgba(251,146,60,0.7)',
        'rgba(20,184,166,0.7)', 'rgba(107,114,128,0.7)'
      ],
      borderWidth: 1,
    }]
  } : null;

  const fmt = (v) => {
    if (!v && v !== 0) return '—';
    if (v >= 100000) return '₹' + (v / 100000).toFixed(1) + 'L';
    if (v >= 1000) return '₹' + (v / 1000).toFixed(1) + 'K';
    return '₹' + v.toLocaleString('en-IN');
  };

  const recentReports = [
    { title: 'Monthly Child Health & BMI Summary', type: 'Health', icon: 'bi-heart-pulse-fill', color: '#ef4444' },
    { title: 'Academic Progress & Term Trajectory', type: 'Academic', icon: 'bi-graph-up-arrow', color: '#3b82f6' },
    { title: 'Donation & Financial Statement', type: 'Donation', icon: 'bi-cash-stack', color: '#10b981' },
    { title: 'Children Demographics Report', type: 'Children', icon: 'bi-people-fill', color: '#8b5cf6' },
    { title: 'Volunteer Activity Log', type: 'Volunteer', icon: 'bi-person-check-fill', color: '#f59e0b' },
  ];

  const chartTabs = [
    { id: 'donations', label: 'Donation Trend', icon: 'bi-cash-stack' },
    { id: 'health',    label: 'Health Status',  icon: 'bi-heart-pulse' },
    { id: 'academic',  label: 'Academic Avg',   icon: 'bi-graph-up-arrow' },
    { id: 'expenses',  label: 'Expenses',        icon: 'bi-wallet2' },
  ];

  return (
    <>
      <TopHeader title="Reports & Analytics" onToggleSidebar={toggleSidebar} />
      
      <div className="page-body">
        <div className="page-banner">
          <div>
            <div className="section-label">Analytics</div>
            <div className="page-banner-title">Data Reports & Insights</div>
            <div className="page-banner-sub">Generate and export comprehensive real-time reports on health, academics, donations, and finances</div>
          </div>
        </div>

        {msg && <div className={`alert ${msg.startsWith('✅') ? 'alert-success' : 'alert-warning'}`} style={{ marginBottom: '1.5rem' }}>{msg}</div>}

        {/* Live Stats Overview */}
        {!statsLoading && stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            {[
              { label: 'Total Children', value: stats.children.total, icon: 'bi-person-heart', color: '#2563eb' },
              { label: 'Monthly Donations', value: fmt(stats.donations.this_month), icon: 'bi-cash-stack', color: '#10b981' },
              { label: 'Academic Avg', value: `${stats.academic.overall_average}%`, icon: 'bi-graph-up-arrow', color: '#8b5cf6' },
              { label: 'Open Alerts', value: stats.alerts.open, icon: 'bi-bell-fill', color: stats.alerts.high_priority > 0 ? '#ef4444' : '#f59e0b' },
            ].map((s, i) => (
              <div key={i} className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.5rem', background: `${s.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className={`bi ${s.icon}`} style={{ color: s.color, fontSize: '1.1rem' }} />
                </div>
                <div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>{s.value}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          
          {/* Generate Form */}
          <div className="glass-card" style={{ padding: '2rem', height: 'fit-content' }}>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
              <i className="bi bi-cloud-arrow-down-fill me-2" style={{ color: 'var(--accent)' }} /> 
              Generate Live Report
            </h4>
            
            <form onSubmit={handleGenerate}>
              <div className="form-group">
                <label className="form-label">Report Type</label>
                <select className="form-control" value={reportType} onChange={e => setReportType(e.target.value)}>
                  <option>Child Health & Growth Summary</option>
                  <option>Academic Performance & Trajectory</option>
                  <option>Donation & Financial Statement</option>
                  <option>Children Demographics</option>
                  <option>Volunteer Activity Log</option>
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">Time Period</label>
                <select className="form-control" value={period} onChange={e => setPeriod(e.target.value)}>
                  <option>All Time</option>
                  <option>Last 30 Days</option>
                  <option>Last Quarter</option>
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">Export Format</label>
                <select className="form-control" value={format} onChange={e => setFormat(e.target.value)}>
                  <option>CSV Format</option>
                </select>
              </div>
              
              <button type="submit" className="btn btn-primary w-full mt-3" disabled={loading} style={{ justifyContent: 'center' }}>
                {loading ? <><span className="spinner spinner-sm" /> Exporting...</> : <><i className="bi bi-download" /> Export Live Report</>}
              </button>
            </form>

            {/* Quick Export Buttons */}
            <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
              <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Quick Exports</div>
              {recentReports.map((r, i) => (
                <button
                  key={i}
                  className="btn btn-ghost w-full"
                  style={{ justifyContent: 'flex-start', marginBottom: '0.4rem', fontSize: '0.82rem' }}
                  onClick={() => {
                    setReportType(r.title.includes('Health') ? 'Child Health & Growth Summary'
                      : r.title.includes('Academic') ? 'Academic Performance & Trajectory'
                      : r.title.includes('Donation') || r.title.includes('Financial') ? 'Donation & Financial Statement'
                      : r.title.includes('Volunteer') ? 'Volunteer Activity Log'
                      : 'Children Demographics');
                    setTimeout(() => handleGenerate(null), 100);
                  }}
                >
                  <i className={`bi ${r.icon} me-2`} style={{ color: r.color }} />
                  {r.title}
                </button>
              ))}
            </div>
          </div>

          {/* Live Analytics Charts */}
          <div className="chart-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div className="chart-card-title" style={{ margin: 0 }}><i className="bi bi-bar-chart-fill" /> Live Analytics Dashboard</div>
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

            {statsLoading && (
              <div style={{ height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                <span className="spinner" style={{ marginRight: '0.75rem' }} /> Loading analytics...
              </div>
            )}

            {!statsLoading && stats && (
              <div style={{ height: '260px' }}>
                {activeChart === 'donations' && donationChartData && (
                  <Bar data={donationChartData} options={chartOpts('Donations')} />
                )}
                {activeChart === 'health' && healthChartData && (
                  <Doughnut data={healthChartData} options={donutOpts} />
                )}
                {activeChart === 'academic' && subjectChartData && (
                  <Bar data={subjectChartData} options={chartOpts('Academic')} />
                )}
                {activeChart === 'expenses' && expenseChartData && (
                  <Doughnut data={expenseChartData} options={donutOpts} />
                )}
                {!donationChartData && !healthChartData && !subjectChartData && !expenseChartData && (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    No data available for this chart
                  </div>
                )}
              </div>
            )}

            {/* Key Metrics below chart */}
            {stats && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginTop: '1.25rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981' }}>{fmt(stats.donations.total)}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Donations</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ef4444' }}>{fmt(stats.expenses.total)}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Expenses</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2563eb' }}>{stats.attendance.avg_percentage}%</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Avg Attendance</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Report Type Cards */}
        <div className="chart-card">
          <div className="chart-card-title"><i className="bi bi-files" /> Available Report Types</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
            {[
              { icon: 'bi-heart-pulse-fill', color: '#ef4444', title: 'Health & Growth Summary', desc: 'BMI, vaccination status, health conditions, growth metrics for all children.', type: 'Child Health & Growth Summary' },
              { icon: 'bi-mortarboard-fill', color: '#3b82f6', title: 'Academic Performance', desc: 'Subject-wise marks, trends, term scores, and attendance correlation.', type: 'Academic Performance & Trajectory' },
              { icon: 'bi-cash-coin', color: '#10b981', title: 'Financial Statement', desc: 'Donation records, expense audit, income vs expenditure summary.', type: 'Donation & Financial Statement' },
              { icon: 'bi-people-fill', color: '#8b5cf6', title: 'Children Demographics', desc: 'Admission records, guardian info, status distribution, demographics.', type: 'Children Demographics' },
              { icon: 'bi-person-check-fill', color: '#f59e0b', title: 'Volunteer Activity Log', desc: 'Volunteer hours, assignment statuses, contributions overview.', type: 'Volunteer Activity Log' },
            ].map((r, i) => (
              <div key={i} style={{ padding: '1.25rem', background: 'var(--bg-surface-3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'border-color 0.2s' }}
                onClick={() => { setReportType(r.type); handleGenerate(null); }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: '0.5rem', background: `${r.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className={`bi ${r.icon}`} style={{ color: r.color, fontSize: '1rem' }} />
                  </div>
                  <strong style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>{r.title}</strong>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0, lineHeight: 1.5 }}>{r.desc}</p>
                <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 600 }}>
                  <i className="bi bi-download me-1" /> Click to Export CSV
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}
