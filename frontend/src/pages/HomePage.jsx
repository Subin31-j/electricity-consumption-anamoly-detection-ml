import { useId, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Icon } from '../components/ui/Icon';
import { useScrollReveal } from '../components/ui/motion';
import { DataGridBackground, ElectricWave } from '../components/visual/Visuals';

const HERO_STEPS = ['Data', 'Machine Learning', 'Anomaly Detection', 'Insights'];

/*
 * Illustrative consumption curve for the hero card (NOT real data - the card
 * is labelled "Illustrative"). Two spikes are marked as flagged readings.
 */
const CHART_Y = [118, 108, 112, 102, 96, 100, 104, 82, 92, 98, 102, 94, 18, 90, 96, 100, 88, 80, 90, 98, 102, 94, 12, 86, 90, 98, 102, 96, 90, 95];
const CHART_FLAGS = [12, 22];

function HeroChartCard() {
  const gid = useId().replace(/:/g, '');
  const w = 400;
  const h = 140;
  const step = w / (CHART_Y.length - 1);
  const pts = CHART_Y.map((y, i) => [i * step, y]);
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y}`).join(' ');

  return (
    <figure className="home-card" aria-label="Illustrative consumption chart with two readings flagged as unusual">
      <div className="home-card-head">
        <strong>Consumption pattern with flagged records</strong>
        <span className="home-card-badge">Illustrative</span>
      </div>
      <svg className="home-chart" viewBox={`0 0 ${w} ${h}`} role="img" aria-hidden="true">
        <defs>
          <linearGradient id={`hc-${gid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[30, 65, 100].map((y) => (
          <line key={y} x1="0" x2={w} y1={y} y2={y} stroke="#e4eaf3" strokeDasharray="3 4" strokeWidth="1" />
        ))}
        <path d={`${line} L${w},${h} L0,${h} Z`} fill={`url(#hc-${gid})`} />
        <path
          className="home-chart-line"
          pathLength="1"
          d={line}
          fill="none"
          stroke="#2563eb"
          strokeWidth="1.8"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {CHART_FLAGS.map((i) => (
          <g key={i} className="home-chart-flag">
            <circle cx={pts[i][0]} cy={pts[i][1]} r="7" fill="#ef4444" opacity="0.2" />
            <circle cx={pts[i][0]} cy={pts[i][1]} r="3.6" fill="#ef4444" />
          </g>
        ))}
      </svg>
      <figcaption className="home-legend">
        <span><i className="is-normal" /> Normal consumption</span>
        <span><i className="is-flag" /> Flagged as unusual</span>
      </figcaption>
      <dl className="home-metrics">
        <div><dt>Algorithms</dt><dd>3</dd></div>
        <div><dt>Charts</dt><dd>7</dd></div>
        <div><dt>Output</dt><dd>PDF + JSON</dd></div>
      </dl>
    </figure>
  );
}

const STEPS = [
  { n: '01', title: 'Collect', text: 'Historical electricity consumption data from a demo consumer number or your own CSV / Excel file.', icon: 'database' },
  { n: '02', title: 'Prepare', text: 'Validate, clean and normalize readings, then engineer time-based features.', icon: 'sliders' },
  { n: '03', title: 'Detect', text: 'Machine-learning models identify readings that do not fit the usual pattern.', icon: 'cpu' },
  { n: '04', title: 'Understand', text: 'Visualize anomalies, compare models and review data-driven insights.', icon: 'chartLine' },
];

const MODELS = [
  {
    name: 'Isolation Forest',
    tag: 'Primary model',
    icon: 'tree',
    color: '#2563eb',
    text: 'Randomly partitions the data; readings that are isolated in very few splits are unusual. Efficient on multi-feature consumption data.',
    tech: 'Ensemble of 100 isolation trees · contamination-based threshold',
  },
  {
    name: 'K-Means',
    tag: 'Cluster analysis',
    icon: 'clusters',
    color: '#0891b2',
    text: 'Groups similar consumption behaviour into clusters. Readings far from their cluster centre are flagged for comparison.',
    tech: 'Distance-to-centroid scoring · percentile threshold',
  },
  {
    name: 'Local Outlier Factor',
    tag: 'Density analysis',
    icon: 'radar',
    color: '#7c3aed',
    text: 'Compares each reading to its local neighbourhood. Points in much sparser regions than their neighbours stand out.',
    tech: 'k-nearest-neighbour local density ratio',
  },
];

const FLOW = [
  { label: 'Consumption Data', icon: 'database' },
  { label: 'Preprocessing', icon: 'sliders' },
  { label: 'ML Models', icon: 'cpu' },
  { label: 'Anomaly Detection', icon: 'target', accent: true },
  { label: 'Insights', icon: 'lightbulb' },
];

const FEATURES = [
  { title: 'Historical Analysis', text: 'Analyze months of stored readings per consumer or dataset.', icon: 'history' },
  { title: 'Anomaly Detection', text: 'Flag readings that break the usual consumption pattern.', icon: 'alert', accent: true },
  { title: 'Consumption Trends', text: 'Hourly, daily and monthly patterns at a glance.', icon: 'trendUp' },
  { title: 'Model Comparison', text: 'See where Isolation Forest, K-Means and LOF agree.', icon: 'compare' },
  { title: 'Interactive Visualizations', text: 'Zoomable ranges, tooltips with scores and agreement.', icon: 'chartBar' },
  { title: 'Reports', text: 'Generate a summary report for any completed analysis.', icon: 'report' },
];

const FUTURE = [
  { label: 'Smart Meter', icon: 'meter' },
  { label: 'Authorized API', icon: 'lock' },
  { label: 'ECAD Backend', icon: 'server' },
  { label: 'ML Model', icon: 'cpu' },
  { label: 'Real-Time Anomaly', icon: 'zap', accent: true },
  { label: 'Dashboard', icon: 'dashboard' },
];

const REVEAL =
  '.landing-head, .step, .landing-model, .flow-item, .feature, .demo-grid > *, .future-arch, .cta-inner > *';

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const rootRef = useRef(null);
  useScrollReveal(rootRef, REVEAL);
  return (
    <div className="landing" ref={rootRef}>
      {/* ---------------- HERO ---------------- */}
      <section className="home-hero" aria-labelledby="hero-title">
        <div className="home-hero-inner">
          <div className="home-hero-copy">
            <span className="home-pill">
              <Icon name="sparkles" size={14} /> Machine Learning Project
            </span>
            <h1 id="hero-title">
              <span>Electricity Consumption</span> <span>Anomaly Detection</span>
            </h1>
            <p className="home-lead">
              Analyze historical electricity consumption data and identify unusual patterns using machine learning.
            </p>
            <div className="home-actions">
              {isAuthenticated ? (
                <Link to="/dashboard" className="home-btn home-btn-primary">
                  Open Dashboard <Icon name="arrowRight" size={17} />
                </Link>
              ) : (
                <>
                  <Link to="/register" className="home-btn home-btn-primary">
                    Get Started <Icon name="arrowRight" size={17} />
                  </Link>
                  <Link to="/login" className="home-btn home-btn-light">
                    Login
                  </Link>
                </>
              )}
              <a href="#how-it-works" className="home-btn home-btn-light">
                <Icon name="compass" size={17} /> Explore Project
              </a>
            </div>
            <ol className="home-steps" aria-label="ECAD process">
              {HERO_STEPS.map((s, i) => (
                <li key={s} className={i === HERO_STEPS.length - 1 ? 'is-final' : ''}>
                  <span className="home-step">{s}</span>
                  {i < HERO_STEPS.length - 1 && <Icon name="arrowRight" size={13} className="home-step-arrow" />}
                </li>
              ))}
            </ol>
          </div>
          <HeroChartCard />
        </div>
      </section>

      {/* ---------------- HOW IT WORKS ---------------- */}
      <section className="landing-section" id="how-it-works" aria-labelledby="how-title">
        <div className="landing-inner">
          <div className="landing-head">
            <span className="landing-eyebrow">Process</span>
            <h2 id="how-title">How ECAD Works</h2>
            <p>Understand electricity. Detect unusual behaviour. Make data-driven decisions.</p>
          </div>
          <ol className="steps">
            {STEPS.map((s) => (
              <li key={s.n} className="step">
                <div className="step-top">
                  <span className="step-num">{s.n}</span>
                  <span className="step-icon"><Icon name={s.icon} size={20} /></span>
                </div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------------- MODELS ---------------- */}
      <section className="landing-section is-tinted" id="models" aria-labelledby="models-title">
        <div className="landing-inner">
          <div className="landing-head">
            <span className="landing-eyebrow">Machine learning</span>
            <h2 id="models-title">Powered by Machine Learning</h2>
            <p>Isolation Forest leads the analysis. K-Means and LOF provide independent comparison views.</p>
          </div>
          <div className="landing-models">
            {MODELS.map((m, i) => (
              <article key={m.name} className={`landing-model ${i === 0 ? 'is-primary' : ''}`} style={{ '--model-color': m.color }}>
                <span className="model-icon" style={{ '--model-color': m.color }}>
                  <Icon name={m.icon} size={22} />
                </span>
                <span className="landing-model-tag">{m.tag}</span>
                <h3>{m.name}</h3>
                <p>{m.text}</p>
                <code>{m.tech}</code>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- DATA TO INSIGHT ---------------- */}
      <section className="landing-section is-dark" aria-labelledby="flow-title">
        <DataGridBackground dark />
        <div className="landing-inner">
          <div className="landing-head">
            <span className="landing-eyebrow">Pipeline</span>
            <h2 id="flow-title">From Data to Insight</h2>
            <p>Both input paths converge on the same preprocessing and ML pipeline.</p>
          </div>
          <div className="flow">
            {FLOW.map((f, i) => (
              <div key={f.label} className="flow-item">
                <div className={`flow-node ${f.accent ? 'is-accent' : ''}`}>
                  <Icon name={f.icon} size={22} />
                </div>
                <span>{f.label}</span>
                {i < FLOW.length - 1 && <span className="flow-link" aria-hidden="true" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- FEATURES ---------------- */}
      <section className="landing-section" id="features" aria-labelledby="features-title">
        <div className="landing-inner">
          <div className="landing-head">
            <span className="landing-eyebrow">Capabilities</span>
            <h2 id="features-title">Built for Electricity Intelligence</h2>
          </div>
          <div className="feature-grid">
            {FEATURES.map((f) => (
              <div key={f.title} className={`feature ${f.accent ? 'is-accent' : ''}`}>
                <span className="feature-icon"><Icon name={f.icon} size={19} /></span>
                <div>
                  <h3>{f.title}</h3>
                  <p>{f.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- DEMO ---------------- */}
      <section className="landing-section is-tinted" id="demo" aria-labelledby="demo-title">
        <div className="landing-inner demo-grid">
          <div>
            <span className="landing-eyebrow">Prototype</span>
            <h2 id="demo-title">Demo Consumer Analysis</h2>
            <p className="landing-p">
              The prototype includes five fictional demo consumer accounts. Each 11-digit consumer number is mapped to
              historical consumption data stored in the ECAD database. Enter a number to preview the data and run the
              full ML pipeline on it.
            </p>
            <div className="alert alert-warning" style={{ marginTop: 16 }}>
              <Icon name="info" size={16} />
              <span>
                <strong>Prototype uses historical demo data.</strong> It is not connected to a real electricity board.
              </span>
            </div>
            <Link to="/consumption" className="btn-primary" style={{ marginTop: 8 }}>
              Try a demo consumer <Icon name="arrowRight" size={15} />
            </Link>
          </div>
          <div className="demo-card" aria-hidden="true">
            <div className="demo-card-head">
              <Icon name="meter" size={18} />
              <span>Consumer Number</span>
            </div>
            <div className="demo-digits">
              {Array.from({ length: 11 }).map((_, i) => (
                <span key={i} style={{ '--i': i }} />
              ))}
            </div>
            <div className="demo-card-steps">
              <span><Icon name="checkCircle" size={14} /> Verify</span>
              <span><Icon name="checkCircle" size={14} /> Preview</span>
              <span><Icon name="checkCircle" size={14} /> Analyze</span>
            </div>
            <ElectricWave height={36} color="#2563eb" opacity={0.5} />
          </div>
        </div>
      </section>

      {/* ---------------- FUTURE ---------------- */}
      <section className="landing-section" id="future" aria-labelledby="future-title">
        <div className="landing-inner">
          <div className="landing-head">
            <span className="landing-eyebrow is-future">Future extension</span>
            <h2 id="future-title">Future: Real-Time Monitoring</h2>
            <p>
              A possible next step - not part of the current prototype. Real-time readings would require an authorized smart
              meter or provider API; a consumer number alone cannot provide live data.
            </p>
          </div>
          <div className="future-arch">
            <span className="future-badge">FUTURE EXTENSION</span>
            <div className="flow is-light">
              {FUTURE.map((f, i) => (
                <div key={f.label} className="flow-item">
                  <div className={`flow-node ${f.accent ? 'is-accent' : ''}`}>
                    <Icon name={f.icon} size={20} />
                  </div>
                  <span>{f.label}</span>
                  {i < FUTURE.length - 1 && <span className="flow-link" aria-hidden="true" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- CTA ---------------- */}
      <section className="landing-cta" aria-labelledby="cta-title">
        <div className="landing-inner cta-inner">
          <div>
            <h2 id="cta-title">Ready to explore consumption patterns?</h2>
            <p>Sign in, enter a demo consumer number or upload a dataset, and review the results.</p>
          </div>
          <div className="hero-actions">
            <Link to="/consumption" className="btn-primary btn-lg">
              <Icon name="zap" size={17} /> Analyze Consumption
            </Link>
            <Link to="/about" className="btn-ghost btn-lg hero-ghost">Learn more</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
