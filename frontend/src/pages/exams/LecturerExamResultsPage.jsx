import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { getAuthToken, getStoredRole } from "../../services/authStorage";
import { getExamResults } from "../../services/examService";
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
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token || role !== "lecturer") {
      return;
    }

    let isMounted = true;

    async function loadResults() {
      try {
        const data = await getExamResults(id);
        if (isMounted) {
          setExam(data.exam);
          setResults(data.results || []);
          setSummary(data.summary || null);
          setError("");
        }
      } catch (requestError) {
        if (isMounted) {
          setError(requestError.response?.data?.message || "Unable to load exam results.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadResults();

    return () => {
      isMounted = false;
    };
  }, [id, role, token]);

  const filteredResults = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = normalizedQuery
      ? results.filter((result) =>
          `${result.studentName || ""} ${result.studentNumber || ""}`.toLowerCase().includes(normalizedQuery)
        )
      : results;

    return [...filtered].sort((left, right) => {
      const direction = sort.direction === "asc" ? 1 : -1;
      if (sort.key === "score") {
        return (Number(left.score || 0) - Number(right.score || 0)) * direction;
      }
      return String(left.studentName || "").localeCompare(String(right.studentName || "")) * direction;
    });
  }, [query, results, sort]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (role !== "lecturer") {
    return <Navigate to={`/${role || "student"}-dashboard`} replace />;
  }

  function handleSort(key) {
    setSort((current) => ({
      key,
      direction: current.key === key && current.direction === "desc" ? "asc" : "desc"
    }));
  }

  return (
    <main className="admin-shell">
      <section className="admin-header" aria-labelledby="results-title">
        <div>
          <p className="eyebrow">Results</p>
          <h1 id="results-title">{exam?.title || "Exam Results"}</h1>
          <p className="dashboard-copy">Review class performance and student submissions.</p>
        </div>
        <div className="header-actions">
          <Link className="secondary-button" to={`/lecturer/exams/${id}`}>
            Back to exam
          </Link>
        </div>
      </section>

      {error ? <div className="alert alert-error admin-alert">{error}</div> : null}

      <section className="detail-panel wide" aria-label="Class performance summary">
        {isLoading ? (
          <p className="empty-state">Loading results...</p>
        ) : summary ? (
          <>
            <div className="result-summary-grid lecturer-results-summary">
              <SummaryCard label="Class Average" value={`${formatNumber(summary.classAverage)}%`} />
              <SummaryCard label="Pass Rate" value={`${formatNumber(summary.passRate)}%`} />
              <SummaryCard label="Highest Score" value={formatNumber(summary.highestScore)} />
              <SummaryCard label="Lowest Score" value={formatNumber(summary.lowestScore)} />
            </div>

            <div className="admin-tools results-tools">
              <label className="field search-field">
                <span>Search</span>
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by student name or ID"
                />
              </label>
              <p className="muted-text">
                Showing {filteredResults.length} of {results.length} submitted results
              </p>
            </div>

            {filteredResults.length > 0 ? (
              <div className="table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>
                        <button className="table-sort-button" type="button" onClick={() => handleSort("studentName")}>
                          Student Name {sortIndicator(sort, "studentName")}
                        </button>
                      </th>
                      <th>Student ID</th>
                      <th>
                        <button className="table-sort-button" type="button" onClick={() => handleSort("score")}>
                          Score {sortIndicator(sort, "score")}
                        </button>
                      </th>
                      <th>Percentage</th>
                      <th>Grade</th>
                      <th>Pass/Fail</th>
                      <th>Submitted At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResults.map((result) => (
                      <tr key={result.resultId}>
                        <td>{result.studentName}</td>
                        <td>{result.studentNumber || "Not set"}</td>
                        <td>
                          {formatNumber(result.score)} / {formatNumber(result.maxScore)}
                        </td>
                        <td>{formatNumber(result.percentage)}%</td>
                        <td>
                          <span className="grade-badge compact">{result.grade || "F"}</span>
                        </td>
                        <td>
                          <span className={`status-badge compact ${result.passed ? "pass" : "fail"}`}>
                            {result.passed ? "Pass" : "Fail"}
                          </span>
                        </td>
                        <td>{formatDateTime(result.submittedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="empty-state">No matching submitted results.</p>
            )}
          </>
        ) : (
          <p className="empty-state">No results are available yet.</p>
        )}
      </section>
    </main>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function sortIndicator(sort, key) {
  if (sort.key !== key) {
    return "";
  }
  return sort.direction === "asc" ? "↑" : "↓";
}

function formatNumber(value) {
  const number = Number(value || 0);
  return Number.isInteger(number) ? String(number) : number.toFixed(2);
}

function formatDateTime(value) {
  if (!value) {
    return "Not submitted";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}
