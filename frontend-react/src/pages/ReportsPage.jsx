import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import TopHeader from '../components/TopHeader';

const API = 'http://localhost:8000/api';

export default function ReportsPage() {
  const { toggleSidebar } = useOutletContext();
  const [reportType, setReportType] = useState('Child Health & Growth Summary');
  const [period, setPeriod]         = useState('All Time');
  const [format, setFormat]         = useState('CSV Format');
  const [loading, setLoading]       = useState(false);
  const [msg, setMsg]               = useState('');

  const handleGenerate = async (e) => {
    e.preventDefault();
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
        const res = await fetch(`${API}/expenses/`);
        data = await res.json();
        filename = 'financial_expense_audit.csv';
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
      }
      setMsg(`${reportType} exported successfully.`);
      setTimeout(() => setMsg(''), 3000);
    } catch {
      alert('Failed to export report.');
    } finally {
      setLoading(false);
    }
  };

  const recentReports = [
    { title: 'Q2 Financial & Donation Statement', date: 'Aug 15, 2026', type: 'CSV', icon: 'bi-file-earmark-spreadsheet-fill', color: '#10b981' },
    { title: 'Monthly Child Health & BMI Summary', date: 'Aug 14, 2026', type: 'CSV', icon: 'bi-file-earmark-spreadsheet-fill', color: '#10b981' },
    { title: 'Academic Progress & Term Trajectory', date: 'Aug 10, 2026', type: 'CSV', icon: 'bi-file-earmark-spreadsheet-fill', color: '#3b82f6' },
    { title: 'Volunteer Hours & Activity Log', date: 'Jul 31, 2026', type: 'CSV', icon: 'bi-file-earmark-spreadsheet-fill', color: '#a78bfa' },
  ];

  return (
    <>
      <TopHeader title="Reports & Analytics" onToggleSidebar={toggleSidebar} />
      
      <div className="page-body">
        <div className="page-banner">
          <div>
            <div className="section-label">Analytics</div>
            <div className="page-banner-title">Data Reports</div>
            <div className="page-banner-sub">Generate and export comprehensive real-time reports on health, academics, and finances</div>
          </div>
        </div>

        {msg && <div className="alert alert-success"><i className="bi bi-check-circle-fill" /> {msg}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
          
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
                  <option>Excel Spreadsheet (XLSX)</option>
                </select>
              </div>
              
              <button type="submit" className="btn btn-primary w-full mt-3" disabled={loading} style={{ justifyContent: 'center' }}>
                {loading ? <><span className="spinner spinner-sm" /> Exporting...</> : <><i className="bi bi-download" /> Export Live Report</>}
              </button>
            </form>
          </div>

          {/* Recent Reports */}
          <div className="chart-card">
            <div className="chart-card-title">
              <i className="bi bi-clock-history" /> Automated System Audit Reports
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recentReports.map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--bg-surface-3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <i className={`bi ${r.icon}`} style={{ fontSize: '1.5rem', color: r.color }} />
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.title}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Generated: {r.date}</div>
                    </div>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={handleGenerate} title="Download Report">
                    <i className="bi bi-download" />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
