import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import TopHeader from '../components/TopHeader';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { requestApi } from '../apiConfig';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

const chartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { labels: { color: '#64748b', font: { size: 11 }, padding: 12 } } },
  scales: {
    y: { grid: { color: 'rgba(0,0,0,0.06)' }, ticks: { color: '#64748b', font: { size: 11 } } },
    x: { grid: { color: 'rgba(0,0,0,0.06)' }, ticks: { color: '#64748b', font: { size: 11 } } }
  }
};

export default function AdminDashboardPage() {
  const { toggleSidebar } = useOutletContext();
  
  const [loading, setLoading]             = useState(true);
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

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. First attempt to load aggregated stats from unified endpoint
      const statsRes = await requestApi('/api/dashboard/stats/').then(r => r.json()).catch(() => null);

      if (statsRes && statsRes.children) {
        // Populate KPIs from unified stats
        setChildrenCount(statsRes.children.total?.toString() || '0');
        setStaffCount(statsRes.staff?.total?.toString() || '0');
        setVolunteerCount(statsRes.volunteers?.total?.toString() || '0');

        const thisMonthAmount = statsRes.donations?.this_month || 0;
        let formattedRev = '₹' + thisMonthAmount.toLocaleString('en-IN');
        if (thisMonthAmount >= 100000) formattedRev = '₹' + (thisMonthAmount / 100000).toFixed(1) + 'L';
        else if (thisMonthAmount >= 1000) formattedRev = '₹' + (thisMonthAmount / 1000).toFixed(1) + 'K';
        setRevenue(formattedRev);
        setRevenueTrend(`₹${(statsRes.donations?.total || 0).toLocaleString('en-IN')} cumulative`);

        // Populate donation chart
        if (Array.isArray(statsRes.donations?.trend) && statsRes.donations.trend.length > 0) {
          setDonationChartData({
            labels: statsRes.donations.trend.map(t => t.month),
            datasets: [{
              label: 'Donations (₹)',
              data: statsRes.donations.trend.map(t => t.amount),
              backgroundColor: 'rgba(37,99,235,0.75)',
              borderColor: '#2563eb',
              borderWidth: 1,
              borderRadius: 6,
            }]
          });
        }

        // Populate academic chart
        if (Array.isArray(statsRes.academic?.subject_averages) && statsRes.academic.subject_averages.length > 0) {
          setAcademicChartData({
            labels: statsRes.academic.subject_averages.map(s => s.subject.replace(' Language', '')),
            datasets: [{
              label: 'Avg Score %',
              data: statsRes.academic.subject_averages.map(s => s.avg),
              borderColor: '#2563eb',
              backgroundColor: 'rgba(37,99,235,0.1)',
              fill: true, tension: 0.4, borderWidth: 2.5,
              pointBackgroundColor: '#2563eb', pointRadius: 5,
            }]
          });
        }

        // Populate health doughnut
        const healthyCount = statsRes.health?.healthy || 0;
        const atRiskCount = statsRes.health?.at_risk || 0;
        setHealthDoughnutData({
          labels: ['Healthy / Optimal', 'At Risk / Attention'],
          datasets: [{
            data: [healthyCount, atRiskCount],
            backgroundColor: ['rgba(16,185,129,0.7)', 'rgba(225,29,72,0.7)'],
            borderColor: ['#10b981', '#e11d48'],
            borderWidth: 1,
          }]
        });
      }

      // 2. Fetch live alerts for recent activity & AI recommendations
      const alerts = await requestApi('/api/alerts/').then(r => r.json()).catch(() => []);
      if (Array.isArray(alerts)) {
        setAiAlerts(alerts.slice(0, 4));
        const activities = alerts.map(a => ({
          icon: 'bi-cpu-fill',
          color: a.severity === 'Critical' ? '#ef4444' : a.severity === 'Warning' ? '#f59e0b' : '#3b82f6',
          text: `${a.child_name || 'Child'}: ${a.message}`,
          time: a.created_date ? new Date(a.created_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'
        }));
        setRecentActivities(activities);
      }
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const stats = [
    { label: 'Total Children',    value: childrenCount, trend: 'Active', up: true,  icon: 'bi-person-heart',  iconClass: 'stat-icon-accent' },
    { label: 'Caregiver Staff',   value: staffCount,    trend: 'Staff active',      up: null, icon: 'bi-person-badge',  iconClass: 'stat-icon-green' },
    { label: 'Active Volunteers', value: volunteerCount, trend: 'Registered', up: true,  icon: 'bi-people-fill',   iconClass: 'stat-icon-violet' },
    { label: 'Monthly Revenue',   value: revenue,       trend: revenueTrend || 'This month',        up: true,  icon: 'bi-cash-stack',    iconClass: 'stat-icon-amber' },
  ];

  return (
    <>
      <TopHeader title="Admin Dashboard" />

      <div className="page-body">
        {/* Banner */}
        <div className="page-banner">
          <div>
            <div className="section-label">Command Center</div>
            <div className="page-banner-title">Orphanage Overview</div>
            <div className="page-banner-sub">Real-time metrics, health diagnostics, academic telemetry & financial logs</div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              onClick={loadDashboardData}
              disabled={loading}
              className="btn btn-outline btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderColor: 'var(--border)' }}
            >
              <i className={`bi bi-arrow-clockwise ${loading ? 'bi-spin' : ''}`} />
              {loading ? 'Syncing...' : 'Live Sync'}
            </button>
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
