import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import TopHeader from '../components/TopHeader';

const API = '/api';

const AVATAR_COLORS = [
  '#4f46e5', '#7c3aed', '#2563eb', '#059669', 
  '#d97706', '#db2777', '#0891b2', '#65a30d'
];

function calcAge(dob) {
  if (!dob) return { label: '—', years: 0 };
  const d = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return { label: `${age} yrs`, years: age };
}

export default function AttendancePage() {
  const { toggleSidebar } = useOutletContext();
  const currentUserName = localStorage.getItem('userName') || 'Caregiver';
  const currentUserRole = localStorage.getItem('userRole') || 'caregiver';

  const todayStr = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [children, setChildren]         = useState([]);
  const [dateRecords, setDateRecords]   = useState({}); // { [child_id]: status }
  const [allAttendance, setAllAttendance] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [viewMode, setViewMode]         = useState('list'); // 'list' | 'grid'
  const [notes, setNotes]               = useState({}); // { [child_id]: string }
  const [msg, setMsg]                   = useState('');
  const [errorMsg, setErrorMsg]         = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [selectedChildForHistory, setSelectedChildForHistory] = useState(null);

  // Fetch initial data and records for selected date
  const loadData = async (dateToFetch) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [cRes, attDateRes, attAllRes] = await Promise.all([
        fetch(`${API}/children/`).then(r => r.json()).catch(() => []),
        fetch(`${API}/attendance/?date=${dateToFetch}`).then(r => r.json()).catch(() => []),
        fetch(`${API}/attendance/`).then(r => r.json()).catch(() => []),
      ]);

      const validChildren = Array.isArray(cRes) ? cRes : [];
      setChildren(validChildren);
      setAllAttendance(Array.isArray(attAllRes) ? attAllRes : []);

      // Build dateRecords map
      const map = {};
      if (Array.isArray(attDateRes)) {
        attDateRes.forEach(r => {
          map[r.child] = r.attendance_status;
        });
      }
      setDateRecords(map);
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error('Error loading attendance data:', err);
      setErrorMsg('Failed to load child attendance data. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedDate);
  }, [selectedDate]);

  // Compute 30-day stats for each child
  const childHistoryStats = useMemo(() => {
    const stats = {};
    if (!Array.isArray(allAttendance)) return stats;

    allAttendance.forEach(a => {
      if (!stats[a.child]) {
        stats[a.child] = { total: 0, present: 0, absent: 0, leave: 0, records: [] };
      }
      stats[a.child].total += 1;
      stats[a.child].records.push(a);
      if (a.attendance_status === 'Present') stats[a.child].present += 1;
      else if (a.attendance_status === 'Absent') stats[a.child].absent += 1;
      else if (a.attendance_status === 'Leave') stats[a.child].leave += 1;
    });

    return stats;
  }, [allAttendance]);

  // Daily statistics for selected date
  const dailyStats = useMemo(() => {
    const total = children.length;
    let present = 0;
    let absent = 0;
    let leave = 0;
    let unmarked = 0;

    children.forEach(c => {
      const st = dateRecords[c.child_id];
      if (st === 'Present') present++;
      else if (st === 'Absent') absent++;
      else if (st === 'Leave') leave++;
      else unmarked++;
    });

    const marked = present + absent + leave;
    const rate = marked > 0 ? Math.round((present / marked) * 100) : 0;
    const completionPct = total > 0 ? Math.round((marked / total) * 100) : 0;

    return { total, present, absent, leave, unmarked, rate, marked, completionPct };
  }, [children, dateRecords]);

  // Quick Date Navigation
  const changeDateByDays = (days) => {
    const cur = new Date(selectedDate);
    cur.setDate(cur.getDate() + days);
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, '0');
    const d = String(cur.getDate()).padStart(2, '0');
    setSelectedDate(`${y}-${m}-${d}`);
  };

  // Change individual child status
  const handleStatusChange = (childId, newStatus) => {
    setDateRecords(prev => ({
      ...prev,
      [childId]: newStatus
    }));
    setHasUnsavedChanges(true);
  };

  // Quick mark all children as Present
  const handleMarkAllPresent = () => {
    const newMap = { ...dateRecords };
    children.forEach(c => {
      newMap[c.child_id] = 'Present';
    });
    setDateRecords(newMap);
    setHasUnsavedChanges(true);
    setMsg('Marked all children as Present. Remember to click "Save Attendance" to sync.');
    setTimeout(() => setMsg(''), 4000);
  };

  // Quick preset notes
  const addQuickNote = (childId, noteText) => {
    setNotes(prev => ({
      ...prev,
      [childId]: prev[childId] ? `${prev[childId]}, ${noteText}` : noteText
    }));
  };

  // Save attendance batch
  const handleSaveAttendance = async () => {
    setSaving(true);
    setMsg('');
    setErrorMsg('');

    const records = Object.keys(dateRecords).map(cid => ({
      child_id: parseInt(cid),
      status: dateRecords[cid]
    }));

    if (records.length === 0) {
      setMsg('No attendance records to save.');
      setSaving(false);
      return;
    }

    try {
      const res = await fetch(`${API}/attendance/mark/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          records: records
        })
      });

      if (res.ok) {
        setMsg(`✓ Attendance for ${records.length} children successfully saved for ${selectedDate}!`);
        setHasUnsavedChanges(false);
        // Refresh 
        loadData(selectedDate);
        setTimeout(() => setMsg(''), 4500);
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.detail || 'Failed to save attendance records. Please retry.');
      }
    } catch (err) {
      console.error('Save attendance error:', err);
      setErrorMsg('Network error while saving attendance.');
    } finally {
      setSaving(false);
    }
  };

  // Filtered children list
  const filteredChildren = useMemo(() => {
    return children.filter(c => {
      const q = search.trim().toLowerCase();
      const matchSearch =
        c.full_name?.toLowerCase().includes(q) ||
        String(c.child_id).includes(q) ||
        c.guardian_name?.toLowerCase().includes(q);

      if (!matchSearch) return false;

      const st = dateRecords[c.child_id] || 'Unmarked';
      if (statusFilter === 'All') return true;
      if (statusFilter === 'Unmarked') return !dateRecords[c.child_id];
      return st === statusFilter;
    });
  }, [children, search, statusFilter, dateRecords]);

  // Formatted date label
  const formattedDateTitle = useMemo(() => {
    try {
      const parts = selectedDate.split('-');
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      return d.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  return (
    <>
      <TopHeader title="Child Care & Attendance" onToggleSidebar={toggleSidebar} />

      <div className="page-body">
        {/* TOP BANNER */}
        <div className="page-banner" style={{ borderLeft: '4px solid #2563eb' }}>
          <div>
            <div className="section-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <i className="bi bi-person-lines-fill" style={{ color: '#2563eb' }} />
              CHILD CARE OPERATIONS • DAILY ROLL-CALL
            </div>
            <div className="page-banner-title" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              Child Care & Daily Attendance
              <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '1rem', background: '#dbeafe', color: '#1d4ed8' }}>
                {formattedDateTitle}
              </span>
            </div>
            <div className="page-banner-sub">
              Conduct morning roll-call, log Present/Absent/Leave statuses, monitor attendance trends, and record child care notes.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <Link to="/child-profile" className="btn btn-secondary">
              <i className="bi bi-people" /> View Child Profiles
            </Link>
            <button
              className="btn btn-secondary"
              onClick={handleMarkAllPresent}
              title="Quickly set all children to Present"
            >
              <i className="bi bi-check2-all" /> Mark All Present
            </button>
            <button
              className={`btn btn-primary ${hasUnsavedChanges ? 'pulse' : ''}`}
              onClick={handleSaveAttendance}
              disabled={saving}
              style={{
                boxShadow: hasUnsavedChanges ? '0 0 12px rgba(37, 99, 235, 0.45)' : 'none',
                background: hasUnsavedChanges ? '#1d4ed8' : undefined
              }}
            >
              {saving ? (
                <><span className="spinner-border spinner-border-sm me-1" /> Saving...</>
              ) : (
                <><i className="bi bi-cloud-arrow-up-fill" /> Save Attendance {hasUnsavedChanges && '•'}</>
              )}
            </button>
          </div>
        </div>

        {/* ALERTS */}
        {msg && (
          <div className="alert alert-success" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span><i className="bi bi-check-circle-fill" style={{ marginRight: '0.5rem' }} /> {msg}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setMsg('')}><i className="bi bi-x" /></button>
          </div>
        )}
        {errorMsg && (
          <div className="alert alert-danger" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span><i className="bi bi-exclamation-triangle-fill" style={{ marginRight: '0.5rem' }} /> {errorMsg}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setErrorMsg('')}><i className="bi bi-x" /></button>
          </div>
        )}

        {/* DATE PICKER & QUICK NAVIGATION BAR */}
        <div style={{
          background: '#ffffff',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '0.9rem 1.25rem',
          marginBottom: '1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: 'var(--shadow-sm)'
        }}>
          {/* Date Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              <i className="bi bi-calendar3" style={{ marginRight: '0.35rem', color: '#2563eb' }} />
              Selected Date:
            </span>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => changeDateByDays(-1)}
              title="Previous Day"
              style={{ padding: '0.3rem 0.6rem' }}
            >
              <i className="bi bi-chevron-left" /> Prev Day
            </button>
            <input
              type="date"
              className="form-control"
              style={{ width: 'auto', padding: '0.35rem 0.65rem', fontWeight: 600, fontSize: '0.85rem' }}
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
            />
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => changeDateByDays(1)}
              title="Next Day"
              style={{ padding: '0.3rem 0.6rem' }}
            >
              Next Day <i className="bi bi-chevron-right" />
            </button>
            {selectedDate !== todayStr && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setSelectedDate(todayStr)}
                style={{ color: '#2563eb', fontWeight: 700 }}
              >
                Jump to Today
              </button>
            )}
          </div>

          {/* Roll-call completion status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: dailyStats.unmarked === 0 ? '#15803d' : '#d97706' }}>
                {dailyStats.unmarked === 0 ? '✓ Roll-call Complete' : `${dailyStats.unmarked} Children Pending`}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                {dailyStats.marked} of {dailyStats.total} marked ({dailyStats.completionPct}%)
              </div>
            </div>
            <div style={{ width: 100, height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                width: `${dailyStats.completionPct}%`,
                height: '100%',
                background: dailyStats.completionPct === 100 ? '#22c55e' : '#3b82f6',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        </div>

        {/* STATS GRID */}
        <div className="stats-grid" style={{ marginBottom: '1.25rem' }}>
          <div className="stat-card" style={{ borderLeft: '4px solid #3b82f6' }}>
            <div className="stat-card-header">
              <span className="stat-card-title">Total In-Care</span>
              <div className="stat-card-icon" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#2563eb' }}>
                <i className="bi bi-people-fill" />
              </div>
            </div>
            <div className="stat-card-value">{dailyStats.total}</div>
            <div className="stat-card-sub" style={{ color: 'var(--text-muted)' }}>
              Orphanage children enrolled
            </div>
          </div>

          <div className="stat-card" style={{ borderLeft: '4px solid #22c55e' }}>
            <div className="stat-card-header">
              <span className="stat-card-title">Present Today</span>
              <div className="stat-card-icon" style={{ background: 'rgba(34, 197, 94, 0.12)', color: '#16a34a' }}>
                <i className="bi bi-check-circle-fill" />
              </div>
            </div>
            <div className="stat-card-value" style={{ color: '#15803d' }}>
              {dailyStats.present}
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginLeft: '0.45rem' }}>
                ({dailyStats.rate}%)
              </span>
            </div>
            <div className="stat-card-sub" style={{ color: '#16a34a' }}>
              In attendance & routine care
            </div>
          </div>

          <div className="stat-card" style={{ borderLeft: '4px solid #ef4444' }}>
            <div className="stat-card-header">
              <span className="stat-card-title">Absent</span>
              <div className="stat-card-icon" style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#dc2626' }}>
                <i className="bi bi-x-circle-fill" />
              </div>
            </div>
            <div className="stat-card-value" style={{ color: dailyStats.absent > 0 ? '#b91c1c' : 'inherit' }}>
              {dailyStats.absent}
            </div>
            <div className="stat-card-sub" style={{ color: dailyStats.absent > 0 ? '#dc2626' : 'var(--text-muted)' }}>
              {dailyStats.absent > 0 ? 'Requires caregiver check-in' : 'Zero unexcused absences'}
            </div>
          </div>

          <div className="stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
            <div className="stat-card-header">
              <span className="stat-card-title">On Approved Leave</span>
              <div className="stat-card-icon" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#d97706' }}>
                <i className="bi bi-calendar-event-fill" />
              </div>
            </div>
            <div className="stat-card-value" style={{ color: '#b45309' }}>
              {dailyStats.leave}
            </div>
            <div className="stat-card-sub" style={{ color: 'var(--text-muted)' }}>
              Family visits & hospital checks
            </div>
          </div>
        </div>

        {/* CAREGIVER SHIFT NOTE & ROUTINE CHECKLIST */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(238, 242, 255, 0.7), rgba(240, 253, 244, 0.7))',
          border: '1px solid #c7d2fe',
          borderRadius: 'var(--radius-lg)',
          padding: '1rem 1.25rem',
          marginBottom: '1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: '#4f46e5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: '1.2rem',
              boxShadow: '0 4px 10px rgba(79, 70, 229, 0.25)'
            }}>
              <i className="bi bi-clipboard2-check-fill" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#1e1b4b' }}>
                Caregiver Daily Shift Routine • Assigned Caregiver: {currentUserName}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#4338ca' }}>
                Conduct physical roll-call at dormitory assembly. Check vitals and note any child exhibiting fever, lethargy, or requiring medications.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.35rem 0.7rem', borderRadius: '0.5rem', background: '#ffffff', border: '1px solid #cbd5e1', color: '#334155', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <i className="bi bi-clock-fill" style={{ color: '#2563eb' }} /> Shift: Morning & Midday
            </span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.35rem 0.7rem', borderRadius: '0.5rem', background: '#ffffff', border: '1px solid #cbd5e1', color: '#334155', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <i className="bi bi-shield-check" style={{ color: '#16a34a' }} /> Verified by {currentUserName}
            </span>
          </div>
        </div>

        {/* SEARCH, STATUS FILTER & CONTROLS */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '1rem',
          flexWrap: 'wrap'
        }}>
          {/* Search */}
          <div className="input-wrap" style={{ flex: 1, minWidth: 260, maxWidth: 400 }}>
            <i className="bi bi-search input-icon" />
            <input
              type="text"
              className="form-control"
              placeholder="Search child by name, ID, or guardian..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Status Filters */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {[
              { key: 'All', label: `All (${children.length})`, icon: 'bi-grid' },
              { key: 'Present', label: `Present (${dailyStats.present})`, icon: 'bi-check-circle', color: '#15803d' },
              { key: 'Absent', label: `Absent (${dailyStats.absent})`, icon: 'bi-x-circle', color: '#b91c1c' },
              { key: 'Leave', label: `Leave (${dailyStats.leave})`, icon: 'bi-clock-history', color: '#b45309' },
              { key: 'Unmarked', label: `Unmarked (${dailyStats.unmarked})`, icon: 'bi-question-circle', color: '#64748b' },
            ].map(f => {
              const active = statusFilter === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => setStatusFilter(f.key)}
                  className="btn btn-sm"
                  style={{
                    padding: '0.35rem 0.75rem',
                    fontSize: '0.78rem',
                    fontWeight: active ? 700 : 500,
                    borderRadius: '2rem',
                    background: active ? '#2563eb' : '#ffffff',
                    color: active ? '#ffffff' : f.color || 'var(--text-secondary)',
                    border: `1px solid ${active ? '#2563eb' : '#cbd5e1'}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <i className={`bi ${f.icon}`} /> {f.label}
                </button>
              );
            })}
          </div>

          {/* View mode toggle */}
          <div style={{ display: 'flex', border: '1px solid #cbd5e1', borderRadius: '0.5rem', overflow: 'hidden' }}>
            <button
              onClick={() => setViewMode('list')}
              style={{
                padding: '0.35rem 0.65rem',
                border: 'none',
                background: viewMode === 'list' ? '#2563eb' : '#ffffff',
                color: viewMode === 'list' ? '#ffffff' : '#64748b',
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
              title="Table Roll-Call View"
            >
              <i className="bi bi-list-ul" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                padding: '0.35rem 0.65rem',
                border: 'none',
                background: viewMode === 'grid' ? '#2563eb' : '#ffffff',
                color: viewMode === 'grid' ? '#ffffff' : '#64748b',
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
              title="Card Grid View"
            >
              <i className="bi bi-grid-fill" />
            </button>
          </div>
        </div>

        {/* LOADING INDICATOR */}
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', background: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
            <div className="spinner-border text-primary" role="status" style={{ width: '2.5rem', height: '2.5rem' }}>
              <span className="visually-hidden">Loading...</span>
            </div>
            <div style={{ marginTop: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Loading attendance and child records...
            </div>
          </div>
        ) : filteredChildren.length === 0 ? (
          <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center', background: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
            <i className="bi bi-person-x" style={{ fontSize: '2.5rem', color: '#94a3b8' }} />
            <h5 style={{ marginTop: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>No Children Found</h5>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: 400, margin: '0 auto' }}>
              No children match the current search query or status filter. Try clearing filters or changing search keywords.
            </p>
            <button
              className="btn btn-secondary btn-sm"
              style={{ marginTop: '1rem' }}
              onClick={() => { setSearch(''); setStatusFilter('All'); }}
            >
              Clear Filters
            </button>
          </div>
        ) : viewMode === 'list' ? (
          /* ── TABLE VIEW ── */
          <div className="table-wrap" style={{ borderRadius: '0.85rem', border: '1px solid #e2e8f0', background: '#ffffff', overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', margin: 0, borderCollapse: 'separate', borderSpacing: 0, fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '0.75rem 0.6rem', color: '#64748b', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.04em', width: 44, textAlign: 'center' }}>#</th>
                  <th style={{ padding: '0.75rem 0.75rem', color: '#64748b', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.04em' }}>CHILD</th>
                  <th style={{ padding: '0.75rem 0.75rem', color: '#64748b', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.04em' }}>AGE & CATEGORY</th>
                  <th style={{ padding: '0.75rem 0.75rem', color: '#64748b', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.04em' }}>ATTENDANCE RATE</th>
                  <th style={{ padding: '0.75rem 0.75rem', color: '#64748b', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.04em', textAlign: 'center', minWidth: 260 }}>
                    ROLL-CALL FOR {selectedDate}
                  </th>
                  <th style={{ padding: '0.75rem 0.75rem', color: '#64748b', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.04em' }}>CARE NOTES & OBSERVATION</th>
                  <th style={{ padding: '0.75rem 0.75rem', color: '#64748b', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.04em', textAlign: 'center', width: 90 }}>HISTORY</th>
                </tr>
              </thead>
              <tbody>
                {filteredChildren.map((c, idx) => {
                  const currentStatus = dateRecords[c.child_id] || '';
                  const ageObj = calcAge(c.date_of_birth);
                  const hStats = childHistoryStats[c.child_id] || { total: 0, present: 0, absent: 0, leave: 0 };
                  const attRate = hStats.total > 0 ? Math.round((hStats.present / hStats.total) * 100) : null;
                  const bg = AVATAR_COLORS[idx % AVATAR_COLORS.length];

                  return (
                    <tr
                      key={c.child_id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        background: currentStatus === 'Absent' ? 'rgba(254, 242, 242, 0.5)' :
                                    currentStatus === 'Leave' ? 'rgba(254, 243, 199, 0.4)' :
                                    currentStatus === 'Present' ? '#ffffff' : 'rgba(248, 250, 252, 0.7)',
                        transition: 'background 0.2s ease'
                      }}
                    >
                      {/* Index */}
                      <td style={{ padding: '0.75rem 0.6rem', textAlign: 'center', color: '#94a3b8', fontWeight: 700 }}>
                        {idx + 1}
                      </td>

                      {/* Child Profile Info */}
                      <td style={{ padding: '0.75rem 0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: 38,
                            height: 38,
                            borderRadius: '50%',
                            background: bg,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            color: '#ffffff',
                            fontSize: '0.85rem',
                            flexShrink: 0
                          }}>
                            {c.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'C'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.88rem' }}>
                              {c.full_name}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              ID #{c.child_id} • {c.gender || 'Child'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Age & Category */}
                      <td style={{ padding: '0.75rem 0.75rem' }}>
                        <div style={{ fontWeight: 600, color: '#334155' }}>
                          {ageObj.label}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {c.guardian_name ? `Guardian: ${c.guardian_name}` : 'No Parents (Orphan)'}
                        </div>
                      </td>

                      {/* Historical Attendance Rate */}
                      <td style={{ padding: '0.75rem 0.75rem' }}>
                        {attRate !== null ? (
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.2rem' }}>
                              <span style={{
                                fontWeight: 800,
                                fontSize: '0.85rem',
                                color: attRate >= 80 ? '#15803d' : attRate >= 65 ? '#d97706' : '#b91c1c'
                              }}>
                                {attRate}%
                              </span>
                              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                                ({hStats.present}/{hStats.total} days)
                              </span>
                            </div>
                            <div style={{ width: 80, height: 5, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{
                                width: `${attRate}%`,
                                height: '100%',
                                background: attRate >= 80 ? '#22c55e' : attRate >= 65 ? '#f59e0b' : '#ef4444'
                              }} />
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>New Enrollee</span>
                        )}
                      </td>

                      {/* Interactive Roll-call Buttons */}
                      <td style={{ padding: '0.75rem 0.75rem', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '0.35rem', background: '#f1f5f9', padding: '0.25rem', borderRadius: '0.65rem' }}>
                          {/* Present Button */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(c.child_id, 'Present')}
                            style={{
                              border: 'none',
                              padding: '0.35rem 0.85rem',
                              borderRadius: '0.5rem',
                              fontWeight: 700,
                              fontSize: '0.78rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              transition: 'all 0.15s ease',
                              background: currentStatus === 'Present' ? '#16a34a' : 'transparent',
                              color: currentStatus === 'Present' ? '#ffffff' : '#475569',
                              boxShadow: currentStatus === 'Present' ? '0 2px 6px rgba(22, 163, 74, 0.35)' : 'none'
                            }}
                          >
                            <i className="bi bi-check-lg" /> Present
                          </button>

                          {/* Absent Button */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(c.child_id, 'Absent')}
                            style={{
                              border: 'none',
                              padding: '0.35rem 0.85rem',
                              borderRadius: '0.5rem',
                              fontWeight: 700,
                              fontSize: '0.78rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              transition: 'all 0.15s ease',
                              background: currentStatus === 'Absent' ? '#dc2626' : 'transparent',
                              color: currentStatus === 'Absent' ? '#ffffff' : '#475569',
                              boxShadow: currentStatus === 'Absent' ? '0 2px 6px rgba(220, 38, 38, 0.35)' : 'none'
                            }}
                          >
                            <i className="bi bi-x-lg" /> Absent
                          </button>

                          {/* Leave Button */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(c.child_id, 'Leave')}
                            style={{
                              border: 'none',
                              padding: '0.35rem 0.85rem',
                              borderRadius: '0.5rem',
                              fontWeight: 700,
                              fontSize: '0.78rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              transition: 'all 0.15s ease',
                              background: currentStatus === 'Leave' ? '#d97706' : 'transparent',
                              color: currentStatus === 'Leave' ? '#ffffff' : '#475569',
                              boxShadow: currentStatus === 'Leave' ? '0 2px 6px rgba(217, 119, 6, 0.35)' : 'none'
                            }}
                          >
                            <i className="bi bi-clock-history" /> Leave
                          </button>
                        </div>
                      </td>

                      {/* Caregiver Daily Notes & Quick Observation Tags */}
                      <td style={{ padding: '0.75rem 0.75rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                          <input
                            type="text"
                            placeholder="Add health or care note..."
                            className="form-control"
                            style={{ fontSize: '0.76rem', padding: '0.3rem 0.55rem', height: 'auto' }}
                            value={notes[c.child_id] || ''}
                            onChange={e => setNotes({ ...notes, [c.child_id]: e.target.value })}
                          />
                          <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                            {['Active & healthy', 'Fever check', 'Clinic visit', 'Excused'].map(tag => (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => addQuickNote(c.child_id, tag)}
                                style={{
                                  background: '#f1f5f9',
                                  border: '1px solid #e2e8f0',
                                  borderRadius: '0.35rem',
                                  padding: '0.1rem 0.35rem',
                                  fontSize: '0.65rem',
                                  color: '#64748b',
                                  cursor: 'pointer'
                                }}
                              >
                                + {tag}
                              </button>
                            ))}
                          </div>
                        </div>
                      </td>

                      {/* History Inspection */}
                      <td style={{ padding: '0.75rem 0.75rem', textAlign: 'center' }}>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ color: '#2563eb', padding: '0.3rem 0.5rem', fontSize: '0.75rem', fontWeight: 700 }}
                          onClick={() => setSelectedChildForHistory({ child: c, stats: hStats })}
                          title="View Attendance Calendar"
                        >
                          <i className="bi bi-calendar3-range" /> Log
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* ── GRID CARD VIEW ── */
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
            gap: '1rem'
          }}>
            {filteredChildren.map((c, idx) => {
              const currentStatus = dateRecords[c.child_id] || '';
              const ageObj = calcAge(c.date_of_birth);
              const hStats = childHistoryStats[c.child_id] || { total: 0, present: 0, absent: 0, leave: 0 };
              const attRate = hStats.total > 0 ? Math.round((hStats.present / hStats.total) * 100) : null;
              const bg = AVATAR_COLORS[idx % AVATAR_COLORS.length];

              return (
                <div
                  key={c.child_id}
                  style={{
                    background: '#ffffff',
                    border: `1.5px solid ${
                      currentStatus === 'Present' ? '#86efac' :
                      currentStatus === 'Absent' ? '#fca5a5' :
                      currentStatus === 'Leave' ? '#fde047' : '#e2e8f0'
                    }`,
                    borderRadius: 'var(--radius-lg)',
                    padding: '1.15rem',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative'
                  }}
                >
                  {/* Top info */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div style={{
                          width: 42,
                          height: 42,
                          borderRadius: '50%',
                          background: bg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          color: '#ffffff',
                          fontSize: '0.95rem'
                        }}>
                          {c.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'C'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                            {c.full_name}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            ID #{c.child_id} • {ageObj.label} • {c.gender}
                          </div>
                        </div>
                      </div>

                      {/* Status indicator badge */}
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '0.25rem 0.6rem',
                        borderRadius: '1rem',
                        background: currentStatus === 'Present' ? '#dcfce7' :
                                    currentStatus === 'Absent' ? '#fee2e2' :
                                    currentStatus === 'Leave' ? '#fef3c7' : '#f1f5f9',
                        color: currentStatus === 'Present' ? '#15803d' :
                               currentStatus === 'Absent' ? '#b91c1c' :
                               currentStatus === 'Leave' ? '#b45309' : '#64748b'
                      }}>
                        {currentStatus || 'Unmarked'}
                      </span>
                    </div>

                    {/* Historical rate */}
                    <div style={{
                      background: '#f8fafc',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '0.5rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.85rem'
                    }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        30-Day Attendance:
                      </span>
                      <span style={{
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        color: attRate !== null ? (attRate >= 80 ? '#15803d' : attRate >= 65 ? '#d97706' : '#b91c1c') : '#64748b'
                      }}>
                        {attRate !== null ? `${attRate}% (${hStats.present}/${hStats.total})` : 'New'}
                      </span>
                    </div>
                  </div>

                  {/* Bottom roll-call actions */}
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.35rem', marginBottom: '0.65rem' }}>
                      <button
                        type="button"
                        onClick={() => handleStatusChange(c.child_id, 'Present')}
                        style={{
                          border: 'none',
                          padding: '0.45rem 0.2rem',
                          borderRadius: '0.5rem',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          background: currentStatus === 'Present' ? '#16a34a' : '#f1f5f9',
                          color: currentStatus === 'Present' ? '#ffffff' : '#334155',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.25rem'
                        }}
                      >
                        <i className="bi bi-check-lg" /> Present
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStatusChange(c.child_id, 'Absent')}
                        style={{
                          border: 'none',
                          padding: '0.45rem 0.2rem',
                          borderRadius: '0.5rem',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          background: currentStatus === 'Absent' ? '#dc2626' : '#f1f5f9',
                          color: currentStatus === 'Absent' ? '#ffffff' : '#334155',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.25rem'
                        }}
                      >
                        <i className="bi bi-x-lg" /> Absent
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStatusChange(c.child_id, 'Leave')}
                        style={{
                          border: 'none',
                          padding: '0.45rem 0.2rem',
                          borderRadius: '0.5rem',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          background: currentStatus === 'Leave' ? '#d97706' : '#f1f5f9',
                          color: currentStatus === 'Leave' ? '#ffffff' : '#334155',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.25rem'
                        }}
                      >
                        <i className="bi bi-clock-history" /> Leave
                      </button>
                    </div>

                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ width: '100%', fontSize: '0.72rem', color: '#2563eb', padding: '0.25rem' }}
                      onClick={() => setSelectedChildForHistory({ child: c, stats: hStats })}
                    >
                      <i className="bi bi-calendar3-range" /> View Full Attendance Log
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* BOTTOM SAVE FOOTER BAR (When changes exist) */}
        {hasUnsavedChanges && (
          <div style={{
            position: 'sticky',
            bottom: '1rem',
            marginTop: '1.5rem',
            background: 'rgba(30, 41, 59, 0.95)',
            backdropFilter: 'blur(8px)',
            color: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            padding: '0.85rem 1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
            zIndex: 100
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <i className="bi bi-exclamation-circle-fill" style={{ color: '#fbbf24', fontSize: '1.15rem' }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>
                  You have unsaved roll-call modifications for {selectedDate}.
                </div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                  Click Save Attendance to synchronize all records with the database.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.65rem' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => loadData(selectedDate)}
                disabled={saving}
                style={{ background: '#334155', color: '#ffffff', border: 'none' }}
              >
                Reset
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleSaveAttendance}
                disabled={saving}
                style={{ fontWeight: 800 }}
              >
                {saving ? 'Saving...' : 'Save Attendance Now'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── CHILD ATTENDANCE HISTORY MODAL ── */}
      {selectedChildForHistory && (
        <div
          className="modal-backdrop"
          onClick={() => setSelectedChildForHistory(null)}
          style={{ zIndex: 1100 }}
        >
          <div
            className="modal-box"
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: 580,
              width: '92vw',
              padding: '1.5rem',
              borderRadius: '1rem',
              background: '#ffffff'
            }}
          >
            <div className="modal-header" style={{ marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>
              <div>
                <h5 style={{ margin: 0, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <i className="bi bi-calendar2-check-fill" style={{ color: '#2563eb' }} />
                  {selectedChildForHistory.child.full_name}'s Attendance Log
                </h5>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Child ID #{selectedChildForHistory.child.child_id} • 30-Day Care Routine Log
                </div>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setSelectedChildForHistory(null)}
              >
                <i className="bi bi-x-lg" />
              </button>
            </div>

            {/* Quick stats in modal */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
              <div style={{ background: '#f8fafc', padding: '0.5rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>Total Days</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b' }}>
                  {selectedChildForHistory.stats.total}
                </div>
              </div>
              <div style={{ background: '#f0fdf4', padding: '0.5rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.68rem', color: '#16a34a', fontWeight: 600 }}>Present</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#15803d' }}>
                  {selectedChildForHistory.stats.present}
                </div>
              </div>
              <div style={{ background: '#fef2f2', padding: '0.5rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.68rem', color: '#dc2626', fontWeight: 600 }}>Absent</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#b91c1c' }}>
                  {selectedChildForHistory.stats.absent}
                </div>
              </div>
              <div style={{ background: '#fffbeb', padding: '0.5rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.68rem', color: '#d97706', fontWeight: 600 }}>Leave</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#b45309' }}>
                  {selectedChildForHistory.stats.leave}
                </div>
              </div>
            </div>

            {/* List of past records */}
            <div style={{ maxHeight: '320px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}>
              {selectedChildForHistory.stats.records && selectedChildForHistory.stats.records.length > 0 ? (
                selectedChildForHistory.stats.records.map((r, i) => {
                  const isPres = r.attendance_status === 'Present';
                  const isAbs = r.attendance_status === 'Absent';
                  return (
                    <div
                      key={r.attendance_id || i}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.55rem 0.85rem',
                        borderBottom: i < selectedChildForHistory.stats.records.length - 1 ? '1px solid #f1f5f9' : 'none',
                        background: i % 2 === 0 ? '#ffffff' : '#f8fafc'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <i className={`bi ${isPres ? 'bi-check-circle-fill text-success' : isAbs ? 'bi-x-circle-fill text-danger' : 'bi-clock-fill text-warning'}`} />
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>
                          {r.attendance_date}
                        </span>
                      </div>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.55rem',
                        borderRadius: '0.4rem',
                        background: isPres ? '#dcfce7' : isAbs ? '#fee2e2' : '#fef3c7',
                        color: isPres ? '#15803d' : isAbs ? '#b91c1c' : '#b45309'
                      }}>
                        {r.attendance_status}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.82rem' }}>
                  No historical attendance logged yet for this child.
                </div>
              )}
            </div>

            <div style={{ marginTop: '1.25rem', textAlign: 'right' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setSelectedChildForHistory(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
