"""Shared helper to run the pipeline and persist analysis + anomaly rows.

Used by both the consumer-number path and the dataset-upload path so the two
input paths converge on identical persistence logic.
"""
from __future__ import annotations

import json
from typing import List, Optional

import pandas as pd
from sqlalchemy.orm import Session

from app.models.analysis import Analysis, AnalysisStatus
from app.models.anomaly import Anomaly
from app.services.activity import log_activity
from app.services.anomaly_detection import run_pipeline


def run_and_persist_analysis(
    db: Session,
    user_id: int,
    clean_df: pd.DataFrame,
    models: Optional[List[str]] = None,
    consumer_id: Optional[int] = None,
    dataset_id: Optional[int] = None,
) -> Analysis:
    """Run the shared ML pipeline on a normalized dataframe and persist results.

    Returns the completed Analysis (or a FAILED one with error_message set).
    """
    analysis = Analysis(
        user_id=user_id,
        consumer_id=consumer_id,
        dataset_id=dataset_id,
        models_used=",".join(models) if models else "",
        record_count=len(clean_df),
        status=AnalysisStatus.RUNNING,
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    log_activity(
        db,
        action="analysis_started",
        user_id=user_id,
        entity_type="analysis",
        entity_id=analysis.id,
    )

    try:
        results = run_pipeline(clean_df, models=models)
    except Exception as exc:  # noqa: BLE001
        analysis.status = AnalysisStatus.FAILED
        analysis.error_message = str(exc)
        db.commit()
        db.refresh(analysis)
        return analysis

    summary = results["summary"]
    analysis.anomaly_count = summary["anomaly_count"]
    analysis.processing_time = results["processing_time"]
    analysis.models_used = results["models_used"]
    analysis.results_json = json.dumps(_results_payload(results))
    analysis.status = AnalysisStatus.COMPLETED

    # Persist anomaly rows (records flagged by at least one model).
    anomaly_rows = [
        Anomaly(
            analysis_id=analysis.id,
            timestamp=r["timestamp"],
            consumption_kwh=r["consumption_kwh"],
            iforest_label=r["iforest_label"],
            iforest_score=r["iforest_score"],
            kmeans_cluster=r["kmeans_cluster"],
            kmeans_label=r["kmeans_label"],
            kmeans_score=r["kmeans_score"],
            lof_label=r["lof_label"],
            lof_score=r["lof_score"],
            agreement_count=r["agreement_count"],
        )
        for r in results["records"]
        if r["agreement_count"] >= 1
    ]
    if anomaly_rows:
        db.bulk_save_objects(anomaly_rows)

    db.commit()
    db.refresh(analysis)

    log_activity(
        db,
        action="analysis_completed",
        user_id=user_id,
        entity_type="analysis",
        entity_id=analysis.id,
        metadata={"anomaly_count": analysis.anomaly_count},
    )
    return analysis


def _results_payload(results: dict) -> dict:
    """The JSON stored on the analysis row (everything except heavy per-record list)."""
    return {
        "summary": results["summary"],
        "models": results["models"],
        "agreement": results["agreement"],
        "charts": results["charts"],
        "insights": results["insights"],
    }
