"""Leakage-safe time-based feature engineering for the internal schema."""
from __future__ import annotations

from typing import List, Tuple

import numpy as np
import pandas as pd


def _season(month: int) -> int:
    # Meteorological seasons (Northern Hemisphere): 0=winter,1=spring,2=summer,3=autumn
    if month in (12, 1, 2):
        return 0
    if month in (3, 4, 5):
        return 1
    if month in (6, 7, 8):
        return 2
    return 3


def engineer_features(df: pd.DataFrame) -> Tuple[pd.DataFrame, np.ndarray, List[str]]:
    """Return (enriched_df, feature_matrix, feature_names).

    Lag/rolling features use only past values (shift) to avoid leakage.
    """
    out = df.copy().reset_index(drop=True)
    ts = out["timestamp"]

    out["hour"] = ts.dt.hour
    out["day_of_week"] = ts.dt.dayofweek
    out["day"] = ts.dt.day
    out["month"] = ts.dt.month
    out["season"] = out["month"].apply(_season)
    out["is_weekend"] = (out["day_of_week"] >= 5).astype(int)

    # Leakage-safe lag & rolling (past-only). Fill initial NaNs with the series mean.
    mean_val = float(out["consumption_kwh"].mean())
    out["lag_1"] = out["consumption_kwh"].shift(1).fillna(mean_val)
    out["rolling_mean_3"] = (
        out["consumption_kwh"].shift(1).rolling(window=3, min_periods=1).mean().fillna(mean_val)
    )
    out["rolling_std_3"] = (
        out["consumption_kwh"].shift(1).rolling(window=3, min_periods=1).std().fillna(0.0)
    )

    feature_names = [
        "consumption_kwh",
        "hour",
        "day_of_week",
        "day",
        "month",
        "season",
        "is_weekend",
        "lag_1",
        "rolling_mean_3",
        "rolling_std_3",
    ]

    matrix = out[feature_names].to_numpy(dtype=float)
    return out, matrix, feature_names
