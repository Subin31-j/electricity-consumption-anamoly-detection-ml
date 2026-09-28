/**
 * Frozen API contract typedefs (JSDoc). These mirror the backend Pydantic
 * schemas and the endpoint list in the PRD. Wave 2+ services import these for
 * shape reference; the shapes must not diverge from the backend schemas.
 *
 * @typedef {Object} UserPublic
 * @property {number} id
 * @property {string} email
 * @property {string} name
 * @property {string} role   - "USER" | "ADMIN"
 * @property {string} status - "ACTIVE" | "DISABLED"
 * @property {string} created_at
 *
 * @typedef {Object} TokenResponse
 * @property {string} access_token
 * @property {string} token_type
 * @property {string} redirect  - "/admin" | "/dashboard"
 * @property {UserPublic} user
 *
 * @typedef {Object} ConsumerPublic
 * @property {number} id
 * @property {string} consumer_number_masked
 * @property {string} consumer_name
 * @property {?string} connection_type
 * @property {?string} location
 * @property {?string} meter_type
 * @property {?string} data_start_date
 * @property {?string} data_end_date
 * @property {number} total_records
 * @property {boolean} is_demo
 *
 * @typedef {Object} ConsumerStats
 * @property {number} average_consumption
 * @property {number} peak_consumption
 * @property {number} minimum_consumption
 * @property {number} record_count
 *
 * @typedef {Object} SummaryStats
 * @property {number} total_records
 * @property {number} normal_records
 * @property {number} anomaly_count
 * @property {number} anomaly_rate
 * @property {number} average_consumption
 * @property {number} peak_consumption
 * @property {number} minimum_consumption
 *
 * @typedef {Object} ModelAgreement
 * @property {number} detected_by_all_three
 * @property {number} detected_by_two
 * @property {number} detected_by_one
 *
 * @typedef {Object} AnomalyRecord
 * @property {number} id
 * @property {string} timestamp
 * @property {number} consumption_kwh
 * @property {boolean} iforest_label
 * @property {?number} iforest_score
 * @property {?number} kmeans_cluster
 * @property {boolean} kmeans_label
 * @property {?number} kmeans_score
 * @property {boolean} lof_label
 * @property {?number} lof_score
 * @property {number} agreement_count
 */

// Endpoint path registry (single source of truth for frontend service calls).
export const ENDPOINTS = {
  auth: {
    register: '/api/auth/register',
    login: '/api/auth/login',
    me: '/api/auth/me',
  },
  consumers: {
    verify: '/api/consumers/verify',
    get: (id) => `/api/consumers/${id}`,
    consumption: (id) => `/api/consumers/${id}/consumption`,
    analyze: (id) => `/api/consumers/${id}/analyze`,
  },
  datasets: {
    upload: '/api/datasets/upload',
  },
  analysis: {
    create: '/api/analysis',
    results: (id) => `/api/analysis/${id}/results`,
    anomalies: (id) => `/api/analysis/${id}/anomalies`,
  },
  history: '/api/history',
  reports: {
    get: (id) => `/api/reports/${id}`,
  },
  admin: {
    dashboard: '/api/admin/dashboard',
    users: '/api/admin/users',
    user: (id) => `/api/admin/users/${id}`,
    userStatus: (id) => `/api/admin/users/${id}/status`,
    consumers: '/api/admin/consumers',
    consumer: (id) => `/api/admin/consumers/${id}`,
    datasets: '/api/admin/datasets',
    analyses: '/api/admin/analyses',
    anomalies: '/api/admin/anomalies',
    reports: '/api/admin/reports',
    activity: '/api/admin/activity',
    systemHealth: '/api/admin/system-health',
  },
};

export default ENDPOINTS;
