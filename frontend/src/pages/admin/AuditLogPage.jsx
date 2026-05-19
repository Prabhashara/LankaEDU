import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { getAuditEvents } from "../../services/auditService";
import { getAuthToken, getStoredRole } from "../../services/authStorage";
import { getApiErrorMessage } from "../../services/errorService";
import Icon from "../../components/Icons.jsx";
import { EmptyState, SkeletonGrid } from "../../components/UiKit.jsx";

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function actionLabel(action = "") {
  return action.replaceAll("_", " ").toLowerCase().replace(/(^|\s)\S/g, c => c.toUpperCase());
}

export default function AuditLogPage() {
  const token = getAuthToken();
  const role = getStoredRole();
  const [events, setEvents] = useState([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token || role !== "admin") return;
    let mounted = true;
    async function loadEvents() {
      try {
        const data = await getAuditEvents(150);
        if (mounted) { setEvents(data); setError(""); }
      } catch (err) {
        if (mounted) setError(getApiErrorMessage(err, "Unable to load audit events."));
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    loadEvents();
    return () => { mounted = false; };
  }, [role, token]);

  const filteredEvents = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return events;
    return events.filter(event => [event.action, event.actorEmail, event.entityType, event.entityId, event.message]
      .filter(Boolean)
      .some(item => String(item).toLowerCase().includes(value)));
  }, [events, query]);

  if (!token) return <Navigate to="/login" replace />;
  if (role !== "admin") return <Navigate to="/unauthorized" replace />;

  return (
    <main className="admin-shell audit-shell">
      <section className="admin-header" aria-labelledby="audit-title">
        <div>
          <p className="eyebrow">Security operations</p>
          <h1 id="audit-title">Audit Log</h1>
          <p className="dashboard-copy">Review sign-ins, exam changes, question updates, user actions, and submissions.</p>
        </div>
        <div className="header-actions">
          <Link className="secondary-button" to="/admin-dashboard"><Icon name="dashboard" size={16} /> Dashboard</Link>
          <Link className="primary-button" to="/admin/users"><Icon name="users" size={16} /> Manage users</Link>
        </div>
      </section>

      <section className="admin-tools" aria-label="Audit tools">
        <div className="field search-field">
          <label htmlFor="audit-search">Search audit trail</label>
          <input id="audit-search" type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by action, actor, entity, or message…" />
        </div>
      </section>

      {error && <div className="alert alert-error admin-alert"><Icon name="warning" size={16} /> {error}</div>}

      <section className="audit-timeline" aria-label="Recent audit events">
        {isLoading ? (
          <SkeletonGrid count={4} variant="list" />
        ) : filteredEvents.length === 0 ? (
          <EmptyState icon="audit" title="No audit events found" message="Try another keyword or check again after system activity." />
        ) : filteredEvents.map(event => (
          <article className="audit-event" key={event.id}>
            <div className="audit-dot" aria-hidden="true" />
            <div className="audit-card">
              <div className="audit-card-header">
                <span className="status-pill active">{actionLabel(event.action)}</span>
                <time>{formatDate(event.created_at || event.createdAt)}</time>
              </div>
              <h2>{event.message || actionLabel(event.action)}</h2>
              <dl className="audit-meta">
                <div><dt>Actor</dt><dd>{event.actorEmail || "System"}</dd></div>
                <div><dt>Role</dt><dd>{event.actorRole || "—"}</dd></div>
                <div><dt>Entity</dt><dd>{event.entityType || "—"} · {event.entityId || "—"}</dd></div>
              </dl>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
