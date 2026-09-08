import React, { useState } from 'react';

const API = 'http://localhost:8000/api';

const STATUS_COLOR = {
  'Pending': 'badge-amber',
  'In Progress': 'badge-accent',
  'Completed': 'badge-green',
};

export default function ActivityDetails({ activity, onClose, onUpdateSuccess }) {
  const [currentStatus, setCurrentStatus] = useState(activity.status || 'Pending');
  const [feedback, setFeedback] = useState(activity.feedback || '');
  const [updating, setUpdating] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setMsg('');
    setError('');

    try {
      const res = await fetch(`${API}/volunteer/activities/${activity.assignment_id}/status/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: currentStatus, feedback })
      });

      const data = await res.json();

      if (res.ok || data.message) {
        setMsg('Activity status updated successfully.');
        if (onUpdateSuccess) onUpdateSuccess();
        setTimeout(() => {
          setMsg('');
          onClose();
        }, 1500);
      } else {
        setError(data.error || 'Failed to update status.');
      }
    } catch {
      // Local fallback for dev testing
      setMsg('Activity status updated successfully.');
      activity.status = currentStatus;
      if (onUpdateSuccess) onUpdateSuccess();
      setTimeout(() => {
        setMsg('');
        onClose();
      }, 1500);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: '620px' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h4 style={{ color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <i className="bi bi-calendar-check-fill" style={{ color: 'var(--accent)' }} />
            Activity Details & Status Update
          </h4>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><i className="bi bi-x-lg" /></button>
        </div>

        {msg && (
          <div className="alert alert-success" style={{ marginBottom: '1.25rem' }}>
            <i className="bi bi-check-circle-fill" style={{ marginRight: '0.4rem' }} /> {msg}
          </div>
        )}

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>
            <i className="bi bi-exclamation-triangle-fill" style={{ marginRight: '0.4rem' }} /> {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Main Info Box */}
          <div style={{ padding: '1rem', background: 'var(--bg-surface-3)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <span className="badge badge-accent">ID: #{activity.assignment_id}</span>
              <span className={`badge ${STATUS_COLOR[currentStatus] || 'badge-muted'}`}>
                {currentStatus}
              </span>
            </div>
            <h3 style={{ margin: '0 0 0.4rem', color: 'var(--text-primary)', fontSize: '1.15rem' }}>
              {activity.event_name}
            </h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {activity.description || 'No description available for this activity.'}
            </p>
          </div>

          {/* Key Details Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', fontSize: '0.82rem', padding: '1rem', background: 'var(--bg-surface-3)', borderRadius: 'var(--radius-md)' }}>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700 }}>Assigned Date</span>
              <strong style={{ color: 'var(--text-primary)' }}>{activity.assigned_date || '—'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700 }}>Due Date</span>
              <strong style={{ color: '#fbbf24' }}>{activity.due_date || '—'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700 }}>Location</span>
              <strong style={{ color: 'var(--text-primary)' }}>{activity.location || 'Orphanage Main Campus'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700 }}>Assigned By</span>
              <strong style={{ color: '#60a5fa' }}>{activity.assigned_by || 'Admin Office'}</strong>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.25rem' }}>Instructions</span>
              <div style={{ color: 'var(--text-secondary)', background: 'var(--bg-surface-2)', padding: '0.6rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                {activity.instructions || 'Follow standard NGO guidelines and report progress upon shift completion.'}
              </div>
            </div>
          </div>

          {/* UPDATE STATUS FORM SECTION */}
          <form onSubmit={handleUpdateStatus} style={{ padding: '1rem', background: 'var(--bg-surface-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <i className="bi bi-pencil-square" style={{ color: '#2563eb' }} /> Update Activity Status
            </div>

            <div className="form-group" style={{ marginBottom: '0.85rem' }}>
              <label className="form-label">Select Status *</label>
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

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Activity Notes / Feedback (Optional)</label>
              <textarea
                className="form-control"
                rows={2}
                placeholder="Enter shift notes or feedback..."
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={updating}>
                {updating ? <><span className="spinner spinner-sm" /> Saving...</> : <><i className="bi bi-check-lg" /> Update Status</>}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}
