import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { clearAuthSession, getAuthToken, getStoredRole, getStoredUser } from "../services/authStorage";
import { getExams } from "../services/examService";

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
    { label: "Active Exams", value: active, sub: "available now", cls: "teal" },
    { label: "Scheduled", value: exams.filter(e => e.status?.toLowerCase() === "upcoming").length, sub: "upcoming", cls: "amber" },
    { label: "Total Exams", value: exams.length, sub: "all time", cls: "" },
  ];
}

function getLecturerStats(exams) {
  const active = exams.filter(e => e.status?.toLowerCase() === "active").length;
  const drafts = exams.filter(e => e.status?.toLowerCase() === "draft").length;
  return [
    { label: "Active Exams", value: active, sub: "currently live", cls: "emerald" },
    { label: "Drafts", value: drafts, sub: "in progress", cls: "amber" },
    { label: "Total Exams", value: exams.length, sub: "created", cls: "teal" },
  ];
}

const studentActions = [
  { icon: "📋", title: "Available Exams", desc: "Browse active assessments", to: "/student/exams" },
  { icon: "📈", title: "My Report Card", desc: "View scores and grades", to: "/student/report-card" },
];

const lecturerActions = [
  { icon: "➕", title: "Create Exam", desc: "Build a new assessment", to: "/lecturer/exams/new" },
  { icon: "📊", title: "Analytics", desc: "Class performance insights", to: "/lecturer/analytics" },
];

const adminActions = [
  { icon: "👥", title: "Manage Users", desc: "Activate & assign roles", to: "/admin/users" },
  { icon: "🧾", title: "Audit Log", desc: "Review security events", to: "/admin/audit" },
];

const profileAction = { icon: "ID", title: "Profile", desc: "Manage this browser profile", to: "/profile" };

const activityByRole = {
  student: [
    { dot: "green", icon: "✓", title: "Exam results available", meta: "Data Structures — 84%" },
    { dot: "teal", icon: "📋", title: "New exam scheduled", meta: "Algorithms — starts in 2 days" },
    { dot: "amber", icon: "⏰", title: "Upcoming deadline", meta: "Database Systems — 3 days left" },
  ],
  lecturer: [
    { dot: "green", icon: "✓", title: "Exam published successfully", meta: "Web Development Final" },
    { dot: "teal", icon: "📊", title: "15 new submissions", meta: "Data Structures Midterm" },
    { dot: "amber", icon: "⚠️", title: "Draft exam pending review", meta: "Algorithms Quiz 3" },
  ],
  admin: [
    { dot: "green", icon: "✓", title: "Audit trail enabled", meta: "Sign-ins and critical actions are logged" },
    { dot: "teal", icon: "👤", title: "User access managed", meta: "Activate, deactivate, and delete users" },
    { dot: "amber", icon: "⚠️", title: "Security headers active", meta: "API responses include hardened browser headers" },
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
  const navigate = useNavigate();
  const token = getAuthToken();
  const storedRole = getStoredRole();
  const profile = getStoredUser();
  const [exams, setExams] = useState([]);
  const [isLoadingExams, setIsLoadingExams] = useState(role === "lecturer" || role === "student");
  const [examError, setExamError] = useState("");

  useEffect(() => {
    if (!token || !["lecturer", "student"].includes(role) || storedRole !== role) return;
    let isMounted = true;
    async function loadExams() {
      try {
        const data = await getExams();
        if (isMounted) { setExams(data); setExamError(""); }
      } catch { if (isMounted) setExamError("Unable to load exams."); }
      finally { if (isMounted) setIsLoadingExams(false); }
    }
    loadExams();
    return () => { isMounted = false; };
  }, [role, storedRole, token]);

  if (!token) return <Navigate to="/login" replace />;
  if (storedRole && storedRole !== role) return <Navigate to={`/${storedRole}-dashboard`} replace />;

  function handleLogout() { clearAuthSession(); navigate("/login", { replace: true }); }

  const stats = role === "student" ? getStudentStats(exams) : role === "lecturer" ? getLecturerStats(exams) : [];
  const actions = [...(role === "student" ? studentActions : role === "lecturer" ? lecturerActions : adminActions), profileAction];
  const activity = activityByRole[role] || [];
  const profileName = profile?.name || "Profile";

  return (
    <main className="dashboard-shell">
      {/* Header panel */}
      <div className="dashboard-panel">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <span className="eyebrow">{role}</span>
            <h1 style={{ marginBottom: 6 }}>{roleTitles[role]}</h1>
            <p className="dashboard-copy" style={{ margin: 0 }}>{roleGreetings[role]}</p>
          </div>
          <div className="dashboard-header-actions">
            <Link className="dashboard-profile-chip" to="/profile" aria-label="Open profile management">
              <span className="dashboard-profile-avatar">{getInitials(profileName, role)}</span>
              <span>{profileName}</span>
            </Link>
            <button className="secondary-button" type="button" onClick={handleLogout} style={{ minHeight: 40, padding: "8px 16px" }}>
              Sign out
            </button>
          </div>
        </div>

        {/* Stats */}
        {stats.length > 0 && (
          <div className="stat-grid" style={{ marginTop: 28 }}>
            {stats.map(s => (
              <div key={s.label} className={`stat-card ${s.cls}`}>
                <div className="stat-card-label">{s.label}</div>
                <div className="stat-card-value">{isLoadingExams ? "—" : s.value}</div>
                <div className="stat-card-sub">{s.sub}</div>
              </div>
            ))}
          </div>
        )}

        {/* Quick actions */}
        <div>
          <h3 style={{ margin: "0 0 14px", fontSize: "0.9rem", color: "#64748b", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>Quick Actions</h3>
          <div className="quick-action-grid">
            {actions.map(a => (
              <Link key={a.to} className="quick-action-card" to={a.to}>
                <div className="quick-action-icon">{a.icon}</div>
                <div>
                  <div className="quick-action-title">{a.title}</div>
                  <div className="quick-action-desc">{a.desc}</div>
                </div>
              </Link>
            ))}
            <button className="quick-action-card" onClick={handleLogout} style={{ border: "1.5px solid #fee2e2", background: "#fff1f2" }}>
              <div className="quick-action-icon" style={{ background: "#ffe4e6" }}>🚪</div>
              <div>
                <div className="quick-action-title" style={{ color: "#be123c" }}>Sign Out</div>
                <div className="quick-action-desc">End your session</div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Exam list + activity feed side by side */}
      <div style={{ width: "min(100%, 940px)", margin: "0 auto", display: "grid", gridTemplateColumns: role === "admin" ? "1fr" : "minmax(0,1.4fr) minmax(0,0.6fr)", gap: 20 }}>
        {/* Exam list */}
        {(role === "lecturer" || role === "student") && (
          <div style={{ border: "1px solid #e2e8f0", borderRadius: 24, background: "#fff", padding: "24px 28px", boxShadow: "0 4px 12px rgba(0,0,0,0.06)" }}>
            <div className="section-heading">
              <div>
                <p className="eyebrow">{role === "lecturer" ? "Exams" : "Available"}</p>
                <h2>{role === "lecturer" ? "Your Exam List" : "Available Exams"}</h2>
              </div>
              {role === "lecturer" ? (
                <Link className="secondary-button" to="/lecturer/exams/new" style={{ minHeight: 38, padding: "8px 14px", fontSize: "0.875rem" }}>+ New exam</Link>
              ) : (
                <Link className="secondary-button" to="/student/exams" style={{ minHeight: 38, padding: "8px 14px", fontSize: "0.875rem" }}>View all</Link>
              )}
            </div>

            {examError && <div className="alert alert-error admin-alert">{examError}</div>}

            {isLoadingExams ? (
              <p className="empty-state">Loading exams…</p>
            ) : exams.length > 0 ? (
              <div className="exam-list">
                {exams.slice(0, 6).map(exam => (
                  <Link className="exam-row" key={exam.id}
                    to={role === "lecturer" ? `/lecturer/exams/${exam.id}` : "#"}
                    aria-disabled={role === "student" ? "true" : undefined}
                    style={{ fontSize: "0.9rem" }}>
                    <span>
                      <strong>{exam.title}</strong>
                      <small>{exam.subject}</small>
                    </span>
                    <span style={{ fontSize: "0.82rem", color: "#64748b" }}>{exam.durationMinutes} min</span>
                    <span style={{ fontSize: "0.82rem", color: "#64748b" }}>{exam.passMark}% pass</span>
                    <span className={`status-pill ${exam.status?.toLowerCase()}`}>{exam.status}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="empty-state">
                {role === "lecturer" ? "No exams yet. Create your first draft exam." : "No active exams are available."}
              </p>
            )}
          </div>
        )}

        {/* Activity feed */}
        <div style={{ border: "1px solid #e2e8f0", borderRadius: 24, background: "#fff", padding: "24px 28px", boxShadow: "0 4px 12px rgba(0,0,0,0.06)", height: "fit-content" }}>
          <div style={{ marginBottom: 18 }}>
            <p className="eyebrow">Activity</p>
            <h2>Recent Updates</h2>
          </div>
          <div className="activity-feed">
            {activity.map((a, i) => (
              <div key={i} className="activity-item">
                <div className={`activity-dot ${a.dot}`}>{a.icon}</div>
                <div className="activity-body">
                  <div className="activity-title">{a.title}</div>
                  <div className="activity-meta">{a.meta}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Admin-specific panel */}
        {role === "admin" && (
          <div style={{ border: "1px solid #e2e8f0", borderRadius: 24, background: "#fff", padding: "24px 28px", boxShadow: "0 4px 12px rgba(0,0,0,0.06)" }}>
            <div className="section-heading">
              <div>
                <p className="eyebrow">Users</p>
                <h2>User Management</h2>
              </div>
              <Link className="primary-button" to="/admin/users" style={{ minHeight: 38, padding: "8px 16px", fontSize: "0.875rem" }}>
                Manage users
              </Link>
            </div>
            <p style={{ color: "#64748b", margin: 0 }}>Control user access, manage roles, and activate or deactivate accounts across the platform.</p>
          </div>
        )}
      </div>
    </main>
  );
}
