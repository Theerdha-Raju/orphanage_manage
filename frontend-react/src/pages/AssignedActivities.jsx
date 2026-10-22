import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import TopHeader from '../components/TopHeader';
import ActivityDetails from '../components/ActivityDetails';
import { requestApi } from '../apiConfig';

const STATUS_COLOR = {
  'Pending': 'badge-amber',
  'In Progress': 'badge-accent',
  'Completed': 'badge-green',
};

const PRIORITY_BADGE = {
  'High': { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' },
  'Medium': { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
  'Low': { color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' },
};

export default function AssignedActivities() {
  const { toggleSidebar } = useOutletContext() || {};
  const userEmail = localStorage.getItem('userEmail') || '';
  const userId = localStorage.getItem('userId') || '';
  const volunteerId = localStorage.getItem('volunteerId') || '';
  const userName = localStorage.getItem('userName') || 'Volunteer';

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedActivity, setSelectedActivity] = useState(null);

  const fetchActivities = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const params = new URLSearchParams();
      if (volunteerId) params.append('volunteer_id', volunteerId);
      if (userEmail) params.append('email', userEmail);
      if (userId) params.append('user_id', userId);
      const url = `/api/volunteer/activities/?${params.toString()}`;

      const res = await requestApi(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setActivities(data);
        } else {
          setActivities([]);
        }
      } else {
        const err = await res.json().catch(() => ({}));
        setErrorMsg(err.error || 'Failed to load assigned activities from database.');
        setActivities([]);
      }
    } catch (err) {
      console.error('Error fetching activities:', err);
      setErrorMsg('Network error while connecting to server.');
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const handleQuickStatus = async (activityId, newStatus) => {
    try {
      const todayIso = getLocalDateStr(new Date());
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
        fetchActivities();
        return;
      }
      const data = await res.json().catch(() => ({}));
      alert(data.error || 'Failed to update activity status.');
    } catch (e) {
      console.error(e);
      alert('Network error while updating status.');
    }
  };

  const getChildrenList = (act) => {
    if (Array.isArray(act.assigned_children_list) && act.assigned_children_list.length > 0) {
      return act.assigned_children_list;
    }
    const raw = act.assigned_children || '';
    if (raw.includes(':')) {
      return raw.split(':')[1].split(',').map(s => s.trim()).filter(Boolean);
    }
    return [];
  };

  const getChildrenCount = (act) => {
    if (act.assigned_children_count) return act.assigned_children_count;
    const list = getChildrenList(act);
    if (list.length > 0) return list.length;
    const match = String(act.assigned_children || '').match(/(\d+)/);
    return match ? match[1] : '6';
  };

  // Format date helper: "2026-09-20" -> "20 Sep 2026"
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const parts = String(dateStr).split('-');
      if (parts.length === 3) {
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const getLocalDateStr = (d = new Date()) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const todayStr = getLocalDateStr();

  // Client-side filtering
  const filteredActivities = activities.filter(act => {
    const term = search.toLowerCase();
    const matchesSearch =
      !term ||
      (act.event_name || '').toLowerCase().includes(term) ||
      (act.description || '').toLowerCase().includes(term) ||
      (act.activity_type || '').toLowerCase().includes(term) ||
      (act.assigned_children || '').toLowerCase().includes(term) ||
      (act.volunteer_name || '').toLowerCase().includes(term) ||
      (act.location || '').toLowerCase().includes(term);

    const matchesStatus =
      statusFilter === 'All' ? true : act.status === statusFilter;

    const matchesType =
      typeFilter === 'All' ? true : (act.activity_type || '').toLowerCase() === typeFilter.toLowerCase();

    const scheduledDate = act.scheduled_date || act.due_date || act.assigned_date;
    const matchesDate =
      !dateFilter
        ? true
        : scheduledDate === dateFilter || act.assigned_date === dateFilter;

    return matchesSearch && matchesStatus && matchesType && matchesDate;
  });

  return (
    <>
      <TopHeader title="Assigned Activities" onToggleSidebar={toggleSidebar} />

      <div className="page-body">
        {/* Banner */}
        <div className="page-banner">
          <div>
            <div className="section-label">Volunteer Operations</div>
            <div className="page-banner-title">Assigned Activities ({filteredActivities.length})</div>
            <div className="page-banner-sub">
              Track, organize, and update status for your assigned child mentoring sessions and activities
            </div>
          </div>
        </div>

        {errorMsg && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem 1.25rem',
            color: '#ef4444',
            marginBottom: '1rem',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <i className="bi bi-exclamation-triangle-fill" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* SEARCH & FILTERS BAR */}
        <div style={{
          display: 'flex',
          gap: '0.75rem',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
          alignItems: 'center',
          background: 'var(--bg-surface-2)',
          padding: '0.85rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)'
        }}>
          {/* Search Input */}
          <div className="input-wrap" style={{ flex: 2, minWidth: '240px' }}>
            <i className="bi bi-search input-icon" />
            <input
              type="text"
              className="form-control"
              placeholder="Search by activity, description, children name, or type..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <div style={{ minWidth: '150px' }}>
            <select
              className="form-control"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Pending">🟡 Pending</option>
              <option value="In Progress">🔵 In Progress</option>
              <option value="Completed">🟢 Completed</option>
            </select>
          </div>

          {/* Activity Type Filter */}
          <div style={{ minWidth: '170px' }}>
            <select
              className="form-control"
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
            >
              <option value="All">All Activity Types</option>
              <option value="Education">Education</option>
              <option value="Extracurricular">Extracurricular</option>
              <option value="Sports">Sports</option>
              <option value="Arts and Crafts">Arts and Crafts</option>
              <option value="Computer Learning">Computer Learning</option>
            </select>
          </div>

          {/* Date Filter & Today Quick Button */}
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', minWidth: '260px' }}>
            <input
              type="date"
              className="form-control"
              title="Filter by scheduled date"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              style={{ flex: 1 }}
            />
            <button
              type="button"
              className={`btn btn-sm ${dateFilter === todayStr ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setDateFilter(prev => prev === todayStr ? '' : todayStr)}
              style={{ fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap' }}
              title="Filter today's activities"
            >
              <span style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: dateFilter === todayStr ? '#fff' : '#22c55e',
                display: 'inline-block',
                boxShadow: dateFilter === todayStr ? 'none' : '0 0 6px #22c55e'
              }} />
              Today ({activities.filter(a => (a.scheduled_date || a.due_date || a.assigned_date) === todayStr).length})
            </button>
          </div>

          {(search || statusFilter !== 'All' || typeFilter !== 'All' || dateFilter) && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setSearch('');
                setStatusFilter('All');
                setTypeFilter('All');
                setDateFilter('');
              }}
              style={{ fontSize: '0.78rem' }}
            >
              <i className="bi bi-x-circle" /> Reset Filters
            </button>
          )}
        </div>

        {/* ASSIGNED ACTIVITIES TABLE */}
        <div className="chart-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-wrap" style={{ border: 'none', borderRadius: 0, margin: 0, overflowX: 'auto', width: '100%' }}>
            <table className="table" style={{ margin: 0, width: '100%', minWidth: '1020px' }}>
              <thead>
                <tr>
                  <th style={{ minWidth: '280px' }}>Activity & Participating Children</th>
                  <th style={{ minWidth: '160px' }}>Date & Time</th>
                  <th style={{ minWidth: '130px' }}>Location</th>
                  <th style={{ minWidth: '130px' }}>Assigned Volunteer</th>
                  <th style={{ textAlign: 'center', minWidth: '95px', width: '95px' }}>Priority</th>
                  <th style={{ textAlign: 'center', minWidth: '125px', width: '125px' }}>Status</th>
                  <th style={{
                    textAlign: 'center',
                    minWidth: '220px',
                    width: '220px'
                  }}>
                    Status Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '3rem' }}>
                      <span className="spinner" style={{ margin: '0 auto' }} />
                    </td>
                  </tr>
                ) : filteredActivities.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      <i className="bi bi-clipboard-x" style={{ fontSize: '2.2rem', display: 'block', marginBottom: '0.5rem' }} />
                      No assigned activities match your current search and filters.
                    </td>
                  </tr>
                ) : (
                  filteredActivities.map(act => {
                    const scheduledDate = act.scheduled_date || act.due_date || act.assigned_date;
                    const isToday = (scheduledDate === todayStr || act.assigned_date === todayStr);
                    const pStyle = PRIORITY_BADGE[act.priority] || PRIORITY_BADGE['Medium'];
                    const childrenList = getChildrenList(act);
                    const childCount = getChildrenCount(act);

                    return (
                      <tr
                        key={act.assignment_id}
                        style={{
                          background: isToday ? 'rgba(59, 130, 246, 0.08)' : undefined,
                          borderLeft: isToday ? '4px solid #3b82f6' : undefined
                        }}
                      >
                        <td style={{ verticalAlign: 'top', paddingTop: '0.9rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.92rem' }}>
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
                          
                          <div style={{
                            fontSize: '0.78rem',
                            color: 'var(--text-secondary)',
                            maxWidth: '360px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            marginTop: '0.12rem',
                            marginBottom: '0.35rem'
                          }} title={act.description}>
                            {act.description || 'Assigned volunteer shift duty'}
                          </div>

                          {/* EXACT CHILDREN SECTION */}
                          <div style={{ marginTop: '0.45rem' }}>
                            <div style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              color: '#4f46e5',
                              marginBottom: '0.25rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.3rem'
                            }}>
                              <i className="bi bi-people-fill" style={{ fontSize: '0.8rem' }} />
                              <span>{childCount} Children Participating:</span>
                            </div>
                            
                            {childrenList.length > 0 ? (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', maxWidth: '420px' }}>
                                {childrenList.map((cName, cIdx) => (
                                  <span
                                    key={cIdx}
                                    style={{
                                      fontSize: '0.69rem',
                                      fontWeight: 600,
                                      background: '#eff6ff',
                                      color: '#1d4ed8',
                                      border: '1px solid #bfdbfe',
                                      padding: '0.08rem 0.4rem',
                                      borderRadius: '999px',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.2rem'
                                    }}
                                    title={`Assigned Child: ${cName}`}
                                  >
                                    <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#3b82f6', display: 'inline-block' }} />
                                    {cName}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                {act.assigned_children || `${childCount} Children`}
                              </span>
                            )}
                          </div>
                        </td>

                        <td style={{ whiteSpace: 'nowrap', verticalAlign: 'top', paddingTop: '0.9rem' }}>
                          <div style={{
                            display: 'inline-flex',
                            flexDirection: 'column',
                            gap: '0.4rem'
                          }}>
                            {/* Scheduled */}
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              background: isToday ? 'rgba(59,130,246,0.08)' : 'rgba(96,165,250,0.08)',
                              border: `1px solid ${isToday ? 'rgba(59,130,246,0.25)' : 'rgba(96,165,250,0.18)'}`,
                              borderRadius: '6px',
                              padding: '0.25rem 0.55rem'
                            }}>
                              <i className="bi bi-calendar-event-fill" style={{ color: isToday ? '#38bdf8' : '#60a5fa', fontSize: '0.82rem' }} />
                              <div>
                                <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.06em', lineHeight: 1 }}>Scheduled</div>
                                <div style={{ fontSize: '0.82rem', color: isToday ? '#38bdf8' : '#60a5fa', fontWeight: 700, lineHeight: 1.3 }}>
                                  {formatDate(scheduledDate)}
                                  {isToday && <span style={{ color: '#4ade80', fontSize: '0.68rem', marginLeft: '0.3rem', fontWeight: 800 }}>(Today)</span>}
                                </div>
                              </div>
                            </div>
                            {/* Assigned */}
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              background: 'rgba(100,116,139,0.06)',
                              border: '1px solid rgba(100,116,139,0.15)',
                              borderRadius: '6px',
                              padding: '0.25rem 0.55rem'
                            }}>
                              <i className="bi bi-calendar-plus" style={{ color: '#64748b', fontSize: '0.78rem' }} />
                              <div>
                                <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.06em', lineHeight: 1 }}>Assigned</div>
                                <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600, lineHeight: 1.3 }}>{formatDate(act.assigned_date)}</div>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td style={{ whiteSpace: 'nowrap', verticalAlign: 'top', paddingTop: '0.9rem' }}>
                          <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                            <i className="bi bi-geo-alt-fill" style={{ color: '#ef4444', fontSize: '0.85rem' }} />
                            {act.location || 'Orphanage Campus'}
                          </span>
                        </td>

                        <td style={{ whiteSpace: 'nowrap', verticalAlign: 'top', paddingTop: '0.9rem' }}>
                          <span style={{ fontSize: '0.82rem', color: '#a78bfa', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                            <i className="bi bi-person-check-fill" style={{ fontSize: '0.85rem' }} />
                            {act.volunteer_name || userName}
                          </span>
                        </td>

                        <td style={{ textAlign: 'center', whiteSpace: 'nowrap', verticalAlign: 'top', paddingTop: '0.9rem', minWidth: '95px', width: '95px' }}>
                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: pStyle.color,
                            background: pStyle.bg,
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px'
                          }}>
                            {act.priority || 'Medium'}
                          </span>
                        </td>

                        <td style={{ textAlign: 'center', whiteSpace: 'nowrap', verticalAlign: 'top', paddingTop: '0.9rem', minWidth: '125px', width: '125px' }}>
                          <span
                            className={`badge ${STATUS_COLOR[act.status] || 'badge-muted'}`}
                            style={{ minWidth: '95px', display: 'inline-flex', justifyContent: 'center' }}
                          >
                            {act.status}
                          </span>
                        </td>

                        <td style={{
                          textAlign: 'center',
                          whiteSpace: 'nowrap',
                          verticalAlign: 'top',
                          paddingTop: '0.9rem',
                          minWidth: '220px',
                          width: '220px'
                        }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem', whiteSpace: 'nowrap' }}>
                            {act.status === 'Pending' && (
                              <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                onClick={() => handleQuickStatus(act.assignment_id, 'In Progress')}
                                style={{ fontSize: '0.76rem', padding: '0.3rem 0.65rem', background: '#2563eb', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                                title="Start Activity"
                              >
                                <i className="bi bi-play-fill" /> Start
                              </button>
                            )}
                            {act.status === 'In Progress' && (
                              <button
                                type="button"
                                className="btn btn-sm"
                                onClick={() => handleQuickStatus(act.assignment_id, 'Completed')}
                                style={{ fontSize: '0.76rem', padding: '0.3rem 0.65rem', background: '#16a34a', color: '#fff', border: 'none', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
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
                                style={{ fontSize: '0.74rem', padding: '0.28rem 0.55rem', color: 'var(--text-muted)', border: '1px solid var(--border)', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                                title="Reopen Activity"
                              >
                                <i className="bi bi-arrow-counterclockwise" /> Reopen
                              </button>
                            )}
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => setSelectedActivity(act)}
                              style={{ fontSize: '0.76rem', padding: '0.3rem 0.65rem', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                              title="View & Edit Details"
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
          onUpdateSuccess={fetchActivities}
        />
      )}
    </>
  );
}
