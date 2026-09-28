import { Icon } from './Icon';
import { Sparkline } from './Sparkline';
import { useCountUp } from './motion';

function CountValue({ value, decimals }) {
  const v = useCountUp(value);
  if (typeof value !== 'number' || !Number.isFinite(value)) return value ?? '-';
  return v.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/**
 * KPI card. Original API (label, value, hint, tone) is preserved.
 * Extras: icon, unit, spark (numeric array from real data), decimals, animate.
 * tone: default | primary | success | warning | danger | anomaly | dark
 */
export function StatCard({
  label,
  value,
  hint,
  tone = 'default',
  icon,
  unit,
  spark,
  sparkColor,
  decimals,
  animate = true,
  style,
}) {
  const auto = typeof value === 'number' ? (Number.isInteger(value) ? 0 : Math.abs(value) >= 100 ? 1 : 2) : 0;
  const dec = decimals ?? auto;
  const color = sparkColor || (tone === 'anomaly' || tone === 'danger' ? '#ea580c' : tone === 'dark' ? '#60a5fa' : '#3b82f6');

  return (
    <div className={`ui-statcard tone-${tone}`} style={style}>
      <div className="ui-statcard-top">
        <span className="ui-statcard-label">{label}</span>
        {icon && (
          <span className="ui-statcard-icon">
            <Icon name={icon} size={16} />
          </span>
        )}
      </div>
      <div className="ui-statcard-value">
        {animate ? <CountValue value={value} decimals={dec} /> : value ?? '-'}
        {unit && <span className="ui-statcard-unit">{unit}</span>}
      </div>
      {hint && <div className="ui-statcard-hint">{hint}</div>}
      {spark && spark.length > 1 && (
        <div className="ui-statcard-spark">
          <Sparkline values={spark} color={color} />
        </div>
      )}
    </div>
  );
}

export default StatCard;
