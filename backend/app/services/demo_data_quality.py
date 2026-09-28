"""Quality checks and validation reporting for the generated demo dataset.

Used by `scripts.generate_demo_dataset` to prove the synthetic dataset is
realistic: mostly normal records with a controlled minority of anomalies, no
duplicate/invalid timestamps, no negative values, and no reuse of the legacy
consumer numbers.
"""
from __future__ import annotations

import statistics
from datetime import timedelta
from typing import Dict, List

from app.services.demo_data import (
    DEMO_SPECS,
    END,
    FORBIDDEN_CONSUMER_NUMBERS,
    HOURS,
    START,
    DemoConsumerSpec,
)

# Acceptable anomaly share for a realistic dataset (PRD section 4).
MIN_ANOMALY_RATE = 3.0
MAX_ANOMALY_RATE = 10.0


def profile_rows(spec: DemoConsumerSpec, rows: List[dict],
                 anomaly_types: Dict[str, int]) -> dict:
    """Compute per-consumer statistics and run the quality checks."""
    values = [r["consumption_kwh"] for r in rows]
    flags = [r["ground_truth_anomaly"] for r in rows]
    timestamps = [r["timestamp"] for r in rows]

    total = len(rows)
    anomalies = sum(flags)
    normal = total - anomalies
    rate = (anomalies / total * 100) if total else 0.0

    normal_values = [v for v, f in zip(values, flags) if f == 0]
    anomaly_values = [v for v, f in zip(values, flags) if f == 1]

    issues = _check(spec, rows, values, timestamps, rate)

    return {
        "consumer_number": spec.consumer_number,
        "consumer_name": spec.consumer_name,
        "profile": spec.profile,
        "description": spec.description,
        "total_records": total,
        "normal_records": normal,
        "anomaly_records": anomalies,
        "anomaly_rate": round(rate, 2),
        "min_kwh": round(min(values), 4),
        "max_kwh": round(max(values), 4),
        "mean_kwh": round(statistics.fmean(values), 4),
        "median_kwh": round(statistics.median(values), 4),
        "std_kwh": round(statistics.pstdev(values), 4),
        "normal_mean_kwh": round(statistics.fmean(normal_values), 4) if normal_values else 0.0,
        "anomaly_mean_kwh": round(statistics.fmean(anomaly_values), 4) if anomaly_values else 0.0,
        "start": min(timestamps),
        "end": max(timestamps),
        "anomaly_types": dict(sorted(anomaly_types.items())),
        "anomalies_per_month": _per_month(timestamps, flags),
        "issues": issues,
    }


def _per_month(timestamps, flags) -> Dict[str, int]:
    buckets: Dict[str, int] = {}
    for ts, flag in zip(timestamps, flags):
        key = ts.strftime("%Y-%m")
        buckets.setdefault(key, 0)
        if flag:
            buckets[key] += 1
    return buckets


def _check(spec: DemoConsumerSpec, rows: List[dict], values: List[float],
           timestamps: List, rate: float) -> List[str]:
    issues: List[str] = []

    if spec.consumer_number in FORBIDDEN_CONSUMER_NUMBERS:
        issues.append("Uses a forbidden legacy consumer number.")
    if len(spec.consumer_number) != 11 or not spec.consumer_number.isdigit():
        issues.append("Consumer number is not exactly 11 digits.")

    if len(set(timestamps)) != len(timestamps):
        issues.append("Duplicate timestamps found for this consumer.")
    if min(timestamps) != START or max(timestamps) != END:
        issues.append(f"Unexpected date range: {min(timestamps)} -> {max(timestamps)}.")
    if len(rows) != HOURS:
        issues.append(f"Expected {HOURS} hourly records, found {len(rows)}.")

    # Timestamps must form a contiguous hourly sequence.
    gaps = [
        (a, b)
        for a, b in zip(timestamps, timestamps[1:])
        if b - a != timedelta(hours=1)
    ]
    if gaps:
        issues.append(f"{len(gaps)} gap(s) in the hourly timestamp sequence.")

    if any(v is None for v in values):
        issues.append("Missing consumption values.")
    if any(v < 0 for v in values):
        issues.append("Negative consumption values found.")
    if any(r["ground_truth_anomaly"] not in (0, 1) for r in rows):
        issues.append("ground_truth_anomaly contains values other than 0/1.")

    if rate > MAX_ANOMALY_RATE:
        issues.append(f"Anomaly rate {rate:.2f}% exceeds the {MAX_ANOMALY_RATE}% ceiling.")
    if rate < MIN_ANOMALY_RATE:
        issues.append(f"Anomaly rate {rate:.2f}% is below the {MIN_ANOMALY_RATE}% floor.")

    return issues


def cross_consumer_checks(profiles: List[dict]) -> List[str]:
    issues: List[str] = []
    numbers = [p["consumer_number"] for p in profiles]
    if len(set(numbers)) != len(numbers):
        issues.append("Duplicate consumer numbers across demo consumers.")
    if len(numbers) != len(DEMO_SPECS):
        issues.append(f"Expected {len(DEMO_SPECS)} demo consumers, found {len(numbers)}.")
    leaked = set(numbers) & FORBIDDEN_CONSUMER_NUMBERS
    if leaked:
        issues.append(f"Legacy consumer numbers reused: {sorted(leaked)}")
    return issues


def format_report(profiles: List[dict], global_issues: List[str]) -> str:
    """Human-readable validation report (PRD section 19)."""
    lines: List[str] = []
    lines.append("=" * 72)
    lines.append("ECAD DEMO DATASET VALIDATION REPORT  (DEMO / PROTOTYPE DATA)")
    lines.append("=" * 72)

    for p in profiles:
        lines.append("")
        lines.append(f"Consumer:      {p['consumer_number']}  ({p['consumer_name']})")
        lines.append(f"Profile:       {p['profile']} - {p['description']}")
        lines.append(f"Records:       {p['total_records']:,}")
        lines.append(f"Normal:        {p['normal_records']:,}")
        lines.append(f"Anomalies:     {p['anomaly_records']:,}")
        lines.append(f"Anomaly rate:  {p['anomaly_rate']:.2f}%")
        lines.append(f"Average:       {p['mean_kwh']:.2f} kWh")
        lines.append(f"Median:        {p['median_kwh']:.2f} kWh")
        lines.append(f"Std dev:       {p['std_kwh']:.2f} kWh")
        lines.append(f"Peak:          {p['max_kwh']:.2f} kWh")
        lines.append(f"Minimum:       {p['min_kwh']:.2f} kWh")
        lines.append(
            f"Normal mean:   {p['normal_mean_kwh']:.2f} kWh   |   "
            f"Anomaly mean: {p['anomaly_mean_kwh']:.2f} kWh"
        )
        lines.append(
            f"Date range:    {p['start'].date()} -> {p['end'].date()}"
        )
        types = ", ".join(f"{k}={v}" for k, v in p["anomaly_types"].items())
        lines.append(f"Event types:   {types}")
        months = " ".join(f"{k[-2:]}:{v}" for k, v in sorted(p["anomalies_per_month"].items()))
        lines.append(f"Anomalies/mo:  {months}")
        lines.append(f"Checks:        {'PASS' if not p['issues'] else 'FAIL'}")
        for issue in p["issues"]:
            lines.append(f"   - {issue}")

    total = sum(p["total_records"] for p in profiles)
    anomalies = sum(p["anomaly_records"] for p in profiles)
    normal = total - anomalies
    all_values_min = min(p["min_kwh"] for p in profiles)
    all_values_max = max(p["max_kwh"] for p in profiles)
    weighted_mean = (
        sum(p["mean_kwh"] * p["total_records"] for p in profiles) / total if total else 0.0
    )

    lines.append("")
    lines.append("-" * 72)
    lines.append("OVERALL SUMMARY")
    lines.append("-" * 72)
    lines.append(f"Consumers:      {len(profiles)}")
    lines.append(f"Total records:  {total:,}")
    lines.append(f"Normal:         {normal:,}  ({normal / total * 100:.2f}%)")
    lines.append(f"Anomalies:      {anomalies:,}  ({anomalies / total * 100:.2f}%)")
    lines.append(f"Average:        {weighted_mean:.2f} kWh")
    lines.append(f"Range:          {all_values_min:.2f} - {all_values_max:.2f} kWh")
    lines.append(
        f"Date range:     {min(p['start'] for p in profiles).date()} -> "
        f"{max(p['end'] for p in profiles).date()}"
    )

    failures = [i for p in profiles for i in p["issues"]] + global_issues
    lines.append("")
    if failures:
        lines.append("VALIDATION: FAILED")
        for issue in failures:
            lines.append(f"   - {issue}")
    else:
        lines.append("VALIDATION: ALL CHECKS PASSED")
        lines.append("   - Five unique 11-digit demo consumer numbers")
        lines.append("   - Legacy numbers 91000000001-91000000005 NOT reused")
        lines.append("   - Contiguous hourly timestamps, no duplicates, no gaps")
        lines.append("   - No negative or missing consumption values")
        lines.append(
            f"   - Anomaly share within {MIN_ANOMALY_RATE}-{MAX_ANOMALY_RATE}% "
            f"for every consumer (majority of records are NORMAL)"
        )

    lines.append("")
    lines.append(
        "NOTE: ground_truth_anomaly exists only in these generated CSV files for "
        "validation. It is not stored in the database and is not an ML input "
        "feature, so Isolation Forest / K-Means / LOF detect anomalies independently."
    )
    lines.append("")
    return "\n".join(lines)
