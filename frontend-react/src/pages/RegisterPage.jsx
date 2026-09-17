import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import GoogleSignInButton from '../components/GoogleSignInButton';
import { requestApi } from '../apiConfig';
import './RegisterPage.css';

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    gender: 'Male',
    address: '',
    role: 'volunteer',
    password: '',
    confirm: '',
    agreeTerms: false,
  });

  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const navigate = useNavigate();

  const setField = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    if (error) setError('');
  };

  const handleBlur = (field) => {
    setTouched(t => ({ ...t, [field]: true }));
  };

  // Validation functions
  const validateName = (name) => {
    if (!name.trim()) return 'Full name is required';
    if (name.trim().length < 2) return 'Name must be at least 2 characters';
    if (!/^[A-Za-z\s.'-]+$/.test(name.trim())) return 'Name can only contain letters and spaces';
    return '';
  };

  const validateEmail = (email) => {
    if (!email.trim()) return 'Email address is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) return 'Please enter a valid email address';
    return '';
  };

  const validatePhone = (phone) => {
    if (!phone.trim()) return 'Phone number is required';
    const digitsOnly = phone.replace(/[^0-9]/g, '');
    if (digitsOnly.length < 10 || digitsOnly.length > 15) return 'Enter a valid 10-digit phone number';
    return '';
  };

  const validatePassword = (pwd) => {
    if (!pwd) return 'Password is required';
    if (pwd.length < 8) return 'Password must be at least 8 characters';
    return '';
  };

  const validateConfirm = (confirm, pwd) => {
    if (!confirm) return 'Please confirm your password';
    if (confirm !== pwd) return 'Passwords do not match';
    return '';
  };

  const validateTerms = (agree) => {
    if (!agree) return 'You must agree to the Terms of Service and Privacy Policy';
    return '';
  };

  // Field error evaluators
  const nameError = validateName(form.name);
  const emailError = validateEmail(form.email);
  const phoneError = validatePhone(form.phone);
  const passwordError = validatePassword(form.password);
  const confirmError = validateConfirm(form.confirm, form.password);
  const termsError = validateTerms(form.agreeTerms);

  // Password strength calculator
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: '', class: '' };
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 1) return { score: 1, label: 'Weak', class: 'weak' };
    if (score <= 3) return { score: 2, label: 'Medium', class: 'medium' };
    return { score: 3, label: 'Strong', class: 'strong' };
  };

  const pwdStrength = getPasswordStrength(form.password);

  // Google OAuth Success Handler
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
          role: form.role,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        localStorage.setItem('userRole', data.role);
        localStorage.setItem('userId', data.user_id);
        localStorage.setItem('userName', data.name);
        localStorage.setItem('userEmail', data.email);

        setSuccess('Google Registration Successful! Redirecting...');
        setTimeout(() => {
          setLoading(false);
          const routes = {
            admin: '/admin-dashboard',
            staff: '/staff-dashboard',
            donor: '/donor-dashboard',
            volunteer: '/volunteer-dashboard',
          };
          navigate(routes[data.role] || '/child-dashboard');
        }, 700);
      } else {
        setError(data.error || 'Google registration failed.');
        setLoading(false);
      }
    } catch {
      setError('Unable to connect to server for Google registration.');
      setLoading(false);
    }
  };

  // Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({
      name: true,
      email: true,
      phone: true,
      password: true,
      confirm: true,
      agreeTerms: true,
    });

    if (nameError || emailError || phoneError || passwordError || confirmError || termsError) {
      setError('Please resolve all validation errors before submitting.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await requestApi('/api/auth/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          gender: form.gender,
          address: form.address.trim(),
          role: form.role,
          password: form.password,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Automatically save account details
        localStorage.setItem('userRole', data.role);
        localStorage.setItem('userId', data.user_id);
        localStorage.setItem('userName', data.name);
        localStorage.setItem('userEmail', data.email);

        if (window.PasswordCredential) {
          try {
            const cred = new window.PasswordCredential({
              id: data.email,
              password: form.password,
              name: data.name
            });
            await navigator.credentials.store(cred);
          } catch (_) { /* credential API fallback */ }
        }

        setSuccess('Account created and saved! Logging you in automatically...');

        setTimeout(() => {
          setLoading(false);
          const routes = {
            admin: '/admin-dashboard',
            staff: '/staff-dashboard',
            donor: '/donor-dashboard',
            volunteer: '/volunteer-dashboard',
          };
          navigate(routes[data.role] || '/staff-dashboard');
        }, 1200);
      } else {

        setError(data.error || 'Registration failed. Please check your details and try again.');
      }
    } catch {
      setError('Unable to connect to server. Please verify your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { value: 'staff', label: 'Caregiver/Staff', icon: 'bi-person-workspace' },
    { value: 'donor', label: 'Donor/Sponsor', icon: 'bi-heart-fill' },
    { value: 'volunteer', label: 'Volunteer', icon: 'bi-people-fill' },
  ];

  return (
    <div className="reg-page-container">
      {/* Left Pane - Hero & Stats */}
      <div className="reg-left-pane">
        <div className="reg-left-orb reg-left-orb-1" />
        <div className="reg-left-orb reg-left-orb-2" />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <Link to="/" className="reg-brand-logo">
            <div className="reg-brand-icon">
              <i className="bi bi-house-heart-fill" />
            </div>
            <span className="reg-brand-title">Orphanage Management</span>
          </Link>

          <h2 className="reg-hero-heading">
            Empowering lives, <br /> one child at a time.
          </h2>

          {/* Stats Grid */}
          <div className="reg-stats-grid">
            {[
              { label: 'Active Children', value: '500+', icon: 'bi-people-fill', color: '#60a5fa' },
              { label: 'Verified Staff', value: '120+', icon: 'bi-person-badge', color: '#4ade80' },
              { label: 'Donors', value: '300+', icon: 'bi-heart-fill', color: '#fb7185' },
              { label: 'Volunteers', value: '150+', icon: 'bi-star-fill', color: '#fbbf24' },
            ].map((stat, i) => (
              <div key={i} className="reg-stat-card">
                <i className={`bi ${stat.icon} reg-stat-icon`} style={{ color: stat.color }} />
                <div>
                  <div className="reg-stat-val">{stat.value}</div>
                  <div className="reg-stat-lbl">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Feature Highlights */}
          <div className="reg-features-grid">
            {[
              { icon: 'bi-person-heart', color: '#60a5fa', bg: 'rgba(96,165,250,0.15)', title: 'Child Profiles', desc: 'Full history & records' },
              { icon: 'bi-heart-pulse-fill', color: '#4ade80', bg: 'rgba(74,222,128,0.15)', title: 'Health Tracking', desc: 'BMI, checkups & alerts' },
              { icon: 'bi-journal-bookmark-fill', color: '#a78bfa', bg: 'rgba(167,139,250,0.15)', title: 'Academics', desc: 'Marks, grades & reports' },
              { icon: 'bi-cpu-fill', color: '#fb7185', bg: 'rgba(251,113,133,0.15)', title: 'AI Predictions', desc: 'ML-powered risk analysis' },
              { icon: 'bi-gift-fill', color: '#fbbf24', bg: 'rgba(251,191,36,0.15)', title: 'Donations', desc: 'Receipts & audit logs' },
              { icon: 'bi-bell-fill', color: '#22d3ee', bg: 'rgba(34,211,238,0.15)', title: 'Smart Alerts', desc: 'Proactive notifications' },
            ].map(f => (
              <div key={f.title} className="reg-feature-card">
                <div className="reg-feature-badge" style={{ background: f.bg }}>
                  <i className={`bi ${f.icon}`} style={{ color: f.color }} />
                </div>
                <div>
                  <div className="reg-feature-title">{f.title}</div>
                  <div className="reg-feature-desc">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonial Quote */}
        <div style={{ background: 'rgba(255,255,255,0.06)', padding: '1.25rem 1.5rem', borderRadius: '16px', marginTop: '1.5rem', border: '1px solid rgba(255,255,255,0.08)' }}>
          <i className="bi bi-quote" style={{ fontSize: '1.4rem', color: '#60a5fa' }} />
          <p style={{ color: '#e2e8f0', fontSize: '0.85rem', fontStyle: 'italic', margin: '0.3rem 0 0.8rem 0', lineHeight: 1.4 }}>
            "This platform transformed how we track health and education. It’s been a game changer for our children."
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.75rem' }}>
              SJ
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>Sarah Jenkins</div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Lead Caregiver</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Pane - Form */}
      <div className="reg-right-pane">
        <div className="reg-card">
          <div className="reg-header">
            <h1 className="reg-title">Create Account</h1>
            <p className="reg-subtitle">Join HopeNest Orphanage Management as a staff member, donor, or volunteer.</p>
          </div>

          {error && (
            <div className="reg-alert reg-alert-error">
              <i className="bi bi-exclamation-triangle-fill" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="reg-alert reg-alert-success">
              <i className="bi bi-check-circle-fill" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Role Selection */}
            <div className="reg-form-group">
              <span className="reg-role-label">I am joining as a:</span>
              <div className="reg-role-grid">
                {roles.map(r => (
                  <button
                    key={r.value}
                    type="button"
                    className={`reg-role-btn ${form.role === r.value ? 'active' : ''}`}
                    onClick={() => setField('role', r.value)}
                  >
                    <i className={`bi ${r.icon}`} />
                    <span>{r.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Full Name */}
            <div className="reg-form-group">
              <div className="reg-input-label">
                <span>Full Name *</span>
              </div>
              <div className="reg-input-wrapper">
                <i className="bi bi-person reg-input-icon" />
                <input
                  type="text"
                  className={`reg-input ${touched.name && nameError ? 'error-border' : touched.name && !nameError ? 'success-border' : ''}`}
                  placeholder="e.g. Eleanor Vance"
                  value={form.name}
                  onChange={e => setField('name', e.target.value)}
                  onBlur={() => handleBlur('name')}
                />
              </div>
              {touched.name && nameError && (
                <div className="reg-field-error">
                  <i className="bi bi-x-circle" /> {nameError}
                </div>
              )}
            </div>

            {/* Email Address */}
            <div className="reg-form-group">
              <div className="reg-input-label">
                <span>Email Address *</span>
              </div>
              <div className="reg-input-wrapper">
                <i className="bi bi-envelope reg-input-icon" />
                <input
                  type="email"
                  className={`reg-input ${touched.email && emailError ? 'error-border' : touched.email && !emailError ? 'success-border' : ''}`}
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={e => setField('email', e.target.value)}
                  onBlur={() => handleBlur('email')}
                />
              </div>
              {touched.email && emailError && (
                <div className="reg-field-error">
                  <i className="bi bi-x-circle" /> {emailError}
                </div>
              )}
            </div>

            {/* Phone Number & Gender */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <div className="reg-form-group">
                <div className="reg-input-label">
                  <span>Phone Number *</span>
                </div>
                <div className="reg-input-wrapper">
                  <i className="bi bi-telephone reg-input-icon" />
                  <input
                    type="tel"
                    className={`reg-input ${touched.phone && phoneError ? 'error-border' : touched.phone && !phoneError ? 'success-border' : ''}`}
                    placeholder="+91 98765 43210"
                    value={form.phone}
                    onChange={e => setField('phone', e.target.value)}
                    onBlur={() => handleBlur('phone')}
                  />
                </div>
                {touched.phone && phoneError && (
                  <div className="reg-field-error">
                    <i className="bi bi-x-circle" /> {phoneError}
                  </div>
                )}
              </div>

              <div className="reg-form-group">
                <div className="reg-input-label">
                  <span>Gender *</span>
                </div>
                <div className="reg-gender-options">
                  {['Male', 'Female', 'Other'].map(g => (
                    <button
                      key={g}
                      type="button"
                      className={`reg-gender-btn ${form.gender === g ? 'active' : ''}`}
                      onClick={() => setField('gender', g)}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="reg-form-group">
              <div className="reg-input-label">
                <span>Address / Location</span>
              </div>
              <div className="reg-input-wrapper">
                <i className="bi bi-geo-alt reg-input-icon" />
                <input
                  type="text"
                  className="reg-input"
                  placeholder="City, State / Address"
                  value={form.address}
                  onChange={e => setField('address', e.target.value)}
                />
              </div>
            </div>

            {/* Password & Confirm Password */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <div className="reg-form-group">
                <div className="reg-input-label">
                  <span>Password *</span>
                </div>
                <div className="reg-input-wrapper">
                  <i className="bi bi-lock reg-input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className={`reg-input ${touched.password && passwordError ? 'error-border' : touched.password && !passwordError ? 'success-border' : ''}`}
                    placeholder="Min. 8 characters"
                    value={form.password}
                    onChange={e => setField('password', e.target.value)}
                    onBlur={() => handleBlur('password')}
                  />
                  <button
                    type="button"
                    className="reg-toggle-pwd"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                  >
                    <i className={`bi ${showPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`} />
                  </button>
                </div>
                {touched.password && passwordError && (
                  <div className="reg-field-error">
                    <i className="bi bi-x-circle" /> {passwordError}
                  </div>
                )}
              </div>

              <div className="reg-form-group">
                <div className="reg-input-label">
                  <span>Confirm Password *</span>
                </div>
                <div className="reg-input-wrapper">
                  <i className="bi bi-shield-lock reg-input-icon" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    className={`reg-input ${touched.confirm && confirmError ? 'error-border' : touched.confirm && !confirmError ? 'success-border' : ''}`}
                    placeholder="Re-enter password"
                    value={form.confirm}
                    onChange={e => setField('confirm', e.target.value)}
                    onBlur={() => handleBlur('confirm')}
                  />
                  <button
                    type="button"
                    className="reg-toggle-pwd"
                    onClick={() => setShowConfirm(!showConfirm)}
                    tabIndex="-1"
                  >
                    <i className={`bi ${showConfirm ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`} />
                  </button>
                </div>
                {touched.confirm && confirmError && (
                  <div className="reg-field-error">
                    <i className="bi bi-x-circle" /> {confirmError}
                  </div>
                )}
              </div>
            </div>

            {/* Password Strength Indicator */}
            {form.password && (
              <div className="reg-pwd-strength-container">
                <div className="reg-pwd-bars">
                  <div className={`reg-pwd-bar ${pwdStrength.score >= 1 ? pwdStrength.class : ''}`} />
                  <div className={`reg-pwd-bar ${pwdStrength.score >= 2 ? pwdStrength.class : ''}`} />
                  <div className={`reg-pwd-bar ${pwdStrength.score >= 3 ? pwdStrength.class : ''}`} />
                </div>
                <div className="reg-pwd-label">
                  <span>Password Strength:</span>
                  <span style={{ fontWeight: 700, textTransform: 'capitalize' }}>{pwdStrength.label}</span>
                </div>
              </div>
            )}

            {/* Terms and Conditions Checkbox */}
            <div className="reg-terms-group">
              <input
                type="checkbox"
                id="agreeTerms"
                className="reg-checkbox"
                checked={form.agreeTerms}
                onChange={e => setField('agreeTerms', e.target.checked)}
              />
              <label htmlFor="agreeTerms" className="reg-terms-text">
                I agree to the <Link to="/terms">Terms of Service</Link> and <Link to="/privacy">Privacy Policy</Link>.
              </label>
            </div>
            {touched.agreeTerms && termsError && (
              <div className="reg-field-error" style={{ marginTop: '-0.8rem', marginBottom: '1rem' }}>
                <i className="bi bi-x-circle" /> {termsError}
              </div>
            )}

            {/* Submit Button */}
            <button type="submit" className="reg-submit-btn" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                  Creating Account...
                </>
              ) : (
                <>
                  <i className="bi bi-person-plus-fill" /> Create Account
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0 1.25rem 0', gap: '0.75rem' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.12)' }} />
            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b' }}>
              Or sign up with
            </span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.12)' }} />
          </div>

          {/* Google OAuth Button */}
          <GoogleSignInButton
            onSuccess={handleGoogleSuccess}
            onError={err => setError(err)}
            role={form.role}
            text="signup_with"
            disabled={loading}
          />

          <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.1)', margin: '1.5rem 0 1rem 0' }} />

          <p style={{ textAlign: 'center', fontSize: '0.85rem', color: '#94a3b8' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#60a5fa', fontWeight: 600, textDecoration: 'none' }}>
              Sign in here &rarr;
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
