"""Reports and analysis-history endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.analysis import Analysis
from app.models.report import Report
from app.models.user import User, UserRole
from app.schemas.report import (
    HistoryItem,
    HistoryResponse,
    ReportDetail,
    ReportPublic,
)
from app.services.activity import log_activity
from app.services.reporting import build_report_content

router = APIRouter()


@router.get("/history", response_model=HistoryResponse)
def get_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> HistoryResponse:
    rows = (
        db.query(Analysis)
        .filter(Analysis.user_id == current_user.id)
        .order_by(Analysis.created_at.desc())
        .all()
    )
    items = [HistoryItem.model_validate(r) for r in rows]
    return HistoryResponse(total=len(items), items=items)


@router.get("/reports/{report_id}", response_model=ReportDetail)
def get_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ReportDetail:
    report = db.get(Report, report_id)
    if report is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    if report.user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    analysis = db.get(Analysis, report.analysis_id)
    if analysis is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Associated analysis not found")

    content = build_report_content(db, analysis)
    return ReportDetail(report=ReportPublic.model_validate(report), content=content)


@router.post("/analysis/{analysis_id}/report", response_model=ReportPublic)
def create_report(
    analysis_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ReportPublic:
    analysis = db.get(Analysis, analysis_id)
    if analysis is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found")
    if analysis.user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    report = Report(
        analysis_id=analysis.id,
        user_id=current_user.id,
        report_type="SUMMARY",
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    log_activity(
        db,
        action="report_generated",
        user_id=current_user.id,
        entity_type="report",
        entity_id=report.id,
    )
    return ReportPublic.model_validate(report)
