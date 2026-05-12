import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { getAuthToken, getStoredRole } from "../../services/authStorage";
import { getExam } from "../../services/examService";
import { getResult } from "../../services/resultService";
import "./ExamTakingPage.css";

export default function ResultDetailPage() {
  const { resultId } = useParams();
  const token = getAuthToken();
  const role = getStoredRole();
  const [result, setResult] = useState(null);
  const [exam, setExam] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token || role !== "student") {
      return;
    }

    let isMounted = true;

    async function loadResult() {
      try {
        const loadedResult = await getResult(resultId);
        const loadedExam = await getExam(loadedResult.exam_id || loadedResult.examId);
        if (isMounted) {
          setResult(loadedResult);
          setExam(loadedExam);
        }
      } catch (_error) {
        if (isMounted) {
          setError("Unable to load result.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadResult();

    return () => {
      isMounted = false;
    };
  }, [resultId, role, token]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (role !== "student") {
    return <Navigate to={`/${role || "student"}-dashboard`} replace />;
  }

  return (
    <main className="submission-shell">
      <section className="submission-card" aria-labelledby="result-title">
        <p className="eyebrow">Result</p>
        <h1 id="result-title">{exam?.title || "Exam Result"}</h1>
        {isLoading ? <p className="empty-state">Loading result...</p> : null}
        {error ? <div className="alert alert-error admin-alert">{error}</div> : null}
        {result ? (
          <dl className="submission-summary">
            <div>
              <dt>Score</dt>
              <dd>
                {result.total_score ?? result.totalScore} / {result.max_score ?? result.maxScore}
              </dd>
            </div>
            <div>
              <dt>Percentage</dt>
              <dd>{result.percentage}%</dd>
            </div>
            <div>
              <dt>Grade</dt>
              <dd>{result.grade}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{result.is_passed || result.passed ? "Passed" : "Failed"}</dd>
            </div>
          </dl>
        ) : null}
        <div className="submission-actions">
          <Link className="secondary-button" to="/student/exams">
            Back to exams
          </Link>
        </div>
      </section>
    </main>
  );
}
