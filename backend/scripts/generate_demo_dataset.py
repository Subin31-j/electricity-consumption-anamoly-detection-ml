"""Generate the demo dataset CSV files and the validation report.

Writes to `backend/data/demo/`:
  demo_consumer_1.csv .. demo_consumer_5.csv
  ecad_combined_demo_dataset.csv
  dataset_validation_report.txt

The CSVs carry a `ground_truth_anomaly` column for dataset validation only.
It is never inserted into the database and never used as an ML feature.

Usage:
    python -m scripts.generate_demo_dataset
"""
from __future__ import annotations

import csv
from pathlib import Path
from typing import List

from app.services.demo_data import DEMO_SPECS, generate_with_metadata
from app.services.demo_data_quality import (
    cross_consumer_checks,
    format_report,
    profile_rows,
)

OUTPUT_DIR = Path(__file__).resolve().parent.parent / "data" / "demo"

# Canonical dataset columns. `ground_truth_anomaly` is validation-only.
COLUMNS = [
    "consumer_number",
    "timestamp",
    "date",
    "time",
    "consumption_kwh",
    "day_of_week",
    "hour",
    "month",
    "season",
    "ground_truth_anomaly",
]

SEASONS = {
    12: "Winter", 1: "Winter", 2: "Winter",
    3: "Spring", 4: "Spring", 5: "Spring",
    6: "Summer", 7: "Summer", 8: "Summer",
    9: "Autumn", 10: "Autumn", 11: "Autumn",
}


def _csv_row(consumer_number: str, row: dict) -> dict:
    ts = row["timestamp"]
    return {
        "consumer_number": consumer_number,
        "timestamp": ts.strftime("%Y-%m-%d %H:%M:%S"),
        "date": ts.strftime("%Y-%m-%d"),
        "time": ts.strftime("%H:%M:%S"),
        "consumption_kwh": f"{row['consumption_kwh']:.4f}",
        "day_of_week": ts.strftime("%A"),
        "hour": ts.hour,
        "month": ts.month,
        "season": SEASONS[ts.month],
        "ground_truth_anomaly": row["ground_truth_anomaly"],
    }


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    profiles: List[dict] = []
    combined: List[dict] = []

    for index, spec in enumerate(DEMO_SPECS, start=1):
        rows, anomaly_types = generate_with_metadata(spec)
        profiles.append(profile_rows(spec, rows, anomaly_types))

        csv_rows = [_csv_row(spec.consumer_number, r) for r in rows]
        combined.extend(csv_rows)

        path = OUTPUT_DIR / f"demo_consumer_{index}.csv"
        _write(path, csv_rows)
        print(f"[dataset] Wrote {path.name} ({len(csv_rows):,} rows)")

    combined_path = OUTPUT_DIR / "ecad_combined_demo_dataset.csv"
    _write(combined_path, combined)
    print(f"[dataset] Wrote {combined_path.name} ({len(combined):,} rows)")

    report = format_report(profiles, cross_consumer_checks(profiles))
    report_path = OUTPUT_DIR / "dataset_validation_report.txt"
    report_path.write_text(report, encoding="utf-8")
    print(f"[dataset] Wrote {report_path.name}")
    print()
    print(report)

    if any(p["issues"] for p in profiles) or cross_consumer_checks(profiles):
        raise SystemExit(1)


def _write(path: Path, rows: List[dict]) -> None:
    with path.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=COLUMNS)
        writer.writeheader()
        writer.writerows(rows)


if __name__ == "__main__":
    main()
