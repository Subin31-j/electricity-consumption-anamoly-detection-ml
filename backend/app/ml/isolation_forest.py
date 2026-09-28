"""Isolation Forest anomaly detector (primary model)."""
from __future__ import annotations

import numpy as np
from sklearn.ensemble import IsolationForest

RANDOM_STATE = 42


def run_isolation_forest(features: np.ndarray, contamination: float = 0.05) -> dict:
    """Fit Isolation Forest and return labels and normalized anomaly scores.

    Returns dict with:
      - labels: bool array (True = anomaly)
      - scores: float array (higher = more anomalous), normalized to [0, 1]
      - params: configuration used
      - anomaly_count: int
    """
    n = features.shape[0]
    contamination = min(max(contamination, 0.001), 0.5)

    model = IsolationForest(
        n_estimators=100,
        contamination=contamination,
        random_state=RANDOM_STATE,
        n_jobs=-1,
    )
    model.fit(features)

    raw_pred = model.predict(features)  # -1 anomaly, 1 normal
    labels = raw_pred == -1

    # decision_function: higher = more normal. Invert so higher = more anomalous.
    decision = model.decision_function(features)
    inverted = -decision
    scores = _normalize(inverted)

    return {
        "labels": labels,
        "scores": scores,
        "params": {
            "n_estimators": 100,
            "contamination": round(contamination, 4),
            "random_state": RANDOM_STATE,
        },
        "anomaly_count": int(labels.sum()),
    }


def _normalize(arr: np.ndarray) -> np.ndarray:
    lo, hi = float(np.min(arr)), float(np.max(arr))
    if hi - lo < 1e-12:
        return np.zeros_like(arr, dtype=float)
    return (arr - lo) / (hi - lo)
