import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';

const TEST_DATA = [
  {
    id: 1,
    name: 'Login Page Role Pill Presets',
    role: 'Login Page',
    category: 'auth',
    icon: '🔑',
    status: 'PASS',
    time: '5.12s',
    account: 'staff@orphanage.com, donor@orphanage.com, etc.',
    desc: 'Verifies clicking Caregiver, Donor, Volunteer, and Student pills automatically populates form inputs and sets role state.',
    steps: [
      'Navigate to /login',
      'Click "Caregiver" pill → Email auto-fills staff@orphanage.com',
      'Click "Donor" pill → Email auto-fills donor@orphanage.com',
      'Click "Volunteer" pill → Email auto-fills volunteer@orphanage.com',
      'Click "Student" pill → Email auto-fills student@orphanage.com'
    ]
  },
  {
    id: 2,
    name: 'Invalid Credentials Security Rejection',
    role: 'Login Page',
    category: 'auth',
    icon: '🔒',
    status: 'PASS',
    time: '2.45s',
    account: 'admin@orphanage.com (invalid password test)',
    desc: 'Submits incorrect credentials and verifies that the system blocks access and renders the error banner.',
    steps: [
      'Navigate to /login',
      'Input invalid password "WrongPassword@999"',
      'Submit authentication request',
      'Assert error alert "Invalid email or password" is displayed',
      'Confirm user remains on /login without unauthorized token'
    ]
  },
  {
    id: 3,
    name: 'Administrator Authentication & Dashboard',
    role: 'Administrator',
    category: 'admin',
    icon: '🛡️',
    status: 'PASS',
    time: '7.00s',
    account: 'admin@orphanage.com (Alexander Wright)',
    desc: 'Logs in with administrator credentials, validates JWT token storage, and confirms landing on /admin-dashboard.',
    steps: [
      'Submit admin credentials (admin@orphanage.com)',
      'Verify redirect to /admin-dashboard',
      'Validate local session variables (userRole=admin)',
      'Confirm admin header branding and sidebar navigation links'
    ]
  },
  {
    id: 4,
    name: 'Admin Analytics KPIs & Chart Visualizations',
    role: 'Administrator',
    category: 'admin',
    icon: '📊',
    status: 'PASS',
    time: '10.09s',
    account: 'admin@orphanage.com',
    desc: 'Verifies 4 high-level metric cards (Children, Staff, Volunteers, Donations) and interactive Chart.js canvases.',
    steps: [
      'Locate 4 core KPI stat cards on Admin Dashboard',
      'Verify positive trend indicators (+12%, +5%)',
      'Verify Chart.js canvas elements for Academic Trends',
      'Verify Expense Breakdown financial charts load properly'
    ]
  },
  {
    id: 5,
    name: 'Caregiver Authentication & Daily Wellness Portal',
    role: 'Caregiver',
    category: 'caregiver',
    icon: '🩺',
    status: 'PASS',
    time: '9.50s',
    account: 'staff@orphanage.com (Sarah Jenkins)',
    desc: 'Logs in with caregiver role and verifies direct access to /staff-dashboard with child health & daily logs.',
    steps: [
      'Select Caregiver preset & submit login',
      'Verify redirection to /staff-dashboard',
      'Verify caregiver action cards: Attendance, Vitals, Meal logs, Case notes',
      'Confirm child profiles directory access permissions'
    ]
  },
  {
    id: 6,
    name: 'Donor Authentication & Contribution Hub',
    role: 'Donor',
    category: 'donor',
    icon: '💖',
    status: 'PASS',
    time: '5.99s',
    account: 'donor@orphanage.com (Eleanor Vance)',
    desc: 'Logs in with donor credentials and confirms access to /donor-dashboard, donation history, and sponsorship status.',
    steps: [
      'Select Donor preset & submit login',
      'Verify redirection to /donor-dashboard',
      'Verify total donations summary card & sponsored child link',
      'Confirm financial reports access permissions'
    ]
  },
  {
    id: 7,
    name: 'Volunteer Authentication & Assigned Activities',
    role: 'Volunteer',
    category: 'volunteer',
    icon: '🤝',
    status: 'PASS',
    time: '6.01s',
    account: 'volunteer@orphanage.com (Marcus Brody)',
    desc: 'Logs in with volunteer role and verifies redirection to /volunteer-dashboard with active assignments and hours tracking.',
    steps: [
      'Select Volunteer preset & submit login',
      'Verify redirection to /volunteer-dashboard',
      'Verify activity cards, upcoming events, and logged volunteer hours',
      'Verify volunteer profile navigation'
    ]
  },
  {
    id: 8,
    name: 'Secure Session Logout & Token Invalidation',
    role: 'Login Page',
    category: 'auth',
    icon: '🚪',
    status: 'PASS',
    time: '7.99s',
    account: 'admin@orphanage.com',
    desc: 'Triggers session termination from sidebar user menu, confirms localStorage cleanup, and asserts redirection back to /login.',
    steps: [
      'Click user profile menu in sidebar',
      'Select "Sign Out" action',
      'Verify localStorage session tokens are cleared',
      'Confirm browser safely redirects to /login'
    ]
  }
];

const CATEGORY_CONFIG = {
  auth: {
    label: 'Login & Security',
    bg: '#eff6ff',
    color: '#1d4ed8',
    border: '#bfdbfe',
    badgeBg: '#dbeafe',
    icon: '🔑'
  },
  admin: {
    label: 'Administrator Portal',
    bg: '#faf5ff',
    color: '#6d28d9',
    border: '#e9d5ff',
    badgeBg: '#f3e8ff',
    icon: '🛡️'
  },
  caregiver: {
    label: 'Caregiver Portal',
    bg: '#ecfdf5',
    color: '#047857',
    border: '#a7f3d0',
    badgeBg: '#d1fae5',
    icon: '🩺'
  },
  donor: {
    label: 'Donor Portal',
    bg: '#fff7ed',
    color: '#c2410c',
    border: '#fed7aa',
    badgeBg: '#ffedd5',
    icon: '💖'
  },
  volunteer: {
    label: 'Volunteer Portal',
    bg: '#fefce8',
    color: '#854d0e',
    border: '#fde68a',
    badgeBg: '#fef9c3',
    icon: '🤝'
  }
};

const TABS = [
  { id: 'all', label: 'All Tests', count: 8, icon: '🌟' },
  { id: 'auth', label: 'Login & Auth', count: 3, icon: '🔑' },
  { id: 'admin', label: 'Administrator', count: 2, icon: '🛡️' },
  { id: 'caregiver', label: 'Caregiver', count: 1, icon: '🩺' },
  { id: 'donor', label: 'Donor', count: 1, icon: '💖' },
  { id: 'volunteer', label: 'Volunteer', count: 1, icon: '🤝' }
];

export default function TestResultsPage() {
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [selectedTest, setSelectedTest] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  // Filtered and searched tests
  const filteredTests = useMemo(() => {
    return TEST_DATA.filter((test) => {
      const matchesCategory = filter === 'all' || test.category === filter;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        test.name.toLowerCase().includes(q) ||
        test.role.toLowerCase().includes(q) ||
        test.desc.toLowerCase().includes(q) ||
        test.account.toLowerCase().includes(q) ||
        test.steps.some((s) => s.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [filter, searchQuery]);

  const totalDuration = TEST_DATA.reduce((sum, t) => sum + parseFloat(t.time), 0).toFixed(2);

  return (
    <div
      style={{
        background: '#f8fafc',
        minHeight: '100vh',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        color: '#0f172a',
        paddingBottom: '4rem'
      }}
    >
      {/* ── TOP NAVIGATION BAR ── */}
      <nav
        style={{
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          padding: '0.85rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <Link
            to="/"
            style={{
              color: '#2563eb',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.35rem 0.75rem',
              borderRadius: '0.5rem',
              background: '#eff6ff',
              border: '1px solid #dbeafe',
              transition: 'all 0.15s ease'
            }}
          >
            ← Back to HopeNest
          </Link>
          <span style={{ color: '#cbd5e1' }}>|</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '1.1rem' }}>🧪</span>
            <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>
              Selenium Test Report
            </span>
            <span
              style={{
                background: '#dcfce7',
                color: '#15803d',
                border: '1px solid #86efac',
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '0.15rem 0.55rem',
                borderRadius: '1rem',
                marginLeft: '0.25rem'
              }}
            >
              8 / 8 PASSED
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link
            to="/login"
            style={{
              background: '#2563eb',
              color: '#ffffff',
              textDecoration: 'none',
              padding: '0.45rem 1.15rem',
              borderRadius: '0.5rem',
              fontSize: '0.85rem',
              fontWeight: 700,
              boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            Open Login Page →
          </Link>
        </div>
      </nav>

      {/* ── MAIN CONTENT CONTAINER ── */}
      <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* ── CLEAN LIGHT HERO BANNER ── */}
        <div
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8faff 50%, #eff6ff 100%)',
            borderRadius: '1.25rem',
            padding: '2.25rem 2.5rem',
            marginBottom: '1.75rem',
            border: '1px solid #bfdbfe',
            borderLeft: '6px solid #2563eb',
            boxShadow: '0 10px 30px -5px rgba(37, 99, 235, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.03)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.75rem'
          }}
        >
          {/* Left Title & Description */}
          <div style={{ flex: '1 1 560px' }}>
            {/* Status Pill */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: '#dcfce7',
                border: '1px solid #86efac',
                color: '#15803d',
                padding: '0.35rem 0.95rem',
                borderRadius: '2rem',
                fontSize: '0.78rem',
                fontWeight: 800,
                marginBottom: '0.85rem',
                letterSpacing: '0.4px'
              }}
            >
              <span
                style={{
                  width: '9px',
                  height: '9px',
                  borderRadius: '50%',
                  background: '#16a34a',
                  display: 'inline-block',
                  boxShadow: '0 0 0 3px rgba(34, 197, 94, 0.25)'
                }}
              />
              SELENIUM WEBDRIVER AUTOMATION COMPLETE
            </div>

            {/* Clear Heading with High Contrast */}
            <h1
              style={{
                fontSize: '2.1rem',
                fontWeight: 900,
                color: '#0f172a',
                margin: '0 0 0.5rem',
                letterSpacing: '-0.025em',
                lineHeight: 1.25
              }}
            >
              System Verification & Role Testing
            </h1>

            {/* High Readability Description */}
            <p
              style={{
                color: '#334155',
                margin: 0,
                fontSize: '0.96rem',
                maxWidth: '680px',
                lineHeight: 1.6,
                fontWeight: 450
              }}
            >
              End-to-end automated testing validating Authentication, Administrator controls,
              Caregiver daily operations, Donor engagement, and Volunteer activity management.
            </p>
          </div>

          {/* Right Pass Rate Badge */}
          <div
            style={{
              background: '#ffffff',
              border: '2px solid #86efac',
              borderRadius: '1.25rem',
              padding: '1.35rem 2.25rem',
              textAlign: 'center',
              minWidth: '180px',
              boxShadow: '0 4px 15px rgba(22, 163, 74, 0.12)'
            }}
          >
            <div
              style={{
                fontSize: '3rem',
                fontWeight: 900,
                color: '#16a34a',
                lineHeight: 1,
                letterSpacing: '-0.03em'
              }}
            >
              100%
            </div>
            <div
              style={{
                fontSize: '0.85rem',
                color: '#15803d',
                fontWeight: 800,
                marginTop: '0.45rem',
                letterSpacing: '0.3px'
              }}
            >
              PASSED (8 of 8 Roles)
            </div>
            <div
              style={{
                fontSize: '0.72rem',
                color: '#166534',
                fontWeight: 600,
                marginTop: '0.2rem',
                background: '#dcfce7',
                padding: '0.15rem 0.5rem',
                borderRadius: '0.5rem',
                display: 'inline-block'
              }}
            >
              ✓ Zero Failures
            </div>
          </div>
        </div>

        {/* ── CLEAN KPI METRIC CARDS ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
            gap: '1rem',
            marginBottom: '1.75rem'
          }}
        >
          {[
            {
              icon: '✅',
              label: 'Tests Passed',
              value: '8 / 8',
              sub: '100% Success Rate',
              color: '#15803d',
              bg: '#f0fdf4',
              border: '#bbf7d0',
              accent: '#22c55e'
            },
            {
              icon: '⏱️',
              label: 'Total Execution Time',
              value: `${totalDuration}s`,
              sub: 'Average: 6.77s / role test',
              color: '#1d4ed8',
              bg: '#eff6ff',
              border: '#bfdbfe',
              accent: '#3b82f6'
            },
            {
              icon: '👥',
              label: 'Roles Verified',
              value: '5 Portals',
              sub: 'Admin, Staff, Donor, Vol, Student',
              color: '#6d28d9',
              bg: '#faf5ff',
              border: '#e9d5ff',
              accent: '#8b5cf6'
            },
            {
              icon: '🤖',
              label: 'Automated Engine',
              value: 'Selenium 4',
              sub: 'Chrome Headless · 1920×1080',
              color: '#b45309',
              bg: '#fffbeb',
              border: '#fde68a',
              accent: '#f59e0b'
            }
          ].map((card, i) => (
            <div
              key={i}
              style={{
                background: card.bg,
                border: `1px solid ${card.border}`,
                borderRadius: '1rem',
                padding: '1.25rem 1.4rem',
                boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: card.accent
                }}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '1.4rem' }}>{card.icon}</span>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    color: card.color,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                >
                  {card.label}
                </span>
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: 900, color: card.color, lineHeight: 1.2 }}>
                {card.value}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 600, marginTop: '0.3rem' }}>
                {card.sub}
              </div>
            </div>
          ))}
        </div>

        {/* ── TOOLBAR: SEARCH + CATEGORY FILTER + VIEW TOGGLE ── */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '1rem',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          {/* Category Filter Tabs */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {TABS.map((tab) => {
              const active = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  style={{
                    background: active ? '#2563eb' : '#f1f5f9',
                    color: active ? '#ffffff' : '#334155',
                    border: active ? '1px solid #1d4ed8' : '1px solid #e2e8f0',
                    padding: '0.45rem 0.95rem',
                    borderRadius: '2rem',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                  <span
                    style={{
                      background: active ? 'rgba(255,255,255,0.25)' : '#cbd5e1',
                      color: active ? '#ffffff' : '#1e293b',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      borderRadius: '1rem',
                      padding: '0.05rem 0.45rem',
                      minWidth: '18px',
                      textAlign: 'center'
                    }}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search + View Mode Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search test name, role, steps..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: '0.45rem 0.85rem 0.45rem 2.1rem',
                  fontSize: '0.82rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  color: '#0f172a',
                  width: '240px',
                  outline: 'none',
                  fontWeight: 500
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  left: '0.65rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8',
                  fontSize: '0.85rem'
                }}
              >
                🔍
              </span>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '0.5rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 700
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* View Mode Switcher */}
            <div
              style={{
                display: 'flex',
                background: '#f1f5f9',
                border: '1px solid #e2e8f0',
                borderRadius: '0.5rem',
                padding: '0.2rem'
              }}
            >
              <button
                onClick={() => setViewMode('grid')}
                title="Card Grid View"
                style={{
                  background: viewMode === 'grid' ? '#ffffff' : 'transparent',
                  color: viewMode === 'grid' ? '#2563eb' : '#64748b',
                  border: viewMode === 'grid' ? '1px solid #cbd5e1' : 'none',
                  borderRadius: '0.35rem',
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  boxShadow: viewMode === 'grid' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none'
                }}
              >
                ⊞ Cards
              </button>
              <button
                onClick={() => setViewMode('table')}
                title="Table List View"
                style={{
                  background: viewMode === 'table' ? '#ffffff' : 'transparent',
                  color: viewMode === 'table' ? '#2563eb' : '#64748b',
                  border: viewMode === 'table' ? '1px solid #cbd5e1' : 'none',
                  borderRadius: '0.35rem',
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  boxShadow: viewMode === 'table' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none'
                }}
              >
                ☰ Table
              </button>
            </div>
          </div>
        </div>

        {/* ── EMPTY STATE IF NO MATCHES ── */}
        {filteredTests.length === 0 && (
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '1rem',
              padding: '3rem 2rem',
              textAlign: 'center',
              color: '#64748b'
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔎</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.4rem' }}>
              No tests match your filter
            </h3>
            <p style={{ margin: '0 0 1rem', fontSize: '0.88rem' }}>
              Try searching with different keywords or switch to the "All Tests" tab.
            </p>
            <button
              onClick={() => {
                setFilter('all');
                setSearchQuery('');
              }}
              style={{
                background: '#2563eb',
                color: '#fff',
                border: 'none',
                padding: '0.45rem 1rem',
                borderRadius: '0.5rem',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* ── VIEW 1: CLEAN CARD GRID (HIGHLY IDENTIFIABLE) ── */}
        {viewMode === 'grid' && filteredTests.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
              gap: '1.25rem'
            }}
          >
            {filteredTests.map((test) => {
              const cfg = CATEGORY_CONFIG[test.category];
              return (
                <div
                  key={test.id}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '1.15rem',
                    padding: '1.5rem',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s ease',
                    borderTop: `4px solid ${cfg.color}`
                  }}
                >
                  <div>
                    {/* Header: Role Badge + Status */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.85rem',
                        gap: '0.5rem',
                        flexWrap: 'wrap'
                      }}
                    >
                      {/* Role Pill */}
                      <span
                        style={{
                          background: cfg.bg,
                          color: cfg.color,
                          border: `1px solid ${cfg.border}`,
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          padding: '0.25rem 0.75rem',
                          borderRadius: '2rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        <span>{test.icon}</span>
                        <span>{test.role}</span>
                      </span>

                      {/* Status + Time */}
                      <span
                        style={{
                          background: '#dcfce7',
                          color: '#15803d',
                          border: '1px solid #86efac',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          padding: '0.25rem 0.65rem',
                          borderRadius: '2rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}
                      >
                        ✓ PASS ({test.time})
                      </span>
                    </div>

                    {/* Test Title */}
                    <h3
                      style={{
                        fontSize: '1.1rem',
                        fontWeight: 800,
                        color: '#0f172a',
                        margin: '0 0 0.45rem',
                        lineHeight: 1.35
                      }}
                    >
                      {test.name}
                    </h3>

                    {/* Test Description */}
                    <p
                      style={{
                        fontSize: '0.86rem',
                        color: '#475569',
                        margin: '0 0 1rem',
                        lineHeight: 1.5
                      }}
                    >
                      {test.desc}
                    </p>

                    {/* Executed Steps Preview */}
                    <div
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '0.65rem',
                        padding: '0.85rem 1rem',
                        marginBottom: '1.15rem'
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 700,
                          color: '#334155',
                          fontSize: '0.75rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.4px',
                          marginBottom: '0.5rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        <span>📋</span>
                        <span>Executed Steps ({test.steps.length}):</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        {test.steps.slice(0, 3).map((s, idx) => (
                          <div
                            key={idx}
                            style={{
                              fontSize: '0.8rem',
                              color: '#334155',
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '0.45rem',
                              lineHeight: 1.35
                            }}
                          >
                            <span style={{ color: '#16a34a', fontWeight: 800, flexShrink: 0 }}>✓</span>
                            <span>{s}</span>
                          </div>
                        ))}
                        {test.steps.length > 3 && (
                          <div
                            style={{
                              fontSize: '0.75rem',
                              color: '#2563eb',
                              fontWeight: 600,
                              paddingLeft: '1rem',
                              marginTop: '0.1rem'
                            }}
                          >
                            + {test.steps.length - 3} more automated assertions
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom: Account + Button */}
                  <div
                    style={{
                      borderTop: '1px solid #f1f5f9',
                      paddingTop: '0.85rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      <span style={{ color: '#94a3b8' }}>Account: </span>
                      <strong style={{ color: '#1e293b' }}>
                        {test.account.length > 25 ? test.account.slice(0, 25) + '…' : test.account}
                      </strong>
                    </div>

                    <button
                      onClick={() => setSelectedTest(test)}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '0.5rem',
                        padding: '0.4rem 0.85rem',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: '#2563eb',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#eff6ff';
                        e.currentTarget.style.borderColor = '#93c5fd';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#ffffff';
                        e.currentTarget.style.borderColor = '#cbd5e1';
                      }}
                    >
                      <span>🔍</span>
                      <span>View Details</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── VIEW 2: CLEAN TABLE LIST ── */}
        {viewMode === 'table' && filteredTests.length > 0 && (
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '1rem',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}
          >
            {/* Table Header */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '48px 1fr 140px 120px 90px 130px',
                background: '#f8fafc',
                borderBottom: '2px solid #e2e8f0',
                padding: '0.85rem 1.25rem',
                gap: '0.75rem',
                alignItems: 'center'
              }}
            >
              {['#', 'Test Name & Objective', 'Role Focus', 'Category', 'Duration', 'Action'].map(
                (h, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}
                  >
                    {h}
                  </div>
                )
              )}
            </div>

            {/* Table Rows */}
            {filteredTests.map((test, idx) => {
              const cfg = CATEGORY_CONFIG[test.category];
              const isExpanded = expandedId === test.id;

              return (
                <div
                  key={test.id}
                  style={{
                    borderBottom: idx < filteredTests.length - 1 ? '1px solid #f1f5f9' : 'none'
                  }}
                >
                  {/* Main Row */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : test.id)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '48px 1fr 140px 120px 90px 130px',
                      padding: '1rem 1.25rem',
                      gap: '0.75rem',
                      alignItems: 'center',
                      cursor: 'pointer',
                      background: isExpanded ? '#f8fafc' : '#ffffff',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isExpanded) e.currentTarget.style.background = '#f8fafc';
                    }}
                    onMouseLeave={(e) => {
                      if (!isExpanded) e.currentTarget.style.background = '#ffffff';
                    }}
                  >
                    {/* Test ID Badge */}
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        background: '#f1f5f9',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        color: '#475569'
                      }}
                    >
                      {String(test.id).padStart(2, '0')}
                    </div>

                    {/* Test Name & Description */}
                    <div>
                      <div
                        style={{
                          fontWeight: 800,
                          color: '#0f172a',
                          fontSize: '0.92rem',
                          marginBottom: '0.2rem'
                        }}
                      >
                        {test.name}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.4 }}>
                        {test.desc.length > 85 ? test.desc.slice(0, 85) + '…' : test.desc}
                      </div>
                    </div>

                    {/* Role Pill */}
                    <div style={{ fontSize: '0.82rem', color: '#1e293b', fontWeight: 700 }}>
                      <span style={{ marginRight: '0.35rem' }}>{test.icon}</span>
                      <span>{test.role}</span>
                    </div>

                    {/* Category */}
                    <div>
                      <span
                        style={{
                          background: cfg.bg,
                          color: cfg.color,
                          border: `1px solid ${cfg.border}`,
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '0.25rem 0.65rem',
                          borderRadius: '2rem',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {cfg.label}
                      </span>
                    </div>

                    {/* Duration */}
                    <div
                      style={{
                        fontSize: '0.82rem',
                        color: '#2563eb',
                        fontWeight: 700,
                        fontFamily: 'monospace'
                      }}
                    >
                      ⏱ {test.time}
                    </div>

                    {/* Status & Toggle */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span
                        style={{
                          background: '#dcfce7',
                          color: '#15803d',
                          border: '1px solid #86efac',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          padding: '0.25rem 0.65rem',
                          borderRadius: '2rem'
                        }}
                      >
                        ✓ PASS
                      </span>
                      <span style={{ color: '#94a3b8', fontSize: '0.75rem', marginLeft: '0.2rem' }}>
                        {isExpanded ? '▲' : '▼'}
                      </span>
                    </div>
                  </div>

                  {/* Expanded Steps Row */}
                  {isExpanded && (
                    <div
                      style={{
                        background: '#f8fafc',
                        borderTop: '1px solid #e2e8f0',
                        padding: '1.25rem 1.5rem',
                        display: 'grid',
                        gridTemplateColumns: '1.1fr 0.9fr',
                        gap: '1.5rem'
                      }}
                    >
                      {/* Steps */}
                      <div>
                        <div
                          style={{
                            fontSize: '0.78rem',
                            fontWeight: 800,
                            color: '#475569',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            marginBottom: '0.65rem'
                          }}
                        >
                          📋 Execution Checklist ({test.steps.length} Steps)
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                          {test.steps.map((step, i) => (
                            <div
                              key={i}
                              style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '0.6rem',
                                background: '#ffffff',
                                border: '1px solid #e2e8f0',
                                borderRadius: '0.5rem',
                                padding: '0.5rem 0.85rem',
                                fontSize: '0.84rem',
                                color: '#1e293b'
                              }}
                            >
                              <span style={{ color: '#16a34a', fontWeight: 800, flexShrink: 0 }}>✓</span>
                              <span>{step}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Test Summary & Action */}
                      <div>
                        <div
                          style={{
                            fontSize: '0.78rem',
                            fontWeight: 800,
                            color: '#475569',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            marginBottom: '0.65rem'
                          }}
                        >
                          ℹ️ Target Metadata
                        </div>
                        <div
                          style={{
                            background: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '0.65rem',
                            padding: '0.85rem 1rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.5rem',
                            fontSize: '0.83rem'
                          }}
                        >
                          <div>
                            <span style={{ color: '#64748b', fontWeight: 600 }}>Test Account: </span>
                            <span style={{ color: '#0f172a', fontWeight: 700 }}>{test.account}</span>
                          </div>
                          <div>
                            <span style={{ color: '#64748b', fontWeight: 600 }}>Role Category: </span>
                            <span style={{ color: cfg.color, fontWeight: 700 }}>{cfg.label}</span>
                          </div>
                          <div>
                            <span style={{ color: '#64748b', fontWeight: 600 }}>Execution Duration: </span>
                            <span style={{ color: '#2563eb', fontWeight: 700, fontFamily: 'monospace' }}>
                              {test.time}
                            </span>
                          </div>
                          <div>
                            <span style={{ color: '#64748b', fontWeight: 600 }}>Final Verdict: </span>
                            <span style={{ color: '#15803d', fontWeight: 800 }}>✓ PASS — All assertions met</span>
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTest(test);
                          }}
                          style={{
                            marginTop: '1rem',
                            background: '#2563eb',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '0.5rem',
                            padding: '0.5rem 1.15rem',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem'
                          }}
                        >
                          <span>🔍 View Full Modal Details →</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── FOOTER AUDIT SUMMARY ── */}
        <div
          style={{
            marginTop: '2rem',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '1.15rem',
            padding: '1.35rem 1.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.25rem',
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ fontSize: '0.9rem', color: '#475569' }}>
              <span style={{ color: '#64748b' }}>Total Executed: </span>
              <strong style={{ color: '#0f172a' }}>8 Role Tests</strong>
            </div>
            <div style={{ fontSize: '0.9rem', color: '#475569' }}>
              <span style={{ color: '#64748b' }}>Passed: </span>
              <strong style={{ color: '#15803d' }}>8 Tests (100%)</strong>
            </div>
            <div style={{ fontSize: '0.9rem', color: '#475569' }}>
              <span style={{ color: '#64748b' }}>Failures: </span>
              <strong style={{ color: '#dc2626' }}>0</strong>
            </div>
            <div style={{ fontSize: '0.9rem', color: '#475569' }}>
              <span style={{ color: '#64748b' }}>Total Run Time: </span>
              <strong style={{ color: '#2563eb', fontFamily: 'monospace' }}>{totalDuration}s</strong>
            </div>
          </div>

          <div
            style={{
              background: '#dcfce7',
              color: '#15803d',
              border: '1px solid #86efac',
              fontWeight: 800,
              fontSize: '0.88rem',
              padding: '0.45rem 1.25rem',
              borderRadius: '2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem'
            }}
          >
            <span>✓</span>
            <span>ALL SYSTEM TESTS VERIFIED</span>
          </div>
        </div>

      </div>

      {/* ── DETAIL MODAL (CLEAN LIGHT THEME) ── */}
      {selectedTest && (
        <div
          onClick={() => setSelectedTest(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1.5rem'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '1.25rem',
              maxWidth: '740px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.25)',
              border: '1px solid #cbd5e1'
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                background: '#f8fafc',
                borderBottom: '1px solid #e2e8f0',
                borderRadius: '1.25rem 1.25rem 0 0',
                padding: '1.35rem 1.75rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start'
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    color: '#2563eb',
                    textTransform: 'uppercase',
                    letterSpacing: '0.6px',
                    marginBottom: '0.35rem'
                  }}
                >
                  {CATEGORY_CONFIG[selectedTest.category].label} · Test #{String(selectedTest.id).padStart(2, '0')}
                </div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                  {selectedTest.name}
                </h2>
              </div>
              <button
                onClick={() => setSelectedTest(null)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#475569',
                  fontWeight: 700,
                  flexShrink: 0,
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#e2e8f0')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#f1f5f9')}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.75rem' }}>
              {/* Badges Row */}
              <div style={{ display: 'flex', gap: '0.65rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                <span
                  style={{
                    background: '#dcfce7',
                    color: '#15803d',
                    border: '1px solid #86efac',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    padding: '0.3rem 0.9rem',
                    borderRadius: '2rem'
                  }}
                >
                  ✓ Status: PASSED
                </span>
                <span
                  style={{
                    background: '#eff6ff',
                    color: '#1d4ed8',
                    border: '1px solid #bfdbfe',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    padding: '0.3rem 0.9rem',
                    borderRadius: '2rem'
                  }}
                >
                  ⏱ Duration: {selectedTest.time}
                </span>
                <span
                  style={{
                    background: CATEGORY_CONFIG[selectedTest.category].bg,
                    color: CATEGORY_CONFIG[selectedTest.category].color,
                    border: `1px solid ${CATEGORY_CONFIG[selectedTest.category].border}`,
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    padding: '0.3rem 0.9rem',
                    borderRadius: '2rem'
                  }}
                >
                  {selectedTest.icon} {selectedTest.role}
                </span>
              </div>

              {/* Description Box */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.75rem',
                  padding: '1rem 1.25rem',
                  marginBottom: '1.25rem'
                }}
              >
                <div
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '0.35rem'
                  }}
                >
                  Test Objective & Scope
                </div>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#1e293b', lineHeight: 1.6 }}>
                  {selectedTest.desc}
                </p>
              </div>

              {/* Account Box */}
              <div
                style={{
                  fontSize: '0.85rem',
                  color: '#854d0e',
                  marginBottom: '1.35rem',
                  padding: '0.75rem 1.15rem',
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: '0.65rem'
                }}
              >
                <strong>Test Target Account: </strong>
                <span>{selectedTest.account}</span>
              </div>

              {/* Steps Checklist */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    color: '#475569',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '0.75rem'
                  }}
                >
                  📋 Executed Test Steps ({selectedTest.steps.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {selectedTest.steps.map((s, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.75rem',
                        padding: '0.65rem 0.95rem',
                        background: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        borderRadius: '0.5rem',
                        fontSize: '0.86rem',
                        color: '#14532d'
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 900,
                          color: '#16a34a',
                          minWidth: '22px',
                          textAlign: 'center'
                        }}
                      >
                        {i + 1}.
                      </span>
                      <span style={{ fontWeight: 500 }}>{s}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Close Button */}
              <div style={{ textAlign: 'right', marginTop: '1.5rem' }}>
                <button
                  onClick={() => setSelectedTest(null)}
                  style={{
                    background: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '0.5rem',
                    padding: '0.65rem 1.75rem',
                    fontWeight: 800,
                    fontSize: '0.92rem',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)'
                  }}
                >
                  Close Window
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
