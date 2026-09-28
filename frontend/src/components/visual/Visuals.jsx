/**
 * ECAD decorative visual language. All elements are purely decorative
 * (aria-hidden) and never carry data. Animations are CSS-driven and are
 * disabled automatically for reduced-motion users.
 */
import { useId } from 'react';

/** ECAD logo mark: a bolt inside a pulse ring. */
export function EcadLogo({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M13.2 2.5 5 13.6h6.1l-1 7.9 8-11.1H12l1.2-7.9Z" fill="#fff" />
    </svg>
  );
}

/** Horizontal looping electrical waveform. */
export function ElectricWave({ height = 60, color = '#3b82f6', opacity = 0.5, animated = true, className = '' }) {
  const d =
    'M0 30 C 25 30, 35 10, 50 10 S 75 50, 100 50 S 125 10, 150 10 S 175 30, 200 30 L 210 30 L 216 8 L 222 52 L 228 22 L 234 30 C 260 30, 270 10, 285 10 S 310 50, 335 50 S 360 10, 375 10 S 395 30, 400 30';
  return (
    <svg
      className={`ecad-wave ${animated ? 'is-animated' : ''} ${className}`}
      viewBox="0 0 800 60"
      preserveAspectRatio="none"
      width="100%"
      height={height}
      aria-hidden="true"
    >
      <g className="ecad-wave-track" style={{ opacity }}>
        <path d={d} fill="none" stroke={color} strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
        <path d={d} transform="translate(400 0)" fill="none" stroke={color} strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
      </g>
    </svg>
  );
}

/** Concentric pulse around a dot - used to mark "live"/active states. */
export function EnergyPulse({ color = '#3b82f6', size = 10, className = '' }) {
  return (
    <span className={`ecad-pulse ${className}`} style={{ '--pulse-color': color, width: size, height: size }} aria-hidden="true">
      <span />
    </span>
  );
}

/** Orange ringed marker used to represent an anomaly point. */
export function AnomalyMarker({ size = 14, strong = false }) {
  const c = strong ? '#dc2626' : '#ea580c';
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true" className="ecad-anomaly-marker">
      <circle cx="10" cy="10" r="9" fill={c} opacity="0.15" />
      <circle cx="10" cy="10" r="5.5" fill="none" stroke={c} strokeWidth="1.5" />
      <circle cx="10" cy="10" r="2.5" fill={c} />
    </svg>
  );
}

/** Subtle blueprint-style grid, absolutely positioned behind content. */
export function DataGridBackground({ dark = false, className = '' }) {
  return <div className={`ecad-grid-bg ${dark ? 'is-dark' : ''} ${className}`} aria-hidden="true" />;
}

/** Signal path connector used between pipeline steps. */
export function SignalLine({ vertical = false, className = '' }) {
  return (
    <svg
      className={`ecad-signal ${vertical ? 'is-vertical' : ''} ${className}`}
      viewBox={vertical ? '0 0 4 40' : '0 0 40 4'}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {vertical ? (
        <line x1="2" y1="0" x2="2" y2="40" strokeDasharray="4 4" />
      ) : (
        <line x1="0" y1="2" x2="40" y2="2" strokeDasharray="4 4" />
      )}
    </svg>
  );
}

/**
 * Landing-page hero illustration: stylized consumption curve with a normal
 * band and highlighted anomaly points. Illustrative only - no data values.
 */
export function HeroVisual() {
  const id = useId().replace(/:/g, '');
  // Hand-drawn illustrative curve (not data).
  const curve =
    'M0 210 C 40 200, 60 170, 95 175 S 150 215, 190 200 S 240 140, 275 150 S 320 60, 350 70 S 385 170, 420 165 S 470 120, 505 130 S 545 200, 580 190 S 620 105, 650 115 S 690 230, 720 222 S 770 150, 800 160';
  const anomalies = [
    { x: 350, y: 70, label: 'Unusual peak', strong: true },
    { x: 720, y: 222, label: 'Unexpected drop', strong: false },
  ];
  return (
    <div className="hero-visual" aria-hidden="true">
      <svg viewBox="0 0 800 300" preserveAspectRatio="none" className="hero-visual-svg">
        <defs>
          <linearGradient id={`hv-area-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`hv-line-${id}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.4" />
            <stop offset="45%" stopColor="#93c5fd" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
          <filter id={`hv-glow-${id}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* normal band */}
        <rect x="0" y="120" width="800" height="90" fill="rgba(59,130,246,0.06)" />
        <line x1="0" y1="120" x2="800" y2="120" stroke="rgba(147,197,253,0.25)" strokeDasharray="4 6" />
        <line x1="0" y1="210" x2="800" y2="210" stroke="rgba(147,197,253,0.25)" strokeDasharray="4 6" />

        <path d={`${curve} L800 300 L0 300 Z`} fill={`url(#hv-area-${id})`} />
        <path
          d={curve}
          fill="none"
          stroke={`url(#hv-line-${id})`}
          strokeWidth="3"
          filter={`url(#hv-glow-${id})`}
          className="hero-visual-line"
          vectorEffect="non-scaling-stroke"
        />

        {/* regular sample points */}
        {[95, 190, 275, 420, 505, 580, 650].map((x, i) => (
          <circle key={x} cx={x} cy={[175, 200, 150, 165, 130, 190, 115][i]} r="3.5" fill="#0d1830" stroke="#93c5fd" strokeWidth="1.5" />
        ))}

        {anomalies.map((a) => (
          <g key={a.x} className="hero-anomaly">
            <circle cx={a.x} cy={a.y} r="18" fill={a.strong ? 'rgba(220,38,38,0.16)' : 'rgba(234,88,12,0.16)'} className="hero-anomaly-ring" />
            <circle cx={a.x} cy={a.y} r="7" fill={a.strong ? '#ef4444' : '#f97316'} stroke="#fff" strokeWidth="2" />
          </g>
        ))}
      </svg>

      <div className="hero-float hero-float-a">
        <span className="hero-float-dot is-anomaly" />
        <div>
          <strong>Anomaly flagged</strong>
          <small>Isolation Forest · high score</small>
        </div>
      </div>
      <div className="hero-float hero-float-b">
        <span className="hero-float-dot" />
        <div>
          <strong>Normal band</strong>
          <small>Expected consumption range</small>
        </div>
      </div>
      <div className="hero-float hero-float-c">
        <span className="hero-float-dot is-warn" />
        <div>
          <strong>3-model agreement</strong>
          <small>IF · K-Means · LOF</small>
        </div>
      </div>
      <span className="hero-visual-caption">Illustration</span>
    </div>
  );
}
