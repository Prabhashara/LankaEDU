import { Link } from "react-router-dom";

const heroStats = [
  { label: "Exams Taken", value: "247" },
  { label: "Pass Rate", value: "91%" },
  { label: "Avg Score", value: "78%" }
];

const roleFeatures = [
  {
    icon: "🎓",
    badge: "For Students",
    title: "Focus on learning, not paperwork.",
    desc: "Access available exams in one click, take assessments with a live countdown, and instantly view detailed results and your personal report card.",
    points: ["One-click exam access", "Live timer with question navigator", "Detailed score breakdown"],
    tone: "student"
  },
  {
    icon: "📝",
    badge: "For Lecturers",
    title: "Create and publish exams with confidence.",
    desc: "Build question banks, schedule exam windows, publish to students, and review performance using bar charts and donut pass/fail analytics.",
    points: ["Question bank builder", "Score distribution charts", "Per-student result review"],
    tone: "lecturer"
  },
  {
    icon: "🛡️",
    badge: "For Admins",
    title: "Keep the platform secure and organized.",
    desc: "Control user access across all roles, search and manage accounts from a unified dashboard, and activate or deactivate users instantly.",
    points: ["Role-based access control", "Searchable user table", "Activate or deactivate users"],
    tone: "admin"
  }
];

const workflowSteps = [
  { step: "01", icon: "✏️", title: "Sign up", desc: "Create your account and get assigned a role: student, lecturer, or admin." },
  { step: "02", icon: "📋", title: "Access exams", desc: "Students see active exam cards. Lecturers create and publish question banks." },
  { step: "03", icon: "⏱️", title: "Take the exam", desc: "A live countdown and question navigator guide students through each assessment." },
  { step: "04", icon: "📊", title: "Review results", desc: "Instant scores, grade badges, PDF reports, and class-wide analytics dashboards." }
];

const questionCells = Array.from({ length: 8 }, (_, index) => index + 1);

export default function HomePage() {
  return (
    <div className="home-shell">
      <nav className="home-nav">
        <Link className="home-nav-logo" to="/">
          <div className="nav-logo-icon">📋</div>
          <span className="nav-logo-text">
            Lanka<span>Edu</span>
          </span>
        </Link>
        <div className="home-nav-links">
          <Link className="secondary-button home-nav-button" to="/login">
            Sign in
          </Link>
          <Link className="primary-button home-nav-button" to="/signup">
            Get started
          </Link>
        </div>
      </nav>

      <section className="home-section home-hero">
        <div className="home-container home-hero-stack">
          <div>
            <span className="home-eyebrow">
              <span aria-hidden="true">🎓</span>
              Professional Online Exam Platform
            </span>
          </div>

          <div className="home-hero-grid">
            <div className="home-hero-copy">
              <h1 className="home-title">
                The smarter way to run{" "}
                <span className="home-title-gradient">online exams</span>
              </h1>
              <p className="hero-copy">
                Streamline assessments for students, lecturers, and admins with real-time timers,
                instant results, and deep analytics from one polished platform.
              </p>
              <div className="cta-buttons">
                <Link className="primary-button home-hero-button" to="/signup">
                  Create free account
                </Link>
                <Link className="secondary-button home-hero-button" to="/login">
                  Sign in
                </Link>
              </div>

              <ul className="home-hero-features">
                <li>Secure JWT-authenticated access for all roles</li>
                <li>Live countdown timers with auto-submit protection</li>
                <li>Instant PDF reports and grade analytics</li>
              </ul>
            </div>

            <div className="home-visual" aria-label="Exam dashboard preview">
              <div className="home-score-card">
                <div className="home-score-ring">
                  <div className="home-score-ring-inner">84%</div>
                </div>
                <div>
                  <div className="home-card-title">Data Structures Final</div>
                  <div className="home-chip-row">
                    <span className="home-chip home-chip-success">Passed</span>
                    <span className="home-chip home-chip-primary">Grade A</span>
                  </div>
                </div>
              </div>

              <div className="home-timer-card">
                <div>
                  <div className="home-timer-label">Time Remaining</div>
                  <div className="home-timer-value">32:14</div>
                </div>
                <div className="home-question-grid" aria-hidden="true">
                  {questionCells.map((cell) => (
                    <div
                      key={cell}
                      className={`home-question-cell ${
                        cell <= 6 ? "answered" : cell === 7 ? "current" : "muted"
                      }`}
                    >
                      {cell}
                    </div>
                  ))}
                </div>
              </div>

              <div className="home-stat-row">
                {heroStats.map(({ label, value }) => (
                  <div key={label} className="home-mini-stat">
                    <div className="home-mini-stat-value">{value}</div>
                    <div className="home-mini-stat-label">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="home-section home-section-muted">
        <div className="home-container home-section-stack">
          <div className="home-section-head">
            <span className="home-section-kicker">Built for everyone</span>
            <h2 className="home-section-title">One platform. Every role.</h2>
            <p className="home-section-copy">
              LankaEdu gives each user exactly what they need, with clear tools and calm workflows.
            </p>
          </div>

          <div className="home-feature-grid">
            {roleFeatures.map(({ icon, badge, title, desc, points, tone }) => (
              <div key={badge} className="feature-card">
                <div className="feature-card-top">
                  <div className={`feature-icon feature-icon-${tone}`}>{icon}</div>
                  <span className="home-highlight">{badge}</span>
                </div>
                <strong>{title}</strong>
                <p>{desc}</p>
                <ul className="feature-point-list">
                  {points.map((point) => (
                    <li key={point}>
                      <span aria-hidden="true">→</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="home-section home-section-surface">
        <div className="home-container home-section-stack">
          <div className="home-section-head">
            <span className="home-section-kicker">Simple by design</span>
            <h2 className="home-section-title">How it works</h2>
          </div>

          <div className="home-steps-grid">
            {workflowSteps.map(({ step, icon, title, desc }) => (
              <div key={step} className="home-step">
                <div className="home-step-icon">{icon}</div>
                <div className="home-step-number">Step {step}</div>
                <div className="home-step-title">{title}</div>
                <div className="home-step-copy">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="home-section home-cta-banner">
        <div className="home-cta-inner">
          <h2 className="home-cta-title">Ready to modernise your exams?</h2>
          <p className="home-cta-copy">
            Join students, lecturers and institutions already using LankaEdu to run better assessments.
          </p>
          <div className="home-cta-actions">
            <Link className="home-cta-link home-cta-link-primary" to="/signup">
              Create account
            </Link>
            <Link className="home-cta-link home-cta-link-secondary" to="/login">
              Sign in
            </Link>
          </div>
        </div>
      </section>

      <footer className="home-footer">
        <div className="home-footer-brand">
          <div className="nav-logo-icon home-footer-logo">📋</div>
          <span>LankaEdu</span>
        </div>
        <p>© {new Date().getFullYear()} LankaEdu. Professional Online Assessment Platform.</p>
        <div className="home-footer-links">
          {["Privacy", "Terms", "Support"].map((item) => (
            <span key={item} className="home-footer-link">
              {item}
            </span>
          ))}
        </div>
      </footer>
    </div>
  );
}
