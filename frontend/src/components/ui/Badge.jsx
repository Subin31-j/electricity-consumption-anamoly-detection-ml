/** Small label. tone: default | primary | success | warning | danger | anomaly | dark | outline */
export function Badge({ tone = 'default', dot = false, children, className = '' }) {
  return (
    <span className={`ui-badge tone-${tone} ${className}`.trim()}>
      {dot && <span className="dot" aria-hidden="true" />}
      {children}
    </span>
  );
}

const STATUS_TONE = {
  ACTIVE: 'success',
  COMPLETED: 'success',
  healthy: 'success',
  VALIDATED: 'success',
  PROCESSED: 'success',
  READY: 'success',
  RUNNING: 'primary',
  PENDING: 'warning',
  UPLOADED: 'primary',
  degraded: 'warning',
  DISABLED: 'danger',
  FAILED: 'danger',
  unavailable: 'danger',
  ADMIN: 'dark',
  USER: 'outline',
};

/** Badge whose tone is derived from a backend status string. */
export function StatusBadge({ status, label }) {
  if (status === null || status === undefined || status === '') return <span className="text-muted">-</span>;
  const tone = STATUS_TONE[status] || 'default';
  const text = label || String(status).charAt(0).toUpperCase() + String(status).slice(1).toLowerCase();
  return (
    <Badge tone={tone} dot>
      {text}
    </Badge>
  );
}

export default Badge;
