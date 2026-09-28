"""K-Means clustering used for comparison-based anomaly scoring.

K-Means is not inherently an anomaly detector. The implemented scoring approach:
each point's distance to its assigned cluster centroid is computed; points whose
distance exceeds a percentile threshold (based on the target contamination) are
flagged as anomalous. This is a documented distance-based heuristic, not a claim
that K-Means detects outliers natively.
"""
from __future__ import annotations

import numpy as np
from sklearn.cluster import KMeans

RANDOM_STATE = 42

SCORING_NOTE = (
    "K-Means anomaly scoring is distance-based: the distance from each point to "
    "its assigned cluster centroid is normalized; points beyond the "
    "contamination-percentile threshold are flagged. K-Means is not a native "
    "outlier detector."
)


def run_kmeans(features: np.ndarray, contamination: float = 0.05, n_clusters: int | None = None) -> dict:
    n = features.shape[0]
    if n_clusters is None:
        # Heuristic: sqrt-based, bounded to a sensible range for consumption data.
        n_clusters = int(min(max(round(np.sqrt(n / 2)), 2), 8))
    n_clusters = min(n_clusters, max(2, n))

    model = KMeans(n_clusters=n_clusters, random_state=RANDOM_STATE, n_init=10)
    cluster_labels = model.fit_predict(features)

    centroids = model.cluster_centers_
    distances = np.linalg.norm(features - centroids[cluster_labels], axis=1)

    scores = _normalize(distances)
    threshold = np.quantile(distances, 1.0 - min(max(contamination, 0.001), 0.5))
    labels = distances > threshold

    return {
        "labels": labels,
        "scores": scores,
        "clusters": cluster_labels.astype(int),
        "params": {
            "n_clusters": int(n_clusters),
            "random_state": RANDOM_STATE,
            "contamination": round(min(max(contamination, 0.001), 0.5), 4),
        },
        "scoring_note": SCORING_NOTE,
        "anomaly_count": int(labels.sum()),
    }


def _normalize(arr: np.ndarray) -> np.ndarray:
    lo, hi = float(np.min(arr)), float(np.max(arr))
    if hi - lo < 1e-12:
        return np.zeros_like(arr, dtype=float)
    return (arr - lo) / (hi - lo)
