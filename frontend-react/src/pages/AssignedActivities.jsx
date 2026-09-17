import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import TopHeader from '../components/TopHeader';
import ActivityDetails from '../components/ActivityDetails';

const API = 'http://localhost:8000/api';

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

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedActivity, setSelectedActivity] = useState(null);

  const fetchActivities = () => {
    setLoading(true);
    const url = userEmail
      ? `${API}/volunteer/activities/?email=${encodeURIComponent(userEmail)}`
      : `${API}/volunteer/activities/`;

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
        // Fallback default mock data
        setActivities([
          {
            assignment_id: 1,
            event_name: 'Mathematics Learning Support',
            description: 'Conduct remedial math session for Class 5 students focusing on fractions.',
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
            event_name: 'Arts and Crafts Activity',
            description: 'Engage children in creative origami and watercolor greeting cards.',
            activity_type: 'Extracurricular',
            priority: 'Medium',
            assigned_date: '2026-09-18',
            scheduled_date: '2026-09-22',
            due_date: '2026-09-22',
            assigned_children: '8 Children',
            location: 'Activity Hall B',
            assigned_by: 'Care Coordinator',
            instructions: 'Distribute child-friendly craft supplies.',
            status: 'In Progress'
          },
          {
            assignment_id: 3,
            event_name: 'Sports Activity',
            description: 'Outdoor football training, drills, and team relay matches.',
            activity_type: 'Sports',
            priority: 'Medium',
            assigned_date: '2026-09-10',
            scheduled_date: '2026-09-25',
            due_date: '2026-09-25',
            assigned_children: '10 Children',
            location: 'Main Sports Ground',
            assigned_by: 'Sports Director',
            instructions: 'Maintain warm-up stretches and hydration protocols.',
            status: 'Completed',
            completion_date: '2026-09-25',
            remarks: 'All 10 children participated enthusiastically.'
          }
        ]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchActivities();
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

  // Client-side filtering
  const filteredActivities = activities.filter(act => {
    const term = search.toLowerCase();
    const matchesSearch =
      !term ||
      (act.event_name || '').toLowerCase().includes(term) ||
      (act.description || '').toLowerCase().includes(term) ||
      (act.activity_type || '').toLowerCase().includes(term) ||
      (act.assigned_children || '').toLowerCase().includes(term) ||
      (act.location || '').toLowerCase().includes(term);

    const matchesStatus =
      statusFilter === 'All' ? true : act.status === statusFilter;

    const matchesType =
      typeFilter === 'All' ? true : (act.activity_type || '').toLowerCase() === typeFilter.toLowerCase();

    const matchesDate =
      !dateFilter
        ? true
        : act.scheduled_date === dateFilter || act.assigned_date === dateFilter || act.due_date === dateFilter;

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
              placeholder="Search by activity, description, children group, or type..."
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

          {/* Date Filter */}
          <div style={{ minWidth: '150px' }}>
            <input
              type="date"
              className="form-control"
              title="Filter by scheduled date"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
            />
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
        <div className="chart-card">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ minWidth: '220px' }}>Activity</th>
                  <th style={{ minWidth: '120px' }}>Date</th>
                  <th style={{ textAlign: 'center', minWidth: '100px' }}>Children</th>
                  <th style={{ minWidth: '130px' }}>Type</th>
                  <th style={{ textAlign: 'center', minWidth: '95px' }}>Priority</th>
                  <th style={{ textAlign: 'center', minWidth: '115px' }}>Status</th>
                  <th style={{ textAlign: 'center', minWidth: '95px' }}>Action</th>
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
                    const childDisplay = act.assigned_children
                      ? act.assigned_children.replace(/[^0-9]/g, '') || act.assigned_children
                      : '5';

                    const pStyle = PRIORITY_BADGE[act.priority] || PRIORITY_BADGE['Medium'];

                    return (
                      <tr key={act.assignment_id}>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.92rem' }}>
                            {act.event_name}
                          </div>
                          <div style={{
                            fontSize: '0.78rem',
                            color: 'var(--text-secondary)',
                            maxWidth: '300px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }} title={act.description}>
                            {act.description || 'Assigned volunteer shift duty'}
                          </div>
                        </td>

                        <td style={{ whiteSpace: 'nowrap', color: '#60a5fa', fontWeight: 600 }}>
                          {formatDate(scheduledDate)}
                        </td>

                        <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <span
                            className="badge badge-accent"
                            style={{ fontSize: '0.8rem', padding: '0.2rem 0.6rem' }}
                            title={act.assigned_children || 'Assigned Children/Group'}
                          >
                            {childDisplay}
                          </span>
                        </td>

                        <td style={{ whiteSpace: 'nowrap' }}>
                          <span className="badge badge-muted" style={{ fontSize: '0.78rem' }}>
                            {act.activity_type || 'General'}
                          </span>
                        </td>

                        <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: pStyle.color,
                            background: pStyle.bg,
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px'
                          }}>
                            {act.priority || 'Medium'}
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
                              style={{ padding: '0.25rem 0.7rem', fontSize: '0.78rem', fontWeight: 600 }}
                            >
                              <i className="bi bi-pencil-square" /> Update
                            </button>
                          ) : (
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => setSelectedActivity(act)}
                              style={{ padding: '0.25rem 0.7rem', fontSize: '0.78rem' }}
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
          onUpdateSuccess={fetchActivities}
        />
      )}
    </>
  );
}
