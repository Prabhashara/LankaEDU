import { CategoryScale, Chart, Legend, LineController, LineElement, LinearScale, PointElement, Tooltip } from "chart.js";
import { useEffect, useRef, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { getAuthToken, getStoredRole, getStoredUserId } from "../../services/authStorage";
import { getStudentReport } from "../../services/reportService";
import "./ExamTakingPage.css";

Chart.register(CategoryScale, Legend, LineController, LineElement, LinearScale, PointElement, Tooltip);

export default function StudentReportCardPage() {
  const token = getAuthToken();
  const role = getStoredRole();
  const userId = getStoredUserId();
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [themeVersion, setThemeVersion] = useState(0);

  useEffect(() => {
    const onThemeChange = () => setThemeVersion(version => version + 1);
    window.addEventListener("online-exam:theme-change", onThemeChange);
    return () => window.removeEventListener("online-exam:theme-change", onThemeChange);
  }, []);

  useEffect(() => {
    if (!token || role !== "student" || !userId) return;
    let isMounted = true;
    async function loadReport() {
      try {
        const data = await getStudentReport(userId);
        if (isMounted) { setReport(data); setError(""); }
      } catch { if (isMounted) setError("Unable to load report card."); }
      finally { if (isMounted) setIsLoading(false); }
    }
    loadReport();
    return () => { isMounted = false; };
  }, [role, token, userId]);

  useEffect(() => {
    if (!report?.results?.length || !chartRef.current) {
      chartInstance.current?.destroy(); return;
    }
    chartInstance.current?.destroy();
    const chartStyle = getComputedStyle(document.documentElement);
    const chartText = chartStyle.getPropertyValue("--app-text-muted").trim() || "#64748b";
    const chartGrid = chartStyle.getPropertyValue("--app-border").trim() || "#e2e8f0";
    chartInstance.current = new Chart(chartRef.current, {
      type: "bar",
      data: {
        labels: report.results.map(r => formatShortDate(r.submittedAt)),
        datasets: [{
          label: "Score %",
          data: report.results.map(r => Number(r.percentage || 0)),
          backgroundColor: report.results.map(r => r.passed ? "rgba(5,150,105,0.75)" : "rgba(244,63,94,0.75)"),
          borderColor: report.results.map(r => r.passed ? "#059669" : "#f43f5e"),
          borderWidth: 2,
          borderRadius: 6,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: ctx => `${formatNumber(ctx.parsed.y)}%` } }
        },
        scales: {
          x: { ticks: { color: chartText }, title: { display: true, text: "Exam date", color: chartText }, grid: { display: false } },
          y: { beginAtZero: true, max: 100, title: { display: true, text: "Score (%)", color: chartText }, ticks: { color: chartText, callback: v => `${v}%` }, grid: { color: chartGrid } }
        }
      }
    });
    return () => chartInstance.current?.destroy();
  }, [report, themeVersion]);

  if (!token) return <Navigate to="/login" replace />;
  if (role !== "student") return <Navigate to={`/${role || "student"}-dashboard`} replace />;

  const results = report?.results || [];
  const summary = report?.summary;

  return (
    <main className="admin-shell">
      <section className="admin-header" aria-labelledby="report-card-title">
        <div>
          <p className="eyebrow">Student Portal</p>
          <h1 id="report-card-title">My Report Card</h1>
          <p className="dashboard-copy">Track your exam performance and progress over time.</p>
        </div>
        <div className="header-actions">
          <Link className="secondary-button" to="/student-dashboard" style={{ minHeight: 40, padding: "8px 16px" }}>← Dashboard</Link>
        </div>
      </section>

      {error && <div className="alert alert-error admin-alert">⚠ {error}</div>}

      {isLoading ? (
        <div className="detail-panel wide"><p className="empty-state">Loading report card…</p></div>
      ) : results.length === 0 ? (
        <div className="detail-panel wide">
          <div style={{ textAlign: "center", padding: "48px 24px" }}>
            <div style={{ fontSize: "3rem", marginBottom: 16 }}>📊</div>
            <h3 style={{ color: "#334155", marginBottom: 8 }}>No exams completed yet</h3>
            <p style={{ color: "#64748b", marginBottom: 24 }}>Take your first exam to start building your report card.</p>
            <Link className="primary-button" to="/student/exams">Browse available exams</Link>
          </div>
        </div>
      ) : (
        <div className="analytics-panel">
          {/* Summary stat cards */}
          {summary && (
            <div className="stat-grid">
              <div className="stat-card teal">
                <div className="stat-card-label">Exams Taken</div>
                <div className="stat-card-value">{summary.totalExamsTaken}</div>
                <div className="stat-card-sub">completed</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-label">Average Score</div>
                <div className="stat-card-value">{formatNumber(summary.averageScore)}%</div>
                <div className="stat-card-sub">across all exams</div>
              </div>
              <div className="stat-card emerald">
                <div className="stat-card-label">Pass Rate</div>
                <div className="stat-card-value">{formatNumber(summary.passRate)}%</div>
                <div className="stat-card-sub">exams passed</div>
              </div>
              <div className="stat-card amber">
                <div className="stat-card-label">Best Grade</div>
                <div className="stat-card-value">{summary.bestGrade || "—"}</div>
                <div className="stat-card-sub">highest achieved</div>
              </div>
            </div>
          )}

          {/* Bar chart */}
          <article className="analytics-card">
            <div className="result-section-header">
              <h2>Score History</h2>
              <span style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <span style={{ display: "flex", gap: 6, alignItems: "center", fontSize: "0.8rem", color: "#64748b" }}>
                  <span style={{ width: 12, height: 12, borderRadius: 3, background: "rgba(5,150,105,0.75)", display: "inline-block" }}></span> Pass
                </span>
                <span style={{ display: "flex", gap: 6, alignItems: "center", fontSize: "0.8rem", color: "#64748b" }}>
                  <span style={{ width: 12, height: 12, borderRadius: 3, background: "rgba(244,63,94,0.75)", display: "inline-block" }}></span> Fail
                </span>
              </span>
            </div>
            <div className="chart-frame" style={{ minHeight: 280 }}>
              <canvas ref={chartRef} aria-label="Score history bar chart" />
            </div>
          </article>

          {/* Results table */}
          <article className="analytics-card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "18px 22px 14px" }}>
              <div className="result-section-header" style={{ paddingBottom: 0, borderBottom: "none" }}>
                <h2>All Results</h2>
                <span>{results.length} exams</span>
              </div>
            </div>
            <div className="table-wrap" style={{ borderRadius: 0, border: "none", borderTop: "1px solid #e2e8f0", boxShadow: "none" }}>
              <table>
                <thead>
                  <tr>
                    <th>Exam</th>
                    <th>Date</th>
                    <th>Score</th>
                    <th>Percentage</th>
                    <th>Grade</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map(result => (
                    <tr key={result.resultId}>
                      <td>
                        <div style={{ fontWeight: 700 }}>{result.examTitle}</div>
                        <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{result.subject}</div>
                      </td>
                      <td style={{ fontSize: "0.875rem", color: "#64748b" }}>{formatDateTime(result.submittedAt)}</td>
                      <td style={{ fontWeight: 700 }}>{formatNumber(result.score)} / {formatNumber(result.maxScore)}</td>
                      <td style={{ fontWeight: 800, color: result.passed ? "#059669" : "#f43f5e" }}>{formatNumber(result.percentage)}%</td>
                      <td><span className="grade-badge compact">{result.grade || "F"}</span></td>
                      <td><span className={`status-badge compact ${result.passed ? "pass" : "fail"}`}>{result.passed ? "✓ Pass" : "✗ Fail"}</span></td>
                      <td>
                        {result.resultId && (
                          <Link className="table-button" to={`/student/results/${result.resultId}`}>Review</Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </div>
      )}
    </main>
  );
}

function formatNumber(value) {
  const n = Number(value || 0);
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

function formatShortDate(value) {
  if (!value) return "Unknown";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(value));
}

function formatDateTime(value) {
  if (!value) return "Not submitted";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
