import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import TopHeader from '../components/TopHeader';
import ActivityDetails from '../components/ActivityDetails';

const API = 'http://localhost:8000/api';

const STATUS_COLOR = {
  'Pending': 'badge-amber',
  'In Progress': 'badge-accent',
  'Completed': 'badge-green',
};

const TYPE_BADGE = {
  'Education': 'badge-blue',
  'Extracurricular': 'badge-purple',
  'Sports': 'badge-green',
  'Arts and Crafts': 'badge-amber',
  'Computer Learning': 'badge-cyan',
};

const getLocalDateStr = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function VolunteerDashboard() {
  const { toggleSidebar } = useOutletContext() || {};

  const userName = localStorage.getItem('userName') || 'Volunteer';
  const userEmail = localStorage.getItem('userEmail') || '';
  const userId = localStorage.getItem('userId') || '';

  const [activities, setActivities] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const now = new Date();
  const todayStr = getLocalDateStr(now);

  const fetchDashboardData = () => {
    setLoading(true);
    const actUrl = userEmail
      ? `${API}/volunteer/activities/?email=${encodeURIComponent(userEmail)}&user_id=${userId}`
      : `${API}/volunteer/activities/`;

    const profUrl = `${API}/volunteer/profile/?email=${encodeURIComponent(userEmail)}&user_id=${userId}`;

    Promise.all([
      fetch(actUrl).then(r => r.json()).catch(() => []),
      fetch(profUrl).then(r => r.json()).catch(() => null)
    ])
      .then(([actsData, profData]) => {
        if (Array.isArray(actsData)) {
          setActivities(actsData);
        }

        if (profData && !profData.error) {
          setProfile(profData);
        }
      })
      .catch(() => {
        // Fallback demo data for robust rendering
        setActivities([
          {
            assignment_id: 104,
            event_name: 'AI & Robotics Hands-on Lab',
            description: 'Hands-on AI concepts, interactive robotics demonstrations, and block coding for young learners.',
            activity_type: 'Computer Learning',
            priority: 'High',
            assigned_date: todayStr,
            scheduled_date: todayStr,
            due_date: todayStr,
            assigned_children: '8 Children',
            location: 'Computer Lab - Block A',
            assigned_by: 'Academic Coordinator',
            instructions: 'Demonstrate beginner robotics kit, guide children through block coding exercises, and ensure hands-on practice.',
            status: 'In Progress'
          },
          {
            assignment_id: 105,
            event_name: 'Science & Logic Puzzle Workshop',
            description: 'Afternoon logic games, static electricity experiments, and science trivia competition.',
            activity_type: 'Extracurricular',
            priority: 'Medium',
            assigned_date: todayStr,
            scheduled_date: todayStr,
            due_date: todayStr,
            assigned_children: '12 Children',
            location: 'Science Lab & Activity Hall',
            assigned_by: 'Care Coordinator',
            instructions: 'Organize children into 3 teams, provide quiz sheets, and supervise experiment setups safely.',
            status: 'Pending'
          },
          {
            assignment_id: 1,
            event_name: 'Mathematics Learning Support',
            description: 'Conduct remedial math session focusing on fractions and basic algebra.',
            activity_type: 'Education',
            priority: 'High',
            assigned_date: '2026-09-15',
            scheduled_date: '2026-09-20',
            due_date: '2026-09-20',
            assigned_children: '5 Children',
            location: 'Education Center - Room 3',
            assigned_by: 'Academic Coordinator',
            instructions: 'Use visual flashcards and conduct arithmetic games.',
            status: 'Pending'
          },
          {
            assignment_id: 2,
            event_name: 'Arts & Crafts Workshop',
            description: 'Teach watercolor painting and origami craft work to nurture creativity.',
            activity_type: 'Arts and Crafts',
            priority: 'Medium',
            assigned_date: '2026-09-18',
            scheduled_date: '2026-09-22',
            due_date: '2026-09-22',
            assigned_children: '8 Children',
            location: 'Activity Hall B',
            assigned_by: 'Care Coordinator',
            instructions: 'Distribute child-friendly paint brushes and craft supplies.',
            status: 'In Progress'
          },
          {
            assignment_id: 3,
            event_name: 'Outdoor Football Training',
            description: 'Outdoor football drills, fitness exercises, and a friendly mini-tournament.',
            activity_type: 'Sports',
            priority: 'Medium',
            assigned_date: '2026-09-10',
            scheduled_date: '2026-09-25',
            due_date: '2026-09-25',
            assigned_children: '10 Children',
            location: 'Main Sports Ground',
            assigned_by: 'Sports Director',
            instructions: 'Ensure proper warmup, hydration breaks, and safety protocols.',
            status: 'Completed',
            completion_date: '2026-09-25',
            remarks: 'All 10 children participated enthusiastically.'
          },
          {
            assignment_id: 4,
            event_name: 'Computer Basics & Typing',
            description: 'Introduction to computer fundamentals, keyboard skills, and basic MS Word usage.',
            activity_type: 'Computer Learning',
            priority: 'High',
            assigned_date: '2026-09-20',
            scheduled_date: '2026-10-02',
            due_date: '2026-10-02',
            assigned_children: '6 Children',
            location: 'Computer Lab - Block A',
            assigned_by: 'Academic Coordinator',
            instructions: 'Ensure each child has individual access to a computer. Cover mouse and keyboard basics first.',
            status: 'Pending'
          },
          {
            assignment_id: 5,
            event_name: 'English Reading & Storytelling',
            description: 'Interactive reading session with illustrated storybooks and group narration exercises.',
            activity_type: 'Education',
            priority: 'High',
            assigned_date: '2026-09-22',
            scheduled_date: '2026-10-04',
            due_date: '2026-10-04',
            assigned_children: '7 Children',
            location: 'Library Hall',
            assigned_by: 'Head Teacher',
            instructions: 'Select age-appropriate books. Encourage children to narrate in their own words.',
            status: 'Pending'
          },
          {
            assignment_id: 6,
            event_name: 'Yoga & Mindfulness Session',
            description: 'Morning yoga, breathing exercises, and guided mindfulness for emotional well-being.',
            activity_type: 'Sports',
            priority: 'Low',
            assigned_date: '2026-09-17',
            scheduled_date: '2026-09-28',
            due_date: '2026-09-28',
            assigned_children: '12 Children',
            location: 'Open Garden Area',
            assigned_by: 'Wellness Coordinator',
            instructions: 'Use yoga mats. Keep sessions calming. Avoid vigorous exercises.',
            status: 'In Progress'
          },
          {
            assignment_id: 7,
            event_name: 'Science Experiment Day',
            description: 'Fun hands-on science experiments — volcano model, balloon rocket, and static electricity demos.',
            activity_type: 'Extracurricular',
            priority: 'Medium',
            assigned_date: '2026-09-12',
            scheduled_date: '2026-09-19',
            due_date: '2026-09-19',
            assigned_children: '9 Children',
            location: 'Science Lab',
            assigned_by: 'Science Teacher',
            instructions: 'Ensure safety goggles are worn. Supervise all chemical handling.',
            status: 'Completed',
            completion_date: '2026-09-19',
            remarks: '9 children completed all experiments; 2 won the best-model award.'
          },
          {
            assignment_id: 8,
            event_name: 'Music & Rhythm Practice',
            description: 'Group music session covering basic percussion, clapping rhythms, and simple folk songs.',
            activity_type: 'Arts and Crafts',
            priority: 'Low',
            assigned_date: '2026-09-24',
            scheduled_date: '2026-10-06',
            due_date: '2026-10-06',
            assigned_children: '11 Children',
            location: 'Music Room - Ground Floor',
            assigned_by: 'Care Coordinator',
            instructions: 'Start with rhythm clapping exercises before introducing instruments.',
            status: 'Pending'
          },
          {
            assignment_id: 9,
            event_name: 'Dance & Cultural Performance',
            description: 'Classical and folk dance rehearsal for upcoming cultural day celebration.',
            activity_type: 'Arts and Crafts',
            priority: 'Medium',
            assigned_date: '2026-09-26',
            scheduled_date: '2026-10-10',
            due_date: '2026-10-10',
            assigned_children: '14 Children',
            location: 'Auditorium - Main Hall',
            assigned_by: 'Cultural Coordinator',
            instructions: 'Practice classical bharatanatyam and folk dance steps. Coordinate costume fittings.',
            status: 'Pending'
          },
          {
            assignment_id: 10,
            event_name: 'Nature Walk & Environment Day',
            description: 'Guided nature walk, tree planting, and environmental awareness activities.',
            activity_type: 'Extracurricular',
            priority: 'Low',
            assigned_date: '2026-09-20',
            scheduled_date: '2026-10-05',
            due_date: '2026-10-05',
            assigned_children: '15 Children',
            location: 'Community Park & Garden',
            assigned_by: 'Environment Club Mentor',
            instructions: 'Carry water bottles, wear hats. Each child plants one sapling.',
            status: 'Pending'
          },
          {
            assignment_id: 11,
            event_name: 'Library Reading Program',
            description: 'Weekly structured reading sessions with comprehension exercises and book reviews.',
            activity_type: 'Education',
            priority: 'High',
            assigned_date: '2026-09-14',
            scheduled_date: '2026-09-21',
            due_date: '2026-09-21',
            assigned_children: '6 Children',
            location: 'Central Library',
            assigned_by: 'Head Teacher',
            instructions: 'Assign age-appropriate books. Track reading progress in the logbook.',
            status: 'Completed',
            completion_date: '2026-09-21',
            remarks: 'All 6 children completed their books; 3 submitted written reviews.'
          },
          {
            assignment_id: 12,
            event_name: 'Drama & Theatre Workshop',
            description: 'Drama improvisation, script reading, and stage performance rehearsal for annual day.',
            activity_type: 'Extracurricular',
            priority: 'High',
            assigned_date: '2026-09-27',
            scheduled_date: '2026-10-12',
            due_date: '2026-10-12',
            assigned_children: '10 Children',
            location: 'Activity Hall A',
            assigned_by: 'Drama Teacher',
            instructions: 'Focus on voice projection and stage confidence. Distribute roles fairly.',
            status: 'In Progress'
          },
          {
            assignment_id: 13,
            event_name: 'Cooking & Nutrition Basics',
            description: 'Teaching children simple healthy recipes, kitchen hygiene, and balanced nutrition.',
            activity_type: 'Extracurricular',
            priority: 'Medium',
            assigned_date: '2026-09-25',
            scheduled_date: '2026-10-08',
            due_date: '2026-10-08',
            assigned_children: '8 Children',
            location: 'Kitchen & Dining Wing',
            assigned_by: 'Nutrition Counsellor',
            instructions: 'Supervise knife handling. Emphasise washing hands. Keep recipes simple and fun.',
            status: 'Pending'
          },
          {
            assignment_id: 14,
            event_name: 'Health & Hygiene Education',
            description: 'Interactive session on personal hygiene, dental care, hand washing, and germ prevention.',
            activity_type: 'Education',
            priority: 'High',
            assigned_date: '2026-09-23',
            scheduled_date: '2026-09-30',
            due_date: '2026-09-30',
            assigned_children: '13 Children',
            location: 'Health Room',
            assigned_by: 'Health Officer',
            instructions: 'Use demonstration kits. Provide each child a hygiene kit to take back.',
            status: 'In Progress'
          }
        ]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const [filterTab, setFilterTab] = useState('all');

  // Format date helper: "2026-09-20" -> "20 Sep 2026"
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const isTodayActivity = (act) => {
    if (!act) return false;
    const sDate = act.scheduled_date || act.due_date || '';
    const aDate = act.assigned_date || '';
    return sDate === todayStr || aDate === todayStr;
  };

  const todayActivities = activities.filter(isTodayActivity);
  const totalCount = activities.length;
  const pendingCount = activities.filter(a => a.status === 'Pending').length;
  const inProgressCount = activities.filter(a => a.status === 'In Progress').length;
  const completedCount = activities.filter(a => a.status === 'Completed').length;

  // Upcoming: activities scheduled today or in future, or still Pending/In Progress
  const upcomingCount = activities.filter(a => {
    const sDate = a.scheduled_date || a.due_date || '';
    return (sDate >= todayStr && a.status !== 'Completed') || a.status === 'Pending';
  }).length;

  const handleStatusUpdateSuccess = () => {
    fetchDashboardData();
  };

  const handleQuickStatus = async (activityId, newStatus) => {
    try {
      const todayIso = getLocalDateStr(now);
      const res = await fetch(`${API}/volunteer/activities/${activityId}/status/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          completion_date: newStatus === 'Completed' ? todayIso : null,
          remarks: newStatus === 'Completed' ? 'Completed successfully during today\'s scheduled session.' : ''
        })
      });
      if (res.ok) {
        fetchDashboardData();
        return;
      }
    } catch (e) {
      console.error(e);
    }
    // Optimistic fallback
    setActivities(prev => prev.map(a => a.assignment_id === activityId ? { ...a, status: newStatus } : a));
  };

  const handleDeleteActivity = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete assignment "${name || 'Activity'}"?`)) return;
    try {
      await fetch(`${API}/volunteer-assignments/${id}/`, { method: 'DELETE' });
    } catch {}
    setActivities(prev => prev.filter(a => a.assignment_id !== id));
  };

  const displayedActivities = activities.filter(act => {
    if (filterTab === 'today') return isTodayActivity(act);
    if (filterTab === 'in_progress') return act.status === 'In Progress';
    if (filterTab === 'pending') return act.status === 'Pending';
    if (filterTab === 'completed') return act.status === 'Completed';
    return true;
  });

  // Prioritize today's activities at the top when viewing 'all'
  const sortedDisplayedActivities = [...displayedActivities].sort((a, b) => {
    if (filterTab === 'all') {
      const aIsToday = isTodayActivity(a);
      const bIsToday = isTodayActivity(b);
      if (aIsToday && !bIsToday) return -1;
      if (!aIsToday && bIsToday) return 1;
    }
    const dateA = a.scheduled_date || a.assigned_date || '';
    const dateB = b.scheduled_date || b.assigned_date || '';
    return dateB.localeCompare(dateA);
  });

  return (
    <>
      <TopHeader title="Volunteer Dashboard" onToggleSidebar={toggleSidebar} />

      <div className="page-body">
        {/* WELCOME BANNER */}
        <div className="page-banner" style={{
          background: 'linear-gradient(135deg, rgba(37,99,235,0.12) 0%, rgba(22,163,74,0.10) 100%)',
          border: '1px solid rgba(37,99,235,0.25)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <div className="page-banner-title" style={{ color: 'var(--text-primary)', fontSize: '1.6rem' }}>
              Welcome back, {profile?.full_name || userName}!
            </div>
            <div className="page-banner-sub">
              Intelligent Child Development and Orphanage Management System Using AI & ML
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
            {/* Total Activities & Today Counter Widget */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.9rem',
              background: 'rgba(37,99,235,0.08)',
              border: '1px solid rgba(37,99,235,0.22)',
              borderRadius: 'var(--radius-md)',
              padding: '0.55rem 1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(37,99,235,0.18)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#60a5fa',
                  fontSize: '1.1rem'
                }}>
                  <i className="bi bi-calendar3" />
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Total Activities
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
                    {loading ? '—' : totalCount}
                  </div>
                </div>
              </div>

              <div style={{ width: '1px', height: '30px', background: 'rgba(96,165,250,0.25)' }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 'var(--radius-sm)',
                  background: todayActivities.length > 0 ? 'rgba(34,197,94,0.18)' : 'rgba(148,163,184,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: todayActivities.length > 0 ? '#4ade80' : 'var(--text-muted)',
                  fontSize: '1.1rem'
                }}>
                  <i className="bi bi-calendar2-check-fill" />
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Today's Activities
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: todayActivities.length > 0 ? '#4ade80' : 'var(--text-primary)', lineHeight: 1.1 }}>
                    {loading ? '—' : todayActivities.length}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              <Link to="/volunteer/activities" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <i className="bi bi-calendar-check-fill" /> View All Activities
              </Link>
              <Link to="/volunteer/profile" className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <i className="bi bi-person-circle" /> Edit My Profile
              </Link>
            </div>
          </div>
        </div>

        {/* 6 DASHBOARD CARDS */}
        <div className="stats-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          {[
            { label: 'Total Assigned Activities', value: totalCount, icon: 'bi-calendar3', cls: 'stat-icon-accent' },
            { label: "Today's Activities", value: todayActivities.length, icon: 'bi-calendar2-check-fill', cls: 'stat-icon-cyan' },
            { label: 'Pending Activities', value: pendingCount, icon: 'bi-hourglass-split', cls: 'stat-icon-amber' },
            { label: 'In-Progress Activities', value: inProgressCount, icon: 'bi-lightning-charge-fill', cls: 'stat-icon-violet' },
            { label: 'Completed Activities', value: completedCount, icon: 'bi-check-circle-fill', cls: 'stat-icon-green' },
            { label: 'Upcoming Activities', value: upcomingCount, icon: 'bi-bell-fill', cls: 'stat-icon-accent' },
          ].map(s => (
            <div key={s.label} className="stat-card" style={{ padding: '1rem' }}>
              <div className={`stat-icon ${s.cls}`} style={{ width: 44, height: 44, fontSize: '1.25rem' }}>
                <i className={`bi ${s.icon}`} />
              </div>
              <div>
                <div className="stat-label" style={{ fontSize: '0.75rem' }}>{s.label}</div>
                <div className="stat-value" style={{ fontSize: '1.4rem' }}>{loading ? '—' : s.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* VOLUNTEER PROFILE SUMMARY CARD */}
        <div className="chart-card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div className="chart-card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
              <i className="bi bi-person-badge-fill" style={{ color: '#3b82f6' }} /> Volunteer Profile Summary
            </div>
            <Link to="/volunteer/profile" className="btn btn-ghost btn-sm" style={{ fontSize: '0.78rem' }}>
              <i className="bi bi-pencil" /> Edit Full Profile
            </Link>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            background: 'var(--bg-surface-2)',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)'
          }}>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                Volunteer Name
              </span>
              <strong style={{ color: 'var(--text-primary)', fontSize: '0.92rem' }}>
                {profile?.full_name || userName}
              </strong>
            </div>

            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                Email
              </span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                {profile?.email || userEmail || 'volunteer@orphanage.com'}
              </span>
            </div>

            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                Phone Number
              </span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                {profile?.phone_number || '+91 98765 43210'}
              </span>
            </div>

            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                Profile Status
              </span>
              <span className={`badge ${profile?.status === 'Active' ? 'badge-green' : 'badge-amber'}`} style={{ marginTop: '0.2rem' }}>
                {profile?.status || 'Active'}
              </span>
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                Skills
              </span>
              <span style={{ color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                {profile?.skills || 'Mathematics Tutoring, STEM Mentorship, Basic First Aid'}
              </span>
            </div>

            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                Areas of Interest
              </span>
              <span style={{ color: '#60a5fa', fontSize: '0.85rem', fontWeight: 600 }}>
                {profile?.areas_of_interest || 'Education, Sports, Arts and Crafts'}
              </span>
            </div>

            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                Availability
              </span>
              <span style={{ color: '#34d399', fontSize: '0.85rem', fontWeight: 600 }}>
                {profile?.availability || 'Weekends & Evenings'}
              </span>
            </div>
          </div>
        </div>

        {/* TODAY'S ASSIGNED ACTIVITIES SHOWCASE SECTION */}
        <div className="chart-card" style={{
          marginBottom: '1.5rem',
          padding: '1.25rem',
          border: todayActivities.length > 0 ? '1px solid rgba(59, 130, 246, 0.4)' : undefined,
          boxShadow: todayActivities.length > 0 ? '0 4px 20px -2px rgba(59, 130, 246, 0.12)' : undefined
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.1rem', flexWrap: 'wrap', gap: '0.6rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(37,99,235,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#3b82f6',
                fontSize: '1.2rem'
              }}>
                <i className="bi bi-calendar2-event-fill" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Today's Assigned Activities
                  </h3>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    background: todayActivities.length > 0 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(148, 163, 184, 0.12)',
                    color: todayActivities.length > 0 ? '#4ade80' : 'var(--text-muted)',
                    border: todayActivities.length > 0 ? '1px solid rgba(34, 197, 94, 0.35)' : '1px solid var(--border)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.6rem',
                    borderRadius: '999px'
                  }}>
                    <span style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: todayActivities.length > 0 ? '#22c55e' : '#94a3b8',
                      display: 'inline-block',
                      boxShadow: todayActivities.length > 0 ? '0 0 8px #22c55e' : 'none'
                    }} />
                    {todayActivities.length > 0 ? `${todayActivities.length} Scheduled for Today` : 'No Activities Today'}
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  {now.toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                </div>
              </div>
            </div>

            {todayActivities.length > 0 && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setFilterTab('today')}
                style={{ fontSize: '0.8rem', color: '#60a5fa' }}
              >
                Focus in Table Below <i className="bi bi-arrow-down-short" />
              </button>
            )}
          </div>

          {todayActivities.length === 0 ? (
            <div style={{
              background: 'var(--bg-surface-2)',
              border: '1px dashed var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '1.75rem',
              textAlign: 'center',
              color: 'var(--text-secondary)'
            }}>
              <i className="bi bi-calendar2-check" style={{ fontSize: '2rem', color: '#60a5fa', display: 'block', marginBottom: '0.5rem' }} />
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.96rem' }}>
                No activities scheduled for today ({formatDate(todayStr)})
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                You have {upcomingCount} upcoming activities. View your schedule in the table below.
              </div>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '1rem'
            }}>
              {todayActivities.map(act => (
                <div
                  key={act.assignment_id}
                  style={{
                    background: 'var(--bg-surface-2)',
                    border: '1px solid rgba(59, 130, 246, 0.35)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.15rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: act.status === 'Completed' ? '#10b981' : act.status === 'In Progress' ? '#3b82f6' : '#f59e0b'
                  }} />

                  <div>
                    {/* Header tags */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                      <span className={`badge ${TYPE_BADGE[act.activity_type] || 'badge-muted'}`} style={{ fontSize: '0.74rem' }}>
                        {act.activity_type || 'Activity'}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.45rem',
                          borderRadius: 'var(--radius-sm)',
                          color: act.priority === 'High' ? '#ef4444' : act.priority === 'Medium' ? '#f59e0b' : '#10b981',
                          background: act.priority === 'High' ? 'rgba(239, 68, 68, 0.12)' : act.priority === 'Medium' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                          textTransform: 'uppercase'
                        }}>
                          {act.priority || 'Normal'} Priority
                        </span>
                        <span className={`badge ${STATUS_COLOR[act.status] || 'badge-muted'}`} style={{ fontSize: '0.74rem' }}>
                          {act.status}
                        </span>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '1.02rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {act.event_name}
                    </h4>
                    <p style={{ margin: '0 0 0.85rem 0', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                      {act.description || 'Assigned volunteer session for today.'}
                    </p>

                    {/* Info items */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '0.5rem',
                      fontSize: '0.78rem',
                      background: 'rgba(0,0,0,0.12)',
                      padding: '0.7rem 0.8rem',
                      borderRadius: 'var(--radius-sm)',
                      marginBottom: '0.85rem',
                      border: '1px solid var(--border)'
                    }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.68rem', fontWeight: 700 }}>SCHEDULED</span>
                        <span style={{ color: '#60a5fa', fontWeight: 800 }}>
                          <i className="bi bi-calendar-check" style={{ marginRight: '0.3rem' }} />
                          Today ({formatDate(act.scheduled_date || todayStr)})
                        </span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.68rem', fontWeight: 700 }}>LOCATION</span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                          <i className="bi bi-geo-alt-fill" style={{ marginRight: '0.3rem', color: '#ef4444' }} />
                          {act.location || 'Campus'}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.68rem', fontWeight: 700 }}>ASSIGNED GROUP</span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                          <i className="bi bi-people-fill" style={{ marginRight: '0.3rem', color: '#a855f7' }} />
                          {act.assigned_children || 'Assigned Group'}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.68rem', fontWeight: 700 }}>ASSIGNED BY</span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                          <i className="bi bi-person-fill" style={{ marginRight: '0.3rem', color: '#10b981' }} />
                          {act.assigned_by || 'Coordinator'}
                        </span>
                      </div>
                    </div>

                    {/* Instructions */}
                    {act.instructions && (
                      <div style={{
                        fontSize: '0.75rem',
                        background: 'rgba(59, 130, 246, 0.08)',
                        borderLeft: '3px solid #3b82f6',
                        padding: '0.5rem 0.7rem',
                        borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                        color: 'var(--text-secondary)',
                        marginBottom: '0.85rem'
                      }}>
                        <strong style={{ color: '#60a5fa' }}><i className="bi bi-info-circle-fill" /> Instructions: </strong>
                        {act.instructions}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => setSelectedActivity(act)}
                      style={{ flex: 1, minWidth: '130px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                    >
                      <i className="bi bi-pencil-square" /> Update Status & Remarks
                    </button>
                    {act.status !== 'Completed' && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleQuickStatus(act.assignment_id, 'Completed')}
                        style={{ fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.4)' }}
                        title="Mark Completed"
                      >
                        <i className="bi bi-check-circle" /> Complete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RECENT ASSIGNED ACTIVITIES TABLE */}
        <div className="chart-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div className="chart-card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="bi bi-list-check" style={{ color: '#2563eb' }} /> Assigned Activities Table
            </div>

            {/* Quick Filter Tabs */}
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {[
                { id: 'all', label: `All (${totalCount})` },
                { id: 'today', label: `📅 Today (${todayActivities.length})`, highlight: todayActivities.length > 0 },
                { id: 'in_progress', label: `In Progress (${inProgressCount})` },
                { id: 'pending', label: `Pending (${pendingCount})` },
                { id: 'completed', label: `Completed (${completedCount})` },
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterTab(tab.id)}
                  style={{
                    padding: '0.3rem 0.65rem',
                    fontSize: '0.76rem',
                    fontWeight: filterTab === tab.id ? 700 : 500,
                    borderRadius: 'var(--radius-sm)',
                    border: filterTab === tab.id
                      ? '1px solid #3b82f6'
                      : tab.highlight
                        ? '1px solid rgba(34, 197, 94, 0.5)'
                        : '1px solid var(--border)',
                    background: filterTab === tab.id
                      ? '#2563eb'
                      : tab.highlight
                        ? 'rgba(34, 197, 94, 0.12)'
                        : 'var(--bg-surface-2)',
                    color: filterTab === tab.id
                      ? '#fff'
                      : tab.highlight
                        ? '#4ade80'
                        : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {tab.label}
                </button>
              ))}
              <Link to="/volunteer/activities" className="btn btn-ghost btn-sm" style={{ fontSize: '0.78rem', marginLeft: '0.2rem' }}>
                Full Search <i className="bi bi-arrow-right" />
              </Link>
            </div>
          </div>

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Activity</th>
                  <th style={{ minWidth: '175px' }}>Dates</th>
                  <th style={{ textAlign: 'center' }}>Children</th>
                  <th>Type</th>
                  <th style={{ textAlign: 'center', minWidth: '105px' }}>Status</th>
                  <th style={{ textAlign: 'center', minWidth: '95px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem' }}>
                      <span className="spinner" style={{ margin: '0 auto' }} />
                    </td>
                  </tr>
                ) : sortedDisplayedActivities.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                      <i className="bi bi-calendar-x" style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }} />
                      No activities match the selected filter.
                    </td>
                  </tr>
                ) : (
                  sortedDisplayedActivities.map((act) => {
                    const scheduledDate = act.scheduled_date || act.due_date || act.assigned_date;
                    const isToday = isTodayActivity(act);
                    const childMatch = String(act.assigned_children || '').match(/^\s*(\d+)/);
                    const childDisplay = childMatch ? childMatch[1] : (String(act.assigned_children || '').match(/\d+/)?.[0] || '5');

                    return (
                      <tr
                        key={act.assignment_id}
                        style={{
                          background: isToday ? 'rgba(59, 130, 246, 0.08)' : undefined,
                          borderLeft: isToday ? '4px solid #3b82f6' : undefined
                        }}
                      >
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                              {act.event_name}
                            </span>
                            {isToday && (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                background: 'rgba(34, 197, 94, 0.16)',
                                color: '#4ade80',
                                border: '1px solid rgba(34, 197, 94, 0.35)',
                                fontSize: '0.64rem',
                                fontWeight: 800,
                                padding: '0.12rem 0.45rem',
                                borderRadius: '999px',
                                letterSpacing: '0.04em'
                              }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block', boxShadow: '0 0 6px #22c55e' }} />
                                TODAY
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {act.description || 'Assigned shift activity'}
                          </div>
                        </td>

                        <td style={{ whiteSpace: 'nowrap', minWidth: '175px' }}>
                          {/* Assigned Date */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.3rem' }}>
                            <span style={{ fontSize: '0.63rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em', minWidth: '52px' }}>Assigned</span>
                            <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>
                              <i className="bi bi-calendar-plus" style={{ marginRight: '0.25rem', color: '#64748b' }} />
                              {formatDate(act.assigned_date)}
                            </span>
                          </div>
                          {/* Activity / Scheduled Date */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span style={{ fontSize: '0.63rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em', minWidth: '52px' }}>Activity</span>
                            <span style={{ fontSize: '0.82rem', color: isToday ? '#38bdf8' : '#60a5fa', fontWeight: 700 }}>
                              <i className="bi bi-calendar-event-fill" style={{ marginRight: '0.25rem' }} />
                              {formatDate(scheduledDate)}
                              {isToday && (
                                <span style={{ color: '#4ade80', fontSize: '0.72rem', marginLeft: '0.3rem', fontWeight: 800 }}>
                                  (Today)
                                </span>
                              )}
                            </span>
                          </div>
                        </td>

                        <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <span className="badge badge-accent" style={{ fontSize: '0.75rem', padding: '0.2rem 0.55rem' }} title={act.assigned_children || 'Assigned Children'}>
                            {childDisplay}
                          </span>
                        </td>

                        <td style={{ whiteSpace: 'nowrap' }}>
                          <span className="badge badge-muted" style={{ fontSize: '0.75rem' }}>
                            {act.activity_type || 'Education'}
                          </span>
                        </td>

                        <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <span className={`badge ${STATUS_COLOR[act.status] || 'badge-muted'}`}>
                            {act.status}
                          </span>
                        </td>

                        <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <div className="action-btn-group">
                            <button
                              type="button"
                              className="btn-icon-pencil"
                              onClick={() => setSelectedActivity(act)}
                              title="Edit Activity"
                            >
                              <i className="bi bi-pencil" />
                            </button>
                            <button
                              type="button"
                              className="btn-box-delete"
                              onClick={() => handleDeleteActivity(act.assignment_id, act.event_name)}
                              title="Delete Activity"
                            >
                              <i className="bi bi-trash" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Activity Details & Status Modal */}
      {selectedActivity && (
        <ActivityDetails
          activity={selectedActivity}
          onClose={() => setSelectedActivity(null)}
          onUpdateSuccess={handleStatusUpdateSuccess}
        />
      )}
    </>
  );
}
