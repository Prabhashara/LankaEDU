import { Link } from "react-router-dom";
import { getStoredRole } from "../services/authStorage";
import { getDashboardPath } from "../utils/roleRedirect";

export default function NotFoundPage() {
  const role = getStoredRole();
  return (
    <main className="page-shell error-shell">
      <section className="detail-panel centered-panel">
        <p className="eyebrow">Not found</p>
        <h1>404 — Page not found</h1>
        <p className="muted-text">The page you requested does not exist or may have been moved.</p>
        <div className="action-row">
          <Link className="primary-button" to={role ? getDashboardPath(role) : "/"}>Go home</Link>
          <Link className="secondary-button" to="/login">Login</Link>
        </div>
      </section>
    </main>
  );
}
