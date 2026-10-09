import { useCallback, useRef, useState } from 'react';
import { Icon } from './Icon';
import { downloadChartImage, slugify } from '../../utils/chartExport';

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

/** Icon-only button that exports the sibling chart as a PNG image. */
function ChartDownloadButton({ targetRef, title }) {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const onClick = useCallback(async () => {
    setBusy(true);
    setFailed(false);
    try {
      await downloadChartImage(targetRef.current, slugify(title, 'chart'));
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }, [targetRef, title]);

  const label = failed ? 'Chart could not be downloaded' : `Download "${title || 'chart'}" as an image`;
  return (
    <button
      type="button"
      className="btn-ghost btn-sm btn-icon chart-dl"
      onClick={onClick}
      disabled={busy}
      title={label}
      aria-label={label}
    >
      <Icon name={failed ? 'alert' : 'download'} size={14} />
    </button>
  );
}

/**
 * Card preset for charts: consistent header, legend slot and body.
 * Set `downloadable` to add a download-as-image button to the header.
 */
export function ChartCard({
  title,
  subtitle,
  icon = 'chartLine',
  actions,
  legend,
  downloadable = false,
  children,
  className = '',
}) {
  const chartRef = useRef(null);
  const headerActions =
    actions || downloadable ? (
      <>
        {actions}
        {downloadable && <ChartDownloadButton targetRef={chartRef} title={title} />}
      </>
    ) : null;

  return (
    <Card title={title} subtitle={subtitle} icon={icon} actions={headerActions} className={`chart-card ${className}`}>
      {legend && <div className="chart-legend" style={{ marginBottom: 10 }}>{legend}</div>}
      <div className="chart-capture" ref={chartRef}>
        {children}
      </div>
    </Card>
  );
}

export default Card;
