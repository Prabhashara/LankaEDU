import { NavLink, useNavigate } from "react-router-dom";
import BrandLogo from "./BrandLogo.jsx";
import Icon from "./Icons.jsx";
import { clearAuthSession, getStoredRole, getStoredUser } from "../services/authStorage.js";

const navByRole = {
  student: [
    { to: "/student-dashboard", label: "Dashboard", icon: "dashboard" },
    { to: "/student/exams", label: "Available Exams", icon: "exam" },
    { to: "/student/report-card", label: "Report Card", icon: "report" },
    { to: "/profile", label: "Profile", icon: "profile" }
  ],
  lecturer: [
    { to: "/lecturer-dashboard", label: "Dashboard", icon: "dashboard" },
    { to: "/lecturer/exams/new", label: "Create Exam", icon: "plus" },
    { to: "/lecturer/question-bank", label: "Question Bank", icon: "book" },
    { to: "/lecturer/analytics", label: "Analytics", icon: "analytics" },
    { to: "/profile", label: "Profile", icon: "profile" }
  ],
  admin: [
    { to: "/admin-dashboard", label: "Dashboard", icon: "dashboard" },
    { to: "/admin/users", label: "Users", icon: "users" },
    { to: "/admin/audit", label: "Audit Log", icon: "audit" },
    { to: "/profile", label: "Profile", icon: "profile" }
  ]
};

function initials(name, role) {
  const source = String(name || role || "User").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0]?.[0] || "U"}${parts[parts.length - 1]?.[0] || ""}`.toUpperCase();
}

function roleLabel(role) {
  if (!role) return "Account";
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export default function AppShell({ role: explicitRole, children }) {
  const navigate = useNavigate();
  const role = explicitRole || getStoredRole() || "student";
  const profile = getStoredUser() || {};
  const navItems = navByRole[role] || navByRole.student;

  function handleLogout() {
    clearAuthSession();
    navigate("/", { replace: true });
  }

  return (
    <div className="app-shell">
      <aside className="app-sidebar" aria-label="Primary navigation">
        <NavLink className="app-brand" to={`/${role}-dashboard`}>
          <BrandLogo variant="sidebar" />
          <span className="sr-only">LankaEdu Exam Platform</span>
        </NavLink>

        <nav className="app-nav">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `app-nav-link ${isActive ? "active" : ""}`}>
              <Icon name={item.icon} size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="app-sidebar-card">
          <div className="sidebar-card-icon"><Icon name="shield" size={20} /></div>
          <strong>Protected workspace</strong>
          <p>Role-based access is active for this session.</p>
        </div>
      </aside>

      <div className="app-main-area">
        <header className="app-topbar">
          <div className="app-topbar-title">
            <span className="app-mobile-mark"><Icon name="menu" size={20} /></span>
            <div>
              <p className="eyebrow">{roleLabel(role)} Workspace</p>
              <h2>Professional Control Center</h2>
            </div>
          </div>
          <div className="app-topbar-actions">
            <NavLink className="app-user-chip" to="/profile">
              <span className="app-user-avatar">{initials(profile.name, role)}</span>
              <span>
                <strong>{profile.name || roleLabel(role)}</strong>
                <small>{roleLabel(role)} account</small>
              </span>
            </NavLink>
            <button className="app-logout" type="button" onClick={handleLogout}>
              <Icon name="logout" size={17} />
              <span>Sign out</span>
            </button>
          </div>
        </header>
        <div className="app-page-content">{children}</div>
      </div>
    </div>
  );
}
