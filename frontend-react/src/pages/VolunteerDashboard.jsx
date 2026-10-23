import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import TopHeader from '../components/TopHeader';
import ActivityDetails from '../components/ActivityDetails';
import { requestApi } from '../apiConfig';

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

const getLocalDateStr = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function VolunteerDashboard() {
  const { toggleSidebar } = useOutletContext() || {};

  const userName = localStorage.getItem('userName') || 'Volunteer';
  const userEmail = localStorage.getItem('userEmail') || '';
  const userId = localStorage.getItem('userId') || '';
  const volunteerId = localStorage.getItem('volunteerId') || '';

  const [activities, setActivities] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const now = new Date();
  const todayStr = getLocalDateStr(now);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const actEndpoint = volunteerId
        ? `/api/volunteer/activities/?volunteer_id=${volunteerId}`
        : userEmail
          ? `/api/volunteer/activities/?email=${encodeURIComponent(userEmail)}&user_id=${userId}`
          : '/api/volunteer/activities/';

      const profEndpoint = volunteerId
        ? `/api/volunteer/profile/?volunteer_id=${volunteerId}`
        : userEmail
          ? `/api/volunteer/profile/?email=${encodeURIComponent(userEmail)}&user_id=${userId}`
          : '/api/volunteer/profile/';

      const [actRes, profRes] = await Promise.all([
        requestApi(actEndpoint),
        requestApi(profEndpoint)
      ]);

      if (actRes.ok) {
        const actsData = await actRes.json();
        if (Array.isArray(actsData)) {
          setActivities(actsData);
        }
      }

      if (profRes.ok) {
        const profData = await profRes.json();
        if (profData && !profData.error) {
          setProfile(profData);
        }
      }
    } catch (err) {
      console.error('Error fetching volunteer dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const [filterTab, setFilterTab] = useState('all');

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

  const isTodayActivity = (act) => {
    if (!act) return false;
    const sDate = act.scheduled_date || act.assigned_date || '';
    return sDate === todayStr;
  };

  const todayActivities = activities.filter(isTodayActivity);
  const totalCount = activities.length;
  const pendingCount = activities.filter(a => a.status === 'Pending').length;
  const inProgressCount = activities.filter(a => a.status === 'In Progress').length;
  const completedCount = activities.filter(a => a.status === 'Completed').length;

  // Upcoming: strictly future scheduled activities that are not completed (avoids double-counting today's activities)
  const upcomingCount = activities.filter(a => {
    const sDate = a.scheduled_date || a.due_date || '';
    return sDate > todayStr && a.status !== 'Completed';
  }).length;

  const handleStatusUpdateSuccess = () => {
    fetchDashboardData();
  };

  const handleQuickStatus = async (activityId, newStatus) => {
    try {
      const todayIso = getLocalDateStr(now);
      const res = await requestApi(`/api/volunteer/activities/${activityId}/status/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          completion_date: newStatus === 'Completed' ? todayIso : null,
          remarks: newStatus === 'Completed' ? 'Completed successfully during volunteer session.' : ''
        })
      });
      if (res.ok) {
        fetchDashboardData();
        return;
      }
      const data = await res.json();
      alert(data.error || 'Failed to update activity status.');
    } catch (e) {
      console.error(e);
      alert('Network error while updating status.');
    }
  };


  const handleDeleteActivity = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete assignment "${name || 'Activity'}"?`)) return;
    try {
      await fetch(`${API}/volunteer-assignments/${id}/`, { method: 'DELETE' });
    } catch {}
    setActivities(prev => prev.filter(a => a.assignment_id !== id));
  };

  const displayedActivities = activities.filter(act => {
    if (filterTab === 'today') return isTodayActivity(act);
    if (filterTab === 'in_progress') return act.status === 'In Progress';
    if (filterTab === 'pending') return act.status === 'Pending';
    if (filterTab === 'completed') return act.status === 'Completed';
    return true;
  });

  // Prioritize today's activities at the top when viewing 'all'
  const sortedDisplayedActivities = [...displayedActivities].sort((a, b) => {
    if (filterTab === 'all') {
      const aIsToday = isTodayActivity(a);
      const bIsToday = isTodayActivity(b);
      if (aIsToday && !bIsToday) return -1;
      if (!aIsToday && bIsToday) return 1;
    }
    const dateA = a.scheduled_date || a.assigned_date || '';
    const dateB = b.scheduled_date || b.assigned_date || '';
    return dateB.localeCompare(dateA);
  });

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
            <div className="page-banner-title" style={{ color: 'var(--text-primary)', fontSize: '1.6rem' }}>
              Welcome back, {profile?.full_name || userName}!
            </div>
            <div className="page-banner-sub">
              Intelligent Child Development and Orphanage Management System Using AI & ML
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
            {/* Total Activities & Today Counter Widget */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.9rem',
              background: 'rgba(37,99,235,0.08)',
              border: '1px solid rgba(37,99,235,0.22)',
              borderRadius: 'var(--radius-md)',
              padding: '0.55rem 1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(37,99,235,0.18)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#60a5fa',
                  fontSize: '1.1rem'
                }}>
                  <i className="bi bi-calendar3" />
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Total Activities
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
                    {loading ? '—' : totalCount}
                  </div>
                </div>
              </div>

              <div style={{ width: '1px', height: '30px', background: 'rgba(96,165,250,0.25)' }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 'var(--radius-sm)',
                  background: todayActivities.length > 0 ? 'rgba(34,197,94,0.18)' : 'rgba(148,163,184,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: todayActivities.length > 0 ? '#4ade80' : 'var(--text-muted)',
                  fontSize: '1.1rem'
                }}>
                  <i className="bi bi-calendar2-check-fill" />
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Today's Activities
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: todayActivities.length > 0 ? '#4ade80' : 'var(--text-primary)', lineHeight: 1.1 }}>
                    {loading ? '—' : todayActivities.length}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              <Link to="/volunteer/activities" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <i className="bi bi-calendar-check-fill" /> View All Activities
              </Link>
              <Link to="/volunteer/profile" className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <i className="bi bi-person-circle" /> Edit My Profile
              </Link>
            </div>
          </div>
        </div>

        {/* 6 DASHBOARD CARDS */}
        <div className="stats-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          {[
            { label: 'Total Assigned Activities', value: totalCount, icon: 'bi-calendar3', cls: 'stat-icon-accent' },
            { label: "Today's Activities", value: todayActivities.length, icon: 'bi-calendar2-check-fill', cls: 'stat-icon-cyan' },
            { label: 'Pending Activities', value: pendingCount, icon: 'bi-hourglass-split', cls: 'stat-icon-amber' },
            { label: 'In-Progress Activities', value: inProgressCount, icon: 'bi-lightning-charge-fill', cls: 'stat-icon-violet' },
            { label: 'Completed Activities', value: completedCount, icon: 'bi-check-circle-fill', cls: 'stat-icon-green' },
            { label: 'Upcoming Activities', value: upcomingCount, icon: 'bi-bell-fill', cls: 'stat-icon-accent' },
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
                {profile?.email || userEmail || '—'}
              </span>
            </div>

            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                Phone Number
              </span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                {profile?.phone_number || 'Not provided'}
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
                {profile?.skills || 'Not specified'}
              </span>
            </div>

            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                Areas of Interest
              </span>
              <span style={{ color: '#60a5fa', fontSize: '0.85rem', fontWeight: 600 }}>
                {profile?.areas_of_interest || 'Not specified'}
              </span>
            </div>

            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                Availability
              </span>
              <span style={{ color: '#34d399', fontSize: '0.85rem', fontWeight: 600 }}>
                {profile?.availability || 'Flexible'}
              </span>
            </div>
          </div>
        </div>

        {/* TODAY'S ASSIGNED ACTIVITIES SHOWCASE SECTION */}
        <div className="chart-card" style={{
          marginBottom: '1.5rem',
          padding: '1.25rem',
          border: todayActivities.length > 0 ? '1px solid rgba(59, 130, 246, 0.4)' : undefined,
          boxShadow: todayActivities.length > 0 ? '0 4px 20px -2px rgba(59, 130, 246, 0.12)' : undefined
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.1rem', flexWrap: 'wrap', gap: '0.6rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(37,99,235,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#3b82f6',
                fontSize: '1.2rem'
              }}>
                <i className="bi bi-calendar2-event-fill" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Today's Assigned Activities
                  </h3>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    background: todayActivities.length > 0 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(148, 163, 184, 0.12)',
                    color: todayActivities.length > 0 ? '#4ade80' : 'var(--text-muted)',
                    border: todayActivities.length > 0 ? '1px solid rgba(34, 197, 94, 0.35)' : '1px solid var(--border)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.6rem',
                    borderRadius: '999px'
                  }}>
                    <span style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: todayActivities.length > 0 ? '#22c55e' : '#94a3b8',
                      display: 'inline-block',
                      boxShadow: todayActivities.length > 0 ? '0 0 8px #22c55e' : 'none'
                    }} />
                    {todayActivities.length > 0 ? `${todayActivities.length} Scheduled for Today` : 'No Activities Today'}
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  {now.toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                </div>
              </div>
            </div>

            {todayActivities.length > 0 && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setFilterTab('today')}
                style={{ fontSize: '0.8rem', color: '#60a5fa' }}
              >
                Focus in Table Below <i className="bi bi-arrow-down-short" />
              </button>
            )}
          </div>

          {todayActivities.length === 0 ? (
            <div style={{
              background: 'var(--bg-surface-2)',
              border: '1px dashed var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '1.75rem',
              textAlign: 'center',
              color: 'var(--text-secondary)'
            }}>
              <i className="bi bi-calendar2-check" style={{ fontSize: '2rem', color: '#60a5fa', display: 'block', marginBottom: '0.5rem' }} />
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.96rem' }}>
                No activities scheduled for today ({formatDate(todayStr)})
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                You have {upcomingCount} upcoming activities. View your schedule in the table below.
              </div>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '1rem'
            }}>
              {todayActivities.map(act => (
                <div
                  key={act.assignment_id}
                  style={{
                    background: 'var(--bg-surface-2)',
                    border: '1px solid rgba(59, 130, 246, 0.35)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.15rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: act.status === 'Completed' ? '#10b981' : act.status === 'In Progress' ? '#3b82f6' : '#f59e0b'
                  }} />

                  <div>
                    {/* Header tags */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                      <span className={`badge ${TYPE_BADGE[act.activity_type] || 'badge-muted'}`} style={{ fontSize: '0.74rem' }}>
                        {act.activity_type || 'Activity'}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.45rem',
                          borderRadius: 'var(--radius-sm)',
                          color: act.priority === 'High' ? '#ef4444' : act.priority === 'Medium' ? '#f59e0b' : '#10b981',
                          background: act.priority === 'High' ? 'rgba(239, 68, 68, 0.12)' : act.priority === 'Medium' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                          textTransform: 'uppercase'
                        }}>
                          {act.priority || 'Normal'} Priority
                        </span>
                        <span className={`badge ${STATUS_COLOR[act.status] || 'badge-muted'}`} style={{ fontSize: '0.74rem' }}>
                          {act.status}
                        </span>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '1.02rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {act.event_name}
                    </h4>
                    <p style={{ margin: '0 0 0.85rem 0', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                      {act.description || 'Assigned volunteer session for today.'}
                    </p>

                    {/* Info items */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '0.5rem',
                      fontSize: '0.78rem',
                      background: 'rgba(0,0,0,0.12)',
                      padding: '0.7rem 0.8rem',
                      borderRadius: 'var(--radius-sm)',
                      marginBottom: '0.85rem',
                      border: '1px solid var(--border)'
                    }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.68rem', fontWeight: 700 }}>SCHEDULED</span>
                        <span style={{ color: '#60a5fa', fontWeight: 800 }}>
                          <i className="bi bi-calendar-check" style={{ marginRight: '0.3rem' }} />
                          Today ({formatDate(act.scheduled_date || todayStr)})
                        </span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.68rem', fontWeight: 700 }}>LOCATION</span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                          <i className="bi bi-geo-alt-fill" style={{ marginRight: '0.3rem', color: '#ef4444' }} />
                          {act.location || 'Campus'}
                        </span>
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.68rem', fontWeight: 700, marginBottom: '0.35rem' }}>ASSIGNED GROUP</span>
                        {(() => {
                          const childrenList = Array.isArray(act.assigned_children_list) && act.assigned_children_list.length > 0
                            ? act.assigned_children_list
                            : act.assigned_children && act.assigned_children.includes(':')
                              ? act.assigned_children.split(':')[1].split(',').map(s => s.trim()).filter(Boolean)
                              : [];
                          const countMatch = String(act.assigned_children || '').match(/(\d+)/);
                          const count = childrenList.length || (countMatch ? countMatch[1] : '?');
                          return (
                            <>
                              <span style={{ fontSize: '0.72rem', color: '#a855f7', fontWeight: 700 }}>
                                <i className="bi bi-people-fill" style={{ marginRight: '0.25rem' }} />{count} Children
                              </span>
                              {childrenList.length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.3rem' }}>
                                  {childrenList.map((cName, cIdx) => (
                                    <span key={cIdx} style={{
                                      fontSize: '0.67rem', fontWeight: 600,
                                      background: 'rgba(168, 85, 247, 0.12)', color: '#a855f7',
                                      border: '1px solid rgba(168, 85, 247, 0.28)',
                                      padding: '0.1rem 0.4rem', borderRadius: '999px',
                                      display: 'inline-flex', alignItems: 'center', gap: '0.2rem'
                                    }}>
                                      <i className="bi bi-person-fill" style={{ fontSize: '0.65rem' }} />{cName}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.68rem', fontWeight: 700 }}>ASSIGNED BY</span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                          <i className="bi bi-person-fill" style={{ marginRight: '0.3rem', color: '#10b981' }} />
                          {act.assigned_by || 'Coordinator'}
                        </span>
                      </div>
                    </div>

                    {/* Instructions */}
                    {act.instructions && (
                      <div style={{
                        fontSize: '0.75rem',
                        background: 'rgba(59, 130, 246, 0.08)',
                        borderLeft: '3px solid #3b82f6',
                        padding: '0.5rem 0.7rem',
                        borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                        color: 'var(--text-secondary)',
                        marginBottom: '0.85rem'
                      }}>
                        <strong style={{ color: '#60a5fa' }}><i className="bi bi-info-circle-fill" /> Instructions: </strong>
                        {act.instructions}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => setSelectedActivity(act)}
                      style={{ flex: 1, minWidth: '130px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                    >
                      <i className="bi bi-pencil-square" /> Update Status & Remarks
                    </button>
                    {act.status !== 'Completed' && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleQuickStatus(act.assignment_id, 'Completed')}
                        style={{ fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.4)' }}
                        title="Mark Completed"
                      >
                        <i className="bi bi-check-circle" /> Complete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RECENT ASSIGNED ACTIVITIES TABLE */}
        <div className="chart-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div className="chart-card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="bi bi-list-check" style={{ color: '#2563eb' }} /> Assigned Activities Table
            </div>

            {/* Quick Filter Tabs */}
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {[
                { id: 'all', label: `All (${totalCount})` },
                { id: 'today', label: `📅 Today (${todayActivities.length})`, highlight: todayActivities.length > 0 },
                { id: 'in_progress', label: `In Progress (${inProgressCount})` },
                { id: 'pending', label: `Pending (${pendingCount})` },
                { id: 'completed', label: `Completed (${completedCount})` },
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterTab(tab.id)}
                  style={{
                    padding: '0.3rem 0.65rem',
                    fontSize: '0.76rem',
                    fontWeight: filterTab === tab.id ? 700 : 500,
                    borderRadius: 'var(--radius-sm)',
                    border: filterTab === tab.id
                      ? '1px solid #3b82f6'
                      : tab.highlight
                        ? '1px solid rgba(34, 197, 94, 0.5)'
                        : '1px solid var(--border)',
                    background: filterTab === tab.id
                      ? '#2563eb'
                      : tab.highlight
                        ? 'rgba(34, 197, 94, 0.12)'
                        : 'var(--bg-surface-2)',
                    color: filterTab === tab.id
                      ? '#fff'
                      : tab.highlight
                        ? '#4ade80'
                        : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {tab.label}
                </button>
              ))}
              <Link to="/volunteer/activities" className="btn btn-ghost btn-sm" style={{ fontSize: '0.78rem', marginLeft: '0.2rem' }}>
                Full Search <i className="bi bi-arrow-right" />
              </Link>
            </div>
          </div>

          <div className="table-wrap" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table className="table" style={{ width: '100%', minWidth: '960px', margin: 0 }}>
              <thead>
                <tr>
                  <th style={{ minWidth: '220px', maxWidth: '280px' }}>Activity</th>
                  <th style={{ minWidth: '150px', width: '150px' }}>Date & Time</th>
                  <th style={{ minWidth: '120px', width: '120px' }}>Location</th>
                  <th style={{ minWidth: '120px', width: '120px' }}>Assigned Volunteer</th>
                  <th style={{ textAlign: 'center', minWidth: '85px', width: '85px' }}>Priority</th>
                  <th style={{ textAlign: 'center', minWidth: '110px', width: '110px' }}>Status</th>
                  <th style={{
                    textAlign: 'center',
                    minWidth: '190px',
                    width: '190px',
                    position: 'sticky',
                    right: 0,
                    background: '#f8fafc',
                    zIndex: 3,
                    boxShadow: '-3px 0 6px rgba(0,0,0,0.06)',
                    whiteSpace: 'nowrap'
                  }}>
                    Status Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem' }}>
                      <span className="spinner" style={{ margin: '0 auto' }} />
                    </td>
                  </tr>
                ) : sortedDisplayedActivities.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                      <i className="bi bi-calendar-x" style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }} />
                      No activities match the selected filter.
                    </td>
                  </tr>
                ) : (
                  sortedDisplayedActivities.map((act) => {
                    const scheduledDate = act.scheduled_date || act.due_date || act.assigned_date;
                    const isToday = isTodayActivity(act);

                    return (
                      <tr
                        key={act.assignment_id}
                        style={{
                          background: isToday ? 'rgba(59, 130, 246, 0.08)' : undefined,
                          borderLeft: isToday ? '4px solid #3b82f6' : undefined
                        }}
                      >
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                              {act.event_name}
                            </span>
                            {isToday && (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                background: 'rgba(34, 197, 94, 0.16)',
                                color: '#4ade80',
                                border: '1px solid rgba(34, 197, 94, 0.35)',
                                fontSize: '0.64rem',
                                fontWeight: 800,
                                padding: '0.12rem 0.45rem',
                                borderRadius: '999px',
                                letterSpacing: '0.04em'
                              }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block', boxShadow: '0 0 6px #22c55e' }} />
                                TODAY
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {act.description || 'Assigned shift activity'}
                          </div>
                          {/* Children names */}
                          {(() => {
                            const cList = Array.isArray(act.assigned_children_list) && act.assigned_children_list.length > 0
                              ? act.assigned_children_list
                              : act.assigned_children && act.assigned_children.includes(':')
                                ? act.assigned_children.split(':')[1].split(',').map(s => s.trim()).filter(Boolean)
                                : [];
                            const cMatch = String(act.assigned_children || '').match(/(\d+)/);
                            const cCount = cList.length || (cMatch ? cMatch[1] : '');
                            if (!cCount) return null;
                            return (
                              <div style={{ marginTop: '0.3rem' }}>
                                <span style={{ fontSize: '0.68rem', color: '#4f46e5', fontWeight: 700 }}>
                                  <i className="bi bi-people-fill" style={{ marginRight: '0.2rem' }} />{cCount} Children
                                </span>
                                {cList.length > 0 && (
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem', marginTop: '0.2rem', maxWidth: '320px' }}>
                                    {cList.map((n, i) => (
                                      <span key={i} style={{ fontSize: '0.65rem', fontWeight: 600, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '0.07rem 0.35rem', borderRadius: '999px' }}>
                                        {n}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </td>

                        <td style={{ whiteSpace: 'nowrap', minWidth: '175px' }}>
                          {/* Scheduled Date */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.3rem' }}>
                            <span style={{ fontSize: '0.63rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em', minWidth: '55px' }}>Scheduled</span>
                            <span style={{ fontSize: '0.82rem', color: isToday ? '#38bdf8' : '#60a5fa', fontWeight: 700 }}>
                              <i className="bi bi-calendar-event-fill" style={{ marginRight: '0.25rem' }} />
                              {formatDate(scheduledDate)}
                              {isToday && (
                                <span style={{ color: '#4ade80', fontSize: '0.72rem', marginLeft: '0.3rem', fontWeight: 800 }}>
                                  (Today)
                                </span>
                              )}
                            </span>
                          </div>
                          {/* Assigned Date */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span style={{ fontSize: '0.63rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em', minWidth: '55px' }}>Assigned</span>
                            <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>
                              <i className="bi bi-calendar-plus" style={{ marginRight: '0.25rem', color: '#64748b' }} />
                              {formatDate(act.assigned_date)}
                            </span>
                          </div>
                        </td>

                        <td style={{ whiteSpace: 'nowrap' }}>
                          <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                            <i className="bi bi-geo-alt-fill" style={{ color: '#ef4444', fontSize: '0.85rem' }} />
                            {act.location || 'Orphanage Campus'}
                          </span>
                        </td>

                        <td style={{ whiteSpace: 'nowrap' }}>
                          <span style={{ fontSize: '0.82rem', color: '#a78bfa', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                            <i className="bi bi-person-check-fill" style={{ fontSize: '0.85rem' }} />
                            {act.volunteer_name || profile?.full_name || userName}
                          </span>
                        </td>

                        <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <span style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '0.2rem 0.5rem',
                            borderRadius: 'var(--radius-sm)',
                            color: act.priority === 'High' ? '#ef4444' : act.priority === 'Medium' ? '#f59e0b' : '#10b981',
                            background: act.priority === 'High' ? 'rgba(239, 68, 68, 0.12)' : act.priority === 'Medium' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                            textTransform: 'uppercase'
                          }}>
                            {act.priority || 'Medium'}
                          </span>
                        </td>

                        <td style={{ textAlign: 'center', whiteSpace: 'nowrap', minWidth: '110px', width: '110px', verticalAlign: 'top', paddingTop: '0.9rem' }}>
                          <span
                            className={`badge ${STATUS_COLOR[act.status] || 'badge-muted'}`}
                            style={{ minWidth: '88px', display: 'inline-flex', justifyContent: 'center' }}
                          >
                            {act.status}
                          </span>
                        </td>

                        <td style={{
                          textAlign: 'center',
                          whiteSpace: 'nowrap',
                          minWidth: '190px',
                          width: '190px',
                          verticalAlign: 'top',
                          paddingTop: '0.85rem',
                          paddingLeft: '0.5rem',
                          paddingRight: '0.5rem',
                          position: 'sticky',
                          right: 0,
                          background: isToday ? '#eff6ff' : '#ffffff',
                          zIndex: 2,
                          boxShadow: '-3px 0 6px rgba(0,0,0,0.06)'
                        }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', whiteSpace: 'nowrap' }}>
                            {act.status === 'Pending' && (
                              <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                onClick={() => handleQuickStatus(act.assignment_id, 'In Progress')}
                                style={{ fontSize: '0.74rem', padding: '0.28rem 0.55rem', background: '#2563eb', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '0.22rem', borderRadius: '6px' }}
                                title="Move to In Progress"
                              >
                                <i className="bi bi-play-fill" /> Start
                              </button>
                            )}
                            {act.status === 'In Progress' && (
                              <button
                                type="button"
                                className="btn btn-sm"
                                onClick={() => handleQuickStatus(act.assignment_id, 'Completed')}
                                style={{ fontSize: '0.74rem', padding: '0.28rem 0.55rem', background: '#16a34a', color: '#fff', border: 'none', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '0.22rem', borderRadius: '6px' }}
                                title="Mark as Completed"
                              >
                                <i className="bi bi-check2-circle" /> Complete
                              </button>
                            )}
                            {act.status === 'Completed' && (
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={() => handleQuickStatus(act.assignment_id, 'In Progress')}
                                style={{ fontSize: '0.74rem', padding: '0.28rem 0.52rem', color: '#475569', background: '#f8fafc', border: '1px solid #cbd5e1', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '0.22rem', borderRadius: '6px' }}
                                title="Reopen Activity"
                              >
                                <i className="bi bi-arrow-counterclockwise" /> Reopen
                              </button>
                            )}
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => setSelectedActivity(act)}
                              style={{ fontSize: '0.74rem', padding: '0.28rem 0.52rem', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '0.22rem', borderRadius: '6px' }}
                              title="Update Status & Remarks"
                            >
                              <i className="bi bi-pencil-square" /> Details
                            </button>
                          </div>
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
