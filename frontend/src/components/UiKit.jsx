import Icon from "./Icons.jsx";

export function EmptyState({ icon = "book", title = "Nothing found", message, action }) {
  return (
    <div className="empty-state-panel">
      <div className="empty-state-icon"><Icon name={icon} size={28} /></div>
      <h3>{title}</h3>
      {message ? <p>{message}</p> : null}
      {action ? <div className="empty-state-action">{action}</div> : null}
    </div>
  );
}

export function SkeletonGrid({ count = 3, variant = "card" }) {
  return (
    <div className={`skeleton-grid skeleton-grid-${variant}`} aria-label="Loading content">
      {Array.from({ length: count }).map((_, index) => (
        <div className="skeleton-card" key={index}>
          <div className="skeleton-line short" />
          <div className="skeleton-line" />
          <div className="skeleton-line medium" />
          <div className="skeleton-footer" />
        </div>
      ))}
    </div>
  );
}

export function ConfirmModal({ icon = "warning", title, message, confirmLabel = "Confirm", cancelLabel = "Cancel", danger = false, isBusy = false, onConfirm, onCancel, children }) {
  return (
    <div className="modal-backdrop professional-modal-backdrop" role="presentation">
      <div className="modal professional-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title">
        <div className={`modal-hero-icon ${danger ? "danger" : "primary"}`}><Icon name={icon} size={26} /></div>
        <h2 id="confirm-modal-title">{title}</h2>
        {message ? <p className="modal-message">{message}</p> : null}
        {children}
        <div className="modal-actions">
          <button className="secondary-button" type="button" onClick={onCancel} disabled={isBusy}>{cancelLabel}</button>
          <button className={danger ? "danger-button solid" : "primary-button"} type="button" onClick={onConfirm} disabled={isBusy}>{isBusy ? "Working…" : confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

export function StatCard({ label, value, sub, icon = "analytics", tone = "teal" }) {
  return (
    <div className={`stat-card ${tone}`}>
      <div className="stat-card-topline">
        <div className="stat-card-label">{label}</div>
        <span className="stat-card-icon"><Icon name={icon} size={18} /></span>
      </div>
      <div className="stat-card-value">{value}</div>
      <div className="stat-card-sub">{sub}</div>
    </div>
  );
}
