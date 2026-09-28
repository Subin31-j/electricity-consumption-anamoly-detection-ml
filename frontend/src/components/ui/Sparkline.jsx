import { useId } from 'react';

/**
 * Minimal SVG sparkline for KPI cards. `values` must come from real data;
 * renders nothing when fewer than two points are available.
 */
export function Sparkline({ values, color = '#3b82f6', height = 36, highlight = [] }) {
  const id = useId().replace(/:/g, '');
  const pts = (values || []).filter((v) => Number.isFinite(v));
  if (pts.length < 2) return null;

  const w = 200;
  const pad = 3;
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const span = max - min || 1;
  const x = (i) => (i / (pts.length - 1)) * w;
  const y = (v) => pad + (1 - (v - min) / span) * (height - pad * 2);

  const line = pts.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const area = `${line} L${w},${height} L0,${height} Z`;

  return (
    <svg className="ui-sparkline" viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" width="100%" height={height} aria-hidden="true">
      <defs>
        <linearGradient id={`sg-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#sg-${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
      {highlight.map((i) =>
        pts[i] !== undefined ? <circle key={i} cx={x(i)} cy={y(pts[i])} r="2.4" fill="#ea580c" /> : null
      )}
    </svg>
  );
}

/** Downsample a numeric series to at most `n` points (bucket averages). */
export function downsample(values, n = 40) {
  const arr = (values || []).filter((v) => Number.isFinite(v));
  if (arr.length <= n) return arr;
  const size = arr.length / n;
  const out = [];
  for (let i = 0; i < n; i += 1) {
    const slice = arr.slice(Math.floor(i * size), Math.floor((i + 1) * size));
    out.push(slice.reduce((a, b) => a + b, 0) / (slice.length || 1));
  }
  return out;
}

export default Sparkline;
