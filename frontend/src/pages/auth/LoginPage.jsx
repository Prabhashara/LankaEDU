import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { loginUser } from "../../services/authService";
import { saveAuthSession } from "../../services/authStorage";
import { getApiErrorMessage } from "../../services/errorService";
import { getDashboardPath } from "../../utils/roleRedirect";
import Icon from "../../components/Icons.jsx";

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
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Invalid email or password. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-shell auth-shell-premium">
      <section className="auth-layout" aria-labelledby="login-title">
        <aside className="auth-visual-panel" aria-label="Platform highlights">
          <div className="auth-brand auth-brand-large">
            <div className="brand-mark"><Icon name="exam" size={22} /></div>
            <span className="brand-wordmark">Lanka<span>Edu</span></span>
          </div>
          <div className="auth-visual-content">
            <span className="home-highlight">Secure assessment workspace</span>
            <h2>Manage exams, progress, and results from one clean portal.</h2>
            <p>
              Role-based access, real-time exam timers, instant reporting, and analytics are kept ready for students, lecturers, and administrators.
            </p>
          </div>
          <div className="auth-preview-card">
            <div className="preview-score-ring">84%</div>
            <div>
              <strong>Latest Result</strong>
              <small>Data Structures Final · Grade A</small>
            </div>
          </div>
        </aside>

        <section className="auth-panel narrow auth-card-premium">
          <div className="auth-brand">
            <div className="brand-mark"><Icon name="exam" size={22} /></div>
            <span className="brand-wordmark">Lanka<span>Edu</span></span>
          </div>

          <div className="auth-copy">
            <p className="eyebrow">Welcome back</p>
            <h1 id="login-title">Sign in to your account</h1>
            <p>Access exams, review results, and track your progress.</p>
          </div>

          {successMessage && <div className="alert alert-success auth-alert"><Icon name="check" size={16} /> {successMessage}</div>}
          {error && <div className="alert alert-error auth-alert"><Icon name="warning" size={16} /> {error}</div>}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="email">Email address</label>
              <input id="email" name="email" type="email" value={form.email} onChange={updateField} autoComplete="email" placeholder="you@university.edu" required />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input id="password" name="password" type="password" value={form.password} onChange={updateField} autoComplete="current-password" placeholder="••••••••" required />
            </div>
            <button className="primary-button full-width-button" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Signing in…" : <>Sign in <Icon name="arrowRight" size={16} /></>}
            </button>
          </form>

          <p className="auth-footer">
            Don't have an account? <Link to="/signup">Create one free</Link>
          </p>
        </section>
      </section>
    </main>
  );
}
