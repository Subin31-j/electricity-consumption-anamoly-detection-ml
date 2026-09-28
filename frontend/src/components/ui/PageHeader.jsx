import { Icon } from './Icon';

/** Page-level heading with optional eyebrow, subtitle, meta chips and actions. */
export function PageHeader({ eyebrow, eyebrowIcon = 'bolt', title, subtitle, actions, meta, children }) {
  return (
    <header className="page-header">
      <div className="page-header-text">
        {eyebrow && (
          <div className="page-eyebrow">
            <Icon name={eyebrowIcon} size={13} />
            {eyebrow}
          </div>
        )}
        <h1>{title}</h1>
        {subtitle && <p className="page-header-sub">{subtitle}</p>}
        {meta && meta.length > 0 && (
          <div className="page-meta">
            {meta.map((m) => (
              <span className="meta-chip" key={m.label}>
                {m.icon && <Icon name={m.icon} size={13} />}
                {m.label}: <strong>{m.value}</strong>
              </span>
            ))}
          </div>
        )}
        {children}
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </header>
  );
}

/** Section divider heading inside a page. */
export function SectionHeader({ title, subtitle, actions, id }) {
  return (
    <div className="section-header">
      <div>
        <h2 id={id}>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </div>
  );
}

export default PageHeader;
