import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import { getAttempt } from "../../services/attemptService";
import { getAuthToken, getStoredRole } from "../../services/authStorage";
import { getExam } from "../../services/examService";
import { getResultByAttempt } from "../../services/resultService";
import "./ExamTakingPage.css";

function formatDateTime(value) {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatDuration(seconds) {
  const totalSeconds = Math.max(0, Number(seconds) || 0);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;

  if (minutes === 0) {
    return `${remainingSeconds}s`;
  }

  return `${minutes}m ${remainingSeconds}s`;
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
    if (!token || role !== "student" || (attempt && result && exam)) {
      return;
    }

    let isMounted = true;

    async function loadConfirmation() {
      try {
        const loadedAttempt = attempt || (await getAttempt(attemptId));
        const [loadedResult, loadedExam] = await Promise.all([
          result || getResultByAttempt(attemptId),
          exam || getExam(loadedAttempt.exam_id || loadedAttempt.examId)
        ]);

        if (isMounted) {
          setAttempt(loadedAttempt);
          setResult(loadedResult);
          setExam(loadedExam);
          setError("");
        }
      } catch (_error) {
        if (isMounted) {
          setError("Unable to load submission confirmation.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadConfirmation();

    return () => {
      isMounted = false;
    };
  }, [attempt, attemptId, exam, result, role, token]);

  const timeTakenSeconds = useMemo(() => {
    if (initialSubmission?.time_taken_seconds != null) {
      return initialSubmission.time_taken_seconds;
    }

    if (!attempt?.created_at || !attempt?.submitted_at) {
      return 0;
    }

    return Math.round((new Date(attempt.submitted_at).getTime() - new Date(attempt.created_at).getTime()) / 1000);
  }, [attempt, initialSubmission]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (role !== "student") {
    return <Navigate to={`/${role || "student"}-dashboard`} replace />;
  }

  if (isLoading) {
    return (
      <main className="submission-shell">
        <section className="submission-card">
          <p className="empty-state">Loading confirmation...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="submission-shell">
      <section className="submission-card" aria-labelledby="submission-title">
        <p className="eyebrow">Submitted</p>
        <h1 id="submission-title">Exam submitted successfully</h1>
        {error ? <div className="alert alert-error admin-alert">{error}</div> : null}
        <dl className="submission-summary">
          <div>
            <dt>Exam</dt>
            <dd>{exam?.title || "Exam"}</dd>
          </div>
          <div>
            <dt>Time taken</dt>
            <dd>{formatDuration(timeTakenSeconds)}</dd>
          </div>
          <div>
            <dt>Submission time</dt>
            <dd>{formatDateTime(attempt?.submitted_at || result?.published_at)}</dd>
          </div>
        </dl>
        <div className="submission-actions">
          {result?.id ? (
            <Link className="primary-button" to={`/student/results/${result.id}`}>
              View Result
            </Link>
          ) : null}
          <Link className="secondary-button" to="/student/exams">
            Back to exams
          </Link>
        </div>
      </section>
    </main>
  );
}
