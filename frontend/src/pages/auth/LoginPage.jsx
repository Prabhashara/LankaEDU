import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { loginUser } from "../../services/authService";
import { saveAuthSession } from "../../services/authStorage";
import { getDashboardPath } from "../../utils/roleRedirect";

export default function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const successMessage = location.state?.successMessage;
  const [form, setForm] = useState({ email: "", password: "" });
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
      const data = await loginUser({
        email: form.email.trim(),
        password: form.password
      });

      saveAuthSession({ token: data.token, role: data.role, userId: data.user.id });
      navigate(getDashboardPath(data.role), { replace: true });
    } catch (_error) {
      setError("Invalid email or password");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel narrow" aria-labelledby="login-title">
        <div className="auth-copy">
          <p className="eyebrow">Account login</p>
          <h1 id="login-title">Welcome back</h1>
          <p>Use your account to continue to the user portal.</p>
        </div>

        {successMessage ? <div className="alert alert-success">{successMessage}</div> : null}
        {error ? <div className="alert alert-error">{error}</div> : null}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={updateField}
              autoComplete="email"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={updateField}
              autoComplete="current-password"
              required
            />
          </div>
          <button className="primary-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="auth-footer">
          New student? <Link to="/signup">Create an account</Link>
        </p>
      </section>
    </main>
  );
}
