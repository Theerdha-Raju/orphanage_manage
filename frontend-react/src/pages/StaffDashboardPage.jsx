import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import TopHeader from '../components/TopHeader';

const API = 'http://localhost:8000/api';

const DESIGNATION_OPTIONS = ['Caregiver', 'Teacher', 'Doctor'];

const DESIGNATION_STYLES = {
  Caregiver: {
    bg: 'rgba(59, 130, 246, 0.12)',
    text: '#2563eb',
    border: 'rgba(59, 130, 246, 0.28)',
    icon: 'bi-person-heart',
    badgeClass: 'badge-blue'
  },
  Teacher: {
    bg: 'rgba(245, 158, 11, 0.12)',
    text: '#d97706',
    border: 'rgba(245, 158, 11, 0.28)',
    icon: 'bi-journal-bookmark-fill',
    badgeClass: 'badge-amber'
  },
  Doctor: {
    bg: 'rgba(16, 185, 129, 0.12)',
    text: '#059669',
    border: 'rgba(16, 185, 129, 0.28)',
    icon: 'bi-heart-pulse-fill',
    badgeClass: 'badge-emerald'
  }
};

const DESIGNATION_RESPONSIBILITIES = {
  Caregiver: [
    'Daily child care',
    'Attendance recording',
    'Daily activity monitoring',
    'Nutrition checks',
    'General child development monitoring'
  ],
  Teacher: [
    'Education-related activities',
    'Academic progress monitoring',
    'Learning support',
    'Educational records'
  ],
  Doctor: [
    'Child health checks',
    'Health observations',
    'Medical-related tasks',
    'Health records'
  ]
};

const TASK_TEMPLATES = {
  Caregiver: [
    'Morning Attendance',
    'Nutrition Check',
    'Daily Child Care',
    'General Health Observation'
  ],
  Teacher: [
    'Mathematics Learning Support',
    'Academic Progress Review',
    'Reading Activity'
  ],
  Doctor: [
    'Morning Health Check',
    'Medical Observation',
    'Medication Administration'
  ]
};

function formatDesignation(val) {
  if (!val) return 'Caregiver';
  const clean = val.trim().toLowerCase();
  if (clean === 'teacher') return 'Teacher';
  if (clean === 'doctor') return 'Doctor';
  return 'Caregiver';
}

const emptyStaffForm = {
  name: '',
  phone: '',
  email: '',
  designation: 'Caregiver',
  ward: 'Wing B Care Ward',
  joiningDate: new Date().toISOString().split('T')[0],
  salary: '',
  status: 'Active',
  username: '',
  password: ''
};

const initialTasks = [
  {
    id: 1,
    task: 'Medication Administration',
    time: '08:00 AM',
    status: 'Completed',
    category: 'Health',
    detail: 'Administered prescribed morning medications to children in Care Ward B. Vital signs recorded.',
    assignedStaff: 'Priya Nair',
    designation: 'Caregiver',
    staffPhone: '+91 98765 43211',
    staffEmail: 'priya.nair@orphanage.com',
    completedAt: 'Today at 08:25 AM',
    verifiedBy: 'Priya Nair (Caregiver Verified)',
    wing: 'Wing B Care Ward'
  },
  {
    id: 2,
    task: 'Morning Attendance',
    time: '09:00 AM',
    status: 'In Progress',
    category: 'Child Care',
    detail: 'Daily morning attendance recording and roll-call across dormitory care units.',
    assignedStaff: 'Heena Kausar',
    designation: 'Caregiver',
    staffPhone: '+91 79079 49368',
    staffEmail: 'heena.kausar@orphanage.com',
    completedAt: 'In Progress (Active Shift)',
    verifiedBy: 'Heena Kausar (Caregiver)',
    wing: 'Main Dormitory Ward'
  },
  {
    id: 3,
    task: 'Mathematics Learning Support',
    time: '11:00 AM',
    status: 'Pending',
    category: 'Education',
    detail: 'Interactive mathematics and numeracy learning support session for primary school children.',
    assignedStaff: 'Mr. Anand Rao',
    designation: 'Teacher',
    staffPhone: '+91 98765 43212',
    staffEmail: 'anand.rao@orphanage.com',
    completedAt: 'Scheduled for 11:00 AM shift',
    verifiedBy: 'Pending Teacher Verification',
    wing: 'Education Block A'
  },
  {
    id: 4,
    task: 'Morning Health Check',
    time: '10:30 AM',
    status: 'Completed',
    category: 'Health',
    detail: 'Clinical health assessment, biometric measurements, and physical wellness evaluation.',
    assignedStaff: 'Dr. Rajesh Sharma',
    designation: 'Doctor',
    staffPhone: '+91 98765 43210',
    staffEmail: 'sharma@orphanage.com',
    completedAt: 'Today at 10:45 AM',
    verifiedBy: 'Dr. Rajesh Sharma (Medical Signature)',
    wing: 'Clinical Health Hub'
  },
  {
    id: 5,
    task: 'Nutrition Check',
    time: '01:30 PM',
    status: 'Pending',
    category: 'Child Care',
    detail: 'Midday meal dietary inspection and balanced nutritional intake record for all wards.',
    assignedStaff: 'Sarah Jenkins',
    designation: 'Caregiver',
    staffPhone: '+91 98000 00002',
    staffEmail: 'staff@orphanage.com',
    completedAt: 'Scheduled for lunch shift',
    verifiedBy: 'Pending Caregiver Verification',
    wing: 'Central Dining Hall'
  }
];

export default function StaffDashboardPage() {
  const { toggleSidebar } = useOutletContext();
  const userName = localStorage.getItem('userName') || 'Caregiver Staff';
  const userRole = localStorage.getItem('userRole') || 'staff';
  const userDesignation = localStorage.getItem('userDesignation') || (userRole === 'admin' ? 'Administrator' : 'Caregiver');

  const [staffList, setStaffList] = useState([]);
  const [totalStaffs, setTotalStaffs] = useState(0);
  const [caregiverCount, setCaregiverCount] = useState(0);
  const [teacherCount, setTeacherCount] = useState(0);
  const [doctorCount, setDoctorCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Staff Modal (Add / Edit)
  const [showModal, setShowModal] = useState(false);
  const [editStaff, setEditStaff] = useState(null);
  const [form, setForm] = useState(emptyStaffForm);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [modalErr, setModalErr] = useState('');

  // Selected Staff Profile Modal (Details)
  const [selectedStaffProfile, setSelectedStaffProfile] = useState(null);

  // Caregiver Tasks state & filters
  const [caregiverTasks, setCaregiverTasks] = useState(initialTasks);
  const [taskFilter, setTaskFilter] = useState('All');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTaskDetail, setSelectedTaskDetail] = useState(null);

  const [newTaskForm, setNewTaskForm] = useState({
    task: '',
    time: '10:00 AM',
    category: 'Child Care',
    status: 'Pending',
    detail: '',
    assignedStaff: '',
    wing: 'Wing B Care Ward'
  });

  const setFormField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const loadData = () => {
    setLoading(true);
    fetch(`${API}/users/`)
      .then(r => r.json())
      .then(usersData => {
        if (Array.isArray(usersData)) {
          // Identify staff members by designation or role
          const staffs = usersData
            .filter(u => ['caregiver', 'teacher', 'doctor', 'staff'].includes((u.designation || u.role || '').toLowerCase()))
            .map(u => ({
              ...u,
              designation: formatDesignation(u.designation || u.role),
              status: u.status || 'Active',
              ward: u.address || 'Wing B Care Ward',
              joiningDate: u.created_at ? u.created_at.split('T')[0] : '2026-08-15'
            }));

          setStaffList(staffs);
          setTotalStaffs(staffs.length);

          const cCount = staffs.filter(s => s.designation === 'Caregiver').length;
          const tCount = staffs.filter(s => s.designation === 'Teacher').length;
          const dCount = staffs.filter(s => s.designation === 'Doctor').length;

          setCaregiverCount(cCount);
          setTeacherCount(tCount);
          setDoctorCount(dCount);

          if (staffs.length > 0 && !newTaskForm.assignedStaff) {
            setNewTaskForm(prev => ({ ...prev, assignedStaff: staffs[0].full_name }));
          }
        }
      })
      .catch(() => {
        const defaultStaff = [
          { user_id: 2, full_name: 'Priya Nair', phone_number: '+91 98765 43211', email: 'priya.nair@orphanage.com', designation: 'Caregiver', status: 'Active', ward: 'Wing B Care Ward', joiningDate: '2026-08-13', salary: 22000 },
          { user_id: 3, full_name: 'Heena Kausar', phone_number: '+91 79079 49368', email: 'heena.kausar@orphanage.com', designation: 'Caregiver', status: 'Active', ward: 'Main Dormitory Ward', joiningDate: '2026-08-14', salary: 21000 },
          { user_id: 5, full_name: 'Mr. Anand Rao', phone_number: '+91 98765 43212', email: 'anand.rao@orphanage.com', designation: 'Teacher', status: 'Active', ward: 'Education Center Block A', joiningDate: '2026-08-14', salary: 28000 },
          { user_id: 6, full_name: 'Ms. Lakshmi Iyer', phone_number: '+91 98765 43213', email: 'lakshmi.iyer@orphanage.com', designation: 'Teacher', status: 'Active', ward: 'Education Block A', joiningDate: '2026-08-14', salary: 27000 },
          { user_id: 81, full_name: 'Dr. Rajesh Sharma', phone_number: '+91 98765 43210', email: 'sharma@orphanage.com', designation: 'Doctor', status: 'Active', ward: 'Clinical Health Hub', joiningDate: '2026-09-11', salary: 45000 },
          { user_id: 83, full_name: 'Sarah Jenkins', phone_number: '+91 98000 00002', email: 'staff@orphanage.com', designation: 'Caregiver', status: 'Active', ward: 'Central Dining Hall', joiningDate: '2026-09-14', salary: 20000 },
        ];
        setStaffList(defaultStaff);
        setTotalStaffs(defaultStaff.length);
        setCaregiverCount(3);
        setTeacherCount(2);
        setDoctorCount(1);
        if (!newTaskForm.assignedStaff) {
          setNewTaskForm(prev => ({ ...prev, assignedStaff: 'Priya Nair' }));
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  // Cycle task status: Pending -> In Progress -> Completed
  const advanceTaskStatus = (taskId) => {
    setCaregiverTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        let nextStatus = 'In Progress';
        if (t.status === 'Pending') nextStatus = 'In Progress';
        else if (t.status === 'In Progress') nextStatus = 'Completed';
        else nextStatus = 'Pending';

        const updatedCompletedAt = nextStatus === 'Completed'
          ? `Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
          : nextStatus === 'In Progress'
          ? 'In Progress (Active Shift)'
          : 'Scheduled for shift';

        const updatedVerifiedBy = nextStatus === 'Completed'
          ? `${t.assignedStaff || userName} (Signature Verified)`
          : 'Pending Verification';

        return {
          ...t,
          status: nextStatus,
          completedAt: updatedCompletedAt,
          verifiedBy: updatedVerifiedBy
        };
      }
      return t;
    }));
  };

  const handleTaskStatusChange = (taskId, newStatus) => {
    setCaregiverTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const updatedCompletedAt = newStatus === 'Completed'
          ? `Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
          : newStatus === 'In Progress'
          ? 'In Progress (Active Shift)'
          : 'Scheduled for shift';

        const updatedVerifiedBy = newStatus === 'Completed'
          ? `${t.assignedStaff || userName} (Signature Verified)`
          : 'Pending Verification';

        return {
          ...t,
          status: newStatus,
          completedAt: updatedCompletedAt,
          verifiedBy: updatedVerifiedBy
        };
      }
      return t;
    }));

    if (selectedTaskDetail && selectedTaskDetail.id === taskId) {
      setSelectedTaskDetail(prev => ({
        ...prev,
        status: newStatus,
        completedAt: newStatus === 'Completed'
          ? `Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
          : newStatus === 'In Progress'
          ? 'In Progress (Active Shift)'
          : 'Scheduled for shift',
        verifiedBy: newStatus === 'Completed'
          ? `${prev.assignedStaff || userName} (Signature Verified)`
          : 'Pending Verification'
      }));
    }

    setMsg(`Task status set to "${newStatus}".`);
    setTimeout(() => setMsg(''), 3000);
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTaskForm.task.trim()) return;

    const matchedStaff = staffList.find(s => s.full_name === newTaskForm.assignedStaff);
    const assignedDesignation = matchedStaff?.designation || 'Caregiver';

    const created = {
      id: Date.now(),
      task: newTaskForm.task,
      time: newTaskForm.time || '10:00 AM',
      category: newTaskForm.category,
      status: newTaskForm.status,
      detail: newTaskForm.detail || `Assigned to ${assignedDesignation} for routine shift operations.`,
      assignedStaff: newTaskForm.assignedStaff || 'Priya Nair',
      designation: assignedDesignation,
      staffPhone: matchedStaff?.phone_number || '+91 98765 43210',
      staffEmail: matchedStaff?.email || `${(newTaskForm.assignedStaff || 'staff').toLowerCase().replace(/\s+/g, '.')}@orphanage.com`,
      completedAt: newTaskForm.status === 'Completed'
        ? `Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        : newTaskForm.status === 'In Progress'
        ? 'In Progress (Active Shift)'
        : 'Scheduled for shift',
      verifiedBy: newTaskForm.status === 'Completed'
        ? `${newTaskForm.assignedStaff} (${assignedDesignation} Verified)`
        : 'Pending Verification',
      wing: newTaskForm.wing || matchedStaff?.ward || 'Wing B Care Ward'
    };

    setCaregiverTasks(prev => [created, ...prev]);
    setShowTaskModal(false);
    setNewTaskForm({
      task: '',
      time: '10:00 AM',
      category: 'Child Care',
      status: 'Pending',
      detail: '',
      assignedStaff: staffList[0]?.full_name || 'Priya Nair',
      wing: 'Wing B Care Ward'
    });
    setMsg('New task assigned successfully.');
    setTimeout(() => setMsg(''), 3000);
  };

  const handleDeleteTask = (taskId) => {
    setCaregiverTasks(prev => prev.filter(t => t.id !== taskId));
    if (selectedTaskDetail?.id === taskId) setSelectedTaskDetail(null);
    setMsg('Task removed.');
    setTimeout(() => setMsg(''), 3000);
  };

  // Staff Modal Handlers
  const openAdd = () => {
    setEditStaff(null);
    setForm(emptyStaffForm);
    setModalErr('');
    setShowModal(true);
  };

  const openEdit = (staff) => {
    setEditStaff(staff);
    setForm({
      name: staff.full_name || '',
      phone: staff.phone_number || '',
      email: staff.email || '',
      designation: staff.designation || 'Caregiver',
      ward: staff.ward || staff.address || 'Wing B Care Ward',
      joiningDate: staff.joiningDate || (staff.created_at ? staff.created_at.split('T')[0] : '2026-08-15'),
      salary: staff.salary !== undefined && staff.salary !== null ? String(staff.salary) : '',
      status: staff.status || 'Active',
      username: staff.email ? staff.email.split('@')[0] : '',
      password: ''
    });
    setModalErr('');
    setShowModal(true);
  };

  const handleDeleteStaff = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this staff member?')) return;
    try {
      const r = await fetch(`${API}/users/${userId}/`, { method: 'DELETE' });
      if (r.ok || r.status === 204) {
        setMsg('Staff member removed successfully.');
        setTimeout(() => setMsg(''), 3000);
        loadData();
      } else {
        setStaffList(prev => prev.filter(s => s.user_id !== userId));
        setMsg('Staff member removed.');
        setTimeout(() => setMsg(''), 3000);
      }
    } catch {
      setStaffList(prev => prev.filter(s => s.user_id !== userId));
      setMsg('Staff member removed.');
      setTimeout(() => setMsg(''), 3000);
    }
  };

  const handleSaveStaff = async (e) => {
    e.preventDefault();
    setModalErr('');

    // --- FRONTEND VALIDATION ---
    if (!form.name || form.name.trim().length < 2) {
      setModalErr('Validation Error: Full Name is required and must be at least 2 characters.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email || !emailRegex.test(form.email.trim())) {
      setModalErr('Validation Error: Please enter a valid email address.');
      return;
    }

    if (form.phone && form.phone.trim()) {
      const cleanPhone = form.phone.trim().replace(/[\s-]/g, '');
      if (!/^\+?\d{10,15}$/.test(cleanPhone)) {
        setModalErr('Validation Error: Phone number must be between 10 and 15 digits.');
        return;
      }
    }

    if (!editStaff) {
      if (!form.username || form.username.trim().length < 3) {
        setModalErr('Validation Error: Username is required and must be at least 3 characters.');
        return;
      }
      if (!form.password || form.password.length < 6) {
        setModalErr('Validation Error: Password must be at least 6 characters long.');
        return;
      }
    }

    setSaving(true);
    try {
      if (editStaff) {
        // Update existing staff
        const r = await fetch(`${API}/users/${editStaff.user_id}/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            full_name: form.name.trim(),
            phone_number: form.phone.trim(),
            email: form.email.trim(),
            designation: form.designation,
            address: form.ward.trim(),
            salary: form.salary ? parseFloat(form.salary) : null,
            status: form.status
          })
        });

        if (r.ok) {
          setShowModal(false);
          setMsg(`Staff member ${form.name} updated successfully.`);
          setTimeout(() => setMsg(''), 3000);
          loadData();
        } else {
          const errData = await r.json().catch(() => ({}));
          setModalErr(errData.error || 'Failed to update staff member.');
          setStaffList(prev => prev.map(s => s.user_id === editStaff.user_id ? {
            ...s,
            full_name: form.name,
            phone_number: form.phone,
            email: form.email,
            designation: form.designation,
            ward: form.ward,
            status: form.status
          } : s));
          setShowModal(false);
          setMsg('Staff member updated.');
          setTimeout(() => setMsg(''), 3000);
        }
      } else {
        // Create new staff via registration endpoint
        const r = await fetch(`${API}/auth/register/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name.trim(),
            email: form.email.trim(),
            password: form.password,
            designation: form.designation,
            phone: form.phone.trim(),
            address: form.ward.trim(),
            ward: form.ward.trim(),
            salary: form.salary ? parseFloat(form.salary) : null,
            status: form.status,
            username: form.username.trim(),
            role: form.designation === 'Caregiver' ? 'staff' : form.designation.toLowerCase()
          })
        });

        const resData = await r.json().catch(() => ({}));
        if (r.ok && resData.success) {
          setShowModal(false);
          setMsg(`New ${form.designation} "${form.name}" added successfully.`);
          setForm(emptyStaffForm);
          setTimeout(() => setMsg(''), 3000);
          loadData();
        } else {
          setModalErr(resData.error || 'Failed to save staff member. Please check details.');
        }
      }
    } catch {
      setModalErr('Network error: Unable to connect to server. Please ensure backend is running.');
    } finally {
      setSaving(false);
    }
  };

  // Counts calculation
  const completedCount = caregiverTasks.filter(t => t.status === 'Completed').length;
  const inProgressCount = caregiverTasks.filter(t => t.status === 'In Progress').length;
  const pendingCount = caregiverTasks.filter(t => t.status === 'Pending').length;

  // Total monthly salary payroll
  const totalPayroll = staffList.reduce((sum, s) => sum + (parseFloat(s.salary) || 0), 0);
  const formattedPayroll = totalPayroll >= 100000
    ? '₹' + (totalPayroll / 100000).toFixed(1) + 'L'
    : totalPayroll >= 1000
    ? '₹' + (totalPayroll / 1000).toFixed(1) + 'K'
    : totalPayroll > 0
    ? '₹' + totalPayroll.toLocaleString('en-IN')
    : '—';

  const filteredTasks = caregiverTasks.filter(t => {
    if (taskFilter === 'All') return true;
    return t.status === taskFilter;
  });

  // Selected staff member's tasks for details view
  const staffAssignedTasks = selectedStaffProfile
    ? caregiverTasks.filter(t => (t.assignedStaff || '').toLowerCase() === (selectedStaffProfile.full_name || '').toLowerCase())
    : [];
  const staffCompletedTasks = staffAssignedTasks.filter(t => t.status === 'Completed');

  // Currently selected staff designation in task modal
  const currentTaskStaffObj = staffList.find(s => s.full_name === newTaskForm.assignedStaff);
  const currentModalDesignation = currentTaskStaffObj?.designation || 'Caregiver';

  return (
    <>
      <TopHeader title="Staff & Caregivers Dashboard" onToggleSidebar={toggleSidebar} />

      <div className="page-body">
        {/* Banner */}
        <div className="page-banner">
          <div>
            <div className="section-label">Staff / Caregiver Management • {userDesignation}</div>
            <div className="page-banner-title">Welcome Back, {userName}</div>
            <div className="page-banner-sub">
              Intelligent child care coordination, designation-based task assignments, attendance recording, and staff directory.
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button className="btn btn-primary btn-sm" onClick={() => setShowTaskModal(true)}>
              <i className="bi bi-plus-lg" /> Assign New Task
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
            { label: 'Total Staff / Caregivers', value: totalStaffs, icon: 'bi-people-fill', cls: 'stat-icon-violet', sub: 'Active workforce category' },
            { label: 'Caregivers', value: caregiverCount, icon: 'bi-person-heart', cls: 'stat-icon-indigo', sub: 'Child care & attendance' },
            { label: 'Teachers', value: teacherCount, icon: 'bi-journal-bookmark-fill', cls: 'stat-icon-amber', sub: 'Education & academics' },
            { label: 'Doctors', value: doctorCount, icon: 'bi-heart-pulse-fill', cls: 'stat-icon-green', sub: 'Health checks & records' },
            { label: 'Monthly Payroll', value: formattedPayroll, icon: 'bi-cash-coin', cls: 'stat-icon-amber', sub: `Across ${staffList.filter(s => s.salary).length} salaried staff` },
            { label: 'Completed Tasks', value: completedCount, icon: 'bi-check-circle-fill', cls: 'stat-icon-green', sub: `${inProgressCount} in progress, ${pendingCount} pending` },
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

        {/* SECTION 1: TODAY'S CAREGIVER TASKS & BREAKDOWN */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 0.75fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          
          {/* TASK LIST CARD */}
          <div className="chart-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <div className="chart-card-title" style={{ margin: 0 }}>
                  <i className="bi bi-list-check" style={{ color: '#6366f1' }} /> Today's Designated Tasks
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Assigned duties for Caregivers, Teachers, and Doctors (Pending → In Progress → Completed)
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                {['All', 'Pending', 'In Progress', 'Completed'].map(filter => (
                  <button
                    key={filter}
                    onClick={() => setTaskFilter(filter)}
                    className={`btn btn-sm ${taskFilter === filter ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                  >
                    {filter === 'All' && 'All '}
                    {filter === 'Pending' && '🟡 Pending '}
                    {filter === 'In Progress' && '🔵 In Progress '}
                    {filter === 'Completed' && '🟢 Completed '}
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
                const isCompleted = t.status === 'Completed';
                const isInProgress = t.status === 'In Progress';
                const badgeColor = isCompleted ? '#10b981' : isInProgress ? '#3b82f6' : '#f59e0b';
                const badgeBg = isCompleted ? 'rgba(16,185,129,0.12)' : isInProgress ? 'rgba(59,130,246,0.12)' : 'rgba(245,158,11,0.12)';
                const icon = isCompleted ? 'bi-check-circle-fill' : isInProgress ? 'bi-arrow-repeat' : 'bi-clock-history';
                const dStyle = DESIGNATION_STYLES[t.designation] || DESIGNATION_STYLES.Caregiver;

                return (
                  <div
                    key={t.id}
                    style={{
                      padding: '1rem',
                      background: 'var(--bg-surface-3)',
                      borderRadius: 'var(--radius-md)',
                      borderLeft: `4px solid ${badgeColor}`,
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.06)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: '220px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}>
                            {t.category}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            <i className="bi bi-clock" style={{ marginRight: 3 }} /> {t.time}
                          </span>
                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            padding: '0.15rem 0.5rem',
                            borderRadius: '4px',
                            background: dStyle.bg,
                            color: dStyle.text,
                            border: `1px solid ${dStyle.border}`
                          }}>
                            <i className={`bi ${dStyle.icon}`} style={{ marginRight: 3 }} />
                            {t.designation || 'Caregiver'}
                          </span>
                          {t.assignedStaff && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                              <i className="bi bi-person-fill" style={{ color: '#6366f1', marginRight: 3 }} />
                              {t.assignedStaff}
                            </span>
                          )}
                        </div>

                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.94rem', marginBottom: '0.25rem' }}>
                          {t.task}
                        </div>

                        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                          {t.detail}
                        </div>

                        <div style={{ fontSize: '0.74rem', color: isCompleted ? '#10b981' : isInProgress ? '#3b82f6' : 'var(--text-muted)', fontWeight: 500 }}>
                          <i className="bi bi-geo-alt-fill" style={{ marginRight: 4 }} /> Location: {t.wing || 'Wing B Ward'}
                        </div>
                      </div>

                      {/* STATUS BADGE + ACTION CONTROLS */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.6rem' }}>
                        <span style={{
                          fontSize: '0.74rem',
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

                        {/* INTERACTIVE CONTROLS */}
                        <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                          <button
                            className="btn btn-sm btn-ghost"
                            onClick={() => advanceTaskStatus(t.id)}
                            title="Advance Task Status (Pending → In Progress → Completed)"
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.55rem', border: '1px solid var(--border)' }}
                          >
                            <i className="bi bi-arrow-right-circle" style={{ marginRight: 3 }} /> Advance
                          </button>

                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => setSelectedTaskDetail(t)}
                            title="View Full Task & Staff Details"
                            style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            <i className="bi bi-eye" /> Details
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

            <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem' }}>
              <Link to="/child-profile" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                <i className="bi bi-person-lines-fill" /> Child Profiles & Attendance Records
              </Link>
            </div>
          </div>

          {/* RIGHT COLUMN: DESIGNATION RESPONSIBILITIES OVERVIEW */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* DESIGNATION OVERVIEW SUMMARY CARD */}
            <div className="chart-card">
              <div className="chart-card-title">
                <i className="bi bi-shield-check" style={{ color: 'var(--accent)' }} /> Staff/Caregiver Specializations
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.75rem' }}>
                {DESIGNATION_OPTIONS.map(des => {
                  const style = DESIGNATION_STYLES[des];
                  return (
                    <div
                      key={des}
                      style={{
                        padding: '0.75rem 0.85rem',
                        background: 'var(--bg-surface-3)',
                        borderRadius: 'var(--radius-md)',
                        borderLeft: `4px solid ${style.text}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <span style={{ fontWeight: 700, fontSize: '0.88rem', color: style.text, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <i className={`bi ${style.icon}`} /> {des}
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                        {des === 'Caregiver' ? `${caregiverCount} Active` : des === 'Teacher' ? `${teacherCount} Active` : `${doctorCount} Active`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* TASK STATUS SUMMARY CARD */}
            <div className="chart-card" style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)' }}>
              <div className="chart-card-title"><i className="bi bi-pie-chart-fill" style={{ color: '#6366f1' }} /> Task Status Progression</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: 'var(--bg-surface-3)', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600 }}>🟡 Pending (Scheduled)</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f59e0b' }}>{pendingCount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: 'var(--bg-surface-3)', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600 }}>🔵 In Progress (Active Shift)</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#3b82f6' }}>{inProgressCount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: 'var(--bg-surface-3)', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600 }}>🟢 Completed (Verified)</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#10b981' }}>{completedCount}</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* SECTION 2: STAFF & CAREGIVER DIRECTORY TABLE */}
        <div className="chart-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <div className="chart-card-title" style={{ margin: 0 }}>
                <i className="bi bi-person-badge" /> Staff & Caregiver Directory
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Directory of staff members, caregivers, teachers, and doctors with designation specializations, contact information, and status
              </div>
            </div>
            <button className="btn btn-primary btn-sm" onClick={openAdd}>
              <i className="bi bi-plus-lg" /> Add New Staff
            </button>
          </div>

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>#</th>
                  <th>NAME</th>
                  <th>PHONE</th>
                  <th>ROLE / DESIGNATION</th>
                  <th style={{ minWidth: '110px', whiteSpace: 'nowrap', textAlign: 'right' }}>SALARY (₹)</th>
                  <th style={{ minWidth: '140px', whiteSpace: 'nowrap', textAlign: 'center' }}>CAREGIVER STATUS</th>
                  <th style={{ minWidth: '160px', whiteSpace: 'nowrap', textAlign: 'center' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}><span className="spinner" style={{ margin: '0 auto' }} /></td></tr>
                ) : staffList.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No staff members found in directory</td></tr>
                ) : staffList.map((s, i) => {
                  const des = formatDesignation(s.designation);
                  const desStyle = DESIGNATION_STYLES[des] || DESIGNATION_STYLES.Caregiver;
                  const isActive = s.status === 'Active';

                  return (
                    <tr key={s.user_id || i}>
                      <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <div style={{
                            width: 30,
                            height: 30,
                            borderRadius: '50%',
                            background: desStyle.bg,
                            color: desStyle.text,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.8rem',
                            fontWeight: 700
                          }}>
                            {s.full_name ? s.full_name.charAt(0) : 'S'}
                          </div>
                          <div>
                            <div>{s.full_name}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>{s.phone_number || '—'}</td>
                      <td>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.28rem 0.75rem',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          background: desStyle.bg,
                          color: desStyle.text,
                          border: `1px solid ${desStyle.border}`
                        }}>
                          <i className={`bi ${desStyle.icon}`} />
                          {des}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.88rem' }}>
                        {s.salary !== undefined && s.salary !== null && s.salary !== ''
                          ? `₹${Number(s.salary).toLocaleString('en-IN')}`
                          : <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>—</span>}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span
                          className={`badge ${isActive ? 'badge-green' : 'badge-rose'}`}
                          style={{ minWidth: '75px', justifyContent: 'center' }}
                        >
                          {s.status || 'Active'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem', justifyContent: 'center' }}>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => setSelectedStaffProfile(s)}
                            title="View Staff Details"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            <i className="bi bi-eye" /> Details
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => openEdit(s)}
                            title="Edit Staff Member"
                          >
                            <i className="bi bi-pencil" />
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteStaff(s.user_id)}
                            title="Remove Staff"
                          >
                            <i className="bi bi-trash" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* MODAL 1: ADD / EDIT STAFF FORM */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-box" style={{ maxWidth: '580px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h4 style={{ color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="bi bi-person-badge-fill" style={{ color: 'var(--accent)' }} />
                {editStaff ? 'Edit Staff Member' : 'Add New Staff / Caregiver'}
              </h4>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}><i className="bi bi-x-lg" /></button>
            </div>

            <form onSubmit={handleSaveStaff}>
              {modalErr && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '0.65rem 0.9rem', borderRadius: '0.5rem', fontSize: '0.82rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <i className="bi bi-exclamation-triangle-fill" /> {modalErr}
                </div>
              )}

              {/* Full Name */}
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="e.g. Sarah Jenkins"
                  value={form.name}
                  onChange={e => setFormField('name', e.target.value)}
                />
              </div>

              {/* Phone & Email */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Phone *</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="e.g. +91 98765 43210"
                    value={form.phone}
                    onChange={e => setFormField('phone', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    className="form-control"
                    required
                    placeholder="e.g. sarah.jenkins@orphanage.com"
                    value={form.email}
                    onChange={e => setFormField('email', e.target.value)}
                  />
                </div>
              </div>

              {/* Designation & Ward / Location */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Role / Designation *</label>
                  <select
                    className="form-control"
                    value={form.designation}
                    onChange={e => setFormField('designation', e.target.value)}
                  >
                    <option value="Caregiver">Caregiver (Child care, attendance & monitoring)</option>
                    <option value="Teacher">Teacher (Education & learning support)</option>
                    <option value="Doctor">Doctor (Health checks & medical tasks)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Assigned Ward / Location *</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="e.g. Wing B Care Ward"
                    value={form.ward}
                    onChange={e => setFormField('ward', e.target.value)}
                  />
                </div>
              </div>

              {/* Joining Date & Status */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Joining Date *</label>
                  <input
                    type="date"
                    className="form-control"
                    required
                    value={form.joiningDate}
                    onChange={e => setFormField('joiningDate', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Status *</label>
                  <select
                    className="form-control"
                    value={form.status}
                    onChange={e => setFormField('status', e.target.value)}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Salary */}
              <div className="form-group">
                <label className="form-label">Monthly Salary (₹)</label>
                <input
                  type="number"
                  className="form-control"
                  min="0"
                  step="100"
                  placeholder="e.g. 25000"
                  value={form.salary}
                  onChange={e => setFormField('salary', e.target.value)}
                />
              </div>

              {/* Username & Password (for new staff) */}
              {!editStaff && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Username *</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="e.g. sarah.caregiver"
                      value={form.username}
                      onChange={e => setFormField('username', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Password * (min 6 chars)</label>
                    <input
                      type="password"
                      className="form-control"
                      required
                      placeholder="••••••••"
                      value={form.password}
                      onChange={e => setFormField('password', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Responsibilities Preview for Selected Designation */}
              <div style={{ padding: '0.75rem', background: 'var(--bg-surface-3)', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '0.25rem' }}>
                  <i className="bi bi-info-circle-fill" style={{ color: 'var(--accent)', marginRight: 4 }} />
                  {form.designation} Designation Responsibilities:
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {(DESIGNATION_RESPONSIBILITIES[form.designation] || []).join(' • ')}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><span className="spinner spinner-sm" /> Saving...</> : <><i className="bi bi-check-lg" /> {editStaff ? 'Update Staff Member' : 'Save Staff Member'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: STAFF DETAILS MODAL */}
      {selectedStaffProfile && (
        <div className="modal-backdrop" onClick={() => setSelectedStaffProfile(null)}>
          <div className="modal-box" style={{ maxWidth: '640px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h4 style={{ color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="bi bi-person-badge-fill" style={{ color: 'var(--accent)' }} />
                Staff Member Details
              </h4>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedStaffProfile(null)}><i className="bi bi-x-lg" /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Profile Card Header */}
              {(() => {
                const des = formatDesignation(selectedStaffProfile.designation);
                const desStyle = DESIGNATION_STYLES[des] || DESIGNATION_STYLES.Caregiver;
                const responsibilities = DESIGNATION_RESPONSIBILITIES[des] || [];

                return (
                  <>
                    <div style={{ padding: '1rem', background: 'var(--bg-surface-3)', borderRadius: 'var(--radius-md)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <div style={{
                        width: 58,
                        height: 58,
                        borderRadius: '50%',
                        background: desStyle.bg,
                        color: desStyle.text,
                        border: `2px solid ${desStyle.border}`,
                        fontSize: '1.5rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {selectedStaffProfile.full_name ? selectedStaffProfile.full_name.charAt(0) : 'S'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {selectedStaffProfile.full_name}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.25rem' }}>
                          <span style={{
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            padding: '0.2rem 0.6rem',
                            borderRadius: 'var(--radius-full)',
                            background: desStyle.bg,
                            color: desStyle.text,
                            border: `1px solid ${desStyle.border}`
                          }}>
                            <i className={`bi ${desStyle.icon}`} style={{ marginRight: 3 }} />
                            {des}
                          </span>
                          <span className={`badge ${selectedStaffProfile.status === 'Active' ? 'badge-green' : 'badge-rose'}`}>
                            {selectedStaffProfile.status || 'Active'}
                          </span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Staff ID</span>
                        <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                          #STF-{selectedStaffProfile.user_id}
                        </strong>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '0.85rem',
                      padding: '1rem',
                      background: 'var(--bg-surface-3)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.82rem'
                    }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>Full Name</span>
                        <strong style={{ color: 'var(--text-primary)' }}>{selectedStaffProfile.full_name}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>Role / Designation</span>
                        <strong style={{ color: desStyle.text }}>{des}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>Phone</span>
                        <span style={{ color: 'var(--text-secondary)' }}>{selectedStaffProfile.phone_number || '—'}</span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>Email Address</span>
                        <span style={{ color: 'var(--text-secondary)' }}>{selectedStaffProfile.email || `${selectedStaffProfile.full_name.toLowerCase().replace(/\s+/g, '.')}@orphanage.com`}</span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>Assigned Ward / Location</span>
                        <strong style={{ color: 'var(--text-primary)' }}>{selectedStaffProfile.ward || selectedStaffProfile.address || 'Wing B Care Ward'}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>Joining Date</span>
                        <strong style={{ color: 'var(--text-primary)' }}>{selectedStaffProfile.joiningDate || '2026-08-15'}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>Monthly Salary (₹)</span>
                        <strong style={{ color: 'var(--text-primary)' }}>
                          {selectedStaffProfile.salary !== undefined && selectedStaffProfile.salary !== null && selectedStaffProfile.salary !== ''
                            ? `₹${Number(selectedStaffProfile.salary).toLocaleString('en-IN')}`
                            : '—'}
                        </strong>
                      </div>
                    </div>

                    {/* Designation Skills & Responsibilities */}
                    <div style={{ padding: '1rem', background: 'var(--bg-surface-3)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <i className={`bi ${desStyle.icon}`} style={{ color: desStyle.text }} /> Skills & Designation Responsibilities ({des})
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {responsibilities.map((res, ri) => (
                          <span
                            key={ri}
                            style={{
                              fontSize: '0.76rem',
                              padding: '0.25rem 0.6rem',
                              borderRadius: '4px',
                              background: 'var(--bg-surface-2)',
                              color: 'var(--text-primary)',
                              border: '1px solid var(--border)'
                            }}
                          >
                            <i className="bi bi-check2" style={{ color: desStyle.text, marginRight: 4 }} />
                            {res}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Assigned & Completed Tasks */}
                    <div style={{ padding: '1rem', background: 'var(--bg-surface-3)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          <i className="bi bi-list-task" style={{ color: '#6366f1', marginRight: 4 }} /> Assigned Tasks ({staffAssignedTasks.length})
                        </div>
                        <span style={{ fontSize: '0.74rem', color: '#10b981', fontWeight: 700 }}>
                          Completed: {staffCompletedTasks.length} / {staffAssignedTasks.length}
                        </span>
                      </div>

                      {staffAssignedTasks.length === 0 ? (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No tasks currently assigned to this staff member.</div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          {staffAssignedTasks.map(t => (
                            <div
                              key={t.id}
                              style={{
                                padding: '0.55rem 0.75rem',
                                background: 'var(--bg-surface-2)',
                                borderRadius: '4px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                borderLeft: `3px solid ${t.status === 'Completed' ? '#10b981' : t.status === 'In Progress' ? '#3b82f6' : '#f59e0b'}`
                              }}
                            >
                              <div>
                                <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 600 }}>{t.task}</span>
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: 8 }}>({t.time})</span>
                              </div>
                              <span style={{
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                color: t.status === 'Completed' ? '#10b981' : t.status === 'In Progress' ? '#3b82f6' : '#f59e0b'
                              }}>
                                {t.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}

            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem', gap: '0.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedStaffProfile(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: ASSIGN NEW TASK MODAL */}
      {showTaskModal && (
        <div className="modal-backdrop" onClick={() => setShowTaskModal(false)}>
          <div className="modal-box" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h4 style={{ color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="bi bi-list-check" style={{ color: 'var(--accent)' }} />
                Assign Appropriate Task by Designation
              </h4>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowTaskModal(false)}><i className="bi bi-x-lg" /></button>
            </div>

            <form onSubmit={handleAddTask}>
              {/* Select Staff Member first to show appropriate designation templates */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Assign To Staff Member *</label>
                  <select
                    className="form-control"
                    required
                    value={newTaskForm.assignedStaff}
                    onChange={e => setNewTaskForm(f => ({ ...f, assignedStaff: e.target.value }))}
                  >
                    {staffList.map(s => (
                      <option key={s.user_id} value={s.full_name}>
                        {s.full_name} ({formatDesignation(s.designation)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Care Ward / Location *</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="e.g. Wing B Care Ward"
                    value={newTaskForm.wing}
                    onChange={e => setNewTaskForm(f => ({ ...f, wing: e.target.value }))}
                  />
                </div>
              </div>

              {/* Task Title & Suggested Quick-Pills for this Designation */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <label className="form-label" style={{ margin: 0 }}>Task Title *</label>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Templates for <strong style={{ color: 'var(--text-primary)' }}>{currentModalDesignation}</strong>:
                  </span>
                </div>

                {/* Quick Task Template Pills */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.5rem' }}>
                  {(TASK_TEMPLATES[currentModalDesignation] || TASK_TEMPLATES.Caregiver).map((tmpl, ti) => (
                    <button
                      key={ti}
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setNewTaskForm(f => ({ ...f, task: tmpl }))}
                      style={{
                        fontSize: '0.72rem',
                        padding: '0.2rem 0.5rem',
                        background: newTaskForm.task === tmpl ? 'var(--accent)' : 'var(--bg-surface-3)',
                        color: newTaskForm.task === tmpl ? '#fff' : 'var(--text-primary)',
                        border: '1px solid var(--border)'
                      }}
                    >
                      + {tmpl}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="e.g. Morning Attendance or Mathematics Learning Support"
                  value={newTaskForm.task}
                  onChange={e => setNewTaskForm(f => ({ ...f, task: e.target.value }))}
                />
              </div>

              {/* Scheduled Time, Category, Status */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Scheduled Time</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. 10:00 AM"
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
                    <option value="Child Care">Child Care</option>
                    <option value="Education">Education</option>
                    <option value="Health">Health / Medical</option>
                    <option value="Nutrition">Nutrition</option>
                    <option value="Routine">Routine Care</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Initial Status</label>
                  <select
                    className="form-control"
                    value={newTaskForm.status}
                    onChange={e => setNewTaskForm(f => ({ ...f, status: e.target.value }))}
                  >
                    <option value="Pending">🟡 Pending</option>
                    <option value="In Progress">🔵 In Progress</option>
                    <option value="Completed">🟢 Completed</option>
                  </select>
                </div>
              </div>

              {/* Task Description */}
              <div className="form-group">
                <label className="form-label">Task Description & Instructions</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Specific instructions for the designated staff member..."
                  value={newTaskForm.detail}
                  onChange={e => setNewTaskForm(f => ({ ...f, detail: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowTaskModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  <i className="bi bi-plus-lg" /> Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: FULL TASK DETAILS & AUDIT LOG */}
      {selectedTaskDetail && (
        <div className="modal-backdrop" onClick={() => setSelectedTaskDetail(null)}>
          <div className="modal-box" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h4 style={{ color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="bi bi-clipboard-check-fill" style={{ color: '#6366f1' }} />
                Full Task & Assigned Staff Details
              </h4>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedTaskDetail(null)}><i className="bi bi-x-lg" /></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              
              {/* Task Overview */}
              <div style={{
                padding: '1rem',
                background: 'var(--bg-surface-3)',
                borderRadius: 'var(--radius-md)',
                borderLeft: `4px solid ${selectedTaskDetail.status === 'Completed' ? '#10b981' : selectedTaskDetail.status === 'In Progress' ? '#3b82f6' : '#f59e0b'}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', color: 'var(--text-secondary)' }}>
                    {selectedTaskDetail.category} • {selectedTaskDetail.time}
                  </span>
                  <span style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.65rem',
                    borderRadius: 'var(--radius-full)',
                    background: selectedTaskDetail.status === 'Completed' ? 'rgba(16,185,129,0.15)' : selectedTaskDetail.status === 'In Progress' ? 'rgba(59,130,246,0.15)' : 'rgba(245,158,11,0.15)',
                    color: selectedTaskDetail.status === 'Completed' ? '#10b981' : selectedTaskDetail.status === 'In Progress' ? '#3b82f6' : '#f59e0b'
                  }}>
                    {selectedTaskDetail.status}
                  </span>
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                  {selectedTaskDetail.task}
                </div>
                <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                  {selectedTaskDetail.detail}
                </div>
              </div>

              {/* Assigned Staff Information */}
              <div style={{ padding: '1rem', background: 'var(--bg-surface-3)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <i className="bi bi-person-badge-fill" /> Assigned Staff Member
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', fontSize: '0.82rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>Staff Name</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{selectedTaskDetail.assignedStaff}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>Role / Designation</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{selectedTaskDetail.designation || 'Caregiver'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>Contact Phone</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{selectedTaskDetail.staffPhone || '+91 98765 43210'}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>Care Location / Wing</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{selectedTaskDetail.wing || 'Wing B Care Ward'}</strong>
                  </div>
                </div>
              </div>

              {/* Status Update Quick Action */}
              <div style={{ padding: '0.85rem', background: 'var(--bg-surface-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>Update Task Status (Pending → In Progress → Completed):</span>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button
                    type="button"
                    className={`btn btn-sm ${selectedTaskDetail.status === 'Pending' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                    onClick={() => handleTaskStatusChange(selectedTaskDetail.id, 'Pending')}
                  >
                    🟡 Pending
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${selectedTaskDetail.status === 'In Progress' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                    onClick={() => handleTaskStatusChange(selectedTaskDetail.id, 'In Progress')}
                  >
                    🔵 In Progress
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${selectedTaskDetail.status === 'Completed' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                    onClick={() => handleTaskStatusChange(selectedTaskDetail.id, 'Completed')}
                  >
                    🟢 Completed
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
    </>
  );
}
