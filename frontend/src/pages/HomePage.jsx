import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import BrandLogo from "../components/BrandLogo.jsx";
import Icon from "../components/Icons.jsx";
import { getHomeSummary } from "../services/publicService.js";

const defaultHomeSummary = {
  totalExams: 0,
  activeExams: 0,
  completedAttempts: 0,
  passRate: 0,
  averageScore: 0,
  questionCount: 0,
  timer: {
    status: "none",
    label: "No Scheduled Exam",
    targetAt: "",
    examTitle: "",
    subject: ""
  }
};

const roleFeatures = [
  {
    icon: "profile",
    badge: "For Students",
    title: "Focus on learning, not paperwork.",
    desc: "Access available exams in one click, take assessments with a live countdown, and instantly view detailed results and your personal report card.",
    points: ["One-click exam access", "Live timer with question navigator", "Detailed score breakdown"],
    tone: "student"
  },
  {
    icon: "book",
    badge: "For Lecturers",
    title: "Create and publish exams with confidence.",
    desc: "Build question banks, schedule exam windows, publish to students, and review performance using bar charts and donut pass/fail analytics.",
    points: ["Question bank builder", "Score distribution charts", "Per-student result review"],
    tone: "lecturer"
  },
  {
    icon: "shield",
    badge: "For Admins",
    title: "Keep the platform secure and organized.",
    desc: "Control user access across all roles, search and manage accounts from a unified dashboard, and activate or deactivate users instantly.",
    points: ["Role-based access control", "Searchable user table", "Activate or deactivate users"],
    tone: "admin"
  }
];

const workflowSteps = [
  { step: "01", icon: "profile", title: "Sign up", desc: "Create your account and get assigned a role: student, lecturer, or admin." },
  { step: "02", icon: "exam", title: "Access exams", desc: "Students see active exam cards. Lecturers create and publish question banks." },
  { step: "03", icon: "clock", title: "Take the exam", desc: "A live countdown and question navigator guide students through each assessment." },
  { step: "04", icon: "analytics", title: "Review results", desc: "Instant scores, grade badges, PDF reports, and class-wide analytics dashboards." }
];

export default function HomePage() {
  const [summary, setSummary] = useState(defaultHomeSummary);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let isMounted = true;

    async function loadSummary() {
      try {
        const data = await getHomeSummary();
        if (isMounted) {
          setSummary(normalizeHomeSummary(data));
        }
      } catch {
        if (isMounted) {
          setSummary(defaultHomeSummary);
        }
      }
    }

    loadSummary();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const heroStats = useMemo(() => ([
    { label: "Exams Taken", value: formatCount(summary.completedAttempts) },
    { label: "Pass Rate", value: formatPercent(summary.passRate) },
    { label: "Avg Score", value: formatPercent(summary.averageScore) }
  ]), [summary.averageScore, summary.completedAttempts, summary.passRate]);

  const timer = useMemo(() => buildTimerDisplay(summary.timer, now), [summary.timer, now]);
  const questionCells = useMemo(() => buildQuestionCells(summary.questionCount), [summary.questionCount]);
  const averageScore = formatPercent(summary.averageScore);
  const passRate = formatPercent(summary.passRate);

  return (
    <div className="home-shell">
      <nav className="home-nav">
        <Link className="home-nav-logo" to="/">
          <BrandLogo variant="nav" />
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
              <Icon name="sparkles" size={16} />
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
                <div className="home-score-ring" style={{ "--home-score-value": `${clampPercent(summary.averageScore)}%` }}>
                  <div className="home-score-ring-inner">{averageScore}</div>
                </div>
                <div>
                  <div className="home-card-title">Platform Average</div>
                  <div className="home-chip-row">
                    <span className="home-chip home-chip-success">{passRate} pass rate</span>
                    <span className="home-chip home-chip-primary">{formatCount(summary.completedAttempts)} submissions</span>
                  </div>
                </div>
              </div>

              <div className={`home-timer-card ${timer.tone}`}>
                <div>
                  <div className="home-timer-label">{timer.label}</div>
                  <div className="home-timer-value">{timer.value}</div>
                  {timer.caption ? <div className="home-timer-caption">{timer.caption}</div> : null}
                </div>
                <div className="home-question-grid" aria-hidden="true">
                  {questionCells.length > 0 ? (
                    questionCells.map(({ number, state }) => (
                      <div key={number} className={`home-question-cell ${state}`}>
                        {number}
                      </div>
                    ))
                  ) : (
                    <span className="home-question-empty">No questions</span>
                  )}
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
                  <div className={`feature-icon feature-icon-${tone}`}><Icon name={icon} size={26} /></div>
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
                <div className="home-step-icon"><Icon name={icon} size={22} /></div>
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
          <BrandLogo variant="footer" />
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

function normalizeHomeSummary(data) {
  const timer = data?.timer && typeof data.timer === "object" ? data.timer : defaultHomeSummary.timer;

  return {
    totalExams: numberValue(data?.totalExams),
    activeExams: numberValue(data?.activeExams),
    completedAttempts: numberValue(data?.completedAttempts),
    passRate: numberValue(data?.passRate),
    averageScore: numberValue(data?.averageScore),
    questionCount: numberValue(data?.questionCount),
    timer: {
      status: text(timer.status) || "none",
      label: text(timer.label) || "No Scheduled Exam",
      targetAt: text(timer.targetAt),
      examTitle: text(timer.examTitle),
      subject: text(timer.subject)
    }
  };
}

function buildTimerDisplay(timer, now) {
  const targetTime = Date.parse(timer.targetAt);
  if (!Number.isFinite(targetTime)) {
    return {
      label: timer.label || "No Scheduled Exam",
      value: "00:00",
      caption: "Publish an exam to start the live timer",
      tone: "idle"
    };
  }

  const remainingSeconds = Math.max(0, Math.floor((targetTime - now) / 1000));
  const captionParts = [timer.examTitle, timer.subject].filter(Boolean);
  const isEndingTimer = timer.status === "remaining";
  const tone = isEndingTimer && remainingSeconds <= 3600 ? "critical" : isEndingTimer && remainingSeconds <= 86400 ? "warning" : "";

  return {
    label: timer.label || "Time Remaining",
    value: formatDuration(remainingSeconds),
    caption: captionParts.join(" · "),
    tone
  };
}

function buildQuestionCells(questionCount) {
  const visibleCount = Math.min(8, Math.max(0, Math.round(numberValue(questionCount))));
  return Array.from({ length: visibleCount }, (_, index) => {
    const number = index + 1;
    const state = number < visibleCount ? "answered" : "current";
    return { number, state };
  });
}

function formatDuration(totalSeconds) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;

  if (days > 0) {
    return `${days}d ${String(hours).padStart(2, "0")}h`;
  }

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

function formatPercent(value) {
  const percentage = numberValue(value);
  return `${Number.isInteger(percentage) ? percentage : percentage.toFixed(1)}%`;
}

function formatCount(value) {
  return new Intl.NumberFormat("en-US").format(numberValue(value));
}

function numberValue(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function clampPercent(value) {
  return Math.max(0, Math.min(100, numberValue(value)));
}

function text(value) {
  return value == null ? "" : String(value).trim();
}
