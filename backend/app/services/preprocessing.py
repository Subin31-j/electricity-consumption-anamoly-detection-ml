"""Data validation, cleaning, and normalization to the internal schema.

Internal schema columns: timestamp (datetime), date, time, consumption_kwh (float).
Both the consumer-number path and the upload path converge here.
"""
from __future__ import annotations

from typing import Dict, List, Tuple

import numpy as np
import pandas as pd

# Candidate column names for flexible upload mapping.
TIMESTAMP_CANDIDATES = ["timestamp", "datetime", "date_time", "time_stamp", "reading_time"]
DATE_CANDIDATES = ["date", "reading_date", "day"]
TIME_CANDIDATES = ["time", "reading_time", "hour"]
CONSUMPTION_CANDIDATES = [
    "consumption_kwh",
    "consumption",
    "energy",
    "energy_consumption",
    "kwh",
    "usage",
    "power_kwh",
]

MIN_RECORDS_FOR_ML = 20


class PreprocessingError(ValueError):
    """Raised when a dataset cannot be processed into the internal schema."""


def detect_columns(df: pd.DataFrame) -> Dict[str, str | None]:
    """Detect which source columns map to timestamp/date/time/consumption."""
    lower = {c.lower().strip(): c for c in df.columns}

    def find(cands: List[str]) -> str | None:
        for cand in cands:
            if cand in lower:
                return lower[cand]
        return None

    return {
        "timestamp": find(TIMESTAMP_CANDIDATES),
        "date": find(DATE_CANDIDATES),
        "time": find(TIME_CANDIDATES),
        "consumption_kwh": find(CONSUMPTION_CANDIDATES),
    }


def normalize_dataframe(df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict, List[str]]:
    """Convert an arbitrary source dataframe to the internal schema.

    Returns (clean_df, detected_columns, warnings).
    Raises PreprocessingError for unrecoverable problems.
    """
    warnings: List[str] = []
    if df is None or df.empty:
        raise PreprocessingError("The dataset is empty.")

    detected = detect_columns(df)

    if detected["consumption_kwh"] is None:
        raise PreprocessingError(
            "Could not find a consumption column (e.g. consumption_kwh, energy, kwh)."
        )

    # Build timestamp.
    ts_series = _build_timestamp(df, detected, warnings)

    consumption = pd.to_numeric(df[detected["consumption_kwh"]], errors="coerce")

    out = pd.DataFrame(
        {
            "timestamp": ts_series,
            "consumption_kwh": consumption,
        }
    )

    before = len(out)

    # Drop rows with invalid timestamp or consumption.
    out = out.dropna(subset=["timestamp", "consumption_kwh"])
    dropped_invalid = before - len(out)
    if dropped_invalid > 0:
        warnings.append(f"Dropped {dropped_invalid} rows with invalid timestamp or consumption.")

    # Drop negative consumption (physically invalid for kWh totals).
    neg = (out["consumption_kwh"] < 0).sum()
    if neg > 0:
        out = out[out["consumption_kwh"] >= 0]
        warnings.append(f"Dropped {int(neg)} rows with negative consumption.")

    # Remove duplicate timestamps (keep first).
    dup = out.duplicated(subset=["timestamp"]).sum()
    if dup > 0:
        out = out.drop_duplicates(subset=["timestamp"], keep="first")
        warnings.append(f"Removed {int(dup)} duplicate timestamp rows.")

    # Sort chronologically.
    out = out.sort_values("timestamp").reset_index(drop=True)

    if len(out) < MIN_RECORDS_FOR_ML:
        raise PreprocessingError(
            f"Insufficient records for analysis: {len(out)} valid rows "
            f"(minimum {MIN_RECORDS_FOR_ML})."
        )

    # Derive date/time components.
    out["date"] = out["timestamp"].dt.date
    out["time"] = out["timestamp"].dt.time

    return out, detected, warnings


def _build_timestamp(df: pd.DataFrame, detected: Dict, warnings: List[str]) -> pd.Series:
    if detected["timestamp"] is not None:
        ts = pd.to_datetime(df[detected["timestamp"]], errors="coerce")
        return ts
    # Combine date + time if both present.
    if detected["date"] is not None and detected["time"] is not None:
        combined = (
            df[detected["date"]].astype(str).str.strip()
            + " "
            + df[detected["time"]].astype(str).str.strip()
        )
        return pd.to_datetime(combined, errors="coerce")
    if detected["date"] is not None:
        warnings.append("No time column found; using date only (time defaults to 00:00).")
        return pd.to_datetime(df[detected["date"]], errors="coerce")
    raise PreprocessingError(
        "Could not find a timestamp, or a date (with optional time), column."
    )
