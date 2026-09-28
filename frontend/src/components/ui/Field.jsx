import { useId } from 'react';
import { Icon } from './Icon';

/** Labelled text input. All native input props pass through. */
export function Input({ label, hint, error, icon, id, className = '', ...rest }) {
  const autoId = useId();
  const inputId = id || autoId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errId = error ? `${inputId}-err` : undefined;
  const input = (
    <input
      id={inputId}
      className={`input ${className}`}
      aria-invalid={error ? true : undefined}
      aria-describedby={[hintId, errId].filter(Boolean).join(' ') || undefined}
      {...rest}
    />
  );
  return (
    <div className="field">
      {label && (
        <label className="field-label" htmlFor={inputId}>
          {label}
        </label>
      )}
      {icon ? (
        <div className="input-with-icon">
          <Icon name={icon} size={16} />
          {input}
        </div>
      ) : (
        input
      )}
      {hint && !error && (
        <span className="field-hint" id={hintId}>
          {hint}
        </span>
      )}
      {error && (
        <span className="field-error" id={errId}>
          {error}
        </span>
      )}
    </div>
  );
}

/** Labelled select. options: [{ value, label }] */
export function Select({ label, options = [], id, className = '', hideLabel = false, ...rest }) {
  const autoId = useId();
  const selectId = id || autoId;
  return (
    <div className="field">
      {label && (
        <label className={hideLabel ? 'sr-only' : 'field-label'} htmlFor={selectId}>
          {label}
        </label>
      )}
      <select id={selectId} className={`select ${className}`} {...rest}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/** Accessible on/off switch backed by a native checkbox. */
export function Switch({ checked, onChange, label, description, disabled }) {
  return (
    <label className="switch">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} disabled={disabled} />
      <span className="switch-track" aria-hidden="true" />
      <span>
        <span style={{ fontWeight: 600, color: 'var(--text)' }}>{label}</span>
        {description && (
          <span className="field-hint" style={{ display: 'block' }}>
            {description}
          </span>
        )}
      </span>
    </label>
  );
}
