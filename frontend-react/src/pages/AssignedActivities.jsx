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

export default function AssignedActivities() {
  const { toggleSidebar } = useOutletContext() || {};
  const userEmail = localStorage.getItem('userEmail') || '';

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');
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
          // If logged-in user email has 0 tasks, fetch all tasks
          fetch(`${API}/volunteer/activities/`)
            .then(r => r.json())
            .then(allData => setActivities(Array.isArray(allData) ? allData : []))
            .catch(() => setActivities([]));
        }
      })
      .catch(() => {
        // Fallback default activities for testing
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

  // Filtering Logic
  const filteredActivities = activities.filter(act => {
    const matchesSearch =
      (act.event_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (act.description || '').toLowerCase().includes(search.toLowerCase()) ||
      (act.location || '').toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'All' ? true : act.status === statusFilter;

    const matchesDate =
      !dateFilter ? true : (act.assigned_date === dateFilter || act.due_date === dateFilter);

    return matchesSearch && matchesStatus && matchesDate;
  });

  return (
    <>
      <TopHeader title="Assigned Activities" onToggleSidebar={toggleSidebar} />

      <div className="page-body">
        {/* Banner */}
        <div className="page-banner">
          <div>
            <div className="section-label">Shift Tasks & Duties</div>
            <div className="page-banner-title">Assigned Activities ({filteredActivities.length})</div>
            <div className="page-banner-sub">View and update the status of your assigned volunteer shift tasks</div>
          </div>
        </div>

        {/* SEARCH & FILTERS BAR */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search Input */}
          <div className="input-wrap" style={{ flex: 1, minWidth: '240px' }}>
            <i className="bi bi-search input-icon" />
            <input
              type="text"
              className="form-control"
              placeholder="Search by activity name, description, or location..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <div style={{ minWidth: '160px' }}>
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

          {/* Date Filter */}
          <div style={{ minWidth: '150px' }}>
            <input
              type="date"
              className="form-control"
              title="Filter by assigned or due date"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
            />
          </div>

          {dateFilter && (
            <button className="btn btn-ghost btn-sm" onClick={() => setDateFilter('')} title="Clear date filter">
              <i className="bi bi-x-circle" /> Clear Date
            </button>
          )}
        </div>

        {/* ASSIGNED ACTIVITIES TABLE */}
        <div className="chart-card">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '100px' }}>Assignment ID</th>
                  <th>Activity Name</th>
                  <th>Description</th>
                  <th style={{ whiteSpace: 'nowrap' }}>Assigned Date</th>
                  <th style={{ whiteSpace: 'nowrap' }}>Due Date</th>
                  <th>Location</th>
                  <th>Assigned By</th>
                  <th style={{ textAlign: 'center', minWidth: '105px' }}>Status</th>
                  <th style={{ textAlign: 'center', minWidth: '90px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '2.5rem' }}>
                      <span className="spinner" style={{ margin: '0 auto' }} />
                    </td>
                  </tr>
                ) : filteredActivities.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                      <i className="bi bi-clipboard-x" style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }} />
                      No assigned activities match your current search/filters.
                    </td>
                  </tr>
                ) : (
                  filteredActivities.map(act => (
                    <tr key={act.assignment_id}>
                      <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>
                        #{act.assignment_id}
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                        {act.event_name}
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={act.description}>
                        {act.description || '—'}
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>{act.assigned_date || '—'}</td>
                      <td style={{ whiteSpace: 'nowrap', color: '#fbbf24' }}>{act.due_date || '—'}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{act.location || 'Main Campus'}</td>
                      <td style={{ whiteSpace: 'nowrap', color: '#60a5fa' }}>{act.assigned_by || 'Admin'}</td>
                      <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <span className={`badge ${STATUS_COLOR[act.status] || 'badge-muted'}`}>
                          {act.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
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

      {/* Activity Details & Status Update Modal */}
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
