import { Icon } from './Icon';

/**
 * Content card. Backwards compatible with the original API
 * (title, actions, className) plus: subtitle, icon, variant ('dark' | 'anomaly'),
 * flush (no body padding, for full-bleed tables).
 */
export function Card({ title, subtitle, icon, actions, variant, flush = false, className = '', children, ...rest }) {
  const variantClass = variant ? `is-${variant}` : '';
  return (
    <section className={`ui-card ${variantClass} ${className}`.trim()} {...rest}>
      {(title || actions) && (
        <header className="ui-card-header">
          <div className="ui-card-heading">
            {icon && (
              <span className="ui-card-icon">
                <Icon name={icon} size={17} />
              </span>
            )}
            <div>
              {title && <h3>{title}</h3>}
              {subtitle && <p className="ui-card-subtitle">{subtitle}</p>}
            </div>
          </div>
          {actions && <div className="ui-card-actions">{actions}</div>}
        </header>
      )}
      <div className={`ui-card-body ${flush ? 'flush' : ''}`}>{children}</div>
    </section>
  );
}

/** Card preset for charts: consistent header, legend slot and body. */
export function ChartCard({ title, subtitle, icon = 'chartLine', actions, legend, children, className = '' }) {
  return (
    <Card title={title} subtitle={subtitle} icon={icon} actions={actions} className={`chart-card ${className}`}>
      {legend && <div className="chart-legend" style={{ marginBottom: 10 }}>{legend}</div>}
      {children}
    </Card>
  );
}

export default Card;
