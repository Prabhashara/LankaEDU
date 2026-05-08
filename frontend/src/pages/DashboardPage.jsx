import { Link, Navigate, useNavigate } from "react-router-dom";
import { clearAuthSession, getAuthToken, getStoredRole } from "../services/authStorage";

const roleTitles = {
  student: "Student Dashboard",
  lecturer: "Lecturer Dashboard",
  admin: "Admin Dashboard"
};

export default function DashboardPage({ role }) {
  const navigate = useNavigate();
  const token = getAuthToken();
  const storedRole = getStoredRole();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (storedRole && storedRole !== role) {
    return <Navigate to={`/${storedRole}-dashboard`} replace />;
  }

  function handleLogout() {
    clearAuthSession();
    navigate("/login", { replace: true });
  }

  return (
    <main className="dashboard-shell">
      <section className="dashboard-panel" aria-labelledby="dashboard-title">
        <p className="eyebrow">{role}</p>
        <h1 id="dashboard-title">{roleTitles[role]}</h1>
        <p className="dashboard-copy">You are signed in and viewing the dashboard for your role.</p>
        <div className="dashboard-actions">
          {role === "admin" ? (
            <Link className="link-button" to="/admin/users">
              Manage users
            </Link>
          ) : null}
          <button className="secondary-button" type="button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </section>
    </main>
  );
}
