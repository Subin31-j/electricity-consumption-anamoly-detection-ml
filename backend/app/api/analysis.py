"""Analysis endpoints: create from dataset, fetch results, fetch anomalies."""
from __future__ import annotations

import json

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.analysis import Analysis
from app.models.anomaly import Anomaly
from app.models.dataset import Dataset, DatasetStatus
from app.models.user import User, UserRole
from app.schemas.analysis import (
    AnalysisCreatedResponse,
    AnalysisPublic,
    AnalysisResults,
    AnomaliesResponse,
    AnomalyRecord,
    CreateAnalysisRequest,
    ModelAgreement,
    SummaryStats,
)
from app.services.analysis_runner import run_and_persist_analysis
from app.services.preprocessing import PreprocessingError, normalize_dataframe

router = APIRouter()


def _owned_analysis(db: Session, analysis_id: int, user: User) -> Analysis:
    analysis = db.get(Analysis, analysis_id)
    if analysis is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found")
    if analysis.user_id != user.id and user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    return analysis


@router.post("/analysis", response_model=AnalysisCreatedResponse)
def create_analysis(
    payload: CreateAnalysisRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AnalysisCreatedResponse:
    dataset = db.get(Dataset, payload.dataset_id)
    if dataset is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dataset not found")
    if dataset.user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    meta = json.loads(dataset.dataset_metadata) if dataset.dataset_metadata else {}
    rows = meta.get("rows", [])
    if not rows:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Dataset has no stored rows to analyze.",
        )

    raw = pd.DataFrame(rows)
    try:
        clean_df, _detected, _warnings = normalize_dataframe(raw)
    except PreprocessingError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))

    analysis = run_and_persist_analysis(
        db,
        user_id=current_user.id,
        clean_df=clean_df,
        models=payload.models,
        dataset_id=dataset.id,
    )

    dataset.status = DatasetStatus.ANALYZED
    db.commit()

    if analysis.status.value == "FAILED":
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=analysis.error_message or "Analysis failed",
        )
    return AnalysisCreatedResponse(analysis_id=analysis.id, status=analysis.status.value)


@router.get("/analysis/{analysis_id}/results", response_model=AnalysisResults)
def get_results(
    analysis_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AnalysisResults:
    analysis = _owned_analysis(db, analysis_id, current_user)
    if not analysis.results_json:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Results are not available for this analysis.",
        )

    payload = json.loads(analysis.results_json)
    return AnalysisResults(
        analysis=AnalysisPublic.model_validate(analysis),
        summary=SummaryStats(**payload["summary"]),
        models=payload["models"],
        agreement=ModelAgreement(**payload["agreement"]),
        charts=payload.get("charts", {}),
        insights=payload.get("insights", []),
    )


@router.get("/analysis/{analysis_id}/anomalies", response_model=AnomaliesResponse)
def get_anomalies(
    analysis_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AnomaliesResponse:
    analysis = _owned_analysis(db, analysis_id, current_user)
    rows = (
        db.query(Anomaly)
        .filter(Anomaly.analysis_id == analysis.id)
        .order_by(Anomaly.timestamp.asc())
        .all()
    )
    items = [AnomalyRecord.model_validate(r) for r in rows]
    return AnomaliesResponse(analysis_id=analysis.id, total=len(items), items=items)
