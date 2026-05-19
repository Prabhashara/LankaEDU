import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import { getAttempt } from "../../services/attemptService";
import { getAuthToken, getStoredRole } from "../../services/authStorage";
import { getApiErrorMessage } from "../../services/errorService";
import { getExam } from "../../services/examService";
import { getResultByAttempt } from "../../services/resultService";
import Icon from "../../components/Icons.jsx";
import "./ExamTakingPage.css";

function formatDateTime(value) {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function formatDuration(seconds) {
  const total = Math.max(0, Number(seconds) || 0);
  const m = Math.floor(total / 60);
  const s = total % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

export default function ExamSubmissionConfirmationPage() {
  const { attemptId } = useParams();
  const location = useLocation();
  const token = getAuthToken();
  const role = getStoredRole();
  const initialSubmission = location.state?.submission;
  const [attempt, setAttempt] = useState(initialSubmission?.attempt || null);
  const [result, setResult] = useState(initialSubmission?.result || null);
  const [exam, setExam] = useState(location.state?.exam || null);
  const [isLoading, setIsLoading] = useState(!initialSubmission);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token || role !== "student" || (attempt && result && exam)) return;
    let isMounted = true;
    async function loadConfirmation() {
      try {
        const loadedAttempt = attempt || (await getAttempt(attemptId));
        const [loadedResult, loadedExam] = await Promise.all([
          result || getResultByAttempt(attemptId),
          exam || getExam(loadedAttempt.exam_id || loadedAttempt.examId)
        ]);
        if (isMounted) { setAttempt(loadedAttempt); setResult(loadedResult); setExam(loadedExam); setError(""); }
      } catch (requestError) {
        if (isMounted) setError(getApiErrorMessage(requestError, "Unable to load submission confirmation."));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadConfirmation();
    return () => { isMounted = false; };
  }, [attempt, attemptId, exam, result, role, token]);

  const timeTakenSeconds = useMemo(() => {
    if (initialSubmission?.time_taken_seconds != null) return initialSubmission.time_taken_seconds;
    if (!attempt?.created_at || !attempt?.submitted_at) return 0;
    return Math.round((new Date(attempt.submitted_at).getTime() - new Date(attempt.created_at).getTime()) / 1000);
  }, [attempt, initialSubmission]);

  if (!token) return <Navigate to="/login" replace />;
  if (role !== "student") return <Navigate to={`/${role || "student"}-dashboard`} replace />;

  if (isLoading) {
    return (
      <main className="submission-shell">
        <section className="submission-card">
          <p className="empty-state">Loading confirmation…</p>
        </section>
      </main>
    );
  }

  return (
    <main className="submission-shell">
      <section className="submission-card" aria-labelledby="submission-title">
        {/* Success icon */}
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          background: "linear-gradient(135deg, #d1fae5, #a7f3d0)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "2rem", marginBottom: 24,
          border: "3px solid #6ee7b7",
          boxShadow: "0 4px 16px rgba(5,150,105,0.2)"
        }}>
          ✅
        </div>

        <p className="eyebrow" style={{ color: "#059669" }}>Exam submitted</p>
        <h1 id="submission-title" style={{ marginBottom: 8 }}>All done!</h1>
        <p style={{ color: "#64748b", marginBottom: 24, lineHeight: 1.7 }}>
          Your answers have been recorded. Results are processed automatically — check below to view your score.
        </p>

        {error && <div className="alert alert-error" style={{ marginBottom: 16 }}><Icon name="warning" size={16} /> {error}</div>}

        <dl className="submission-summary">
          <div>
            <dt>Exam</dt>
            <dd>{exam?.title || "Exam"}</dd>
          </div>
          {exam?.subject && (
            <div>
              <dt>Subject</dt>
              <dd>{exam.subject}</dd>
            </div>
          )}
          <div>
            <dt>Time taken</dt>
            <dd>{formatDuration(timeTakenSeconds)}</dd>
          </div>
          <div>
            <dt>Submitted at</dt>
            <dd>{formatDateTime(attempt?.submitted_at || result?.published_at)}</dd>
          </div>
        </dl>

        <div className="submission-actions">
          {result?.id ? (
            <Link className="primary-button" to={`/student/results/${result.id}`}>
              View my result →
            </Link>
          ) : null}
          <Link className="secondary-button" to="/student/exams">Back to exams</Link>
          <Link className="secondary-button" to="/student/report-card">My report card</Link>
        </div>
      </section>
    </main>
  );
}
