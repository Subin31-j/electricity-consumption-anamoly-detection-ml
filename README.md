# Electricity Consumption Anomaly Detection (ECAD)

A web-based machine-learning application that analyzes **historical** electricity-consumption
data and identifies unusual consumption patterns. Isolation Forest is the primary
anomaly-detection model; K-Means and Local Outlier Factor (LOF) are used for comparison.

> **Important:** This prototype analyzes historical electricity consumption only. It is **not**
> connected to a real electricity board and does not provide live data. Real-time monitoring is a
> future extension that would require an authorized smart meter, IoT energy meter, or
> electricity-provider API. A consumer number alone cannot provide real-time readings.

An anomaly is an unusual pattern identified by a machine-learning model. It does **not** prove
electricity theft, equipment failure, or energy wastage.

## Project overview

- Two data-entry paths that share a single preprocessing + ML pipeline:
  1. **Consumer number** — one of five predefined demo consumers (11-digit fictional numbers).
  2. **Dataset upload** — CSV or Excel file with flexible column names.
- Dashboards, visualizations, model comparison, anomaly tables, model agreement, insights,
  reports, and analysis history.
- JWT authentication with `USER` and `ADMIN` roles.
- A hidden admin panel reached through the normal login form (no admin UI hints anywhere).

## Architecture

```
frontend/ (React 18 + Vite, JavaScript)
  React Router SPA -> axios (JWT interceptor) -> backend REST API

backend/ (FastAPI, Python 3.12)
  app/api/       routers: auth, consumers, datasets, analysis, reports, admin
  app/core/      config, security (JWT + bcrypt), deps (RBAC), bootstrap (admin seed)
  app/models/    SQLAlchemy ORM (8 tables)
  app/schemas/   Pydantic request/response contracts
  app/services/  preprocessing, feature_engineering, anomaly_detection, reporting, ...
  app/ml/        isolation_forest, kmeans, lof
  alembic/       migrations
  scripts/       seed_demo_consumers

PostgreSQL 16   persistent storage
```

Shared ML pipeline: `input -> validation -> cleaning -> missing/duplicate handling ->
timestamp conversion -> sorting -> feature engineering -> StandardScaler ->
Isolation Forest / K-Means / LOF -> anomaly results + agreement -> charts -> insights ->
report -> history`.

## Prerequisites

- Docker and Docker Compose (recommended path).
- Or, for manual runs: Python 3.12, Node.js 20, PostgreSQL 16.

## Quick start (Docker)

```bash
cp .env.example .env      # adjust secrets for anything beyond local development
docker-compose up --build
```

On startup the backend automatically:
1. runs Alembic migrations (`alembic upgrade head`),
2. seeds the five demo consumers and the bootstrap admin user (`python -m scripts.seed_demo_consumers`),
3. starts the API server.

- Frontend: http://localhost:5173
- Backend API + interactive docs (OpenAPI): http://localhost:8000/docs
- Health check: http://localhost:8000/health

## Environment variables

Defined in `.env` (see `.env.example`). Secrets stay on the backend and are never exposed to the frontend.

| Variable | Purpose | Default (dev) |
|---|---|---|
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | PostgreSQL credentials | `ecad` / `ecad_password` / `ecad` |
| `DATABASE_URL` | SQLAlchemy connection string | `postgresql+psycopg2://ecad:ecad_password@postgres:5432/ecad` |
| `JWT_SECRET` | JWT signing secret (change in production) | `change_me_in_production` |
| `JWT_ALGORITHM` | JWT algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token lifetime | `1440` |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` | Bootstrap admin (hashed on seed) | see below |
| `CORS_ORIGINS` | Allowed frontend origins (comma-separated) | `http://localhost:5173` |
| `VITE_API_BASE_URL` | Frontend -> backend base URL | `http://localhost:8000` |

`.env` is git-ignored. Never commit real secrets.

## Database setup

Schema is managed by Alembic. The initial migration creates all 8 tables:
`users`, `electricity_consumers`, `electricity_consumption`, `datasets`, `analyses`,
`anomalies`, `reports`, `activity_logs` (with foreign keys and indexes on
`consumer_number`, `consumer_id`, `timestamp`, `analysis_id`, `user_id`, `created_at`).

Run migrations manually if needed:

```bash
docker-compose exec backend alembic upgrade head
```

## Demo consumers

Five fictional/demo consumers are seeded with stable, fixed-seed historical data —
**12 months of hourly readings each (8,784 records, 2024-01-01 → 2024-12-31)** — so
repeated analysis is reproducible. These are **DEMO / PROTOTYPE** identifiers and do
not belong to any real electricity board or consumer.

| Number | Profile | Records | Anomaly rate |
|---|---|---|---|
| 10023456781 | Normal household — morning rise, moderate evening peak, low nights | 8,784 | 3.51% |
| 10023456782 | Higher-consumption household — strong regular peaks, abnormal spikes | 8,784 | 4.53% |
| 10023456783 | Normal daytime pattern with occasional night-time irregularity | 8,784 | 4.00% |
| 10023456784 | Pronounced but *normal* seasonal variation, limited anomalies | 8,784 | 3.42% |
| 10023456785 | Mixed abnormal patterns — spikes, drops, time-based events | 8,784 | 6.50% |

Across all five consumers: **43,920 records, 95.6% normal / 4.4% anomalous.**

Normal behaviour is built from a time-of-day shape, weekday/weekend differences, a
smooth annual seasonal cycle, AR(1) day-to-day household drift and natural noise —
seasonal variation is *not* treated as an anomaly. Anomalies are injected as
discrete events (spike, drop, night surge, multi-hour burst, off-peak high,
peak-hour low) spread across every month of the year.

Re-seed manually. The script creates missing demo consumers and refreshes a demo
consumer's readings only when they no longer match the generator; user accounts,
datasets, analyses and reports are never deleted:

```bash
docker-compose exec backend python -m scripts.seed_demo_consumers
# force regeneration of the demo readings
docker-compose exec backend python -m scripts.seed_demo_consumers --force
```

### Dataset CSV files and validation report

Regenerate the standalone dataset files and the quality report:

```bash
docker-compose exec backend python -m scripts.generate_demo_dataset
```

Output lands in `backend/data/demo/`:

| File | Contents |
|---|---|
| `demo_consumer_1.csv` … `demo_consumer_5.csv` | Per-consumer hourly readings |
| `ecad_combined_demo_dataset.csv` | All five consumers, 43,920 rows |
| `dataset_validation_report.txt` | Per-consumer + overall statistics and quality checks |

CSV columns: `consumer_number, timestamp, date, time, consumption_kwh, day_of_week,
hour, month, season, ground_truth_anomaly`.

`ground_truth_anomaly` (0 = normal, 1 = intentionally generated anomaly) exists
**only in these CSV files**, purely to validate that the synthetic dataset has the
intended anomaly distribution. It is never written to `electricity_consumption` and
never enters the ML feature matrix, so Isolation Forest, K-Means and LOF detect
anomalies without labels — no data leakage.

## How to run

### Frontend
Served by the `frontend` container on port 5173 (`npm run dev`). For a production build:
```bash
docker-compose exec frontend npm run build
```

### Backend
Served by the `backend` container on port 8000 (uvicorn). Interactive API docs at `/docs`.

## ML workflow

1. Choose a data path (consumer number or upload).
2. Data is validated and normalized to the internal schema
   (`timestamp`, `date`, `time`, `consumption_kwh`).
3. Time-based, leakage-safe features are engineered (hour, day-of-week, day, month, season,
   is-weekend, lag, rolling mean/std).
4. Features are scaled, then scored by Isolation Forest (primary), K-Means (distance-based
   scoring — documented, not a native outlier detector), and LOF.
5. Model agreement (flagged by 1/2/3 models), summary statistics, charts, and insights are
   computed and persisted. Results are deterministic (`random_state = 42`), never fabricated
   or randomized per request.

## Admin access (development)

The administrator uses the **same** login form as normal users. There is no admin button,
tab, link, or label anywhere in the normal UI.

- Development admin credentials are configured via backend environment variables
  (`ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env`). They are validated server-side and stored only
  as a password hash. See `.env.example` for the development values.
- Successful admin login redirects to `/admin`; normal users redirect to `/dashboard`.
- A normal user visiting `/admin` is blocked by the frontend, and every `/api/admin/*` endpoint
  independently returns `403` for non-admin tokens.

### Verifying admin authorization

```bash
# Register/login a normal user, then call an admin API with their token -> expect 403
curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"secret1"}'
# use the returned access_token:
curl -s http://localhost:8000/api/admin/dashboard \
  -H "Authorization: Bearer <USER_TOKEN>"   # -> 403 Forbidden
```

## Security notes

- Passwords are hashed with bcrypt; plaintext passwords are never stored, logged, or returned.
- JWT authentication with backend role-based authorization; `/api/admin/*` is ADMIN-only.
- Uploaded files and inputs are validated; ORM queries are parameterized.
- Activity logs never record passwords or authentication secrets.
- Secrets live in backend environment variables; `.env` is excluded from Git.
- Admin credentials are never present in frontend/React code.

## Limitations

- Historical-data analysis only; no live/real-time ingestion.
- Demo consumer data is synthetic and clearly labelled as demo/prototype.
- Uploaded datasets are stored as normalized rows in the database for reproducible analysis.

## Future real-time extension

For real-time monitoring, the system can be extended by connecting to an authorized smart
meter, IoT energy meter, or electricity-provider API. Incoming readings would be securely
ingested, validated, preprocessed, scored by the trained anomaly-detection model, and displayed
on the dashboard, with optional alerts. This requires provider permission, API credentials, and
meter connectivity — a consumer number alone does not provide real-time readings.

## Tech stack

React 18 (JavaScript, Vite) · FastAPI (Python 3.12) · PostgreSQL 16 · SQLAlchemy 2 · Alembic ·
pandas · NumPy · scikit-learn · Recharts · docker-compose.
