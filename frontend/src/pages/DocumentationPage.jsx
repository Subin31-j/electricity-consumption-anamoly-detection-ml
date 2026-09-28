import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/ui/Icon';
import { useScrollReveal } from '../components/ui/motion';

/*
 * Public ECAD documentation. Every rule and parameter here mirrors the actual
 * implementation (backend/app/services/preprocessing.py, feature_engineering.py,
 * anomaly_detection.py and app/ml/*). The in-app /help page is unchanged.
 */

const SECTIONS = [
  { id: 'quick-start', label: 'Quick start', icon: 'zap' },
  { id: 'consumer', label: 'Consumer number', icon: 'meter' },
  { id: 'upload', label: 'Uploading a dataset', icon: 'upload' },
  { id: 'preprocessing', label: 'Preprocessing rules', icon: 'filter' },
  { id: 'pipeline', label: 'Analysis pipeline', icon: 'layers' },
  { id: 'models', label: 'ML models', icon: 'cpu' },
  { id: 'results', label: 'Reading the results', icon: 'chartLine' },
  { id: 'reports', label: 'History & reports', icon: 'report' },
  { id: 'scope', label: 'Historical vs real-time', icon: 'wifi' },
  { id: 'faq', label: 'FAQ', icon: 'help' },
  { id: 'glossary', label: 'Glossary', icon: 'book' },
];

const QUICK = [
  { icon: 'user', title: 'Create an account', text: 'Register with your name, email and password, or sign in.', to: '/register', cta: 'Register' },
  { icon: 'database', title: 'Choose a data source', text: 'Verify a demo consumer number or upload a CSV / Excel file.', to: '/consumption', cta: 'Open My Consumption' },
  { icon: 'cpu', title: 'Run the analysis', text: 'Select models; Isolation Forest always runs, K-Means and LOF are optional.' },
  { icon: 'chartLine', title: 'Review & report', text: 'Explore results, visualizations and model comparison, then generate a report.' },
];

const COLUMNS = [
  { field: 'Timestamp', names: ['timestamp', 'datetime', 'date_time', 'time_stamp', 'reading_time'], note: 'Preferred. Used as-is when present.' },
  { field: 'Date', names: ['date', 'reading_date', 'day'], note: 'Combined with Time when no timestamp column exists.' },
  { field: 'Time', names: ['time', 'reading_time', 'hour'], note: 'Optional. Defaults to 00:00 if missing.' },
  { field: 'Consumption', names: ['consumption_kwh', 'consumption', 'energy', 'energy_consumption', 'kwh', 'usage', 'power_kwh'], note: 'Required.', required: true },
];

const RULES = [
  { icon: 'alertCircle', title: 'Invalid rows dropped', text: 'Rows whose timestamp or consumption cannot be parsed are removed.' },
  { icon: 'trendUp', title: 'Negative values removed', text: 'Negative consumption is physically invalid for kWh totals and is dropped.' },
  { icon: 'layers', title: 'Duplicates removed', text: 'Repeated timestamps keep only the first reading.' },
  { icon: 'sort', title: 'Chronological order', text: 'Readings are sorted by time before feature engineering.' },
  { icon: 'hash', title: 'Minimum 20 rows', text: 'Fewer than 20 valid rows after cleaning cannot be analyzed.' },
  { icon: 'info', title: 'Changes are reported', text: 'Every adjustment appears as a note in the upload summary.' },
];

const PIPELINE = [
  { label: 'Input data', text: 'Consumer readings or uploaded file' },
  { label: 'Validation', text: 'Columns detected and mapped' },
  { label: 'Cleaning', text: 'Invalid, negative, duplicate rows removed' },
  { label: 'Feature engineering', text: '10 time-based features' },
  { label: 'Scaling', text: 'StandardScaler normalization' },
  { label: 'ML models', text: 'IF · K-Means · LOF' },
  { label: 'Results', text: 'Labels, scores, agreement, charts' },
];

const FEATURES = [
  ['consumption_kwh', 'The reading itself'],
  ['hour', 'Hour of day (0–23)'],
  ['day_of_week', 'Monday = 0 … Sunday = 6'],
  ['day', 'Day of month'],
  ['month', 'Calendar month'],
  ['season', 'Winter, spring, summer, autumn'],
  ['is_weekend', '1 on Saturday / Sunday'],
  ['lag_1', 'Previous reading'],
  ['rolling_mean_3', 'Mean of the previous 3 readings'],
  ['rolling_std_3', 'Std. deviation of the previous 3 readings'],
];

const MODELS = [
  {
    name: 'Isolation Forest',
    role: 'Primary model',
    icon: 'tree',
    color: '#2563eb',
    how: 'Builds many random trees that repeatedly split the data. Unusual readings are isolated after very few splits, so a short average path means a higher anomaly score.',
    params: [['n_estimators', '100'], ['contamination', '0.05'], ['random_state', '42']],
  },
  {
    name: 'K-Means',
    role: 'Comparison model',
    icon: 'clusters',
    color: '#0891b2',
    how: 'Groups readings into clusters of similar behaviour. K-Means is not a native outlier detector: ECAD flags the readings furthest from their cluster centre.',
    params: [['n_clusters', '√(n/2), bounded 2–8'], ['threshold', '95th percentile distance'], ['random_state', '42']],
  },
  {
    name: 'Local Outlier Factor',
    role: 'Comparison model',
    icon: 'radar',
    color: '#7c3aed',
    how: 'Compares the density around each reading with the density around its nearest neighbours. Readings in much sparser regions score higher.',
    params: [['n_neighbors', 'up to 20'], ['contamination', '0.05'], ['score', 'negative outlier factor']],
  },
];

const AGREEMENT = [
  { level: 3, label: 'All 3 models', text: 'Strongest consensus. Every model independently found the reading unusual.' },
  { level: 2, label: '2 models', text: 'Partial consensus. Worth reviewing alongside the consumption chart.' },
  { level: 1, label: '1 model', text: 'Single-model flag. Often a borderline or model-specific pattern.' },
];

const FAQ = [
  ['Does an anomaly prove electricity theft?', 'No. An anomaly is an unusual pattern identified by a model. It does not prove theft, equipment failure or energy wastage; it is an indicator that may warrant review.'],
  ['Why do the three models flag different readings?', 'Each model has a different notion of "unusual": isolation, distance from a cluster centre, or local density. Readings flagged by several models have stronger consensus.'],
  ['Are results random?', 'No. Models use fixed random seeds where applicable, so the same data produces the same results.'],
  ['Why is roughly 5% of the data flagged per model?', 'Each model uses a contamination setting of 5%, which sets how many readings it treats as unusual. Overall anomaly counts can be higher because a reading counts if any model flags it.'],
  ['Why was my upload rejected?', 'Common causes: no recognizable consumption or timestamp column, an unsupported file type, or fewer than 20 valid rows after cleaning. The error message explains which.'],
  ['Can I compare scores between two analyses?', 'Not directly. Scores are normalized to 0–1 within each analysis, so they are relative to that dataset.'],
];

const GLOSSARY = [
  ['Anomaly', 'A reading flagged as unusual by at least one model.'],
  ['Agreement', 'How many of the three models flagged the same reading (1, 2 or 3).'],
  ['Anomaly rate', 'Anomalies divided by total readings, as a percentage.'],
  ['Contamination', 'The expected share of unusual readings each model is tuned for (5%).'],
  ['Anomaly score', 'A 0–1 value per model; higher means more unusual within that analysis.'],
  ['Cluster', 'A K-Means group of readings with similar behaviour.'],
  ['Consumer number', 'An 11-digit demo identifier mapped to stored historical readings.'],
  ['Leakage-safe', 'Lag and rolling features use only past readings, never future ones.'],
];

const SAMPLE_CSV = `timestamp,consumption_kwh
2024-01-01 00:00:00,1.42
2024-01-01 01:00:00,1.18
2024-01-01 02:00:00,0.97
2024-01-01 03:00:00,1.05`;

const SAMPLE_SPLIT = `date,time,energy
2024-01-01,00:00,1.42
2024-01-01,01:00,1.18`;

function CodeBlock({ title, code }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable - ignore */
    }
  };
  return (
    <div className="doc-code">
      <div className="doc-code-head">
        <span><Icon name="fileSheet" size={14} /> {title}</span>
        <button type="button" onClick={copy} aria-label={`Copy ${title}`}>
          <Icon name={copied ? 'check' : 'file'} size={13} /> {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre><code>{code}</code></pre>
    </div>
  );
}

function SectionTitle({ n, icon, title, lead }) {
  return (
    <header className="doc-section-head">
      <span className="doc-section-icon"><Icon name={icon} size={20} /></span>
      <div>
        <span className="doc-section-num">{String(n).padStart(2, '0')}</span>
        <h2>{title}</h2>
        {lead && <p>{lead}</p>}
      </div>
    </header>
  );
}

const REVEAL = '.doc-section-head, .doc-quick > *, .doc-steps > li, .doc-rule, .doc-model, .doc-agree > *, .doc-faq-item, .doc-gloss > div, .doc-callout, .doc-table-wrap, .doc-code, .doc-pipe li, .doc-feature-grid, .doc-kpis > div';

export default function DocumentationPage() {
  const rootRef = useRef(null);
  const [active, setActive] = useState(SECTIONS[0].id);
  const [filter, setFilter] = useState('');
  const [openFaq, setOpenFaq] = useState(0);
  useScrollReveal(rootRef, REVEAL, { stagger: 70, maxDelay: 420 });

  useEffect(() => {
    document.title = 'Documentation · ECAD';
  }, []);

  // Scroll-spy: highlight the section currently near the top of the viewport.
  useEffect(() => {
    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean);
    if (typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-90px 0px -65% 0px', threshold: 0 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const activeIndex = Math.max(0, SECTIONS.findIndex((s) => s.id === active));

  const toc = useMemo(
    () => SECTIONS.filter((s) => s.label.toLowerCase().includes(filter.trim().toLowerCase())),
    [filter]
  );

  return (
    <div className="docs" ref={rootRef}>
      {/* ---------------- HERO ---------------- */}
      <section className="doc-hero" aria-labelledby="doc-title">
        <div className="doc-hero-inner">
          <div className="doc-hero-copy">
            <span className="home-pill">
              <Icon name="book" size={14} /> Documentation
            </span>
            <h1 id="doc-title">
              ECAD <span>Documentation</span>
            </h1>
            <p className="home-lead">
              Everything you need to use ECAD and explain how its anomaly detection works, from uploading data to reading
              model agreement.
            </p>
            <div className="doc-hero-links">
              <a href="#quick-start" className="home-btn home-btn-primary">
                Quick start <Icon name="arrowRight" size={17} />
              </a>
              <a href="#models" className="home-btn home-btn-light">
                <Icon name="cpu" size={17} /> ML models
              </a>
            </div>
          </div>
          <div className="doc-hero-card" aria-label="Documentation overview">
            <div className="home-card-head">
              <strong>In this guide</strong>
              <span className="home-card-badge">{SECTIONS.length} topics</span>
            </div>
            <ul className="doc-hero-topics">
              {SECTIONS.slice(0, 8).map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`}>
                    <span className="doc-topic-icon"><Icon name={s.icon} size={15} /></span>
                    {s.label}
                    <Icon name="chevronRight" size={14} className="doc-topic-arrow" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ---------------- BODY ---------------- */}
      <div className="doc-layout">
        <aside className="doc-sidebar" aria-label="Documentation contents">
          <div className="doc-progress" aria-hidden="true">
            <div className="doc-progress-top">
              <span>On this page</span>
              <strong className="tabular">
                {activeIndex + 1} / {SECTIONS.length}
              </strong>
            </div>
            <div className="doc-progress-track">
              <span style={{ width: `${((activeIndex + 1) / SECTIONS.length) * 100}%` }} />
            </div>
            <p>{SECTIONS[activeIndex]?.label}</p>
          </div>
          <label className="input-with-icon doc-search">
            <span className="sr-only">Filter topics</span>
            <Icon name="search" size={15} />
            <input className="input input-sm" type="search" placeholder="Filter topics…" value={filter} onChange={(e) => setFilter(e.target.value)} />
          </label>
          <nav>
            <ol className="doc-toc">
              {toc.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className={active === s.id ? 'active' : ''} aria-current={active === s.id ? 'location' : undefined}>
                    <Icon name={s.icon} size={15} />
                    {s.label}
                  </a>
                </li>
              ))}
              {!toc.length && <li className="doc-toc-empty">No matching topics</li>}
            </ol>
          </nav>
          <div className="doc-sidebar-note">
            <Icon name="info" size={14} />
            <span>Prototype uses historical demo data. It is not connected to a real electricity board.</span>
          </div>
        </aside>

        <article className="doc-content">
          {/* 01 Quick start */}
          <section id="quick-start" className="doc-section">
            <SectionTitle n={1} icon="zap" title="Quick start" lead="Go from sign-up to your first anomaly report in four steps." />
            <ol className="doc-quick">
              {QUICK.map((q, i) => (
                <li key={q.title}>
                  <span className="doc-quick-num">{i + 1}</span>
                  <span className="doc-quick-icon"><Icon name={q.icon} size={18} /></span>
                  <strong>{q.title}</strong>
                  <p>{q.text}</p>
                  {q.to && (
                    <Link to={q.to} className="doc-inline-link">
                      {q.cta} <Icon name="arrowRight" size={13} />
                    </Link>
                  )}
                </li>
              ))}
            </ol>
          </section>

          {/* 02 Consumer number */}
          <section id="consumer" className="doc-section">
            <SectionTitle n={2} icon="meter" title="Using a consumer number" lead="Analyze the stored historical readings of a demo consumer account." />
            <ol className="doc-steps">
              <li><strong>Open My Consumption.</strong> Sign in and choose <em>My Consumption</em> in the sidebar.</li>
              <li><strong>Enter the 11-digit number.</strong> Only digits are accepted; the counter shows progress to 11.</li>
              <li><strong>Verify Consumer.</strong> ECAD shows the masked number (e.g. <code>100*****783</code>), data period, record count and average / peak consumption.</li>
              <li><strong>Preview the data.</strong> The first 50 stored readings are listed with search, sort and pagination.</li>
              <li><strong>Select models and analyze.</strong> Results open automatically when the analysis finishes.</li>
            </ol>
            <div className="doc-callout is-warning">
              <Icon name="alert" size={18} />
              <div>
                <strong>Demo data only</strong>
                <p>The five consumer numbers are fictional identifiers mapped to stable historical datasets in the ECAD database. They are not real electricity-board accounts.</p>
              </div>
            </div>
          </section>

          {/* 03 Upload */}
          <section id="upload" className="doc-section">
            <SectionTitle n={3} icon="upload" title="Uploading a dataset" lead="Bring your own historical readings as CSV or Excel." />
            <div className="doc-kpis">
              <div><span>File types</span><strong>.csv · .xlsx · .xls</strong></div>
              <div><span>Minimum</span><strong>20 valid rows</strong></div>
              <div><span>Preview</span><strong>First 50 rows</strong></div>
            </div>
            <h3 className="doc-h3">Recognized column names</h3>
            <p className="doc-p">Column names are matched case-insensitively. The first matching name in each group is used.</p>
            <div className="doc-table-wrap">
              <table className="doc-table">
                <thead>
                  <tr><th scope="col">Field</th><th scope="col">Accepted column names</th><th scope="col">Notes</th></tr>
                </thead>
                <tbody>
                  {COLUMNS.map((c) => (
                    <tr key={c.field}>
                      <th scope="row">
                        {c.field}
                        {c.required && <span className="doc-req">Required</span>}
                      </th>
                      <td><div className="doc-names">{c.names.map((n) => <code key={n}>{n}</code>)}</div></td>
                      <td>{c.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="doc-code-grid">
              <CodeBlock title="consumption.csv (timestamp)" code={SAMPLE_CSV} />
              <CodeBlock title="consumption.csv (date + time)" code={SAMPLE_SPLIT} />
            </div>
          </section>

          {/* 04 Preprocessing */}
          <section id="preprocessing" className="doc-section">
            <SectionTitle n={4} icon="filter" title="Preprocessing rules" lead="Applied automatically on the server before any model runs." />
            <div className="doc-rules">
              {RULES.map((r) => (
                <div key={r.title} className="doc-rule">
                  <span className="doc-rule-icon"><Icon name={r.icon} size={17} /></span>
                  <div>
                    <strong>{r.title}</strong>
                    <p>{r.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 05 Pipeline */}
          <section id="pipeline" className="doc-section">
            <SectionTitle n={5} icon="layers" title="Analysis pipeline" lead="Both input paths share exactly the same pipeline." />
            <ol className="doc-pipe">
              {PIPELINE.map((p, i) => (
                <li key={p.label} className={i === PIPELINE.length - 1 ? 'is-final' : ''}>
                  <span className="doc-pipe-dot">{i + 1}</span>
                  <div>
                    <strong>{p.label}</strong>
                    <small>{p.text}</small>
                  </div>
                </li>
              ))}
            </ol>
            <h3 className="doc-h3">Engineered features</h3>
            <p className="doc-p">Lag and rolling features use only past readings (leakage-safe). All features are standardized before scoring.</p>
            <div className="doc-feature-grid">
              {FEATURES.map(([k, v]) => (
                <div key={k}>
                  <code>{k}</code>
                  <span>{v}</span>
                </div>
              ))}
            </div>
          </section>

          {/* 06 Models */}
          <section id="models" className="doc-section">
            <SectionTitle n={6} icon="cpu" title="Machine-learning models" lead="Isolation Forest leads; K-Means and LOF provide independent comparison." />
            <div className="doc-models">
              {MODELS.map((m, i) => (
                <article key={m.name} className={`doc-model ${i === 0 ? 'is-primary' : ''}`} style={{ '--model-color': m.color }}>
                  <header>
                    <span className="model-icon" style={{ '--model-color': m.color }}><Icon name={m.icon} size={20} /></span>
                    <div>
                      <h3>{m.name}</h3>
                      <span className="doc-model-role">{m.role}</span>
                    </div>
                  </header>
                  <p>{m.how}</p>
                  <dl>
                    {m.params.map(([k, v]) => (
                      <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
                    ))}
                  </dl>
                </article>
              ))}
            </div>
          </section>

          {/* 07 Results */}
          <section id="results" className="doc-section">
            <SectionTitle n={7} icon="chartLine" title="Reading the results" lead="What the numbers, colours and agreement levels mean." />
            <div className="doc-two">
              <div className="doc-panel">
                <h3>Anomaly scores</h3>
                <p>Each model gives every reading a score normalized to <strong>0–1 within the analysis</strong>; higher means more unusual. Scores are relative to that dataset, so they cannot be compared across analyses.</p>
                <div className="doc-scale" aria-hidden="true">
                  <span className="doc-scale-bar" />
                  <div><small>0 · typical</small><small>1 · most unusual</small></div>
                </div>
              </div>
              <div className="doc-panel">
                <h3>Colour language</h3>
                <ul className="doc-legend">
                  <li><i className="is-blue" /> Blue - normal consumption</li>
                  <li><i className="is-orange" /> Orange - reading flagged by 1–2 models</li>
                  <li><i className="is-red" /> Red - reading flagged by all 3 models</li>
                </ul>
              </div>
            </div>
            <h3 className="doc-h3">Model agreement</h3>
            <div className="doc-agree">
              {AGREEMENT.map((a) => (
                <div key={a.level} className={`lvl-${a.level}`}>
                  <span className="agree-pips" aria-hidden="true">
                    {[0, 1, 2].map((i) => <span key={i} className={i < a.level ? 'on' : ''} />)}
                  </span>
                  <strong>{a.label}</strong>
                  <p>{a.text}</p>
                </div>
              ))}
            </div>
            <div className="doc-callout">
              <Icon name="info" size={18} />
              <div>
                <strong>Agreement is consensus, not certainty</strong>
                <p>A reading counts as an anomaly when at least one model flags it. Higher agreement indicates stronger consensus between different methods; it does not prove a physical cause.</p>
              </div>
            </div>
          </section>

          {/* 08 Reports */}
          <section id="reports" className="doc-section">
            <SectionTitle n={8} icon="report" title="History & reports" lead="Every run is saved to your account." />
            <div className="doc-two">
              <div className="doc-panel">
                <h3><Icon name="history" size={16} /> Analysis history</h3>
                <p>Lists every analysis with its source, models, record count, anomalies and status. Filter by consumer or dataset and open any run to see its full results.</p>
              </div>
              <div className="doc-panel">
                <h3><Icon name="report" size={16} /> Reports</h3>
                <p>Generate a summary report for any analysis: records, anomaly counts and rate, insights, model agreement and configuration. View it, print / save as PDF, or download the data as JSON.</p>
              </div>
            </div>
          </section>

          {/* 09 Scope */}
          <section id="scope" className="doc-section">
            <SectionTitle n={9} icon="wifi" title="Historical vs real-time data" />
            <div className="doc-two">
              <div className="doc-panel is-now">
                <span className="ab-scope-badge is-now"><Icon name="checkCircle" size={13} /> Current</span>
                <h3>Historical analysis</h3>
                <p>ECAD analyzes stored historical readings from demo consumers or uploaded files. It is not connected to a real electricity board.</p>
              </div>
              <div className="doc-panel is-future">
                <span className="ab-scope-badge is-future"><Icon name="clock" size={13} /> Future extension</span>
                <h3>Real-time monitoring</h3>
                <p>Would require an authorized smart meter, IoT energy meter or provider API. A consumer number alone cannot provide live readings.</p>
              </div>
            </div>
          </section>

          {/* 10 FAQ */}
          <section id="faq" className="doc-section">
            <SectionTitle n={10} icon="help" title="Frequently asked questions" />
            <div className="doc-faq">
              {FAQ.map(([q, a], i) => {
                const isOpen = openFaq === i;
                return (
                  <div key={q} className={`doc-faq-item ${isOpen ? 'is-open' : ''}`}>
                    <h3>
                      <button type="button" aria-expanded={isOpen} aria-controls={`dfaq-${i}`} id={`dfaq-q-${i}`} onClick={() => setOpenFaq(isOpen ? -1 : i)}>
                        <span className="doc-faq-q">Q</span>
                        {q}
                        <Icon name="chevronDown" size={16} />
                      </button>
                    </h3>
                    <div id={`dfaq-${i}`} role="region" aria-labelledby={`dfaq-q-${i}`} hidden={!isOpen}>
                      <p>{a}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 11 Glossary */}
          <section id="glossary" className="doc-section">
            <SectionTitle n={11} icon="book" title="Glossary" />
            <dl className="doc-gloss">
              {GLOSSARY.map(([t, d]) => (
                <div key={t}><dt>{t}</dt><dd>{d}</dd></div>
              ))}
            </dl>
          </section>

          <div className="doc-end">
            <div>
              <strong>Ready to try it?</strong>
              <span>Verify a demo consumer number or upload a dataset.</span>
            </div>
            <div className="row">
              <Link to="/consumption" className="btn-primary"><Icon name="zap" size={16} /> Analyze Consumption</Link>
              <Link to="/about" className="btn-ghost">About the project</Link>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
