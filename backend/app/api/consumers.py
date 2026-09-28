"""Consumer-number flow endpoints."""
from __future__ import annotations

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.consumer import ElectricityConsumer
from app.models.consumption import ElectricityConsumption
from app.models.user import User
from app.schemas.analysis import AnalysisCreatedResponse, AnalyzeConsumerRequest
from app.schemas.consumer import (
    ConsumerPublic,
    ConsumerStats,
    ConsumerVerifyRequest,
    ConsumerVerifyResponse,
    ConsumptionRecord,
    ConsumptionResponse,
)
from app.services.activity import log_activity
from app.services.analysis_runner import run_and_persist_analysis
from app.services.preprocessing import PreprocessingError, normalize_dataframe
from app.utils.masking import mask_consumer_number

router = APIRouter()

PREVIEW_LIMIT = 50


def _to_public(consumer: ElectricityConsumer) -> ConsumerPublic:
    return ConsumerPublic(
        id=consumer.id,
        consumer_number_masked=mask_consumer_number(consumer.consumer_number),
        consumer_name=consumer.consumer_name,
        connection_type=consumer.connection_type,
        location=consumer.location,
        meter_type=consumer.meter_type,
        data_start_date=consumer.data_start_date,
        data_end_date=consumer.data_end_date,
        total_records=consumer.total_records,
        is_demo=consumer.is_demo,
    )


def _stats(db: Session, consumer_id: int) -> ConsumerStats | None:
    rows = (
        db.query(ElectricityConsumption.consumption_kwh)
        .filter(ElectricityConsumption.consumer_id == consumer_id)
        .all()
    )
    if not rows:
        return None
    values = [r[0] for r in rows]
    return ConsumerStats(
        average_consumption=round(sum(values) / len(values), 4),
        peak_consumption=round(max(values), 4),
        minimum_consumption=round(min(values), 4),
        record_count=len(values),
    )


@router.post("/verify", response_model=ConsumerVerifyResponse)
def verify_consumer(
    payload: ConsumerVerifyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ConsumerVerifyResponse:
    consumer = (
        db.query(ElectricityConsumer)
        .filter(ElectricityConsumer.consumer_number == payload.consumer_number)
        .first()
    )
    if consumer is None:
        return ConsumerVerifyResponse(
            found=False,
            message="Consumer number not found in the demo system.",
        )

    log_activity(
        db,
        action="consumer_verified",
        user_id=current_user.id,
        entity_type="consumer",
        entity_id=consumer.id,
    )
    return ConsumerVerifyResponse(
        found=True,
        consumer=_to_public(consumer),
        stats=_stats(db, consumer.id),
    )


@router.get("/{consumer_id}", response_model=ConsumerPublic)
def get_consumer(
    consumer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ConsumerPublic:
    consumer = db.get(ElectricityConsumer, consumer_id)
    if consumer is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Consumer not found")
    return _to_public(consumer)


@router.get("/{consumer_id}/consumption", response_model=ConsumptionResponse)
def get_consumption(
    consumer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ConsumptionResponse:
    consumer = db.get(ElectricityConsumer, consumer_id)
    if consumer is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Consumer not found")

    stats = _stats(db, consumer_id)
    if stats is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No consumption data for this consumer",
        )

    preview_rows = (
        db.query(ElectricityConsumption)
        .filter(ElectricityConsumption.consumer_id == consumer_id)
        .order_by(ElectricityConsumption.timestamp.asc())
        .limit(PREVIEW_LIMIT)
        .all()
    )
    preview = [
        ConsumptionRecord(
            timestamp=r.timestamp,
            date=r.date,
            time=r.time,
            consumption_kwh=r.consumption_kwh,
        )
        for r in preview_rows
    ]
    return ConsumptionResponse(consumer=_to_public(consumer), stats=stats, preview=preview)


@router.post("/{consumer_id}/analyze", response_model=AnalysisCreatedResponse)
def analyze_consumer(
    consumer_id: int,
    payload: AnalyzeConsumerRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AnalysisCreatedResponse:
    consumer = db.get(ElectricityConsumer, consumer_id)
    if consumer is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Consumer not found")

    rows = (
        db.query(ElectricityConsumption.timestamp, ElectricityConsumption.consumption_kwh)
        .filter(ElectricityConsumption.consumer_id == consumer_id)
        .order_by(ElectricityConsumption.timestamp.asc())
        .all()
    )
    if not rows:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No consumption data available for analysis",
        )

    raw = pd.DataFrame(rows, columns=["timestamp", "consumption_kwh"])

    try:
        clean_df, _detected, _warnings = normalize_dataframe(raw)
    except PreprocessingError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))

    analysis = run_and_persist_analysis(
        db,
        user_id=current_user.id,
        clean_df=clean_df,
        models=payload.models,
        consumer_id=consumer_id,
    )
    if analysis.status.value == "FAILED":
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=analysis.error_message or "Analysis failed",
        )
    return AnalysisCreatedResponse(analysis_id=analysis.id, status=analysis.status.value)
