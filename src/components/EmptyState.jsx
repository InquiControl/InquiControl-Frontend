export default function EmptyState({ icon: Icon, title, body, actionLabel, onAction }) {
  return (
    <div className="empty-state">
      {Icon && (
        <div className="empty-state__icon">
          <Icon size={26} strokeWidth={1.5} />
        </div>
      )}
      <h3>{title}</h3>
      {body && <p>{body}</p>}
      {actionLabel && onAction && (
        <button className="btn btn--primary btn--small" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
