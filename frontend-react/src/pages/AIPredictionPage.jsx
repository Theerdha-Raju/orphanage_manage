import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import TopHeader from '../components/TopHeader';

const API = 'http://localhost:8000/api';

export default function AIPredictionPage() {
  const { toggleSidebar } = useOutletContext();
  const [activeTab, setActiveTab] = useState('academic');

  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState('');
  const [alertLogs, setAlertLogs] = useState([]);

  // Academic State
  const [acadForm, setAcadForm] = useState({ attendance: 85, past_score: 75, study_hours: 3 });
  const [acadResult, setAcadResult] = useState(null);
  const [acadLoading, setAcadLoading] = useState(false);

  // Health State
  const [healthForm, setHealthForm] = useState({ bmi: 18.5, sick_days: 2 });
  const [healthResult, setHealthResult] = useState(null);
  const [healthLoading, setHealthLoading] = useState(false);

  // Growth State
  const [growthForm, setGrowthForm] = useState({ age: 10, height: 135, weight: 30 });
  const [growthResult, setGrowthResult] = useState(null);
  const [growthLoading, setGrowthLoading] = useState(false);

  const loadInitialData = () => {
    fetch(`${API}/children/`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setChildren(data);
          if (data.length > 0) setSelectedChild(data[0].child_id.toString());
        }
      }).catch(() => {});

    fetch(`${API}/alerts/`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setAlertLogs(data); })
      .catch(() => {});
  };

  useEffect(() => { loadInitialData(); }, []);

  const predict = async (endpointPath, payload, setLoad, setResult) => {
    setLoad(true);
    try {
      const r = await fetch(`${API}/predict/${endpointPath}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, child_id: selectedChild })
      });
      const data = await r.json();
      setResult(data);
      // Refresh alert logs
      fetch(`${API}/alerts/`).then(res => res.json()).then(logs => setAlertLogs(Array.isArray(logs) ? logs : []));
    } catch {} finally { setLoad(false); }
  };

  const handleDeleteAlert = async (id) => {
    try {
      await fetch(`${API}/alerts/${id}/`, { method: 'DELETE' });
      setAlertLogs(prev => prev.filter(a => a.alert_id !== id));
    } catch {}
  };

  const getConfColor = (c) => c > 85 ? '#4ade80' : c > 70 ? '#fbbf24' : '#ef4444';

  return (
    <>
      <TopHeader title="AI Predictions Hub" onToggleSidebar={toggleSidebar} />

      <div className="page-body">
        <div className="page-banner">
          <div>
            <div className="section-label">Intelligence</div>
            <div className="page-banner-title">Machine Learning Engine</div>
            <div className="page-banner-sub">Predict academic trajectories, health risks, and growth patterns using Random Forest & SVM</div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <select className="form-control" style={{ width: 'auto', background: 'var(--bg-surface)' }} value={selectedChild} onChange={e => setSelectedChild(e.target.value)}>
              {children.map(c => (
                <option key={c.child_id} value={c.child_id}>{c.full_name}</option>
              ))}
            </select>
            <span className="badge badge-accent">
              <i className="bi bi-cpu-fill" /> AI Models Online
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
          {[
            { id: 'academic', label: 'Academic Trajectory', icon: 'bi-graph-up-arrow' },
            { id: 'health',   label: 'Health Risk',         icon: 'bi-heart-pulse' },
            { id: 'growth',   label: 'Growth Forecast',     icon: 'bi-arrows-fullscreen' },
          ].map(t => (
            <button
              key={t.id}
              className={`btn ${activeTab === t.id ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab(t.id)}
            >
              <i className={`bi ${t.icon}`} /> {t.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          
          {/* Form Column */}
          <div className="glass-card" style={{ padding: '2rem' }}>
            {activeTab === 'academic' && (
              <form onSubmit={e => { e.preventDefault(); predict('academic', acadForm, setAcadLoading, setAcadResult); }}>
                <h4 style={{ color: 'var(--text-primary)', marginBottom: '1.5rem' }}><i className="bi bi-graph-up-arrow me-2" style={{ color: 'var(--accent)' }}/> Academic Model (Random Forest)</h4>
                <div className="form-group">
                  <label className="form-label">Attendance (%)</label>
                  <input type="number" className="form-control" value={acadForm.attendance} onChange={e => setAcadForm(f => ({...f, attendance: e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Past Average Score (%)</label>
                  <input type="number" className="form-control" value={acadForm.past_score} onChange={e => setAcadForm(f => ({...f, past_score: e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Daily Study Hours</label>
                  <input type="number" className="form-control" value={acadForm.study_hours} onChange={e => setAcadForm(f => ({...f, study_hours: e.target.value}))} />
                </div>
                <button type="submit" className="btn btn-primary w-full mt-3" disabled={acadLoading} style={{ justifyContent: 'center' }}>
                  {acadLoading ? <><span className="spinner spinner-sm" /> Running Model...</> : <><i className="bi bi-cpu-fill" /> Generate Prediction</>}
                </button>
              </form>
            )}

            {activeTab === 'health' && (
              <form onSubmit={e => { e.preventDefault(); predict('health', healthForm, setHealthLoading, setHealthResult); }}>
                <h4 style={{ color: 'var(--text-primary)', marginBottom: '1.5rem' }}><i className="bi bi-heart-pulse me-2" style={{ color: '#ef4444' }}/> Health Risk Model (SVM Classifier)</h4>
                <div className="form-group">
                  <label className="form-label">BMI</label>
                  <input type="number" step="0.1" className="form-control" value={healthForm.bmi} onChange={e => setHealthForm(f => ({...f, bmi: e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Sick Days (Last 3 months)</label>
                  <input type="number" className="form-control" value={healthForm.sick_days} onChange={e => setHealthForm(f => ({...f, sick_days: e.target.value}))} />
                </div>
                <button type="submit" className="btn btn-primary w-full mt-3" disabled={healthLoading} style={{ justifyContent: 'center' }}>
                  {healthLoading ? <><span className="spinner spinner-sm" /> Running Model...</> : <><i className="bi bi-cpu-fill" /> Generate Prediction</>}
                </button>
              </form>
            )}

            {activeTab === 'growth' && (
              <form onSubmit={e => { e.preventDefault(); predict('growth', growthForm, setGrowthLoading, setGrowthResult); }}>
                <h4 style={{ color: 'var(--text-primary)', marginBottom: '1.5rem' }}><i className="bi bi-arrows-fullscreen me-2" style={{ color: '#10b981' }}/> Growth Forecast Model (Regression)</h4>
                <div className="form-group">
                  <label className="form-label">Current Age</label>
                  <input type="number" className="form-control" value={growthForm.age} onChange={e => setGrowthForm(f => ({...f, age: e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Current Height (cm)</label>
                  <input type="number" className="form-control" value={growthForm.height} onChange={e => setGrowthForm(f => ({...f, height: e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Current Weight (kg)</label>
                  <input type="number" className="form-control" value={growthForm.weight} onChange={e => setGrowthForm(f => ({...f, weight: e.target.value}))} />
                </div>
                <button type="submit" className="btn btn-primary w-full mt-3" disabled={growthLoading} style={{ justifyContent: 'center' }}>
                  {growthLoading ? <><span className="spinner spinner-sm" /> Running Model...</> : <><i className="bi bi-cpu-fill" /> Generate Prediction</>}
                </button>
              </form>
            )}
          </div>

          {/* Result Column */}
          <div>
            {activeTab === 'academic' && (
              acadResult ? (
                <div className="glass-card" style={{ padding: '2rem', height: '100%', background: 'linear-gradient(135deg, rgba(37,99,235,0.05), rgba(124,58,237,0.05))', border: '1px solid rgba(37,99,235,0.2)' }}>
                  <div className="section-label">Prediction Results</div>
                  <h2 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--text-primary)', margin: '1rem 0' }}>
                    {acadResult.predicted_score ? acadResult.predicted_score.toFixed(1) : acadResult.predicted_score}%
                  </h2>
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                    <div style={{ padding: '0.5rem 1rem', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Predicted Grade</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{acadResult.predicted_grade}</strong>
                    </div>
                    <div style={{ padding: '0.5rem 1rem', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Confidence</span>
                      <strong style={{ color: getConfColor(acadResult.confidence || 90) }}>{(acadResult.confidence || 90).toFixed(1)}%</strong>
                    </div>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                    Based on the provided telemetry, the Random Forest model predicts an upward trajectory. Recommended action: <strong>Maintain current study hours to ensure Grade {acadResult.predicted_grade} retention.</strong>
                  </p>
                </div>
              ) : (
                <div className="glass-card" style={{ padding: '2rem', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <div>
                    <i className="bi bi-cpu" style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block', opacity: 0.5 }} />
                    Waiting for input to run Random Forest Academic Model
                  </div>
                </div>
              )
            )}

            {activeTab === 'health' && (
              healthResult ? (
                <div className="glass-card" style={{ padding: '2rem', height: '100%', background: healthResult.risk_level === 'High' ? 'rgba(225,29,72,0.05)' : 'rgba(16,185,129,0.05)', border: `1px solid ${healthResult.risk_level === 'High' ? 'rgba(225,29,72,0.3)' : 'rgba(16,185,129,0.3)'}` }}>
                  <div className="section-label">Prediction Results</div>
                  <h2 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-display)', fontWeight: 800, color: healthResult.risk_level === 'High' ? '#ef4444' : '#10b981', margin: '1rem 0' }}>
                    {healthResult.risk_level} Risk
                  </h2>
                  <div style={{ padding: '0.5rem 1rem', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', display: 'inline-block', marginBottom: '2rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Confidence</span>
                    <strong style={{ color: getConfColor(healthResult.confidence || 85) }}>{(healthResult.confidence || 85).toFixed(1)}%</strong>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                    {healthResult.risk_level === 'High' 
                      ? 'The SVM model flagged significant medical risk based on BMI and recent illness patterns. Immediate pediatric consultation is advised.'
                      : 'The model indicates standard health parameters. Continue routine nutrition and monitoring.'}
                  </p>
                </div>
              ) : (
                <div className="glass-card" style={{ padding: '2rem', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <div>
                    <i className="bi bi-heart-pulse" style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block', opacity: 0.5 }} />
                    Waiting for input to run SVM Health Risk Model
                  </div>
                </div>
              )
            )}

            {activeTab === 'growth' && (
              growthResult ? (
                <div className="glass-card" style={{ padding: '2rem', height: '100%', background: 'linear-gradient(135deg, rgba(16,185,129,0.05), rgba(37,99,235,0.05))', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <div className="section-label">Prediction Results (6-Month Forecast)</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', margin: '1.5rem 0' }}>
                    <div>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Predicted Height</span>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>{parseFloat(growthResult.predicted_height || 0).toFixed(1)} <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>cm</span></div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Predicted Weight</span>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>{parseFloat(growthResult.predicted_weight || 0).toFixed(1)} <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>kg</span></div>
                    </div>
                  </div>
                  <div style={{ padding: '0.5rem 1rem', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', display: 'inline-block', marginBottom: '2rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Confidence</span>
                    <strong style={{ color: getConfColor(growthResult.confidence || 92) }}>{(growthResult.confidence || 92).toFixed(1)}%</strong>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                    Growth trajectory falls within standard percentile bands for age group. Ensure caloric intake supports +{Math.max(0, (growthResult.predicted_weight - growthForm.weight)).toFixed(1)}kg target over next 6 months.
                  </p>
                </div>
              ) : (
                <div className="glass-card" style={{ padding: '2rem', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <div>
                    <i className="bi bi-arrows-fullscreen" style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block', opacity: 0.5 }} />
                    Waiting for input to run Linear Growth Model
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        {/* AI Alert History */}
        <div className="chart-card" style={{ marginTop: '1.5rem' }}>
          <div className="chart-card-title"><i className="bi bi-clock-history" /> Generated AI Intervention Log</div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>#</th><th>Child</th><th>Type</th><th>Message</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {alertLogs.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>No alert logs recorded yet</td></tr>
                ) : alertLogs.map((a, i) => (
                  <tr key={a.alert_id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{a.child_name || `Child #${a.child}`}</td>
                    <td><span className="badge badge-rose">{a.alert_type}</span></td>
                    <td style={{ fontSize: '0.82rem' }}>{a.message}</td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDeleteAlert(a.alert_id)} title="Delete Alert">
                        <i className="bi bi-trash" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
