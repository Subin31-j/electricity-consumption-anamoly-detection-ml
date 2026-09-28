/** Shared display formatters. Pure functions - never invent values. */

export function formatNumber(value, { decimals = 0, fallback = '-' } = {}) {
  if (value === null || value === undefined || value === '') return fallback;
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/** Choose a sensible precision for kWh values. */
export function formatKwh(value, fallback = '-') {
  if (value === null || value === undefined) return fallback;
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  const decimals = Math.abs(n) >= 1000 ? 0 : Math.abs(n) >= 10 ? 1 : 2;
  return formatNumber(n, { decimals });
}

export function formatPercent(value, decimals = 1) {
  if (value === null || value === undefined) return '-';
  const n = Number(value);
  if (!Number.isFinite(n)) return '-';
  return `${n.toFixed(decimals)}%`;
}

/** "2024-03-04T10:00:00" -> "2024-03-04 10:00" */
export function formatDateTime(iso, withSeconds = false) {
  if (!iso) return '-';
  return String(iso).replace('T', ' ').slice(0, withSeconds ? 19 : 16);
}

export function formatDate(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso).slice(0, 10);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatTime(iso) {
  if (!iso) return '-';
  const s = String(iso);
  const t = s.includes('T') ? s.split('T')[1] : s.split(' ')[1];
  return t ? t.slice(0, 5) : '-';
}

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

const MODEL_LABELS = {
  isolation_forest: 'Isolation Forest',
  kmeans: 'K-Means',
  lof: 'LOF',
};

/** "isolation_forest,kmeans" -> ["Isolation Forest", "K-Means"] */
export function modelList(modelsUsed) {
  if (!modelsUsed) return [];
  return String(modelsUsed)
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean)
    .map((m) => MODEL_LABELS[m] || m);
}

export function sourceLabel(item) {
  if (!item) return '-';
  if (item.consumer_id) return `Consumer #${item.consumer_id}`;
  if (item.dataset_id) return `Dataset #${item.dataset_id}`;
  return '-';
}

export function initials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

export function apiError(err, fallback) {
  const detail = err?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg;
  return fallback;
}
