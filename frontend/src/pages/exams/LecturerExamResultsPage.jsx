import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { getAuthToken, getStoredRole } from "../../services/authStorage";
import { getExam, getExamResults } from "../../services/examService";
import { downloadResultPdf } from "../../services/reportService";
import "./ExamTakingPage.css";

export default function LecturerExamResultsPage() {
  const { id } = useParams();
  const token = getAuthToken();
  const role = getStoredRole();
  const [exam, setExam] = useState(null);
  const [results, setResults] = useState([]);
  const [summary, setSummary] = useState(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState({ key: "score", direction: "desc" });
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingAttemptId, setDownloadingAttemptId] = useState("");
  const [error, setError] = useState("");

  function canViewResults(examData) {
    return examData?.status === "Archived" || (examData?.endAt && new Date(examData.endAt) <= new Date());
  }

  useEffect(() => {
    if (!token || role !== "lecturer") return;
    let isMounted = true;
    async function loadResults() {
      try {
        const examData = await getExam(id);
        if (!canViewResults(examData)) {
          if (isMounted) {
            setExam(examData);
            setResults([]);
            setSummary(null);
            setError("Results are available after the exam ends.");
          }
          return;
        }

        const data = await getExamResults(id);
        if (isMounted) { setExam(data.exam); setResults(data.results || []); setSummary(data.summary || null); setError(""); }
      } catch (err) {
        if (isMounted) setError(err.response?.data?.message || "Unable to load exam results.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadResults();
    return () => { isMounted = false; };
  }, [id, role, token]);

  const filteredResults = useMemo(() => {
    const term = query.trim().toLowerCase();
    const filtered = term
      ? results.filter(r => `${r.studentName || ""} ${r.studentNumber || ""}`.toLowerCase().includes(term))
      : results;
    return [...filtered].sort((a, b) => {
      const dir = sort.direction === "asc" ? 1 : -1;
      if (sort.key === "score") return (Number(a.score || 0) - Number(b.score || 0)) * dir;
      return String(a.studentName || "").localeCompare(String(b.studentName || "")) * dir;
    });
  }, [query, results, sort]);

  if (!token) return <Navigate to="/login" replace />;
  if (role !== "lecturer") return <Navigate to={`/${role || "student"}-dashboard`} replace />;

  function handleSort(key) {
    setSort(cur => ({ key, direction: cur.key === key && cur.direction === "desc" ? "asc" : "desc" }));
  }

  async function handleDownloadPdf(attemptId) {
    setDownloadingAttemptId(attemptId); setError("");
    try { await downloadResultPdf(attemptId); }
    catch { setError("Unable to download PDF report."); }
    finally { setDownloadingAttemptId(""); }
  }

  function sortIcon(key) {
    if (sort.key !== key) return <span style={{ opacity: 0.3, marginLeft: 4 }}>↕</span>;
    return <span style={{ marginLeft: 4, color: "#006880" }}>{sort.direction === "asc" ? "↑" : "↓"}</span>;
  }

  const passCount = results.filter(r => r.passed).length;
  const failCount = results.filter(r => !r.passed).length;

  return (
    <main className="admin-shell">
      <section className="admin-header" aria-labelledby="results-title">
        <div>
          <p className="eyebrow">Exam Results</p>
          <h1 id="results-title">{exam?.title || "Exam Results"}</h1>
          <p className="dashboard-copy">{exam?.subject && <span style={{ marginRight: 12 }}>{exam.subject}</span>}Review class performance and individual submissions.</p>
        </div>
        <div className="header-actions">
          <Link className="secondary-button" to={`/lecturer/exams/${id}`} style={{ minHeight: 40, padding: "8px 16px" }}>← Back to exam</Link>
          <Link className="secondary-button" to="/lecturer/analytics" style={{ minHeight: 40, padding: "8px 16px" }}>📊 Analytics</Link>
        </div>
      </section>

      {error && <div className="alert alert-error admin-alert">⚠ {error}</div>}

      {isLoading ? (
        <div className="detail-panel wide"><p className="empty-state">Loading results…</p></div>
      ) : !summary ? (
        <div className="detail-panel wide">
          <div style={{ textAlign: "center", padding: "48px 24px" }}>
            <div style={{ fontSize: "3rem", marginBottom: 16 }}>📋</div>
            <h3 style={{ marginBottom: 8 }}>No results yet</h3>
            <p style={{ color: "#64748b" }}>Students haven't submitted any attempts for this exam.</p>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 20 }}>
          {/* Summary stat cards */}
          <div className="stat-grid">
            <div className="stat-card teal">
              <div className="stat-card-label">Class Average</div>
              <div className="stat-card-value">{formatNumber(summary.classAverage)}%</div>
              <div className="stat-card-sub">mean score</div>
            </div>
            <div className="stat-card emerald">
              <div className="stat-card-label">Pass Rate</div>
              <div className="stat-card-value">{formatNumber(summary.passRate)}%</div>
              <div className="stat-card-sub">{passCount} passed · {failCount} failed</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-label">Highest Score</div>
              <div className="stat-card-value">{formatNumber(summary.highestScore)}</div>
              <div className="stat-card-sub">top marks</div>
            </div>
            <div className="stat-card rose">
              <div className="stat-card-label">Lowest Score</div>
              <div className="stat-card-value">{formatNumber(summary.lowestScore)}</div>
              <div className="stat-card-sub">minimum achieved</div>
            </div>
          </div>

          {/* Pass/fail visual bar */}
          {results.length > 0 && (
            <div style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 16, padding: "18px 22px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontWeight: 800, fontSize: "0.875rem", color: "#334155" }}>Pass vs Fail Breakdown</span>
                <span style={{ fontSize: "0.8rem", color: "#64748b" }}>{results.length} total submissions</span>
              </div>
              <div style={{ height: 12, borderRadius: 999, background: "#e2e8f0", overflow: "hidden", display: "flex" }}>
                <div style={{ width: `${(passCount / results.length) * 100}%`, background: "#059669", borderRadius: "999px 0 0 999px", transition: "width 0.6s ease" }} />
                <div style={{ width: `${(failCount / results.length) * 100}%`, background: "#f43f5e", borderRadius: failCount === results.length ? 999 : "0 999px 999px 0", transition: "width 0.6s ease" }} />
              </div>
              <div style={{ display: "flex", gap: 20, marginTop: 10 }}>
                <span style={{ display: "flex", gap: 6, alignItems: "center", fontSize: "0.8rem", color: "#64748b" }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#059669", display: "inline-block" }} />
                  Pass: {passCount} ({Math.round((passCount / results.length) * 100)}%)
                </span>
                <span style={{ display: "flex", gap: 6, alignItems: "center", fontSize: "0.8rem", color: "#64748b" }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#f43f5e", display: "inline-block" }} />
                  Fail: {failCount} ({Math.round((failCount / results.length) * 100)}%)
                </span>
              </div>
            </div>
          )}

          {/* Search + count */}
          <div className="results-tools">
            <div className="field search-field">
              <label htmlFor="results-search">Search students</label>
              <input id="results-search" type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by name or student ID…" />
            </div>
            <p className="muted-text" style={{ alignSelf: "flex-end" }}>
              Showing <strong>{filteredResults.length}</strong> of <strong>{results.length}</strong> submissions
            </p>
          </div>

          {/* Results table */}
          {filteredResults.length > 0 ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>
                      <button className="table-sort-button" type="button" onClick={() => handleSort("studentName")}>
                        Student {sortIcon("studentName")}
                      </button>
                    </th>
                    <th>Student ID</th>
                    <th>
                      <button className="table-sort-button" type="button" onClick={() => handleSort("score")}>
                        Score {sortIcon("score")}
                      </button>
                    </th>
                    <th>Percentage</th>
                    <th>Grade</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th>PDF</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResults.map(result => (
                    <tr key={result.resultId}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{
                            width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                            background: result.passed ? "#d1fae5" : "#ffe4e6",
                            color: result.passed ? "#065f46" : "#be123c",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "0.78rem", fontWeight: 900
                          }}>
                            {result.studentName?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                          <span style={{ fontWeight: 700 }}>{result.studentName}</span>
                        </div>
                      </td>
                      <td style={{ color: "#64748b", fontSize: "0.875rem" }}>{result.studentNumber || "—"}</td>
                      <td style={{ fontWeight: 700 }}>{formatNumber(result.score)} / {formatNumber(result.maxScore)}</td>
                      <td style={{ fontWeight: 800, color: result.passed ? "#059669" : "#f43f5e" }}>{formatNumber(result.percentage)}%</td>
                      <td><span className="grade-badge compact">{result.grade || "F"}</span></td>
                      <td><span className={`status-badge compact ${result.passed ? "pass" : "fail"}`}>{result.passed ? "✓ Pass" : "✗ Fail"}</span></td>
                      <td style={{ fontSize: "0.8rem", color: "#64748b" }}>{formatDateTime(result.submittedAt)}</td>
                      <td>
                        <button className="table-button" type="button" onClick={() => handleDownloadPdf(result.attemptId)} disabled={downloadingAttemptId === result.attemptId}>
                          {downloadingAttemptId === result.attemptId ? "…" : "⬇ PDF"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="detail-panel wide">
              <p className="empty-state">No results match your search.</p>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

function formatNumber(value) {
  const n = Number(value || 0);
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

function formatDateTime(value) {
  if (!value) return "Not submitted";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
