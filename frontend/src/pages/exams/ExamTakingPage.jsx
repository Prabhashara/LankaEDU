import { useCallback, useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import CountdownTimer from "../../components/CountdownTimer";
import { createAttempt, submitAttempt } from "../../services/attemptService";
import { getAuthToken, getStoredRole } from "../../services/authStorage";
import { getExam } from "../../services/examService";
import "./ExamTakingPage.css";

export default function ExamTakingPage() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const token = getAuthToken();
  const role = getStoredRole();

  // State
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

  // Authorization check
  if (!token || role !== "student") {
    return <Navigate to="/login" replace />;
  }

  // Load exam details
  useEffect(() => {
    async function loadExam() {
      try {
        const data = await getExam(examId);
        setExam(data);
        setError("");
      } catch (_error) {
        setError("Unable to load exam. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
    loadExam();
  }, [examId]);

  // Warn on page unload if exam in progress
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

  // Handle browser back/forward navigation during an active exam
  useEffect(() => {
    if (!examStarted) {
      return;
    }

    const handlePopState = (event) => {
      event.preventDefault();
      setShowExitWarning(true);
      window.history.pushState(null, "", window.location.href);
    };

    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [examStarted]);

  // Start exam
  async function startExam() {
    try {
      setIsLoading(true);
      const data = await createAttempt(examId);
      setAttempt(data.attempt_id);
      setQuestions(data.questions);
      setAnswers({});
      setCurrentQuestionIndex(0);
      setExamStarted(true);
      setShowStartConfirm(false);
      setShowSubmitConfirm(false);
      setIsLoading(false);
    } catch (_error) {
      setError("Failed to start exam. Please try again.");
      setIsLoading(false);
    }
  }

  // Handle answer selection
  function handleAnswerSelect(questionId, optionId) {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionId
    }));
  }

  // Handle question navigation
  function goToQuestion(index) {
    if (index >= 0 && index < questions.length) {
      setCurrentQuestionIndex(index);
    }
  }

  // Auto-submit when timer reaches zero
  // Submit exam
  const submitExam = useCallback(async () => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      const submission = await submitAttempt(attempt, answers);
      setExamStarted(false);
      setShowSubmitConfirm(false);
      navigate(`/student/attempts/${attempt}/submitted`, {
        replace: true,
        state: {
          exam,
          submission
        }
      });
    } catch (_error) {
      setError("Failed to submit exam. Please try again.");
      setIsSubmitting(false);
    }
  }, [answers, attempt, exam, isSubmitting, navigate]);

  // Auto-submit when timer reaches zero
  async function handleTimeUp() {
    await submitExam();
  }

  // Handle navigation away
  function handleNavigateAway(target) {
    setExitTarget(target);
    setShowExitWarning(true);
  }

  function confirmExit() {
    setExamStarted(false);
    if (exitTarget) {
      navigate(exitTarget);
    } else {
      navigate(-1);
    }
  }

  if (!examStarted) {
    if (isLoading) {
      return (
        <div className="exam-taking-container loading">
          <div className="spinner"></div>
          <p>Loading exam...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="exam-taking-container">
          <div className="error-message">{error}</div>
          <button onClick={() => navigate("/student/exams")}>Back to Exams</button>
        </div>
      );
    }

    return (
      <div className="exam-taking-container">
        <div className="exam-start-screen">
          <div className="start-content">
            <h1>{exam?.title}</h1>
            <div className="exam-info">
              <p><strong>Subject:</strong> {exam?.subject}</p>
              <p><strong>Duration:</strong> {exam?.durationMinutes} minutes</p>
              <p><strong>Pass Mark:</strong> {exam?.passMark}%</p>
              <p><strong>Question count:</strong> Will be available once you start the exam.</p>
              {exam?.description && (
                <p><strong>Description:</strong> {exam.description}</p>
              )}
            </div>

            <div className="start-instructions">
              <h3>Instructions</h3>
              <ul>
                <li>Answer each question carefully</li>
                <li>You can navigate between questions using Previous/Next buttons</li>
                <li>A countdown timer will track your remaining time</li>
                <li>When time runs out, your exam will be automatically submitted</li>
                <li>You can submit your exam early by clicking the Submit button</li>
                <li>Leaving the page during the exam will ask for confirmation</li>
              </ul>
            </div>

            {!showStartConfirm ? (
              <button className="start-button" onClick={() => setShowStartConfirm(true)}>
                Start Exam
              </button>
            ) : (
              <div className="confirm-start">
                <p>Are you ready to start? Once started, you cannot leave the exam.</p>
                <div className="confirm-buttons">
                  <button className="confirm-yes" onClick={startExam}>
                    Yes, Start Now
                  </button>
                  <button className="confirm-no" onClick={() => setShowStartConfirm(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <button className="back-button" onClick={() => navigate("/student/exams")}>
              Back to Exams
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="exam-taking-container">
        <p>No questions available for this exam.</p>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="exam-taking-container">
      {/* Exit Warning Modal */}
      {showExitWarning && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Leave Exam?</h2>
            <p>Are you sure you want to leave the exam? You will forfeit your attempt.</p>
            <div className="modal-buttons">
              <button className="btn-danger" onClick={confirmExit}>
                Yes, Leave Exam
              </button>
              <button className="btn-secondary" onClick={() => setShowExitWarning(false)}>
                Continue Exam
              </button>
            </div>
          </div>
        </div>
      )}

      {showSubmitConfirm && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Submit exam?</h2>
            <p>Are you sure? You cannot change answers after submitting.</p>
            {error ? <div className="error-message compact">{error}</div> : null}
            <div className="modal-buttons">
              <button className="btn-danger" onClick={submitExam} disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Yes, Submit"}
              </button>
              <button className="btn-secondary" onClick={() => setShowSubmitConfirm(false)} disabled={isSubmitting}>
                Continue Exam
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="exam-header">
        <div className="exam-title">
          <h1>{exam?.title}</h1>
          <span className="exam-status">Question {currentQuestionIndex + 1} of {questions.length}</span>
        </div>
        <div className="exam-timer">
          <CountdownTimer
            durationMinutes={exam?.durationMinutes}
            onTimeUp={handleTimeUp}
            isActive={examStarted && !isSubmitting}
          />
        </div>
      </div>

      <div className="exam-content">
        <div className="questions-column">
          <div className="question-display">
            <div className="question-header">
              <h2>Question {currentQuestionIndex + 1}</h2>
              <span className="question-marks">({currentQuestion.marks} marks)</span>
            </div>

            <div className="question-text">
              <p>{currentQuestion.questionText}</p>
            </div>

            <div className="question-options">
              {currentQuestion.options.map((option, idx) => (
                <label key={option.id} className="option-label">
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    value={option.id}
                    checked={answers[currentQuestion.id] === option.id}
                    onChange={() => handleAnswerSelect(currentQuestion.id, option.id)}
                    disabled={isSubmitting}
                  />
                  <span className="option-text">{String.fromCharCode(65 + idx)}. {option.optionText}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="question-navigation">
            <button
              className="nav-button"
              onClick={() => goToQuestion(currentQuestionIndex - 1)}
              disabled={currentQuestionIndex === 0}
            >
              ← Previous
            </button>

            <button
              className="nav-button"
              onClick={() => goToQuestion(currentQuestionIndex + 1)}
              disabled={currentQuestionIndex === questions.length - 1}
            >
              Next →
            </button>
          </div>

          <div className="exam-actions">
            {currentQuestionIndex === questions.length - 1 ? (
              <button className="submit-button" onClick={() => setShowSubmitConfirm(true)} disabled={isSubmitting}>
                Submit Exam
              </button>
            ) : null}
            <button
              className="exit-button"
              onClick={() => handleNavigateAway("/student/exams")}
              disabled={isSubmitting}
            >
              Exit Exam
            </button>
          </div>
        </div>

        <div className="questions-panel">
          <div className="questions-header">
            <h3>Questions</h3>
            <span className="answered-count">{answeredCount}/{questions.length} answered</span>
          </div>

          <div className="questions-grid">
            {questions.map((q, idx) => (
              <button
                key={q.id}
                className={`question-indicator ${
                  idx === currentQuestionIndex ? "current" : ""
                } ${answers[q.id] ? "answered" : "unanswered"}`}
                onClick={() => goToQuestion(idx)}
                title={`Question ${idx + 1}`}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          <div className="legend">
            <div className="legend-item">
              <span className="indicator answered"></span> Answered
            </div>
            <div className="legend-item">
              <span className="indicator unanswered"></span> Unanswered
            </div>
            <div className="legend-item">
              <span className="indicator current"></span> Current
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
