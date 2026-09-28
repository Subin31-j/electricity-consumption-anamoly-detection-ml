"""Reproducible demo consumer dataset generation (DEMO / PROTOTYPE DATA).

Generates 12 months of stable hourly electricity consumption for the five
fictional demo consumers, each with a distinct behavioural profile per the PRD.

Design goals
------------
* Realistic *normal* behaviour dominates the dataset (~93-97% of records):
  time-of-day shape, weekday/weekend differences, gradual seasonal drift,
  day-to-day household variation and natural noise.
* A small, controlled minority of records are intentional anomaly events
  (spikes, drops, night-time surges, short bursts, off-peak highs,
  peak-hour lows), spread across the whole historical period.
* A per-consumer fixed seed makes the dataset byte-stable across runs.

Ground truth
------------
`generate_consumption` returns a `ground_truth_anomaly` flag (0/1) per row.
It exists ONLY for dataset validation and CSV export. It is never written to
`electricity_consumption` and never reaches the ML feature matrix, so the
models must detect anomalies independently (no label leakage).

These consumer numbers are fictional prototype identifiers. They do not belong
to any real electricity board or real consumer.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Dict, List, Tuple

import numpy as np

# ---------------------------------------------------------------------------
# Historical window: 12 months of hourly readings (2024 is a leap year -> 8784)
# ---------------------------------------------------------------------------
START = datetime(2024, 1, 1, 0, 0, 0)
END = datetime(2024, 12, 31, 23, 0, 0)
HOURS = int((END - START).total_seconds() // 3600) + 1  # 8784

# Anomaly event catalogue -----------------------------------------------------
# spike            : short, large upward deviation
# drop             : near-zero reading during an ordinarily active hour
# night_surge      : heavy usage during normally inactive night hours
# burst            : several consecutive elevated readings
# offpeak_high     : unexpected high usage in a normally low-usage window
# peak_low         : unexpected low usage during the normally high evening peak
ANOMALY_TYPES = ("spike", "drop", "night_surge", "burst", "offpeak_high", "peak_low")

NIGHT_HOURS = tuple(range(0, 6))          # 00:00 - 05:00
EVENING_PEAK_HOURS = (18, 19, 20, 21, 22)
LOW_WINDOW_HOURS = (2, 3, 4, 10, 11, 14, 15)

# Hourly shape profiles (24 multipliers around a mean of ~1.0) ----------------
# Domestic: low night, morning rise, moderate afternoon, strong evening peak.
DOMESTIC_WEEKDAY = [
    0.34, 0.30, 0.28, 0.28, 0.32, 0.45,   # 00-05 night
    0.78, 1.10, 1.22, 1.05, 0.82, 0.74,   # 06-11 morning
    0.76, 0.80, 0.78, 0.82, 0.95, 1.20,   # 12-17 afternoon
    1.55, 1.72, 1.68, 1.45, 1.05, 0.62,   # 18-23 evening peak -> late night
]
DOMESTIC_WEEKEND = [
    0.38, 0.33, 0.30, 0.29, 0.31, 0.38,   # sleep in a little longer
    0.55, 0.82, 1.15, 1.30, 1.18, 1.05,   # later, broader morning
    1.00, 0.95, 0.92, 0.96, 1.08, 1.28,   # more daytime presence
    1.58, 1.70, 1.62, 1.42, 1.12, 0.74,
]
# Commercial-leaning household: flatter, longer active day, high evening.
COMMERCIAL_WEEKDAY = [
    0.46, 0.42, 0.40, 0.40, 0.44, 0.62,
    0.95, 1.28, 1.45, 1.42, 1.30, 1.22,
    1.18, 1.20, 1.18, 1.22, 1.30, 1.42,
    1.52, 1.50, 1.32, 1.05, 0.78, 0.55,
]
COMMERCIAL_WEEKEND = [
    0.44, 0.40, 0.38, 0.37, 0.39, 0.48,
    0.66, 0.88, 1.05, 1.12, 1.10, 1.05,
    1.02, 1.00, 0.98, 1.00, 1.08, 1.20,
    1.32, 1.34, 1.22, 1.00, 0.76, 0.54,
]


@dataclass
class DemoConsumerSpec:
    """A demo consumer and the parameters of its consumption behaviour."""

    consumer_number: str  # 11-digit fictional demo identifier
    consumer_name: str
    connection_type: str
    location: str
    meter_type: str
    seed: int
    profile: str
    description: str
    base_kwh: float                  # mean hourly level before shaping
    weekday_shape: List[float]
    weekend_shape: List[float]
    weekend_factor: float            # overall weekend level vs weekday
    seasonal_amplitude: float        # +/- fraction across the year
    daily_variation: float           # day-to-day household drift (sigma, log)
    noise: float                     # within-hour natural noise (sigma, log)
    target_anomaly_rate: float       # fraction of records to make anomalous
    anomaly_mix: Dict[str, float] = field(default_factory=dict)


# ---------------------------------------------------------------------------
# The five demo consumers.
# NOTE: these numbers already exist in the database and must NOT be changed.
# The legacy 91000000001-91000000005 numbers are deliberately NOT used.
# ---------------------------------------------------------------------------
DEMO_SPECS: List[DemoConsumerSpec] = [
    DemoConsumerSpec(
        consumer_number="10023456781",
        consumer_name="Demo Consumer 1",
        connection_type="Domestic",
        location="Chennai (Demo)",
        meter_type="Single-phase",
        seed=101,
        profile="normal_household",
        description="Normal household: morning rise, moderate evening peak, low nights",
        base_kwh=1.15,
        weekday_shape=DOMESTIC_WEEKDAY,
        weekend_shape=DOMESTIC_WEEKEND,
        weekend_factor=1.08,
        seasonal_amplitude=0.18,
        daily_variation=0.09,
        noise=0.10,
        target_anomaly_rate=0.035,
        anomaly_mix={"spike": 0.45, "drop": 0.25, "burst": 0.15, "offpeak_high": 0.15},
    ),
    DemoConsumerSpec(
        consumer_number="10023456782",
        consumer_name="Demo Consumer 2",
        connection_type="Commercial",
        location="Coimbatore (Demo)",
        meter_type="Three-phase",
        seed=102,
        profile="high_consumption",
        description="Higher-consumption household: strong regular peaks, occasional abnormal spikes",
        base_kwh=3.10,
        weekday_shape=COMMERCIAL_WEEKDAY,
        weekend_shape=COMMERCIAL_WEEKEND,
        weekend_factor=0.92,
        seasonal_amplitude=0.22,
        daily_variation=0.11,
        noise=0.11,
        target_anomaly_rate=0.045,
        anomaly_mix={"spike": 0.50, "burst": 0.25, "drop": 0.15, "peak_low": 0.10},
    ),
    DemoConsumerSpec(
        consumer_number="10023456783",
        consumer_name="Demo Consumer 3",
        connection_type="Domestic",
        location="Madurai (Demo)",
        meter_type="Single-phase",
        seed=103,
        profile="night_irregular",
        description="Normal daytime pattern with occasional unusual night-time usage",
        base_kwh=1.35,
        weekday_shape=DOMESTIC_WEEKDAY,
        weekend_shape=DOMESTIC_WEEKEND,
        weekend_factor=1.05,
        seasonal_amplitude=0.20,
        daily_variation=0.09,
        noise=0.10,
        target_anomaly_rate=0.040,
        anomaly_mix={"night_surge": 0.60, "offpeak_high": 0.20, "spike": 0.12, "drop": 0.08},
    ),
    DemoConsumerSpec(
        consumer_number="10023456784",
        consumer_name="Demo Consumer 4",
        connection_type="Domestic",
        location="Trichy (Demo)",
        meter_type="Single-phase",
        seed=104,
        profile="seasonal",
        description="Pronounced but normal seasonal variation with limited anomalies",
        base_kwh=1.75,
        weekday_shape=DOMESTIC_WEEKDAY,
        weekend_shape=DOMESTIC_WEEKEND,
        weekend_factor=1.10,
        seasonal_amplitude=0.42,   # strong seasonal swing -- this is NORMAL
        daily_variation=0.10,
        noise=0.10,
        target_anomaly_rate=0.034,
        anomaly_mix={"spike": 0.40, "drop": 0.25, "burst": 0.20, "peak_low": 0.15},
    ),
    DemoConsumerSpec(
        consumer_number="10023456785",
        consumer_name="Demo Consumer 5",
        connection_type="Commercial",
        location="Salem (Demo)",
        meter_type="Three-phase",
        seed=105,
        profile="mixed_abnormal",
        description="Mostly normal with a mixture of spikes, drops and time-based events",
        base_kwh=2.00,
        weekday_shape=COMMERCIAL_WEEKDAY,
        weekend_shape=COMMERCIAL_WEEKEND,
        weekend_factor=0.95,
        seasonal_amplitude=0.24,
        daily_variation=0.12,
        noise=0.12,
        target_anomaly_rate=0.065,
        anomaly_mix={
            "spike": 0.28,
            "drop": 0.20,
            "night_surge": 0.16,
            "burst": 0.16,
            "offpeak_high": 0.10,
            "peak_low": 0.10,
        },
    ),
]

DEMO_CONSUMER_NUMBERS: List[str] = [s.consumer_number for s in DEMO_SPECS]
# Legacy numbers from the previous project setup -- must never be reused.
FORBIDDEN_CONSUMER_NUMBERS = {
    "91000000001",
    "91000000002",
    "91000000003",
    "91000000004",
    "91000000005",
}


def get_spec(consumer_number: str) -> DemoConsumerSpec | None:
    for spec in DEMO_SPECS:
        if spec.consumer_number == consumer_number:
            return spec
    return None


# ---------------------------------------------------------------------------
# Normal behaviour
# ---------------------------------------------------------------------------
def _timestamps() -> List[datetime]:
    return [START + timedelta(hours=h) for h in range(HOURS)]


def _seasonal_multiplier(day_of_year: np.ndarray, amplitude: float) -> np.ndarray:
    """Smooth annual cycle peaking in mid-May (hot season) and lowest in winter.

    A second, weaker harmonic adds a mild secondary hump so the curve does not
    look like a textbook sine wave.
    """
    primary = np.cos(2 * np.pi * (day_of_year - 135) / 365.0)
    secondary = 0.25 * np.cos(4 * np.pi * (day_of_year - 135) / 365.0)
    return 1.0 + amplitude * (primary + secondary) / 1.25


def _daily_drift(rng: np.random.Generator, n_days: int, sigma: float) -> np.ndarray:
    """AR(1) day-to-day household behaviour drift (multiplicative, mean ~1)."""
    eps = rng.normal(0.0, sigma, n_days)
    drift = np.zeros(n_days)
    acc = 0.0
    for i in range(n_days):
        acc = 0.65 * acc + eps[i]
        drift[i] = acc
    return np.exp(drift - 0.5 * np.var(drift))


def _normal_series(spec: DemoConsumerSpec, rng: np.random.Generator,
                   timestamps: List[datetime]) -> Tuple[np.ndarray, np.ndarray]:
    """Build the realistic normal consumption series.

    Returns (series, hours) where `hours` is the hour-of-day per record.
    """
    hours = np.array([t.hour for t in timestamps])
    weekdays = np.array([t.weekday() for t in timestamps])
    day_index = np.array([(t.date() - START.date()).days for t in timestamps])
    day_of_year = np.array([t.timetuple().tm_yday for t in timestamps], dtype=float)
    is_weekend = weekdays >= 5

    weekday_shape = np.array(spec.weekday_shape, dtype=float)
    weekend_shape = np.array(spec.weekend_shape, dtype=float)

    shape = np.where(is_weekend, weekend_shape[hours], weekday_shape[hours])
    level = np.where(is_weekend, spec.weekend_factor, 1.0)

    season = _seasonal_multiplier(day_of_year, spec.seasonal_amplitude)

    n_days = int(day_index.max()) + 1
    drift = _daily_drift(rng, n_days, spec.daily_variation)[day_index]

    # Occasional legitimately busy days (guests, holidays) -- still NORMAL.
    busy_days = rng.random(n_days) < 0.045
    busy_factor = np.where(busy_days, rng.uniform(1.18, 1.40, n_days), 1.0)[day_index]

    # Small hour-to-hour shift in the routine so no two days are identical.
    routine_jitter = 1.0 + rng.normal(0.0, 0.05, n_days)[day_index]

    series = spec.base_kwh * shape * level * season * drift * busy_factor * routine_jitter

    # Natural multiplicative noise + tiny additive measurement noise.
    series = series * np.exp(rng.normal(0.0, spec.noise, len(series)))
    series = series + rng.normal(0.0, 0.02 * spec.base_kwh, len(series))

    return np.clip(series, 0.03, None), hours


# ---------------------------------------------------------------------------
# Anomaly events
# ---------------------------------------------------------------------------
def _event_plan(spec: DemoConsumerSpec, rng: np.random.Generator,
                target_hours: int) -> List[str]:
    """Pick a sequence of event types matching the configured mix."""
    types = [t for t in ANOMALY_TYPES if spec.anomaly_mix.get(t, 0) > 0]
    weights = np.array([spec.anomaly_mix[t] for t in types], dtype=float)
    weights = weights / weights.sum()

    plan: List[str] = []
    budget = target_hours
    # Average hours consumed per event type (bursts are multi-hour).
    avg_len = {"burst": 4.0, "night_surge": 1.6, "offpeak_high": 1.4,
               "spike": 1.0, "drop": 1.0, "peak_low": 1.5}
    while budget > 0:
        t = types[int(rng.choice(len(types), p=weights))]
        plan.append(t)
        budget -= avg_len[t]
    return plan


def _candidate_indices(event_type: str, hours: np.ndarray,
                       month_bucket: np.ndarray, month: int) -> np.ndarray:
    """Indices eligible for an event type, restricted to one month for spread."""
    in_month = month_bucket == month
    if event_type == "night_surge":
        mask = in_month & np.isin(hours, NIGHT_HOURS)
    elif event_type == "peak_low":
        mask = in_month & np.isin(hours, EVENING_PEAK_HOURS)
    elif event_type == "offpeak_high":
        mask = in_month & np.isin(hours, LOW_WINDOW_HOURS)
    elif event_type == "drop":
        # Drops are only meaningful during ordinarily active hours.
        mask = in_month & (hours >= 7) & (hours <= 22)
    else:
        mask = in_month
    return np.flatnonzero(mask)


def _inject_anomalies(spec: DemoConsumerSpec, rng: np.random.Generator,
                      series: np.ndarray, hours: np.ndarray,
                      timestamps: List[datetime]) -> Tuple[np.ndarray, np.ndarray, Dict[str, int]]:
    """Apply controlled anomaly events. Returns (series, ground_truth, type_counts)."""
    n = len(series)
    ground_truth = np.zeros(n, dtype=int)
    type_counts: Dict[str, int] = {t: 0 for t in ANOMALY_TYPES}

    month_bucket = np.array([t.month for t in timestamps])
    # A robust "typical level for this hour" used as the reference for events.
    hour_median = np.array([np.median(series[hours == h]) for h in range(24)])

    target_hours = int(round(spec.target_anomaly_rate * n))
    plan = _event_plan(spec, rng, target_hours)

    # Round-robin over months so anomalies are spread across the whole year.
    months = list(range(1, 13))
    rng.shuffle(months)

    applied = 0
    for i, event_type in enumerate(plan):
        if applied >= target_hours:
            break
        month = months[i % 12]
        candidates = _candidate_indices(event_type, hours, month_bucket, month)
        # Keep a 2-hour guard band so events do not merge into long blocks.
        free = [c for c in candidates if not ground_truth[max(0, c - 2): c + 3].any()]
        if not free:
            continue
        start = int(rng.choice(free))
        applied += _apply_event(event_type, rng, series, ground_truth, hours,
                                hour_median, start, n)
        type_counts[event_type] += 1

    return np.clip(series, 0.02, None), ground_truth, type_counts


def _apply_event(event_type: str, rng: np.random.Generator, series: np.ndarray,
                 ground_truth: np.ndarray, hours: np.ndarray,
                 hour_median: np.ndarray, start: int, n: int) -> int:
    """Mutate `series` in place for one event. Returns the number of hours affected."""
    if event_type == "spike":
        # Magnitude varies: some are extreme (all models catch), some borderline.
        factor = float(rng.choice([2.6, 3.2, 4.0, 5.0, 6.0],
                                  p=[0.22, 0.26, 0.24, 0.18, 0.10]))
        series[start] = series[start] * factor * rng.uniform(0.92, 1.08)
        ground_truth[start] = 1
        return 1

    if event_type == "drop":
        series[start] = hour_median[hours[start]] * rng.uniform(0.04, 0.16)
        ground_truth[start] = 1
        return 1

    if event_type == "night_surge":
        length = int(rng.integers(1, 4))  # 1-3 night hours
        end = min(start + length, n)
        for j in range(start, end):
            typical_evening = float(hour_median[19])
            series[j] = typical_evening * rng.uniform(1.4, 2.6)
            ground_truth[j] = 1
        return end - start

    if event_type == "burst":
        length = int(rng.integers(3, 7))  # 3-6 consecutive hours
        end = min(start + length, n)
        factor = rng.uniform(2.0, 3.0)
        for j in range(start, end):
            series[j] = series[j] * factor * rng.uniform(0.9, 1.1)
            ground_truth[j] = 1
        return end - start

    if event_type == "offpeak_high":
        length = int(rng.integers(1, 3))
        end = min(start + length, n)
        for j in range(start, end):
            series[j] = hour_median[hours[j]] * rng.uniform(3.5, 6.5)
            ground_truth[j] = 1
        return end - start

    if event_type == "peak_low":
        length = int(rng.integers(1, 4))
        end = min(start + length, n)
        for j in range(start, end):
            series[j] = hour_median[hours[j]] * rng.uniform(0.08, 0.22)
            ground_truth[j] = 1
        return end - start

    return 0


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------
def generate_with_metadata(spec: DemoConsumerSpec) -> Tuple[List[dict], Dict[str, int]]:
    """Return stable hourly rows for one demo consumer plus anomaly-type counts.

    Each row: {timestamp, consumption_kwh, ground_truth_anomaly}.
    `ground_truth_anomaly` is for validation/CSV export only -- it is never
    persisted to the database and never used as an ML feature.
    """
    rng = np.random.default_rng(spec.seed)
    timestamps = _timestamps()

    series, hours = _normal_series(spec, rng, timestamps)
    series, ground_truth, type_counts = _inject_anomalies(spec, rng, series, hours, timestamps)

    rows = [
        {
            "timestamp": ts,
            "consumption_kwh": round(float(val), 4),
            "ground_truth_anomaly": int(flag),
        }
        for ts, val, flag in zip(timestamps, series, ground_truth)
    ]
    return rows, {k: v for k, v in type_counts.items() if v}


def generate_consumption(spec: DemoConsumerSpec) -> List[dict]:
    """Stable hourly rows for one demo consumer (see `generate_with_metadata`)."""
    rows, _counts = generate_with_metadata(spec)
    return rows
