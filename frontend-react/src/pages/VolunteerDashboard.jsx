import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import TopHeader from '../components/TopHeader';
import ActivityDetails from '../components/ActivityDetails';

const API = 'http://localhost:8000/api';

const STATUS_COLOR = {
  'Pending': 'badge-amber',
  'In Progress': 'badge-accent',
  'Completed': 'badge-green',
};

const TYPE_BADGE = {
  'Education': 'badge-blue',
  'Extracurricular': 'badge-purple',
  'Sports': 'badge-green',
  'Arts and Crafts': 'badge-amber',
  'Computer Learning': 'badge-cyan',
};

export default function VolunteerDashboard() {
  const { toggleSidebar } = useOutletContext() || {};

  const userName = localStorage.getItem('userName') || 'Volunteer';
  const userEmail = localStorage.getItem('userEmail') || '';
  const userId = localStorage.getItem('userId') || '';

  const [activities, setActivities] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState(null);

  const fetchDashboardData = () => {
    setLoading(true);
    const actUrl = userEmail
      ? `${API}/volunteer/activities/?email=${encodeURIComponent(userEmail)}`
      : `${API}/volunteer/activities/`;

    const profUrl = `${API}/volunteer/profile/?email=${encodeURIComponent(userEmail)}&user_id=${userId}`;

    Promise.all([
      fetch(actUrl).then(r => r.json()).catch(() => []),
      fetch(profUrl).then(r => r.json()).catch(() => null)
    ])
      .then(([actsData, profData]) => {
        if (Array.isArray(actsData) && actsData.length > 0) {
          setActivities(actsData);
        } else {
          // Fallback if email didn't match directly
          fetch(`${API}/volunteer/activities/`)
            .then(r => r.json())
            .then(allActs => setActivities(Array.isArray(allActs) ? allActs : []))
            .catch(() => setActivities([]));
        }

        if (profData && !profData.error) {
          setProfile(profData);
        }
      })
      .catch(() => {
        // Fallback demo data for robust rendering
        setActivities([
          {
            assignment_id: 1,
            event_name: 'Mathematics Learning Support',
            description: 'Conduct remedial math session focusing on fractions and basic algebra.',
            activity_type: 'Education',
            priority: 'High',
            assigned_date: '2026-09-15',
            scheduled_date: '2026-09-20',
            due_date: '2026-09-20',
            assigned_children: '5 Children',
            location: 'Education Center - Room 3',
            assigned_by: 'Academic Coordinator',
            instructions: 'Use visual flashcards and conduct arithmetic games.',
            status: 'Pending'
          },
          {
            assignment_id: 2,
            event_name: 'Arts Activity',
            description: 'Teach watercolor painting and origami craft work.',
            activity_type: 'Extracurricular',
            priority: 'Medium',
            assigned_date: '2026-09-18',
            scheduled_date: '2026-09-22',
            due_date: '2026-09-22',
            assigned_children: '8 Children',
            location: 'Activity Hall B',
            assigned_by: 'Care Coordinator',
            instructions: 'Distribute child-friendly paint brushes and supplies.',
            status: 'In Progress'
          },
          {
            assignment_id: 3,
            event_name: 'Sports Activity',
            description: 'Outdoor football training, fitness drills, and friendly tournament.',
            activity_type: 'Sports',
            priority: 'Medium',
            assigned_date: '2026-09-10',
            scheduled_date: '2026-09-25',
            due_date: '2026-09-25',
            assigned_children: '10 Children',
            location: 'Main Sports Ground',
            assigned_by: 'Sports Director',
            instructions: 'Ensure proper warmup and safety protocols.',
            status: 'Completed',
            completion_date: '2026-09-25',
            remarks: 'All 10 children participated enthusiastically.'
          }
        ]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Format date helper: "2026-09-20" -> "20 Sep 2026"
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const totalCount = activities.length;
  const pendingCount = activities.filter(a => a.status === 'Pending').length;
  const inProgressCount = activities.filter(a => a.status === 'In Progress').length;
  const completedCount = activities.filter(a => a.status === 'Completed').length;

  // Upcoming: activities scheduled today or in future, or still Pending/In Progress
  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingCount = activities.filter(a => {
    const sDate = a.scheduled_date || a.due_date || '';
    return (sDate >= todayStr && a.status !== 'Completed') || a.status === 'Pending';
  }).length;

  const handleStatusUpdateSuccess = () => {
    fetchDashboardData();
  };

  return (
    <>
      <TopHeader title="Volunteer Dashboard" onToggleSidebar={toggleSidebar} />

      <div className="page-body">
        {/* WELCOME BANNER */}
        <div className="page-banner" style={{
          background: 'linear-gradient(135deg, rgba(37,99,235,0.12) 0%, rgba(22,163,74,0.10) 100%)',
          border: '1px solid rgba(37,99,235,0.25)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <div className="section-label" style={{ color: '#3b82f6', fontWeight: 700 }}>
              Phase 1 &bull; Module 3: Volunteer Management
            </div>
            <div className="page-banner-title" style={{ color: 'var(--text-primary)', fontSize: '1.6rem' }}>
              Welcome back, {profile?.full_name || userName}!
            </div>
            <div className="page-banner-sub">
              Intelligent Child Development and Orphanage Management System Using AI & ML
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <Link to="/volunteer/activities" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <i className="bi bi-calendar-check-fill" /> View All Activities
            </Link>
            <Link to="/volunteer/profile" className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <i className="bi bi-person-circle" /> Edit My Profile
            </Link>
          </div>
        </div>

        {/* 5 DASHBOARD CARDS */}
        <div className="stats-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          {[
            { label: 'Total Assigned Activities', value: totalCount, icon: 'bi-calendar3', cls: 'stat-icon-accent' },
            { label: 'Pending Activities', value: pendingCount, icon: 'bi-hourglass-split', cls: 'stat-icon-amber' },
            { label: 'In-Progress Activities', value: inProgressCount, icon: 'bi-lightning-charge-fill', cls: 'stat-icon-violet' },
            { label: 'Completed Activities', value: completedCount, icon: 'bi-check-circle-fill', cls: 'stat-icon-green' },
            { label: 'Upcoming Activities', value: upcomingCount, icon: 'bi-bell-fill', cls: 'stat-icon-cyan' },
          ].map(s => (
            <div key={s.label} className="stat-card" style={{ padding: '1rem' }}>
              <div className={`stat-icon ${s.cls}`} style={{ width: 44, height: 44, fontSize: '1.25rem' }}>
                <i className={`bi ${s.icon}`} />
              </div>
              <div>
                <div className="stat-label" style={{ fontSize: '0.75rem' }}>{s.label}</div>
                <div className="stat-value" style={{ fontSize: '1.4rem' }}>{loading ? '—' : s.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* VOLUNTEER PROFILE SUMMARY CARD */}
        <div className="chart-card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div className="chart-card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
              <i className="bi bi-person-badge-fill" style={{ color: '#3b82f6' }} /> Volunteer Profile Summary
            </div>
            <Link to="/volunteer/profile" className="btn btn-ghost btn-sm" style={{ fontSize: '0.78rem' }}>
              <i className="bi bi-pencil" /> Edit Full Profile
            </Link>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            background: 'var(--bg-surface-2)',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)'
          }}>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                Volunteer Name
              </span>
              <strong style={{ color: 'var(--text-primary)', fontSize: '0.92rem' }}>
                {profile?.full_name || userName}
              </strong>
            </div>

            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                Email
              </span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                {profile?.email || userEmail || 'volunteer@orphanage.com'}
              </span>
            </div>

            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                Phone Number
              </span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                {profile?.phone_number || '+91 98765 43210'}
              </span>
            </div>

            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                Profile Status
              </span>
              <span className={`badge ${profile?.status === 'Active' ? 'badge-green' : 'badge-amber'}`} style={{ marginTop: '0.2rem' }}>
                {profile?.status || 'Active'}
              </span>
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                Skills
              </span>
              <span style={{ color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                {profile?.skills || 'Mathematics Tutoring, STEM Mentorship, Basic First Aid'}
              </span>
            </div>

            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                Areas of Interest
              </span>
              <span style={{ color: '#60a5fa', fontSize: '0.85rem', fontWeight: 600 }}>
                {profile?.areas_of_interest || 'Education, Sports, Arts and Crafts'}
              </span>
            </div>

            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                Availability
              </span>
              <span style={{ color: '#34d399', fontSize: '0.85rem', fontWeight: 600 }}>
                {profile?.availability || 'Weekends & Evenings'}
              </span>
            </div>
          </div>
        </div>

        {/* RECENT ASSIGNED ACTIVITIES TABLE */}
        <div className="chart-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div className="chart-card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="bi bi-list-check" style={{ color: '#2563eb' }} /> Assigned Activities Table
            </div>
            <Link to="/volunteer/activities" className="btn btn-ghost btn-sm" style={{ fontSize: '0.8rem' }}>
              Search & Filter All ({totalCount}) <i className="bi bi-arrow-right" />
            </Link>
          </div>

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Activity</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'center' }}>Children</th>
                  <th>Type</th>
                  <th style={{ textAlign: 'center', minWidth: '105px' }}>Status</th>
                  <th style={{ textAlign: 'center', minWidth: '95px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem' }}>
                      <span className="spinner" style={{ margin: '0 auto' }} />
                    </td>
                  </tr>
                ) : activities.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                      <i className="bi bi-calendar-x" style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }} />
                      No activities currently assigned.
                    </td>
                  </tr>
                ) : (
                  activities.slice(0, 6).map((act) => {
                    const scheduledDate = act.scheduled_date || act.due_date || act.assigned_date;
                    const childDisplay = act.assigned_children
                      ? act.assigned_children.replace(/[^0-9]/g, '') || act.assigned_children
                      : '5';

                    return (
                      <tr key={act.assignment_id}>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                            {act.event_name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {act.description || 'Assigned shift activity'}
                          </div>
                        </td>

                        <td style={{ whiteSpace: 'nowrap', color: '#60a5fa', fontWeight: 600 }}>
                          {formatDate(scheduledDate)}
                        </td>

                        <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <span className="badge badge-accent" style={{ fontSize: '0.75rem', padding: '0.2rem 0.55rem' }} title={act.assigned_children || 'Assigned Children'}>
                            {childDisplay}
                          </span>
                        </td>

                        <td style={{ whiteSpace: 'nowrap' }}>
                          <span className="badge badge-muted" style={{ fontSize: '0.75rem' }}>
                            {act.activity_type || 'Education'}
                          </span>
                        </td>

                        <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <span className={`badge ${STATUS_COLOR[act.status] || 'badge-muted'}`}>
                            {act.status}
                          </span>
                        </td>

                        <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                          {act.status === 'In Progress' ? (
                            <button
                              className="btn btn-warning btn-sm"
                              onClick={() => setSelectedActivity(act)}
                              style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem', fontWeight: 600 }}
                            >
                              <i className="bi bi-pencil-square" /> Update
                            </button>
                          ) : (
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => setSelectedActivity(act)}
                              style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem' }}
                            >
                              <i className="bi bi-eye" /> View
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Activity Details & Status Modal */}
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
