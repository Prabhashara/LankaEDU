import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { createExam } from "../../services/examService";
import { getAuthToken, getStoredRole } from "../../services/authStorage";

const initialValues = {
  title: "",
  subject: "",
  durationMinutes: "",
  passMark: "",
  description: ""
};

function validate(values) {
  const errors = {};
  const duration = Number(values.durationMinutes);
  const passMark = Number(values.passMark);

  if (!values.title.trim()) errors.title = "Title is required";
  if (!values.subject.trim()) errors.subject = "Subject is required";
  if (!values.durationMinutes) {
    errors.durationMinutes = "Duration is required";
  } else if (!Number.isFinite(duration) || duration <= 0) {
    errors.durationMinutes = "Duration must be a positive number in minutes";
  }
  if (!values.passMark) {
    errors.passMark = "Pass mark is required";
  } else if (!Number.isFinite(passMark) || passMark < 1 || passMark > 100) {
    errors.passMark = "Pass mark must be between 1 and 100";
  }

  return errors;
}

export default function ExamCreatePage() {
  const navigate = useNavigate();
  const token = getAuthToken();
  const role = getStoredRole();
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (role !== "lecturer") {
    return <Navigate to={`/${role || "student"}-dashboard`} replace />;
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validationErrors = validate(values);
    setErrors(validationErrors);
    setSubmitError("");

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const exam = await createExam({
        title: values.title.trim(),
        subject: values.subject.trim(),
        durationMinutes: Number(values.durationMinutes),
        passMark: Number(values.passMark),
        description: values.description.trim(),
        status: "Draft"
      });

      navigate(`/lecturer/exams/${exam.id}`, {
        replace: true,
        state: { toast: "Exam created successfully." }
      });
    } catch (error) {
      const responseErrors = error.response?.data?.errors;
      if (responseErrors) {
        setErrors(responseErrors);
      }
      setSubmitError(error.response?.data?.message || "Unable to create exam.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="admin-shell">
      <section className="admin-header" aria-labelledby="exam-create-title">
        <div>
          <p className="eyebrow">Lecturer</p>
          <h1 id="exam-create-title">Create Exam</h1>
          <p className="dashboard-copy">Set up the core details for a new draft exam.</p>
        </div>
        <Link className="secondary-button" to="/lecturer-dashboard">
          Back to exams
        </Link>
      </section>

      <section className="form-panel" aria-label="New exam form">
        {submitError ? <div className="alert alert-error">{submitError}</div> : null}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="title">Title</label>
            <input
              id="title"
              name="title"
              value={values.title}
              onChange={handleChange}
              aria-invalid={errors.title ? "true" : "false"}
              aria-describedby={errors.title ? "title-error" : undefined}
            />
            {errors.title ? (
              <p className="field-error" id="title-error">
                {errors.title}
              </p>
            ) : null}
          </div>

          <div className="field">
            <label htmlFor="subject">Subject</label>
            <input
              id="subject"
              name="subject"
              value={values.subject}
              onChange={handleChange}
              aria-invalid={errors.subject ? "true" : "false"}
              aria-describedby={errors.subject ? "subject-error" : undefined}
            />
            {errors.subject ? (
              <p className="field-error" id="subject-error">
                {errors.subject}
              </p>
            ) : null}
          </div>

          <div className="form-grid">
            <div className="field">
              <label htmlFor="durationMinutes">Duration (minutes)</label>
              <input
                id="durationMinutes"
                name="durationMinutes"
                type="number"
                min="1"
                step="1"
                value={values.durationMinutes}
                onChange={handleChange}
                aria-invalid={errors.durationMinutes ? "true" : "false"}
                aria-describedby={errors.durationMinutes ? "duration-error" : undefined}
              />
              {errors.durationMinutes ? (
                <p className="field-error" id="duration-error">
                  {errors.durationMinutes}
                </p>
              ) : null}
            </div>

            <div className="field">
              <label htmlFor="passMark">Pass Mark (%)</label>
              <input
                id="passMark"
                name="passMark"
                type="number"
                min="1"
                max="100"
                step="1"
                value={values.passMark}
                onChange={handleChange}
                aria-invalid={errors.passMark ? "true" : "false"}
                aria-describedby={errors.passMark ? "pass-mark-error" : undefined}
              />
              {errors.passMark ? (
                <p className="field-error" id="pass-mark-error">
                  {errors.passMark}
                </p>
              ) : null}
            </div>
          </div>

          <div className="field">
            <label htmlFor="description">Description (optional)</label>
            <textarea
              id="description"
              name="description"
              rows="5"
              value={values.description}
              onChange={handleChange}
            />
          </div>

          <button className="primary-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create draft exam"}
          </button>
        </form>
      </section>
    </main>
  );
}
