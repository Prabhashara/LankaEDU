import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { getAuthToken, getStoredRole } from "../../services/authStorage";
import { getApiErrorMessage, getApiFieldErrors } from "../../services/errorService";
import { getExam } from "../../services/examService";
import { createQuestion, getQuestion, updateQuestion } from "../../services/questionService";

const questionTypes = [
  { value: "MCQ", label: "MCQ" },
  { value: "TRUE_FALSE", label: "True/False" },
  { value: "SHORT_ANSWER", label: "Short Answer" }
];

const initialOptions = [
  { optionText: "", isCorrect: false },
  { optionText: "", isCorrect: false },
  { optionText: "", isCorrect: false },
  { optionText: "", isCorrect: false }
];

const initialValues = {
  questionText: "",
  type: "MCQ",
  marks: "",
  options: initialOptions,
  trueFalseOptions: [
    { optionText: "True", isCorrect: false },
    { optionText: "False", isCorrect: false }
  ]
};

function toFormValues(question) {
  if (!question) {
    return initialValues;
  }

  const options = question.options || [];
  return {
    questionText: question.questionText || "",
    type: question.type || "MCQ",
    marks: question.marks?.toString() || "",
    options:
      question.type === "MCQ"
        ? [...options.map((option) => ({ optionText: option.optionText, isCorrect: option.isCorrect })), ...initialOptions].slice(0, 4)
        : initialOptions,
    trueFalseOptions:
      question.type === "TRUE_FALSE"
        ? ["True", "False"].map((label) => {
            const option = options.find((item) => item.optionText.toLowerCase() === label.toLowerCase());
            return { optionText: label, isCorrect: option?.isCorrect || false };
          })
        : initialValues.trueFalseOptions
  };
}

function validate(values) {
  const errors = {};
  const marks = Number(values.marks);

  if (!values.questionText.trim()) errors.questionText = "Question text is required";
  if (!values.type) errors.type = "Question type is required";
  if (!values.marks) {
    errors.marks = "Marks are required";
  } else if (!Number.isFinite(marks) || marks <= 0) {
    errors.marks = "Marks must be a positive number";
  }

  if (values.type === "MCQ") {
    values.options.forEach((option, index) => {
      if (!option.optionText.trim()) {
        errors[`option${index}`] = `Option ${index + 1} is required`;
      }
    });

    const correctCount = values.options.filter((option) => option.isCorrect).length;
    if (correctCount !== 1) {
      errors.correctOption = "MCQ must have exactly 1 correct option";
    }
  }

  if (values.type === "TRUE_FALSE") {
    const correctCount = values.trueFalseOptions.filter((option) => option.isCorrect).length;
    if (correctCount !== 1) {
      errors.correctOption = "Select exactly one correct answer";
    }
  }

  return errors;
}

export default function QuestionFormPage() {
  const { examId, questionId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = getAuthToken();
  const role = getStoredRole();
  const [values, setValues] = useState(initialValues);
  const [exam, setExam] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const isEditing = Boolean(questionId);
  const canManageQuestions = exam?.status === "Draft";
  const returnTo = searchParams.get("from") === "bank" ? "/lecturer/question-bank" : `/lecturer/exams/${examId}`;

  useEffect(() => {
    if (!token || role !== "lecturer") {
      return;
    }

    let isMounted = true;

    async function loadData() {
      try {
        const [examData, question] = await Promise.all([
          getExam(examId),
          questionId ? getQuestion(questionId) : Promise.resolve(null)
        ]);
        if (isMounted) {
          setExam(examData);
          if (question) {
            setValues(toFormValues(question));
          }
          setSubmitError("");
        }
      } catch (error) {
        if (isMounted) {
          setSubmitError(getApiErrorMessage(error, "Unable to load question form."));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [examId, questionId, role, token]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (role !== "lecturer") {
    return <Navigate to={`/${role || "student"}-dashboard`} replace />;
  }

  function handleFieldChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  }

  function handleTypeChange(event) {
    const nextType = event.target.value;
    setValues((current) => ({ ...current, type: nextType }));
    setErrors({});
    setSubmitError("");
  }

  function handleOptionTextChange(index, value) {
    setValues((current) => ({
      ...current,
      options: current.options.map((option, optionIndex) =>
        optionIndex === index ? { ...option, optionText: value } : option
      )
    }));
    setErrors((current) => ({ ...current, [`option${index}`]: "" }));
  }

  function handleMcqCorrectChange(index) {
    setValues((current) => ({
      ...current,
      options: current.options.map((option, optionIndex) => ({
        ...option,
        isCorrect: optionIndex === index
      }))
    }));
    setErrors((current) => ({ ...current, correctOption: "" }));
  }

  function handleTrueFalseCorrectChange(index) {
    setValues((current) => ({
      ...current,
      trueFalseOptions: current.trueFalseOptions.map((option, optionIndex) => ({
        ...option,
        isCorrect: optionIndex === index
      }))
    }));
    setErrors((current) => ({ ...current, correctOption: "" }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validationErrors = validate(values);
    setErrors(validationErrors);
    setSubmitError("");

    if (!canManageQuestions) {
      setSubmitError("Questions can only be managed while the exam is in Draft status.");
      return;
    }

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    const options =
      values.type === "MCQ"
        ? values.options
        : values.type === "TRUE_FALSE"
          ? values.trueFalseOptions
          : [];

    setIsSubmitting(true);

    try {
      const payload = {
        exam_id: examId,
        questionText: values.questionText.trim(),
        type: values.type,
        marks: Number(values.marks),
        options: options.map((option) => ({
          optionText: option.optionText.trim(),
          isCorrect: option.isCorrect
        }))
      };

      if (isEditing) {
        await updateQuestion(questionId, payload);
      } else {
        await createQuestion(payload);
      }

      navigate(returnTo, {
        replace: true,
        state: { toast: isEditing ? "Question updated successfully." : "Question added successfully.", tab: "questions" }
      });
    } catch (error) {
      const responseErrors = getApiFieldErrors(error);
      if (Object.keys(responseErrors).length > 0) {
        setErrors(responseErrors);
      }
      setSubmitError(getApiErrorMessage(error, "Unable to add question."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="admin-shell">
      <section className="admin-header" aria-labelledby="question-form-title">
        <div>
          <p className="eyebrow">Question Bank</p>
          <h1 id="question-form-title">{isEditing ? "Edit Question" : "Add Question"}</h1>
          <p className="dashboard-copy">
            {isEditing ? "Update the question before publishing the exam." : "Create a question and link it to this exam."}
          </p>
        </div>
        <Link className="secondary-button" to={returnTo}>
          Back
        </Link>
      </section>

      <section className="form-panel" aria-label="Question form">
        {submitError ? <div className="alert alert-error">{submitError}</div> : null}
        {!isLoading && !canManageQuestions ? (
          <div className="alert alert-warning">
            Questions can only be managed while the exam is in Draft status.
          </div>
        ) : null}

        {isLoading ? <p className="empty-state">Loading question...</p> : null}

        {!isLoading ? (
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="questionText">Question Text</label>
            <textarea
              id="questionText"
              name="questionText"
              rows="5"
              value={values.questionText}
              onChange={handleFieldChange}
              aria-invalid={errors.questionText ? "true" : "false"}
              aria-describedby={errors.questionText ? "question-text-error" : undefined}
            />
            {errors.questionText ? (
              <p className="field-error" id="question-text-error">
                {errors.questionText}
              </p>
            ) : null}
          </div>

          <div className="form-grid">
            <div className="field">
              <label htmlFor="type">Type</label>
              <select id="type" name="type" value={values.type} onChange={handleTypeChange}>
                {questionTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {errors.type ? <p className="field-error">{errors.type}</p> : null}
            </div>

            <div className="field">
              <label htmlFor="marks">Marks</label>
              <input
                id="marks"
                name="marks"
                type="number"
                min="1"
                step="1"
                value={values.marks}
                onChange={handleFieldChange}
                aria-invalid={errors.marks ? "true" : "false"}
                aria-describedby={errors.marks ? "marks-error" : undefined}
              />
              {errors.marks ? (
                <p className="field-error" id="marks-error">
                  {errors.marks}
                </p>
              ) : null}
            </div>
          </div>

          {values.type === "MCQ" ? (
            <fieldset className="options-fieldset">
              <legend>Options</legend>
              <div className="option-list">
                {values.options.map((option, index) => (
                  <div className="option-row" key={index}>
                    <div className="field">
                      <label htmlFor={`option-${index}`}>Option {index + 1}</label>
                      <input
                        id={`option-${index}`}
                        value={option.optionText}
                        onChange={(event) => handleOptionTextChange(index, event.target.value)}
                        aria-invalid={errors[`option${index}`] ? "true" : "false"}
                      />
                      {errors[`option${index}`] ? <p className="field-error">{errors[`option${index}`]}</p> : null}
                    </div>
                    <label className="radio-option">
                      <input
                        type="radio"
                        name="correctOption"
                        checked={option.isCorrect}
                        onChange={() => handleMcqCorrectChange(index)}
                      />
                      Is Correct
                    </label>
                  </div>
                ))}
              </div>
              {errors.correctOption ? <p className="field-error">{errors.correctOption}</p> : null}
            </fieldset>
          ) : null}

          {values.type === "TRUE_FALSE" ? (
            <fieldset className="options-fieldset">
              <legend>Correct Answer</legend>
              <div className="binary-options">
                {values.trueFalseOptions.map((option, index) => (
                  <label className="radio-option" key={option.optionText}>
                    <input
                      type="radio"
                      name="trueFalseCorrect"
                      checked={option.isCorrect}
                      onChange={() => handleTrueFalseCorrectChange(index)}
                    />
                    {option.optionText}
                  </label>
                ))}
              </div>
              {errors.correctOption ? <p className="field-error">{errors.correctOption}</p> : null}
            </fieldset>
          ) : null}

          {values.type === "SHORT_ANSWER" ? (
            <div className="alert alert-warning">Short answer questions do not use selectable options.</div>
          ) : null}

          <button className="primary-button" type="submit" disabled={isSubmitting || !canManageQuestions}>
            {isSubmitting ? "Saving..." : isEditing ? "Save changes" : "Save question"}
          </button>
        </form>
        ) : null}
      </section>
    </main>
  );
}
