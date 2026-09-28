import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/ui/Icon';
import { useScrollReveal } from '../components/ui/motion';

/*
 * About ECAD. All content reflects the actual project: the PRD scope and the
 * implemented pipeline (see backend services/ml). No figures are invented.
 */

const GLANCE = [
  { icon: 'history', label: 'Scope', value: 'Historical analysis' },
  { icon: 'layers', label: 'Input paths', value: '2', note: 'Consumer number · CSV / Excel' },
  { icon: 'cpu', label: 'ML models', value: '3', note: 'IF · K-Means · LOF' },
  { icon: 'meter', label: 'Demo consumers', value: '5', note: 'Fictional, 11-digit' },
];

const OBJECTIVES = [
  'Build a web application for electricity-consumption anomaly detection.',
  'Accept historical data through a demo consumer-number flow and CSV/Excel upload.',
  'Validate and preprocess consumption data automatically.',
  'Use Isolation Forest as the primary model, with K-Means and LOF for comparison.',
  'Show real ML outputs rather than hardcoded or randomly generated results.',
  'Provide charts, anomaly tables, model agreement, insights and reports.',
  'Provide authentication and protected user / admin functionality.',
  'Keep the architecture ready for an authorized real-time data source later.',
];

const PIPELINE = [
  { label: 'Validation', icon: 'shield' },
  { label: 'Cleaning', icon: 'wand' },
  { label: 'Feature engineering', icon: 'sliders' },
  { label: 'Scaling', icon: 'chartBar' },
  { label: 'ML models', icon: 'cpu' },
  { label: 'Results & insights', icon: 'lightbulb', accent: true },
];

const MODELS = [
  {
    name: 'Isolation Forest',
    role: 'Primary model',
    icon: 'tree',
    color: '#2563eb',
    text: 'Builds random isolation trees. Readings separated after only a few splits receive higher anomaly scores.',
    params: ['100 trees', 'contamination 5%', 'random_state 42'],
  },
  {
    name: 'K-Means',
    role: 'Comparison model',
    icon: 'clusters',
    color: '#0891b2',
    text: 'Groups similar behaviour into clusters; the most distant readings from their cluster centre are flagged.',
    params: ['2–8 clusters (data-sized)', 'distance-to-centroid', 'random_state 42'],
  },
  {
    name: 'Local Outlier Factor',
    role: 'Comparison model',
    icon: 'radar',
    color: '#7c3aed',
    text: 'Compares the density around each reading with its neighbours; much sparser regions stand out.',
    params: ['up to 20 neighbours', 'contamination 5%', 'local density ratio'],
  },
];

const FEATURES = ['consumption_kwh', 'hour', 'day_of_week', 'day', 'month', 'season', 'is_weekend', 'lag_1', 'rolling_mean_3', 'rolling_std_3'];

const STACK = [
  { layer: 'Frontend', icon: 'dashboard', items: ['React 18', 'React Router', 'Recharts', 'Vite'] },
  { layer: 'Backend API', icon: 'api', items: ['FastAPI', 'Pydantic', 'JWT auth', 'Uvicorn'] },
  { layer: 'Data', icon: 'database', items: ['PostgreSQL', 'SQLAlchemy', 'Alembic', 'pandas'] },
  { layer: 'Machine learning', icon: 'cpu', items: ['scikit-learn', 'NumPy', 'StandardScaler', 'openpyxl (Excel)'] },
];

const SECURITY = [
  { icon: 'lock', title: 'JWT authentication', text: 'Every analysis, dataset and report endpoint requires a signed token.' },
  { icon: 'shield', title: 'Hashed passwords', text: 'Passwords are stored as bcrypt hashes and never returned or logged.' },
  { icon: 'users', title: 'Role-based access', text: 'Every admin endpoint enforces the ADMIN role on the server.' },
  { icon: 'hash', title: 'Masked consumer numbers', text: 'Consumer numbers are displayed masked, e.g. 100*****783.' },
  { icon: 'refresh', title: 'Reproducible results', text: 'Fixed random seeds: the same data always gives the same output.' },
  { icon: 'database', title: 'Demo data only', text: 'Five fictional consumers with stable historical data, clearly labelled.' },
];

const CURRENT = [
  'Historical electricity-consumption analysis',
  'Five predefined fictional demo consumer numbers',
  'CSV / Excel dataset upload',
  'Shared ML pipeline for both input paths',
  'Isolation Forest, K-Means and LOF',
  'Dashboard, visualizations, model comparison, history and reports',
  'JWT authentication, role-based access and an admin panel',
];

const FUTURE = [
  'Integration with an authorized electricity-provider API',
  'Smart meters or IoT energy meters',
  'Streaming / batch ingestion of new readings',
  'Scheduled or incremental model scoring',
  'Real-time dashboard updates and anomaly alerts',
  'Adaptive retraining for seasonal and behavioural change',
];

const REVEAL =
  '.ab-head, .ab-problem > *, .ab-path, .ab-pipe li, .ab-model, .ab-features, .ab-stack-col, .ab-sec, .ab-scope-col, .ab-note, .ab-cta-inner > *';

export default function AboutPage() {
  const rootRef = useRef(null);
  useScrollReveal(rootRef, REVEAL);

  useEffect(() => {
    document.title = 'About · ECAD';
  }, []);

  return (
    <div className="landing about" ref={rootRef}>
      {/* ---------------- HERO ---------------- */}
      <section className="ab-hero" aria-labelledby="about-title">
        <div className="ab-hero-inner">
          <div className="ab-hero-copy">
            <span className="home-pill">
              <Icon name="book" size={14} /> About the Project
            </span>
            <h1 id="about-title">
              About <span>ECAD</span>
            </h1>
            <p className="home-lead">
              The Electricity Consumption Anomaly Detection (ECAD) system is a web-based machine-learning application that
              analyzes electricity-consumption data and identifies unusual consumption patterns.
            </p>
            <p className="ab-sub">
              Users analyze data by selecting one of five demo consumer numbers or by uploading a CSV / Excel dataset. Both
              paths run through the same preprocessing, feature-engineering and machine-learning pipeline.
            </p>
            <div className="home-actions">
              <Link to="/documentation" className="home-btn home-btn-primary">
                Read Documentation <Icon name="arrowRight" size={17} />
              </Link>
              <Link to="/consumption" className="home-btn home-btn-light">
                <Icon name="zap" size={17} /> Analyze Consumption
              </Link>
            </div>
          </div>

          <aside className="ab-glance" aria-label="Project at a glance">
            <div className="home-card-head">
              <strong>Project at a glance</strong>
              <span className="home-card-badge">Prototype</span>
            </div>
            <dl className="ab-glance-grid">
              {GLANCE.map((g) => (
                <div key={g.label}>
                  <span className="ab-glance-icon"><Icon name={g.icon} size={17} /></span>
                  <dt>{g.label}</dt>
                  <dd>{g.value}</dd>
                  {g.note && <small>{g.note}</small>}
                </div>
              ))}
            </dl>
            <div className="ab-glance-stack">
              <span>Built with</span>
              <code>React</code>
              <code>FastAPI</code>
              <code>PostgreSQL</code>
              <code>scikit-learn</code>
            </div>
          </aside>
        </div>
      </section>

      {/* ---------------- PROBLEM + OBJECTIVES ---------------- */}
      <section className="landing-section" aria-labelledby="problem-title">
        <div className="landing-inner">
          <div className="landing-head ab-head">
            <span className="landing-eyebrow">Why ECAD</span>
            <h2 id="problem-title">Problem &amp; Objectives</h2>
            <p>Manually examining large historical consumption datasets is difficult. ECAD automates it end to end.</p>
          </div>
          <div className="ab-problem">
            <article className="ab-problem-card">
              <span className="ab-problem-icon"><Icon name="target" size={22} /></span>
              <h3>The problem</h3>
              <p>
                Electricity consumers generate consumption patterns that vary by time, season and user behaviour. Unusual
                patterns may indicate abnormal usage, unexpected spikes or possible energy wastage.
              </p>
              <h4>Research gap</h4>
              <p>
                Existing approaches may have limited adaptability to changing consumption patterns, seasonal variations and
                changes in user behaviour.
              </p>
              <h4>Our approach</h4>
              <p>Automate preprocessing, anomaly detection, comparison of ML methods and visualization in one system.</p>
            </article>
            <div className="ab-objectives">
              <h3>Project objectives</h3>
              <ol>
                {OBJECTIVES.map((o, i) => (
                  <li key={o}>
                    <span className="ab-obj-num">{String(i + 1).padStart(2, '0')}</span>
                    <span>{o}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- HOW IT WORKS ---------------- */}
      <section className="landing-section is-tinted" aria-labelledby="paths-title">
        <div className="landing-inner">
          <div className="landing-head ab-head">
            <span className="landing-eyebrow">System</span>
            <h2 id="paths-title">Two Input Paths, One Pipeline</h2>
            <p>Both inputs are converted to a common schema (timestamp, date, time, consumption_kwh) before analysis.</p>
          </div>
          <div className="ab-paths">
            <article className="ab-path">
              <span className="ab-path-tag">Path A</span>
              <span className="ab-path-icon"><Icon name="meter" size={22} /></span>
              <h3>Consumer number</h3>
              <p>
                The consumer number identifies the electricity account. In this prototype, each demo consumer account is
                mapped to historical consumption data stored in the application&apos;s database.
              </p>
            </article>
            <article className="ab-path">
              <span className="ab-path-tag">Path B</span>
              <span className="ab-path-icon is-cyan"><Icon name="cloudUpload" size={22} /></span>
              <h3>CSV / Excel upload</h3>
              <p>
                Upload a file with a timestamp (or date + time) column and a consumption column. Columns are detected and
                mapped automatically; at least 20 valid rows are required.
              </p>
            </article>
          </div>
          <ol className="ab-pipe" aria-label="Analysis pipeline">
            {PIPELINE.map((p, i) => (
              <li key={p.label} className={p.accent ? 'is-accent' : ''}>
                <span className="ab-pipe-node"><Icon name={p.icon} size={18} /></span>
                <span className="ab-pipe-label">
                  <small>{String(i + 1).padStart(2, '0')}</small>
                  {p.label}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------------- MODELS ---------------- */}
      <section className="landing-section" aria-labelledby="ml-title">
        <div className="landing-inner">
          <div className="landing-head ab-head">
            <span className="landing-eyebrow">Machine learning</span>
            <h2 id="ml-title">Models &amp; Features</h2>
            <p>
              All outputs are computed from actual data; results are never fabricated or randomly generated per request.
            </p>
          </div>
          <div className="ab-models">
            {MODELS.map((m, i) => (
              <article key={m.name} className={`ab-model ${i === 0 ? 'is-primary' : ''}`} style={{ '--model-color': m.color }}>
                <header>
                  <span className="model-icon" style={{ '--model-color': m.color }}>
                    <Icon name={m.icon} size={20} />
                  </span>
                  <div>
                    <h3>{m.name}</h3>
                    <span className="ab-model-role">{m.role}</span>
                  </div>
                </header>
                <p>{m.text}</p>
                <div className="ab-chips">
                  {m.params.map((p) => (
                    <code key={p}>{p}</code>
                  ))}
                </div>
              </article>
            ))}
          </div>
          <div className="ab-features">
            <div>
              <h3>Engineered features</h3>
              <p>
                Time-based and past-only (leakage-safe) features, standardized before scoring. A reading is an anomaly when at
                least one model flags it; agreement shows how many did.
              </p>
            </div>
            <div className="ab-feature-chips">
              {FEATURES.map((f) => (
                <code key={f}>{f}</code>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- ARCHITECTURE ---------------- */}
      <section className="landing-section is-dark" aria-labelledby="stack-title">
        <div className="landing-inner">
          <div className="landing-head ab-head">
            <span className="landing-eyebrow">Architecture</span>
            <h2 id="stack-title">Technology Stack</h2>
            <p>A layered web application: the browser talks to a REST API, which runs the ML pipeline and stores results.</p>
          </div>
          <div className="ab-stack">
            {STACK.map((s, i) => (
              <div key={s.layer} className="ab-stack-col">
                <div className="ab-stack-head">
                  <span className="flow-node"><Icon name={s.icon} size={20} /></span>
                  <strong>{s.layer}</strong>
                </div>
                <ul>
                  {s.items.map((it) => (
                    <li key={it}>{it}</li>
                  ))}
                </ul>
                {i < STACK.length - 1 && <span className="ab-stack-link" aria-hidden="true" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- SECURITY ---------------- */}
      <section className="landing-section" aria-labelledby="sec-title">
        <div className="landing-inner">
          <div className="landing-head ab-head">
            <span className="landing-eyebrow">Trust</span>
            <h2 id="sec-title">Security &amp; Data Integrity</h2>
          </div>
          <div className="ab-sec-grid">
            {SECURITY.map((s) => (
              <div key={s.title} className="ab-sec">
                <span className="feature-icon"><Icon name={s.icon} size={18} /></span>
                <div>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- SCOPE ---------------- */}
      <section className="landing-section is-tinted" aria-labelledby="scope-title">
        <div className="landing-inner">
          <div className="landing-head ab-head">
            <span className="landing-eyebrow">Scope</span>
            <h2 id="scope-title">Current Scope &amp; Future Extension</h2>
            <p>
              A consumer number alone cannot provide real-time readings; an authorized data source and access permission are
              required.
            </p>
          </div>
          <div className="ab-scope">
            <div className="ab-scope-col">
              <span className="ab-scope-badge is-now"><Icon name="checkCircle" size={13} /> Implemented</span>
              <h3>Current scope</h3>
              <ul>
                {CURRENT.map((c) => (
                  <li key={c}><Icon name="check" size={15} /> {c}</li>
                ))}
              </ul>
            </div>
            <div className="ab-scope-col is-future">
              <span className="ab-scope-badge is-future"><Icon name="clock" size={13} /> Future extension</span>
              <h3>Real-time monitoring</h3>
              <ul>
                {FUTURE.map((c) => (
                  <li key={c}><Icon name="arrowRight" size={15} /> {c}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="alert alert-warning ab-note">
            <Icon name="alert" size={16} />
            <span>
              <strong>What an anomaly means:</strong> an unusual pattern identified by a model. It does not prove electricity
              theft, equipment failure or energy wastage; it is an indicator that may warrant further review.
            </span>
          </div>
        </div>
      </section>

      {/* ---------------- CTA ---------------- */}
      <section className="landing-cta" aria-labelledby="about-cta-title">
        <div className="landing-inner cta-inner ab-cta-inner">
          <div>
            <h2 id="about-cta-title">See the pipeline in action</h2>
            <p>Verify a demo consumer number or upload a dataset, then review the results.</p>
          </div>
          <div className="hero-actions">
            <Link to="/consumption" className="btn-primary btn-lg">
              <Icon name="zap" size={17} /> Analyze Consumption
            </Link>
            <Link to="/" className="btn-ghost btn-lg hero-ghost">Back to home</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
