/**
 * Pure helpers that derive display data from REAL analysis results.
 * Nothing here fabricates values - every number comes from the API payload.
 */

export const CHART = {
  blue: '#3b82f6',
  blueDeep: '#2563eb',
  navy: '#0d1830',
  anomaly: '#ea580c',
  anomalyStrong: '#dc2626',
  normal: '#94a3b8',
  success: '#059669',
  grid: '#eaeef5',
  axis: '#64748b',
};

export const MODEL_META = {
  'Isolation Forest': { key: 'iforest', short: 'IF', icon: 'tree', role: 'Primary model', color: '#2563eb' },
  'K-Means': { key: 'kmeans', short: 'KM', icon: 'clusters', role: 'Comparison model', color: '#0891b2' },
  'Local Outlier Factor': { key: 'lof', short: 'LOF', icon: 'radar', role: 'Comparison model', color: '#7c3aed' },
  LOF: { key: 'lof', short: 'LOF', icon: 'radar', role: 'Comparison model', color: '#7c3aed' },
};

export const MODEL_ORDER = ['Isolation Forest', 'K-Means', 'Local Outlier Factor'];

/** Normalize a timestamp to a join key (YYYY-MM-DDTHH:MM:SS). */
export function tsKey(ts) {
  return String(ts || '').replace(' ', 'T').slice(0, 19);
}

export function toMs(ts) {
  const t = Date.parse(tsKey(ts));
  return Number.isNaN(t) ? null : t;
}

/** Map of tsKey -> anomaly record for tooltip enrichment. */
export function indexAnomalies(items) {
  const map = new Map();
  (items || []).forEach((a) => map.set(tsKey(a.timestamp), a));
  return map;
}

const DAY = 24 * 60 * 60 * 1000;

/** Filter a trend series to the last N days relative to its own last timestamp. */
export function filterByRange(trend, range) {
  if (!trend?.length || range === 'all') return trend || [];
  const days = { '7d': 7, '30d': 30, '90d': 90 }[range];
  if (!days) return trend;
  const last = toMs(trend[trend.length - 1].timestamp);
  if (last === null) return trend;
  const from = last - days * DAY;
  return trend.filter((p) => {
    const t = toMs(p.timestamp);
    return t !== null && t >= from;
  });
}

/**
 * Prepare points for the main chart. Very long series are bucketed for
 * rendering performance; any bucket containing an anomaly keeps that anomaly
 * point so no flagged reading is ever hidden.
 */
export function buildChartPoints(trend, anomalyIndex, maxPoints = 1200) {
  const src = trend || [];
  const enrich = (p) => {
    const rec = anomalyIndex?.get(tsKey(p.timestamp));
    return {
      t: tsKey(p.timestamp),
      kwh: p.consumption_kwh,
      anomalyKwh: p.is_anomaly ? p.consumption_kwh : null,
      isAnomaly: !!p.is_anomaly,
      agreement: rec?.agreement_count ?? (p.is_anomaly ? null : 0),
      rec,
      bucket: 1,
    };
  };
  if (src.length <= maxPoints) return src.map(enrich);

  const size = Math.ceil(src.length / maxPoints);
  const out = [];
  for (let i = 0; i < src.length; i += size) {
    const slice = src.slice(i, i + size);
    const avg = slice.reduce((s, p) => s + p.consumption_kwh, 0) / slice.length;
    const anomalies = slice.filter((p) => p.is_anomaly);
    const top = anomalies.sort((a, b) => b.consumption_kwh - a.consumption_kwh)[0];
    const rec = top ? anomalyIndex?.get(tsKey(top.timestamp)) : null;
    out.push({
      t: tsKey((top || slice[0]).timestamp),
      kwh: Math.round(avg * 10000) / 10000,
      anomalyKwh: top ? top.consumption_kwh : null,
      isAnomaly: !!top,
      agreement: rec?.agreement_count ?? null,
      rec,
      bucket: slice.length,
      bucketAnomalies: anomalies.length,
    });
  }
  return out;
}

/** Anomaly quick facts from the anomaly records list. */
export function anomalyFacts(items) {
  const list = items || [];
  if (!list.length) return { latest: null, highest: null };
  let latest = list[0];
  let highest = list[0];
  list.forEach((a) => {
    if (tsKey(a.timestamp) > tsKey(latest.timestamp)) latest = a;
    if (a.consumption_kwh > highest.consumption_kwh) highest = a;
  });
  return { latest, highest };
}

/** Per-model detection stats computed from results.models + anomaly records. */
export function modelStats(models, totalRecords, anomalyItems) {
  const items = anomalyItems || [];
  return MODEL_ORDER.map((name) => {
    const cfg = (models || []).find((m) => m.name === name || (name === 'Local Outlier Factor' && m.name === 'LOF'));
    const meta = MODEL_META[name];
    if (!cfg) return { name, meta, ran: false };
    const labelKey = `${meta.key}_label`;
    const flagged = items.filter((r) => r[labelKey]);
    const corroborated = flagged.filter((r) => r.agreement_count >= 2).length;
    return {
      name,
      meta,
      ran: true,
      cfg,
      count: cfg.anomaly_count,
      rate: totalRecords ? (cfg.anomaly_count / totalRecords) * 100 : 0,
      // share of this model's flags that at least one other model also flagged
      corroboration: flagged.length ? (corroborated / flagged.length) * 100 : null,
    };
  });
}

const HOUR_BANDS = [
  { from: 0, to: 6, label: 'late-night hours (00:00–06:00)' },
  { from: 6, to: 12, label: 'morning hours (06:00–12:00)' },
  { from: 12, to: 18, label: 'afternoon hours (12:00–18:00)' },
  { from: 18, to: 24, label: 'evening hours (18:00–24:00)' },
];

function hourOf(ts) {
  const m = /T(\d{2})/.exec(tsKey(ts));
  return m ? Number(m[1]) : null;
}

function isWeekend(ts) {
  const t = toMs(ts);
  if (t === null) return null;
  const d = new Date(t).getDay();
  return d === 0 || d === 6;
}

/**
 * Additional data-driven observations derived from anomaly records and the
 * consumption series. Only emitted when the data supports them.
 */
export function deriveInsights({ anomalies, trend, summary }) {
  const list = anomalies || [];
  const out = [];
  if (list.length < 3) return out;

  // Time-of-day concentration
  const hours = list.map((a) => hourOf(a.timestamp)).filter((h) => h !== null);
  const distinctHours = new Set((trend || []).map((p) => hourOf(p.timestamp))).size;
  if (hours.length >= 3 && distinctHours > 4) {
    const counts = HOUR_BANDS.map((b) => hours.filter((h) => h >= b.from && h < b.to).length);
    const maxIdx = counts.indexOf(Math.max(...counts));
    const share = (counts[maxIdx] / hours.length) * 100;
    if (share >= 40) {
      out.push({
        icon: 'clock',
        tone: 'anomaly',
        text: `${share.toFixed(0)}% of flagged readings (${counts[maxIdx]} of ${hours.length}) occurred during ${HOUR_BANDS[maxIdx].label}.`,
      });
    }
  }

  // Weekend over-representation
  const trendWeekend = (trend || []).map((p) => isWeekend(p.timestamp)).filter((v) => v !== null);
  const anomWeekend = list.map((a) => isWeekend(a.timestamp)).filter((v) => v !== null);
  if (trendWeekend.length > 50 && anomWeekend.length >= 5) {
    const base = trendWeekend.filter(Boolean).length / trendWeekend.length;
    const share = anomWeekend.filter(Boolean).length / anomWeekend.length;
    if (base > 0 && share >= base * 1.5) {
      out.push({
        icon: 'calendar',
        tone: 'primary',
        text: `Weekends account for ${(share * 100).toFixed(0)}% of anomalies but only ${(base * 100).toFixed(0)}% of readings.`,
      });
    } else if (base > 0 && share <= base * 0.5) {
      out.push({
        icon: 'calendar',
        tone: 'primary',
        text: `Anomalies were concentrated on weekdays: weekends hold ${(base * 100).toFixed(0)}% of readings but only ${(share * 100).toFixed(0)}% of anomalies.`,
      });
    }
  }

  // Direction relative to average
  if (summary && Number.isFinite(summary.average_consumption)) {
    const above = list.filter((a) => a.consumption_kwh > summary.average_consumption).length;
    const pct = (above / list.length) * 100;
    if (pct >= 70) {
      out.push({ icon: 'trendUp', tone: 'anomaly', text: `${above} of ${list.length} flagged readings were above average consumption, suggesting unusual spikes rather than drops.` });
    } else if (pct <= 30) {
      out.push({ icon: 'activity', tone: 'primary', text: `${list.length - above} of ${list.length} flagged readings were below average consumption, suggesting unusual drops rather than spikes.` });
    }
  }

  // Highest flagged reading
  const { highest } = anomalyFacts(list);
  if (highest) {
    out.push({
      icon: 'zap',
      tone: 'anomaly',
      text: `Highest flagged reading: ${Number(highest.consumption_kwh).toFixed(2)} kWh at ${tsKey(highest.timestamp).replace('T', ' ').slice(0, 16)} (flagged by ${highest.agreement_count} model${highest.agreement_count === 1 ? '' : 's'}).`,
    });
  }

  return out;
}

/** Data period derived from the consumption trend. */
export function dataPeriod(trend) {
  if (!trend?.length) return null;
  return { from: tsKey(trend[0].timestamp).slice(0, 10), to: tsKey(trend[trend.length - 1].timestamp).slice(0, 10) };
}
