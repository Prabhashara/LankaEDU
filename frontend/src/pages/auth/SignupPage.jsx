import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerStudent } from "../../services/authService";
import { getApiErrorMessage, getApiFieldErrors } from "../../services/errorService";
import Icon from "../../components/Icons.jsx";

const initialForm = {
  fullName: "", studentId: "", email: "", password: "", confirmPassword: ""
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
    if (Object.keys(validationErrors).length > 0) return;
    setIsSubmitting(true);
    setFormError("");
    try {
      const data = await registerStudent({
        fullName: form.fullName.trim(), studentId: form.studentId.trim(),
        email: form.email.trim(), password: form.password, confirmPassword: form.confirmPassword
      });
      navigate("/login", { replace: true, state: { successMessage: data.message || "Registration successful, please log in" } });
    } catch (error) {
      const responseErrors = getApiFieldErrors(error);
      if (Object.keys(responseErrors).length > 0) setErrors(responseErrors);
      else setFormError(getApiErrorMessage(error, "Registration failed. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-shell auth-shell-premium">
      <section className="auth-layout auth-layout-signup" aria-labelledby="signup-title">
        <aside className="auth-visual-panel" aria-label="Student account benefits">
          <div className="auth-brand auth-brand-large">
            <div className="brand-mark"><Icon name="exam" size={22} /></div>
            <span className="brand-wordmark">Lanka<span>Edu</span></span>
          </div>
          <div className="auth-visual-content">
            <span className="home-highlight">Student exam portal</span>
            <h2>Create an account and enter a focused digital exam space.</h2>
            <p>
              Students can access active exams, complete timed attempts, and review detailed scores through a polished learning dashboard.
            </p>
          </div>
          <div className="auth-feature-stack">
            <div><span><Icon name="clock" size={15} /></span> Timed online exams</div>
            <div><span><Icon name="check" size={15} /></span> Instant result review</div>
            <div><span><Icon name="report" size={15} /></span> Personal report card</div>
          </div>
        </aside>

        <section className="auth-panel auth-card-premium">
          <div className="auth-brand">
            <div className="brand-mark"><Icon name="exam" size={22} /></div>
            <span className="brand-wordmark">Lanka<span>Edu</span></span>
          </div>

          <div className="auth-copy">
            <p className="eyebrow">Get started free</p>
            <h1 id="signup-title">Create your student account</h1>
            <p>Open your student portal and begin taking exams online.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {formError && <div className="alert alert-error"><Icon name="warning" size={16} /> {formError}</div>}

            <Field label="Full Name" name="fullName" value={form.fullName} error={errors.fullName} onChange={updateField} autoComplete="name" placeholder="Jane Smith" />
            <Field label="Student ID" name="studentId" value={form.studentId} error={errors.studentId} onChange={updateField} autoComplete="username" placeholder="e.g. S2024001" />
            <Field label="Email address" name="email" type="email" value={form.email} error={errors.email} onChange={updateField} autoComplete="email" placeholder="you@university.edu" />
            <Field label="Password" name="password" type="password" value={form.password} error={errors.password} onChange={updateField} autoComplete="new-password" placeholder="Minimum 8 characters" />
            <Field label="Confirm Password" name="confirmPassword" type="password" value={form.confirmPassword} error={errors.confirmPassword} onChange={updateField} autoComplete="new-password" placeholder="Re-enter password" />

            <button className="primary-button full-width-button" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating account…" : <>Create account <Icon name="arrowRight" size={16} /></>}
            </button>
          </form>

          <p className="auth-footer">
            Already registered? <Link to="/login">Sign in</Link>
          </p>
        </section>
      </section>
    </main>
  );
}

function Field({ label, name, type = "text", value, error, onChange, autoComplete, placeholder }) {
  const errorId = `${name}-error`;
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <input
        id={name} name={name} type={type} value={value} onChange={onChange}
        autoComplete={autoComplete} placeholder={placeholder}
        aria-invalid={Boolean(error)} aria-describedby={error ? errorId : undefined}
      />
      {error && <p className="field-error" id={errorId}>{error}</p>}
    </div>
  );
}
