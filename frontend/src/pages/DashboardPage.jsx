import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { clearAuthSession, getAuthToken, getStoredRole, getStoredUser } from "../services/authStorage";
import { getApiErrorMessage } from "../services/errorService";
import { getExams } from "../services/examService";
import Icon from "../components/Icons.jsx";
import { EmptyState, SkeletonGrid, StatCard } from "../components/UiKit.jsx";

const roleTitles = {
  student: "Student Dashboard",
  lecturer: "Lecturer Dashboard",
  admin: "Admin Dashboard"
};

const roleGreetings = {
  student: "Ready to take your next exam?",
  lecturer: "Manage your exams and track student performance.",
  admin: "Oversee platform users and roles from here."
};

function getStudentStats(exams) {
  const active = exams.filter(e => e.status?.toLowerCase() === "active").length;
  return [
    { label: "Active Exams", value: active, sub: "available now", cls: "teal", icon: "exam" },
    { label: "Scheduled", value: exams.filter(e => e.status?.toLowerCase() === "upcoming").length, sub: "upcoming", cls: "amber", icon: "calendar" },
    { label: "Total Exams", value: exams.length, sub: "all time", cls: "", icon: "analytics" },
  ];
}

function getLecturerStats(exams) {
  const active = exams.filter(e => e.status?.toLowerCase() === "active").length;
  const drafts = exams.filter(e => e.status?.toLowerCase() === "draft").length;
  return [
    { label: "Active Exams", value: active, sub: "currently live", cls: "emerald", icon: "exam" },
    { label: "Drafts", value: drafts, sub: "in progress", cls: "amber", icon: "book" },
    { label: "Total Exams", value: exams.length, sub: "created", cls: "teal", icon: "analytics" },
  ];
}

const studentActions = [
  { icon: "exam", title: "Available Exams", desc: "Browse active assessments", to: "/student/exams" },
  { icon: "report", title: "My Report Card", desc: "View scores and grades", to: "/student/report-card" },
];

const lecturerActions = [
  { icon: "plus", title: "Create Exam", desc: "Build a new assessment", to: "/lecturer/exams/new" },
  { icon: "book", title: "Question Bank", desc: "Reuse saved questions", to: "/lecturer/question-bank" },
  { icon: "analytics", title: "Analytics", desc: "Class performance insights", to: "/lecturer/analytics" },
];

const adminActions = [
  { icon: "users", title: "Manage Users", desc: "Activate & assign roles", to: "/admin/users" },
  { icon: "audit", title: "Audit Log", desc: "Review security events", to: "/admin/audit" },
];

const profileAction = { icon: "profile", title: "Profile", desc: "Manage this browser profile", to: "/profile" };

const activityByRole = {
  student: [
    { dot: "green", icon: "check", title: "Exam results available", meta: "Data Structures — 84%" },
    { dot: "teal", icon: "exam", title: "New exam scheduled", meta: "Algorithms — starts in 2 days" },
    { dot: "amber", icon: "clock", title: "Upcoming deadline", meta: "Database Systems — 3 days left" },
  ],
  lecturer: [
    { dot: "green", icon: "check", title: "Exam published successfully", meta: "Web Development Final" },
    { dot: "teal", icon: "analytics", title: "15 new submissions", meta: "Data Structures Midterm" },
    { dot: "amber", icon: "warning", title: "Draft exam pending review", meta: "Algorithms Quiz 3" },
  ],
  admin: [
    { dot: "green", icon: "check", title: "Audit trail enabled", meta: "Sign-ins and critical actions are logged" },
    { dot: "teal", icon: "userCheck", title: "User access managed", meta: "Activate, deactivate, and delete users" },
    { dot: "amber", icon: "shield", title: "Security headers active", meta: "API responses include hardened browser headers" },
  ]
};

function getInitials(name, role) {
  const source = (name || role || "Profile").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "PR";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function DashboardPage({ role }) {
  const location = useLocation();
  const navigate = useNavigate();
  const token = getAuthToken();
  const storedRole = getStoredRole();
  const profile = getStoredUser();
  const [exams, setExams] = useState([]);
  const [isLoadingExams, setIsLoadingExams] = useState(role === "lecturer" || role === "student");
  const [examError, setExamError] = useState("");
  const [toast, setToast] = useState(location.state?.toast || "");

  useEffect(() => {
    const stateToast = location.state?.toast;
    if (stateToast) {
      setToast(stateToast);
      navigate(location.pathname, { replace: true });
    }
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    if (!token || !["lecturer", "student"].includes(role) || storedRole !== role) return;
    let isMounted = true;
    async function loadExams() {
      try {
        const data = await getExams();
        if (isMounted) { setExams(data); setExamError(""); }
      } catch (error) { if (isMounted) setExamError(getApiErrorMessage(error, "Unable to load exams.")); }
      finally { if (isMounted) setIsLoadingExams(false); }
    }
    loadExams();
    return () => { isMounted = false; };
  }, [role, storedRole, token]);

  if (!token) return <Navigate to="/login" replace />;
  if (storedRole && storedRole !== role) return <Navigate to={`/${storedRole}-dashboard`} replace />;

  function handleLogout() { clearAuthSession(); navigate("/", { replace: true }); }

  const stats = role === "student" ? getStudentStats(exams) : role === "lecturer" ? getLecturerStats(exams) : [];
  const actions = [...(role === "student" ? studentActions : role === "lecturer" ? lecturerActions : adminActions), profileAction];
  const activity = activityByRole[role] || [];
  const profileName = profile?.name || "Profile";

  return (
    <main className={`dashboard-shell dashboard-shell-${role}`}>
      <div className="dashboard-panel dashboard-hero-panel">
        <div className="dashboard-hero-header">
          <div className="dashboard-heading-group">
            <span className="eyebrow">{role}</span>
            <h1>{roleTitles[role]}</h1>
            <p className="dashboard-copy">{roleGreetings[role]}</p>
          </div>
          <div className="dashboard-header-actions">
            <Link className="dashboard-profile-chip" to="/profile" aria-label="Open profile management">
              <span className="dashboard-profile-avatar">{getInitials(profileName, role)}</span>
              <span>{profileName}</span>
            </Link>
            <button className="secondary-button dashboard-logout-button" type="button" onClick={handleLogout}>
              Sign out
            </button>
          </div>
        </div>

        {toast ? <div className="toast" role="status"><Icon name="check" size={16} /> {toast}</div> : null}

        {stats.length > 0 && (
          <div className="stat-grid dashboard-stat-grid">
            {stats.map(s => (
              <StatCard key={s.label} label={s.label} value={isLoadingExams ? "—" : s.value} sub={s.sub} tone={s.cls} icon={s.icon} />
            ))}
          </div>
        )}

        <div>
          <h3 className="quick-actions-heading">Quick Actions</h3>
          <div className="quick-action-grid">
            {actions.map(a => (
              <Link key={a.to} className="quick-action-card" to={a.to}>
                <div className="quick-action-icon"><Icon name={a.icon} size={22} /></div>
                <div>
                  <div className="quick-action-title">{a.title}</div>
                  <div className="quick-action-desc">{a.desc}</div>
                </div>
              </Link>
            ))}
            <button className="quick-action-card quick-action-card-danger" onClick={handleLogout}>
              <div className="quick-action-icon"><Icon name="logout" size={22} /></div>
              <div>
                <div className="quick-action-title">Sign Out</div>
                <div className="quick-action-desc">End your session</div>
              </div>
            </button>
          </div>
        </div>
      </div>

      <div className={`dashboard-content-grid ${role === "admin" ? "admin-only" : ""}`}>
        {(role === "lecturer" || role === "student") && (
          <section className="dashboard-card dashboard-exam-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">{role === "lecturer" ? "Exams" : "Available"}</p>
                <h2>{role === "lecturer" ? "Your Exam List" : "Available Exams"}</h2>
              </div>
              {role === "lecturer" ? (
                <Link className="secondary-button compact-button" to="/lecturer/exams/new">+ New exam</Link>
              ) : (
                <Link className="secondary-button compact-button" to="/student/exams">View all</Link>
              )}
            </div>

            {examError && <div className="alert alert-error admin-alert">{examError}</div>}

            {isLoadingExams ? (
              <SkeletonGrid count={3} variant="list" />
            ) : exams.length > 0 ? (
              <div className="exam-list">
                {exams.slice(0, 6).map(exam => (
                  <Link className="exam-row dashboard-exam-row" key={exam.id}
                    to={role === "lecturer" ? `/lecturer/exams/${exam.id}` : "#"}
                    aria-disabled={role === "student" ? "true" : undefined}>
                    <span>
                      <strong>{exam.title}</strong>
                      <small>{exam.subject}</small>
                    </span>
                    <span className="exam-row-meta">{exam.durationMinutes} min</span>
                    <span className="exam-row-meta">{exam.passMark}% pass</span>
                    <span className={`status-pill ${exam.status?.toLowerCase()}`}>{exam.status}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                icon="exam"
                title={role === "lecturer" ? "No exams created yet" : "No active exams"}
                message={role === "lecturer" ? "Create your first draft exam and add questions from the question bank." : "Your lecturer has not published any exam at the moment."}
              />
            )}
          </section>
        )}

        <section className="dashboard-card dashboard-activity-card">
          <div className="dashboard-card-heading">
            <p className="eyebrow">Activity</p>
            <h2>Recent Updates</h2>
          </div>
          <div className="activity-feed">
            {activity.map((a, i) => (
              <div key={i} className="activity-item">
                <div className={`activity-dot ${a.dot}`}><Icon name={a.icon} size={15} /></div>
                <div className="activity-body">
                  <div className="activity-title">{a.title}</div>
                  <div className="activity-meta">{a.meta}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {role === "admin" && (
          <section className="dashboard-card dashboard-admin-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Users</p>
                <h2>User Management</h2>
              </div>
              <Link className="primary-button compact-button" to="/admin/users">
                Manage users
              </Link>
            </div>
            <p className="muted-text">Control user access, manage roles, and activate or deactivate accounts across the platform.</p>
          </section>
        )}
      </div>
    </main>
  );
}
