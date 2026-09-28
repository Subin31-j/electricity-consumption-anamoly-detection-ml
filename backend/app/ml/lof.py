"""Local Outlier Factor (LOF) density-based anomaly detector (comparison)."""
from __future__ import annotations

import numpy as np
from sklearn.neighbors import LocalOutlierFactor


def run_lof(features: np.ndarray, contamination: float = 0.05) -> dict:
    """Fit LOF and return labels and normalized outlier scores.

    Handles small datasets by clamping n_neighbors below the sample count.
    """
    n = features.shape[0]
    contamination = min(max(contamination, 0.001), 0.5)

    # n_neighbors must be < n_samples; default 20, clamped safely.
    n_neighbors = min(20, max(2, n - 1))

    model = LocalOutlierFactor(
        n_neighbors=n_neighbors,
        contamination=contamination,
        n_jobs=-1,
    )
    raw_pred = model.fit_predict(features)  # -1 anomaly, 1 normal
    labels = raw_pred == -1

    # negative_outlier_factor_: lower (more negative) = more outlying.
    nof = model.negative_outlier_factor_
    inverted = -nof
    scores = _normalize(inverted)

    return {
        "labels": labels,
        "scores": scores,
        "params": {
            "n_neighbors": int(n_neighbors),
            "contamination": round(contamination, 4),
        },
        "anomaly_count": int(labels.sum()),
    }


def _normalize(arr: np.ndarray) -> np.ndarray:
    lo, hi = float(np.min(arr)), float(np.max(arr))
    if hi - lo < 1e-12:
        return np.zeros_like(arr, dtype=float)
    return (arr - lo) / (hi - lo)
