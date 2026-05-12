import { ArcElement, BarController, BarElement, CategoryScale, Chart, DoughnutController, Legend, LinearScale, Tooltip } from "chart.js";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { getAuthToken, getStoredRole } from "../../services/authStorage";
import { getExams } from "../../services/examService";
import { getExamReport } from "../../services/reportService";
import "./ExamTakingPage.css";

Chart.register(ArcElement, BarController, BarElement, CategoryScale, DoughnutController, Legend, LinearScale, Tooltip);

export default function ExamAnalyticsPage() {
  const { id } = useParams();
  const token = getAuthToken();
  const role = getStoredRole();
  const scoreChartRef = useRef(null);
  const donutChartRef = useRef(null);
  const scoreChartInstance = useRef(null);
  const donutChartInstance = useRef(null);
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState(id || "");
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
    if (!token || role !== "lecturer") return;
    let isMounted = true;
    async function loadExams() {
      try {
        const data = await getExams();
        if (isMounted) {
          setExams(data);
          if (!selectedExamId && data.length > 0) setSelectedExamId(data[0].id);
        }
      } catch {
        if (isMounted) { setError("Unable to load exams."); setIsLoading(false); }
      }
    }
    loadExams();
    return () => { isMounted = false; };
  }, [role, token]);

  useEffect(() => {
    if (!token || role !== "lecturer" || !selectedExamId) return;
    let isMounted = true;
    setIsLoading(true);
    async function loadReport() {
      try {
        const data = await getExamReport(selectedExamId);
        if (isMounted) { setReport(data); setError(""); }
      } catch (err) {
        if (isMounted) { setReport(null); setError(err.response?.data?.message || "Unable to load analytics."); }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadReport();
    return () => { isMounted = false; };
  }, [role, selectedExamId, token]);

  useEffect(() => {
    if (!report || !scoreChartRef.current || !donutChartRef.current) return;
    scoreChartInstance.current?.destroy();
    donutChartInstance.current?.destroy();

    const chartStyle = getComputedStyle(document.documentElement);
    const chartText = chartStyle.getPropertyValue("--app-text-muted").trim() || "#64748b";
    const chartGrid = chartStyle.getPropertyValue("--app-border").trim() || "#e2e8f0";
    const chartSurface = chartStyle.getPropertyValue("--app-surface").trim() || "#ffffff";

    scoreChartInstance.current = new Chart(scoreChartRef.current, {
      type: "bar",
      data: {
        labels: report.scoreDistribution.map(b => b.label),
        datasets: [{
          label: "Students",
          data: report.scoreDistribution.map(b => b.count),
          backgroundColor: report.scoreDistribution.map((_, i) => {
            const colors = ["#f43f5e","#fb923c","#f59e0b","#84cc16","#22c55e","#059669"];
            return colors[Math.min(i, colors.length - 1)] + "cc";
          }),
          borderColor: report.scoreDistribution.map((_, i) => {
            const colors = ["#f43f5e","#fb923c","#f59e0b","#84cc16","#22c55e","#059669"];
            return colors[Math.min(i, colors.length - 1)];
          }),
          borderWidth: 2,
          borderRadius: 6,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: ctx => `${report.scoreDistribution[ctx.dataIndex].count} students (${formatNumber(report.scoreDistribution[ctx.dataIndex].percentage)}%)` } }
        },
        scales: {
          x: { ticks: { color: chartText }, title: { display: true, text: "Score range", color: chartText }, grid: { display: false } },
          y: { beginAtZero: true, ticks: { precision: 0, color: chartText }, title: { display: true, text: "Number of students", color: chartText }, grid: { color: chartGrid } }
        }
      }
    });

    donutChartInstance.current = new Chart(donutChartRef.current, {
      type: "doughnut",
      data: {
        labels: [
          `Pass — ${report.passFail.passed} (${formatNumber(report.passFail.passPercentage)}%)`,
          `Fail — ${report.passFail.failed} (${formatNumber(report.passFail.failPercentage)}%)`
        ],
        datasets: [{
          data: [report.passFail.passed, report.passFail.failed],
          backgroundColor: ["#22c55e", "#f43f5e"],
          borderColor: chartSurface,
          borderWidth: 4,
          hoverOffset: 6,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        cutout: "68%",
        plugins: {
          legend: { position: "bottom", labels: { padding: 16, color: chartText, font: { weight: "700" } } },
          tooltip: { callbacks: { label: ctx => ctx.label } }
        }
      }
    });

    return () => {
      scoreChartInstance.current?.destroy();
      donutChartInstance.current?.destroy();
    };
  }, [report, themeVersion]);

  const sortedAccuracy = useMemo(() => {
    return [...(report?.questionAccuracy || [])].sort(
      (a, b) => Number(a.accuracyPercentage || 0) - Number(b.accuracyPercentage || 0)
    );
  }, [report, themeVersion]);

  if (!token) return <Navigate to="/login" replace />;
  if (role !== "lecturer") return <Navigate to={`/${role || "student"}-dashboard`} replace />;

  const selectedExam = exams.find(e => e.id === selectedExamId);

  return (
    <main className="admin-shell">
      <section className="admin-header" aria-labelledby="analytics-title">
        <div>
          <p className="eyebrow">Lecturer Panel</p>
          <h1 id="analytics-title">Exam Analytics</h1>
          <p className="dashboard-copy">Score distribution, pass rate, and question-level accuracy.</p>
        </div>
        <div className="header-actions">
          <Link className="secondary-button" to="/lecturer-dashboard" style={{ minHeight: 40, padding: "8px 16px" }}>← Dashboard</Link>
        </div>
      </section>

      {error && <div className="alert alert-error admin-alert">⚠ {error}</div>}

      <div style={{ display: "grid", gap: 20 }}>
        {/* Exam selector */}
        <div style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 16, padding: "20px 24px", display: "flex", gap: 20, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div className="field" style={{ flex: 1, minWidth: 200 }}>
            <label htmlFor="exam-select">Select Exam</label>
            <select id="exam-select" value={selectedExamId} onChange={e => setSelectedExamId(e.target.value)}>
              <option value="">Choose an exam…</option>
              {exams.map(exam => (
                <option key={exam.id} value={exam.id}>{exam.title} — {exam.subject}</option>
              ))}
            </select>
          </div>
          {report && (
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#006880" }}>{report.attemptCount}</div>
                <div style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em" }}>Submissions</div>
              </div>
              {selectedExam && (
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#334155" }}>{selectedExam.passMark}%</div>
                  <div style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em" }}>Pass Mark</div>
                </div>
              )}
            </div>
          )}
        </div>

        {isLoading && <div style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 16, padding: 32 }}><p className="empty-state">Loading analytics…</p></div>}

        {!isLoading && report && (
          <>
            {/* Charts row */}
            <div className="analytics-chart-grid">
              <article className="analytics-card">
                <div className="result-section-header">
                  <h2>Score Distribution</h2>
                  <span>Students by percentage band</span>
                </div>
                <div className="chart-frame">
                  <canvas ref={scoreChartRef} aria-label="Score distribution bar chart" />
                </div>
                <div className="bucket-list" aria-label="Score distribution counts">
                  {report.scoreDistribution.map(b => (
                    <span key={b.label}>{b.label}: <strong>{b.count}</strong> ({formatNumber(b.percentage)}%)</span>
                  ))}
                </div>
              </article>

              <article className="analytics-card">
                <div className="result-section-header">
                  <h2>Pass vs Fail</h2>
                  <span>Of {report.attemptCount} attempts</span>
                </div>
                <div className="chart-frame donut-frame" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <canvas ref={donutChartRef} aria-label="Pass versus fail donut chart" />
                </div>
                {/* Centre stat overlay hint */}
                <div style={{ display: "flex", gap: 14, justifyContent: "center" }}>
                  <span style={{ display: "flex", gap: 6, alignItems: "center", fontSize: "0.82rem", color: "#64748b", fontWeight: 700 }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
                    {report.passFail.passed} passed
                  </span>
                  <span style={{ display: "flex", gap: 6, alignItems: "center", fontSize: "0.82rem", color: "#64748b", fontWeight: 700 }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#f43f5e", display: "inline-block" }} />
                    {report.passFail.failed} failed
                  </span>
                </div>
              </article>
            </div>

            {/* Question Accuracy table */}
            <article className="analytics-card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "18px 22px 14px" }}>
                <div className="result-section-header" style={{ borderBottom: "none", paddingBottom: 0 }}>
                  <h2>Question Accuracy</h2>
                  <span>Sorted lowest → highest (hardest questions first)</span>
                </div>
              </div>
              {sortedAccuracy.length > 0 ? (
                <div className="table-wrap" style={{ borderRadius: 0, border: "none", borderTop: "1px solid #e2e8f0", boxShadow: "none" }}>
                  <table>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Question Preview</th>
                        <th>Type</th>
                        <th>Correct / Total</th>
                        <th>Accuracy</th>
                        <th>Difficulty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedAccuracy.map(q => {
                        const acc = Number(q.accuracyPercentage || 0);
                        const difficulty = acc < 40 ? { label: "Hard", color: "#be123c", bg: "#ffe4e6" }
                          : acc < 70 ? { label: "Medium", color: "#92400e", bg: "#fef3c7" }
                          : { label: "Easy", color: "#065f46", bg: "#d1fae5" };
                        return (
                          <tr key={q.questionId}>
                            <td style={{ fontWeight: 900, color: "#64748b", fontSize: "0.875rem" }}>#{q.orderNo || "—"}</td>
                            <td style={{ maxWidth: 340 }}>
                              <span style={{ color: "#334155", fontSize: "0.9rem" }}>{previewText(q.questionText)}</span>
                            </td>
                            <td>
                              <span style={{ background: "#f1f5f9", borderRadius: 6, padding: "3px 8px", fontSize: "0.78rem", fontWeight: 800, color: "#475569" }}>
                                {formatType(q.type)}
                              </span>
                            </td>
                            <td style={{ fontWeight: 700, fontSize: "0.9rem" }}>{q.correctCount} / {q.attemptCount}</td>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{ width: 60, height: 6, borderRadius: 999, background: "#e2e8f0", overflow: "hidden" }}>
                                  <div style={{ width: `${acc}%`, height: "100%", background: difficulty.color, borderRadius: 999 }} />
                                </div>
                                <span style={{ fontWeight: 800, fontSize: "0.875rem", color: difficulty.color }}>{formatNumber(acc)}%</span>
                              </div>
                            </td>
                            <td>
                              <span style={{ background: difficulty.bg, color: difficulty.color, borderRadius: 6, padding: "3px 10px", fontSize: "0.78rem", fontWeight: 800 }}>
                                {difficulty.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="empty-state" style={{ padding: "24px" }}>No question data available for this exam.</p>
              )}
            </article>
          </>
        )}

        {!isLoading && !report && !error && selectedExamId && (
          <div style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 16, padding: 32, textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: 12 }}>📊</div>
            <h3 style={{ marginBottom: 8 }}>No data yet</h3>
            <p style={{ color: "#64748b" }}>This exam has no submitted attempts to analyse.</p>
          </div>
        )}
      </div>
    </main>
  );
}

function formatNumber(value) {
  const n = Number(value || 0);
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

function previewText(value) {
  if (!value || value.length <= 90) return value || "";
  return `${value.slice(0, 87)}…`;
}

function formatType(type) {
  const labels = { MCQ: "MCQ", TRUE_FALSE: "True/False", SHORT_ANSWER: "Short Answer" };
  return labels[type] || type;
}
