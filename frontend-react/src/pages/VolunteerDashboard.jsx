import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate, Link } from 'react-router-dom';
import TopHeader from '../components/TopHeader';
import ActivityDetails from '../components/ActivityDetails';

const API = 'http://localhost:8000/api';

const STATUS_COLOR = {
  'Pending': 'badge-amber',
  'In Progress': 'badge-accent',
  'Completed': 'badge-green',
};

export default function VolunteerDashboard() {
  const { toggleSidebar } = useOutletContext() || {};
  const navigate = useNavigate();

  const userName = localStorage.getItem('userName') || 'Volunteer';
  const userEmail = localStorage.getItem('userEmail') || '';

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState(null);

  const fetchActivities = () => {
    setLoading(true);
    const url = userEmail ? `${API}/volunteer/activities/?email=${encodeURIComponent(userEmail)}` : `${API}/volunteer/activities/`;
    fetch(url)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setActivities(data);
        } else {
          fetch(`${API}/volunteer/activities/`)
            .then(r => r.json())
            .then(allData => setActivities(Array.isArray(allData) ? allData : []))
            .catch(() => setActivities([]));
        }
      })
      .catch(() => {
        // Fallback default data for testing
        setActivities([
          {
            assignment_id: 101,
            event_name: 'Weekend Mathematics Tutoring Class',
            description: 'Conduct 2-hour interactive math session for Class 5 children.',
            assigned_date: '2026-08-25',
            due_date: '2026-08-30',
            location: 'Education Hall - Room 3',
            assigned_by: 'Admin Office',
            instructions: 'Focus on fractions and basic multiplication exercises.',
            status: 'Pending'
          },
          {
            assignment_id: 102,
            event_name: 'Sports Day Football Coaching',
            description: 'Organize outdoor football drills and teamwork activities.',
            assigned_date: '2026-08-20',
            due_date: '2026-08-28',
            location: 'Orphanage Playground',
            assigned_by: 'Sports Coordinator',
            instructions: 'Ensure proper warmup and safety gear usage.',
            status: 'In Progress'
          },
          {
            assignment_id: 103,
            event_name: 'Health Checkup Coordination Support',
            description: 'Assist visiting medical team during pediatric health screening.',
            assigned_date: '2026-08-15',
            due_date: '2026-08-18',
            location: 'Clinical Care Room',
            assigned_by: 'Dr. Rajesh Verma',
            instructions: 'Maintain weight and height log sheets.',
            status: 'Completed'
          }
        ]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const totalCount = activities.length;
  const pendingCount = activities.filter(a => a.status === 'Pending').length;
  const inProgressCount = activities.filter(a => a.status === 'In Progress').length;
  const completedCount = activities.filter(a => a.status === 'Completed').length;

  const handleStatusUpdateSuccess = () => {
    fetchActivities();
  };

  return (
    <>
      <TopHeader title="Volunteer Dashboard" onToggleSidebar={toggleSidebar} />

      <div className="page-body">
        {/* Banner */}
        <div className="page-banner" style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.15) 0%, rgba(22,163,74,0.1) 100%)', border: '1px solid rgba(37,99,235,0.25)' }}>
          <div>
            <div className="section-label" style={{ color: '#2563eb' }}>Volunteer Operations</div>
            <div className="page-banner-title" style={{ color: 'var(--text-primary)' }}>Welcome, {userName}</div>
            <div className="page-banner-sub">View your assigned activities, track shift progress, and update task status</div>
          </div>
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <Link to="/volunteer/activities" className="btn btn-primary">
              <i className="bi bi-calendar-check-fill" /> View All Activities
            </Link>
            <Link to="/volunteer/profile" className="btn btn-secondary">
              <i className="bi bi-person-circle" /> My Profile
            </Link>
          </div>
        </div>

        {/* 4 STAT CARDS */}
        <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
          {[
            { label: 'Total Assigned Activities', value: totalCount, icon: 'bi-calendar-event-fill', cls: 'stat-icon-accent' },
            { label: 'Pending Activities', value: pendingCount, icon: 'bi-clock-history', cls: 'stat-icon-amber' },
            { label: 'In Progress Activities', value: inProgressCount, icon: 'bi-lightning-charge-fill', cls: 'stat-icon-violet' },
            { label: 'Completed Activities', value: completedCount, icon: 'bi-check-circle-fill', cls: 'stat-icon-green' },
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

        {/* RECENT ASSIGNED ACTIVITIES TABLE */}
        <div className="chart-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div className="chart-card-title" style={{ margin: 0 }}>
              <i className="bi bi-list-task" style={{ color: '#2563eb' }} /> Recent Assigned Activities
            </div>
            <Link to="/volunteer/activities" className="btn btn-ghost btn-sm" style={{ fontSize: '0.8rem' }}>
              View All <i className="bi bi-arrow-right" />
            </Link>
          </div>

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Activity Name</th>
                  <th>Assigned Date</th>
                  <th>Due Date</th>
                  <th style={{ textAlign: 'center', minWidth: '105px' }}>Status</th>
                  <th style={{ textAlign: 'center', minWidth: '90px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>
                      <span className="spinner" style={{ margin: '0 auto' }} />
                    </td>
                  </tr>
                ) : activities.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      <i className="bi bi-calendar-x" style={{ fontSize: '1.8rem', display: 'block', marginBottom: '0.5rem' }} />
                      No activities assigned to you yet.
                    </td>
                  </tr>
                ) : (
                  activities.slice(0, 5).map((act) => (
                    <tr key={act.assignment_id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {act.event_name}
                      </td>
                      <td>{act.assigned_date || '—'}</td>
                      <td>{act.due_date || '—'}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge ${STATUS_COLOR[act.status] || 'badge-muted'}`}>
                          {act.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => setSelectedActivity(act)}
                          style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                        >
                          <i className="bi bi-eye" /> View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Activity Details Modal */}
      {selectedActivity && (
        <ActivityDetails
          activity={selectedActivity}
          onClose={() => setSelectedActivity(null)}
          onUpdateSuccess={handleStatusUpdateSuccess}
        />
      )}
    </>
  );
}
