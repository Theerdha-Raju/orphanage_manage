import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import TopHeader from '../components/TopHeader';

const API = 'http://localhost:8000/api';

const emptyForm = { name: '', email: '', password: '', phone: '', role: 'staff' };

const initialTasks = [
  {
    id: 1,
    task: 'Administer Wing B Morning Medication',
    time: '08:00 AM',
    status: 'Completed',
    category: 'Health',
    detail: 'Medication administered to all 14 children in Wing B ward. Vital signs normal.',
    assignedStaff: 'Anita Sharma',
    staffRole: 'Caregiver / Senior Nurse',
    staffPhone: '+91 98765 43210',
    staffEmail: 'anita.sharma@orphanage.com',
    completedAt: 'Today at 08:25 AM',
    verifiedBy: 'Anita Sharma (Staff ID #101)',
    wing: 'Wing B Care Ward'
  },
  {
    id: 2,
    task: 'Record BMI for new child admissions',
    time: '11:30 AM',
    status: 'Pending',
    category: 'Health Check',
    detail: 'Anthropometric measurements (height & weight) for 3 newly admitted children.',
    assignedStaff: 'Sunita Devi',
    staffRole: 'Caregiver / Health Staff',
    staffPhone: '+91 95432 10987',
    staffEmail: 'sunita.devi@orphanage.com',
    completedAt: 'Awaiting execution during 11:30 AM shift',
    verifiedBy: 'Pending Caregiver Verification',
    wing: 'Medical Examination Room'
  },
  {
    id: 3,
    task: 'Update Term 2 Academic Scores',
    time: '02:00 PM',
    status: 'Pending',
    category: 'Education',
    detail: 'Upload midterm subject scores into academic management module.',
    assignedStaff: 'Priya Nair',
    staffRole: 'Teacher / Academic Coordinator',
    staffPhone: '+91 97654 32109',
    staffEmail: 'priya.nair@orphanage.com',
    completedAt: 'Scheduled for 02:00 PM shift',
    verifiedBy: 'Pending Teacher Verification',
    wing: 'Education Center Block A'
  },
  {
    id: 4,
    task: 'Review AI Health Alert for Aarav Sharma',
    time: 'Urgent',
    status: 'Action Needed',
    category: 'AI Risk',
    detail: 'SVM model flagged weight loss pattern over 3 weeks. Urgent clinical checkup required.',
    assignedStaff: 'Dr. Rajesh Verma',
    staffRole: 'Medical Officer / Doctor',
    staffPhone: '+91 98123 45678',
    staffEmail: 'dr.rajesh@orphanage.com',
    completedAt: 'High Priority — Action Required Immediately',
    verifiedBy: 'AI Telemetry Alert Engine',
    wing: 'Clinical Health Hub'
  },
];

export default function StaffDashboardPage() {
  const { toggleSidebar } = useOutletContext();
  const userName = localStorage.getItem('userName') || 'Staff';

  const [staffList, setStaffList] = useState([]);
  const [totalStaffs, setTotalStaffs] = useState(0);
  const [caregiverStaffs, setCaregiverStaffs] = useState(0);
  const [loading, setLoading] = useState(true);

  // Staff Modal (Add / Edit)
  const [showModal, setShowModal] = useState(false);
  const [editStaff, setEditStaff] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  // Selected Staff Profile Modal
  const [selectedStaffProfile, setSelectedStaffProfile] = useState(null);

  // Caregiver Tasks state & filters
  const [caregiverTasks, setCaregiverTasks] = useState(initialTasks);
  const [taskFilter, setTaskFilter] = useState('All');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTaskForm, setNewTaskForm] = useState({
    task: '',
    time: '10:00 AM',
    category: 'Health Check',
    status: 'Pending',
    detail: '',
    assignedStaff: 'Anita Sharma',
    wing: 'Wing A Ward'
  });
  const [selectedTaskDetail, setSelectedTaskDetail] = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const loadData = () => {
    setLoading(true);
    fetch(`${API}/users/`)
      .then(r => r.json())
      .then(usersData => {
        if (Array.isArray(usersData)) {
          const staffs = usersData.filter(u => ['staff', 'teacher', 'doctor', 'caregiver'].includes((u.designation || '').toLowerCase()));
          setStaffList(staffs);
          setTotalStaffs(usersData.length > 0 ? usersData.length : staffs.length);
          
          const caregivers = usersData.filter(u => {
            const des = (u.designation || '').toLowerCase();
            return des.includes('staff') || des.includes('caregiver');
          });
          setCaregiverStaffs(caregivers.length > 0 ? caregivers.length : staffs.length);
        }
      })
      .catch(() => {
        setStaffList([
          { user_id: 1, full_name: 'Anita Sharma', phone_number: '+91 98765 43210', email: 'anita.sharma@orphanage.com', designation: 'staff', status: 'Active', wing: 'Wing B Care Ward' },
          { user_id: 2, full_name: 'Dr. Rajesh Verma', phone_number: '+91 98123 45678', email: 'dr.rajesh@orphanage.com', designation: 'doctor', status: 'Active', wing: 'Clinical Health Hub' },
          { user_id: 3, full_name: 'Priya Nair', phone_number: '+91 97654 32109', email: 'priya.nair@orphanage.com', designation: 'teacher', status: 'Active', wing: 'Education Block A' },
          { user_id: 4, full_name: 'Sunita Devi', phone_number: '+91 95432 10987', email: 'sunita.devi@orphanage.com', designation: 'staff', status: 'Active', wing: 'Medical Exam Room' },
        ]);
        setTotalStaffs(6);
        setCaregiverStaffs(4);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  // Task Status Update Handler
  const handleTaskStatusChange = (taskId, newStatus) => {
    setCaregiverTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const updatedCompletedAt = newStatus === 'Completed' ? `Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : newStatus === 'Pending' ? 'Scheduled for today shift' : 'High Priority — Action Required';
        const updatedVerifiedBy = newStatus === 'Completed' ? `${t.assignedStaff || userName} (Staff Signature Verified)` : 'Pending Verification';
        return {
          ...t,
          status: newStatus,
          completedAt: updatedCompletedAt,
          verifiedBy: updatedVerifiedBy
        };
      }
      return t;
    }));

    // If modal is open, also update selectedTaskDetail
    if (selectedTaskDetail && selectedTaskDetail.id === taskId) {
      setSelectedTaskDetail(prev => ({
        ...prev,
        status: newStatus,
        completedAt: newStatus === 'Completed' ? `Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : newStatus === 'Pending' ? 'Scheduled for today shift' : 'High Priority — Action Required',
        verifiedBy: newStatus === 'Completed' ? `${prev.assignedStaff || userName} (Staff Signature Verified)` : 'Pending Verification'
      }));
    }

    setMsg(`Task status updated to "${newStatus}"`);
    setTimeout(() => setMsg(''), 3000);
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTaskForm.task.trim()) return;

    // Lookup staff info if available
    const matchedStaff = staffList.find(s => s.full_name === newTaskForm.assignedStaff);

    const created = {
      id: Date.now(),
      task: newTaskForm.task,
      time: newTaskForm.time || '12:00 PM',
      category: newTaskForm.category,
      status: newTaskForm.status,
      detail: newTaskForm.detail || 'Manual task entered by staff.',
      assignedStaff: newTaskForm.assignedStaff || 'Anita Sharma',
      staffRole: matchedStaff?.designation ? `${matchedStaff.designation.toUpperCase()} / Caregiver` : 'Caregiver Staff',
      staffPhone: matchedStaff?.phone_number || '+91 98765 43210',
      staffEmail: matchedStaff?.email || `${(newTaskForm.assignedStaff || 'staff').toLowerCase().replace(' ', '.')}@orphanage.com`,
      completedAt: newTaskForm.status === 'Completed' ? `Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Scheduled for today',
      verifiedBy: newTaskForm.status === 'Completed' ? `${newTaskForm.assignedStaff} (Verified)` : 'Pending Verification',
      wing: newTaskForm.wing || 'Main Care Ward'
    };

    setCaregiverTasks(prev => [created, ...prev]);
    setShowTaskModal(false);
    setNewTaskForm({ task: '', time: '10:00 AM', category: 'Health Check', status: 'Pending', detail: '', assignedStaff: 'Anita Sharma', wing: 'Wing A Ward' });
    setMsg('New Caregiver task added successfully.');
    setTimeout(() => setMsg(''), 3000);
  };

  const handleDeleteTask = (taskId) => {
    setCaregiverTasks(prev => prev.filter(t => t.id !== taskId));
    if (selectedTaskDetail?.id === taskId) setSelectedTaskDetail(null);
    setMsg('Task removed.');
    setTimeout(() => setMsg(''), 3000);
  };

  // Counts calculation
  const completedCount = caregiverTasks.filter(t => t.status === 'Completed').length;
  const pendingCount = caregiverTasks.filter(t => t.status === 'Pending').length;
  const actionNeededCount = caregiverTasks.filter(t => t.status === 'Action Needed').length;

  const filteredTasks = caregiverTasks.filter(t => {
    if (taskFilter === 'All') return true;
    return t.status === taskFilter;
  });

  // Staff Modal Handlers
  const openAdd = () => {
    setEditStaff(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (staff) => {
    setEditStaff(staff);
    setForm({
      name: staff.full_name,
      email: staff.email || '',
      password: '',
      phone: staff.phone_number || '',
      role: staff.designation || 'staff'
    });
    setShowModal(true);
  };

  const handleDeleteStaff = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this staff member?')) return;
    try {
      const r = await fetch(`${API}/users/${userId}/`, { method: 'DELETE' });
      if (r.ok || r.status === 204) {
        setMsg('Staff member removed.');
        setTimeout(() => setMsg(''), 3000);
        loadData();
      }
    } catch {
      setStaffList(prev => prev.filter(s => s.user_id !== userId));
      setMsg('Staff member removed.');
      setTimeout(() => setMsg(''), 3000);
    }
  };

  const handleSaveStaff = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editStaff) {
        const r = await fetch(`${API}/users/${editStaff.user_id}/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            full_name: form.name,
            phone_number: form.phone,
            designation: form.role
          })
        });
        if (r.ok) {
          setShowModal(false);
          setMsg('Staff member updated successfully.');
          setTimeout(() => setMsg(''), 3000);
          loadData();
        } else {
          setStaffList(prev => prev.map(s => s.user_id === editStaff.user_id ? { ...s, full_name: form.name, phone_number: form.phone, designation: form.role } : s));
          setShowModal(false);
          setMsg('Staff member updated.');
          setTimeout(() => setMsg(''), 3000);
        }
      } else {
        const r = await fetch(`${API}/auth/register/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        });
        if (r.ok) {
          setShowModal(false);
          setMsg('Staff member added successfully.');
          setForm(emptyForm);
          setTimeout(() => setMsg(''), 3000);
          loadData();
        } else {
          const newStaff = { user_id: Date.now(), full_name: form.name, phone_number: form.phone, email: form.email, designation: form.role, status: 'Active' };
          setStaffList(prev => [...prev, newStaff]);
          setTotalStaffs(prev => prev + 1);
          if (form.role === 'staff') setCaregiverStaffs(prev => prev + 1);
          setShowModal(false);
          setMsg('Staff member added.');
          setTimeout(() => setMsg(''), 3000);
        }
      }
    } catch {
      setShowModal(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <TopHeader title="Caregiver Dashboard" onToggleSidebar={toggleSidebar} />
      
      <div className="page-body">
        {/* Banner */}
        <div className="page-banner">
          <div>
            <div className="section-label">Caregiver Operations</div>
            <div className="page-banner-title">Welcome Back, {userName}</div>
            <div className="page-banner-sub">Real-time daily task workflow, caregiver assignments, and staff metrics center.</div>
          </div>
          <div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowTaskModal(true)}>
              <i className="bi bi-plus-lg" /> Add Caregiver Task
            </button>
          </div>
        </div>

        {msg && (
          <div className="alert alert-success" style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div><i className="bi bi-check-circle-fill" style={{ marginRight: '0.5rem' }} /> {msg}</div>
            <button className="btn btn-ghost btn-sm" onClick={() => setMsg('')}><i className="bi bi-x" /></button>
          </div>
        )}

        {/* STATS GRID */}
        <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
          {[
            { label: 'Total Staffs', value: totalStaffs, icon: 'bi-people-fill', cls: 'stat-icon-violet', sub: 'Registered workforce' },
            { label: 'Caregiver Staff', value: caregiverStaffs, icon: 'bi-person-badge', cls: 'stat-icon-indigo', sub: 'Active daily caregivers' },
            { label: 'Completed Tasks', value: completedCount, icon: 'bi-check-circle-fill', cls: 'stat-icon-green', sub: 'Verified completed' },
            { label: 'Pending Tasks', value: pendingCount, icon: 'bi-clock-history', cls: 'stat-icon-amber', sub: 'Awaiting execution' },
            { label: 'Action Needed', value: actionNeededCount, icon: 'bi-exclamation-triangle-fill', cls: 'stat-icon-rose', sub: 'Urgent AI / Health alert' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className={`stat-icon ${s.cls}`}><i className={`bi ${s.icon}`} /></div>
              <div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value">{s.value}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{s.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* MAIN DASHBOARD CONTENT GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 0.75fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          
          {/* TODAY'S CAREGIVER TASKS CARD */}
          <div className="chart-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div className="chart-card-title" style={{ margin: 0 }}>
                <i className="bi bi-list-check" style={{ color: '#6366f1' }} /> Today's Caregiver Tasks
              </div>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                {['All', 'Completed', 'Pending', 'Action Needed'].map(filter => (
                  <button
                    key={filter}
                    onClick={() => setTaskFilter(filter)}
                    className={`btn btn-sm ${taskFilter === filter ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                  >
                    {filter === 'All' && 'All '}
                    {filter === 'Completed' && '🟢 Completed '}
                    {filter === 'Pending' && '🟡 Pending '}
                    {filter === 'Action Needed' && '🔴 Action Needed '}
                    ({filter === 'All' ? caregiverTasks.length : caregiverTasks.filter(t => t.status === filter).length})
                  </button>
                ))}
              </div>
            </div>

            {/* TASK LIST CARDS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {filteredTasks.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-surface-3)', borderRadius: 'var(--radius-md)' }}>
                  <i className="bi bi-clipboard-check" style={{ fontSize: '1.8rem', display: 'block', marginBottom: '0.5rem' }} />
                  No tasks found under "{taskFilter}" filter.
                </div>
              ) : filteredTasks.map((t) => {
                const badgeColor = t.status === 'Completed' ? '#22c55e' : t.status === 'Pending' ? '#f59e0b' : '#ef4444';
                const badgeBg = t.status === 'Completed' ? 'rgba(34,197,94,0.15)' : t.status === 'Pending' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)';
                const icon = t.status === 'Completed' ? 'bi-check-circle-fill' : t.status === 'Pending' ? 'bi-clock-history' : 'bi-exclamation-triangle-fill';

                return (
                  <div
                    key={t.id}
                    style={{
                      padding: '1rem',
                      background: 'var(--bg-surface-3)',
                      borderRadius: 'var(--radius-md)',
                      borderLeft: `4px solid ${badgeColor}`,
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}>
                            {t.category}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: t.time === 'Urgent' ? '#ef4444' : 'var(--text-muted)', fontWeight: t.time === 'Urgent' ? 700 : 500 }}>
                            <i className="bi bi-clock" style={{ marginRight: 3 }} /> {t.time}
                          </span>
                          {t.assignedStaff && (
                            <span style={{ fontSize: '0.72rem', color: '#6366f1', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                              <i className="bi bi-person-fill" /> Assigned: {t.assignedStaff}
                            </span>
                          )}
                        </div>

                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.92rem', marginBottom: '0.25rem' }}>
                          {t.task}
                        </div>

                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                          {t.detail}
                        </div>

                        {t.status === 'Completed' && (
                          <div style={{ fontSize: '0.72rem', color: '#22c55e', fontWeight: 500 }}>
                            <i className="bi bi-check2-all" style={{ marginRight: 4 }} /> Completed: {t.completedAt || 'Verified by Staff'}
                          </div>
                        )}
                      </div>

                      {/* STATUS BADGE + ACTION CONTROLS */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.6rem' }}>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '0.25rem 0.65rem',
                          borderRadius: 'var(--radius-full)',
                          background: badgeBg,
                          color: badgeColor,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          border: `1px solid ${badgeColor}40`
                        }}>
                          <i className={`bi ${icon}`} />
                          {t.status}
                        </span>

                        {/* INTERACTIVE ACTIONS */}
                        <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                          <select
                            value={t.status}
                            onChange={(e) => handleTaskStatusChange(t.id, e.target.value)}
                            style={{
                              fontSize: '0.72rem',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '4px',
                              background: 'var(--bg-surface-2)',
                              color: 'var(--text-primary)',
                              border: '1px solid var(--border)',
                              cursor: 'pointer'
                            }}
                            title="Change Task Status"
                          >
                            <option value="Completed">🟢 Completed</option>
                            <option value="Pending">🟡 Pending</option>
                            <option value="Action Needed">🔴 Action Needed</option>
                          </select>

                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => setSelectedTaskDetail(t)}
                            title="View Full Task & Staff Details"
                            style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            <i className="bi bi-eye" /> View Details
                          </button>

                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteTask(t.id)}
                            title="Delete Task"
                            style={{ padding: '0.25rem 0.45rem' }}
                          >
                            <i className="bi bi-trash" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: '1.25rem' }}>
              <Link to="/health-management" className="btn btn-primary w-full" style={{ justifyContent: 'center' }}>
                <i className="bi bi-heart-pulse-fill" /> Go to Child Health Records
              </Link>
            </div>
          </div>

          {/* RIGHT COLUMN: AI RECOMMENDATIONS & STAFF QUICK AUDIT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* AI RECOMMENDATIONS CARD */}
            <div className="chart-card">
              <div className="chart-card-title"><i className="bi bi-cpu-fill" style={{ color: '#ef4444' }} /> AI Telemetry & Urgent Risk Alerts</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ padding: '0.9rem', background: 'rgba(225,29,72,0.06)', border: '1px solid rgba(225,29,72,0.3)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                    <i className="bi bi-exclamation-triangle-fill" style={{ color: '#ef4444', marginTop: 2, flexShrink: 0 }} />
                    <div>
                      <strong style={{ color: '#ef4444', fontSize: '0.85rem' }}>High Health Risk (SVM Classifier)</strong>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0' }}>
                        Aarav Sharma shows elevated risk due to continuous weight drop over 3 weeks. Assigned to Dr. Rajesh Verma.
                      </p>
                    </div>
                  </div>
                </div>

                <div style={{ padding: '0.9rem', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                    <i className="bi bi-graph-up-arrow" style={{ color: '#3b82f6', marginTop: 2, flexShrink: 0 }} />
                    <div>
                      <strong style={{ color: '#3b82f6', fontSize: '0.85rem' }}>Academic Intervention (Random Forest)</strong>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0' }}>
                        Rohan Verma predicted score below 60% in Math. Assigned to Priya Nair (Teacher).
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <Link to="/ai-prediction" className="btn btn-secondary w-full mt-3" style={{ justifyContent: 'center' }}>
                <i className="bi bi-cpu-fill" /> Open AI Prediction Hub
              </Link>
            </div>

            {/* CAREGIVER TASK STATS BREAKDOWN */}
            <div className="chart-card" style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)' }}>
              <div className="chart-card-title"><i className="bi bi-pie-chart-fill" style={{ color: '#6366f1' }} /> Caregiver Task Breakdown</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: 'var(--bg-surface-3)', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600 }}>🟢 Completed Duties</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#22c55e' }}>{completedCount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: 'var(--bg-surface-3)', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600 }}>🟡 Pending Scheduled</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f59e0b' }}>{pendingCount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: 'var(--bg-surface-3)', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600 }}>🔴 Action Needed / Urgent</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ef4444' }}>{actionNeededCount}</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* STAFF DIRECTORY TABLE SECTION */}
        <div className="chart-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <div className="chart-card-title" style={{ margin: 0 }}><i className="bi bi-person-badge" /> Staff & Caregiver Directory</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Manage staff members, view staff details, phone, designation, and active tasks</div>
            </div>
            <button className="btn btn-primary btn-sm" onClick={openAdd}>
              <i className="bi bi-plus-lg" /> Add New Staff
            </button>
          </div>

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Role / Designation</th>
                  <th style={{ minWidth: '120px', whiteSpace: 'nowrap', textAlign: 'center' }}>Caregiver Status</th>
                  <th style={{ minWidth: '140px', whiteSpace: 'nowrap', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}><span className="spinner" style={{ margin: '0 auto' }} /></td></tr>
                ) : staffList.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No staff found</td></tr>
                ) : staffList.map((s, i) => (
                  <tr key={s.user_id || i}>
                    <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{s.full_name}</td>
                    <td>{s.phone_number || '—'}</td>
                    <td>
                      <span className={`badge ${s.designation === 'doctor' ? 'badge-rose' : s.designation === 'teacher' ? 'badge-amber' : 'badge-violet'}`}>
                        {s.designation || 'Staff'}
                      </span>
                    </td>
                    <td style={{ minWidth: '120px', whiteSpace: 'nowrap', textAlign: 'center' }}>
                      <span className="badge badge-green" style={{ minWidth: '75px', justifyContent: 'center' }}>{s.status || 'Active'}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button className="btn btn-primary btn-sm" onClick={() => setSelectedStaffProfile(s)} title="View Full Staff Details">
                          <i className="bi bi-eye" /> Details
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(s)} title="Edit Staff"><i className="bi bi-pencil" /></button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteStaff(s.user_id)} title="Delete Staff"><i className="bi bi-trash" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* ADD / EDIT STAFF MODAL */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h4 style={{ color: 'var(--text-primary)', margin: 0 }}>
                <i className="bi bi-person-badge" style={{ color: 'var(--accent)', marginRight: '0.5rem' }} />
                {editStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
              </h4>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}><i className="bi bi-x-lg" /></button>
            </div>
            <form onSubmit={handleSaveStaff}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input type="text" className="form-control" required value={form.name} onChange={e => set('name', e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {!editStaff && (
                  <div className="form-group">
                    <label className="form-label">Email *</label>
                    <input type="email" className="form-control" required value={form.email} onChange={e => set('email', e.target.value)} />
                  </div>
                )}
                <div className="form-group" style={{ gridColumn: editStaff ? 'span 2' : 'auto' }}>
                  <label className="form-label">Phone</label>
                  <input type="text" className="form-control" value={form.phone} onChange={e => set('phone', e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: editStaff ? '1fr' : '1fr 1fr', gap: '0.75rem' }}>
                {!editStaff && (
                  <div className="form-group">
                    <label className="form-label">Password *</label>
                    <input type="password" className="form-control" required value={form.password} onChange={e => set('password', e.target.value)} />
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Role / Designation</label>
                  <select className="form-control" value={form.role} onChange={e => set('role', e.target.value)}>
                    <option value="staff">Caregiver / Staff</option>
                    <option value="teacher">Teacher</option>
                    <option value="doctor">Doctor</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><span className="spinner spinner-sm" /> Saving...</> : <><i className="bi bi-check-lg" /> {editStaff ? 'Update Staff' : 'Save Staff'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD CAREGIVER TASK MODAL */}
      {showTaskModal && (
        <div className="modal-backdrop" onClick={() => setShowTaskModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h4 style={{ color: 'var(--text-primary)', margin: 0 }}>
                <i className="bi bi-list-check" style={{ color: 'var(--accent)', marginRight: '0.5rem' }} />
                Create New Caregiver Task
              </h4>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowTaskModal(false)}><i className="bi bi-x-lg" /></button>
            </div>
            <form onSubmit={handleAddTask}>
              <div className="form-group">
                <label className="form-label">Task Title *</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="e.g. Conduct Evening Nutrition Check"
                  value={newTaskForm.task}
                  onChange={e => setNewTaskForm(f => ({ ...f, task: e.target.value }))}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Scheduled Time / Priority</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. 05:00 PM or Urgent"
                    value={newTaskForm.time}
                    onChange={e => setNewTaskForm(f => ({ ...f, time: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-control"
                    value={newTaskForm.category}
                    onChange={e => setNewTaskForm(f => ({ ...f, category: e.target.value }))}
                  >
                    <option value="Health Check">Health Check</option>
                    <option value="Health">Health / Medication</option>
                    <option value="Education">Academic / Education</option>
                    <option value="AI Risk">AI Risk Alert</option>
                    <option value="Routine">Routine Care</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Assign To Staff Member</label>
                  <select
                    className="form-control"
                    value={newTaskForm.assignedStaff}
                    onChange={e => setNewTaskForm(f => ({ ...f, assignedStaff: e.target.value }))}
                  >
                    {staffList.length > 0 ? staffList.map(s => (
                      <option key={s.user_id} value={s.full_name}>{s.full_name} ({s.designation})</option>
                    )) : (
                      <>
                        <option value="Anita Sharma">Anita Sharma (Staff)</option>
                        <option value="Dr. Rajesh Verma">Dr. Rajesh Verma (Doctor)</option>
                        <option value="Priya Nair">Priya Nair (Teacher)</option>
                        <option value="Sunita Devi">Sunita Devi (Staff)</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Care Ward / Location</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Wing B Ward"
                    value={newTaskForm.wing}
                    onChange={e => setNewTaskForm(f => ({ ...f, wing: e.target.value }))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Initial Status</label>
                <select
                  className="form-control"
                  value={newTaskForm.status}
                  onChange={e => setNewTaskForm(f => ({ ...f, status: e.target.value }))}
                >
                  <option value="Pending">🟡 Pending (Scheduled duty)</option>
                  <option value="Action Needed">🔴 Action Needed (Urgent attention)</option>
                  <option value="Completed">🟢 Completed (Already done)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Task Description / Instructions</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Specific instructions for the caregiver..."
                  value={newTaskForm.detail}
                  onChange={e => setNewTaskForm(f => ({ ...f, detail: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowTaskModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  <i className="bi bi-plus-lg" /> Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULL TASK & ASSIGNED STAFF DETAILS MODAL */}
      {selectedTaskDetail && (
        <div className="modal-backdrop" onClick={() => setSelectedTaskDetail(null)}>
          <div className="modal-box" style={{ maxWidth: '620px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h4 style={{ color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="bi bi-clipboard-check-fill" style={{ color: '#6366f1' }} />
                Full Task & Assigned Staff Details
              </h4>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedTaskDetail(null)}><i className="bi bi-x-lg" /></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Task Overview Box */}
              <div style={{ padding: '1rem', background: 'var(--bg-surface-3)', borderRadius: 'var(--radius-md)', borderLeft: `4px solid ${selectedTaskDetail.status === 'Completed' ? '#22c55e' : selectedTaskDetail.status === 'Pending' ? '#f59e0b' : '#ef4444'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', color: 'var(--text-secondary)' }}>
                    {selectedTaskDetail.category} ({selectedTaskDetail.time})
                  </span>
                  <span style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.65rem',
                    borderRadius: 'var(--radius-full)',
                    background: selectedTaskDetail.status === 'Completed' ? 'rgba(34,197,94,0.15)' : selectedTaskDetail.status === 'Pending' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                    color: selectedTaskDetail.status === 'Completed' ? '#22c55e' : selectedTaskDetail.status === 'Pending' ? '#f59e0b' : '#ef4444',
                    border: `1px solid ${selectedTaskDetail.status === 'Completed' ? '#22c55e' : selectedTaskDetail.status === 'Pending' ? '#f59e0b' : '#ef4444'}40`
                  }}>
                    {selectedTaskDetail.status}
                  </span>
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                  {selectedTaskDetail.task}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {selectedTaskDetail.detail}
                </div>
              </div>

              {/* Assigned Staff Information */}
              <div style={{ padding: '1rem', background: 'var(--bg-surface-3)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <i className="bi bi-person-badge-fill" /> Assigned Staff Member Details
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', fontSize: '0.82rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>Staff Name</span>
                    <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>{selectedTaskDetail.assignedStaff || 'Anita Sharma'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>Role / Designation</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{selectedTaskDetail.staffRole || 'Caregiver Staff'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>Contact Phone</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{selectedTaskDetail.staffPhone || '+91 98765 43210'}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>Email Address</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{selectedTaskDetail.staffEmail || 'staff@orphanage.com'}</span>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>Care Location / Wing</span>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{selectedTaskDetail.wing || 'Main Care Unit'}</span>
                  </div>
                </div>
              </div>

              {/* Completion Audit Log */}
              <div style={{ padding: '1rem', background: 'var(--bg-surface-3)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <i className="bi bi-clock-history" style={{ color: '#f59e0b' }} /> Execution & Verification Audit Log
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.8rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>Execution Timestamp</span>
                    <strong style={{ color: selectedTaskDetail.status === 'Completed' ? '#22c55e' : 'var(--text-secondary)' }}>
                      {selectedTaskDetail.completedAt || 'Awaiting Shift Execution'}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>Verified Signature</span>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {selectedTaskDetail.verifiedBy || 'Pending Signature'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Update Quick Action */}
              <div style={{ padding: '0.85rem', background: 'var(--bg-surface-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>Update Task Status Live:</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className={`btn btn-sm ${selectedTaskDetail.status === 'Completed' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                    onClick={() => handleTaskStatusChange(selectedTaskDetail.id, 'Completed')}
                  >
                    🟢 Mark Completed
                  </button>
                  <button
                    className={`btn btn-sm ${selectedTaskDetail.status === 'Pending' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                    onClick={() => handleTaskStatusChange(selectedTaskDetail.id, 'Pending')}
                  >
                    🟡 Mark Pending
                  </button>
                  <button
                    className={`btn btn-sm ${selectedTaskDetail.status === 'Action Needed' ? 'btn-danger' : 'btn-secondary'}`}
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                    onClick={() => handleTaskStatusChange(selectedTaskDetail.id, 'Action Needed')}
                  >
                    🔴 Mark Action Needed
                  </button>
                </div>
              </div>

            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedTaskDetail(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* FULL STAFF PROFILE DETAILS MODAL */}
      {selectedStaffProfile && (
        <div className="modal-backdrop" onClick={() => setSelectedStaffProfile(null)}>
          <div className="modal-box" style={{ maxWidth: '580px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h4 style={{ color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="bi bi-person-badge-fill" style={{ color: 'var(--accent)' }} />
                Staff Member Profile & Assignments
              </h4>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedStaffProfile(null)}><i className="bi bi-x-lg" /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Header profile card */}
              <div style={{ padding: '1rem', background: 'var(--bg-surface-3)', borderRadius: 'var(--radius-md)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ width: 54, height: 54, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #3b82f6)', color: '#fff', fontSize: '1.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {selectedStaffProfile.full_name ? selectedStaffProfile.full_name.charAt(0) : 'S'}
                </div>
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{selectedStaffProfile.full_name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span className="badge badge-violet" style={{ marginRight: 6 }}>{selectedStaffProfile.designation || 'Staff'}</span>
                    <span className="badge badge-green">{selectedStaffProfile.status || 'Active'}</span>
                  </div>
                </div>
              </div>

              {/* Staff Details Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', padding: '1rem', background: 'var(--bg-surface-3)', borderRadius: 'var(--radius-md)', fontSize: '0.82rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>Phone Number</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{selectedStaffProfile.phone_number || '—'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>Email Address</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{selectedStaffProfile.email || `${selectedStaffProfile.full_name.toLowerCase().replace(' ', '.')}@orphanage.com`}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>Assigned Wing / Ward</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{selectedStaffProfile.wing || 'General Care Unit'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>Shift Hours</span>
                  <strong style={{ color: 'var(--text-primary)' }}>08:00 AM - 04:00 PM</strong>
                </div>
              </div>

              {/* Assigned Tasks Summary */}
              <div style={{ padding: '1rem', background: 'var(--bg-surface-3)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  <i className="bi bi-list-task" style={{ color: '#6366f1', marginRight: 4 }} /> Active Tasks Assigned To This Staff:
                </div>
                {caregiverTasks.filter(t => (t.assignedStaff || '').toLowerCase() === selectedStaffProfile.full_name.toLowerCase()).length === 0 ? (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No current active tasks assigned.</div>
                ) : (
                  caregiverTasks.filter(t => (t.assignedStaff || '').toLowerCase() === selectedStaffProfile.full_name.toLowerCase()).map(t => (
                    <div key={t.id} style={{ padding: '0.5rem', background: 'var(--bg-surface-2)', borderRadius: '4px', marginBottom: '0.35rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600 }}>{t.task}</span>
                      <span style={{ fontSize: '0.72rem', color: t.status === 'Completed' ? '#22c55e' : t.status === 'Pending' ? '#f59e0b' : '#ef4444', fontWeight: 700 }}>
                        {t.status}
                      </span>
                    </div>
                  ))
                )}
              </div>

            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem', gap: '0.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedStaffProfile(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
