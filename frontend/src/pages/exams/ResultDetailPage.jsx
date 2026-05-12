import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { getAuthToken, getStoredRole } from "../../services/authStorage";
import { downloadResultPdf } from "../../services/reportService";
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
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token || role !== "student") return;
    let isMounted = true;
    async function loadResult() {
      try {
        const detail = await getResultDetail(resultId);
        if (isMounted) { setResult(detail.result); setExam(detail.exam); setQuestions(detail.questions || []); }
      } catch { if (isMounted) setError("Unable to load result."); }
      finally { if (isMounted) setIsLoading(false); }
    }
    loadResult();
    return () => { isMounted = false; };
  }, [resultId, role, token]);

  if (!token) return <Navigate to="/login" replace />;
  if (role !== "student") return <Navigate to={`/${role || "student"}-dashboard`} replace />;

  async function handleDownloadPdf() {
    const attemptId = result?.attempt_id || result?.attemptId;
    if (!attemptId) return;
    setIsDownloading(true); setError("");
    try { await downloadResultPdf(attemptId); }
    catch { setError("Unable to download PDF report."); }
    finally { setIsDownloading(false); }
  }

  const totalScore = result ? (result.total_score ?? result.totalScore ?? 0) : 0;
  const maxScore = result ? (result.max_score ?? result.maxScore ?? 0) : 0;
  const passed = result ? (result.is_passed ?? result.passed) : false;
  const pct = result ? Number(result.percentage || 0) : 0;

  return (
    <main className="result-detail-shell">
      <section className="result-detail-panel" aria-labelledby="result-title">
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
          <div>
            <p className="eyebrow">My Results</p>
            <h1 id="result-title" style={{ marginBottom: 4 }}>{exam?.title || "Exam Result"}</h1>
            {exam?.subject && <p style={{ color: "#64748b", margin: 0, fontWeight: 600 }}>{exam.subject}</p>}
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-start" }}>
            {result && (
              <button className="primary-button" type="button" onClick={handleDownloadPdf} disabled={isDownloading} style={{ minHeight: 40, padding: "8px 16px", fontSize: "0.875rem" }}>
                {isDownloading ? "Downloading…" : "⬇ Download PDF"}
              </button>
            )}
            <Link className="secondary-button" to="/student/exams" style={{ minHeight: 40, padding: "8px 16px", fontSize: "0.875rem" }}>← Back to exams</Link>
          </div>
        </div>

        {isLoading && <p className="empty-state">Loading result…</p>}
        {error && <div className="alert alert-error admin-alert">⚠ {error}</div>}

        {result && (
          <>
            {/* Score circle + summary */}
            <div style={{ display: "flex", alignItems: "center", gap: 28, marginBottom: 32, flexWrap: "wrap" }}>
              {/* Circle */}
              <div style={{ position: "relative", width: 110, height: 110, flexShrink: 0 }}>
                <svg width="110" height="110" style={{ transform: "rotate(-90deg)" }}>
                  <circle cx="55" cy="55" r="46" fill="none" stroke="#e2e8f0" strokeWidth="8"/>
                  <circle cx="55" cy="55" r="46" fill="none"
                    stroke={passed ? "#059669" : "#f43f5e"} strokeWidth="8"
                    strokeDasharray={`${2 * Math.PI * 46}`}
                    strokeDashoffset={`${2 * Math.PI * 46 * (1 - pct / 100)}`}
                    strokeLinecap="round"/>
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2 }}>
                  <span style={{ fontSize: "1.5rem", fontWeight: 900, color: "#0f172a", lineHeight: 1 }}>{Math.round(pct)}%</span>
                  <span style={{ fontSize: "0.65rem", fontWeight: 800, textTransform: "uppercase", color: "#64748b", letterSpacing: "0.05em" }}>Score</span>
                </div>
              </div>

              {/* Pass/Fail badge + grade */}
              <div style={{ display: "grid", gap: 12 }}>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <span className={`status-badge ${passed ? "pass" : "fail"}`} style={{ fontSize: "1rem", padding: "6px 16px" }}>
                    {passed ? "✓ Passed" : "✗ Failed"}
                  </span>
                  <span className="grade-badge" style={{ fontSize: "1rem", padding: "6px 16px" }}>
                    Grade {result.grade || "F"}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 24 }}>
                  <div>
                    <div style={{ fontSize: "0.72rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b" }}>Raw Score</div>
                    <div style={{ fontWeight: 900, fontSize: "1.3rem", color: "#0f172a" }}>{formatNumber(totalScore)} <span style={{ fontSize: "0.9rem", color: "#64748b", fontWeight: 600 }}>/ {formatNumber(maxScore)}</span></div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.72rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b" }}>Questions</div>
                    <div style={{ fontWeight: 900, fontSize: "1.3rem", color: "#0f172a" }}>{questions.length}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.72rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b" }}>Correct</div>
                    <div style={{ fontWeight: 900, fontSize: "1.3rem", color: "#059669" }}>{questions.filter(q => q.isCorrect).length}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Question-by-question breakdown */}
            {questions.length > 0 && (
              <section className="result-review" aria-labelledby="answers-title">
                <div className="result-section-header">
                  <h2 id="answers-title">Answer Review</h2>
                  <span>
                    {questions.filter(q => q.isCorrect).length} correct · {questions.filter(q => !q.isCorrect).length} wrong
                  </span>
                </div>
                <div className="result-question-list">
                  {questions.map((question, index) => {
                    const isCorrect = Boolean(question.isCorrect);
                    return (
                      <article key={question.id} className={`result-question-card ${isCorrect ? "correct" : "wrong"}`}>
                        <div className="result-question-topline">
                          <h3>
                            <span style={{ marginRight: 8, fontSize: "1rem" }}>{isCorrect ? "✅" : "❌"}</span>
                            Question {index + 1}
                          </h3>
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
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </section>
    </main>
  );
}

function formatNumber(value) {
  const n = Number(value || 0);
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}
