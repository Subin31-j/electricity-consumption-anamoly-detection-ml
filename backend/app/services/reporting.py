"""Report content assembly from persisted analysis results."""
from __future__ import annotations

import json
from typing import Dict

from sqlalchemy.orm import Session

from app.models.analysis import Analysis

DISCLAIMER = (
    "Anomalies indicate unusual consumption patterns identified by machine learning "
    "models. They do not prove electricity theft, equipment failure, or energy wastage."
)


def build_report_content(db: Session, analysis: Analysis) -> Dict:
    """Assemble a report payload from a completed analysis."""
    results = json.loads(analysis.results_json) if analysis.results_json else {}
    summary = results.get("summary", {})
    models = results.get("models", [])
    agreement = results.get("agreement", {})
    insights = results.get("insights", [])

    source = "Consumer" if analysis.consumer_id else "Uploaded dataset"

    return {
        "identification": {
            "analysis_id": analysis.id,
            "source_type": source,
            "consumer_id": analysis.consumer_id,
            "dataset_id": analysis.dataset_id,
        },
        "analysis_date": analysis.created_at.isoformat() if analysis.created_at else None,
        "record_count": analysis.record_count,
        "models_used": analysis.models_used,
        "model_configuration": models,
        "summary": summary,
        "anomaly_counts": {
            "total_anomalies": summary.get("anomaly_count", analysis.anomaly_count),
            "anomaly_rate": summary.get("anomaly_rate"),
        },
        "model_agreement": agreement,
        "charts": results.get("charts", {}),
        "insights": insights,
        "disclaimer": DISCLAIMER,
    }
