import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import TopHeader from '../components/TopHeader';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

const chartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { labels: { color: '#64748b', font: { size: 11 }, padding: 12 } } },
  scales: {
    y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b', font: { size: 11 } } },
    x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b', font: { size: 11 } } }
  }
};

export default function AdminDashboardPage() {
  const { toggleSidebar } = useOutletContext();
  
  const [childrenCount, setChildrenCount] = useState('...');
  const [staffCount, setStaffCount]       = useState('...');
  const [volunteerCount, setVolunteerCount] = useState('...');
  const [revenue, setRevenue]             = useState('...');
  const [revenueTrend, setRevenueTrend]   = useState('');

  const [donationChartData, setDonationChartData] = useState({ labels: ['May', 'Jun', 'Jul', 'Aug'], datasets: [] });
  const [academicChartData, setAcademicChartData] = useState({ labels: ['Math', 'Science', 'English', 'Social'], datasets: [] });
  const [healthDoughnutData, setHealthDoughnutData] = useState({ labels: ['Healthy', 'At Risk'], datasets: [] });
  const [recentActivities, setRecentActivities]   = useState([]);
  const [aiAlerts, setAiAlerts]                   = useState([]);

  useEffect(() => {
    // 1. Fetch children
    fetch('http://localhost:8000/api/children/')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setChildrenCount(data.length.toString());
      }).catch(() => {});

    // 2. Fetch staff
    fetch('http://localhost:8000/api/users/')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const count = data.filter(u => ['staff', 'teacher', 'doctor'].includes((u.designation || '').toLowerCase())).length;
          setStaffCount(count.toString());
        }
      }).catch(() => {});

    // 3. Fetch volunteers
    fetch('http://localhost:8000/api/volunteers/')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setVolunteerCount(data.length.toString());
      }).catch(() => {});

    // 4. Fetch donations & calculate monthly revenue and bar chart
    fetch('http://localhost:8000/api/donations/')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const now = new Date();
          const currentMonth = now.getMonth() + 1;
          const currentYear  = now.getFullYear();

          const thisMonthDonations = data.filter(d => {
            if (d.donation_type !== 'Money' || !d.donation_date) return false;
            const [year, month] = d.donation_date.split('-').map(Number);
            return year === currentYear && month === currentMonth;
          });

          const sum = thisMonthDonations.reduce((acc, d) => acc + (parseFloat(d.amount) || 0), 0);

          let formatted;
          if (sum >= 100000) formatted = '₹' + (sum / 100000).toFixed(1) + 'L';
          else if (sum >= 1000) formatted = '₹' + (sum / 1000).toFixed(1) + 'K';
          else formatted = '₹' + sum.toLocaleString('en-IN');

          setRevenue(formatted);
          setRevenueTrend(`${thisMonthDonations.length} donation(s) this month`);

          // Group by month
          const monthsMap = {};
          data.filter(d => d.donation_type === 'Money' && d.donation_date).forEach(d => {
            const m = d.donation_date.slice(0, 7); // YYYY-MM
            monthsMap[m] = (monthsMap[m] || 0) + parseFloat(d.amount || 0);
          });

          const sortedMonths = Object.keys(monthsMap).sort();
          const labels = sortedMonths.map(m => {
            const [y, mn] = m.split('-');
            return new Date(y, mn - 1).toLocaleString('default', { month: 'short' });
          });
          const totals = sortedMonths.map(m => monthsMap[m]);

          setDonationChartData({
            labels: labels.length ? labels : ['May', 'Jun', 'Jul', 'Aug'],
            datasets: [{
              label: 'Donations (₹)',
              data: totals.length ? totals : [40000, 195000, 100000, 200000],
              backgroundColor: 'rgba(37,99,235,0.75)',
              borderColor: '#2563eb',
              borderWidth: 1,
              borderRadius: 6,
            }]
          });
        }
      }).catch(() => {});

    // 5. Fetch health records for doughnut chart
    fetch('http://localhost:8000/api/health/')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const healthy = data.filter(h => h.status === 'Healthy').length;
          const mild    = data.filter(h => h.status === 'Mild Risk' || h.status === 'Underweight').length;
          const crit    = data.filter(h => h.status === 'Critical').length;
          setHealthDoughnutData({
            labels: ['Healthy', 'Mild Risk', 'Critical'],
            datasets: [{
              data: [healthy, mild, crit],
              backgroundColor: ['rgba(16,185,129,0.7)', 'rgba(245,158,11,0.7)', 'rgba(225,29,72,0.7)'],
              borderColor: ['#10b981', '#f59e0b', '#e11d48'],
              borderWidth: 1,
            }]
          });
        }
      }).catch(() => {});

    // 6. Fetch Education records for Academic chart
    fetch('http://localhost:8000/api/education/')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const subjMap = {};
          data.forEach(e => {
            if (!subjMap[e.subject]) subjMap[e.subject] = [];
            subjMap[e.subject].push(parseFloat(e.marks || 0));
          });
          const labels = Object.keys(subjMap);
          const avgs = labels.map(s => {
            const arr = subjMap[s];
            return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
          });
          setAcademicChartData({
            labels,
            datasets: [{
              label: 'Avg Score %',
              data: avgs,
              borderColor: '#2563eb',
              backgroundColor: 'rgba(37,99,235,0.1)',
              fill: true, tension: 0.4, borderWidth: 2.5,
              pointBackgroundColor: '#2563eb', pointRadius: 5,
            }]
          });
        }
      }).catch(() => {});

    // 7. Fetch Alerts for recent activity & AI recommendations
    fetch('http://localhost:8000/api/alerts/')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAiAlerts(data.slice(0, 3));
          const activities = data.map(a => ({
            icon: 'bi-cpu-fill',
            color: '#60a5fa',
            text: `${a.child_name || 'Child'}: ${a.message}`,
            time: a.created_date ? new Date(a.created_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'
          }));
          setRecentActivities(activities);
        }
      }).catch(() => {});

  }, []);

  const stats = [
    { label: 'Total Children',    value: childrenCount, trend: 'Active', up: true,  icon: 'bi-person-heart',  iconClass: 'stat-icon-accent' },
    { label: 'Caregiver Staff',   value: staffCount,    trend: 'Staff active',      up: null, icon: 'bi-person-badge',  iconClass: 'stat-icon-green' },
    { label: 'Active Volunteers', value: volunteerCount, trend: 'Registered', up: true,  icon: 'bi-people-fill',   iconClass: 'stat-icon-violet' },
    { label: 'Monthly Revenue',   value: revenue,       trend: revenueTrend || 'This month',        up: true,  icon: 'bi-cash-stack',    iconClass: 'stat-icon-amber' },
  ];

  return (
    <>
      <TopHeader title="Admin Dashboard" onToggleSidebar={toggleSidebar} />

      <div className="page-body">
        {/* Banner */}
        <div className="page-banner">
          <div>
            <div className="section-label">Command Center</div>
            <div className="page-banner-title">Orphanage Overview</div>
            <div className="page-banner-sub">Real-time metrics, health diagnostics, academic telemetry & financial logs</div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span className="badge badge-accent">
              <i className="bi bi-cpu-fill" /> AI Engine Active
            </span>
            <span className="badge badge-green">
              <i className="bi bi-circle-fill" style={{ fontSize: '0.5rem' }} /> System Online
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          {stats.map(s => (
            <div key={s.label} className="stat-card">
              <div className={`stat-icon ${s.iconClass}`}>
                <i className={`bi ${s.icon}`} />
              </div>
              <div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value">{s.value}</div>
                {s.trend && (
                  <div className={`stat-trend ${s.up ? 'up' : 'down'}`}>
                    {s.up !== null && <i className={`bi bi-arrow-${s.up ? 'up' : 'down'}-short`} />}
                    {s.trend}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="charts-grid">
          <div className="chart-card">
            <div className="chart-card-title">
              <i className="bi bi-graph-up-arrow" /> Academic Performance by Subject
            </div>
            <div style={{ height: 240 }}>
              <Line data={academicChartData} options={chartDefaults} />
            </div>
          </div>
          <div className="chart-card">
            <div className="chart-card-title">
              <i className="bi bi-cash-stack" /> Monthly Donations (₹)
            </div>
            <div style={{ height: 240 }}>
              <Bar data={donationChartData} options={chartDefaults} />
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="admin-bottom-grid">
          {/* Health doughnut */}
          <div className="chart-card" style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <div className="chart-card-title">
              <i className="bi bi-heart-pulse-fill" /> Health Status
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 0 }}>
              <div style={{ height: 200, width: '100%', minWidth: 0 }}>
                <Doughnut
                  data={healthDoughnutData}
                  options={{
                    responsive: true, maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'bottom', labels: { color: '#64748b', font: { size: 11 }, padding: 10 } }
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Activity Feed + AI */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 0 }}>
            {/* AI Recommendations */}
            <div style={{ background: 'var(--bg-surface)', border: '1px solid rgba(37,99,235,0.25)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', minWidth: 0 }}>
              <div className="chart-card-title">
                <i className="bi bi-cpu-fill" /> Proactive AI Recommendations
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                Machine Learning models generated active recommendations based on real child telemetry.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: 0 }}>
                {aiAlerts.length > 0 ? aiAlerts.map(a => (
                  <div key={a.alert_id} style={{ padding: '0.65rem 0.85rem', background: 'rgba(225,29,72,0.05)', border: '1px solid rgba(225,29,72,0.3)', borderRadius: 'var(--radius-md)', display: 'flex', gap: '0.5rem', alignItems: 'flex-start', minWidth: 0 }}>
                    <i className="bi bi-exclamation-triangle-fill" style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: 2, flexShrink: 0 }} />
                    <div style={{ minWidth: 0, flex: 1, wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                      <strong style={{ color: '#ef4444', fontSize: '0.8rem' }}>{a.alert_type} Alert ({a.child_name || 'Child'}): </strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{a.message}</span>
                    </div>
                  </div>
                )) : (
                  <div style={{ padding: '0.65rem 0.85rem', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 'var(--radius-md)', display: 'flex', gap: '0.5rem', alignItems: 'center', minWidth: 0 }}>
                    <i className="bi bi-check-circle-fill" style={{ color: '#10b981', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>All health and academic telemetry parameters within normal ranges.</span>
                  </div>
                )}
              </div>
            </div>


            {/* Recent Activity */}
            <div className="chart-card" style={{ flex: 1 }}>
              <div className="chart-card-title">
                <i className="bi bi-activity" /> Recent System Logs & Telemetry
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {recentActivities.slice(0, 4).map((a, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0', borderBottom: i < recentActivities.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ width: 34, height: 34, borderRadius: 'var(--radius-md)', background: `${a.color}20`, border: `1px solid ${a.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <i className={`bi ${a.icon}`} style={{ color: a.color, fontSize: '0.85rem' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.text}</p>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{a.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
