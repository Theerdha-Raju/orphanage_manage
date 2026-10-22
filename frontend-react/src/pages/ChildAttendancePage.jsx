import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import TopHeader from '../components/TopHeader';
import { requestApi } from '../apiConfig';
import { getLoggedInChild } from '../utils/childAuth';

// ─── helpers ────────────────────────────────────────────────────────────────
const statusColor = {
  Present: { bg: '#dcfce7', text: '#15803d', border: '#bbf7d0' },
  Absent:  { bg: '#fee2e2', text: '#b91c1c', border: '#fecaca' },
  Leave:   { bg: '#fef9c3', text: '#92400e', border: '#fde68a' },
  Holiday: { bg: '#ede9fe', text: '#6d28d9', border: '#ddd6fe' },
};
const statusIcon = { Present: 'bi-check-circle-fill', Absent: 'bi-x-circle-fill', Leave: 'bi-calendar2-minus-fill', Holiday: 'bi-sun-fill' };
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function pct(num, den) {
  if (!den) return 0;
  return Math.round((num / den) * 100);
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function ChildAttendancePage() {
  const { toggleSidebar } = useOutletContext();

  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [child, setChild]       = useState(null);
  const [records, setRecords]   = useState([]);

  // filters
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterMonth, setFilterMonth]   = useState('All');
  const [searchDate, setSearchDate]     = useState('');

  // ── fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        // 1. resolve child
        const cRes = await requestApi('/api/children/').then(r => r.json()).catch(() => []);
        const children = Array.isArray(cRes) ? cRes : [];
        const matched = getLoggedInChild(children);
        setChild(matched);

        if (!matched) {
          setError('Unable to identify your child account. Please contact an administrator.');
          setLoading(false);
          return;
        }

        // 2. fetch this child's attendance only
        const aRes = await requestApi(`/api/attendance/?child=${matched.child_id}`)
          .then(r => r.json())
          .catch(() => []);

        const att = Array.isArray(aRes) ? aRes : [];
        // sort newest first
        att.sort((a, b) => new Date(b.attendance_date) - new Date(a.attendance_date));
        setRecords(att);
      } catch (e) {
        setError('Failed to load attendance data. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ── computed ───────────────────────────────────────────────────────────────
  const today = new Date().toISOString().slice(0, 10);

  const pastRecords = useMemo(
    () => records.filter(r => r.attendance_date <= today),
    [records, today]
  );

  const summary = useMemo(() => {
    const total   = pastRecords.length;
    const present = pastRecords.filter(r => r.attendance_status === 'Present').length;
    const absent  = pastRecords.filter(r => r.attendance_status === 'Absent').length;
    const leave   = pastRecords.filter(r => r.attendance_status === 'Leave').length;
    const holiday = pastRecords.filter(r => r.attendance_status === 'Holiday').length;
    // denominator: total minus holidays (holidays aren't school days)
    const denominator = total - holiday;
    const rate = pct(present, denominator);
    const lastDate = pastRecords[0]?.attendance_date || null;
    return { total, present, absent, leave, holiday, denominator, rate, lastDate };
  }, [pastRecords]);

  // monthly breakdown for simple bar chart
  const monthlyData = useMemo(() => {
    const map = {};
    pastRecords.forEach(r => {
      const d = new Date(r.attendance_date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!map[key]) map[key] = { label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`, present: 0, absent: 0, leave: 0, total: 0 };
      map[key].total++;
      if (r.attendance_status === 'Present') map[key].present++;
      else if (r.attendance_status === 'Absent') map[key].absent++;
      else if (r.attendance_status === 'Leave') map[key].leave++;
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v);
  }, [pastRecords]);

  // available months for filter
  const availableMonths = useMemo(() => {
    const set = new Set();
    records.forEach(r => {
      const d = new Date(r.attendance_date);
      set.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    });
    return Array.from(set).sort().reverse();
  }, [records]);

  // filtered table rows
  const filteredRecords = useMemo(() => {
    let rows = [...records];
    if (filterStatus !== 'All') rows = rows.filter(r => r.attendance_status === filterStatus);
    if (filterMonth !== 'All') {
      rows = rows.filter(r => {
        const d = new Date(r.attendance_date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        return key === filterMonth;
      });
    }
    if (searchDate) rows = rows.filter(r => r.attendance_date === searchDate);
    return rows;
  }, [records, filterStatus, filterMonth, searchDate]);

  // ── UI helpers ─────────────────────────────────────────────────────────────
  const pctColor = (p) => {
    if (p >= 85) return '#10b981';
    if (p >= 70) return '#f59e0b';
    return '#ef4444';
  };

  const formatDate = (d) => {
    if (!d) return '—';
    const dt = new Date(d);
    return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getDayName = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-IN', { weekday: 'long' });
  };

  // ── render ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <>
        <TopHeader title="Attendance Details" onToggleSidebar={toggleSidebar} />
        <div className="page-body" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', flexDirection: 'column', gap: '1rem' }}>
          <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} />
          <p style={{ color: '#64748b', fontWeight: 500 }}>Loading your attendance records…</p>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <TopHeader title="Attendance Details" onToggleSidebar={toggleSidebar} />
        <div className="page-body" style={{ padding: '2rem' }}>
          <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '1rem', padding: '2rem', textAlign: 'center' }}>
            <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: '2rem', color: '#dc2626' }} />
            <p style={{ color: '#b91c1c', marginTop: '1rem', fontWeight: 600 }}>{error}</p>
          </div>
        </div>
      </>
    );
  }

  const maxBarPct = Math.max(...monthlyData.map(m => m.total), 1);

  return (
    <>
      <TopHeader title="Attendance Details" onToggleSidebar={toggleSidebar} />

      <div className="page-body" style={{ maxWidth: '1280px', margin: '0 auto' }}>

        {/* ── Banner ── */}
        <div style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #3b82f6 100%)',
          color: '#fff', borderRadius: '1.25rem', padding: '1.75rem 2rem',
          marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', flexWrap: 'wrap', gap: '1rem',
          boxShadow: '0 10px 25px -5px rgba(37,99,235,0.35)',
        }}>
          <div>
            <div style={{ fontSize: '0.8rem', letterSpacing: '0.12em', opacity: 0.75, textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.4rem' }}>
              <i className="bi bi-calendar-check-fill" style={{ marginRight: '0.4rem' }} /> My Attendance Records
            </div>
            <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800 }}>
              {child?.full_name || 'Student'}'s Attendance
            </h2>
            <p style={{ margin: '0.3rem 0 0', opacity: 0.85, fontSize: '0.9rem' }}>
              {child?.class_name || ''} &nbsp;·&nbsp; Academic Year 2026-27
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '3rem', fontWeight: 900, lineHeight: 1, color: pctColor(summary.rate) === '#10b981' ? '#bbf7d0' : pctColor(summary.rate) === '#f59e0b' ? '#fde68a' : '#fecaca' }}>
              {records.length === 0 ? '—' : `${summary.rate}%`}
            </div>
            <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '0.25rem' }}>Overall Attendance Rate</div>
          </div>
        </div>

        {/* ── No records state ── */}
        {records.length === 0 ? (
          <div style={{
            background: '#fff', borderRadius: '1.25rem', border: '2px dashed #e2e8f0',
            padding: '4rem 2rem', textAlign: 'center',
          }}>
            <i className="bi bi-calendar-x" style={{ fontSize: '3.5rem', color: '#94a3b8' }} />
            <h3 style={{ color: '#64748b', marginTop: '1rem', fontWeight: 700 }}>No Attendance Records Available</h3>
            <p style={{ color: '#94a3b8' }}>No attendance has been recorded for you yet. Please contact your caregiver.</p>
          </div>
        ) : (
          <>
            {/* ── Summary Cards ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
              {[
                { label: 'Total Days',   value: summary.denominator, icon: 'bi-calendar3',          bg: '#eff6ff', text: '#1d4ed8', iconBg: '#dbeafe' },
                { label: 'Present',      value: summary.present,    icon: 'bi-check-circle-fill',   bg: '#f0fdf4', text: '#15803d', iconBg: '#dcfce7' },
                { label: 'Absent',       value: summary.absent,     icon: 'bi-x-circle-fill',       bg: '#fff1f2', text: '#be123c', iconBg: '#fee2e2' },
                { label: 'Leave',        value: summary.leave,      icon: 'bi-calendar2-minus-fill', bg: '#fffbeb', text: '#92400e', iconBg: '#fef3c7' },
              ].map(c => (
                <div key={c.label} style={{
                  background: c.bg, borderRadius: '1rem', padding: '1.25rem 1rem',
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  border: '1px solid ' + c.iconBg,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}>
                  <div style={{ width: '2.75rem', height: '2.75rem', borderRadius: '0.75rem', background: c.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className={`bi ${c.icon}`} style={{ color: c.text, fontSize: '1.25rem' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: c.text, lineHeight: 1 }}>{c.value}</div>
                    <div style={{ fontSize: '0.78rem', color: c.text, opacity: 0.8, fontWeight: 600 }}>{c.label}</div>
                  </div>
                </div>
              ))}
              {/* Rate card */}
              <div style={{
                background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)', borderRadius: '1rem',
                padding: '1.25rem 1rem', display: 'flex', alignItems: 'center', gap: '1rem',
                boxShadow: '0 2px 8px rgba(37,99,235,0.2)',
              }}>
                <div style={{ width: '2.75rem', height: '2.75rem', borderRadius: '0.75rem', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className="bi bi-graph-up-arrow" style={{ color: '#fff', fontSize: '1.25rem' }} />
                </div>
                <div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{summary.rate}%</div>
                  <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>Attendance Rate</div>
                  <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.2rem' }}>
                    {summary.rate >= 85 ? '✅ Good Standing' : summary.rate >= 70 ? '⚠️ Needs Improvement' : '❌ Below Minimum'}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Info bar ── */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '0.75rem 1.25rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center' }}>
              <span style={{ color: '#64748b', fontSize: '0.85rem' }}>
                <i className="bi bi-info-circle" style={{ marginRight: '0.4rem', color: '#3b82f6' }} />
                Attendance % = (Present ÷ School Days) × 100 &nbsp;&nbsp; <em>Holidays and leave are excluded from the denominator.</em>
              </span>
              {summary.lastDate && (
                <span style={{ color: '#64748b', fontSize: '0.85rem', marginLeft: 'auto' }}>
                  <i className="bi bi-clock" style={{ marginRight: '0.4rem' }} /> Last recorded: <strong>{formatDate(summary.lastDate)}</strong>
                </span>
              )}
            </div>

            {/* ── Monthly Chart ── */}
            {monthlyData.length > 0 && (
              <div style={{ background: '#fff', borderRadius: '1.25rem', border: '1px solid #e2e8f0', padding: '1.5rem', marginBottom: '1.75rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <h3 style={{ margin: '0 0 1.25rem', fontWeight: 700, color: '#1e293b', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <i className="bi bi-bar-chart-fill" style={{ color: '#3b82f6' }} /> Monthly Attendance Overview
                </h3>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', overflowX: 'auto', paddingBottom: '0.5rem', minHeight: '150px' }}>
                  {monthlyData.map((m, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem', minWidth: '70px', flex: '1 0 70px' }}>
                      {/* stacked bar */}
                      <div style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column-reverse', height: '120px' }}>
                        {[
                          { count: m.present, color: '#10b981' },
                          { count: m.absent,  color: '#ef4444' },
                          { count: m.leave,   color: '#f59e0b' },
                        ].map((seg, si) => (
                          seg.count > 0 ? (
                            <div key={si} title={`${['Present','Absent','Leave'][si]}: ${seg.count}`}
                              style={{
                                width: '100%', background: seg.color, borderRadius: si === 0 ? '0.375rem 0.375rem 0 0' : '0',
                                height: `${(seg.count / maxBarPct) * 120}px`,
                                transition: 'height 0.3s',
                              }}
                            />
                          ) : null
                        ))}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textAlign: 'center' }}>{m.label}</div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e293b' }}>{pct(m.present, m.total)}%</div>
                    </div>
                  ))}
                </div>
                {/* legend */}
                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                  {[['Present', '#10b981'], ['Absent', '#ef4444'], ['Leave', '#f59e0b']].map(([l, c]) => (
                    <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#64748b' }}>
                      <div style={{ width: '0.75rem', height: '0.75rem', borderRadius: '0.2rem', background: c }} /> {l}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Filters ── */}
            <div style={{ background: '#fff', borderRadius: '1.25rem', border: '1px solid #e2e8f0', padding: '1.25rem 1.5rem', marginBottom: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
                {/* status filter */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Status</label>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {['All', 'Present', 'Absent', 'Leave'].map(s => (
                      <button key={s} onClick={() => setFilterStatus(s)} style={{
                        padding: '0.35rem 0.9rem', borderRadius: '2rem', border: '1.5px solid',
                        borderColor: filterStatus === s ? '#2563eb' : '#e2e8f0',
                        background: filterStatus === s ? '#2563eb' : '#f8fafc',
                        color: filterStatus === s ? '#fff' : '#64748b',
                        fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s',
                      }}>{s}</button>
                    ))}
                  </div>
                </div>
                {/* month filter */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Month</label>
                  <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} style={{ padding: '0.4rem 0.75rem', borderRadius: '0.5rem', border: '1.5px solid #e2e8f0', background: '#f8fafc', color: '#1e293b', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
                    <option value="All">All Months</option>
                    {availableMonths.map(m => {
                      const [yr, mo] = m.split('-');
                      return <option key={m} value={m}>{MONTHS[parseInt(mo) - 1]} {yr}</option>;
                    })}
                  </select>
                </div>
                {/* date search */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Specific Date</label>
                  <input type="date" value={searchDate} onChange={e => setSearchDate(e.target.value)} style={{ padding: '0.4rem 0.75rem', borderRadius: '0.5rem', border: '1.5px solid #e2e8f0', background: '#f8fafc', color: '#1e293b', fontWeight: 600, fontSize: '0.85rem' }} />
                </div>
                {(filterStatus !== 'All' || filterMonth !== 'All' || searchDate) && (
                  <button onClick={() => { setFilterStatus('All'); setFilterMonth('All'); setSearchDate(''); }} style={{ padding: '0.4rem 1rem', borderRadius: '0.5rem', border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', alignSelf: 'flex-end' }}>
                    <i className="bi bi-x-circle" style={{ marginRight: '0.3rem' }} /> Clear
                  </button>
                )}
                <div style={{ marginLeft: 'auto', alignSelf: 'flex-end', fontSize: '0.82rem', color: '#64748b' }}>
                  Showing <strong>{filteredRecords.length}</strong> of <strong>{records.length}</strong> records
                </div>
              </div>
            </div>

            {/* ── Detail Table ── */}
            <div style={{ background: '#fff', borderRadius: '1.25rem', border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0, fontWeight: 700, color: '#1e293b', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <i className="bi bi-table" style={{ color: '#3b82f6' }} /> Attendance Record History
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>Latest records first</span>
              </div>

              {filteredRecords.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center' }}>
                  <i className="bi bi-search" style={{ fontSize: '2.5rem', color: '#cbd5e1' }} />
                  <p style={{ color: '#94a3b8', marginTop: '1rem', fontWeight: 500 }}>No records match the selected filters.</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        {['Sl.', 'Date', 'Day', 'Status', 'Recorded By'].map(h => (
                          <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecords.map((r, idx) => {
                        const sc = statusColor[r.attendance_status] || statusColor.Present;
                        const icon = statusIcon[r.attendance_status] || 'bi-circle';
                        return (
                          <tr key={r.attendance_id || idx} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <td style={{ padding: '0.75rem 1rem', color: '#94a3b8', fontWeight: 600 }}>#{filteredRecords.length - idx}</td>
                            <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#1e293b' }}>{formatDate(r.attendance_date)}</td>
                            <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>{getDayName(r.attendance_date)}</td>
                            <td style={{ padding: '0.75rem 1rem' }}>
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                                padding: '0.2rem 0.75rem', borderRadius: '2rem',
                                background: sc.bg, color: sc.text,
                                border: `1px solid ${sc.border}`,
                                fontWeight: 700, fontSize: '0.8rem',
                              }}>
                                <i className={`bi ${icon}`} style={{ fontSize: '0.75rem' }} />
                                {r.attendance_status}
                              </span>
                            </td>
                            <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>{r.marked_by_name || r.marked_by || '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
