import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useOutletContext, Link, useNavigate } from 'react-router-dom';
import TopHeader from '../components/TopHeader';
import { API_URL as API } from '../apiConfig';

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
  const navigate = useNavigate();
  const currentUserName = localStorage.getItem('userName') || 'Caregiver';
  const currentUserRole = localStorage.getItem('userRole') || 'caregiver';

  const todayStr = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // ── Daily roll-call state ──
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [children, setChildren]         = useState([]);
  const [dateRecords, setDateRecords]   = useState({});
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [viewMode, setViewMode]         = useState('list');
  const [notes, setNotes]               = useState({});
  const [msg, setMsg]                   = useState('');
  const [errorMsg, setErrorMsg]         = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [selectedChildForHistory, setSelectedChildForHistory] = useState(null);
  const [historyRecords, setHistoryRecords] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [previousDaysData, setPreviousDaysData] = useState([]);
  const [childRecentMap, setChildRecentMap] = useState({});
  const [topRecentDates, setTopRecentDates] = useState([]);

  // ── Academic Year state ──
  const getCurrentAcademicYear = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1; // 1-based
    return m >= 6 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
  };
  const [academicYears, setAcademicYears]         = useState([]);
  const [selectedYear, setSelectedYear]           = useState(
    () => localStorage.getItem('att_selectedYear') || getCurrentAcademicYear()
  );
  const [histMode, setHistMode]                   = useState(false); // true when viewing a past year
  const [histData, setHistData]                   = useState(null);  // academic_year_summary response
  const [histLoading, setHistLoading]             = useState(false);
  const [histPage, setHistPage]                   = useState(1);
  const [histSearch, setHistSearch]               = useState('');
  const [histStatusFilter, setHistStatusFilter]   = useState('All');
  const [histMonth, setHistMonth]                 = useState('');
  const [correctModal, setCorrectModal]           = useState(null); // { record } | null
  const [correctStatus, setCorrectStatus]         = useState('');
  const [correctSaving, setCorrectSaving]         = useState(false);

  // ── Fetch academic years list ──
  const loadAcademicYears = useCallback(async () => {
    try {
      const res = await fetch(`${API}/attendance/available_academic_years/`);
      const data = await res.json();
      if (Array.isArray(data)) setAcademicYears(data);
    } catch (e) {
      console.error('Failed to load academic years:', e);
    }
  }, []);

  // ── Fetch historical data for a past academic year ──
  const loadHistoricalData = useCallback(async (year, page = 1, month = '', childSearch = '') => {
    setHistLoading(true);
    setHistData(null);
    try {
      let url = `${API}/attendance/academic_year_summary/?academic_year=${year}&page=${page}&page_size=50`;
      if (month) url += `&month=${month}`;
      const res = await fetch(url);
      const data = await res.json();
      setHistData(data);
    } catch (e) {
      console.error('Failed to load historical attendance:', e);
      setHistData({ has_records: false, message: 'Failed to load attendance records. Please try again.' });
    } finally {
      setHistLoading(false);
    }
  }, []);

  // ── Handle academic year selection ──
  const handleYearChange = (year) => {
    setSelectedYear(year);
    localStorage.setItem('att_selectedYear', year);
    const currentYear = getCurrentAcademicYear();
    const isPast = year !== currentYear;
    setHistMode(isPast);
    setHistPage(1);
    setHistMonth('');
    setHistSearch('');
    setHistStatusFilter('All');
    if (isPast) {
      loadHistoricalData(year, 1, '');
    }
  };

  // ── Fetch children + today's date records + previous days summary ──
  const loadData = async (dateToFetch) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [cRes, attDateRes, prevDaysRes] = await Promise.all([
        fetch(`${API}/children/`).then(r => r.json()).catch(() => []),
        fetch(`${API}/attendance/?date=${dateToFetch}`).then(r => r.json()).catch(() => []),
        fetch(`${API}/attendance/previous_days_summary/`).then(r => r.json()).catch(() => null),
      ]);

      if (prevDaysRes && Array.isArray(prevDaysRes.recent_days)) {
        setPreviousDaysData(prevDaysRes.recent_days);
        setChildRecentMap(prevDaysRes.child_recent_map || {});
        setTopRecentDates(prevDaysRes.top_dates || []);
      }

      const validChildren = Array.isArray(cRes) ? cRes : [];
      setChildren(validChildren);

      const map = {};
      if (Array.isArray(attDateRes)) {
        attDateRes.forEach(r => {
          map[r.child] = r.attendance_status;
        });
      }
      validChildren.forEach(c => {
        if (!map[c.child_id] && c.childcare_summary?.today_status) {
          map[c.child_id] = c.childcare_summary.today_status;
        }
      });
      setDateRecords(map);
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error('Error loading attendance data:', err);
      setErrorMsg('Failed to load child attendance data. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  // Open history modal and lazily fetch per-child records
  const openHistory = async (child, summaryStats) => {
    setSelectedChildForHistory({ child, stats: summaryStats });
    setHistoryRecords([]);
    setHistoryLoading(true);
    try {
      const res = await fetch(`${API}/attendance/?child_id=${child.child_id}`);
      const data = await res.json();
      setHistoryRecords(Array.isArray(data) ? data : []);
    } catch {
      setHistoryRecords([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // On mount: load years and decide mode
  useEffect(() => {
    loadAcademicYears();
    const savedYear = localStorage.getItem('att_selectedYear') || getCurrentAcademicYear();
    const currentYear = getCurrentAcademicYear();
    if (savedYear !== currentYear) {
      setHistMode(true);
      loadHistoricalData(savedYear, 1, '');
    }
  }, []);

  useEffect(() => {
    if (!histMode) {
      loadData(selectedDate);
    }
  }, [selectedDate, histMode]);

  // Admin correction handler
  const handleCorrectRecord = async () => {
    if (!correctModal || !correctStatus) return;
    setCorrectSaving(true);
    try {
      const res = await fetch(`${API}/attendance/correct_record/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': currentUserRole
        },
        body: JSON.stringify({
          attendance_id: correctModal.record.attendance_id,
          attendance_status: correctStatus,
          role: currentUserRole
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMsg(`✓ Record corrected: ${correctModal.record.child_name} on ${correctModal.record.attendance_date} → ${correctStatus}`);
        setTimeout(() => setMsg(''), 5000);
        setCorrectModal(null);
        loadHistoricalData(selectedYear, histPage, histMonth);
      } else {
        setErrorMsg(data.error || 'Failed to correct record.');
      }
    } catch {
      setErrorMsg('Network error while saving correction.');
    } finally {
      setCorrectSaving(false);
    }
  };

  // Stats come from embedded childcare_summary — no separate fetch needed
  const getChildStats = (c) => {
    const cs = c.childcare_summary || {};
    const total = cs.total || 0;
    const present = cs.present || 0;
    const absent = cs.absent || 0;
    const leave = cs.leave || 0;
    const rate = cs.rate ?? (total > 0 ? Math.round(present / total * 100) : null);
    return { total, present, absent, leave, rate };
  };

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

  // Previous days helpers
  const formatShortDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const getDayLabel = (dateStr) => {
    if (dateStr === todayStr) return 'Today';
    try {
      const today = new Date(todayStr);
      const target = new Date(dateStr);
      const diffDays = Math.round((today - target) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) return 'Yesterday';
      if (diffDays > 1 && diffDays <= 7) return `${diffDays}d ago`;
      return formatShortDate(dateStr);
    } catch {
      return formatShortDate(dateStr);
    }
  };

  const yesterdayRecord = useMemo(() => {
    return previousDaysData.find(d => d.date < selectedDate) || previousDaysData.find(d => d.date !== selectedDate) || null;
  }, [previousDaysData, selectedDate]);

  const previousDatesList = useMemo(() => {
    const list = topRecentDates.filter(d => d !== selectedDate);
    if (list.length > 0) return list;
    return previousDaysData.map(d => d.date).filter(d => d !== selectedDate);
  }, [topRecentDates, previousDaysData, selectedDate]);

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

  // ── Filtered historical records ──
  const filteredHistRecords = useMemo(() => {
    if (!histData || !histData.records) return [];
    let recs = histData.records;
    if (histSearch.trim()) {
      const q = histSearch.trim().toLowerCase();
      recs = recs.filter(r =>
        r.child_name?.toLowerCase().includes(q) ||
        String(r.child_id).includes(q)
      );
    }
    if (histStatusFilter !== 'All') {
      recs = recs.filter(r => r.attendance_status === histStatusFilter);
    }
    return recs;
  }, [histData, histSearch, histStatusFilter]);

  const statusBadge = (st) => {
    if (st === 'Present') return { bg: '#dcfce7', color: '#15803d', icon: 'bi-check-circle-fill' };
    if (st === 'Absent')  return { bg: '#fee2e2', color: '#b91c1c', icon: 'bi-x-circle-fill' };
    return { bg: '#fef9c3', color: '#b45309', icon: 'bi-calendar-event-fill' };
  };

  return (
    <>
      <TopHeader title="Child Care & Attendance" onToggleSidebar={toggleSidebar} />

      <div className="page-body">
        {/* TOP BANNER */}
        <div className="page-banner" style={{ borderLeft: `4px solid ${histMode ? '#7c3aed' : '#2563eb'}` }}>
          <div>
            <div className="section-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <i className={`bi ${histMode ? 'bi-archive-fill' : 'bi-person-lines-fill'}`} style={{ color: histMode ? '#7c3aed' : '#2563eb' }} />
              {histMode ? 'HISTORICAL RECORDS' : 'CHILD CARE OPERATIONS'} • {histMode ? 'READ-ONLY ARCHIVE' : 'DAILY ROLL-CALL'}
            </div>
            <div className="page-banner-title" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              Child Care & Attendance
              {/* Academic Year Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="bi bi-calendar3" style={{ color: histMode ? '#7c3aed' : '#2563eb', fontSize: '0.9rem' }} />
                <select
                  value={selectedYear}
                  onChange={e => handleYearChange(e.target.value)}
                  style={{
                    fontSize: '0.8rem', fontWeight: 700,
                    padding: '0.25rem 0.6rem',
                    borderRadius: '0.5rem',
                    border: `1.5px solid ${histMode ? '#7c3aed' : '#2563eb'}`,
                    background: histMode ? '#f5f3ff' : '#eff6ff',
                    color: histMode ? '#6d28d9' : '#1d4ed8',
                    cursor: 'pointer'
                  }}
                >
                  {academicYears.length === 0 && (
                    <option value={getCurrentAcademicYear()}>{getCurrentAcademicYear()} (Current)</option>
                  )}
                  {academicYears.map(ay => (
                    <option key={ay.year} value={ay.year}>
                      {ay.year}{ay.is_current ? ' (Current)' : ''} — {ay.count.toLocaleString()} records
                    </option>
                  ))}
                </select>
              </div>
              {histMode && (
                <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '1rem', background: '#f3e8ff', color: '#7c3aed' }}>
                  🔒 Historical Archive
                </span>
              )}
              {!histMode && (
                <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '1rem', background: '#dbeafe', color: '#1d4ed8' }}>
                  {formattedDateTitle}
                </span>
              )}
            </div>
            <div className="page-banner-sub">
              {histMode
                ? `Viewing read-only attendance records for Academic Year ${selectedYear}. Admins can correct individual records.`
                : 'Conduct morning roll-call, log Present/Absent/Leave statuses, monitor attendance trends, and record child care notes.'}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              className="btn btn-secondary"
              onClick={() => navigate('/child-attendance-history')}
              title="View per-child attendance across multiple years"
            >
              <i className="bi bi-person-lines-fill" /> Child History
            </button>
            {!histMode && (
              <>
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
              </>
            )}
            {histMode && currentUserRole === 'admin' && (
              <span style={{ fontSize: '0.78rem', fontWeight: 700, padding: '0.35rem 0.75rem', borderRadius: '0.5rem', background: '#f3e8ff', color: '#7c3aed', border: '1px solid #d8b4fe', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <i className="bi bi-shield-lock-fill" /> Admin Correction Mode
              </span>
            )}
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

        {/* ══════════════════════════════════════════════════════════════
            HISTORICAL ACADEMIC YEAR VIEW
        ══════════════════════════════════════════════════════════════ */}
        {histMode && (
          <div>
            {histLoading ? (
              <div style={{ padding: '3.5rem', textAlign: 'center', background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                <div className="spinner-border" style={{ width: '2.5rem', height: '2.5rem', color: '#7c3aed' }} />
                <div style={{ marginTop: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Loading historical attendance records for {selectedYear}…
                </div>
              </div>
            ) : histData && !histData.has_records ? (
              /* Empty year state */
              <div style={{ padding: '4rem 2rem', textAlign: 'center', background: '#fff', borderRadius: 'var(--radius-lg)', border: '2px dashed #e2e8f0' }}>
                <i className="bi bi-calendar-x" style={{ fontSize: '3rem', color: '#94a3b8' }} />
                <h4 style={{ marginTop: '1rem', fontWeight: 800, color: '#1e293b' }}>
                  No Attendance Records
                </h4>
                <p style={{ color: '#64748b', fontSize: '0.95rem', maxWidth: 480, margin: '0.5rem auto 0' }}>
                  {histData.message || 'No attendance records available for this academic year.'}
                </p>
                <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                  <button className="btn btn-secondary" onClick={() => handleYearChange(getCurrentAcademicYear())}>
                    <i className="bi bi-arrow-left" /> Back to Current Year
                  </button>
                </div>
              </div>
            ) : histData && histData.has_records ? (
              <>
                {/* ── Hist Summary Stats ── */}
                <div className="stats-grid" style={{ marginBottom: '1.25rem' }}>
                  {[
                    { label: 'Total School Days', value: histData.summary?.total_school_days ?? 0, color: '#3b82f6', icon: 'bi-calendar-check-fill', sub: `${selectedYear}` },
                    { label: 'Total Present', value: histData.summary?.total_present ?? 0, color: '#22c55e', icon: 'bi-check-circle-fill', sub: `${histData.summary?.annual_percentage ?? 0}% annual rate` },
                    { label: 'Total Absent', value: histData.summary?.total_absent ?? 0, color: '#ef4444', icon: 'bi-x-circle-fill', sub: 'Unexcused absences' },
                    { label: 'Total Leave', value: histData.summary?.total_leave ?? 0, color: '#f59e0b', icon: 'bi-calendar-event-fill', sub: 'Approved leave days' },
                  ].map(s => (
                    <div key={s.label} className="stat-card" style={{ borderLeft: `4px solid ${s.color}` }}>
                      <div className="stat-card-header">
                        <span className="stat-card-title">{s.label}</span>
                        <div className="stat-card-icon" style={{ background: `${s.color}20`, color: s.color }}>
                          <i className={`bi ${s.icon}`} />
                        </div>
                      </div>
                      <div className="stat-card-value" style={{ color: s.color }}>{s.value.toLocaleString()}</div>
                      <div className="stat-card-sub" style={{ color: 'var(--text-muted)' }}>{s.sub}</div>
                    </div>
                  ))}
                </div>

                {/* ── Month Filter & Search Bar ── */}
                <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '0.9rem 1.25rem', marginBottom: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', justifyContent: 'space-between', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#7c3aed' }}>
                      <i className="bi bi-funnel-fill" style={{ marginRight: '0.3rem' }} />Filter:
                    </span>
                    <select
                      value={histMonth}
                      onChange={e => {
                        setHistMonth(e.target.value);
                        setHistPage(1);
                        loadHistoricalData(selectedYear, 1, e.target.value);
                      }}
                      style={{ fontSize: '0.82rem', padding: '0.3rem 0.6rem', borderRadius: '0.4rem', border: '1px solid #d1d5db' }}
                    >
                      <option value="">All Months</option>
                      {(histData.monthly_breakdown || []).map(m => (
                        <option key={m.month} value={m.month}>
                          {new Date(m.month + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                          {' '}({m.present}/{m.total} present)
                        </option>
                      ))}
                    </select>
                    {['All', 'Present', 'Absent', 'Leave'].map(f => (
                      <button
                        key={f}
                        onClick={() => setHistStatusFilter(f)}
                        style={{
                          padding: '0.3rem 0.65rem', fontSize: '0.78rem', fontWeight: histStatusFilter === f ? 700 : 500,
                          borderRadius: '2rem', border: `1px solid ${histStatusFilter === f ? '#7c3aed' : '#cbd5e1'}`,
                          background: histStatusFilter === f ? '#7c3aed' : '#fff',
                          color: histStatusFilter === f ? '#fff' : '#475569', cursor: 'pointer'
                        }}
                      >{f}</button>
                    ))}
                  </div>
                  <div className="input-wrap" style={{ flex: 1, minWidth: 220, maxWidth: 360 }}>
                    <i className="bi bi-search input-icon" />
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search child name or ID…"
                      value={histSearch}
                      onChange={e => setHistSearch(e.target.value)}
                    />
                  </div>
                </div>

                {/* ── Read-only notice ── */}
                <div style={{ marginBottom: '1rem', padding: '0.65rem 1rem', background: '#f5f3ff', border: '1px solid #d8b4fe', borderRadius: '0.5rem', fontSize: '0.8rem', color: '#6d28d9', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <i className="bi bi-shield-lock-fill" />
                  <span>
                    <strong>Read-only archive.</strong> These are historical records for {selectedYear}.
                    {currentUserRole === 'admin'
                      ? ' As admin, you can click a record to correct its status.'
                      : ' Only admins can make corrections to past attendance records.'}
                  </span>
                </div>

                {/* ── Historical Table ── */}
                <div className="table-wrap" style={{ borderRadius: '0.85rem', border: '1px solid #e2e8f0', background: '#fff', overflowX: 'auto', marginBottom: '1.25rem' }}>
                  <table className="table" style={{ width: '100%', margin: 0, borderCollapse: 'separate', borderSpacing: 0, fontSize: '0.82rem' }}>
                    <thead>
                      <tr style={{ background: '#faf5ff' }}>
                        {['#', 'Child', 'Date', 'Status', 'Monthly %', 'Annual %', 'Total Days', 'Present', 'Absent', 'Leave', ...(currentUserRole === 'admin' ? ['Action'] : [])].map(h => (
                          <th key={h} style={{ padding: '0.7rem 0.75rem', color: '#6d28d9', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHistRecords.length === 0 ? (
                        <tr>
                          <td colSpan={currentUserRole === 'admin' ? 11 : 10} style={{ padding: '2.5rem', textAlign: 'center', color: '#94a3b8' }}>
                            <i className="bi bi-inbox" style={{ fontSize: '1.75rem' }} />
                            <div style={{ marginTop: '0.5rem' }}>No records match your filters.</div>
                          </td>
                        </tr>
                      ) : filteredHistRecords.map((rec, idx) => {
                        const b = statusBadge(rec.attendance_status);
                        return (
                          <tr key={rec.attendance_id} style={{ borderTop: '1px solid #f1f5f9', transition: 'background 0.1s' }}
                              onMouseEnter={e => e.currentTarget.style.background = '#faf5ff'}
                              onMouseLeave={e => e.currentTarget.style.background = ''}>
                            <td style={{ padding: '0.65rem 0.75rem', color: '#94a3b8', fontWeight: 600 }}>
                              {(histPage - 1) * 50 + idx + 1}
                            </td>
                            <td style={{ padding: '0.65rem 0.75rem' }}>
                              <div style={{ fontWeight: 700, color: '#1e293b' }}>{rec.child_name}</div>
                              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>ID #{rec.child_id}</div>
                            </td>
                            <td style={{ padding: '0.65rem 0.75rem', fontWeight: 600, color: '#334155', whiteSpace: 'nowrap' }}>
                              {new Date(rec.attendance_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </td>
                            <td style={{ padding: '0.65rem 0.75rem' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.55rem', borderRadius: '1rem', background: b.bg, color: b.color, fontSize: '0.75rem', fontWeight: 700 }}>
                                <i className={`bi ${b.icon}`} style={{ fontSize: '0.7rem' }} />
                                {rec.attendance_status}
                              </span>
                            </td>
                            <td style={{ padding: '0.65rem 0.75rem', textAlign: 'center' }}>
                              <span style={{ fontWeight: 700, color: rec.monthly_percentage >= 90 ? '#15803d' : rec.monthly_percentage >= 75 ? '#b45309' : '#b91c1c' }}>
                                {rec.monthly_percentage}%
                              </span>
                            </td>
                            <td style={{ padding: '0.65rem 0.75rem', textAlign: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <div style={{ flex: 1, height: 5, background: '#e2e8f0', borderRadius: 3, minWidth: 50, overflow: 'hidden' }}>
                                  <div style={{ width: `${rec.annual_percentage}%`, height: '100%', background: rec.annual_percentage >= 90 ? '#22c55e' : rec.annual_percentage >= 75 ? '#f59e0b' : '#ef4444' }} />
                                </div>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>{rec.annual_percentage}%</span>
                              </div>
                            </td>
                            <td style={{ padding: '0.65rem 0.75rem', textAlign: 'center', fontWeight: 700, color: '#334155' }}>{rec.total_school_days}</td>
                            <td style={{ padding: '0.65rem 0.75rem', textAlign: 'center', fontWeight: 700, color: '#15803d' }}>{rec.total_present}</td>
                            <td style={{ padding: '0.65rem 0.75rem', textAlign: 'center', fontWeight: 700, color: rec.total_absent > 0 ? '#b91c1c' : '#94a3b8' }}>{rec.total_absent}</td>
                            <td style={{ padding: '0.65rem 0.75rem', textAlign: 'center', fontWeight: 700, color: '#b45309' }}>{rec.total_leave}</td>
                            {currentUserRole === 'admin' && (
                              <td style={{ padding: '0.65rem 0.75rem' }}>
                                <button
                                  onClick={() => { setCorrectModal({ record: rec }); setCorrectStatus(rec.attendance_status); }}
                                  style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '0.35rem', border: '1px solid #d8b4fe', background: '#f5f3ff', color: '#6d28d9', cursor: 'pointer' }}
                                  title="Correct this attendance record"
                                >
                                  <i className="bi bi-pencil-fill" /> Correct
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* ── Pagination ── */}
                {histData.total_pages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      disabled={histPage === 1}
                      onClick={() => { const p = histPage - 1; setHistPage(p); loadHistoricalData(selectedYear, p, histMonth); }}
                    >
                      <i className="bi bi-chevron-left" /> Prev
                    </button>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569' }}>
                      Page {histPage} of {histData.total_pages} ({histData.total_records.toLocaleString()} records)
                    </span>
                    <button
                      className="btn btn-secondary btn-sm"
                      disabled={histPage === histData.total_pages}
                      onClick={() => { const p = histPage + 1; setHistPage(p); loadHistoricalData(selectedYear, p, histMonth); }}
                    >
                      Next <i className="bi bi-chevron-right" />
                    </button>
                  </div>
                )}

                {/* ── Monthly Breakdown Chart ── */}
                {histData.monthly_breakdown && histData.monthly_breakdown.length > 0 && (
                  <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.1rem 1.25rem', marginBottom: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <i className="bi bi-bar-chart-fill" style={{ color: '#7c3aed' }} />
                      Monthly Breakdown — {selectedYear}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.65rem' }}>
                      {histData.monthly_breakdown.map(m => (
                        <div key={m.month} style={{ padding: '0.75rem', borderRadius: '0.5rem', background: histMonth === m.month ? '#f5f3ff' : '#f8fafc', border: `1px solid ${histMonth === m.month ? '#c4b5fd' : '#e2e8f0'}`, cursor: 'pointer' }}
                             onClick={() => {
                               const nm = histMonth === m.month ? '' : m.month;
                               setHistMonth(nm); setHistPage(1);
                               loadHistoricalData(selectedYear, 1, nm);
                             }}>
                          <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#1e293b', marginBottom: '0.4rem' }}>
                            {new Date(m.month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.72rem', marginBottom: '0.4rem' }}>
                            <span style={{ color: '#15803d', fontWeight: 700 }}>{m.present}P</span>
                            <span style={{ color: '#b91c1c', fontWeight: 700 }}>{m.absent}A</span>
                            <span style={{ color: '#b45309', fontWeight: 700 }}>{m.leave}L</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <div style={{ flex: 1, height: 4, background: '#e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
                              <div style={{ width: `${m.percentage}%`, height: '100%', background: m.percentage >= 90 ? '#22c55e' : m.percentage >= 75 ? '#f59e0b' : '#ef4444' }} />
                            </div>
                            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#334155' }}>{m.percentage}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            ADMIN CORRECTION MODAL
        ══════════════════════════════════════════════════════════════ */}
        {correctModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
            <div style={{ background: '#fff', borderRadius: '1rem', padding: '2rem', maxWidth: 440, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
              <h5 style={{ fontWeight: 800, color: '#1e293b', marginBottom: '0.25rem' }}>
                <i className="bi bi-shield-lock-fill" style={{ color: '#7c3aed', marginRight: '0.5rem' }} />
                Correct Attendance Record
              </h5>
              <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1.25rem' }}>
                <strong>{correctModal.record.child_name}</strong> (ID #{correctModal.record.child_id})<br />
                Date: <strong>{new Date(correctModal.record.attendance_date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
              </p>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem', display: 'block' }}>
                  Correct Status To:
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {['Present', 'Absent', 'Leave'].map(st => {
                    const b = statusBadge(st);
                    return (
                      <button
                        key={st}
                        onClick={() => setCorrectStatus(st)}
                        style={{
                          flex: 1, padding: '0.5rem 0.25rem', borderRadius: '0.5rem', fontWeight: 700, fontSize: '0.82rem',
                          border: `2px solid ${correctStatus === st ? b.color : '#e2e8f0'}`,
                          background: correctStatus === st ? b.bg : '#fff',
                          color: correctStatus === st ? b.color : '#64748b', cursor: 'pointer'
                        }}
                      >
                        <i className={`bi ${b.icon}`} style={{ marginRight: '0.25rem' }} />
                        {st}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setCorrectModal(null)} disabled={correctSaving}>
                  Cancel
                </button>
                <button
                  onClick={handleCorrectRecord}
                  disabled={correctSaving || !correctStatus}
                  style={{ flex: 1, padding: '0.6rem', borderRadius: '0.5rem', fontWeight: 700, background: '#7c3aed', color: '#fff', border: 'none', cursor: correctSaving ? 'wait' : 'pointer' }}
                >
                  {correctSaving ? <><span className="spinner-border spinner-border-sm me-1" /> Saving…</> : 'Save Correction'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            DAILY ROLL-CALL VIEW (current year only)
        ══════════════════════════════════════════════════════════════ */}
        {!histMode && (
          <div>

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

        {/* PREVIOUS DAYS ATTENDANCE ROLL-CALL SUMMARY */}
        {previousDaysData.length > 0 && (
          <div style={{
            background: '#ffffff',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.1rem 1.25rem',
            marginBottom: '1.25rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: '0.5rem',
                  background: '#e0e7ff',
                  color: '#4338ca',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.1rem'
                }}>
                  <i className="bi bi-clock-history" />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    Previous Days Attendance Log
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, background: '#dbeafe', color: '#1d4ed8', padding: '0.15rem 0.5rem', borderRadius: '1rem' }}>
                      Recent History
                    </span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Track Present & Absent counts across previous days • Click any card to inspect or edit that day's roll-call
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#15803d', fontWeight: 700 }}>
                  <i className="bi bi-check-circle-fill" /> Present
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#b91c1c', fontWeight: 700 }}>
                  <i className="bi bi-x-circle-fill" /> Absent
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#b45309', fontWeight: 700 }}>
                  <i className="bi bi-calendar-event-fill" /> Leave
                </span>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(195px, 1fr))',
              gap: '0.75rem'
            }}>
              {previousDaysData.slice(0, 6).map(day => {
                const isSelected = day.date === selectedDate;
                const isToday = day.date === todayStr;
                return (
                  <div
                    key={day.date}
                    onClick={() => setSelectedDate(day.date)}
                    style={{
                      padding: '0.75rem 0.85rem',
                      borderRadius: 'var(--radius-md)',
                      border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                      background: isSelected ? '#eff6ff' : '#f8fafc',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? '0 3px 10px rgba(37,99,235,0.2)' : 'none'
                    }}
                    title={`Click to switch roll-call to ${day.date}`}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.84rem', color: isSelected ? '#1d4ed8' : '#1e293b' }}>
                        {formatShortDate(day.date)}
                      </span>
                      <span style={{
                        fontSize: '0.66rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.45rem',
                        borderRadius: '0.75rem',
                        background: isSelected ? '#2563eb' : (isToday ? '#dcfce7' : '#e2e8f0'),
                        color: isSelected ? '#ffffff' : (isToday ? '#15803d' : '#475569')
                      }}>
                        {isSelected ? 'Viewing' : (isToday ? 'Today' : getDayLabel(day.date))}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem', marginBottom: '0.4rem' }}>
                      <span style={{ color: '#16a34a', fontWeight: 700 }}>
                        <i className="bi bi-check-circle-fill" style={{ fontSize: '0.7rem', marginRight: '0.2rem' }} />
                        {day.present} Present
                      </span>
                      <span style={{ color: day.absent > 0 ? '#dc2626' : '#64748b', fontWeight: 700 }}>
                        <i className="bi bi-x-circle-fill" style={{ fontSize: '0.7rem', marginRight: '0.2rem' }} />
                        {day.absent} Absent
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <div style={{ flex: 1, height: 5, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{
                          width: `${day.rate}%`,
                          height: '100%',
                          background: day.rate >= 90 ? '#22c55e' : (day.rate >= 75 ? '#f59e0b' : '#ef4444')
                        }} />
                      </div>
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: day.rate >= 90 ? '#15803d' : '#b45309' }}>
                        {day.rate}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
                  <th style={{ padding: '0.75rem 0.75rem', color: '#64748b', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.04em', minWidth: 175 }}>
                    PREVIOUS DAYS
                  </th>
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
                  const hStats = getChildStats(c);
                  const attRate = hStats.rate;
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

                      {/* Previous Days Status Pills */}
                      <td style={{ padding: '0.75rem 0.75rem' }}>
                        <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          {previousDatesList.slice(0, 4).map(d => {
                            const st = childRecentMap[c.child_id]?.[d];
                            const isP = st === 'Present';
                            const isA = st === 'Absent';
                            const isL = st === 'Leave';
                            return (
                              <span
                                key={d}
                                title={`${formatShortDate(d)}: ${st || 'Unmarked'}`}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.2rem',
                                  padding: '0.18rem 0.45rem',
                                  borderRadius: '0.35rem',
                                  fontSize: '0.68rem',
                                  fontWeight: 700,
                                  background: isP ? '#dcfce7' : (isA ? '#fee2e2' : (isL ? '#fef3c7' : '#f1f5f9')),
                                  color: isP ? '#15803d' : (isA ? '#b91c1c' : (isL ? '#b45309' : '#64748b')),
                                  border: `1px solid ${isP ? '#bbf7d0' : (isA ? '#fecaca' : (isL ? '#fde68a' : '#e2e8f0'))}`
                                }}
                              >
                                <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 600 }}>{formatShortDate(d).split(' ')[1] || d.slice(-2)}:</span>
                                {isP ? 'P' : isA ? 'A' : isL ? 'L' : '—'}
                              </span>
                            );
                          })}
                          {previousDatesList.length === 0 && (
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>—</span>
                          )}
                        </div>
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
                          onClick={() => openHistory(c, hStats)}
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
              const hStats = getChildStats(c);
              const attRate = hStats.rate;
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
                      padding: '0.45rem 0.75rem',
                      borderRadius: '0.5rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.5rem'
                    }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        30-Day Rate:
                      </span>
                      <span style={{
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        color: attRate !== null ? (attRate >= 80 ? '#15803d' : attRate >= 65 ? '#d97706' : '#b91c1c') : '#64748b'
                      }}>
                        {attRate !== null ? `${attRate}% (${hStats.present}/${hStats.total})` : 'New'}
                      </span>
                    </div>

                    {/* Previous Days Track */}
                    <div style={{
                      background: '#f8fafc',
                      padding: '0.45rem 0.65rem',
                      borderRadius: '0.5rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.75rem'
                    }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        Previous Days:
                      </span>
                      <div style={{ display: 'flex', gap: '0.2rem' }}>
                        {previousDatesList.slice(0, 4).map(d => {
                          const st = childRecentMap[c.child_id]?.[d];
                          const isP = st === 'Present';
                          const isA = st === 'Absent';
                          const isL = st === 'Leave';
                          return (
                            <span
                              key={d}
                              title={`${formatShortDate(d)}: ${st || 'Unmarked'}`}
                              style={{
                                padding: '0.12rem 0.35rem',
                                borderRadius: '0.3rem',
                                fontSize: '0.66rem',
                                fontWeight: 800,
                                background: isP ? '#dcfce7' : (isA ? '#fee2e2' : (isL ? '#fef3c7' : '#f1f5f9')),
                                color: isP ? '#15803d' : (isA ? '#b91c1c' : (isL ? '#b45309' : '#64748b')),
                                border: `1px solid ${isP ? '#bbf7d0' : (isA ? '#fecaca' : (isL ? '#fde68a' : '#e2e8f0'))}`
                              }}
                            >
                              {formatShortDate(d).split(' ')[1] || d.slice(-2)}: {isP ? 'P' : isA ? 'A' : isL ? 'L' : '—'}
                            </span>
                          );
                        })}
                        {previousDatesList.length === 0 && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>—</span>
                        )}
                      </div>
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
                      onClick={() => openHistory(c, hStats)}
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
        )}

      {/* ── CHILD ATTENDANCE HISTORY MODAL ── */}
      {!histMode && selectedChildForHistory && (
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
              {historyLoading ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                  <div style={{ width: 24, height: 24, border: '3px solid #e2e8f0', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 0.5rem' }} />
                  Loading attendance history...
                </div>
              ) : historyRecords.length > 0 ? (
                historyRecords.map((r, i) => {
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
                        borderBottom: i < historyRecords.length - 1 ? '1px solid #f1f5f9' : 'none',
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

      </div> {/* closes page-body */}
    </>
  );
}
