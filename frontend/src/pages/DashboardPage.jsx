import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { clearAuthSession, getAuthToken, getStoredRole } from "../services/authStorage";
import { getExams } from "../services/examService";

const roleTitles = {
  student: "Student Dashboard",
  lecturer: "Lecturer Dashboard",
  admin: "Admin Dashboard"
};

export default function DashboardPage({ role }) {
  const navigate = useNavigate();
  const token = getAuthToken();
  const storedRole = getStoredRole();
  const [exams, setExams] = useState([]);
  const [isLoadingExams, setIsLoadingExams] = useState(role === "lecturer" || role === "student");
  const [examError, setExamError] = useState("");

  useEffect(() => {
    if (!token || !["lecturer", "student"].includes(role) || storedRole !== role) {
      return;
    }

    let isMounted = true;

    async function loadExams() {
      try {
        const data = await getExams();
        if (isMounted) {
          setExams(data);
          setExamError("");
        }
      } catch (_error) {
        if (isMounted) {
          setExamError("Unable to load exams.");
        }
      } finally {
        if (isMounted) {
          setIsLoadingExams(false);
        }
      }
    }

    loadExams();

    return () => {
      isMounted = false;
    };
  }, [role, storedRole, token]);

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
          {role === "lecturer" ? (
            <Link className="link-button" to="/lecturer/exams/new">
              Create exam
            </Link>
          ) : null}
          <button className="secondary-button" type="button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </section>
      {role === "lecturer" || role === "student" ? (
        <section className="dashboard-panel exam-list-panel" aria-labelledby="exam-list-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{role === "lecturer" ? "Exams" : "Available"}</p>
              <h2 id="exam-list-title">{role === "lecturer" ? "Your Exam List" : "Available Exams"}</h2>
            </div>
            {role === "lecturer" ? (
              <Link className="secondary-button" to="/lecturer/exams/new">
                New exam
              </Link>
            ) : null}
          </div>

          {examError ? <div className="alert alert-error admin-alert">{examError}</div> : null}

          {isLoadingExams ? (
            <p className="empty-state">Loading exams...</p>
          ) : exams.length > 0 ? (
            <div className="exam-list">
              {exams.map((exam) => (
                <Link
                  className="exam-row"
                  key={exam.id}
                  to={role === "lecturer" ? `/lecturer/exams/${exam.id}` : "#"}
                  aria-disabled={role === "student" ? "true" : undefined}
                >
                  <span>
                    <strong>{exam.title}</strong>
                    <small>{exam.subject}</small>
                  </span>
                  <span>{exam.durationMinutes} min</span>
                  <span>{exam.passMark}% pass</span>
                  <span className={`status-pill ${exam.status.toLowerCase()}`}>{exam.status}</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="empty-state">
              {role === "lecturer" ? "No exams yet. Create your first draft exam." : "No active exams are available."}
            </p>
          )}
        </section>
      ) : null}
    </main>
  );
}
