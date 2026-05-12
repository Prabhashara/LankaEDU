import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { getAuthToken, getStoredRole } from "../../services/authStorage";
import { getResultDetail } from "../../services/resultService";
import "./ExamTakingPage.css";

export default function ResultDetailPage() {
  const { resultId } = useParams();
  const token = getAuthToken();
  const role = getStoredRole();
  const [result, setResult] = useState(null);
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token || role !== "student") {
      return;
    }

    let isMounted = true;

    async function loadResult() {
      try {
        const detail = await getResultDetail(resultId);
        if (isMounted) {
          setResult(detail.result);
          setExam(detail.exam);
          setQuestions(detail.questions || []);
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
    <main className="result-detail-shell">
      <section className="result-detail-panel" aria-labelledby="result-title">
        <p className="eyebrow">Result</p>
        <h1 id="result-title">{exam?.title || "Exam Result"}</h1>
        {isLoading ? <p className="empty-state">Loading result...</p> : null}
        {error ? <div className="alert alert-error admin-alert">{error}</div> : null}
        {result ? (
          <>
            <ResultSummary result={result} />
            <section className="result-review" aria-labelledby="answers-title">
              <div className="result-section-header">
                <h2 id="answers-title">Answer Review</h2>
                <span>{questions.length} questions</span>
              </div>
              <div className="result-question-list">
                {questions.map((question, index) => (
                  <QuestionReview key={question.id} question={question} number={index + 1} />
                ))}
              </div>
            </section>
          </>
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

function ResultSummary({ result }) {
  const totalScore = result.total_score ?? result.totalScore ?? 0;
  const maxScore = result.max_score ?? result.maxScore ?? 0;
  const passed = result.is_passed ?? result.passed;

  return (
    <dl className="result-summary-grid">
      <div>
        <dt>Score</dt>
        <dd>
          {formatNumber(totalScore)} / {formatNumber(maxScore)}
        </dd>
      </div>
      <div>
        <dt>Percentage</dt>
        <dd>{formatPercentage(result.percentage)}</dd>
      </div>
      <div>
        <dt>Grade</dt>
        <dd>
          <span className="grade-badge">{result.grade || "F"}</span>
        </dd>
      </div>
      <div>
        <dt>Status</dt>
        <dd>
          <span className={`status-badge ${passed ? "pass" : "fail"}`}>{passed ? "Pass" : "Fail"}</span>
        </dd>
      </div>
    </dl>
  );
}

function QuestionReview({ question, number }) {
  const isCorrect = Boolean(question.isCorrect);

  return (
    <article className={`result-question-card ${isCorrect ? "correct" : "wrong"}`}>
      <div className="result-question-topline">
        <h3>Question {number}</h3>
        <span>{formatNumber(question.marksAwarded)} / {formatNumber(question.marks)} marks</span>
      </div>
      <p className="result-question-text">{question.questionText}</p>
      <div className="answer-comparison">
        <div className={`answer-box ${isCorrect ? "correct" : "wrong"}`}>
          <span>Your answer</span>
          <strong>{question.selectedAnswer || "Not answered"}</strong>
        </div>
        <div className="answer-box correct">
          <span>Correct answer</span>
          <strong>{question.correctAnswer || "No correct answer set"}</strong>
        </div>
      </div>
    </article>
  );
}

function formatPercentage(value) {
  const number = Number(value || 0);
  return `${Number.isInteger(number) ? number : number.toFixed(2)}%`;
}

function formatNumber(value) {
  const number = Number(value || 0);
  return Number.isInteger(number) ? String(number) : number.toFixed(2);
}
