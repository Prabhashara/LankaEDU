import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerStudent } from "../../services/authService";

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
      const responseErrors = error.response?.data?.errors;
      if (responseErrors) setErrors(responseErrors);
      else setFormError(error.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel" aria-labelledby="signup-title">
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg,#006880,#00a3c4)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "1.1rem" }}>📋</div>
          <span style={{ fontWeight: 900, fontSize: "1.1rem", color: "#0f172a", letterSpacing: "-0.02em" }}>Lanka<span style={{ color: "#006880" }}>Edu</span></span>
        </div>

        <div className="auth-copy">
          <p className="eyebrow">Get started free</p>
          <h1 id="signup-title" style={{ fontSize: "1.75rem", marginBottom: 6 }}>Create your student account</h1>
          <p style={{ color: "#64748b", fontSize: "0.95rem" }}>Open your student portal and begin taking exams online.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {formError && <div className="alert alert-error">⚠ {formError}</div>}

          <Field label="Full Name" name="fullName" value={form.fullName} error={errors.fullName} onChange={updateField} autoComplete="name" placeholder="Jane Smith" />
          <Field label="Student ID" name="studentId" value={form.studentId} error={errors.studentId} onChange={updateField} autoComplete="username" placeholder="e.g. S2024001" />
          <Field label="Email address" name="email" type="email" value={form.email} error={errors.email} onChange={updateField} autoComplete="email" placeholder="you@university.edu" />
          <Field label="Password" name="password" type="password" value={form.password} error={errors.password} onChange={updateField} autoComplete="new-password" placeholder="Minimum 8 characters" />
          <Field label="Confirm Password" name="confirmPassword" type="password" value={form.confirmPassword} error={errors.confirmPassword} onChange={updateField} autoComplete="new-password" placeholder="Re-enter password" />

          <button className="primary-button" type="submit" disabled={isSubmitting} style={{ width: "100%", justifyContent: "center", marginTop: 4 }}>
            {isSubmitting ? "Creating account…" : "Create account →"}
          </button>
        </form>

        <p className="auth-footer" style={{ marginTop: 20 }}>
          Already registered? <Link to="/login">Sign in</Link>
        </p>
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
