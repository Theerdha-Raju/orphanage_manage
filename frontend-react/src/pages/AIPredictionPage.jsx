import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import TopHeader from '../components/TopHeader';
import { getLoggedInChild } from '../utils/childAuth';

const API = '/api';

const riskColor = (r) => r === 'High' ? '#ef4444' : r === 'Medium' ? '#f59e0b' : r === 'Low' ? '#10b981' : '#64748b';
const riskBg   = (r) => r === 'High' ? 'rgba(239,68,68,0.08)' : r === 'Medium' ? 'rgba(245,158,11,0.08)' : 'rgba(16,185,129,0.08)';

export default function AIPredictionPage() {
  const { toggleSidebar } = useOutletContext();
  const [activeTab, setActiveTab] = useState('academic');

  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState('');
  const [alertLogs, setAlertLogs] = useState([]);

  // 1. Academic State (Random Forest)
  const [acadForm, setAcadForm] = useState({ attendance: 85, past_score: 75, study_hours: 3 });
  const [acadResult, setAcadResult] = useState(null);
  const [acadLoading, setAcadLoading] = useState(false);

  // 2. Health State (SVM)
  const [healthForm, setHealthForm] = useState({ bmi: 18.5, sick_days: 2 });
  const [healthResult, setHealthResult] = useState(null);
  const [healthLoading, setHealthLoading] = useState(false);

  // 3. Behavior State (KNN)
  const [behavForm, setBehavForm] = useState({ incidents: 1, interaction_score: 8 });
  const [behavResult, setBehavResult] = useState(null);
  const [behavLoading, setBehavLoading] = useState(false);

  // 4. Growth State (Linear Growth / Logistic)
  const [growthForm, setGrowthForm] = useState({ age: 10, height: 135, weight: 30 });
  const [growthResult, setGrowthResult] = useState(null);
  const [growthLoading, setGrowthLoading] = useState(false);

  // 5. Development Score
  const [devScore, setDevScore] = useState(null);
  const [devLoading, setDevLoading] = useState(false);

  // 6. Learning Recommendations
  const [learnRec, setLearnRec] = useState(null);
  const [learnLoading, setLearnLoading] = useState(false);

  // 7. Bulk Scan
  const [bulkResult, setBulkResult] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Role-based: child sees only their own data
  const userRole = localStorage.getItem('userRole') || '';
  const isChild  = userRole === 'child';

  const loadInitialData = () => {
    fetch(`${API}/children/`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setChildren(data);
          if (isChild) {
            // Lock to the logged-in child's own record
            const myChild = getLoggedInChild(data);
            if (myChild) setSelectedChild(myChild.child_id.toString());
          } else if (data.length > 0) {
            setSelectedChild(data[0].child_id.toString());
          }
        }
      }).catch(() => {});

    fetch(`${API}/alerts/`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setAlertLogs(data); })
      .catch(() => {});
  };

  useEffect(() => { loadInitialData(); }, []);

  useEffect(() => {
    if (activeTab === 'learning' && selectedChild && !learnRec && !learnLoading) {
      fetchLearnRec();
    }
  }, [activeTab, selectedChild]);

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
      fetch(`${API}/alerts/`).then(res => res.json()).then(logs => setAlertLogs(Array.isArray(logs) ? logs : []));
    } catch {} finally { setLoad(false); }
  };

  const analyzeFromDB = async (type) => {
    if (!selectedChild) return;
    const loaders = { academic: setAcadLoading, health: setHealthLoading, behavior: setBehavLoading };
    const setters = { academic: setAcadResult, health: setHealthResult, behavior: setBehavResult };
    const loader = loaders[type];
    const setter = setters[type];
    if (!loader || !setter) return;
    loader(true);
    try {
      const r = await fetch(`${API}/predict/${type}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ child_id: selectedChild, use_child_data: true })
      });
      const data = await r.json();
      setter(data);
      fetch(`${API}/alerts/`).then(res => res.json()).then(logs => setAlertLogs(Array.isArray(logs) ? logs : []));
    } catch {} finally { loader(false); }
  };

  const fetchDevScore = async () => {
    if (!selectedChild) return;
    setDevLoading(true);
    try {
      const r = await fetch(`${API}/children/${selectedChild}/development-score/`);
      const data = await r.json();
      setDevScore(data);
    } catch {} finally { setDevLoading(false); }
  };

  const fetchLearnRec = async () => {
    if (!selectedChild) return;
    setLearnLoading(true);
    try {
      const r = await fetch(`${API}/education/recommendations/${selectedChild}/`);
      const data = await r.json();
      setLearnRec(data);
    } catch {} finally { setLearnLoading(false); }
  };

  const handleBulkScan = async () => {
    setBulkLoading(true);
    try {
      const r = await fetch(`${API}/predict/bulk-scan/`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      const data = await r.json();
      setBulkResult(data);
    } catch {} finally { setBulkLoading(false); }
  };

  const handleDeleteAlert = async (id) => {
    try {
      await fetch(`${API}/alerts/${id}/`, { method: 'DELETE' });
      setAlertLogs(prev => prev.filter(a => a.alert_id !== id));
    } catch {}
  };

  const getConfColor = (c) => c > 85 ? '#4ade80' : c > 70 ? '#fbbf24' : '#ef4444';

  const tabs = [
    { id: 'academic',  label: 'Academic Trajectory',  icon: 'bi-graph-up-arrow' },
    { id: 'health',    label: 'Health Risk',           icon: 'bi-heart-pulse' },
    { id: 'behavior',  label: 'Behavioral Pattern',   icon: 'bi-person-check-fill' },
    { id: 'growth',    label: 'Growth Forecast',       icon: 'bi-arrows-fullscreen' },
    { id: 'devscore',  label: 'Development Score',    icon: 'bi-speedometer2' },
    { id: 'learning',  label: 'Learning Plan',         icon: 'bi-journal-bookmark-fill' },
    ...(!isChild ? [{ id: 'bulk', label: 'Bulk AI Scan', icon: 'bi-cpu-fill' }] : []),
  ];

  return (
    <>
      <TopHeader title="AI Predictions Hub" onToggleSidebar={toggleSidebar} />

      <div className="page-body">
        <div className="page-banner">
          <div>
            <div className="section-label">Intelligence</div>
            <div className="page-banner-title">Machine Learning Engine</div>
            <div className="page-banner-sub">Predict academic performance, health risks, behavioral patterns, and growth forecasts using Random Forest, SVM &amp; KNN</div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {isChild ? (
              // Child: show their name as a fixed badge, no dropdown
              <span className="badge badge-accent" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>
                <i className="bi bi-person-fill" style={{ marginRight: '0.4rem' }} />
                {children.find(c => String(c.child_id) === String(selectedChild))?.full_name || 'My Profile'}
              </span>
            ) : (
              <select className="form-control" style={{ width: 'auto', background: 'var(--bg-surface)' }} value={selectedChild} onChange={e => setSelectedChild(e.target.value)}>
                {children.map(c => (
                  <option key={c.child_id} value={c.child_id}>{c.full_name}</option>
                ))}
              </select>
            )}
            <span className="badge badge-accent">
              <i className="bi bi-cpu-fill" /> 4 AI Models Online
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', overflowX: 'auto' }}>
          {tabs.map(t => (
            <button
              key={t.id}
              className={`btn ${activeTab === t.id ? 'btn-primary' : 'btn-ghost'}`}
              style={{ whiteSpace: 'nowrap', fontSize: '0.82rem' }}
              onClick={() => setActiveTab(t.id)}
            >
              <i className={`bi ${t.icon}`} /> {t.label}
            </button>
          ))}
        </div>

        {/* ======================== ACADEMIC ======================== */}
        {activeTab === 'academic' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="glass-card" style={{ padding: '2rem' }}>
              <h4 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>
                <i className="bi bi-graph-up-arrow me-2" style={{ color: 'var(--accent)' }}/> Academic Model (Random Forest)
              </h4>
              {/* Analyze from DB button */}
              <button
                className="btn btn-ghost w-full"
                style={{ marginBottom: '1.2rem', border: '1px dashed var(--accent)', color: 'var(--accent)', justifyContent: 'center' }}
                onClick={() => analyzeFromDB('academic')}
                disabled={acadLoading}
              >
                <i className="bi bi-database-fill-up me-1" />
                {acadLoading ? 'Analyzing...' : 'Analyze from Database Records'}
              </button>
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1rem' }}>— or simulate manually —</div>
              <form onSubmit={e => { e.preventDefault(); predict('academic', acadForm, setAcadLoading, setAcadResult); }}>
                <div className="form-group">
                  <label className="form-label">Attendance (%)</label>
                  <input type="number" min="0" max="100" className="form-control" value={acadForm.attendance} onChange={e => setAcadForm(f => ({...f, attendance: parseFloat(e.target.value) || 0}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Past Average Score (%)</label>
                  <input type="number" min="0" max="100" className="form-control" value={acadForm.past_score} onChange={e => setAcadForm(f => ({...f, past_score: parseFloat(e.target.value) || 0}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Daily Study Hours</label>
                  <input type="number" min="0" max="24" step="0.5" className="form-control" value={acadForm.study_hours} onChange={e => setAcadForm(f => ({...f, study_hours: parseFloat(e.target.value) || 0}))} />
                </div>
                <button type="submit" className="btn btn-primary w-full mt-3" disabled={acadLoading} style={{ justifyContent: 'center' }}>
                  {acadLoading ? <><span className="spinner spinner-sm" /> Running Model...</> : <><i className="bi bi-cpu-fill" /> Generate Prediction</>}
                </button>
              </form>
            </div>
            <div>
              {acadResult ? (
                <div className="glass-card" style={{ padding: '2rem', height: '100%', background: 'linear-gradient(135deg, rgba(37,99,235,0.05), rgba(124,58,237,0.05))', border: '1px solid rgba(37,99,235,0.2)' }}>
                  <div className="section-label">Prediction Results</div>
                  {acadResult.status === 'insufficient_data' ? (
                    <div style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>
                      <i className="bi bi-info-circle me-2" style={{ color: '#f59e0b' }} />
                      {acadResult.message}
                    </div>
                  ) : (
                    <>
                      <h2 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--text-primary)', margin: '1rem 0' }}>
                        {typeof acadResult.predicted_score === 'number' ? acadResult.predicted_score.toFixed(1) : acadResult.predicted_score}%
                      </h2>
                      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                        {acadResult.child_name && (
                          <div style={{ padding: '0.5rem 1rem', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Child</span>
                            <strong style={{ color: 'var(--text-primary)' }}>{acadResult.child_name}</strong>
                          </div>
                        )}
                        <div style={{ padding: '0.5rem 1rem', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Risk Level</span>
                          <strong style={{ color: riskColor(acadResult.risk_level) }}>{acadResult.risk_level}</strong>
                        </div>
                        <div style={{ padding: '0.5rem 1rem', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Trend</span>
                          <strong style={{ color: acadResult.performance_trend === 'Improving' ? '#10b981' : acadResult.performance_trend === 'Declining' ? '#ef4444' : '#64748b' }}>
                            {acadResult.performance_trend || acadResult.predicted_performance}
                          </strong>
                        </div>
                        <div style={{ padding: '0.5rem 1rem', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Model Confidence</span>
                          <strong style={{ color: getConfColor(acadResult.confidence || 90) }}>{(acadResult.confidence || 90).toFixed(1)}%</strong>
                        </div>
                      </div>
                      {acadResult.current_average && (
                        <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
                          <div style={{ padding: '0.5rem 1rem', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Current Avg</span>
                            <strong>{acadResult.current_average}%</strong>
                          </div>
                          <div style={{ padding: '0.5rem 1rem', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Attendance</span>
                            <strong>{acadResult.attendance_rate}%</strong>
                          </div>
                        </div>
                      )}
                      <div style={{ padding: '1rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                        <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.05em' }}>AI Recommendation</span>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0.3rem 0 0', lineHeight: 1.5 }}>
                          {acadResult.recommendation || 'Maintain current study routine.'}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="glass-card" style={{ padding: '2rem', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <div>
                    <i className="bi bi-cpu" style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block', opacity: 0.5 }} />
                    Click "Analyze from Database" or enter parameters to run the Random Forest Academic Model
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================== HEALTH ======================== */}
        {activeTab === 'health' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="glass-card" style={{ padding: '2rem' }}>
              <h4 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>
                <i className="bi bi-heart-pulse me-2" style={{ color: '#ef4444' }}/> Health Risk Model (SVM)
              </h4>
              <button
                className="btn btn-ghost w-full"
                style={{ marginBottom: '1.2rem', border: '1px dashed #ef4444', color: '#ef4444', justifyContent: 'center' }}
                onClick={() => analyzeFromDB('health')}
                disabled={healthLoading}
              >
                <i className="bi bi-database-fill-up me-1" />
                {healthLoading ? 'Analyzing...' : 'Analyze from Database Records'}
              </button>
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1rem' }}>— or simulate manually —</div>
              <form onSubmit={e => { e.preventDefault(); predict('health', healthForm, setHealthLoading, setHealthResult); }}>
                <div className="form-group">
                  <label className="form-label">Body Mass Index (BMI)</label>
                  <input type="number" step="0.1" className="form-control" value={healthForm.bmi} onChange={e => setHealthForm(f => ({...f, bmi: parseFloat(e.target.value) || 0}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Sick Days (Last 3 months)</label>
                  <input type="number" min="0" className="form-control" value={healthForm.sick_days} onChange={e => setHealthForm(f => ({...f, sick_days: parseInt(e.target.value) || 0}))} />
                </div>
                <button type="submit" className="btn btn-primary w-full mt-3" disabled={healthLoading} style={{ justifyContent: 'center' }}>
                  {healthLoading ? <><span className="spinner spinner-sm" /> Running Model...</> : <><i className="bi bi-cpu-fill" /> Generate Prediction</>}
                </button>
              </form>
            </div>
            <div>
              {healthResult ? (
                <div className="glass-card" style={{ padding: '2rem', height: '100%', background: riskBg(healthResult.risk_level), border: `1px solid ${riskColor(healthResult.risk_level)}40` }}>
                  <div className="section-label">Health Risk Assessment</div>
                  <h2 style={{ fontSize: '2.2rem', fontFamily: 'var(--font-display)', fontWeight: 800, color: riskColor(healthResult.risk_level), margin: '1rem 0' }}>
                    {healthResult.risk_level} Risk
                  </h2>
                  {healthResult.child_name && (
                    <div style={{ marginBottom: '1rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Patient: </span>
                      <strong style={{ color: 'var(--text-primary)' }}>{healthResult.child_name}</strong>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                    {healthResult.bmi && (
                      <div style={{ padding: '0.5rem 1rem', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>BMI</span>
                        <strong>{healthResult.bmi}</strong>
                      </div>
                    )}
                    {healthResult.height_cm && (
                      <div style={{ padding: '0.5rem 1rem', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Height</span>
                        <strong>{healthResult.height_cm} cm</strong>
                      </div>
                    )}
                    {healthResult.weight_kg && (
                      <div style={{ padding: '0.5rem 1rem', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Weight</span>
                        <strong>{healthResult.weight_kg} kg</strong>
                      </div>
                    )}
                    <div style={{ padding: '0.5rem 1rem', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Confidence</span>
                      <strong style={{ color: getConfColor(healthResult.confidence || 85) }}>{(healthResult.confidence || 85).toFixed(1)}%</strong>
                    </div>
                  </div>
                  {healthResult.health_status && (
                    <div style={{ marginBottom: '1rem', padding: '0.5rem 1rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Health Status</span>
                      <strong>{healthResult.health_status}</strong>
                    </div>
                  )}
                  <div style={{ padding: '1rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#ef4444', fontWeight: 700, letterSpacing: '0.05em' }}>AI Recommendation</span>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0.3rem 0 0', lineHeight: 1.5 }}>{healthResult.recommendation}</p>
                  </div>
                  {healthResult.disclaimer && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem', fontStyle: 'italic' }}>
                      <i className="bi bi-info-circle me-1" />{healthResult.disclaimer}
                    </p>
                  )}
                </div>
              ) : (
                <div className="glass-card" style={{ padding: '2rem', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <div>
                    <i className="bi bi-heart-pulse" style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block', opacity: 0.5 }} />
                    Click "Analyze from Database" or enter BMI parameters to run SVM Health Risk Model
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================== BEHAVIOR ======================== */}
        {activeTab === 'behavior' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="glass-card" style={{ padding: '2rem' }}>
              <h4 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>
                <i className="bi bi-person-check-fill me-2" style={{ color: '#8b5cf6' }}/> Behavioral Pattern Model (KNN)
              </h4>
              <button
                className="btn btn-ghost w-full"
                style={{ marginBottom: '1.2rem', border: '1px dashed #8b5cf6', color: '#8b5cf6', justifyContent: 'center' }}
                onClick={() => analyzeFromDB('behavior')}
                disabled={behavLoading}
              >
                <i className="bi bi-database-fill-up me-1" />
                {behavLoading ? 'Analyzing...' : 'Analyze from Database Records'}
              </button>
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1rem' }}>— or simulate manually —</div>
              <form onSubmit={e => { e.preventDefault(); predict('behavior', behavForm, setBehavLoading, setBehavResult); }}>
                <div className="form-group">
                  <label className="form-label">Discipline / Conflict Incidents</label>
                  <input type="number" min="0" className="form-control" value={behavForm.incidents} onChange={e => setBehavForm(f => ({...f, incidents: parseInt(e.target.value) || 0}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Social Interaction Score (1–10)</label>
                  <input type="number" min="1" max="10" className="form-control" value={behavForm.interaction_score} onChange={e => setBehavForm(f => ({...f, interaction_score: parseFloat(e.target.value) || 0}))} />
                </div>
                <button type="submit" className="btn btn-primary w-full mt-3" disabled={behavLoading} style={{ justifyContent: 'center' }}>
                  {behavLoading ? <><span className="spinner spinner-sm" /> Running Model...</> : <><i className="bi bi-cpu-fill" /> Generate Prediction</>}
                </button>
              </form>
            </div>
            <div>
              {behavResult ? (
                <div className="glass-card" style={{ padding: '2rem', height: '100%', background: 'linear-gradient(135deg, rgba(139,92,246,0.05), rgba(37,99,235,0.05))', border: '1px solid rgba(139,92,246,0.2)' }}>
                  <div className="section-label">Behavioral Assessment</div>
                  <h2 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-display)', fontWeight: 800, color: '#8b5cf6', margin: '1rem 0' }}>
                    {behavResult.behavior_status || behavResult.development_status}
                  </h2>
                  {behavResult.child_name && (
                    <div style={{ marginBottom: '1rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Child: </span>
                      <strong style={{ color: 'var(--text-primary)' }}>{behavResult.child_name}</strong>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                    {behavResult.behaviour_trend && (
                      <div style={{ padding: '0.5rem 1rem', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Trend</span>
                        <strong style={{ color: behavResult.behaviour_trend === 'Improving' ? '#10b981' : behavResult.behaviour_trend === 'Needs Support' ? '#ef4444' : '#64748b' }}>
                          {behavResult.behaviour_trend}
                        </strong>
                      </div>
                    )}
                    {behavResult.average_interaction_score !== undefined && (
                      <div style={{ padding: '0.5rem 1rem', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Interaction Score</span>
                        <strong>{behavResult.average_interaction_score}/10</strong>
                      </div>
                    )}
                    <div style={{ padding: '0.5rem 1rem', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Confidence</span>
                      <strong style={{ color: getConfColor(behavResult.confidence || 88) }}>{(behavResult.confidence || 88).toFixed(1)}%</strong>
                    </div>
                  </div>
                  <div style={{ padding: '1rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#8b5cf6', fontWeight: 700, letterSpacing: '0.05em' }}>AI Recommendation</span>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0.3rem 0 0', lineHeight: 1.5 }}>
                      {behavResult.recommendation || behavResult.recommended_intervention}
                    </p>
                  </div>
                  {behavResult.important_observations && (
                    <div style={{ padding: '1rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Latest Observation</span>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.3rem 0 0' }}>{behavResult.important_observations}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="glass-card" style={{ padding: '2rem', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <div>
                    <i className="bi bi-person-check-fill" style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block', opacity: 0.5 }} />
                    Click "Analyze from Database" or enter parameters to run KNN Behavioral Model
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================== GROWTH ======================== */}
        {activeTab === 'growth' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="glass-card" style={{ padding: '2rem' }}>
              <h4 style={{ color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
                <i className="bi bi-arrows-fullscreen me-2" style={{ color: '#10b981' }}/> Growth Forecast Model (Logistic &amp; Linear Trajectory)
              </h4>
              <form onSubmit={e => { e.preventDefault(); predict('growth', growthForm, setGrowthLoading, setGrowthResult); }}>
                <div className="form-group">
                  <label className="form-label">Current Age (Years)</label>
                  <input type="number" min="1" max="18" className="form-control" value={growthForm.age} onChange={e => setGrowthForm(f => ({...f, age: parseInt(e.target.value) || 0}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Current Height (cm)</label>
                  <input type="number" step="0.1" className="form-control" value={growthForm.height} onChange={e => setGrowthForm(f => ({...f, height: parseFloat(e.target.value) || 0}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Current Weight (kg)</label>
                  <input type="number" step="0.1" className="form-control" value={growthForm.weight} onChange={e => setGrowthForm(f => ({...f, weight: parseFloat(e.target.value) || 0}))} />
                </div>
                <button type="submit" className="btn btn-primary w-full mt-3" disabled={growthLoading} style={{ justifyContent: 'center' }}>
                  {growthLoading ? <><span className="spinner spinner-sm" /> Running Model...</> : <><i className="bi bi-cpu-fill" /> Generate Prediction</>}
                </button>
              </form>
            </div>
            <div>
              {growthResult ? (
                <div className="glass-card" style={{ padding: '2rem', height: '100%', background: 'linear-gradient(135deg, rgba(16,185,129,0.05), rgba(37,99,235,0.05))', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <div className="section-label">Growth Forecast (6-Month)</div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0.75rem 0' }}>{growthResult.growth_forecast}</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', margin: '1rem 0' }}>
                    <div style={{ padding: '0.75rem', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Projected Height</span>
                      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {growthResult.predicted_height ? growthResult.predicted_height.toFixed(1) : growthForm.height} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-muted)' }}>cm</span>
                      </div>
                    </div>
                    <div style={{ padding: '0.75rem', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Projected Weight</span>
                      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {growthResult.predicted_weight ? growthResult.predicted_weight.toFixed(1) : growthForm.weight} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-muted)' }}>kg</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: '0.5rem 1rem', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', display: 'inline-block', marginBottom: '1.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Model Confidence</span>
                    <strong style={{ color: getConfColor(growthResult.confidence || 92) }}>{(growthResult.confidence || 92).toFixed(1)}%</strong>
                  </div>
                  <div style={{ padding: '1rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#10b981', fontWeight: 700, letterSpacing: '0.05em' }}>AI Recommendation</span>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0.3rem 0 0', lineHeight: 1.5 }}>{growthResult.recommendation}</p>
                  </div>
                </div>
              ) : (
                <div className="glass-card" style={{ padding: '2rem', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <div>
                    <i className="bi bi-arrows-fullscreen" style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block', opacity: 0.5 }} />
                    Enter age, height, and weight to run the Linear Growth Model
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================== DEVELOPMENT SCORE ======================== */}
        {activeTab === 'devscore' && (
          <div>
            <div className="glass-card" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
              <h4 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>
                <i className="bi bi-speedometer2 me-2" style={{ color: '#f59e0b' }} /> Child Development Score — Multi-Dimensional AI Analysis
              </h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Computes a weighted composite score across 5 dimensions: Academic (25%), Health (25%), Attendance (20%), Behaviour (20%), and Achievements (10%) using live database records.
              </p>
              <button className="btn btn-primary" onClick={fetchDevScore} disabled={devLoading}>
                {devLoading ? <><span className="spinner spinner-sm" /> Computing...</> : <><i className="bi bi-speedometer2 me-1" /> Compute Development Score</>}
              </button>
            </div>

            {devScore && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
                <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(37,99,235,0.08))' }}>
                  <div className="section-label" style={{ marginBottom: '1rem' }}>Overall Score</div>
                  <div style={{ fontSize: '4rem', fontWeight: 900, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                    {devScore.overall_score !== null ? devScore.overall_score : '—'}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>out of 100</div>
                  <div style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                    <strong style={{ color: devScore.overall_score >= 80 ? '#10b981' : devScore.overall_score >= 65 ? '#f59e0b' : '#ef4444' }}>
                      {devScore.overall_status}
                    </strong>
                  </div>
                  <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <strong style={{ color: 'var(--text-primary)' }}>{devScore.child_name}</strong>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {devScore.dimensions && Object.entries(devScore.dimensions).map(([key, dim]) => (
                    <div key={key} className="glass-card" style={{ padding: '1.5rem' }}>
                      <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{dim.label}</div>
                      <div style={{ fontSize: '2rem', fontWeight: 800, color: dim.score !== null ? (dim.score >= 80 ? '#10b981' : dim.score >= 60 ? '#f59e0b' : '#ef4444') : '#64748b' }}>
                        {dim.score !== null ? dim.score : '—'}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{dim.status}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================== LEARNING RECOMMENDATIONS ======================== */}
        {activeTab === 'learning' && (
          <div>
            <div className="glass-card" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
              <h4 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>
                <i className="bi bi-journal-bookmark-fill me-2" style={{ color: '#3b82f6' }} /> AI-Generated Personalized Learning Plan
              </h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Generates subject-wise, actionable learning recommendations based on real exam marks and attendance records in the database.
              </p>
              <button className="btn btn-primary" onClick={fetchLearnRec} disabled={learnLoading}>
                {learnLoading ? <><span className="spinner spinner-sm" /> Generating...</> : <><i className="bi bi-lightbulb-fill me-1" /> Generate Learning Plan</>}
              </button>
            </div>

            {learnRec && (
              <div>
                {!learnRec.has_data ? (
                  <div className="glass-card" style={{ padding: '2rem', color: 'var(--text-muted)' }}>
                    <i className="bi bi-info-circle me-2" style={{ color: '#f59e0b' }} />
                    {learnRec.message}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                      <span className="badge badge-accent"><i className="bi bi-person-fill me-1" />{learnRec.child_name}</span>
                      {learnRec.overall_attendance && (
                        <span className="badge" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                          <i className="bi bi-calendar-check me-1" />Attendance: {learnRec.overall_attendance}%
                        </span>
                      )}
                      <span className="badge" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
                        {learnRec.total_subjects_evaluated} Subjects Evaluated
                      </span>
                    </div>
                    {learnRec.recommendations.map((rec, i) => (
                      <div key={i} className="glass-card" style={{ padding: '1.5rem', borderLeft: `4px solid ${rec.priority === 'High' ? '#ef4444' : rec.priority === 'Medium' ? '#f59e0b' : '#10b981'}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                          <div>
                            <strong style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>{rec.subject}</strong>
                            {rec.current_average && (
                              <span style={{ marginLeft: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Avg: {rec.current_average}%</span>
                            )}
                          </div>
                          <span style={{ padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700,
                            background: rec.priority === 'High' ? 'rgba(239,68,68,0.1)' : rec.priority === 'Medium' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
                            color: rec.priority === 'High' ? '#ef4444' : rec.priority === 'Medium' ? '#f59e0b' : '#10b981'
                          }}>
                            {rec.priority} Priority
                          </span>
                        </div>
                        <div style={{ marginBottom: '0.5rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>Status: <strong style={{ color: 'var(--text-secondary)' }}>{rec.status}</strong></div>
                        <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.2rem', color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.7 }}>
                          {rec.actionable_steps.map((step, j) => <li key={j}>{step}</li>)}
                        </ul>
                        {rec.teacher_remarks && (
                          <div style={{ marginTop: '0.75rem', fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            <i className="bi bi-chat-quote me-1" />Teacher: {rec.teacher_remarks}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ======================== BULK AI SCAN ======================== */}
        {activeTab === 'bulk' && (
          <div>
            <div className="glass-card" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
              <h4 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>
                <i className="bi bi-cpu-fill me-2" style={{ color: 'var(--accent)' }} /> Bulk AI Risk Scan — All Children
              </h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Runs Academic (Random Forest), Health (SVM), and Behavioral (KNN) predictions simultaneously for all active children and ranks them by risk level.
              </p>
              <button className="btn btn-primary" onClick={handleBulkScan} disabled={bulkLoading}>
                {bulkLoading ? <><span className="spinner spinner-sm" /> Scanning All Children...</> : <><i className="bi bi-radar me-1" /> Run Bulk AI Scan</>}
              </button>
            </div>

            {bulkResult && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--text-primary)' }}>{bulkResult.total_scanned}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Children Scanned</div>
                  </div>
                  <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#ef4444' }}>{bulkResult.high_risk}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>High Risk Flags</div>
                  </div>
                  <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#f59e0b' }}>{bulkResult.medium_risk}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Medium Risk Flags</div>
                  </div>
                </div>
                <div className="chart-card">
                  <div className="chart-card-title"><i className="bi bi-table" /> Risk Assessment Results</div>
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Child Name</th>
                          <th>Academic Risk</th>
                          <th>Health Risk</th>
                          <th>Behaviour Trend</th>
                          <th>Dev Score</th>
                          <th>Overall Risk</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bulkResult.results.map((row, i) => (
                          <tr key={row.child_id}>
                            <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{i + 1}</td>
                            <td style={{ fontWeight: 600 }}>{row.child_name}</td>
                            <td><span style={{ padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, background: riskBg(row.academic_risk), color: riskColor(row.academic_risk) }}>{row.academic_risk}</span></td>
                            <td><span style={{ padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, background: riskBg(row.health_risk), color: riskColor(row.health_risk) }}>{row.health_risk}</span></td>
                            <td style={{ fontSize: '0.85rem' }}>{row.behaviour_trend}</td>
                            <td style={{ fontWeight: 700 }}>{row.development_score !== null ? row.development_score : '—'}</td>
                            <td>
                              <span style={{ padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 700, background: riskBg(row.overall_risk), color: riskColor(row.overall_risk), border: `1px solid ${riskColor(row.overall_risk)}40` }}>
                                {row.overall_risk}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* AI Alert History */}
        <div className="chart-card" style={{ marginTop: '1.5rem' }}>
          <div className="chart-card-title"><i className="bi bi-clock-history" /> Generated AI Intervention Log</div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>#</th><th>Child</th><th>Type</th><th>Priority</th><th>Message</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {alertLogs.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>No alert logs recorded yet</td></tr>
                ) : alertLogs.map((a, i) => (
                  <tr key={a.alert_id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{a.child_name || `Child #${a.child}`}</td>
                    <td><span className="badge badge-rose">{a.alert_type}</span></td>
                    <td>
                      <span style={{ padding: '0.15rem 0.5rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700, background: riskBg(a.priority), color: riskColor(a.priority) }}>
                        {a.priority}
                      </span>
                    </td>
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
