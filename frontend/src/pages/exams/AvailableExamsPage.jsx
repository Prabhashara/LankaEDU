import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { clearAuthSession, getAuthToken, getStoredRole } from "../../services/authStorage";
import { getExams } from "../../services/examService";

function formatDateTime(value) {
  if (!value) {
    return "Not scheduled";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function examWindow(exam) {
  const now = new Date();
  const start = exam.startAt ? new Date(exam.startAt) : null;
  const end = exam.endAt ? new Date(exam.endAt) : null;

  if (start && start > now) {
    return "upcoming";
  }

  if (end && end <= now) {
    return "ended";
  }

  return "available";
}

function countdownLabel(value) {
  if (!value) {
    return "Upcoming";
  }

  const diff = new Date(value).getTime() - Date.now();
  if (diff <= 0) {
    return "Available soon";
  }

  const totalMinutes = Math.ceil(diff / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `Starts in ${days}d ${hours}h`;
  }

  if (hours > 0) {
    return `Starts in ${hours}h ${minutes}m`;
  }

  return `Starts in ${minutes}m`;
}

function badgeFor(exam) {
  const window = examWindow(exam);
  if (window === "upcoming") {
    return { className: "upcoming", label: countdownLabel(exam.startAt) };
  }
  if (window === "ended") {
    return { className: "ended", label: "Ended" };
  }
  return { className: "available", label: "Available Now" };
}

export default function AvailableExamsPage() {
  const navigate = useNavigate();
  const token = getAuthToken();
  const role = getStoredRole();
  const [exams, setExams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token || role !== "student") {
      return;
    }

    let isMounted = true;

    async function loadExams() {
      try {
        const data = await getExams({ status: "Active" });
        if (isMounted) {
          setExams(data);
          setError("");
        }
      } catch (_requestError) {
        if (isMounted) {
          setError("Unable to load available exams.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadExams();

    return () => {
      isMounted = false;
    };
  }, [role, token]);

  const activeExams = useMemo(() => exams.filter((exam) => exam.status === "Active"), [exams]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (role !== "student") {
    return <Navigate to={`/${role || "student"}-dashboard`} replace />;
  }

  function handleLogout() {
    clearAuthSession();
    navigate("/login", { replace: true });
  }

  return (
    <main className="admin-shell">
      <section className="admin-header" aria-labelledby="available-exams-title">
        <div>
          <p className="eyebrow">Available Exams</p>
          <h1 id="available-exams-title">Exams You Can Take</h1>
          <p className="dashboard-copy">See active exams, their schedules, and what is ready right now.</p>
        </div>
        <div className="header-actions">
          <Link className="secondary-button" to="/student-dashboard">
            Dashboard
          </Link>
          <button className="secondary-button" type="button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </section>

      {error ? <div className="alert alert-error admin-alert">{error}</div> : null}

      {isLoading ? (
        <section className="detail-panel wide">
          <p className="empty-state">Loading exams...</p>
        </section>
      ) : activeExams.length > 0 ? (
        <section className="available-exam-grid" aria-label="Available exam list">
          {activeExams.map((exam) => {
            const window = examWindow(exam);
            const badge = badgeFor(exam);
            const canStart = window === "available" && exam.status === "Active" && !exam.attempted;

            return (
              <article className={window === "ended" ? "available-exam-card ended" : "available-exam-card"} key={exam.id}>
                <div className="available-card-top">
                  <span className={`availability-badge ${badge.className}`}>{badge.label}</span>
                  <span className="question-count">{exam.questionCount || 0} questions</span>
                </div>
                <h2>{exam.title}</h2>
                <p>{exam.subject}</p>
                <dl className="exam-facts">
                  <div>
                    <dt>Duration</dt>
                    <dd>{exam.durationMinutes} minutes</dd>
                  </div>
                  <div>
                    <dt>Starts</dt>
                    <dd>{formatDateTime(exam.startAt)}</dd>
                  </div>
                  <div>
                    <dt>Ends</dt>
                    <dd>{formatDateTime(exam.endAt)}</dd>
                  </div>
                </dl>
                <div className="available-card-actions">
                  {canStart ? (
                    <Link className="primary-button" to={`/student/exams/${exam.id}/take`}>
                      Start
                    </Link>
                  ) : null}
                  {exam.attempted ? (
                    <Link className="secondary-button" to={`/student/exams/${exam.id}/result`}>
                      View Result
                    </Link>
                  ) : null}
                  {window === "upcoming" && !exam.attempted ? <span className="muted-text">Start opens at the scheduled time.</span> : null}
                  {window === "ended" && !exam.attempted ? <span className="muted-text">This exam has ended.</span> : null}
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <section className="detail-panel wide">
          <p className="empty-state">No active exams are available.</p>
        </section>
      )}
    </main>
  );
}
