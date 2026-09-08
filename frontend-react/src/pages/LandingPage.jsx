import React from 'react';
import { Link } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Legend, Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const features = [
  { icon: 'bi-person-heart',         color: 'var(--accent)',  bg: 'var(--accent-light)',  title: 'Child Management',      desc: 'Comprehensive profiles, admission records, guardianship details, and full history tracking.' },
  { icon: 'bi-heart-pulse-fill',     color: '#4ade80',        bg: 'var(--green-light)',   title: 'Health Monitoring',     desc: 'Track medical checkups, BMI, vaccination records, and get proactive health alerts.' },
  { icon: 'bi-journal-bookmark-fill',color: '#a78bfa',        bg: 'var(--violet-light)',  title: 'Academic Progress',     desc: 'Monitor marks, attendance, learning achievements and generate academic reports.' },
  { icon: 'bi-gift-fill',            color: '#fbbf24',        bg: 'var(--amber-light)',   title: 'Donation Management',   desc: 'Transparent cash and item donation tracking with donor receipts and audit logs.' },
  { icon: 'bi-people-fill',          color: '#22d3ee',        bg: 'var(--cyan-light)',    title: 'Volunteer Network',     desc: 'Assign, schedule, and manage volunteers with skill matching and activity logs.' },
  { icon: 'bi-cpu-fill',             color: '#fb7185',        bg: 'var(--rose-light)',    title: 'AI & ML Predictions',   desc: 'Random Forest & SVM models for academic trajectory, health risk, and growth forecasting.' },
];

const aiModules = [
  { icon: 'bi-graph-up-arrow',      color: 'var(--accent)',  title: 'Academic Prediction',    desc: 'Predict 6-month score trajectory using attendance and historical marks.' },
  { icon: 'bi-shield-check',        color: '#4ade80',        title: 'Health Risk Analysis',   desc: 'BMI-based SVM model flags children at nutritional or medical risk.' },
  { icon: 'bi-arrows-fullscreen',   color: '#a78bfa',        title: 'Growth Forecasting',     desc: 'Height-weight prediction model for early intervention planning.' },
  { icon: 'bi-lightbulb-fill',      color: '#fbbf24',        title: 'Smart Recommendations',  desc: 'Personalized learning paths and activity recommendations per child.' },
  { icon: 'bi-bell-fill',           color: '#22d3ee',        title: 'Proactive Alerts',       desc: 'AI-triggered alerts for attendance drops, health anomalies, and milestones.' },
  { icon: 'bi-bar-chart-fill',      color: '#fb7185',        title: 'Analytics Dashboard',    desc: 'Real-time charts and drill-down reports across all modules.' },
];

const stats = [
  { value: '500+', label: 'Children Served',    icon: 'bi-person-heart',   color: 'var(--accent)' },
  { value: '120+', label: 'Dedicated Staff',    icon: 'bi-person-badge',   color: '#4ade80' },
  { value: '300+', label: 'Generous Donors',    icon: 'bi-heart-fill',     color: '#fbbf24' },
  { value: '150+', label: 'Active Volunteers',  icon: 'bi-people-fill',    color: '#a78bfa' },
  { value: '95%',  label: 'AI Accuracy',        icon: 'bi-cpu-fill',       color: '#22d3ee' },
];

const testimonials = [
  { name: 'Dr. Priya Sharma', role: 'Medical Officer', text: 'The health monitoring module has completely transformed how we track children\'s wellness. AI alerts catch issues before they become serious.', avatar: 'PS' },
  { name: 'Rahul Mehta', role: 'Volunteer Coordinator', text: 'Managing 150+ volunteers used to be a nightmare. Now with Orphanage Management, assignments, schedules, and feedback are all in one place.', avatar: 'RM' },
  { name: 'Aisha Donor', role: 'Monthly Donor', text: 'The transparency dashboard shows exactly how my donations are used. I can see real impact reports, which keeps me motivated to give more.', avatar: 'AD' },
];

export default function LandingPage() {
  const chartData = {
    labels: ['Now', 'Month 1', 'Month 2', 'Month 3', 'Month 4', 'Month 5', 'Month 6'],
    datasets: [
      {
        label: 'AI-Optimized Path',
        data: [72, 75, 78, 82, 85, 87, 90],
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37,99,235,0.1)',
        borderWidth: 2.5,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#2563eb',
        pointRadius: 4,
      },
      {
        label: 'Standard Path',
        data: [72, 73, 74, 75, 76, 77, 78],
        borderColor: '#334155',
        borderDash: [6, 4],
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: '#334155',
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { color: '#64748b', font: { size: 11 }, padding: 16 } },
    },
    scales: {
      y: { min: 65, max: 95, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b', font: { size: 11 } } },
      x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b', font: { size: 11 } } }
    }
  };

  return (
    <div style={{ background: 'var(--bg-base)' }}>

      {/* ── Hero ── */}
      <section className="hero-section" style={{ minHeight: '100vh' }}>
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />
        <div className="hero-orb hero-orb-3" />

        <div className="container">
          <div className="hero-grid">
            {/* Left */}
            <div className="animate-fadeInUp">
              <div className="hero-tag">
                <i className="bi bi-cpu-fill" />
                AI-Powered Orphanage Management
              </div>

              <h1 className="hero-title">
                Empowering Every{' '}
                <span className="gradient-text">Child's</span>{' '}
                Bright Future
              </h1>

              <p className="hero-subtitle">
                An intelligent platform that manages child development, health, education, donations, volunteers, and AI-based predictions — all from one secure, centralized dashboard.
              </p>



              <div className="hero-stats" id="stats">
                {stats.map(s => (
                  <div key={s.label} className="hero-stat-item">
                    <span className="hero-stat-value" style={{ color: s.color }}>{s.value}</span>
                    <span className="hero-stat-label">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — visual card */}
            <div className="hero-visual animate-fadeIn" style={{ animationDelay: '0.3s' }}>
              <div className="hero-dashboard-card" style={{ padding: '0.5rem' }}>
                <img 
                  src="/orphanage_children.jpg" 
                  alt="Orphanage Students" 
                  style={{ width: '100%', height: 'auto', borderRadius: 'var(--radius-md)', display: 'block', objectFit: 'cover' }}
                />
                
                {/* AI Badge Overlay */}
                <div style={{
                  position: 'absolute',
                  bottom: '1.5rem',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  padding: '0.65rem 1.25rem',
                  background: 'rgba(15, 23, 42, 0.85)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 'var(--radius-full)',
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  fontSize: '0.85rem', color: '#fff',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
                  whiteSpace: 'nowrap'
                }}>
                  <i className="bi bi-stars" style={{ color: '#fbbf24' }} />
                  <span>Empowering futures with intelligent care</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="features-section" id="features">
        <div className="container">
          <div className="section-header">
            <div className="section-label">Platform Features</div>
            <h2 className="section-title">Everything You Need to Manage an Orphanage</h2>
            <p className="section-sub">From child health to financial transparency — Orphanage Management covers every operational need with intelligent automation.</p>
          </div>

          <div className="features-grid">
            {features.map(f => (
              <div key={f.title} className="feature-card">
                <div className="feature-icon" style={{ background: f.bg, color: f.color }}>
                  <i className={`bi ${f.icon}`} />
                </div>
                <h4 className="feature-card-title">{f.title}</h4>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── About Us ── */}
      <section className="section" id="about-us" style={{ background: 'var(--bg-surface)' }}>
        <div className="container">
          <div className="section-header">
            <div className="section-label">Our Mission</div>
            <h2 className="section-title">About Us</h2>
            <p className="section-sub">We are dedicated to providing a safe, nurturing, and empowering environment for every child. Our management system ensures complete transparency and holistic care from day one.</p>
          </div>
        </div>
      </section>

      {/* ── AI Services ── */}
      <section className="section" id="ai-services" style={{ background: 'var(--bg-base)' }}>
        <div className="container">
          <div className="section-header">
            <div className="section-label">Artificial Intelligence</div>
            <h2 className="section-title">AI & ML Prediction Services</h2>
            <p className="section-sub">Four dedicated machine learning algorithms predicting child development outcomes in real-time to enable proactive interventions.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
            {aiModules.map(m => (
              <div key={m.title} className="ai-card">
                <div className="ai-card-glow" />
                <div style={{
                  width: 44, height: 44, borderRadius: 'var(--radius-md)',
                  background: 'rgba(37,99,235,0.1)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.15rem', color: m.color,
                  marginBottom: '1rem',
                }}>
                  <i className={`bi ${m.icon}`} />
                </div>
                <h5 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{m.title}</h5>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: 0 }}>{m.desc}</p>
              </div>
            ))}
          </div>

          {/* CTA Banner */}
          <div className="ai-stats-banner">
            <div>
              <div className="section-label">Try It Now</div>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.75rem' }}>See AI Predictions in Action</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Input a child's attendance and test scores — our Random Forest model predicts their 6-month academic trajectory with 96% accuracy, enabling personalized support plans.
              </p>
              <Link to="/ai-prediction" className="btn btn-primary">
                <i className="bi bi-cpu-fill" /> Explore AI Hub →
              </Link>
            </div>
            <div style={{ position: 'relative' }}>
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>Live ML Preview</p>
                <div style={{ height: 200 }}>
                  <Line data={chartData} options={chartOptions} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="section" id="testimonials" style={{ background: 'var(--bg-surface)' }}>
        <div className="container">
          <div className="section-header">
            <div className="section-label">Testimonials</div>
            <h2 className="section-title">Trusted by Caregivers & Donors</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
            {testimonials.map(t => (
              <div key={t.name} className="glass-card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1rem' }}>
                  {[...Array(5)].map((_, i) => (
                    <i key={i} className="bi bi-star-fill" style={{ color: '#fbbf24', fontSize: '0.75rem' }} />
                  ))}
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '1.25rem', fontStyle: 'italic' }}>
                  "{t.text}"
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.8rem', fontWeight: 700, color: '#fff',
                  }}>{t.avatar}</div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{t.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Donate ── */}
      <section className="section" id="donate" style={{ background: 'var(--bg-base)' }}>
        <div className="container">
          <div className="section-header">
            <div className="section-label">Support Us</div>
            <h2 className="section-title">Make a Difference</h2>
            <p className="section-sub">Your contributions help us provide better education, healthcare, and living conditions. Join us in shaping a brighter future.</p>
            <Link to="/register" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              <i className="bi bi-heart-fill" /> Donate Now
            </Link>
          </div>
        </div>
      </section>

      {/* ── Contact / CTA ── */}
      <section className="section" id="contact" style={{ background: 'var(--bg-base)' }}>
        <div className="container">
          <div style={{
            background: 'linear-gradient(135deg, rgba(37,99,235,0.12), rgba(124,58,237,0.12))',
            border: '1px solid rgba(37,99,235,0.25)',
            borderRadius: 'var(--radius-xl)', padding: '4rem',
            textAlign: 'center',
          }}>
            <div className="section-label">Get Started Today</div>
            <h2 className="section-title" style={{ marginBottom: '1rem' }}>
              Ready to Transform Your Orphanage?
            </h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', maxWidth: 500, margin: '0 auto 2rem' }}>
              Join hundreds of caregivers and donors who trust Orphanage Management to manage, monitor, and improve every child's journey.
            </p>

          </div>
        </div>
      </section>
    </div>
  );
}
