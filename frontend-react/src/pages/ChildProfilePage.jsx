import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import TopHeader from '../components/TopHeader';

const API = 'http://localhost:8000/api';

const getPhotoUrl = (photo) => {
  if (!photo) return null;
  if (typeof photo !== 'string') return null;
  if (photo.startsWith('http://') || photo.startsWith('https://')) return photo;
  if (photo.startsWith('/media/')) return `http://localhost:8000${photo}`;
  if (photo.startsWith('/')) return `http://localhost:8000${photo}`;
  return `http://localhost:8000/media/${photo}`;
};

const emptyForm = {
  full_name: '',
  date_of_birth: '',
  gender: 'Male',
  admission_date: new Date().toISOString().slice(0, 10),
  has_guardian: true,
  guardian_name: '',
  guardian_relation: 'Father',
  blood_group: '',
  aadhar_number: '',
  status: 'Active',
  previous_school: '',
  photo: null,
};

const RELATION_OPTIONS = ['Father', 'Mother', 'Guardian', 'Uncle', 'Aunt', 'Grandparent', 'Other'];

const calcAge = (dob) => {
  if (!dob) return { label: '—', years: 0 };
  const d = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return { label: `${age} yrs`, years: age };
};

const getGrade = (m) => {
  if (m >= 90) return { grade: 'A+', cls: 'badge-green' };
  if (m >= 80) return { grade: 'A', cls: 'badge-green' };
  if (m >= 70) return { grade: 'B', cls: 'badge-accent' };
  if (m >= 60) return { grade: 'C', cls: 'badge-amber' };
  if (m >= 40) return { grade: 'D', cls: 'badge-rose' };
  return { grade: 'F', cls: 'badge-rose' };
};

const AVATAR_COLORS = ['#4f46e5', '#7c3aed', '#2563eb', '#059669', '#d97706', '#db2777', '#0891b2', '#65a30d'];

function Avatar({ child, size = 36, idx = 0 }) {
  const bg = AVATAR_COLORS[idx % AVATAR_COLORS.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', overflow: 'hidden',
      background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 800, color: '#fff', flexShrink: 0,
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)', border: '2px solid rgba(255,255,255,0.2)',
    }}>
      {child.photo ? (
        <img src={getPhotoUrl(child.photo)} alt={child.full_name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={e => { e.target.style.display = 'none'; e.target.nextSibling && (e.target.nextSibling.style.display = 'flex'); }} />
      ) : null}
      <div style={{ width: '100%', height: '100%', display: child.photo ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {child.full_name?.charAt(0)}
      </div>
    </div>
  );
}

// ─── Comprehensive Child Detail Modal ───────────────────────────────────────
function ChildDetailModal({ child, eduRecords, healthRecords, achieveRecords, attendRecords, onClose, onEdit, onDelete, idx }) {
  const [tab, setTab] = useState('personal');

  const childEdu = eduRecords.filter(r => r.child === child.child_id);
  const childHealth = healthRecords.filter(r => r.child === child.child_id);
  const childAchieve = achieveRecords.filter(r => r.child === child.child_id);
  const childAttend = attendRecords.filter(r => r.child === child.child_id);
  const presentCount = childAttend.filter(r => r.attendance_status === 'Present').length;
  const totalCount = childAttend.length;
  const attPct = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : null;

  const { label: ageLabel, years: ageYrs } = calcAge(child.date_of_birth);
  const statusColors = { Active: 'badge-green', Inactive: 'badge-muted', Adopted: 'badge-accent' };

  const guardianDisplayName = child.guardian_name || child.father_name || child.mother_name || '';
  const guardianRelation = (child.guardian_relation && child.guardian_relation !== 'None')
    ? child.guardian_relation
    : (child.father_name ? 'Father' : child.mother_name ? 'Mother' : (guardianDisplayName ? 'Guardian' : 'None'));
  const hasGuardian = Boolean(guardianDisplayName.trim() && guardianRelation !== 'None');

  const TABS = [
    { key: 'personal', icon: 'bi-person-fill', label: 'Personal' },
    { key: 'guardian', icon: 'bi-people-fill', label: 'Parent / Guardian' },
    { key: 'study', icon: 'bi-mortarboard-fill', label: `Study (${childEdu.length})` },
    { key: 'health', icon: 'bi-heart-pulse-fill', label: `Health (${childHealth.length})` },
    { key: 'achievements', icon: 'bi-trophy-fill', label: `Awards (${childAchieve.length})` },
    { key: 'attendance', icon: 'bi-calendar-check-fill', label: `Attend.` },
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 640, width: '96vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div className="modal-header" style={{ flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <Avatar child={child} size={56} idx={idx} />
            <div>
              <h4 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '1.1rem' }}>{child.full_name}</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>ID #{child.child_id}</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>•</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{ageLabel} • {child.gender}</span>
                <span className={`badge ${statusColors[child.status] || 'badge-muted'}`} style={{ fontSize: '0.65rem' }}>{child.status}</span>
              </div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><i className="bi bi-x-lg" /></button>
        </div>

        {/* Tab Bar */}
        <div style={{ display: 'flex', gap: '0.15rem', borderBottom: '1px solid #e2e8f0', padding: '0 0.5rem', flexShrink: 0, overflowX: 'auto' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              background: 'none', border: 'none', padding: '0.55rem 0.65rem', cursor: 'pointer', whiteSpace: 'nowrap',
              fontSize: '0.75rem', fontWeight: tab === t.key ? 700 : 500,
              color: tab === t.key ? 'var(--accent)' : 'var(--text-muted)',
              borderBottom: tab === t.key ? '2px solid var(--accent)' : '2px solid transparent',
              display: 'flex', alignItems: 'center', gap: '0.3rem', transition: 'all 0.15s',
            }}>
              <i className={`bi ${t.icon}`} style={{ fontSize: '0.78rem' }} /> {t.label}
            </button>
          ))}
        </div>

        {/* Tab Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 0.25rem 0.5rem' }}>

          {/* ── PERSONAL ── */}
          {tab === 'personal' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {[
                { label: 'Full Name', val: child.full_name },
                { label: 'Date of Birth', val: `${child.date_of_birth || '—'} (${ageLabel})` },
                { label: 'Gender', val: child.gender || '—' },
                { label: 'Blood Group', val: child.blood_group, accent: true },
                { label: 'Aadhaar Number', val: child.aadhar_number || '—' },
                { label: 'Admission Date', val: child.admission_date || '—' },
                { label: 'Previous School', val: child.previous_school || 'None recorded' },
                { label: 'Status', val: child.status },
                { label: 'Category', val: ageYrs < 5 ? 'Below 5 (Toddler)' : '5+ (School Age)' },
                { label: 'Email (Login)', val: child.email, small: true },
              ].map(({ label, val, accent, small }) => (
                <div key={label} style={{ background: 'var(--bg-surface-3)', borderRadius: '0.5rem', padding: '0.6rem 0.85rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
                  <div style={{ fontWeight: 700, fontSize: small ? '0.72rem' : '0.88rem', color: accent ? '#f87171' : 'var(--text-primary)', wordBreak: 'break-all' }}>{val || '—'}</div>
                </div>
              ))}
            </div>
          )}

          {/* ── GUARDIAN / PARENT ── */}
          {tab === 'guardian' && (
            <div>
              {hasGuardian ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {/* Guardian banner */}
                  <div style={{ background: 'linear-gradient(135deg, rgba(79,70,229,0.12), rgba(124,58,237,0.12))', border: '1px solid rgba(124,58,237,0.2)', borderRadius: '0.75rem', padding: '1rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <i className={`bi ${guardianRelation === 'Father' ? 'bi-person-fill' : guardianRelation === 'Mother' ? 'bi-person-heart' : 'bi-shield-heart-fill'}`} style={{ fontSize: '1.4rem', color: '#a78bfa' }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                        {guardianDisplayName}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#a78bfa', marginTop: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <i className="bi bi-person-badge-fill" />
                        <span>Relationship: <strong>{guardianRelation}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Parent / Guardian detail grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                    <div style={{ background: 'var(--bg-surface-3)', borderRadius: '0.5rem', padding: '0.65rem 0.85rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <i className="bi bi-person-fill" /> Parent / Guardian Name
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{guardianDisplayName}</div>
                    </div>
                    <div style={{ background: 'var(--bg-surface-3)', borderRadius: '0.5rem', padding: '0.65rem 0.85rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <i className="bi bi-link-45deg" /> Relationship
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{guardianRelation}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="bi bi-person-x-fill" style={{ fontSize: '1.8rem', color: '#f87171' }} />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>No Parents / Orphan</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>This child has no known parents or guardians registered in the orphanage.</div>
                </div>
              )}
            </div>
          )}

          {/* ── STUDY ── */}
          {tab === 'study' && (
            <div>
              {childEdu.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  <i className="bi bi-book" style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem', color: '#60a5fa' }} />
                  No study records found for this child.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {/* Summary bar */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    {(() => {
                      const avg = childEdu.reduce((a, r) => a + parseFloat(r.marks || 0), 0) / childEdu.length;
                      const { grade, cls } = getGrade(avg);
                      return [
                        { label: 'Subjects', val: childEdu.length, icon: 'bi-journals' },
                        { label: 'Avg Score', val: `${avg.toFixed(1)}%`, icon: 'bi-bar-chart-fill' },
                        { label: 'Overall Grade', val: grade, icon: 'bi-award-fill', badge: cls },
                      ].map(({ label, val, icon, badge }) => (
                        <div key={label} style={{ background: 'var(--bg-surface-3)', borderRadius: '0.5rem', padding: '0.6rem', textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <i className={`bi ${icon}`} style={{ fontSize: '1rem', color: 'var(--accent)', display: 'block', marginBottom: '0.2rem' }} />
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{label}</div>
                          {badge ? <span className={`badge ${badge}`} style={{ fontSize: '0.82rem', fontWeight: 800, marginTop: '0.15rem', display: 'inline-block' }}>{val}</span>
                            : <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>{val}</div>}
                        </div>
                      ));
                    })()}
                  </div>

                  {childEdu.map(r => {
                    const score = parseFloat(r.marks || 0);
                    const { grade, cls } = getGrade(score);
                    const barW = Math.min(100, score);
                    const barColor = score >= 70 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';
                    return (
                      <div key={r.education_id} style={{ background: 'var(--bg-surface-3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '0.5rem', padding: '0.7rem 0.9rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                              {r.subject} <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>({r.class_name})</span>
                            </div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>Exam: {r.exam_date || '—'}</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{score}%</span>
                            <span className={`badge ${cls}`} style={{ fontSize: '0.68rem' }}>{grade}</span>
                          </div>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '99px', height: 5, overflow: 'hidden' }}>
                          <div style={{ width: `${barW}%`, height: '100%', background: barColor, borderRadius: '99px', transition: 'width 0.5s ease' }} />
                        </div>
                        {r.remarks && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.3rem', fontStyle: 'italic' }}>"{r.remarks}"</div>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── HEALTH ── */}
          {tab === 'health' && (
            <div>
              {childHealth.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  <i className="bi bi-heart-pulse" style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem', color: '#f87171' }} />
                  No health checkup records found.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {/* Latest summary cards */}
                  {(() => {
                    const latest = childHealth[0];
                    const bmi = latest ? (parseFloat(latest.weight_kg) / Math.pow(parseFloat(latest.height_cm) / 100, 2)).toFixed(1) : null;
                    const bmiStatus = bmi ? (bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese') : null;
                    const bmiColor = bmi ? (bmi < 18.5 ? '#f59e0b' : bmi < 25 ? '#22c55e' : bmi < 30 ? '#f97316' : '#ef4444') : '#94a3b8';
                    if (!latest) return null;
                    return (
                      <div style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(248,113,113,0.05))', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '0.75rem', padding: '0.85rem 1rem', marginBottom: '0.5rem' }}>
                        <div style={{ fontSize: '0.72rem', color: '#f87171', fontWeight: 700, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          <i className="bi bi-activity" style={{ marginRight: '0.3rem' }} />Latest Checkup — {latest.checkup_date}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                          {[
                            { label: 'Height', val: `${latest.height_cm} cm`, icon: 'bi-arrows-vertical', color: '#60a5fa' },
                            { label: 'Weight', val: `${latest.weight_kg} kg`, icon: 'bi-speedometer2', color: '#34d399' },
                            { label: 'BMI', val: bmi, icon: 'bi-bar-chart-line-fill', color: bmiColor },
                            { label: 'Status', val: latest.status || bmiStatus, icon: 'bi-heart-fill', color: '#a78bfa' },
                          ].map(({ label, val, icon, color }) => (
                            <div key={label} style={{ textAlign: 'center' }}>
                              <i className={`bi ${icon}`} style={{ fontSize: '1rem', color, display: 'block' }} />
                              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{label}</div>
                              <div style={{ fontWeight: 800, fontSize: '0.82rem', color: 'var(--text-primary)' }}>{val || '—'}</div>
                            </div>
                          ))}
                        </div>
                        {latest.notes && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.6rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.5rem', fontStyle: 'italic' }}>Notes: {latest.notes}</div>}
                      </div>
                    );
                  })()}

                  {/* All records */}
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.3rem', marginTop: '0.25rem' }}>All Checkup Records ({childHealth.length})</div>
                  {childHealth.map(h => {
                    const bmi = (parseFloat(h.weight_kg) / Math.pow(parseFloat(h.height_cm) / 100, 2)).toFixed(1);
                    const statusColor = h.status === 'Healthy' ? '#22c55e' : h.status === 'Critical' ? '#ef4444' : '#f59e0b';
                    return (
                      <div key={h.health_id} style={{ background: 'var(--bg-surface-3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '0.5rem', padding: '0.65rem 0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                        <div>
                          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>{h.checkup_date}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                            H: {h.height_cm}cm • W: {h.weight_kg}kg • BMI: {bmi}
                          </div>
                          {h.notes && <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '0.1rem' }}>{h.notes}</div>}
                        </div>
                        <span style={{ background: `${statusColor}20`, color: statusColor, border: `1px solid ${statusColor}40`, padding: '0.2rem 0.55rem', borderRadius: '99px', fontSize: '0.7rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                          {h.status || 'Healthy'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── ACHIEVEMENTS ── */}
          {tab === 'achievements' && (
            <div>
              {childAchieve.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  <i className="bi bi-trophy" style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem', color: '#f59e0b' }} />
                  No achievements recorded yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {childAchieve.map((a, ai) => {
                    const catColors = { Academic: '#60a5fa', Sports: '#34d399', Art: '#f472b6', Music: '#a78bfa', Other: '#f59e0b' };
                    const cc = catColors[a.category] || '#94a3b8';
                    return (
                      <div key={a.achievement_id} style={{ background: 'var(--bg-surface-3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '0.6rem', padding: '0.75rem 0.9rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${cc}20`, border: `1px solid ${cc}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <i className="bi bi-trophy-fill" style={{ color: cc, fontSize: '0.9rem' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{a.title}</div>
                            <span style={{ background: `${cc}15`, color: cc, border: `1px solid ${cc}30`, padding: '0.15rem 0.45rem', borderRadius: '99px', fontSize: '0.65rem', fontWeight: 700, marginLeft: '0.5rem', flexShrink: 0 }}>{a.category}</span>
                          </div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{a.achievement_date}</div>
                          {a.description && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>{a.description}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── ATTENDANCE ── */}
          {tab === 'attendance' && (
            <div>
              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '0.85rem' }}>
                {[
                  { label: 'Total Days', val: totalCount, icon: 'bi-calendar3', color: '#60a5fa' },
                  { label: 'Present', val: presentCount, icon: 'bi-check-circle-fill', color: '#22c55e' },
                  { label: 'Attendance %', val: attPct !== null ? `${attPct}%` : '—', icon: 'bi-bar-chart-fill', color: attPct >= 75 ? '#22c55e' : attPct >= 50 ? '#f59e0b' : '#ef4444' },
                ].map(({ label, val, icon, color }) => (
                  <div key={label} style={{ background: 'var(--bg-surface-3)', borderRadius: '0.5rem', padding: '0.65rem', textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <i className={`bi ${icon}`} style={{ fontSize: '1.1rem', color, display: 'block', marginBottom: '0.2rem' }} />
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>{val}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{label}</div>
                  </div>
                ))}
              </div>

              {attPct !== null && (
                <div style={{ marginBottom: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>Attendance Rate</span><span style={{ fontWeight: 700 }}>{attPct}%</span>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '99px', height: 8 }}>
                    <div style={{ width: `${attPct}%`, height: '100%', borderRadius: '99px', background: attPct >= 75 ? '#22c55e' : attPct >= 50 ? '#f59e0b' : '#ef4444', transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              )}

              {childAttend.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <i className="bi bi-calendar-x" style={{ fontSize: '1.8rem', display: 'block', marginBottom: '0.4rem' }} />
                  No attendance records found.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: 250, overflowY: 'auto' }}>
                  {childAttend.slice(0, 30).map(a => {
                    const st = a.attendance_status;
                    const isPresent = st === 'Present';
                    const isLeave   = st === 'Leave';
                    const badgeColor = isPresent ? '#22c55e' : isLeave ? '#f59e0b' : '#ef4444';
                    const badgeBg   = isPresent ? 'rgba(34,197,94,0.1)' : isLeave ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)';
                    const badgeBorder = isPresent ? 'rgba(34,197,94,0.25)' : isLeave ? 'rgba(245,158,11,0.25)' : 'rgba(239,68,68,0.25)';
                    const icon = isPresent ? 'bi-check2' : isLeave ? 'bi-calendar2-minus' : 'bi-x';
                    return (
                      <div key={a.attendance_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface-3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '0.4rem', padding: '0.4rem 0.7rem' }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 600 }}>{a.attendance_date}</span>
                        <span style={{
                          fontSize: '0.7rem', fontWeight: 700,
                          color: badgeColor,
                          background: badgeBg,
                          border: `1px solid ${badgeBorder}`,
                          padding: '0.15rem 0.5rem', borderRadius: '99px',
                        }}>
                          <i className={`bi ${icon}`} style={{ marginRight: '0.2rem' }} />
                          {st}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0.25rem 0', borderTop: '1px solid #e2e8f0', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-primary btn-sm" onClick={() => { onClose(); onEdit(child); }}>
              <i className="bi bi-pencil" /> Edit
            </button>
            <button className="btn btn-danger btn-sm" onClick={() => { onClose(); onDelete(child.child_id, child.full_name); }}>
              <i className="bi bi-trash" /> Delete
            </button>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ─── All Children Overview Modal ─────────────────────────────────────────────
function AllChildrenModal({ children, eduRecords, healthRecords, achieveRecords, attendRecords, onClose, onViewChild, onEdit }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  // Default to ALL children expanded so all details are displayed immediately without blank space
  const [expandedIds, setExpandedIds] = useState(() => new Set(children.map(c => c.child_id)));

  const toggleExpand = (id) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedIds(new Set(children.map(c => c.child_id)));
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  const filtered = children.filter(c => {
    const q = search.toLowerCase();
    const matchSearch =
      c.full_name?.toLowerCase().includes(q) ||
      c.guardian_name?.toLowerCase().includes(q) ||
      c.father_name?.toLowerCase().includes(q) ||
      c.mother_name?.toLowerCase().includes(q) ||
      c.aadhar_number?.toLowerCase().includes(q) ||
      c.previous_school?.toLowerCase().includes(q);
    return matchSearch && (statusFilter === 'All' || c.status === statusFilter);
  });

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="modal-box"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: 1060,
          width: '96vw',
          height: '92vh',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '1.25rem 1.5rem',
          overflow: 'hidden',
          background: '#ffffff',
          borderRadius: '1rem',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
        }}
      >
        {/* Header */}
        <div className="modal-header" style={{ flexShrink: 0, paddingBottom: '0.75rem', marginBottom: '0.65rem' }}>
          <div>
            <h4 style={{ margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.18rem', fontWeight: 800 }}>
              <i className="bi bi-people-fill" style={{ color: 'var(--accent)' }} />
              All Children Details (Complete Profiles)
            </h4>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Showing {filtered.length} of {children.length} children • All records expanded with Attendance, Study, Health &amp; Achievements
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} title="Close Modal">
            <i className="bi bi-x-lg" />
          </button>
        </div>

        {/* Search & Actions Bar */}
        <div style={{ padding: '0.5rem 0 0.85rem 0', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: '0.6rem', flex: 1, minWidth: 260, alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: 360, minWidth: 200 }}>
              <i className="bi bi-search" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.85rem', pointerEvents: 'none' }} />
              <input
                type="text"
                className="form-control"
                placeholder="Search children, parents, aadhaar..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: '2.2rem', paddingRight: search ? '2rem' : '0.75rem', fontSize: '0.82rem', height: '36px' }}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  style={{ position: 'absolute', right: '0.55rem', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}
                >
                  <i className="bi bi-x-circle-fill" />
                </button>
              )}
            </div>

            <select
              className="form-control"
              style={{ width: 'auto', fontSize: '0.8rem', height: '36px', padding: '0 0.75rem' }}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="All">All Status</option>
              <option value="Active">Active Only</option>
              <option value="Inactive">Inactive</option>
              <option value="Adopted">Adopted</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={expandAll} style={{ fontSize: '0.76rem', padding: '0.4rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <i className="bi bi-arrows-expand" /> Expand All ({filtered.length})
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={collapseAll} style={{ fontSize: '0.76rem', padding: '0.4rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <i className="bi bi-arrows-collapse" /> Collapse All
            </button>
          </div>
        </div>

        {/* Children Cards List (Flex-shrink 0 on children so they never squash to blank lines!) */}
        <div style={{ flex: '1 1 0', minHeight: 0, overflowY: 'auto', padding: '0.85rem 0.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)', background: '#f8fafc', borderRadius: '0.75rem', border: '1px dashed #cbd5e1' }}>
              <i className="bi bi-inbox" style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }} />
              <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>No children found matching "{search}"</div>
              <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Try clearing the search or changing status filter.</div>
              {search && (
                <button className="btn btn-secondary btn-sm" style={{ marginTop: '0.75rem' }} onClick={() => setSearch('')}>
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            filtered.map((child, idx) => {
              const isExpanded = expandedIds.has(child.child_id);
              const childEdu = eduRecords.filter(r => r.child === child.child_id);
              const childHealth = healthRecords.filter(r => r.child === child.child_id);
              const childAchieve = achieveRecords.filter(r => r.child === child.child_id);
              const childAttend = (attendRecords || []).filter(r => r.child === child.child_id);

              const presentCount = childAttend.filter(r => r.attendance_status === 'Present').length;
              const totalDays = childAttend.length;
              const attPct = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : null;

              const latestHealth = childHealth[0];
              const latestBMI = latestHealth
                ? (parseFloat(latestHealth.weight_kg) / Math.pow(parseFloat(latestHealth.height_cm) / 100, 2)).toFixed(1)
                : null;
              const bmiStatus = latestBMI ? (latestBMI < 18.5 ? 'Underweight' : latestBMI < 25 ? 'Normal' : latestBMI < 30 ? 'Overweight' : 'Obese') : null;

              const avgScore = childEdu.length > 0
                ? (childEdu.reduce((a, r) => a + parseFloat(r.marks || 0), 0) / childEdu.length).toFixed(1)
                : null;
              const { grade: avgGrade } = avgScore ? getGrade(parseFloat(avgScore)) : { grade: null };

              const { label: ageLabel, years: ageYrs } = calcAge(child.date_of_birth);
              const statusColors = { Active: '#16a34a', Inactive: '#94a3b8', Adopted: '#2563eb' };
              const sc = statusColors[child.status] || '#94a3b8';

              const gName = child.guardian_name || child.father_name || child.mother_name || '';
              const gRel = (child.guardian_relation && child.guardian_relation !== 'None')
                ? child.guardian_relation
                : (child.father_name ? 'Father' : child.mother_name ? 'Mother' : (gName ? 'Guardian' : 'None'));
              const hasGuardian = Boolean(gName.trim() && gRel !== 'None');

              return (
                <div
                  key={child.child_id}
                  style={{
                    background: '#ffffff',
                    border: isExpanded ? '1.5px solid var(--accent)' : '1px solid #e2e8f0',
                    borderRadius: '0.75rem',
                    boxShadow: isExpanded ? '0 4px 16px rgba(79,70,229,0.08)' : '0 1px 4px rgba(0,0,0,0.04)',
                    transition: 'all 0.15s ease',
                    overflow: 'hidden',
                    flexShrink: 0,
                    width: '100%'
                  }}
                >
                  {/* Header Row (Always visible, Never squashed) */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.85rem',
                      padding: '0.85rem 1rem',
                      cursor: 'pointer',
                      background: isExpanded ? 'rgba(79,70,229,0.03)' : '#ffffff',
                      transition: 'background 0.15s',
                      minHeight: 64,
                      userSelect: 'none'
                    }}
                    onClick={() => toggleExpand(child.child_id)}
                  >
                    <Avatar child={child} size={44} idx={idx} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.94rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {child.full_name}
                        <span style={{ color: sc, background: `${sc}15`, border: `1px solid ${sc}35`, padding: '0.1rem 0.5rem', borderRadius: '99px', fontSize: '0.68rem', fontWeight: 700 }}>
                          {child.status}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>ID #{child.child_id}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, color: '#334155' }}>{ageLabel} ({child.gender})</span>
                        <span>•</span>
                        <span>{ageYrs < 5 ? 'Toddler' : 'School Age'}</span>
                        {child.blood_group && (
                          <>
                            <span>•</span>
                            <span style={{ color: '#dc2626', fontWeight: 700 }}>Blood: {child.blood_group}</span>
                          </>
                        )}
                        <span>•</span>
                        <span style={{ color: hasGuardian ? '#2563eb' : '#dc2626', fontWeight: 600 }}>
                          {hasGuardian ? `${gRel}: ${gName}` : 'No Parents (Orphan)'}
                        </span>
                      </div>
                    </div>

                    {/* Quick Stat Badges */}
                    <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end' }}>
                      {/* Attendance Pill */}
                      <div style={{
                        textAlign: 'center', padding: '0.25rem 0.55rem', borderRadius: '0.45rem',
                        background: attPct !== null ? (attPct >= 75 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)') : '#f8fafc',
                        border: `1px solid ${attPct !== null ? (attPct >= 75 ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)') : '#e2e8f0'}`,
                        minWidth: 64
                      }}>
                        <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Attend.</div>
                        <div style={{ fontWeight: 800, fontSize: '0.8rem', color: attPct !== null ? (attPct >= 75 ? '#16a34a' : '#dc2626') : 'var(--text-muted)' }}>
                          {attPct !== null ? `${attPct}%` : 'No logs'}
                        </div>
                      </div>

                      {/* Study Pill */}
                      <div style={{
                        textAlign: 'center', padding: '0.25rem 0.55rem', borderRadius: '0.45rem',
                        background: avgScore ? 'rgba(59,130,246,0.1)' : '#f8fafc',
                        border: `1px solid ${avgScore ? 'rgba(59,130,246,0.25)' : '#e2e8f0'}`,
                        minWidth: 68
                      }}>
                        <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Study Avg</div>
                        <div style={{ fontWeight: 800, fontSize: '0.8rem', color: avgScore ? '#2563eb' : 'var(--text-muted)' }}>
                          {avgScore ? `${avgScore}%` : 'No exams'}
                        </div>
                      </div>

                      {/* Health Pill */}
                      <div style={{
                        textAlign: 'center', padding: '0.25rem 0.55rem', borderRadius: '0.45rem',
                        background: latestBMI ? 'rgba(16,185,129,0.1)' : '#f8fafc',
                        border: `1px solid ${latestBMI ? 'rgba(16,185,129,0.25)' : '#e2e8f0'}`,
                        minWidth: 64
                      }}>
                        <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>BMI</div>
                        <div style={{ fontWeight: 800, fontSize: '0.8rem', color: latestBMI ? '#059669' : 'var(--text-muted)' }}>
                          {latestBMI || 'None'}
                        </div>
                      </div>

                      {/* Awards Pill */}
                      <div style={{
                        textAlign: 'center', padding: '0.25rem 0.55rem', borderRadius: '0.45rem',
                        background: childAchieve.length > 0 ? 'rgba(245,158,11,0.1)' : '#f8fafc',
                        border: `1px solid ${childAchieve.length > 0 ? 'rgba(245,158,11,0.25)' : '#e2e8f0'}`,
                        minWidth: 55
                      }}>
                        <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Awards</div>
                        <div style={{ fontWeight: 800, fontSize: '0.8rem', color: childAchieve.length > 0 ? '#d97706' : 'var(--text-muted)' }}>
                          {childAchieve.length}
                        </div>
                      </div>

                      {/* Expand/Collapse Chevron Indicator */}
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%', background: isExpanded ? 'var(--accent)' : '#f1f5f9',
                        color: isExpanded ? '#fff' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: '0.25rem'
                      }}>
                        <i className={`bi ${isExpanded ? 'bi-chevron-up' : 'bi-chevron-down'}`} style={{ fontSize: '0.78rem' }} />
                      </div>
                    </div>
                  </div>

                  {/* Complete Expanded Details - All sections populated cleanly */}
                  {isExpanded && (
                    <div style={{ borderTop: '1px solid #e2e8f0', padding: '1.1rem', background: '#fafbfc', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

                      {/* 1. PERSONAL & GUARDIAN DETAILS */}
                      <div>
                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <i className="bi bi-person-lines-fill" style={{ color: 'var(--accent)' }} /> Personal &amp; Background Information
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.55rem' }}>
                          {[
                            { label: 'Full Name', val: child.full_name },
                            { label: 'Date of Birth', val: `${child.date_of_birth || 'Not specified'} (${ageLabel})` },
                            { label: 'Gender', val: child.gender || 'Not specified' },
                            { label: 'Blood Group', val: child.blood_group || 'Not recorded', color: child.blood_group ? '#dc2626' : undefined },
                            { label: 'Aadhaar Number', val: child.aadhar_number || 'Not registered' },
                            { label: 'Admission Date', val: child.admission_date || 'Not recorded' },
                            { label: 'Previous School', val: child.previous_school || 'None / Not attended' },
                            { label: 'Parent / Guardian', val: hasGuardian ? `${gName} (${gRel})` : 'No Parents (Orphan)', color: hasGuardian ? '#2563eb' : '#dc2626' },
                            { label: 'Status', val: child.status },
                            { label: 'Category', val: ageYrs < 5 ? 'Below 5 (Toddler)' : '5+ (School Age)' },
                            { label: 'Email / Login', val: child.email || `${child.full_name?.toLowerCase().replace(/[^a-z0-9]/g, '.')}@child.orphanage.com` },
                          ].map(({ label, val, color }) => (
                            <div key={label} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '0.45rem', padding: '0.45rem 0.65rem' }}>
                              <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>{label}</div>
                              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: color || 'var(--text-primary)', marginTop: '0.15rem', wordBreak: 'break-all' }}>{val || '—'}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 2. ATTENDANCE DETAILS */}
                      <div>
                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#16a34a', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <i className="bi bi-calendar-check-fill" /> Attendance Records ({totalDays} Days Logged)
                        </div>
                        {childAttend.length === 0 ? (
                          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '0.45rem', padding: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                            <i className="bi bi-calendar-x" style={{ marginRight: '0.35rem' }} /> No attendance records logged for this child yet.
                          </div>
                        ) : (
                          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                            {/* Attendance Stats bar */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
                              <div style={{ background: '#f8fafc', padding: '0.45rem', borderRadius: '0.35rem', border: '1px solid #e2e8f0' }}>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Days</div>
                                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{totalDays}</div>
                              </div>
                              <div style={{ background: '#f0fdf4', padding: '0.45rem', borderRadius: '0.35rem', border: '1px solid #bbf7d0' }}>
                                <div style={{ fontSize: '0.65rem', color: '#16a34a', fontWeight: 600 }}>Present</div>
                                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#16a34a' }}>{presentCount}</div>
                              </div>
                              <div style={{ background: '#fef2f2', padding: '0.45rem', borderRadius: '0.35rem', border: '1px solid #fecaca' }}>
                                <div style={{ fontSize: '0.65rem', color: '#dc2626', fontWeight: 600 }}>Absent</div>
                                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#dc2626' }}>{totalDays - presentCount}</div>
                              </div>
                              <div style={{ background: attPct >= 75 ? '#f0fdf4' : '#fef2f2', padding: '0.45rem', borderRadius: '0.35rem', border: `1px solid ${attPct >= 75 ? '#bbf7d0' : '#fecaca'}` }}>
                                <div style={{ fontSize: '0.65rem', color: attPct >= 75 ? '#16a34a' : '#dc2626', fontWeight: 600 }}>Rate %</div>
                                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: attPct >= 75 ? '#16a34a' : '#dc2626' }}>{attPct}%</div>
                              </div>
                            </div>

                            {/* Progress bar */}
                            <div style={{ background: '#e2e8f0', borderRadius: '99px', height: 7, overflow: 'hidden' }}>
                              <div style={{ width: `${attPct}%`, height: '100%', background: attPct >= 75 ? '#22c55e' : attPct >= 50 ? '#f59e0b' : '#ef4444', borderRadius: '99px' }} />
                            </div>

                            {/* Recent days chips */}
                            <div>
                              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>Recent Attendance Entries:</div>
                              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                                {childAttend.slice(0, 10).map(a => {
                                  const st = a.attendance_status;
                                  const isPres  = st === 'Present';
                                  const isLeave = st === 'Leave';
                                  const chipColor  = isPres ? '#15803d' : isLeave ? '#92400e' : '#b91c1c';
                                  const chipBg     = isPres ? 'rgba(34,197,94,0.1)' : isLeave ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.1)';
                                  const chipBorder = isPres ? 'rgba(34,197,94,0.25)' : isLeave ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.25)';
                                  const chipIcon   = isPres ? 'bi-check-circle-fill' : isLeave ? 'bi-calendar2-minus-fill' : 'bi-x-circle-fill';
                                  return (
                                    <span key={a.attendance_id} style={{
                                      fontSize: '0.68rem', padding: '0.15rem 0.45rem', borderRadius: '0.35rem',
                                      background: chipBg,
                                      border: `1px solid ${chipBorder}`,
                                      color: chipColor, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem'
                                    }}>
                                      <i className={`bi ${chipIcon}`} />
                                      {a.attendance_date}: {st}
                                    </span>
                                  );
                                })}
                                {childAttend.length > 10 && (
                                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', alignSelf: 'center' }}>+{childAttend.length - 10} more</span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 3. STUDY & EDUCATION DETAILS */}
                      <div>
                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#2563eb', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <i className="bi bi-mortarboard-fill" /> Study &amp; Academic Details ({childEdu.length} Subjects)
                          {avgScore && (
                            <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: '#2563eb', fontWeight: 700 }}>
                              Average Score: {avgScore}% (Grade {avgGrade})
                            </span>
                          )}
                        </div>
                        {childEdu.length === 0 ? (
                          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '0.45rem', padding: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                            <i className="bi bi-journal-x" style={{ marginRight: '0.35rem' }} /> No academic or exam records logged yet.
                          </div>
                        ) : (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '0.55rem' }}>
                            {childEdu.map(r => {
                              const score = parseFloat(r.marks || 0);
                              const { grade, cls } = getGrade(score);
                              return (
                                <div key={r.education_id} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '0.45rem', padding: '0.6rem 0.8rem' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                      <div style={{ fontWeight: 700, fontSize: '0.84rem', color: 'var(--text-primary)' }}>{r.subject}</div>
                                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                                        Class: {r.class_name} • Exam: {r.exam_date || '—'}
                                      </div>
                                    </div>
                                    <span className={`badge ${cls}`} style={{ fontSize: '0.7rem', fontWeight: 800 }}>
                                      {score}% ({grade})
                                    </span>
                                  </div>
                                  {r.remarks && (
                                    <div style={{ fontSize: '0.7rem', color: '#64748b', fontStyle: 'italic', marginTop: '0.35rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.3rem' }}>
                                      Teacher's Note: "{r.remarks}"
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* 4. HEALTH & BODY CHECKUP DETAILS */}
                      <div>
                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#dc2626', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <i className="bi bi-heart-pulse-fill" /> Health &amp; Body Checkup Details ({childHealth.length} Records)
                        </div>
                        {childHealth.length === 0 ? (
                          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '0.45rem', padding: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                            <i className="bi bi-heartbreak" style={{ marginRight: '0.35rem' }} /> No body checkup records found.
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                            {/* Latest Checkup Summary Banner */}
                            {latestHealth && (
                              <div style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: '0.5rem', padding: '0.75rem 0.95rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                    <i className="bi bi-activity" style={{ marginRight: '0.3rem' }} /> Latest Checkup: {latestHealth.checkup_date}
                                  </span>
                                  <span style={{
                                    fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '99px',
                                    background: latestHealth.status === 'Healthy' ? '#dcfce7' : '#fee2e2',
                                    color: latestHealth.status === 'Healthy' ? '#15803d' : '#b91c1c'
                                  }}>
                                    {latestHealth.status || 'Healthy'}
                                  </span>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.5rem' }}>
                                  <div style={{ background: '#ffffff', padding: '0.4rem 0.6rem', borderRadius: '0.35rem', border: '1px solid #e2e8f0' }}>
                                    <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>Height</div>
                                    <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{latestHealth.height_cm} cm</div>
                                  </div>
                                  <div style={{ background: '#ffffff', padding: '0.4rem 0.6rem', borderRadius: '0.35rem', border: '1px solid #e2e8f0' }}>
                                    <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>Weight</div>
                                    <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{latestHealth.weight_kg} kg</div>
                                  </div>
                                  <div style={{ background: '#ffffff', padding: '0.4rem 0.6rem', borderRadius: '0.35rem', border: '1px solid #e2e8f0' }}>
                                    <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>BMI &amp; Category</div>
                                    <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#059669' }}>{latestBMI} ({bmiStatus})</div>
                                  </div>
                                </div>
                                {latestHealth.notes && (
                                  <div style={{ fontSize: '0.74rem', color: '#475569', marginTop: '0.5rem', fontStyle: 'italic', borderTop: '1px dashed #e2e8f0', paddingTop: '0.4rem' }}>
                                    Doctor's Notes: "{latestHealth.notes}"
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Additional Past checkups if any */}
                            {childHealth.length > 1 && (
                              <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', marginTop: '0.2rem' }}>
                                {childHealth.slice(1).map(h => {
                                  const bmi = (parseFloat(h.weight_kg) / Math.pow(parseFloat(h.height_cm) / 100, 2)).toFixed(1);
                                  return (
                                    <div key={h.health_id} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '0.4rem', padding: '0.4rem 0.65rem', fontSize: '0.72rem' }}>
                                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{h.checkup_date}</span>: {h.height_cm}cm / {h.weight_kg}kg (BMI: {bmi}) — <span style={{ color: h.status === 'Healthy' ? '#16a34a' : '#dc2626', fontWeight: 600 }}>{h.status}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* 5. ACHIEVEMENTS & AWARDS */}
                      <div>
                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#d97706', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <i className="bi bi-trophy-fill" /> Achievements &amp; Awards ({childAchieve.length})
                        </div>
                        {childAchieve.length === 0 ? (
                          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '0.45rem', padding: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                            <i className="bi bi-award" style={{ marginRight: '0.35rem' }} /> No achievements recorded yet.
                          </div>
                        ) : (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.55rem' }}>
                            {childAchieve.map(a => {
                              const catColors = { Academic: '#2563eb', Sports: '#16a34a', Art: '#db2777', Music: '#9333ea', Other: '#d97706' };
                              const cc = catColors[a.category] || '#475569';
                              return (
                                <div key={a.achievement_id} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '0.45rem', padding: '0.6rem 0.8rem' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.84rem', color: 'var(--text-primary)' }}>{a.title}</div>
                                    <span style={{ fontSize: '0.64rem', fontWeight: 700, color: cc, background: `${cc}15`, padding: '0.1rem 0.45rem', borderRadius: '99px' }}>
                                      {a.category}
                                    </span>
                                  </div>
                                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Date: {a.achievement_date}</div>
                                  {a.description && (
                                    <div style={{ fontSize: '0.73rem', color: '#475569', marginTop: '0.3rem' }}>{a.description}</div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* 6. CHILD ACTION BUTTONS */}
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '0.65rem' }}>
                        {onViewChild && (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={(e) => { e.stopPropagation(); onViewChild(child); }}
                            style={{ fontSize: '0.74rem', padding: '0.35rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                          >
                            <i className="bi bi-person-badge" /> View Single Profile
                          </button>
                        )}
                        {onEdit && (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={(e) => { e.stopPropagation(); onEdit(child); }}
                            style={{ fontSize: '0.74rem', padding: '0.35rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                          >
                            <i className="bi bi-pencil" /> Edit Child
                          </button>
                        )}
                      </div>

                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.85rem', marginTop: '0.4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
            Showing <strong>{filtered.length}</strong> children • <strong>{expandedIds.size}</strong> expanded with full details
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button className="btn btn-secondary btn-sm" onClick={onClose} style={{ minWidth: 80 }}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ChildProfilePage() {
  const { toggleSidebar } = useOutletContext();
  const [children, setChildren]       = useState([]);
  const [eduRecords, setEduRecords]   = useState([]);
  const [healthRecords, setHealthRecords] = useState([]);
  const [achieveRecords, setAchieveRecords] = useState([]);
  const [attendRecords, setAttendRecords]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showModal, setShowModal]     = useState(false);
  const [viewChild, setViewChild]     = useState(null);
  const [editChild, setEditChild]     = useState(null);
  const [showAllModal, setShowAllModal] = useState(false);
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [form, setForm]               = useState(emptyForm);
  const [saving, setSaving]           = useState(false);
  const [msg, setMsg]                 = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const loadAll = () => {
    setLoading(true);
    Promise.all([
      fetch(`${API}/children/`).then(r => r.json()).catch(() => []),
      fetch(`${API}/education/`).then(r => r.json()).catch(() => []),
      fetch(`${API}/health/`).then(r => r.json()).catch(() => []),
      fetch(`${API}/achievements/`).then(r => r.json()).catch(() => []),
      fetch(`${API}/attendance/`).then(r => r.json()).catch(() => []),
    ]).then(([cData, eData, hData, aData, attData]) => {
      setChildren(Array.isArray(cData) ? cData : []);
      setEduRecords(Array.isArray(eData) ? eData : []);
      setHealthRecords(Array.isArray(hData) ? hData : []);
      setAchieveRecords(Array.isArray(aData) ? aData : []);
      setAttendRecords(Array.isArray(attData) ? attData : []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { loadAll(); }, []);

  const openAdd = () => {
    setEditChild(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (child) => {
    setEditChild(child);
    const pName = child.guardian_name || child.father_name || child.mother_name || '';
    const pRel = (child.guardian_relation && child.guardian_relation !== 'None')
      ? child.guardian_relation
      : (child.father_name ? 'Father' : child.mother_name ? 'Mother' : (pName ? 'Guardian' : 'Father'));
    const hasP = Boolean(pName.trim() && child.guardian_relation !== 'None');

    setForm({
      full_name: child.full_name || '',
      date_of_birth: child.date_of_birth || '',
      gender: child.gender || 'Male',
      admission_date: child.admission_date || '',
      has_guardian: hasP,
      guardian_name: pName,
      guardian_relation: pRel,
      blood_group: child.blood_group || '',
      aadhar_number: child.aadhar_number || '',
      status: child.status || 'Active',
      previous_school: child.previous_school || '',
      photo: null,
    });
    setShowModal(true);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete the profile for ${name}?`)) return;
    try {
      const r = await fetch(`${API}/children/${id}/`, { method: 'DELETE' });
      if (r.ok || r.status === 204) {
        setMsg(`Profile for ${name} deleted successfully.`);
        setTimeout(() => setMsg(''), 3000);
        loadAll();
      }
    } catch { alert('Failed to delete child profile.'); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.full_name || form.full_name.trim().length < 2) {
      alert('Full Name is required and must be at least 2 characters.');
      return;
    }
    if (form.has_guardian && (!form.guardian_name || !form.guardian_name.trim())) {
      alert('Please enter the Parent / Guardian Name, or choose "No Parents (Orphan)".');
      return;
    }
    if (form.aadhar_number?.trim()) {
      const clean = form.aadhar_number.trim().replace(/\s+/g, '');
      if (!/^\d{12}$/.test(clean)) { alert('Aadhaar Number must be exactly 12 numeric digits.'); return; }
    }
    setSaving(true);
    try {
      const url = editChild ? `${API}/children/${editChild.child_id}/` : `${API}/children/`;
      const method = editChild ? 'PATCH' : 'POST';

      const gName = form.has_guardian ? (form.guardian_name?.trim() || '') : '';
      const gRel  = form.has_guardian ? (form.guardian_relation || 'Father') : 'None';
      const fName = (form.has_guardian && gRel === 'Father') ? gName : '';
      const mName = (form.has_guardian && gRel === 'Mother') ? gName : '';

      if (form.photo instanceof File) {
        const fd = new FormData();
        fd.append('full_name', form.full_name);
        fd.append('date_of_birth', form.date_of_birth);
        fd.append('gender', form.gender);
        fd.append('admission_date', form.admission_date);
        fd.append('status', form.status);
        fd.append('blood_group', form.blood_group || '');
        fd.append('aadhar_number', form.aadhar_number || '');
        fd.append('previous_school', form.previous_school || '');
        fd.append('guardian_name', gName);
        fd.append('father_name', fName);
        fd.append('mother_name', mName);
        fd.append('guardian_relation', gRel);
        fd.append('photo', form.photo);
        const r = await fetch(url, { method, body: fd });
        if (!r.ok) { const err = await r.json(); alert('Error: ' + JSON.stringify(err)); return; }
      } else {
        const payload = {
          full_name: form.full_name,
          date_of_birth: form.date_of_birth,
          gender: form.gender,
          admission_date: form.admission_date,
          status: form.status,
          blood_group: form.blood_group || '',
          aadhar_number: form.aadhar_number || '',
          previous_school: form.previous_school || '',
          guardian_name: gName,
          father_name: fName,
          mother_name: mName,
          guardian_relation: gRel,
        };
        const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!r.ok) { const err = await r.json(); alert('Error: ' + JSON.stringify(err)); return; }
      }

      setShowModal(false);
      setEditChild(null);
      setMsg(editChild ? 'Child profile updated successfully.' : 'Child profile added successfully.');
      setForm(emptyForm);
      setTimeout(() => setMsg(''), 3000);
      loadAll();
    } catch { alert('Unable to connect to server.'); }
    finally { setSaving(false); }
  };

  const filtered = children.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = c.full_name?.toLowerCase().includes(q) ||
      c.guardian_name?.toLowerCase().includes(q) ||
      c.father_name?.toLowerCase().includes(q) ||
      c.mother_name?.toLowerCase().includes(q) ||
      c.guardian_relation?.toLowerCase().includes(q);
    return matchSearch && (statusFilter === 'All' || c.status === statusFilter);
  });

  const statusColors = { Active: 'badge-green', Inactive: 'badge-muted', Adopted: 'badge-accent' };

  return (
    <>
      <TopHeader title="Child Profiles" onToggleSidebar={toggleSidebar} />

      <div className="page-body">
        <div className="page-banner">
          <div>
            <div className="section-label">Children Management</div>
            <div className="page-banner-title">Child Profiles ({children.length})</div>
            <div className="page-banner-sub">View, add, edit, and manage all children in the orphanage</div>
          </div>
          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={() => setShowAllModal(true)}>
              <i className="bi bi-people-fill" /> All Children Details
            </button>
            <button className="btn btn-primary" onClick={openAdd}>
              <i className="bi bi-person-plus-fill" /> Add Child
            </button>
          </div>
        </div>

        {msg && <div className="alert alert-success"><i className="bi bi-check-circle-fill" /> {msg}</div>}

        {/* Search + Filter */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="input-wrap" style={{ flex: 1, minWidth: 220 }}>
            <i className="bi bi-search input-icon" />
            <input type="text" className="form-control" placeholder="Search by name, father, mother, or guardian..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="form-control" style={{ width: 'auto', borderColor: 'var(--accent)' }} value=""
            onChange={e => { if (e.target.value) { const f = children.find(c => c.child_id === parseInt(e.target.value)); if (f) openEdit(f); } }}>
            <option value="">✏️ Quick Edit Child...</option>
            {children.map(c => <option key={c.child_id} value={c.child_id}>{c.full_name} ({c.status})</option>)}
          </select>
          <select className="form-control" style={{ width: 'auto' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Adopted">Adopted</option>
          </select>
        </div>

        {/* Table */}
        <div className="table-wrap" style={{ borderRadius: '0.85rem', border: '1px solid #e2e8f0', overflowX: 'auto', background: '#ffffff' }}>
          <table className="table" style={{ width: '100%', margin: 0, borderCollapse: 'separate', borderSpacing: 0, fontSize: '0.78rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ padding: '0.6rem 0.35rem', color: '#64748b', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.04em', textAlign: 'center', width: 28 }}>#</th>
                <th style={{ padding: '0.6rem 0.4rem', color: '#64748b', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.04em' }}>NAME</th>
                <th style={{ padding: '0.6rem 0.4rem', color: '#64748b', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>AGE &amp; CATEGORY</th>
                <th style={{ padding: '0.6rem 0.4rem', color: '#64748b', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>AADHAAR NO</th>
                <th style={{ padding: '0.6rem 0.4rem', color: '#64748b', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>PARENT / GUARDIAN</th>
                <th style={{ padding: '0.6rem 0.3rem', color: '#64748b', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.04em', textAlign: 'center' }}>BLOOD</th>
                <th style={{ padding: '0.6rem 0.4rem', color: '#64748b', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.04em', textAlign: 'center', whiteSpace: 'nowrap' }}>STATUS</th>
                <th style={{ padding: '0.6rem 0.4rem', color: '#64748b', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.04em', textAlign: 'center' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  <span className="spinner" style={{ margin: '0 auto' }} />
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  <i className="bi bi-inbox" style={{ fontSize: '1.8rem', display: 'block', marginBottom: '0.4rem' }} />
                  No children profiles found
                </td></tr>
              ) : filtered.map((c, i) => {
                const { label: ageLabel, years: ageYrs } = calcAge(c.date_of_birth);
                const displayName = c.guardian_name || c.father_name || c.mother_name || '';
                const relation = (c.guardian_relation && c.guardian_relation !== 'None')
                  ? c.guardian_relation
                  : (c.father_name ? 'Father' : c.mother_name ? 'Mother' : (displayName ? 'Guardian' : 'None'));
                const hasParent = Boolean(displayName.trim() && relation !== 'None');

                return (
                  <tr key={c.child_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, padding: '0.5rem 0.35rem', textAlign: 'center' }}>{i + 1}</td>

                    {/* Name */}
                    <td style={{ padding: '0.5rem 0.4rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Avatar child={c} size={32} idx={i} />
                        <div>
                          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>{c.full_name}</div>
                          <div style={{ fontSize: '0.65rem', color: '#64748b' }}>ID: #{c.child_id}</div>
                        </div>
                      </div>
                    </td>

                    {/* Age */}
                    <td style={{ padding: '0.5rem 0.4rem', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                        <span style={{ fontWeight: 600, color: '#334155', fontSize: '0.76rem' }}>{ageLabel} ({c.gender})</span>
                        <span className={`badge ${ageYrs < 5 ? 'badge-amber' : 'badge-cyan'}`} style={{ fontSize: '0.64rem', padding: '0.1rem 0.4rem', width: 'fit-content' }}>
                          <i className={`bi ${ageYrs < 5 ? 'bi-balloon-fill' : 'bi-mortarboard-fill'}`} style={{ marginRight: '0.2rem' }} />
                          {ageYrs < 5 ? 'Toddler' : 'School Age'}
                        </span>
                      </div>
                    </td>

                    {/* Aadhaar */}
                    <td style={{ padding: '0.5rem 0.4rem', whiteSpace: 'nowrap' }}>
                      <code style={{ background: 'rgba(37,99,235,0.08)', color: '#2563eb', padding: '0.15rem 0.4rem', borderRadius: 5, fontSize: '0.74rem', fontWeight: 700 }}>
                        {c.aadhar_number || '—'}
                      </code>
                    </td>

                    {/* Parent / Guardian */}
                    <td style={{ padding: '0.5rem 0.4rem', whiteSpace: 'nowrap' }}>
                      {hasParent ? (
                        <div style={{
                          background: relation === 'Father' ? '#eff6ff' : relation === 'Mother' ? '#fdf2f8' : '#f1f5f9',
                          border: `1px solid ${relation === 'Father' ? '#bfdbfe' : relation === 'Mother' ? '#fbcfe8' : '#e2e8f0'}`,
                          borderRadius: '2rem', padding: '0.22rem 0.6rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                          fontSize: '0.73rem', fontWeight: 600,
                          color: relation === 'Father' ? '#1d4ed8' : relation === 'Mother' ? '#be185d' : '#334155'
                        }}>
                          <i className={`bi ${relation === 'Father' ? 'bi-person-fill' : relation === 'Mother' ? 'bi-person-heart' : 'bi-shield-heart-fill'}`}
                            style={{ fontSize: '0.78rem', color: relation === 'Father' ? '#2563eb' : relation === 'Mother' ? '#db2777' : '#7c3aed' }} />
                          <span>{displayName}</span>
                          <span style={{ fontSize: '0.66rem', opacity: 0.85, fontWeight: 700 }}>({relation})</span>
                        </div>
                      ) : (
                        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.22)', borderRadius: '2rem', padding: '0.22rem 0.6rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: '#dc2626', fontWeight: 700 }}>
                          <i className="bi bi-person-x" />
                          No Parents (Orphan)
                        </div>
                      )}
                    </td>

                    {/* Blood */}
                    <td style={{ padding: '0.5rem 0.3rem', textAlign: 'center' }}>
                      {c.blood_group ? (
                        <span style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#dc2626', padding: '0.15rem 0.4rem', borderRadius: '1rem', fontSize: '0.68rem', fontWeight: 700 }}>{c.blood_group}</span>
                      ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>—</span>}
                    </td>

                    {/* Status */}
                    <td style={{ padding: '0.5rem 0.4rem', textAlign: 'center' }}>
                      <span className={`badge ${statusColors[c.status] || 'badge-muted'}`} style={{ fontWeight: 700, padding: '0.2rem 0.55rem', fontSize: '0.72rem' }}>{c.status}</span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '0.5rem 0.4rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'center' }}>
                        {[
                          { icon: 'bi-eye', bg: '#eff6ff', border: '#bfdbfe', color: '#2563eb', title: 'View Details', action: () => setViewChild(c) },
                          { icon: 'bi-pencil', bg: '#f8fafc', border: '#e2e8f0', color: '#334155', title: 'Edit', action: () => openEdit(c) },
                          { icon: 'bi-trash', bg: '#fef2f2', border: '#fecaca', color: '#dc2626', title: 'Delete', action: () => handleDelete(c.child_id, c.full_name) },
                        ].map(({ icon, bg, border, color, title, action }) => (
                          <button key={icon} type="button" onClick={action} title={title}
                            style={{ width: 28, height: 28, borderRadius: 5, background: bg, border: `1px solid ${border}`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                            <i className={`bi ${icon}`} style={{ fontSize: '0.76rem' }} />
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add / Edit Modal ── */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 560, maxHeight: '92vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h4 style={{ color: 'var(--text-primary)', margin: 0 }}>
                <i className="bi bi-person-plus-fill" style={{ color: 'var(--accent)', marginRight: '0.5rem' }} />
                {editChild ? 'Edit Child Profile' : 'Add New Child'}
              </h4>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}><i className="bi bi-x-lg" /></button>
            </div>

            <form onSubmit={handleSave}>
              {/* Photo upload (edit only) */}
              {editChild && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.85rem 1rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
                  <Avatar child={{ ...editChild, photo: form.photo instanceof File ? URL.createObjectURL(form.photo) : editChild.photo }} size={52} idx={0} />
                  <div style={{ flex: 1 }}>
                    <label className="form-label" style={{ marginBottom: '0.25rem', fontSize: '0.82rem', fontWeight: 600 }}>Profile Photo</label>
                    <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                      <i className="bi bi-camera-fill" /> {editChild?.photo || form.photo ? 'Change Photo' : 'Upload Photo'}
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) set('photo', e.target.files[0]); }} />
                    </label>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>JPG, PNG or WEBP</div>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input type="text" className="form-control" placeholder="Child's full name" value={form.full_name} onChange={e => set('full_name', e.target.value)} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Date of Birth *</label>
                  <input type="date" className="form-control" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select className="form-control" value={form.gender} onChange={e => set('gender', e.target.value)}>
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Admission Date *</label>
                  <input type="date" className="form-control" value={form.admission_date} onChange={e => set('admission_date', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Blood Group</label>
                  <select className="form-control" value={form.blood_group} onChange={e => set('blood_group', e.target.value)}>
                    <option value="">— Unknown —</option>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Aadhaar Number</label>
                  <input type="text" className="form-control" placeholder="12-digit Aadhaar" value={form.aadhar_number} onChange={e => set('aadhar_number', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Previous School</label>
                  <input type="text" className="form-control" placeholder="Previous school name" value={form.previous_school} onChange={e => set('previous_school', e.target.value)} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-control" value={form.status} onChange={e => set('status', e.target.value)}>
                  <option>Active</option><option>Inactive</option><option>Adopted</option>
                </select>
              </div>

              {/* ── Guardian / Parent Section ── */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem', marginTop: '0.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <i className="bi bi-shield-heart-fill" style={{ color: 'var(--accent)' }} />
                    Parent / Guardian Information
                  </div>
                  <div style={{ display: 'flex', gap: '0.3rem' }}>
                    {[
                      { label: 'Has Parent / Guardian', val: true },
                      { label: 'No Parents (Orphan)', val: false },
                    ].map(({ label, val }) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => {
                          set('has_guardian', val);
                          if (!val) {
                            set('guardian_name', '');
                            set('guardian_relation', 'None');
                          } else if (form.guardian_relation === 'None') {
                            set('guardian_relation', 'Father');
                          }
                        }}
                        style={{
                          padding: '0.3rem 0.65rem',
                          borderRadius: '99px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          border: `1px solid ${form.has_guardian === val ? 'var(--accent)' : '#e2e8f0'}`,
                          background: form.has_guardian === val ? 'var(--accent)' : 'transparent',
                          color: form.has_guardian === val ? '#fff' : 'var(--text-muted)',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {form.has_guardian ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">
                        <i
                          className={`bi ${
                            form.guardian_relation === 'Father'
                              ? 'bi-person-fill'
                              : form.guardian_relation === 'Mother'
                              ? 'bi-person-heart'
                              : 'bi-people-fill'
                          }`}
                          style={{
                            color:
                              form.guardian_relation === 'Father'
                                ? '#2563eb'
                                : form.guardian_relation === 'Mother'
                                ? '#db2777'
                                : 'var(--accent)',
                            marginRight: '0.3rem',
                          }}
                        />
                        {form.guardian_relation === 'Father'
                          ? "Father's Full Name *"
                          : form.guardian_relation === 'Mother'
                          ? "Mother's Full Name *"
                          : 'Parent / Guardian Name *'}
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder={
                          form.guardian_relation === 'Father'
                            ? "Enter father's name"
                            : form.guardian_relation === 'Mother'
                            ? "Enter mother's name"
                            : 'Enter parent or guardian name'
                        }
                        value={form.guardian_name}
                        onChange={e => set('guardian_name', e.target.value)}
                        required={form.has_guardian}
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">
                        <i className="bi bi-link-45deg" style={{ color: '#10b981', marginRight: '0.3rem' }} />
                        Relationship to Child
                      </label>
                      <select
                        className="form-control"
                        value={form.guardian_relation}
                        onChange={e => set('guardian_relation', e.target.value)}
                      >
                        {RELATION_OPTIONS.map(r => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      padding: '0.85rem 1rem',
                      background: 'rgba(239,68,68,0.06)',
                      border: '1px solid rgba(239,68,68,0.2)',
                      borderRadius: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      color: '#dc2626',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                    }}
                  >
                    <i className="bi bi-person-x-fill" style={{ fontSize: '1.2rem', flexShrink: 0 }} />
                    <span>
                      <strong>No Parents (Orphan):</strong> This child has no living or known parents/guardians registered.
                    </span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><span className="spinner spinner-sm" /> Saving...</> : <><i className="bi bi-check-lg" /> {editChild ? 'Update Profile' : 'Save Profile'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── View Child Details Modal ── */}
      {viewChild && (
        <ChildDetailModal
          child={viewChild}
          eduRecords={eduRecords}
          healthRecords={healthRecords}
          achieveRecords={achieveRecords}
          attendRecords={attendRecords}
          idx={children.findIndex(c => c.child_id === viewChild.child_id)}
          onClose={() => setViewChild(null)}
          onEdit={(c) => openEdit(c)}
          onDelete={handleDelete}
        />
      )}

      {/* ── All Children Details Modal ── */}
      {showAllModal && (
        <AllChildrenModal
          children={children}
          eduRecords={eduRecords}
          healthRecords={healthRecords}
          achieveRecords={achieveRecords}
          attendRecords={attendRecords}
          onClose={() => setShowAllModal(false)}
          onViewChild={(c) => { setShowAllModal(false); setViewChild(c); }}
          onEdit={(c) => { setShowAllModal(false); openEdit(c); }}
        />
      )}
    </>
  );
}
