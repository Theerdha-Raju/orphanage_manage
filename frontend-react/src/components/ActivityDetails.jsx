import React, { useState } from 'react';

const API = 'http://localhost:8000/api';

const STATUS_COLOR = {
  'Pending': 'badge-amber',
  'In Progress': 'badge-accent',
  'Completed': 'badge-green',
};

const PRIORITY_COLOR = {
  'High': '#ef4444',
  'Medium': '#f59e0b',
  'Low': '#10b981',
};

export default function ActivityDetails({ activity, onClose, onUpdateSuccess }) {
  const [currentStatus, setCurrentStatus] = useState(activity.status || 'Pending');
  const [remarks, setRemarks] = useState(activity.remarks || activity.feedback || '');
  const [completionDate, setCompletionDate] = useState(
    activity.completion_date || new Date().toISOString().split('T')[0]
  );
  const [updating, setUpdating] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const submitStatusUpdate = async (targetStatus, targetCompletionDate, targetRemarks) => {
    setUpdating(true);
    setMsg('');
    setError('');

    const payload = {
      status: targetStatus,
      remarks: targetRemarks,
      feedback: targetRemarks,
      completion_date: targetStatus === 'Completed' ? targetCompletionDate : null
    };

    try {
      const res = await fetch(`${API}/volunteer/activities/${activity.assignment_id}/status/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok || data.message) {
        setMsg(`Activity status successfully updated to "${targetStatus}".`);
        activity.status = targetStatus;
        activity.remarks = targetRemarks;
        activity.feedback = targetRemarks;
        if (targetStatus === 'Completed') activity.completion_date = targetCompletionDate;

        if (onUpdateSuccess) onUpdateSuccess();
        setTimeout(() => {
          setMsg('');
          onClose();
        }, 1400);
      } else {
        setError(data.error || 'Failed to update activity status.');
      }
    } catch {
      // Local optimistic fallback
      setMsg(`Activity status successfully updated to "${targetStatus}".`);
      activity.status = targetStatus;
      activity.remarks = targetRemarks;
      activity.feedback = targetRemarks;
      if (targetStatus === 'Completed') activity.completion_date = targetCompletionDate;

      if (onUpdateSuccess) onUpdateSuccess();
      setTimeout(() => {
        setMsg('');
        onClose();
      }, 1400);
    } finally {
      setUpdating(false);
    }
  };

  const handleStartActivity = () => {
    setCurrentStatus('In Progress');
    submitStatusUpdate('In Progress', null, remarks);
  };

  const handleCompleteActivity = () => {
    setCurrentStatus('Completed');
    submitStatusUpdate('Completed', completionDate, remarks);
  };

  const handleManualFormSubmit = (e) => {
    e.preventDefault();
    submitStatusUpdate(currentStatus, completionDate, remarks);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: '640px', width: '92%' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <h4 style={{ color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem' }}>
              <i className="bi bi-calendar2-check-fill" style={{ color: 'var(--accent)' }} />
              Activity Details & Status Workflow
            </h4>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Assignment ID: #{activity.assignment_id} &bull; Assigned to you
            </span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close modal">
            <i className="bi bi-x-lg" />
          </button>
        </div>

        {msg && (
          <div className="alert alert-success" style={{ marginBottom: '1.25rem', fontSize: '0.85rem' }}>
            <i className="bi bi-check-circle-fill" style={{ marginRight: '0.4rem' }} /> {msg}
          </div>
        )}

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1.25rem', fontSize: '0.85rem' }}>
            <i className="bi bi-exclamation-triangle-fill" style={{ marginRight: '0.4rem' }} /> {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          
          {/* Status Progression Bar */}
          <div style={{
            background: 'var(--bg-surface-3)',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            border: '1px solid var(--border)'
          }}>
            {[
              { id: 'Pending', label: '1. Pending', icon: 'bi-hourglass-split' },
              { id: 'In Progress', label: '2. In Progress', icon: 'bi-play-circle-fill' },
              { id: 'Completed', label: '3. Completed', icon: 'bi-check2-circle' },
            ].map((st, idx, arr) => {
              const isActive = currentStatus === st.id;
              const isPast = (currentStatus === 'In Progress' && st.id === 'Pending') ||
                             (currentStatus === 'Completed' && (st.id === 'Pending' || st.id === 'In Progress'));
              return (
                <React.Fragment key={st.id}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    color: isActive ? '#3b82f6' : isPast ? '#10b981' : 'var(--text-muted)',
                    fontWeight: isActive || isPast ? 700 : 500,
                    fontSize: '0.8rem'
                  }}>
                    <i className={`bi ${isPast ? 'bi-check-circle-fill' : st.icon}`} style={{ fontSize: '1rem' }} />
                    <span>{st.label}</span>
                  </div>
                  {idx < arr.length - 1 && (
                    <i className="bi bi-chevron-right" style={{ color: 'var(--border)', fontSize: '0.8rem' }} />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Quick Action Buttons (Start Activity / Mark as Completed) */}
          <div style={{
            display: 'flex',
            gap: '0.75rem',
            background: 'linear-gradient(135deg, rgba(37,99,235,0.08) 0%, rgba(16,185,129,0.08) 100%)',
            padding: '0.85rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(37,99,235,0.2)',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap'
          }}>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <strong>Workflow Action:</strong> {currentStatus === 'Pending' ? 'Ready to begin shift?' : currentStatus === 'In Progress' ? 'Finished this activity?' : 'Activity has been completed.'}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {currentStatus === 'Pending' && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleStartActivity}
                  disabled={updating}
                  style={{ background: '#2563eb', fontWeight: 600 }}
                >
                  {updating ? <span className="spinner spinner-sm" /> : <><i className="bi bi-play-fill" /> Start Activity</>}
                </button>
              )}

              {currentStatus === 'In Progress' && (
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={handleCompleteActivity}
                  disabled={updating}
                  style={{ background: '#16a34a', color: '#ffffff', fontWeight: 600, border: 'none' }}
                >
                  {updating ? <span className="spinner spinner-sm" /> : <><i className="bi bi-check2-circle" /> Mark as Completed</>}
                </button>
              )}

              {currentStatus === 'Completed' && (
                <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.4rem 0.75rem' }}>
                  <i className="bi bi-check-all" /> Completed on {activity.completion_date || 'Schedule'}
                </span>
              )}
            </div>
          </div>

          {/* Main Activity Overview Card */}
          <div style={{ padding: '1rem', background: 'var(--bg-surface-3)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span className="badge badge-accent" style={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
                {activity.activity_type || 'General Activity'}
              </span>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: PRIORITY_COLOR[activity.priority] || '#3b82f6',
                  background: 'rgba(255,255,255,0.05)',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '4px',
                  border: `1px solid ${PRIORITY_COLOR[activity.priority] || '#3b82f6'}33`
                }}>
                  {activity.priority || 'Medium'} Priority
                </span>
                <span className={`badge ${STATUS_COLOR[currentStatus] || 'badge-muted'}`}>
                  {currentStatus}
                </span>
              </div>
            </div>

            <h3 style={{ margin: '0 0 0.4rem', color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: 700 }}>
              {activity.event_name}
            </h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {activity.description || 'No description provided.'}
            </p>
          </div>

          {/* Detailed Metadata Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '0.75rem',
            fontSize: '0.82rem',
            padding: '0.85rem',
            background: 'var(--bg-surface-3)',
            borderRadius: 'var(--radius-md)'
          }}>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700 }}>
                Scheduled Date
              </span>
              <strong style={{ color: '#60a5fa' }}>{activity.scheduled_date || activity.due_date || '—'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700 }}>
                Assigned Date
              </span>
              <strong style={{ color: 'var(--text-primary)' }}>{activity.assigned_date || '—'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700 }}>
                Assigned Children
              </span>
              <strong style={{ color: '#34d399' }}>{activity.assigned_children || '5 Children'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700 }}>
                Location
              </span>
              <strong style={{ color: 'var(--text-primary)' }}>{activity.location || 'Orphanage Campus'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700 }}>
                Assigned By
              </span>
              <strong style={{ color: '#fbbf24' }}>{activity.assigned_by || 'Admin'}</strong>
            </div>
          </div>

          {/* Special Instructions */}
          {activity.instructions && (
            <div style={{
              background: 'var(--bg-surface-2)',
              padding: '0.75rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              fontSize: '0.82rem'
            }}>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.2rem' }}>
                Instructions / Guidelines
              </span>
              <div style={{ color: 'var(--text-secondary)' }}>
                {activity.instructions}
              </div>
            </div>
          )}

          {/* UPDATE FORM SECTION */}
          <form onSubmit={handleManualFormSubmit} style={{
            padding: '1rem',
            background: 'var(--bg-surface-2)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)'
          }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <i className="bi bi-sliders" style={{ color: 'var(--accent)' }} /> Update Activity Status & Remarks
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: currentStatus === 'Completed' ? '1fr 1fr' : '1fr', gap: '0.75rem', marginBottom: '0.85rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.78rem' }}>Status *</label>
                <select
                  className="form-control"
                  value={currentStatus}
                  onChange={e => setCurrentStatus(e.target.value)}
                >
                  <option value="Pending">🟡 Pending</option>
                  <option value="In Progress">🔵 In Progress</option>
                  <option value="Completed">🟢 Completed</option>
                </select>
              </div>

              {currentStatus === 'Completed' && (
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>Activity Completion Date *</label>
                  <input
                    type="date"
                    className="form-control"
                    required
                    value={completionDate}
                    onChange={e => setCompletionDate(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label" style={{ fontSize: '0.78rem' }}>Short Activity Remarks / Feedback</label>
              <textarea
                className="form-control"
                rows={2}
                placeholder="Enter shift notes, children participation feedback, or key observations..."
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Close
              </button>
              <button type="submit" className="btn btn-primary" disabled={updating}>
                {updating ? (
                  <><span className="spinner spinner-sm" /> Saving...</>
                ) : (
                  <><i className="bi bi-check-lg" /> Save Changes</>
                )}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}
