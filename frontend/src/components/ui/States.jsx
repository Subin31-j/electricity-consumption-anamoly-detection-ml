import { Icon } from './Icon';

export function Skeleton({ width = '100%', height = 14, radius, style }) {
  return <span className="skeleton" style={{ width, height, borderRadius: radius, ...style }} aria-hidden="true" />;
}

function SkeletonStat() {
  return (
    <div className="skeleton-card">
      <Skeleton width="45%" height={10} />
      <Skeleton width="65%" height={24} />
      <Skeleton width="100%" height={26} />
    </div>
  );
}

function SkeletonChart({ height = 280 }) {
  return (
    <div className="skeleton-card skeleton-chart" style={{ height }}>
      <Skeleton width="30%" height={14} />
      <Skeleton width="18%" height={10} />
      <svg viewBox="0 0 400 100" preserveAspectRatio="none" aria-hidden="true">
        <path
          d="M0 70 C 40 60, 60 30, 100 45 S 160 80, 200 55 S 260 20, 300 40 S 360 70, 400 50"
          fill="none"
          stroke="#dbe3ef"
          strokeWidth="3"
        />
      </svg>
    </div>
  );
}

function SkeletonTable({ rows = 6 }) {
  return (
    <div className="skeleton-card">
      <Skeleton width="25%" height={14} />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} height={12} width={`${92 - (i % 3) * 8}%`} />
      ))}
    </div>
  );
}

/**
 * Loading placeholder. `variant`:
 *  - 'page' (default): KPI row + chart + table skeleton
 *  - 'cards' | 'chart' | 'table' | 'inline'
 * The original `label` prop is kept and announced to screen readers.
 */
export function Loading({ label = 'Loading…', variant = 'page', rows }) {
  if (variant === 'inline') {
    return (
      <div className="ui-loading" role="status">
        <span className="ui-spinner" aria-hidden="true" />
        <span>{label}</span>
      </div>
    );
  }
  return (
    <div className="skeleton-page" role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      {(variant === 'page' || variant === 'cards') && (
        <div className="skeleton-row">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonStat key={i} />
          ))}
        </div>
      )}
      {(variant === 'page' || variant === 'chart') && <SkeletonChart />}
      {(variant === 'page' || variant === 'table') && <SkeletonTable rows={rows} />}
    </div>
  );
}

/** Small ECAD-language illustration: flat signal with a single highlighted point. */
function StateArt({ tone = 'blue' }) {
  const stroke = tone === 'error' ? '#fca5a5' : '#bfd3f6';
  const dot = tone === 'error' ? '#dc2626' : '#2563eb';
  return (
    <svg className="state-art" viewBox="0 0 168 72" aria-hidden="true">
      <defs>
        <pattern id={`sa-grid-${tone}`} width="12" height="12" patternUnits="userSpaceOnUse">
          <path d="M12 0H0V12" fill="none" stroke="#eef2f8" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="168" height="72" rx="10" fill={`url(#sa-grid-${tone})`} />
      <path
        d="M8 44 H40 L48 44 L54 30 L60 54 L66 38 L72 44 H96 C104 44 108 26 116 26 C124 26 126 44 134 44 H160"
        fill="none"
        stroke={stroke}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="116" cy="26" r="9" fill={dot} opacity="0.12" />
      <circle cx="116" cy="26" r="4" fill={dot} />
    </svg>
  );
}

export function EmptyState({ title = 'Nothing here yet', message, action, icon, compact = false }) {
  return (
    <div className={`ui-empty-state ${compact ? 'compact' : ''}`}>
      {icon ? (
        <span className="ui-card-icon" style={{ width: 44, height: 44, borderRadius: 12 }}>
          <Icon name={icon} size={22} />
        </span>
      ) : (
        <StateArt />
      )}
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {action && <div className="state-actions">{action}</div>}
    </div>
  );
}

export function ErrorState({ title = 'Something went wrong', message, onRetry, compact = false }) {
  return (
    <div className={`ui-error-state ${compact ? 'compact' : ''}`} role="alert">
      <StateArt tone="error" />
      <h3>{title}</h3>
      {message && <p>{typeof message === 'string' ? message : 'The request could not be completed.'}</p>}
      {onRetry && (
        <div className="state-actions">
          <button className="btn-primary" onClick={onRetry} type="button">
            <Icon name="refresh" size={16} /> Try again
          </button>
        </div>
      )}
    </div>
  );
}

export function SuccessBanner({ message }) {
  return (
    <div className="alert alert-success" role="status">
      <Icon name="checkCircle" size={16} />
      <span>{message}</span>
    </div>
  );
}

export function Alert({ tone = 'info', children, icon }) {
  const iconName = icon || (tone === 'error' ? 'alertCircle' : tone === 'success' ? 'checkCircle' : tone === 'warning' ? 'alert' : 'info');
  return (
    <div className={`alert alert-${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      <Icon name={iconName} size={16} />
      <div>{children}</div>
    </div>
  );
}
