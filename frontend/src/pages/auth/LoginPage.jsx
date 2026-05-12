import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { loginUser } from "../../services/authService";
import { saveAuthSession } from "../../services/authStorage";
import { getDashboardPath } from "../../utils/roleRedirect";

export default function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const successMessage = location.state?.successMessage;
  const initialEmail = location.state?.prefillEmail || "";
  const [form, setForm] = useState({ email: initialEmail, password: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      const data = await loginUser({ email: form.email.trim(), password: form.password });
      saveAuthSession({ token: data.token, role: data.role, userId: data.user.id, user: data.user });
      navigate(getDashboardPath(data.role), { replace: true });
    } catch {
      setError("Invalid email or password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel narrow" aria-labelledby="login-title">
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg,#006880,#00a3c4)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "1.1rem" }}>📋</div>
          <span style={{ fontWeight: 900, fontSize: "1.1rem", color: "#0f172a", letterSpacing: "-0.02em" }}>Lanka<span style={{ color: "#006880" }}>Edu</span></span>
        </div>

        <div className="auth-copy">
          <p className="eyebrow">Welcome back</p>
          <h1 id="login-title" style={{ fontSize: "1.75rem", marginBottom: 6 }}>Sign in to your account</h1>
          <p style={{ color: "#64748b", fontSize: "0.95rem" }}>Access exams, review results, and track your progress.</p>
        </div>

        {successMessage && <div className="alert alert-success" style={{ marginBottom: 18 }}>✓ {successMessage}</div>}
        {error && <div className="alert alert-error" style={{ marginBottom: 18 }}>⚠ {error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">Email address</label>
            <input id="email" name="email" type="email" value={form.email} onChange={updateField} autoComplete="email" placeholder="you@university.edu" required />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" value={form.password} onChange={updateField} autoComplete="current-password" placeholder="••••••••" required />
          </div>
          <button className="primary-button" type="submit" disabled={isSubmitting} style={{ marginTop: 4, width: "100%", justifyContent: "center" }}>
            {isSubmitting ? "Signing in…" : "Sign in →"}
          </button>
        </form>

        <p className="auth-footer" style={{ marginTop: 20 }}>
          Don't have an account? <Link to="/signup">Create one free</Link>
        </p>
      </section>
    </main>
  );
}
