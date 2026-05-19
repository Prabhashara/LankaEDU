import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { clearAuthSession, getAuthToken, getStoredRole } from "../../services/authStorage";
import { getApiErrorMessage } from "../../services/errorService";
import { getExams } from "../../services/examService";
import Icon from "../../components/Icons.jsx";
import { EmptyState, SkeletonGrid } from "../../components/UiKit.jsx";

function formatDateTime(value) {
  if (!value) return "Not scheduled";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function examWindow(exam) {
  const now = new Date();
  const start = exam.startAt ? new Date(exam.startAt) : null;
  const end = exam.endAt ? new Date(exam.endAt) : null;
  if (start && start > now) return "upcoming";
  if (end && end <= now) return "ended";
  return "available";
}

function countdownLabel(value) {
  if (!value) return "Upcoming";
  const diff = new Date(value).getTime() - Date.now();
  if (diff <= 0) return "Available soon";
  const totalMinutes = Math.ceil(diff / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `Starts in ${days}d ${hours}h`;
  if (hours > 0) return `Starts in ${hours}h ${minutes}m`;
  return `Starts in ${minutes}m`;
}

function badgeFor(exam) {
  const w = examWindow(exam);
  if (w === "upcoming") return { className: "upcoming", label: countdownLabel(exam.startAt) };
  if (w === "ended") return { className: "ended", label: "Ended" };
  return { className: "available", label: "● Available Now" };
}

const stripColor = { available: "#059669", upcoming: "#d97706", ended: "#94a3b8" };

export default function AvailableExamsPage() {
  const navigate = useNavigate();
  const token = getAuthToken();
  const role = getStoredRole();
  const [exams, setExams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token || role !== "student") return;
    let isMounted = true;
    async function loadExams() {
      try {
        const data = await getExams({ status: "Active" });
        if (isMounted) { setExams(data); setError(""); }
      } catch (requestError) { if (isMounted) setError(getApiErrorMessage(requestError, "Unable to load available exams.")); }
      finally { if (isMounted) setIsLoading(false); }
    }
    loadExams();
    return () => { isMounted = false; };
  }, [role, token]);

  const activeExams = useMemo(() => exams.filter((e) => e.status === "Active"), [exams]);

  if (!token) return <Navigate to="/login" replace />;
  if (role !== "student") return <Navigate to={`/${role || "student"}-dashboard`} replace />;

  return (
    <main className="admin-shell">
      <section className="admin-header" aria-labelledby="available-exams-title">
        <div>
          <p className="eyebrow">Student Portal</p>
          <h1 id="available-exams-title">Available Exams</h1>
          <p className="dashboard-copy">Browse active, upcoming, and ended assessments.</p>
        </div>
        <div className="header-actions">
          <Link className="secondary-button" to="/student-dashboard" style={{ minHeight: 40, padding: "8px 16px" }}><Icon name="dashboard" size={16} /> Dashboard</Link>
          <button className="secondary-button" type="button" onClick={() => { clearAuthSession(); navigate("/", { replace: true }); }} style={{ minHeight: 40, padding: "8px 16px" }}><Icon name="logout" size={16} /> Sign out</button>
        </div>
      </section>

      {error && <div className="alert alert-error admin-alert">{error}</div>}

      {isLoading ? (
        <div className="detail-panel wide"><SkeletonGrid count={6} /></div>
      ) : activeExams.length > 0 ? (
        <section className="available-exam-grid" aria-label="Available exam list">
          {activeExams.map((exam) => {
            const w = examWindow(exam);
            const badge = badgeFor(exam);
            const canStart = w === "available" && exam.status === "Active" && !exam.attempted;

            return (
              <article key={exam.id} style={{
                display: "grid", gap: 16,
                border: "1.5px solid #e2e8f0", borderRadius: 20,
                background: w === "ended" ? "#f8fafc" : "#fff",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                overflow: "hidden", transition: "box-shadow .2s, transform .2s",
                position: "relative"
              }}>
                {/* Colour-coded top strip */}
                <div style={{
                  height: 5,
                  background: stripColor[w] || "#94a3b8",
                  borderRadius: "20px 20px 0 0",
                  marginBottom: -4
                }} />

                <div style={{ padding: "16px 22px 22px", display: "grid", gap: 14 }}>
                  <div className="available-card-top">
                    <span className={`availability-badge ${badge.className}`}>{badge.label}</span>
                    <span className="question-count">{exam.questionCount || 0} Qs</span>
                  </div>

                  <div>
                    <h2 style={{ margin: "0 0 4px", fontSize: "1.1rem" }}>{exam.title}</h2>
                    <p style={{ margin: 0, color: "#64748b", fontWeight: 700, fontSize: "0.875rem" }}>{exam.subject}</p>
                  </div>

                  <dl className="exam-facts">
                    <div><dt>Duration</dt><dd>{exam.durationMinutes} min</dd></div>
                    <div><dt>Pass Mark</dt><dd>{exam.passMark}%</dd></div>
                    <div><dt>Starts</dt><dd>{formatDateTime(exam.startAt)}</dd></div>
                    <div><dt>Ends</dt><dd>{formatDateTime(exam.endAt)}</dd></div>
                  </dl>

                  <div className="available-card-actions">
                    {canStart && (
                      <Link className="primary-button" to={`/student/exams/${exam.id}/take`} style={{ fontSize: "0.9rem", minHeight: 40 }}>
                        <Icon name="arrowRight" size={16} /> Start Exam
                      </Link>
                    )}
                    {exam.attempted && (
                      <Link className="secondary-button" to={`/student/results/${exam.resultId || exam.attemptId}`} style={{ fontSize: "0.9rem", minHeight: 40 }}>
                        <Icon name="report" size={16} /> View Result
                      </Link>
                    )}
                    {w === "upcoming" && !exam.attempted && <span className="muted-text" style={{ fontSize: "0.85rem" }}>Opens at scheduled time</span>}
                    {w === "ended" && !exam.attempted && <span className="muted-text" style={{ fontSize: "0.85rem" }}>This exam has ended</span>}
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <div className="detail-panel wide">
          <EmptyState
            icon="exam"
            title="No active exams"
            message="Check back later — your lecturer will publish exams when they are ready."
          />
        </div>
      )}
    </main>
  );
}
