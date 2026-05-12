import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { registerStudent } from "../../services/authService";

const initialForm = {
  fullName: "",
  studentId: "",
  email: "",
  password: "",
  confirmPassword: ""
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(form) {
  const errors = {};

  if (!form.fullName.trim()) errors.fullName = "Full name is required";
  if (!form.studentId.trim()) errors.studentId = "Student ID is required";
  if (!form.email.trim()) errors.email = "Email is required";
  else if (!emailPattern.test(form.email.trim())) errors.email = "Enter a valid email address";
  if (!form.password) errors.password = "Password is required";
  else if (form.password.length < 8) errors.password = "Password must be at least 8 characters";
  if (!form.confirmPassword) errors.confirmPassword = "Confirm your password";
  else if (form.password !== form.confirmPassword) errors.confirmPassword = "Passwords do not match";

  return errors;
}

export default function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
    setFormError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validationErrors = validate(form);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    try {
      const data = await registerStudent({
        fullName: form.fullName.trim(),
        studentId: form.studentId.trim(),
        email: form.email.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword
      });

      navigate("/login", {
        replace: true,
        state: { successMessage: data.message || "Registration successful, please log in" }
      });
    } catch (error) {
      const responseErrors = error.response?.data?.errors;
      if (responseErrors) {
        setErrors(responseErrors);
      } else {
        setFormError(error.response?.data?.message || "Registration failed. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel" aria-labelledby="signup-title">
        <div className="auth-copy">
          <p className="eyebrow">Student registration</p>
          <h1 id="signup-title">Create your exam account</h1>
          <p>Register with your student details to access online exams and results.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {formError ? <div className="alert alert-error">{formError}</div> : null}

          <Field
            label="Full Name"
            name="fullName"
            value={form.fullName}
            error={errors.fullName}
            onChange={updateField}
            autoComplete="name"
          />
          <Field
            label="Student ID"
            name="studentId"
            value={form.studentId}
            error={errors.studentId}
            onChange={updateField}
            autoComplete="username"
          />
          <Field
            label="Email"
            name="email"
            type="email"
            value={form.email}
            error={errors.email}
            onChange={updateField}
            autoComplete="email"
          />
          <Field
            label="Password"
            name="password"
            type="password"
            value={form.password}
            error={errors.password}
            onChange={updateField}
            autoComplete="new-password"
          />
          <Field
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            value={form.confirmPassword}
            error={errors.confirmPassword}
            onChange={updateField}
            autoComplete="new-password"
          />

          <button className="primary-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="auth-footer">
          Already registered? <Link to="/login">Log in</Link>
        </p>
      </section>
    </main>
  );
}

function Field({ label, name, type = "text", value, error, onChange, autoComplete }) {
  const errorId = `${name}-error`;

  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
      />
      {error ? (
        <p className="field-error" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
