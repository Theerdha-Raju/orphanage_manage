import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import TopHeader from '../components/TopHeader';

const API = 'http://localhost:8000/api';

export default function ChildDashboardPage() {
  const { toggleSidebar } = useOutletContext();
  const userName = localStorage.getItem('userName') || 'Student';

  const [avgScore, setAvgScore]       = useState('82%');
  const [healthStatus, setHealthStatus] = useState('Healthy');
  const [lastCheckup, setLastCheckup] = useState('Recently');
  const [achievements, setAchievements] = useState([]);
  const [events, setEvents]           = useState([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/education/`).then(r => r.json()).catch(() => []),
      fetch(`${API}/health/`).then(r => r.json()).catch(() => []),
      fetch(`${API}/achievements/`).then(r => r.json()).catch(() => []),
      fetch(`${API}/volunteer-assignments/`).then(r => r.json()).catch(() => []),
    ]).then(([edu, h, ach, ev]) => {
      if (Array.isArray(edu) && edu.length > 0) {
        const mean = edu.reduce((a, b) => a + parseFloat(b.marks || 0), 0) / edu.length;
        setAvgScore(`${mean.toFixed(1)}%`);
      }
      if (Array.isArray(h) && h.length > 0) {
        setHealthStatus(h[0].status || 'Healthy');
        setLastCheckup(h[0].checkup_date || 'Recently');
      }
      if (Array.isArray(ach)) setAchievements(ach);
      if (Array.isArray(ev)) setEvents(ev);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <>
      <TopHeader title="My Dashboard" onToggleSidebar={toggleSidebar} />
      
      <div className="page-body">
        <div className="page-banner">
          <div>
            <div className="section-label">My Space</div>
            <div className="page-banner-title">Hello, {userName} ✨</div>
            <div className="page-banner-sub">Check your academic progress, upcoming activities, and health summary.</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          
          <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center', background: 'linear-gradient(135deg, rgba(37,99,235,0.05), rgba(124,58,237,0.05))' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(37,99,235,0.1)', color: '#3b82f6', fontSize: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <i className="bi bi-journal-bookmark-fill" />
            </div>
            <h5 style={{ color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Academics</h5>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>{avgScore}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Average Score</div>
          </div>

          <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center', background: 'linear-gradient(135deg, rgba(16,185,129,0.05), rgba(37,99,235,0.05))' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', color: '#10b981', fontSize: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <i className="bi bi-heart-pulse-fill" />
            </div>
            <h5 style={{ color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Health</h5>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: healthStatus === 'Healthy' ? '#10b981' : '#f59e0b' }}>{healthStatus}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Checkup: {lastCheckup}</div>
          </div>

          <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center', background: 'linear-gradient(135deg, rgba(245,158,11,0.05), rgba(239,68,68,0.05))' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', fontSize: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <i className="bi bi-star-fill" />
            </div>
            <h5 style={{ color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Attendance</h5>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>96%</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Keep it up!</div>
          </div>

        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
          
          <div className="chart-card">
            <div className="chart-card-title"><i className="bi bi-trophy-fill" /> Recent Achievements & Honors</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '1rem' }}><span className="spinner"></span></div>
              ) : achievements.length === 0 ? (
                <div style={{ padding: '1rem', color: 'var(--text-muted)' }}>No recorded achievements yet</div>
              ) : achievements.map((ach, i) => (
                <div key={ach.achievement_id || i} style={{ display: 'flex', gap: '1rem', padding: '1rem', background: 'var(--bg-surface-3)', borderRadius: 'var(--radius-md)', borderLeft: i % 2 === 0 ? '4px solid #4ade80' : '4px solid #a78bfa' }}>
                  <i className={`bi ${i % 2 === 0 ? 'bi-award-fill' : 'bi-trophy-fill'}`} style={{ fontSize: '1.5rem', color: i % 2 === 0 ? '#4ade80' : '#a78bfa' }} />
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{ach.title} ({ach.child_name || 'Student'})</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{ach.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-card-title"><i className="bi bi-calendar-event" /> Upcoming Activities</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {events.slice(0, 4).map((ev, i) => (
                <div key={ev.assignment_id || i} style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>{ev.event_name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Date: {ev.assigned_date}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
