"""Shared anomaly-detection pipeline.

Both the consumer-number path and the upload path call `run_pipeline` with a
normalized internal-schema dataframe. Returns a results payload matching the
frozen AnalysisResults contract plus per-record anomaly rows for persistence.
"""
from __future__ import annotations

import time
from typing import Dict, List

import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler

from app.ml.isolation_forest import run_isolation_forest
from app.ml.kmeans import run_kmeans
from app.ml.lof import run_lof
from app.services.feature_engineering import engineer_features

DEFAULT_MODELS = ["isolation_forest", "kmeans", "lof"]
DEFAULT_CONTAMINATION = 0.05


def run_pipeline(
    clean_df: pd.DataFrame,
    models: List[str] | None = None,
    contamination: float = DEFAULT_CONTAMINATION,
) -> Dict:
    """Execute the shared ML pipeline on a normalized dataframe.

    Returns a dict with keys: summary, models, agreement, charts, insights,
    records (per-row anomaly detail), processing_time, models_used.
    """
    models = models or DEFAULT_MODELS
    start = time.perf_counter()

    enriched, feature_matrix, _feature_names = engineer_features(clean_df)

    scaler = StandardScaler()
    scaled = scaler.fit_transform(feature_matrix)

    n = len(enriched)
    model_results: Dict[str, dict] = {}

    if "isolation_forest" in models:
        model_results["isolation_forest"] = run_isolation_forest(scaled, contamination)
    if "kmeans" in models:
        model_results["kmeans"] = run_kmeans(scaled, contamination)
    if "lof" in models:
        model_results["lof"] = run_lof(scaled, contamination)

    # Assemble per-record detail with agreement.
    records = _assemble_records(enriched, model_results)

    # A record is "anomalous" overall if agreement_count >= 1.
    anomaly_count = int(sum(1 for r in records if r["agreement_count"] >= 1))

    summary = _summary_stats(enriched, anomaly_count)
    agreement = _agreement_breakdown(records)
    model_configs = _model_configs(model_results, n)
    charts = _build_charts(enriched, records)
    insights = _build_insights(summary, agreement, model_configs)

    processing_time = round(time.perf_counter() - start, 4)

    return {
        "summary": summary,
        "models": model_configs,
        "agreement": agreement,
        "charts": charts,
        "insights": insights,
        "records": records,
        "processing_time": processing_time,
        "models_used": ",".join(m for m in DEFAULT_MODELS if m in models),
    }


def _assemble_records(enriched: pd.DataFrame, model_results: Dict[str, dict]) -> List[dict]:
    n = len(enriched)
    iforest = model_results.get("isolation_forest")
    kmeans = model_results.get("kmeans")
    lof = model_results.get("lof")

    records: List[dict] = []
    for i in range(n):
        row = enriched.iloc[i]
        if_label = bool(iforest["labels"][i]) if iforest else False
        km_label = bool(kmeans["labels"][i]) if kmeans else False
        lof_label = bool(lof["labels"][i]) if lof else False
        agreement = int(if_label) + int(km_label) + int(lof_label)

        records.append(
            {
                "timestamp": row["timestamp"].to_pydatetime(),
                "consumption_kwh": float(row["consumption_kwh"]),
                "iforest_label": if_label,
                "iforest_score": float(iforest["scores"][i]) if iforest else None,
                "kmeans_cluster": int(kmeans["clusters"][i]) if kmeans else None,
                "kmeans_label": km_label,
                "kmeans_score": float(kmeans["scores"][i]) if kmeans else None,
                "lof_label": lof_label,
                "lof_score": float(lof["scores"][i]) if lof else None,
                "agreement_count": agreement,
            }
        )
    return records


def _summary_stats(enriched: pd.DataFrame, anomaly_count: int) -> dict:
    total = len(enriched)
    consumption = enriched["consumption_kwh"]
    return {
        "total_records": total,
        "normal_records": total - anomaly_count,
        "anomaly_count": anomaly_count,
        "anomaly_rate": round((anomaly_count / total) * 100, 2) if total else 0.0,
        "average_consumption": round(float(consumption.mean()), 4),
        "peak_consumption": round(float(consumption.max()), 4),
        "minimum_consumption": round(float(consumption.min()), 4),
    }


def _agreement_breakdown(records: List[dict]) -> dict:
    all_three = sum(1 for r in records if r["agreement_count"] == 3)
    two = sum(1 for r in records if r["agreement_count"] == 2)
    one = sum(1 for r in records if r["agreement_count"] == 1)
    return {
        "detected_by_all_three": all_three,
        "detected_by_two": two,
        "detected_by_one": one,
    }


def _model_configs(model_results: Dict[str, dict], n: int) -> List[dict]:
    configs: List[dict] = []
    label_map = {
        "isolation_forest": "Isolation Forest",
        "kmeans": "K-Means",
        "lof": "Local Outlier Factor",
    }
    for key, res in model_results.items():
        configs.append(
            {
                "name": label_map.get(key, key),
                "params": res.get("params", {}),
                "anomaly_count": res.get("anomaly_count", 0),
                "scoring_note": res.get("scoring_note"),
            }
        )
    return configs


def _build_charts(enriched: pd.DataFrame, records: List[dict]) -> Dict[str, List[dict]]:
    df = enriched.copy()
    df["is_anomaly"] = [r["agreement_count"] >= 1 for r in records]

    # Consumption trend + normal/anomaly overlay (downsampled if very large).
    trend = [
        {
            "timestamp": row["timestamp"].isoformat(),
            "consumption_kwh": round(float(row["consumption_kwh"]), 4),
            "is_anomaly": bool(row["is_anomaly"]),
        }
        for _, row in df.iterrows()
    ]

    hourly = (
        df.groupby("hour")["consumption_kwh"].mean().round(4).reset_index().to_dict("records")
    )
    daily = (
        df.groupby(df["timestamp"].dt.date)["consumption_kwh"]
        .mean()
        .round(4)
        .reset_index()
    )
    daily.columns = ["date", "consumption_kwh"]
    daily_points = [
        {"date": str(r["date"]), "consumption_kwh": float(r["consumption_kwh"])}
        for _, r in daily.iterrows()
    ]
    monthly = (
        df.groupby("month")["consumption_kwh"].mean().round(4).reset_index().to_dict("records")
    )

    anomaly_timeline = [
        {
            "timestamp": r["timestamp"].isoformat(),
            "consumption_kwh": round(r["consumption_kwh"], 4),
            "agreement_count": r["agreement_count"],
        }
        for r in records
        if r["agreement_count"] >= 1
    ]

    model_comparison = [
        {"model": "Isolation Forest", "anomalies": sum(1 for r in records if r["iforest_label"])},
        {"model": "K-Means", "anomalies": sum(1 for r in records if r["kmeans_label"])},
        {"model": "LOF", "anomalies": sum(1 for r in records if r["lof_label"])},
    ]

    normal_vs_anomaly = [
        {"name": "Normal", "value": sum(1 for r in records if r["agreement_count"] == 0)},
        {"name": "Anomaly", "value": sum(1 for r in records if r["agreement_count"] >= 1)},
    ]

    return {
        "consumption_trend": trend,
        "normal_vs_anomaly": normal_vs_anomaly,
        "hourly_pattern": hourly,
        "daily_trend": daily_points,
        "monthly_trend": monthly,
        "anomaly_timeline": anomaly_timeline,
        "model_comparison": model_comparison,
    }


def _build_insights(summary: dict, agreement: dict, model_configs: List[dict]) -> List[str]:
    insights: List[str] = []
    insights.append(
        f"Analyzed {summary['total_records']} records; "
        f"{summary['anomaly_count']} flagged as anomalous "
        f"({summary['anomaly_rate']}%)."
    )
    if agreement["detected_by_all_three"] > 0:
        insights.append(
            f"{agreement['detected_by_all_three']} record(s) were flagged by all three "
            f"models, indicating strong agreement."
        )
    insights.append(
        f"Average consumption was {summary['average_consumption']} kWh, "
        f"peaking at {summary['peak_consumption']} kWh."
    )
    for cfg in model_configs:
        insights.append(f"{cfg['name']} flagged {cfg['anomaly_count']} record(s).")
    insights.append(
        "Anomalies indicate unusual patterns identified by the models and do not prove "
        "a physical fault, theft, or energy wastage."
    )
    return insights
