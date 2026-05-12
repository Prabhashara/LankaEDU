import { Link, useLocation } from "react-router-dom";
import { getStoredRole } from "../services/authStorage";
import { getDashboardPath } from "../utils/roleRedirect";

export default function UnauthorizedPage() {
  const location = useLocation();
  const role = getStoredRole();
  const dashboard = location.state?.dashboard || getDashboardPath(role);
  return (
    <main className="page-shell error-shell">
      <section className="detail-panel centered-panel">
        <p className="eyebrow">Access control</p>
        <h1>403 — This area is restricted</h1>
        <p className="muted-text">Your current role does not have permission to open this page.</p>
        <div className="action-row">
          <Link className="primary-button" to={dashboard}>Back to dashboard</Link>
          <Link className="secondary-button" to="/logout">Sign out</Link>
        </div>
      </section>
    </main>
  );
}
