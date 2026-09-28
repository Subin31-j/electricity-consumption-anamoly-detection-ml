import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Icon } from '../components/ui/Icon';
import { PageHeader, SectionHeader } from '../components/ui/PageHeader';

const TOPICS = [
  {
    id: 'how',
    icon: 'bolt',
    title: 'How ECAD works',
    body: (
      <ol className="help-steps">
        <li>Choose a data source: a demo consumer number or an uploaded CSV / Excel file.</li>
        <li>ECAD validates and cleans the readings, then engineers time-based features.</li>
        <li>Isolation Forest, K-Means and LOF each score every reading.</li>
        <li>Results, charts, model agreement, insights and reports are produced from those scores.</li>
      </ol>
    ),
  },
  {
    id: 'consumer',
    icon: 'meter',
    title: 'How to use a consumer number',
    body: (
      <p>
        Open <Link to="/consumption">My Consumption</Link>, enter one of the 11-digit demo consumer numbers and select
        <strong> Verify Consumer</strong>. ECAD shows the masked number, data period and a preview of stored readings.
        Choose models and select <strong>Analyze My Consumption</strong>.
      </p>
    ),
  },
  {
    id: 'upload',
    icon: 'upload',
    title: 'How to upload a dataset',
    body: (
      <p>
        Open <Link to="/upload">Upload Dataset</Link> and drop a CSV or Excel (.xlsx / .xls) file. It needs a
        timestamp column (or date + time columns) and a consumption column such as <code>consumption_kwh</code>,
        <code>energy</code> or <code>kwh</code>. Column names are detected automatically. At least 20 valid rows are
        required.
      </p>
    ),
  },
  {
    id: 'detection',
    icon: 'target',
    title: 'How anomaly detection works',
    body: (
      <p>
        Each reading is described by its consumption plus features such as hour, day of week, month, season, weekend
        flag, the previous reading and short rolling statistics. Models learn the usual pattern and flag readings that
        do not fit it. A reading counts as an anomaly when at least one model flags it; agreement shows how many did.
      </p>
    ),
  },
  {
    id: 'iforest',
    icon: 'tree',
    title: 'What Isolation Forest means',
    body: (
      <p>
        The <strong>primary model</strong>. It builds many random decision trees that repeatedly split the data.
        Unusual readings are separated (isolated) after only a few splits, so a short average path means a higher
        anomaly score. ECAD uses 100 trees and a 5% contamination setting.
      </p>
    ),
  },
  {
    id: 'kmeans',
    icon: 'clusters',
    title: 'What K-Means means',
    body: (
      <p>
        A <strong>comparison model</strong> that groups readings into clusters of similar behaviour. K-Means is not a
        native outlier detector: ECAD measures each reading&apos;s distance to its cluster centre and flags the most
        distant ones. The cluster number is shown in the anomaly table.
      </p>
    ),
  },
  {
    id: 'lof',
    icon: 'radar',
    title: 'What LOF means',
    body: (
      <p>
        Local Outlier Factor is a <strong>comparison model</strong> that compares the density around each reading with
        the density around its nearest neighbours (up to 20). Readings in much sparser regions than their neighbours
        receive higher scores.
      </p>
    ),
  },
  {
    id: 'scores',
    icon: 'chartLine',
    title: 'Understanding anomaly scores',
    body: (
      <p>
        Scores are normalized to a 0–1 range within each analysis, where <strong>higher means more unusual</strong>.
        They are relative to that dataset, so scores from different analyses are not directly comparable. Model
        agreement (1, 2 or 3 of 3) indicates consensus, not certainty.
      </p>
    ),
  },
  {
    id: 'realtime',
    icon: 'wifi',
    title: 'Historical vs real-time data',
    body: (
      <p>
        This prototype analyzes <strong>historical data only</strong> and is not connected to a real electricity
        board. Real-time monitoring is a future extension that would need an authorized smart meter or provider API.
      </p>
    ),
  },
];

const FAQ = [
  ['Does an anomaly prove electricity theft?', 'No. An anomaly is an unusual pattern identified by a model. It does not prove theft, equipment failure or energy wastage; it is an indicator that may warrant review.'],
  ['Why do the three models flag different readings?', 'Each model has a different notion of "unusual": isolation, distance from a cluster, or local density. Readings flagged by several models have stronger consensus.'],
  ['Are results random?', 'No. Models use fixed random seeds where applicable, so the same data produces the same results.'],
  ['Where can I find old analyses?', 'Every run is listed under Analysis History, and any analysis can be turned into a report on the Reports page.'],
  ['Why was my upload rejected?', 'Common causes: no recognizable consumption or timestamp column, or fewer than 20 valid rows after cleaning. The error message explains which.'],
];

export default function HelpPage() {
  const [open, setOpen] = useState(0);

  return (
    <div className="page">
      <PageHeader
        eyebrow="Help"
        eyebrowIcon="help"
        title="Help & Documentation"
        subtitle="Everything you need to use ECAD and explain how its anomaly detection works."
        actions={
          <>
            <Link to="/consumption" className="btn-primary"><Icon name="meter" size={16} /> Try a consumer number</Link>
            <Link to="/upload" className="btn-ghost"><Icon name="upload" size={16} /> Upload dataset</Link>
          </>
        }
      />

      <nav className="help-toc" aria-label="Help topics">
        {TOPICS.map((t) => (
          <a key={t.id} href={`#help-${t.id}`}>
            <Icon name={t.icon} size={14} /> {t.title}
          </a>
        ))}
      </nav>

      <div className="help-grid">
        {TOPICS.map((t) => (
          <Card key={t.id} id={`help-${t.id}`} title={t.title} icon={t.icon} className="help-card">
            {t.body}
          </Card>
        ))}
      </div>

      <SectionHeader title="Frequently Asked Questions" />
      <div className="faq">
        {FAQ.map(([q, a], i) => {
          const isOpen = open === i;
          return (
            <div key={q} className={`faq-item ${isOpen ? 'is-open' : ''}`}>
              <h3>
                <button type="button" aria-expanded={isOpen} aria-controls={`faq-${i}`} id={`faq-q-${i}`} onClick={() => setOpen(isOpen ? -1 : i)}>
                  {q}
                  <Icon name="chevronDown" size={16} />
                </button>
              </h3>
              <div id={`faq-${i}`} role="region" aria-labelledby={`faq-q-${i}`} hidden={!isOpen}>
                <p>{a}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
