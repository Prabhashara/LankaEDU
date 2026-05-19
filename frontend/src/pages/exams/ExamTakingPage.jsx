import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import CountdownTimer from "../../components/CountdownTimer";
import Icon from "../../components/Icons.jsx";
import { ConfirmModal, EmptyState, SkeletonGrid } from "../../components/UiKit.jsx";
import { createAttempt, submitAttempt } from "../../services/attemptService";
import { getAuthToken, getStoredRole } from "../../services/authStorage";
import { getApiErrorMessage } from "../../services/errorService";
import { getExam } from "../../services/examService";
import "./ExamTakingPage.css";

export default function ExamTakingPage() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const token = getAuthToken();
  const role = getStoredRole();

  const [exam, setExam] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [exitTarget, setExitTarget] = useState(null);
  const [examStarted, setExamStarted] = useState(false);
  const [showStartConfirm, setShowStartConfirm] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  if (!token || role !== "student") {
    return <Navigate to="/login" replace />;
  }

  useEffect(() => {
    let mounted = true;
    async function loadExam() {
      try {
        const data = await getExam(examId);
        if (mounted) {
          setExam(data);
          setError("");
        }
      } catch (requestError) {
        if (mounted) setError(getApiErrorMessage(requestError, "Unable to load exam. Please try again."));
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    loadExam();
    return () => { mounted = false; };
  }, [examId]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (examStarted && !isSubmitting) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [examStarted, isSubmitting]);

  useEffect(() => {
    if (!examStarted) return;

    const handlePopState = (event) => {
      event.preventDefault();
      setShowExitWarning(true);
      window.history.pushState(null, "", window.location.href);
    };

    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [examStarted]);

  async function startExam() {
    try {
      setIsLoading(true);
      const data = await createAttempt(examId);
      setAttempt(data.attempt_id);
      setQuestions(data.questions || []);
      setAnswers({});
      setCurrentQuestionIndex(0);
      setExamStarted(true);
      setShowStartConfirm(false);
      setShowSubmitConfirm(false);
      setError("");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Failed to start exam. Please try again."));
    } finally {
      setIsLoading(false);
    }
  }

  function handleAnswerSelect(questionId, optionId) {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  }

  function goToQuestion(index) {
    if (index >= 0 && index < questions.length) {
      setCurrentQuestionIndex(index);
    }
  }

  const submitExam = useCallback(async () => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      const submission = await submitAttempt(attempt, answers);
      setExamStarted(false);
      setShowSubmitConfirm(false);
      navigate(`/student/attempts/${attempt}/submitted`, {
        replace: true,
        state: { exam, submission }
      });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Failed to submit exam. Please try again."));
      setIsSubmitting(false);
    }
  }, [answers, attempt, exam, isSubmitting, navigate]);

  async function handleTimeUp() {
    await submitExam();
  }

  function handleNavigateAway(target) {
    setExitTarget(target);
    setShowExitWarning(true);
  }

  function confirmExit() {
    setExamStarted(false);
    if (exitTarget) navigate(exitTarget);
    else navigate(-1);
  }

  const answeredCount = Object.keys(answers).length;
  const progressPercent = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;
  const currentQuestion = questions[currentQuestionIndex];

  const examFacts = useMemo(() => [
    { label: "Subject", value: exam?.subject || "—", icon: "book" },
    { label: "Duration", value: `${exam?.durationMinutes || "—"} minutes`, icon: "clock" },
    { label: "Pass Mark", value: `${exam?.passMark || "—"}%`, icon: "check" },
    { label: "Questions", value: examStarted ? questions.length : "Revealed on start", icon: "exam" }
  ], [exam, examStarted, questions.length]);

  if (!examStarted) {
    if (isLoading) {
      return (
        <main className="exam-taking-container loading">
          <div className="loading-shell-card">
            <div className="spinner" />
            <p>Preparing your exam workspace…</p>
            <SkeletonGrid count={2} />
          </div>
        </main>
      );
    }

    if (error) {
      return (
        <main className="exam-taking-container">
          <div className="exam-start-screen">
            <EmptyState icon="warning" title="Unable to open exam" message={error} />
            <button className="back-button" type="button" onClick={() => navigate("/student/exams")}>Back to Exams</button>
          </div>
        </main>
      );
    }

    return (
      <main className="exam-taking-container">
        <section className="exam-start-screen premium-start-screen" aria-labelledby="start-exam-title">
          <div className="start-content">
            <div className="exam-start-hero">
              <span className="exam-start-icon"><Icon name="shield" size={26} /></span>
              <div>
                <p className="eyebrow">Secure Exam Mode</p>
                <h1 id="start-exam-title">{exam?.title}</h1>
                <p className="muted-text">Read the instructions before starting. The timer begins immediately after confirmation.</p>
              </div>
            </div>

            <div className="exam-info exam-fact-grid">
              {examFacts.map((fact) => (
                <div className="exam-fact" key={fact.label}>
                  <Icon name={fact.icon} size={18} />
                  <span>{fact.label}</span>
                  <strong>{fact.value}</strong>
                </div>
              ))}
              {exam?.description ? (
                <div className="exam-fact exam-fact-wide">
                  <Icon name="book" size={18} />
                  <span>Description</span>
                  <strong>{exam.description}</strong>
                </div>
              ) : null}
            </div>

            <div className="start-instructions">
              <h3>Instructions</h3>
              <ul>
                <li>Answer each question carefully before submitting.</li>
                <li>Use Previous and Next to move between questions.</li>
                <li>The question navigator shows answered, unanswered, and current questions.</li>
                <li>The system will automatically submit when the timer reaches zero.</li>
                <li>Submitting is final. You cannot change answers after submission.</li>
                <li>Leaving the page during the exam will ask for confirmation.</li>
              </ul>
            </div>

            {!showStartConfirm ? (
              <div className="start-actions-row">
                <button className="start-button" type="button" onClick={() => setShowStartConfirm(true)}>
                  <Icon name="arrowRight" size={18} /> Start Exam
                </button>
                <button className="back-button" type="button" onClick={() => navigate("/student/exams")}>
                  <Icon name="arrowLeft" size={18} /> Back to Exams
                </button>
              </div>
            ) : (
              <div className="confirm-start">
                <h3>Ready to begin?</h3>
                <p>Once started, your attempt will be created and the exam timer will begin.</p>
                <div className="confirm-buttons">
                  <button className="confirm-yes" type="button" onClick={startExam}>
                    <Icon name="check" size={18} /> Yes, Start Now
                  </button>
                  <button className="confirm-no" type="button" onClick={() => setShowStartConfirm(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    );
  }

  if (questions.length === 0) {
    return (
      <main className="exam-taking-container">
        <div className="exam-start-screen">
          <EmptyState icon="exam" title="No questions available" message="This exam does not contain questions yet. Please contact your lecturer." />
          <button className="back-button" type="button" onClick={() => navigate("/student/exams")}>Back to Exams</button>
        </div>
      </main>
    );
  }

  return (
    <main className="exam-taking-container exam-in-progress-shell">
      {showExitWarning && (
        <ConfirmModal
          icon="warning"
          title="Leave exam?"
          message="Leaving now will forfeit your attempt. Continue only if you are sure."
          confirmLabel="Yes, Leave Exam"
          cancelLabel="Continue Exam"
          danger
          onConfirm={confirmExit}
          onCancel={() => setShowExitWarning(false)}
        />
      )}

      {showSubmitConfirm && (
        <ConfirmModal
          icon="check"
          title="Submit exam?"
          message={`You answered ${answeredCount} of ${questions.length} questions. You cannot change answers after submitting.`}
          confirmLabel="Submit Exam"
          cancelLabel="Continue Exam"
          danger
          isBusy={isSubmitting}
          onConfirm={submitExam}
          onCancel={() => setShowSubmitConfirm(false)}
        >
          {error ? <div className="error-message compact">{error}</div> : null}
        </ConfirmModal>
      )}

      <header className="exam-header sticky-exam-header">
        <div className="exam-title">
          <p className="eyebrow">Exam in progress</p>
          <h1>{exam?.title}</h1>
          <span className="exam-status">Question {currentQuestionIndex + 1} of {questions.length}</span>
        </div>
        <div className="exam-progress-summary" aria-label="Exam progress">
          <span>{answeredCount}/{questions.length} answered</span>
          <div className="exam-progress-track"><span style={{ width: `${progressPercent}%` }} /></div>
        </div>
        <div className="exam-timer">
          <CountdownTimer
            durationMinutes={exam?.durationMinutes}
            onTimeUp={handleTimeUp}
            isActive={examStarted && !isSubmitting}
          />
        </div>
      </header>

      <div className="exam-content refined-exam-content">
        <section className="questions-column" aria-labelledby="current-question-title">
          <div className="question-display refined-question-card">
            <div className="question-header">
              <div>
                <p className="eyebrow">Current Question</p>
                <h2 id="current-question-title">Question {currentQuestionIndex + 1}</h2>
              </div>
              <span className="question-marks">{currentQuestion.marks} marks</span>
            </div>

            <div className="question-text">
              <p>{currentQuestion.questionText}</p>
            </div>

            <div className="question-options">
              {currentQuestion.options.map((option, idx) => (
                <label key={option.id} className="option-label refined-option-label">
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    value={option.id}
                    checked={answers[currentQuestion.id] === option.id}
                    onChange={() => handleAnswerSelect(currentQuestion.id, option.id)}
                    disabled={isSubmitting}
                  />
                  <span className="option-letter">{String.fromCharCode(65 + idx)}</span>
                  <span className="option-text">{option.optionText}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="question-navigation refined-navigation">
            <button className="nav-button" type="button" onClick={() => goToQuestion(currentQuestionIndex - 1)} disabled={currentQuestionIndex === 0}>
              <Icon name="arrowLeft" size={17} /> Previous
            </button>
            <button className="nav-button" type="button" onClick={() => goToQuestion(currentQuestionIndex + 1)} disabled={currentQuestionIndex === questions.length - 1}>
              Next <Icon name="arrowRight" size={17} />
            </button>
          </div>

          <div className="exam-actions refined-exam-actions">
            <button className="submit-button" type="button" onClick={() => setShowSubmitConfirm(true)} disabled={isSubmitting}>
              <Icon name="check" size={17} /> Submit Exam
            </button>
            <button className="exit-button" type="button" onClick={() => handleNavigateAway("/student/exams")} disabled={isSubmitting}>
              <Icon name="logout" size={17} /> Exit Exam
            </button>
          </div>
        </section>

        <aside className="questions-panel refined-questions-panel" aria-label="Question navigator">
          <div className="questions-header">
            <div>
              <p className="eyebrow">Navigator</p>
              <h3>Questions</h3>
            </div>
            <span className="answered-count">{answeredCount}/{questions.length}</span>
          </div>

          <div className="questions-grid">
            {questions.map((q, idx) => (
              <button
                key={q.id}
                type="button"
                className={`question-indicator ${idx === currentQuestionIndex ? "current" : ""} ${answers[q.id] ? "answered" : "unanswered"}`}
                onClick={() => goToQuestion(idx)}
                title={`Question ${idx + 1}`}
                aria-label={`Go to question ${idx + 1}`}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          <div className="legend">
            <div className="legend-item"><span className="indicator answered" /> Answered</div>
            <div className="legend-item"><span className="indicator unanswered" /> Unanswered</div>
            <div className="legend-item"><span className="indicator current" /> Current</div>
          </div>
        </aside>
      </div>
    </main>
  );
}
