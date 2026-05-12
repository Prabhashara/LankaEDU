import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { getAuthToken, getStoredRole } from "../../services/authStorage";
import { getExam } from "../../services/examService";
import { addQuestionToExam, getQuestionBank, getQuestions } from "../../services/questionService";

const questionTypes = [
  { value: "", label: "All types" },
  { value: "MCQ", label: "MCQ" },
  { value: "TRUE_FALSE", label: "True/False" },
  { value: "SHORT_ANSWER", label: "Short Answer" }
];

function formatQuestionType(type) {
  const labels = {
    MCQ: "MCQ",
    TRUE_FALSE: "True/False",
    SHORT_ANSWER: "Short Answer"
  };
  return labels[type] || type;
}

function previewText(value) {
  if (!value || value.length <= 130) {
    return value;
  }

  return `${value.slice(0, 127)}...`;
}

function sourceKey(question) {
  return question.sourceQuestionId || question.id;
}

export default function QuestionBankPage() {
  const { examId } = useParams();
  const token = getAuthToken();
  const role = getStoredRole();
  const [exam, setExam] = useState(null);
  const [bankQuestions, setBankQuestions] = useState([]);
  const [examQuestions, setExamQuestions] = useState([]);
  const [filters, setFilters] = useState({ type: "", subject: "", search: "" });
  const [toast, setToast] = useState("");
  const [warning, setWarning] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [actionQuestionId, setActionQuestionId] = useState("");

  useEffect(() => {
    if (!token || role !== "lecturer") {
      return;
    }

    let isMounted = true;

    async function loadBank() {
      try {
        const [examData, bankData, currentQuestions] = await Promise.all([
          getExam(examId),
          getQuestionBank(),
          getQuestions(examId)
        ]);

        if (isMounted) {
          setExam(examData);
          setBankQuestions(bankData);
          setExamQuestions(currentQuestions);
          setError("");
        }
      } catch (_requestError) {
        if (isMounted) {
          setError("Unable to load the question bank.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadBank();

    return () => {
      isMounted = false;
    };
  }, [examId, role, token]);

  const subjects = useMemo(() => {
    return [...new Set(bankQuestions.map((question) => question.subject).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b)
    );
  }, [bankQuestions]);

  const existingSourceKeys = useMemo(() => {
    return new Set(examQuestions.map(sourceKey));
  }, [examQuestions]);

  const filteredQuestions = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    return bankQuestions.filter((question) => {
      const matchesType = !filters.type || question.type === filters.type;
      const matchesSubject = !filters.subject || question.subject === filters.subject;
      const matchesSearch = !search || (question.questionText || "").toLowerCase().includes(search);
      return matchesType && matchesSubject && matchesSearch;
    });
  }, [bankQuestions, filters]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (role !== "lecturer") {
    return <Navigate to={`/${role || "student"}-dashboard`} replace />;
  }

  function handleFilterChange(event) {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  }

  async function handleAdd(question) {
    setToast("");
    setWarning("");
    setError("");

    if (existingSourceKeys.has(sourceKey(question))) {
      setWarning("This question is already linked to this exam.");
      return;
    }

    setActionQuestionId(question.id);

    try {
      const addedQuestion = await addQuestionToExam(examId, question.id);
      setExamQuestions((current) => [...current, addedQuestion]);
      setToast("Question added to exam.");
    } catch (requestError) {
      const message = requestError.response?.data?.message || "Unable to add question to exam.";
      if (requestError.response?.status === 409) {
        setWarning(message);
      } else {
        setError(message);
      }
    } finally {
      setActionQuestionId("");
    }
  }

  return (
    <main className="admin-shell">
      <section className="admin-header" aria-labelledby="question-bank-title">
        <div>
          <p className="eyebrow">Question Bank</p>
          <h1 id="question-bank-title">Add Questions to {exam?.title || "Exam"}</h1>
          <p className="dashboard-copy">Reuse questions you have already created across your exams.</p>
        </div>
        <div className="header-actions">
          <Link className="secondary-button" to={`/lecturer/exams/${examId}`}>
            Back to exam
          </Link>
        </div>
      </section>

      {toast ? <div className="toast" role="status">{toast}</div> : null}
      {warning ? <div className="alert alert-warning admin-alert" role="status">{warning}</div> : null}
      {error ? <div className="alert alert-error admin-alert">{error}</div> : null}

      <section className="detail-panel wide" aria-label="Question bank filters and results">
        <div className="bank-summary" role="status">
          <span>{filteredQuestions.length} questions shown</span>
          <span>{examQuestions.length} questions in this exam</span>
        </div>

        <div className="bank-filters">
          <div className="field">
            <label htmlFor="type">Type</label>
            <select id="type" name="type" value={filters.type} onChange={handleFilterChange}>
              {questionTypes.map((type) => (
                <option key={type.value || "all"} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="subject">Subject</label>
            <select id="subject" name="subject" value={filters.subject} onChange={handleFilterChange}>
              <option value="">All subjects</option>
              {subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="search">Search</label>
            <input
              id="search"
              name="search"
              type="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search question text"
            />
          </div>
        </div>

        {isLoading ? (
          <p className="empty-state">Loading question bank...</p>
        ) : filteredQuestions.length > 0 ? (
          <div className="question-list">
            {filteredQuestions.map((question) => {
              const alreadyAdded = existingSourceKeys.has(sourceKey(question));
              return (
                <article className="question-item" key={question.id}>
                  <div className="question-row-main bank-question-row">
                    <div>
                      <div className="question-meta">
                        <span>{formatQuestionType(question.type)}</span>
                        <span>{question.subject}</span>
                        <span>{question.marks} marks</span>
                        <span>{question.examTitle}</span>
                      </div>
                      <h3>{previewText(question.questionText)}</h3>
                    </div>
                    <div className="row-actions">
                      <button
                        className={alreadyAdded ? "table-button added" : "table-button"}
                        type="button"
                        onClick={() => handleAdd(question)}
                        disabled={actionQuestionId === question.id}
                      >
                        {actionQuestionId === question.id ? "Adding..." : alreadyAdded ? "Added" : "Add to Exam"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="empty-state">No questions match the current filters.</p>
        )}
      </section>
    </main>
  );
}
