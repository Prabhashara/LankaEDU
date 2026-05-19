import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { getAuthToken, getStoredRole } from "../../services/authStorage";
import { getApiErrorMessage } from "../../services/errorService";
import { getExam, getExams } from "../../services/examService";
import { addQuestionToExam, getQuestionBank, getQuestions } from "../../services/questionService";
import Icon from "../../components/Icons.jsx";
import { EmptyState, SkeletonGrid } from "../../components/UiKit.jsx";

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
  const location = useLocation();
  const navigate = useNavigate();
  const isDirectBank = !examId;
  const token = getAuthToken();
  const role = getStoredRole();
  const [exam, setExam] = useState(null);
  const [exams, setExams] = useState([]);
  const [targetExamId, setTargetExamId] = useState(examId || "");
  const [bankQuestions, setBankQuestions] = useState([]);
  const [examQuestions, setExamQuestions] = useState([]);
  const [filters, setFilters] = useState({ type: "", subject: "", search: "" });
  const [toast, setToast] = useState("");
  const [warning, setWarning] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTarget, setIsLoadingTarget] = useState(Boolean(examId));
  const [actionQuestionId, setActionQuestionId] = useState("");

  useEffect(() => {
    const stateToast = location.state?.toast;
    if (stateToast) {
      setToast(stateToast);
      navigate(location.pathname, { replace: true });
    }
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    if (!token || role !== "lecturer") {
      return;
    }

    let isMounted = true;

    async function loadBank() {
      try {
        const [bankData, examsData] = await Promise.all([
          getQuestionBank(),
          isDirectBank ? getExams() : Promise.resolve([])
        ]);

        if (isMounted) {
          setBankQuestions(bankData);
          setExams(examsData);
          if (isDirectBank) {
            const draftExam = examsData.find((item) => item.status === "Draft");
            const firstExam = draftExam || examsData[0];
            setTargetExamId(firstExam?.id || "");
            if (!firstExam) {
              setExam(null);
              setExamQuestions([]);
              setIsLoadingTarget(false);
            }
          } else {
            setTargetExamId(examId);
          }
          setError("");
        }
      } catch (requestError) {
        if (isMounted) {
          setError(getApiErrorMessage(requestError, "Unable to load the question bank."));
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
  }, [examId, isDirectBank, role, token]);

  useEffect(() => {
    if (!token || role !== "lecturer" || !targetExamId) {
      if (!targetExamId) {
        setExam(null);
        setExamQuestions([]);
        setIsLoadingTarget(false);
      }
      return;
    }

    let isMounted = true;
    setIsLoadingTarget(true);
    setToast("");
    setWarning("");

    async function loadTargetExam() {
      try {
        const [examData, currentQuestions] = await Promise.all([
          getExam(targetExamId),
          getQuestions(targetExamId)
        ]);

        if (isMounted) {
          setExam(examData);
          setExamQuestions(currentQuestions);
          setError("");
        }
      } catch (requestError) {
        if (isMounted) {
          setExam(null);
          setExamQuestions([]);
          setError(getApiErrorMessage(requestError, "Unable to load the selected exam."));
        }
      } finally {
        if (isMounted) {
          setIsLoadingTarget(false);
        }
      }
    }

    loadTargetExam();

    return () => {
      isMounted = false;
    };
  }, [role, targetExamId, token]);

  const subjects = useMemo(() => {
    return [...new Set(bankQuestions.map((question) => question.subject).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b)
    );
  }, [bankQuestions]);

  const existingSourceKeys = useMemo(() => {
    return new Set(examQuestions.map(sourceKey));
  }, [examQuestions]);

  const canManageQuestions = targetExamId && exam?.status === "Draft" && !isLoadingTarget;
  const newQuestionPath = targetExamId ? `/lecturer/exams/${targetExamId}/questions/new?from=bank` : "";
  const newQuestionDisabledTitle = !targetExamId
    ? "Choose a draft exam before creating a question"
    : isLoadingTarget
      ? "Loading selected exam"
      : "New questions can only be created for draft exams";

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

  function handleTargetExamChange(event) {
    setTargetExamId(event.target.value);
  }

  async function handleAdd(question) {
    setToast("");
    setWarning("");
    setError("");

    if (!targetExamId) {
      setWarning("Choose a draft exam before adding questions.");
      return;
    }

    if (!canManageQuestions) {
      setWarning("Questions can only be added while the exam is in Draft status.");
      return;
    }

    if (existingSourceKeys.has(sourceKey(question))) {
      setWarning("This question is already linked to this exam.");
      return;
    }

    setActionQuestionId(question.id);

    try {
      const addedQuestion = await addQuestionToExam(targetExamId, question.id);
      setExamQuestions((current) => [...current, addedQuestion]);
      setToast("Question added to exam.");
    } catch (requestError) {
      const message = getApiErrorMessage(requestError, "Unable to add question to exam.");
      if (requestError.status === 409) {
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
          <h1 id="question-bank-title">{isDirectBank ? "Question Bank" : `Add Questions to ${exam?.title || "Exam"}`}</h1>
          <p className="dashboard-copy">
            {isDirectBank
              ? "Browse reusable questions, add them to draft exams, or create a new bank question."
              : "Reuse questions you have already created across your exams."}
          </p>
        </div>
        <div className="header-actions">
          {isDirectBank ? (
            <>
              <Link className="secondary-button" to="/lecturer-dashboard">
                <Icon name="arrowLeft" size={16} /> Dashboard
              </Link>
              {canManageQuestions ? (
                <Link className="primary-button" to={newQuestionPath}>
                  <Icon name="plus" size={16} /> New question
                </Link>
              ) : (
                <button className="primary-button" type="button" disabled title={newQuestionDisabledTitle}>
                  <Icon name="lock" size={16} /> New question
                </button>
              )}
              <Link className="primary-button" to="/lecturer/exams/new">
                <Icon name="plus" size={16} /> New exam
              </Link>
            </>
          ) : (
            <Link className="secondary-button" to={`/lecturer/exams/${examId}`}>
              <Icon name="arrowLeft" size={16} /> Back to exam
            </Link>
          )}
        </div>
      </section>

      {toast ? <div className="toast" role="status"><Icon name="check" size={16} /> {toast}</div> : null}
      {!isLoading && !isLoadingTarget && targetExamId && !canManageQuestions ? (
        <div className="alert alert-warning admin-alert" role="status">
          <Icon name="warning" size={16} /> Questions can only be added while the exam is in Draft status.
        </div>
      ) : null}
      {!isLoading && isDirectBank && exams.length === 0 ? (
        <div className="alert alert-warning admin-alert" role="status">
          <Icon name="warning" size={16} /> Create a draft exam before adding bank questions to an exam.
        </div>
      ) : null}
      {warning ? <div className="alert alert-warning admin-alert" role="status"><Icon name="warning" size={16} /> {warning}</div> : null}
      {error ? <div className="alert alert-error admin-alert"><Icon name="warning" size={16} /> {error}</div> : null}

      <section className="detail-panel wide" aria-label="Question bank filters and results">
        <div className="bank-summary" role="status">
          <span>{filteredQuestions.length} questions shown</span>
          <span>{targetExamId ? `${examQuestions.length} questions in selected exam` : "No target exam selected"}</span>
        </div>

        {isDirectBank ? (
          <div className="field" style={{ marginBottom: 16 }}>
            <label htmlFor="target-exam">Add to exam</label>
            <select id="target-exam" value={targetExamId} onChange={handleTargetExamChange} disabled={isLoading || exams.length === 0}>
              {exams.length === 0 ? <option value="">No exams available</option> : null}
              {exams.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title} - {item.subject} ({item.status})
                </option>
              ))}
            </select>
          </div>
        ) : null}

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
          <SkeletonGrid count={5} variant="list" />
        ) : filteredQuestions.length > 0 ? (
          <div className="question-list">
            {filteredQuestions.map((question) => {
              const alreadyAdded = existingSourceKeys.has(sourceKey(question));
              const canEditQuestion = question.examStatus === "Draft";
              return (
                <article className="question-item" key={question.id}>
                  <div className="question-row-main bank-question-row">
                    <div>
                      <div className="question-meta">
                        <span>{formatQuestionType(question.type)}</span>
                        <span>{question.subject}</span>
                        <span>{question.marks} marks</span>
                        <span>{question.examTitle}</span>
                        <span className={`status-pill ${question.examStatus?.toLowerCase()}`}>{question.examStatus}</span>
                      </div>
                      <h3>{previewText(question.questionText)}</h3>
                    </div>
                    <div className="row-actions">
                      <Link
                        className="table-button"
                        to={`/lecturer/exams/${question.examId}/questions/${question.id}/edit?from=bank`}
                        aria-disabled={!canEditQuestion}
                        title={canEditQuestion ? "Edit this question" : "Questions can only be edited while their source exam is Draft"}
                        onClick={(event) => {
                          if (!canEditQuestion) event.preventDefault();
                        }}
                      >
                        Edit
                      </Link>
                      <button
                        className={alreadyAdded ? "table-button added" : "table-button"}
                        type="button"
                        onClick={() => handleAdd(question)}
                        disabled={!canManageQuestions || alreadyAdded || actionQuestionId === question.id}
                      >
                        {actionQuestionId === question.id
                          ? "Adding..."
                          : alreadyAdded
                            ? <><Icon name="check" size={14} /> Added</>
                            : canManageQuestions
                              ? <><Icon name="plus" size={14} /> {isDirectBank ? "Add" : "Add to Exam"}</>
                              : <><Icon name="lock" size={14} /> Locked</>}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon="search"
            title={bankQuestions.length === 0 ? "No questions yet" : "No questions match"}
            message={
              bankQuestions.length === 0
                ? "Create a question in a draft exam to start building your bank."
                : "Try changing the type, subject, or search keyword."
            }
            action={
              isDirectBank && canManageQuestions ? (
                <Link className="primary-button" to={newQuestionPath}>
                  <Icon name="plus" size={16} /> New question
                </Link>
              ) : null
            }
          />
        )}
      </section>
    </main>
  );
}
