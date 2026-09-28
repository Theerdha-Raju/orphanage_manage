import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import GoogleSignInButton from '../components/GoogleSignInButton';
import { requestApi } from '../apiConfig';
import './LoginPage.css';

const roleAccounts = {
  admin: [
    {
      name: 'Alexander Wright',
      designation: 'Principal Administrator',
      email: 'alexander.wright@orphanage.com',
      password: 'Admin@123',
    },
    {
      name: 'Neha Sharma',
      designation: 'Deputy Administrator',
      email: 'neha.sharma@orphanage.com',
      password: 'Admin@123',
    },
    {
      name: 'Ravi Kumar',
      designation: 'Operations Manager',
      email: 'ravi.kumar@orphanage.com',
      password: 'Admin@123',
    },
    {
      name: 'Sonia Mathew',
      designation: 'Finance Administrator',
      email: 'sonia.mathew@orphanage.com',
      password: 'Admin@123',
    },
    {
      name: 'David Thomas',
      designation: 'Program Coordinator',
      email: 'david.thomas@orphanage.com',
      password: 'Admin@123',
    },
  ],
  staff: [
    {
      name: 'Sarah Jenkins',
      designation: 'Caregiver Lead',
      email: 'sarah.jenkins@orphanage.com',
      password: 'Staff@123',
    },
    {
      name: 'Priya Nair',
      designation: 'Senior Caregiver',
      email: 'priya.nair@orphanage.com',
      password: 'Priya@Staff123',
    },
    {
      name: 'Heena Kausar',
      designation: 'Care Coordinator',
      email: 'heena.kausar@orphanage.com',
      password: 'Staff@123',
    },
    {
      name: 'Veena Kumari',
      designation: 'Resident Caregiver',
      email: 'veena.kumari@orphanage.com',
      password: 'Staff@123',
    },
    {
      name: 'Suresh Menon',
      designation: 'Youth Supervisor',
      email: 'suresh.menon@orphanage.com',
      password: 'Staff@123',
    },
  ],
  donor: [
    {
      name: 'Eleanor Vance',
      designation: 'Benefactor Sponsor',
      email: 'eleanor.vance@orphanage.com',
      password: 'Donor@123',
    },
    {
      name: 'Rajesh Mehta',
      designation: 'Mehta Family Foundation',
      email: 'rajesh.mehta@mehta-foundation.org',
      password: 'Donor@123',
    },
    {
      name: 'TechCorp CSR',
      designation: 'TechCorp Inc. CSR Initiative',
      email: 'techcorp.csr@techcorp.com',
      password: 'Donor@123',
    },
    {
      name: 'Anita Desai',
      designation: 'Anita Desai & Friends',
      email: 'anita.desai@gmail.com',
      password: 'Donor@123',
    },
    {
      name: 'Dr. K. S. Malhotra',
      designation: 'HealthPlus Healthcare Partner',
      email: 'dr.malhotra@healthplus.in',
      password: 'Donor@123',
    },
    {
      name: 'Sunita Kapoor',
      designation: 'Sunita Kapoor Welfare Trust',
      email: 'sunita.kapoor@trust.org',
      password: 'Donor@123',
    },
  ],
  volunteer: [
    {
      name: 'Rahul Singh',
      designation: 'Lead Volunteer Coordinator',
      email: 'rahul.singh@orphanage.com',
      password: 'Volunteer@123',
    },
    {
      name: 'Anita Desai',
      designation: 'Community Youth Mentor',
      email: 'anita.desai@yahoo.com',
      password: 'Vol@123',
    },
    {
      name: 'Vikram Patel',
      designation: 'Weekend Academic Tutor',
      email: 'vikram.patel@outlook.com',
      password: 'Vikram@Vol123',
    },
    {
      name: 'Priya Verma',
      designation: 'Arts & Activities Specialist',
      email: 'priya.verma@gmail.com',
      password: 'Vol@123',
    },
    {
      name: 'Siddharth Roy',
      designation: 'Sports & Fitness Coach',
      email: 'siddharth.roy@gmail.com',
      password: 'Siddharth@Vol123',
    },
    {
      name: 'Deepa S',
      designation: 'Field Volunteer',
      email: 'deepa.s@orphanage.com',
      password: 'Deepa@Vol123',
    },
  ],
  child: [
    {
      name: 'Leo Carter',
      designation: 'Senior Student (Grade 10)',
      email: 'leo.carter@student.org',
      password: 'Student@123',
    },
    {
      name: 'Aarav Sharma',
      designation: 'Student (Grade 8)',
      email: 'aarav.sharma@student.org',
      password: 'Student@123',
    },
    {
      name: 'Ananya Patel',
      designation: 'Student (Grade 7)',
      email: 'ananya.patel@student.org',
      password: 'Student@123',
    },
    {
      name: 'Rohan Verma',
      designation: 'Student (Grade 9)',
      email: 'rohan.verma@student.org',
      password: 'Student@123',
    },
    {
      name: 'Diya Iyer',
      designation: 'Student (Grade 6)',
      email: 'diya.iyer@student.org',
      password: 'Student@123',
    },
    {
      name: 'Kabir Singh',
      designation: 'Student (Grade 10)',
      email: 'kabir.singh@student.org',
      password: 'Student@123',
    },
  ],
};

const roles = [
  { value: 'admin',     label: 'Administrator',   icon: 'bi-shield-lock-fill',   color: '#2563eb', email: 'alexander.wright@orphanage.com', password: 'Admin@123',     name: 'Alexander Wright' },
  { value: 'staff',     label: 'Caregiver',       icon: 'bi-person-workspace',   color: '#10b981', email: 'sarah.jenkins@orphanage.com',   password: 'Staff@123',     name: 'Sarah Jenkins'   },
  { value: 'donor',     label: 'Donor',           icon: 'bi-heart-fill',         color: '#f59e0b', email: 'eleanor.vance@orphanage.com',   password: 'Donor@123',     name: 'Eleanor Vance'   },
  { value: 'volunteer', label: 'Volunteer',       icon: 'bi-people-fill',        color: '#8b5cf6', email: 'rahul.singh@orphanage.com',     password: 'Volunteer@123', name: 'Rahul Singh'     },
  { value: 'child',     label: 'Student',         icon: 'bi-star-fill',          color: '#06b6d4', email: 'leo.carter@student.org',        password: 'Student@123',   name: 'Leo Carter'      },
];

export default function LoginPage() {
  const [role, setRole]         = useState('admin');
  const [email, setEmail]       = useState('alexander.wright@orphanage.com');
  const [password, setPassword] = useState('Admin@123');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPwd, setShowPwd]   = useState(false);
  const [showEmailDropdown, setShowEmailDropdown] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const emailDropdownRef        = useRef(null);
  const navigate  = useNavigate();
  const location  = useLocation();

  const currentRoleObj = roles.find(r => r.value === role) || roles[0];
  const currentRoleAccounts = roleAccounts[role] || [];
  const selectedAccount = currentRoleAccounts.find(a => a.email.toLowerCase() === email.toLowerCase());

  // Close dropdown on outside click — use pointerdown so it fires BEFORE
  // the submit button's click/mouseup, preventing the dropdown from intercepting it
  useEffect(() => {
    function handleClickOutside(event) {
      if (emailDropdownRef.current && !emailDropdownRef.current.contains(event.target)) {
        setShowEmailDropdown(false);
      }
    }
    document.addEventListener('pointerdown', handleClickOutside);
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, []);

  const handleSelectRole = (r) => {
    setRole(r.value);
    const primaryAcc = (roleAccounts[r.value] && roleAccounts[r.value][0]) || { email: r.email, password: r.password };
    setEmail(primaryAcc.email);
    setPassword(primaryAcc.password);
    setShowEmailDropdown(false);
    setError('');
  };

  const handleSelectAccount = (acc) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setShowEmailDropdown(false);
    setError('');
  };


  // Already logged-in? Send to their dashboard immediately.
  const existingRole = localStorage.getItem('userRole');
  const existingId   = localStorage.getItem('userId');
  if (existingRole && existingId) {
    const roleHome = {
      admin:     '/admin-dashboard',
      staff:     '/staff-dashboard',
      teacher:   '/staff-dashboard',
      doctor:    '/staff-dashboard',
      donor:     '/donor-dashboard',
      volunteer: '/volunteer-dashboard',
      child:     '/child-dashboard',
    };
    return <Navigate to={roleHome[existingRole] || '/staff-dashboard'} replace />;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setShowEmailDropdown(false); // always close dropdown before submitting
    setLoading(true);
    setError('');

    // Use entered credentials or fall back to preset account/role credentials
    const effectiveEmail = (email || selectedAccount?.email || currentRoleObj?.email || 'admin@orphanage.com').trim();
    const effectivePassword = (password || selectedAccount?.password || currentRoleObj?.password || 'Admin@123').trim();

    try {
      const res  = await requestApi('/api/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: effectiveEmail, password: effectivePassword, role }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        localStorage.setItem('userRole',        data.role);
        localStorage.setItem('userDesignation', data.designation || (data.role === 'staff' ? 'Caregiver' : data.role));
        localStorage.setItem('userId',          data.user_id);
        localStorage.setItem('userName',        data.name);
        localStorage.setItem('userEmail',       data.email || effectiveEmail);

        if (window.PasswordCredential) {
          try {
            const cred = new window.PasswordCredential({ id: email, password });
            await navigator.credentials.store(cred);
          } catch (_) { /* browser fallback */ }
        }

        setTimeout(() => {
          setLoading(false);
          const from = location.state?.from?.pathname;
          const routes = {
            admin: '/admin-dashboard',
            staff: '/staff-dashboard',
            teacher: '/staff-dashboard',
            doctor: '/staff-dashboard',
            donor: '/donor-dashboard',
            volunteer: '/volunteer-dashboard',
            child: '/child-dashboard',
          };
          const defaultRoute = routes[data.role] || '/staff-dashboard';
          navigate(from || defaultRoute, { replace: true });
        }, 600);
      } else {
        setError(data.error || 'Invalid email or password.');
        setLoading(false);
      }
    } catch {
      setError('Unable to connect to server. Please ensure the backend is running.');
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (googleData) => {
    setLoading(true);
    setError('');

    try {
      const res = await requestApi('/api/auth/google/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credential: googleData.credential,
          email: googleData.email,
          name: googleData.name,
          role: role
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        localStorage.setItem('userRole',  data.role);
        localStorage.setItem('userId',    data.user_id);
        localStorage.setItem('userName',  data.name);
        localStorage.setItem('userEmail', data.email);

        setTimeout(() => {
          setLoading(false);
          const from = location.state?.from?.pathname;
          const routes = {
            admin: '/admin-dashboard', staff: '/staff-dashboard',
            donor: '/donor-dashboard', volunteer: '/volunteer-dashboard',
          };
          const defaultRoute = routes[data.role] || '/child-dashboard';
          navigate(from || defaultRoute, { replace: true });
        }, 600);
      } else {
        setError(data.error || 'Google login failed.');
        setLoading(false);
      }
    } catch {
      setError('Unable to connect to server for Google login.');
      setLoading(false);
    }
  };

  return (
    <div className="orphanage-auth-wrapper">
      {/* ──────────────── Left Visual Branding Pane ──────────────── */}
      <div
        className="orphanage-left-pane"
        style={{ backgroundImage: `url('/orphanage_figma_bg.jpg')` }}
      >
        <div className="orphanage-left-overlay" />
        <div className="orphanage-orb orphanage-orb-1" />
        <div className="orphanage-orb orphanage-orb-2" />


        {/* 1. Top Bar with Live Telemetry / Care Status Pills */}
        <div className="orphanage-top-bar">
          <div className="orphanage-telemetry-pills">
            <div className="orphanage-pill">
              <i className="bi bi-people-fill" style={{ color: '#60a5fa' }} />
              <span>500+ Children</span>
            </div>
            <div className="orphanage-pill">
              <i className="bi bi-heart-pulse-fill" style={{ color: '#f87171' }} />
              <span>98% Health Index</span>
            </div>
            <div className="orphanage-pill">
              <i className="bi bi-mortarboard-fill" style={{ color: '#4ade80' }} />
              <span>94% Academic</span>
            </div>
          </div>

          <div className="orphanage-live-badge">
            <span className="orphanage-live-dot" />
            Shelter Active
          </div>
        </div>

        {/* 2. Middle 3 Floating Glassmorphic Cards */}
        <div className="orphanage-cards-grid">
          {/* Card 1: Academic & Skills Progress */}
          <div className="orphanage-glass-card">
            <div className="orphanage-card-label">
              <span>Academic Score</span>
              <i className="bi bi-graph-up-arrow" style={{ color: '#60a5fa' }} />
            </div>
            <div className="orphanage-gauge-wrapper">
              <svg width="74" height="74" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#e2e8f0"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="url(#blueVioletGrad)"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray="251.2"
                  strokeDashoffset="35"
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
                <defs>
                  <linearGradient id="blueVioletGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#2563eb" />
                    <stop offset="100%" stopColor="#60a5fa" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="orphanage-gauge-val">94%</div>
            </div>
            <div className="orphanage-card-sub">
              <span style={{ color: '#4ade80', fontWeight: 700 }}>● Optimal</span>
              <span>• 120 Enrolled</span>
            </div>
          </div>

          {/* Card 2: Essential Rations & Supplies */}
          <div className="orphanage-glass-card">
            <div className="orphanage-card-label">
              <span>Monthly Rations</span>
              <i className="bi bi-box-seam" style={{ color: '#fbbf24' }} />
            </div>
            <div className="orphanage-low-badge">LOW</div>
            <div className="orphanage-sparkline">
              <div className="orphanage-sparkline-bar" style={{ height: '70%' }} />
              <div className="orphanage-sparkline-bar" style={{ height: '85%' }} />
              <div className="orphanage-sparkline-bar" style={{ height: '60%' }} />
              <div className="orphanage-sparkline-bar" style={{ height: '45%', background: '#fbbf24' }} />
              <div className="orphanage-sparkline-bar" style={{ height: '30%', background: '#f87171' }} />
              <div className="orphanage-sparkline-bar" style={{ height: '22%', background: '#ef4444' }} />
            </div>
            <div className="orphanage-card-sub">
              <i className="bi bi-clock-history" style={{ color: '#fbbf24', fontSize: '0.65rem' }} />
              <span>Restock in 2 days</span>
            </div>
          </div>

          {/* Card 3: Healthcare & Wellness Monitoring */}
          <div className="orphanage-glass-card">
            <div className="orphanage-card-label">
              <span>Health Tracking</span>
              <i className="bi bi-shield-plus" style={{ color: '#4ade80' }} />
            </div>
            <div className="orphanage-active-badge">
              <i className="bi bi-check-circle-fill" /> Active
            </div>
            <div className="orphanage-dot-meter">
              <div className="orphanage-meter-dot on" />
              <div className="orphanage-meter-dot on" />
              <div className="orphanage-meter-dot on" />
              <div className="orphanage-meter-dot on" />
              <div className="orphanage-meter-dot green" />
            </div>
            <div className="orphanage-card-sub">
              <i className="bi bi-shield-check" style={{ fontSize: '0.65rem', color: '#4ade80' }} />
              <span>0 Critical Cases</span>
            </div>
          </div>
        </div>

        {/* 3. Bottom Hero Branding */}
        <div className="orphanage-bottom-meta">
          <div className="orphanage-feature-row">
            <div className="orphanage-feature-item">
              <i className="bi bi-stars" />
              <span>AI Health & Growth Tracking</span>
            </div>
            <div className="orphanage-feature-item">
              <i className="bi bi-heart-fill" />
              <span>Verified Donors & Sponsors</span>
            </div>
            <div className="orphanage-feature-item">
              <i className="bi bi-mortarboard-fill" />
              <span>Academic Mentorship</span>
            </div>
          </div>

          <h1 className="orphanage-hero-title">Welcome to HopeNest</h1>
          <p className="orphanage-hero-desc">
            Empowering every child with personalized care, education, healthcare tracking, and community support.
          </p>
        </div>
      </div>

      {/* ──────────────── Right Login Form Pane ──────────────── */}
      <div className="orphanage-right-pane">
        <div className="orphanage-login-card">
          {/* Header with App Logo */}
          <div className="orphanage-card-header">
            <Link to="/" style={{ textDecoration: 'none' }}>
              <div className="orphanage-brand-badge">
                <div className="orphanage-brand-icon">
                  <i className="bi bi-house-heart-fill" />
                </div>
                <span>HopeNest</span>
              </div>
            </Link>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
              <i className="bi bi-patch-check-fill text-primary me-1" />Portal v2.4
            </span>
          </div>

          {/* Central Login Avatar Badge */}
          <div className="orphanage-login-avatar-wrap">
            <div className="orphanage-avatar-box">
              <i className="bi bi-shield-lock-fill" />
            </div>
            <h2 className="orphanage-title">Login</h2>
            <p className="orphanage-subtitle">
              Sign in with your credentials to access the child management portal.
            </p>
          </div>

          {/* Role Preset Selector */}
          <div className="orphanage-role-selector">
            {roles.map(r => (
              <button
                key={r.value}
                type="button"
                className={`orphanage-role-btn ${role === r.value ? 'active' : ''}`}
                onClick={() => handleSelectRole(r)}
              >
                <i className={`bi ${r.icon}`} style={{ color: role === r.value ? r.color : '#94a3b8' }} />
                {r.label.split('/')[0]}
              </button>
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              padding: '0.65rem 0.9rem',
              borderRadius: '0.75rem',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem'
            }}>
              <i className="bi bi-exclamation-octagon-fill" />
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} autoComplete="on">
            <div className="orphanage-form-group" ref={emailDropdownRef}>
              <label className="orphanage-form-label" htmlFor="login-email-input">
                Email Address
              </label>

              <div className="orphanage-input-wrapper">
                <i className="bi bi-envelope orphanage-input-icon" />
                <input
                  id="login-email-input"
                  type="email"
                  name="email"
                  autoComplete="username"
                  className="orphanage-input"
                  placeholder={`Select or type ${currentRoleObj.label.split('/')[0]} email`}
                  value={email}
                  onChange={e => {
                    const val = e.target.value;
                    setEmail(val);
                    setError('');
                    let match = currentRoleAccounts.find(a => a.email.toLowerCase() === val.toLowerCase());
                    if (!match) {
                      for (const [rKey, accs] of Object.entries(roleAccounts)) {
                        const m = accs.find(a => a.email.toLowerCase() === val.toLowerCase());
                        if (m) {
                          match = m;
                          setRole(rKey);
                          break;
                        }
                      }
                    }
                    if (match) {
                      setPassword(match.password);
                    }
                  }}
                  onClick={() => setShowEmailDropdown(true)}
                  required
                />
                <button
                  type="button"
                  id="email-dropdown-toggle-btn"
                  className={`orphanage-dropdown-toggle-btn ${showEmailDropdown ? 'open' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowEmailDropdown(!showEmailDropdown);
                  }}
                  title={`View at least 5 email addresses of ${currentRoleObj.label.split('/')[0]}`}
                  aria-label="Toggle profile email list"
                >
                  <i className="bi bi-chevron-down" />
                </button>

                {/* Dropdown Menu showing all 5+ accounts for selected role */}
                {showEmailDropdown && (
                  <div className="orphanage-accounts-dropdown" id="preset-accounts-dropdown">
                    <div className="orphanage-dropdown-header">
                      <div className="orphanage-dropdown-header-title">
                        <i className={`bi ${currentRoleObj.icon}`} style={{ color: currentRoleObj.color }} />
                        <span>Select {currentRoleObj.label.split('/')[0]} Email</span>
                      </div>
                      <span className="orphanage-dropdown-header-count">
                        {currentRoleAccounts.length} Available
                      </span>
                    </div>

                    <div className="orphanage-dropdown-scroll">
                      {currentRoleAccounts.map((acc, idx) => {
                        const isSelected = acc.email.toLowerCase() === email.toLowerCase();
                        return (
                          <div
                            key={acc.email}
                            id={`account-option-${idx}`}
                            className={`orphanage-dropdown-item ${isSelected ? 'active' : ''}`}
                            onClick={() => handleSelectAccount(acc)}
                          >
                            <div
                              className="orphanage-acc-avatar"
                              style={{
                                background: `${currentRoleObj.color}15`,
                                color: currentRoleObj.color,
                                border: `1.5px solid ${currentRoleObj.color}35`,
                              }}
                            >
                              {acc.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                            </div>
                            <div className="orphanage-acc-details">
                              <div className="orphanage-acc-row">
                                <span className="orphanage-acc-name">{acc.name}</span>
                                <span className="orphanage-acc-designation">{acc.designation}</span>
                              </div>
                              <div className="orphanage-acc-email-text">{acc.email}</div>
                            </div>
                            <div className="orphanage-acc-action">
                              {isSelected ? (
                                <i className="bi bi-check-circle-fill text-primary" style={{ fontSize: '1.1rem' }} />
                              ) : (
                                <i className="bi bi-arrow-right-short text-muted orphanage-acc-select-hint" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="orphanage-dropdown-footer">
                      <i className="bi bi-shield-check text-success me-1" />
                      Auto-fills password &amp; credentials for one-click login
                    </div>
                  </div>
                )}
              </div>

              {/* Active Profile Info Banner */}
              {selectedAccount && (
                <div className="orphanage-selected-profile-pill">
                  <div className="orphanage-selected-profile-left">
                    <i className="bi bi-person-check-fill" style={{ color: currentRoleObj.color }} />
                    <span className="orphanage-selected-name">{selectedAccount.name}</span>
                    <span className="orphanage-selected-sep">•</span>
                    <span className="orphanage-selected-des">{selectedAccount.designation}</span>
                  </div>
                  <button
                    type="button"
                    className="orphanage-change-profile-btn"
                    onClick={() => setShowEmailDropdown(!showEmailDropdown)}
                  >
                    Change profile <i className="bi bi-chevron-down ms-1" />
                  </button>
                </div>
              )}
            </div>

            <div className="orphanage-form-group">
              <label className="orphanage-form-label">Password</label>
              <div className="orphanage-input-wrapper">
                <i className="bi bi-lock orphanage-input-icon" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  className="orphanage-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="orphanage-eye-btn"
                  onClick={() => setShowPwd(!showPwd)}
                  aria-label="Toggle password visibility"
                >
                  <i className={`bi ${showPwd ? 'bi-eye-slash' : 'bi-eye'}`} />
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="orphanage-options-row">
              <label className="orphanage-checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="orphanage-checkbox"
                />
                Remember me
              </label>
              <Link to="/forgot-password" className="orphanage-forgot-link">
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="orphanage-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Login to Dashboard</span>
                  <i className="bi bi-arrow-right" />
                </>
              )}
            </button>
          </form>

          {/* Social Divider */}
          <div className="orphanage-divider">
            <div className="orphanage-divider-line" />
            <span className="orphanage-divider-text">Or continue with</span>
            <div className="orphanage-divider-line" />
          </div>

          {/* Google Sign In Button */}
          <GoogleSignInButton
            onSuccess={handleGoogleSuccess}
            onError={(err) => setError(err)}
            role={role}
            disabled={loading}
          />

          {/* Register Link */}
          <div className="orphanage-footer-text">
            <span>Don't have an account?</span>
            <Link to="/register" className="orphanage-register-link">
              Create an account
            </Link>
          </div>

          <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
            <Link to="/" className="orphanage-home-link">
              <i className="bi bi-arrow-left" />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
