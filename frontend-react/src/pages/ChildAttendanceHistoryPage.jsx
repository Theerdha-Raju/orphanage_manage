import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useOutletContext, useNavigate, useSearchParams } from 'react-router-dom';
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

function statusBadge(status) {
  switch (status) {
    case 'Present':
      return { bg: '#dcfce7', color: '#15803d', border: '#86efac', icon: 'bi-check-circle-fill' };
    case 'Absent':
      return { bg: '#fee2e2', color: '#b91c1c', border: '#fca5a5', icon: 'bi-x-circle-fill' };
    case 'Leave':
    case 'Approved Leave':
      return { bg: '#fef3c7', color: '#b45309', border: '#fcd34d', icon: 'bi-clock-fill' };
    default:
      return { bg: '#f1f5f9', color: '#64748b', border: '#cbd5e1', icon: 'bi-question-circle-fill' };
  }
}

export default function ChildAttendanceHistoryPage() {
  const { toggleSidebar } = useOutletContext();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentUserRole = localStorage.getItem('userRole') || 'caregiver';

  // State
  const [children, setChildren] = useState([]);
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [selectedChildId, setSelectedChildId] = useState(() => {
    const fromParam = searchParams.get('child_id');
    return fromParam ? parseInt(fromParam, 10) : null;
  });

  const [childSearch, setChildSearch] = useState('');
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYearFilter, setSelectedYearFilter] = useState('ALL'); // 'ALL' or specific '2025-2026'

  // Multi-year history data for selected child
  const [historyData, setHistoryData] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Detailed records log for selected child
  const [records, setRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordStatusFilter, setRecordStatusFilter] = useState('All');
  const [recordMonthFilter, setRecordMonthFilter] = useState('All');

  // Admin correction modal
  const [correctModal, setCorrectModal] = useState(null); // { record }
  const [correctStatus, setCorrectStatus] = useState('');
  const [correctSaving, setCorrectSaving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Fetch children list & academic years on mount
  useEffect(() => {
    async function init() {
      setLoadingChildren(true);
      try {
        const [cRes, ayRes] = await Promise.all([
          fetch(`${API}/children/`).then(r => r.json()).catch(() => []),
          fetch(`${API}/attendance/available_academic_years/`).then(r => r.json()).catch(() => [])
        ]);

        const validChildren = Array.isArray(cRes) ? cRes : [];
        setChildren(validChildren);

        if (Array.isArray(ayRes)) {
          setAcademicYears(ayRes);
        }

        // Set initial selected child if not already set
        if (!selectedChildId && validChildren.length > 0) {
          const firstId = validChildren[0].child_id;
          setSelectedChildId(firstId);
          setSearchParams({ child_id: firstId }, { replace: true });
        }
      } catch (err) {
        console.error('Failed to initialize child attendance history:', err);
        setErrorMsg('Failed to load children list. Please refresh the page.');
      } finally {
        setLoadingChildren(false);
      }
    }
    init();
  }, []);

  // 2. Fetch multi-year history when selectedChildId changes
  const loadChildHistory = useCallback(async (childId) => {
    if (!childId) return;
    setHistoryLoading(true);
    setHistoryData(null);
    try {
      const res = await fetch(`${API}/attendance/child_multi_year_history/?child_id=${childId}`);
      if (!res.ok) throw new Error('Failed to load history');
      const data = await res.json();
      setHistoryData(data);
    } catch (err) {
      console.error('Error fetching child multi-year history:', err);
      setErrorMsg('Could not retrieve attendance history for this child.');
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  // 3. Fetch detailed individual attendance records for child
  const loadChildRecords = useCallback(async (childId, yearFilter = 'ALL') => {
    if (!childId) return;
    setRecordsLoading(true);
    try {
      let url = `${API}/attendance/?child_id=${childId}`;
      const res = await fetch(url);
      const data = await res.json();
      const allRecords = Array.isArray(data) ? data : [];
      setRecords(allRecords);
    } catch (err) {
      console.error('Error fetching attendance records:', err);
      setRecords([]);
    } finally {
      setRecordsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedChildId) {
      loadChildHistory(selectedChildId);
      loadChildRecords(selectedChildId, selectedYearFilter);
    }
  }, [selectedChildId, loadChildHistory, loadChildRecords]);

  // Select Child handler
  const handleSelectChild = (id) => {
    setSelectedChildId(id);
    setSearchParams({ child_id: id });
    setRecordStatusFilter('All');
    setRecordMonthFilter('All');
  };

  // Selected child object
  const selectedChild = useMemo(() => {
    return children.find(c => c.child_id === selectedChildId) || null;
  }, [children, selectedChildId]);

  // Filtered children list for left drawer
  const filteredChildren = useMemo(() => {
    const q = childSearch.trim().toLowerCase();
    if (!q) return children;
    return children.filter(c =>
      (c.full_name || '').toLowerCase().includes(q) ||
      String(c.child_id).includes(q) ||
      (c.gender || '').toLowerCase().includes(q)
    );
  }, [children, childSearch]);

  // Active / displayed history entries based on academic year filter
  const displayedHistoryYears = useMemo(() => {
    if (!historyData || !Array.isArray(historyData.history)) return [];
    if (selectedYearFilter === 'ALL') {
      return historyData.history;
    }
    return historyData.history.filter(y => y.academic_year === selectedYearFilter);
  }, [historyData, selectedYearFilter]);

  // Aggregated totals across displayed academic years
  const aggregateMetrics = useMemo(() => {
    if (!displayedHistoryYears.length) {
      return { totalDays: 0, present: 0, absent: 0, leave: 0, rate: 0 };
    }
    let totalDays = 0;
    let present = 0;
    let absent = 0;
    let leave = 0;

    displayedHistoryYears.forEach(y => {
      totalDays += (y.total_school_days || 0);
      present += (y.total_present || 0);
      absent += (y.total_absent || 0);
      leave += (y.total_leave || 0);
    });

    const rate = totalDays > 0 ? Math.round((present / totalDays) * 1000) / 10 : 0;
    return { totalDays, present, absent, leave, rate };
  }, [displayedHistoryYears]);

  // Determine which records fall into the selected academic year
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const recDate = r.attendance_date;
      if (!recDate) return false;

      // Status filter
      if (recordStatusFilter !== 'All') {
        const mappedStatus = r.attendance_status === 'Approved Leave' ? 'Leave' : r.attendance_status;
        if (mappedStatus !== recordStatusFilter && r.attendance_status !== recordStatusFilter) {
          return false;
        }
      }

      // Academic year filter
      if (selectedYearFilter !== 'ALL') {
        const [startY, endY] = selectedYearFilter.split('-').map(Number);
        const d = new Date(recDate);
        const startDate = new Date(startY, 5, 1);  // June 1
        const endDate = new Date(endY, 4, 31, 23, 59, 59); // May 31
        if (d < startDate || d > endDate) return false;
      }

      // Month filter
      if (recordMonthFilter !== 'All') {
        const ym = recDate.slice(0, 7);
        if (ym !== recordMonthFilter) return false;
      }

      return true;
    });
  }, [records, recordStatusFilter, selectedYearFilter, recordMonthFilter]);

  // Unique months available in records for month dropdown
  const availableMonths = useMemo(() => {
    const set = new Set();
    records.forEach(r => {
      if (r.attendance_date) {
        set.add(r.attendance_date.slice(0, 7));
      }
    });
    return Array.from(set).sort().reverse();
  }, [records]);

  // Admin correction submit handler
  const handleSaveCorrection = async () => {
    if (!correctModal || !correctStatus) return;
    setCorrectSaving(true);
    setErrorMsg('');
    setFeedbackMsg('');
    try {
      const res = await fetch(`${API}/attendance/correct_record/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': currentUserRole
        },
        body: JSON.stringify({
          attendance_id: correctModal.record.attendance_id,
          attendance_status: correctStatus
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update record');
      }

      setFeedbackMsg(`Successfully updated attendance record for ${correctModal.record.attendance_date} to "${correctStatus}".`);
      setCorrectModal(null);

      // Refresh records and summary
      if (selectedChildId) {
        loadChildHistory(selectedChildId);
        loadChildRecords(selectedChildId, selectedYearFilter);
      }
    } catch (err) {
      console.error('Error correcting record:', err);
      setErrorMsg(err.message || 'Correction failed.');
    } finally {
      setCorrectSaving(false);
    }
  };

  return (
    <>
      <TopHeader title="Child Attendance Multi-Year History" onToggleSidebar={toggleSidebar} />

      <div className="page-body">
        {/* TOP BANNER */}
        <div className="page-banner" style={{ borderLeft: '4px solid #7c3aed' }}>
          <div>
            <div className="section-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <i className="bi bi-clock-history" style={{ color: '#7c3aed' }} />
              MULTI-YEAR ATTENDANCE REVIEW • CHILD-WISE PROFILE
            </div>
            <div className="page-banner-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span>Child Attendance Multi-Year History</span>
              {selectedChild && (
                <span style={{ fontSize: '0.85rem', fontWeight: 700, padding: '0.25rem 0.75rem', borderRadius: '1rem', background: '#f5f3ff', color: '#7c3aed', border: '1px solid #d8b4fe' }}>
                  {selectedChild.full_name} (ID #{selectedChild.child_id})
                </span>
              )}
            </div>
            <div className="page-banner-sub">
              Review longitudinal attendance performance across multiple academic years, examine monthly breakdowns, and verify verified records with zero data fabrication.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              className="btn btn-secondary"
              onClick={() => navigate('/child-attendance')}
              title="Return to daily roll-call attendance"
            >
              <i className="bi bi-calendar-check" /> Daily Attendance Roll-Call
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => navigate('/child-profile')}
              title="Open full child profile dossier"
            >
              <i className="bi bi-person-heart" /> Child Profiles
            </button>
          </div>
        </div>

        {/* FEEDBACK ALERTS */}
        {feedbackMsg && (
          <div className="alert alert-success" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span><i className="bi bi-check-circle-fill" style={{ marginRight: '0.5rem' }} /> {feedbackMsg}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setFeedbackMsg('')}><i className="bi bi-x" /></button>
          </div>
        )}
        {errorMsg && (
          <div className="alert alert-danger" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span><i className="bi bi-exclamation-triangle-fill" style={{ marginRight: '0.5rem' }} /> {errorMsg}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setErrorMsg('')}><i className="bi bi-x" /></button>
          </div>
        )}

        {/* MAIN TWO-COLUMN LAYOUT: CHILD LIST + DETAILS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 320px) 1fr', gap: '1.25rem', alignItems: 'start' }}>
          
          {/* ══════════════════════════════════════════════════════════════
              LEFT COLUMN: CHILD SELECTION DRAWER
          ══════════════════════════════════════════════════════════════ */}
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1rem', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1e293b' }}>
                <i className="bi bi-people-fill" style={{ color: '#7c3aed', marginRight: '0.4rem' }} />
                Select Child ({filteredChildren.length})
              </span>
            </div>

            {/* Child Search Input */}
            <div className="input-wrap" style={{ marginBottom: '0.75rem' }}>
              <i className="bi bi-search input-icon" />
              <input
                type="text"
                className="form-control"
                placeholder="Search name or ID..."
                value={childSearch}
                onChange={e => setChildSearch(e.target.value)}
                style={{ fontSize: '0.82rem', padding: '0.45rem 0.5rem 0.45rem 2.2rem' }}
              />
            </div>

            {/* Child List */}
            {loadingChildren ? (
              <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>
                <div className="spinner-border spinner-border-sm" style={{ color: '#7c3aed', marginRight: '0.5rem' }} />
                Loading children...
              </div>
            ) : filteredChildren.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 0', color: '#94a3b8', fontSize: '0.85rem' }}>
                No children match your search.
              </div>
            ) : (
              <div style={{ maxHeight: '680px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.35rem', paddingRight: '0.2rem' }}>
                {filteredChildren.map((c, i) => {
                  const isSelected = c.child_id === selectedChildId;
                  const color = AVATAR_COLORS[c.child_id % AVATAR_COLORS.length];
                  const ageInfo = calcAge(c.date_of_birth);
                  return (
                    <div
                      key={c.child_id}
                      onClick={() => handleSelectChild(c.child_id)}
                      style={{
                        padding: '0.65rem 0.75rem',
                        borderRadius: '0.6rem',
                        border: `1.5px solid ${isSelected ? '#7c3aed' : '#f1f5f9'}`,
                        background: isSelected ? '#f5f3ff' : '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={e => {
                        if (!isSelected) e.currentTarget.style.background = '#f8fafc';
                      }}
                      onMouseLeave={e => {
                        if (!isSelected) e.currentTarget.style.background = '#ffffff';
                      }}
                    >
                      {/* Avatar */}
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '50%',
                        background: color, color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 800, fontSize: '0.82rem', flexShrink: 0
                      }}>
                        {c.full_name ? c.full_name.charAt(0).toUpperCase() : 'C'}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: isSelected ? 800 : 700, fontSize: '0.85rem', color: isSelected ? '#6d28d9' : '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {c.full_name}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                          <span>ID #{c.child_id}</span>
                          <span>•</span>
                          <span>{ageInfo.label}</span>
                          <span>•</span>
                          <span>{c.gender || '—'}</span>
                        </div>
                      </div>

                      {isSelected && (
                        <i className="bi bi-chevron-right" style={{ color: '#7c3aed', fontSize: '0.8rem', fontWeight: 800 }} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ══════════════════════════════════════════════════════════════
              RIGHT COLUMN: ATTENDANCE HISTORY FOR SELECTED CHILD
          ══════════════════════════════════════════════════════════════ */}
          <div>
            {!selectedChild ? (
              <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '3.5rem', textAlign: 'center', color: '#94a3b8' }}>
                <i className="bi bi-person-badge" style={{ fontSize: '3rem' }} />
                <h5 style={{ marginTop: '1rem', fontWeight: 800, color: '#1e293b' }}>No Child Selected</h5>
                <p style={{ fontSize: '0.88rem' }}>Please select a child from the left panel to review their academic year attendance history.</p>
              </div>
            ) : (
              <>
                {/* ── CHILD OVERVIEW CARD WITH ACADEMIC YEAR FILTER BAR ── */}
                <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem 1.5rem', marginBottom: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{
                        width: '52px', height: '52px', borderRadius: '50%',
                        background: AVATAR_COLORS[selectedChild.child_id % AVATAR_COLORS.length],
                        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 900, fontSize: '1.25rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}>
                        {selectedChild.full_name ? selectedChild.full_name.charAt(0).toUpperCase() : 'C'}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <h4 style={{ margin: 0, fontWeight: 900, color: '#0f172a' }}>{selectedChild.full_name}</h4>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '0.4rem', background: '#e0e7ff', color: '#3730a3' }}>
                            Child ID #{selectedChild.child_id}
                          </span>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '0.4rem', background: '#dcfce7', color: '#15803d' }}>
                            {selectedChild.status || 'Active'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
                          <span><strong>Age:</strong> {calcAge(selectedChild.date_of_birth).label}</span>
                          <span><strong>Gender:</strong> {selectedChild.gender || '—'}</span>
                          <span><strong>Caregiver:</strong> {selectedChild.caregiver_name || selectedChild.caregiver || 'Assigned Staff'}</span>
                          {selectedChild.admission_date && (
                            <span><strong>Admitted:</strong> {new Date(selectedChild.admission_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* ACADEMIC YEAR FILTER CONTROLS */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: '#f8fafc', padding: '0.4rem 0.75rem', borderRadius: '0.6rem', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#7c3aed', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <i className="bi bi-calendar3" /> Academic Year:
                      </span>
                      <select
                        value={selectedYearFilter}
                        onChange={e => setSelectedYearFilter(e.target.value)}
                        style={{
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          padding: '0.35rem 0.75rem',
                          borderRadius: '0.45rem',
                          border: '1.5px solid #c4b5fd',
                          background: '#fff',
                          color: '#6d28d9',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="ALL">All Academic Years (Cumulative)</option>
                        {academicYears.map(ay => (
                          <option key={ay.year} value={ay.year}>
                            {ay.year} {ay.is_current ? '(Current Year)' : '(Archive)'}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* ── AGGREGATE KPI CARDS ── */}
                  <div className="stats-grid" style={{ marginBottom: 0 }}>
                    {[
                      {
                        label: 'Recorded School Days',
                        value: aggregateMetrics.totalDays,
                        color: '#3b82f6',
                        icon: 'bi-calendar-check-fill',
                        sub: selectedYearFilter === 'ALL' ? 'Across all recorded years' : `Year ${selectedYearFilter}`
                      },
                      {
                        label: 'Total Present Days',
                        value: aggregateMetrics.present,
                        color: '#22c55e',
                        icon: 'bi-check-circle-fill',
                        sub: `${aggregateMetrics.rate}% cumulative rate`
                      },
                      {
                        label: 'Total Absent Days',
                        value: aggregateMetrics.absent,
                        color: '#ef4444',
                        icon: 'bi-x-circle-fill',
                        sub: 'Unexcused absences'
                      },
                      {
                        label: 'Approved Leave Days',
                        value: aggregateMetrics.leave,
                        color: '#f59e0b',
                        icon: 'bi-calendar-event-fill',
                        sub: 'Sanctioned leave requests'
                      },
                    ].map(s => (
                      <div key={s.label} className="stat-card" style={{ borderLeft: `4px solid ${s.color}`, padding: '0.85rem 1rem' }}>
                        <div className="stat-card-header">
                          <span className="stat-card-title" style={{ fontSize: '0.78rem' }}>{s.label}</span>
                          <div className="stat-card-icon" style={{ background: `${s.color}20`, color: s.color }}>
                            <i className={`bi ${s.icon}`} />
                          </div>
                        </div>
                        <div className="stat-card-value" style={{ color: s.color, fontSize: '1.45rem' }}>
                          {s.value.toLocaleString()}
                        </div>
                        <div className="stat-card-sub" style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                          {s.sub}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── MULTI-YEAR ANNUAL PROGRESS BREAKDOWN CARDS ── */}
                <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', marginBottom: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <i className="bi bi-bar-chart-line-fill" style={{ color: '#7c3aed' }} />
                      Annual Attendance Performance Comparison
                    </div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Percentages computed strictly from verified saved records
                    </span>
                  </div>

                  {historyLoading ? (
                    <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <div className="spinner-border spinner-border-sm" style={{ color: '#7c3aed', marginRight: '0.5rem' }} />
                      Loading multi-year attendance history for {selectedChild.full_name}...
                    </div>
                  ) : displayedHistoryYears.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                      <i className="bi bi-calendar-x" style={{ fontSize: '2rem' }} />
                      <div style={{ marginTop: '0.5rem', fontWeight: 600 }}>No attendance records found for the selected period.</div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      {displayedHistoryYears.map(y => {
                        const rateColor = y.annual_percentage >= 90 ? '#16a34a' : y.annual_percentage >= 75 ? '#d97706' : '#dc2626';
                        return (
                          <div
                            key={y.academic_year}
                            style={{
                              border: '1px solid #e2e8f0',
                              borderRadius: '0.75rem',
                              padding: '1rem 1.25rem',
                              background: y.is_current ? '#faf5ff' : '#ffffff',
                              borderLeft: `4px solid ${y.is_current ? '#7c3aed' : '#94a3b8'}`
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.65rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1e293b' }}>
                                  Academic Year {y.academic_year}
                                </span>
                                {y.is_current ? (
                                  <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.15rem 0.55rem', borderRadius: '1rem', background: '#dbeafe', color: '#1d4ed8' }}>
                                    Current Academic Year
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '0.15rem 0.55rem', borderRadius: '1rem', background: '#f1f5f9', color: '#475569' }}>
                                    <i className="bi bi-lock-fill" style={{ marginRight: '0.25rem' }} />
                                    Read-Only Archive
                                  </span>
                                )}
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.82rem' }}>
                                <span><strong style={{ color: '#334155' }}>Total Days:</strong> {y.total_school_days}</span>
                                <span><strong style={{ color: '#15803d' }}>Present:</strong> {y.total_present}</span>
                                <span><strong style={{ color: '#b91c1c' }}>Absent:</strong> {y.total_absent}</span>
                                <span><strong style={{ color: '#b45309' }}>Leave:</strong> {y.total_leave}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800, color: rateColor, fontSize: '0.95rem' }}>
                                  <span>{y.annual_percentage}%</span>
                                </div>
                              </div>
                            </div>

                            {/* Progress bar */}
                            <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden', marginBottom: '0.75rem' }}>
                              <div
                                style={{
                                  width: `${Math.min(100, y.annual_percentage)}%`,
                                  height: '100%',
                                  background: rateColor,
                                  transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                                }}
                              />
                            </div>

                            {/* Monthly pills inside this academic year */}
                            {y.monthly_breakdown && y.monthly_breakdown.length > 0 && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed #e2e8f0' }}>
                                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', alignSelf: 'center', marginRight: '0.25rem' }}>
                                  Months:
                                </span>
                                {y.monthly_breakdown.map(m => {
                                  const mName = new Date(m.month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                                  const mColor = m.percentage >= 90 ? '#15803d' : m.percentage >= 75 ? '#b45309' : '#b91c1c';
                                  return (
                                    <div
                                      key={m.month}
                                      style={{
                                        fontSize: '0.72rem',
                                        padding: '0.25rem 0.55rem',
                                        borderRadius: '0.35rem',
                                        background: '#f8fafc',
                                        border: '1px solid #e2e8f0',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.35rem'
                                      }}
                                    >
                                      <span style={{ fontWeight: 600, color: '#334155' }}>{mName}:</span>
                                      <span style={{ fontWeight: 700, color: mColor }}>{m.percentage}%</span>
                                      <span style={{ color: '#94a3b8', fontSize: '0.68rem' }}>({m.present}/{m.total})</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* ── DETAILED ATTENDANCE LOG TABLE ── */}
                <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <i className="bi bi-card-checklist" style={{ color: '#7c3aed' }} />
                        Detailed Attendance Log ({filteredRecords.length} records)
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Chronological roll-call logs and leave approvals for {selectedChild.full_name}
                      </div>
                    </div>

                    {/* Filter controls */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                      {/* Month dropdown filter */}
                      <select
                        value={recordMonthFilter}
                        onChange={e => setRecordMonthFilter(e.target.value)}
                        style={{ fontSize: '0.78rem', padding: '0.3rem 0.6rem', borderRadius: '0.4rem', border: '1px solid #d1d5db', background: '#fff' }}
                      >
                        <option value="All">All Months</option>
                        {availableMonths.map(ym => (
                          <option key={ym} value={ym}>
                            {new Date(ym + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                          </option>
                        ))}
                      </select>

                      {/* Status pill filter */}
                      {['All', 'Present', 'Absent', 'Leave'].map(st => (
                        <button
                          key={st}
                          onClick={() => setRecordStatusFilter(st)}
                          style={{
                            padding: '0.25rem 0.6rem',
                            fontSize: '0.75rem',
                            fontWeight: recordStatusFilter === st ? 700 : 500,
                            borderRadius: '1rem',
                            border: `1px solid ${recordStatusFilter === st ? '#7c3aed' : '#cbd5e1'}`,
                            background: recordStatusFilter === st ? '#7c3aed' : '#fff',
                            color: recordStatusFilter === st ? '#fff' : '#475569',
                            cursor: 'pointer'
                          }}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  {recordsLoading ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <div className="spinner-border spinner-border-sm" style={{ color: '#7c3aed', marginRight: '0.5rem' }} />
                      Loading attendance records...
                    </div>
                  ) : filteredRecords.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                      <i className="bi bi-inbox" style={{ fontSize: '2rem' }} />
                      <div style={{ marginTop: '0.5rem' }}>No attendance records match the selected filters.</div>
                    </div>
                  ) : (
                    <div className="table-wrap" style={{ borderRadius: '0.65rem', border: '1px solid #e2e8f0', overflowX: 'auto' }}>
                      <table className="table" style={{ width: '100%', margin: 0, borderCollapse: 'separate', borderSpacing: 0, fontSize: '0.82rem' }}>
                        <thead>
                          <tr style={{ background: '#faf5ff' }}>
                            <th style={{ padding: '0.65rem 0.85rem', color: '#6d28d9', fontWeight: 700 }}>Date</th>
                            <th style={{ padding: '0.65rem 0.85rem', color: '#6d28d9', fontWeight: 700 }}>Day of Week</th>
                            <th style={{ padding: '0.65rem 0.85rem', color: '#6d28d9', fontWeight: 700 }}>Status</th>
                            <th style={{ padding: '0.65rem 0.85rem', color: '#6d28d9', fontWeight: 700 }}>Academic Year</th>
                            <th style={{ padding: '0.65rem 0.85rem', color: '#6d28d9', fontWeight: 700 }}>Recorded By</th>
                            {currentUserRole === 'admin' && (
                              <th style={{ padding: '0.65rem 0.85rem', color: '#6d28d9', fontWeight: 700 }}>Admin Action</th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRecords.slice(0, 100).map((r, idx) => {
                            const b = statusBadge(r.attendance_status);
                            const d = new Date(r.attendance_date);
                            const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
                            const m = d.getMonth() + 1;
                            const y = d.getFullYear();
                            const recYear = m >= 6 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
                            const isReadOnlyYear = recYear < '2026-2027';

                            return (
                              <tr
                                key={r.attendance_id || idx}
                                style={{ borderTop: '1px solid #f1f5f9', transition: 'background 0.1s' }}
                                onMouseEnter={e => e.currentTarget.style.background = '#faf5ff'}
                                onMouseLeave={e => e.currentTarget.style.background = ''}
                              >
                                <td style={{ padding: '0.65rem 0.85rem', fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap' }}>
                                  {d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </td>
                                <td style={{ padding: '0.65rem 0.85rem', color: '#64748b', fontWeight: 500 }}>
                                  {dayName}
                                </td>
                                <td style={{ padding: '0.65rem 0.85rem' }}>
                                  <span style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                                    padding: '0.2rem 0.6rem', borderRadius: '1rem',
                                    background: b.bg, color: b.color, border: `1px solid ${b.border}`,
                                    fontSize: '0.75rem', fontWeight: 700
                                  }}>
                                    <i className={`bi ${b.icon}`} style={{ fontSize: '0.72rem' }} />
                                    {r.attendance_status}
                                  </span>
                                </td>
                                <td style={{ padding: '0.65rem 0.85rem', color: '#475569', fontWeight: 600 }}>
                                  {recYear}
                                </td>
                                <td style={{ padding: '0.65rem 0.85rem', color: '#64748b' }}>
                                  {r.marked_by_name || 'Caregiver Staff'}
                                </td>
                                {currentUserRole === 'admin' && (
                                  <td style={{ padding: '0.65rem 0.85rem' }}>
                                    <button
                                      onClick={() => {
                                        setCorrectModal({ record: { ...r, child_name: selectedChild.full_name, child_id: selectedChild.child_id } });
                                        setCorrectStatus(r.attendance_status === 'Approved Leave' ? 'Leave' : r.attendance_status);
                                      }}
                                      style={{
                                        fontSize: '0.72rem',
                                        fontWeight: 700,
                                        padding: '0.25rem 0.55rem',
                                        borderRadius: '0.4rem',
                                        border: '1px solid #d8b4fe',
                                        background: '#f5f3ff',
                                        color: '#7c3aed',
                                        cursor: 'pointer'
                                      }}
                                      title={isReadOnlyYear ? 'Correct historical archived record' : 'Correct record'}
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
                      {filteredRecords.length > 100 && (
                        <div style={{ padding: '0.65rem', textAlign: 'center', fontSize: '0.75rem', color: '#64748b', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                          Showing latest 100 records out of {filteredRecords.length}.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            ADMIN CORRECTION MODAL
        ══════════════════════════════════════════════════════════════ */}
        {correctModal && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
            zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(4px)'
          }}>
            <div style={{
              background: '#fff', borderRadius: '1rem', padding: '2rem',
              maxWidth: 450, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.25)'
            }}>
              <h5 style={{ fontWeight: 800, color: '#1e293b', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="bi bi-shield-lock-fill" style={{ color: '#7c3aed' }} />
                Correct Attendance Record
              </h5>
              <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1.25rem' }}>
                Authorized administrator override for <strong>{correctModal.record.child_name}</strong> (ID #{correctModal.record.child_id})<br />
                Date: <strong>{new Date(correctModal.record.attendance_date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
              </p>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem', display: 'block' }}>
                  Select Updated Status:
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {['Present', 'Absent', 'Leave'].map(st => {
                    const b = statusBadge(st);
                    const isSelected = correctStatus === st;
                    return (
                      <button
                        key={st}
                        onClick={() => setCorrectStatus(st)}
                        style={{
                          flex: 1, padding: '0.6rem 0.25rem', borderRadius: '0.5rem',
                          fontWeight: 700, fontSize: '0.82rem',
                          border: `2px solid ${isSelected ? b.color : '#e2e8f0'}`,
                          background: isSelected ? b.bg : '#fff',
                          color: isSelected ? b.color : '#64748b',
                          cursor: 'pointer'
                        }}
                      >
                        <i className={`bi ${b.icon}`} style={{ marginRight: '0.3rem' }} />
                        {st}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setCorrectModal(null)}
                  disabled={correctSaving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCorrection}
                  disabled={correctSaving || !correctStatus}
                  style={{
                    flex: 1, padding: '0.6rem', borderRadius: '0.5rem',
                    fontWeight: 700, background: '#7c3aed', color: '#fff',
                    border: 'none', cursor: correctSaving ? 'wait' : 'pointer'
                  }}
                >
                  {correctSaving ? (
                    <><span className="spinner-border spinner-border-sm me-1" /> Updating...</>
                  ) : (
                    'Confirm Correction'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
