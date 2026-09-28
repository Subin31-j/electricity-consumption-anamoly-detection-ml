"""Admin panel endpoints. Every route enforces ADMIN via require_admin."""
from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import func, text
from sqlalchemy.orm import Session

from app.core.deps import require_admin
from app.db.session import get_db
from app.models.activity_log import ActivityLog
from app.models.analysis import Analysis
from app.models.anomaly import Anomaly
from app.models.consumer import ElectricityConsumer
from app.models.consumption import ElectricityConsumption
from app.models.dataset import Dataset
from app.models.report import Report
from app.models.user import User, UserRole, UserStatus
from app.schemas.admin import (
    AdminActivityRow,
    AdminConsumerRow,
    AdminDashboardStats,
    AdminUserRow,
    CreateConsumerRequest,
    SystemHealthResponse,
    UpdateConsumerRequest,
    UpdateUserStatusRequest,
)
from app.schemas.analysis import AnalysisPublic, AnomalyRecord
from app.schemas.common import HealthComponent, Paginated
from app.schemas.dataset import DatasetPublic
from app.schemas.report import ReportPublic
from app.services.activity import log_activity
from app.utils.masking import mask_consumer_number

router = APIRouter()


# --------------------------- Dashboard ---------------------------
@router.get("/dashboard", response_model=AdminDashboardStats)
def dashboard(db: Session = Depends(get_db), _admin: User = Depends(require_admin)) -> AdminDashboardStats:
    total_users = db.query(func.count(User.id)).scalar() or 0
    active_users = (
        db.query(func.count(User.id)).filter(User.status == UserStatus.ACTIVE).scalar() or 0
    )
    demo_consumers = (
        db.query(func.count(ElectricityConsumer.id))
        .filter(ElectricityConsumer.is_demo.is_(True))
        .scalar()
        or 0
    )
    total_datasets = db.query(func.count(Dataset.id)).scalar() or 0
    total_analyses = db.query(func.count(Analysis.id)).scalar() or 0
    total_anomalies = db.query(func.count(Anomaly.id)).scalar() or 0

    now = datetime.now(timezone.utc)
    month_start = datetime(now.year, now.month, 1, tzinfo=timezone.utc)
    analyses_this_month = (
        db.query(func.count(Analysis.id)).filter(Analysis.created_at >= month_start).scalar() or 0
    )

    # Model usage chart from analyses.models_used.
    usage = {"isolation_forest": 0, "kmeans": 0, "lof": 0}
    for (models_used,) in db.query(Analysis.models_used).all():
        for key in usage:
            if models_used and key in models_used:
                usage[key] += 1

    charts = {
        "model_usage": [
            {"model": "Isolation Forest", "count": usage["isolation_forest"]},
            {"model": "K-Means", "count": usage["kmeans"]},
            {"model": "LOF", "count": usage["lof"]},
        ],
    }

    return AdminDashboardStats(
        total_users=total_users,
        active_users=active_users,
        demo_consumers=demo_consumers,
        total_datasets=total_datasets,
        total_analyses=total_analyses,
        total_anomalies=total_anomalies,
        analyses_this_month=analyses_this_month,
        charts=charts,
    )


# --------------------------- Users ---------------------------
@router.get("/users", response_model=Paginated[AdminUserRow])
def list_users(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
    search: str | None = Query(None),
    status_filter: str | None = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> Paginated[AdminUserRow]:
    q = db.query(User)
    if search:
        like = f"%{search}%"
        q = q.filter((User.email.ilike(like)) | (User.name.ilike(like)))
    if status_filter:
        q = q.filter(User.status == status_filter)

    total = q.count()
    rows = (
        q.order_by(User.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return Paginated[AdminUserRow](
        items=[AdminUserRow.model_validate(r) for r in rows],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/users/{user_id}", response_model=AdminUserRow)
def get_user(user_id: int, db: Session = Depends(get_db), _admin: User = Depends(require_admin)) -> AdminUserRow:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return AdminUserRow.model_validate(user)


@router.patch("/users/{user_id}/status", response_model=AdminUserRow)
def update_user_status(
    user_id: int,
    payload: UpdateUserStatusRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
) -> AdminUserRow:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    try:
        new_status = UserStatus(payload.status)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid status value")

    user.status = new_status
    db.commit()
    db.refresh(user)
    log_activity(
        db,
        action="user_disabled" if new_status == UserStatus.DISABLED else "user_enabled",
        user_id=admin.id,
        entity_type="user",
        entity_id=user.id,
    )
    return AdminUserRow.model_validate(user)


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
) -> Response:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if user.role == UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot delete an admin account")
    db.delete(user)
    db.commit()
    log_activity(db, action="user_deleted", user_id=admin.id, entity_type="user", entity_id=user_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# --------------------------- Consumers ---------------------------
def _consumer_row(c: ElectricityConsumer) -> AdminConsumerRow:
    return AdminConsumerRow(
        id=c.id,
        consumer_number=mask_consumer_number(c.consumer_number),
        consumer_name=c.consumer_name,
        connection_type=c.connection_type,
        location=c.location,
        meter_type=c.meter_type,
        total_records=c.total_records,
        is_demo=c.is_demo,
    )


@router.get("/consumers", response_model=list[AdminConsumerRow])
def list_consumers(db: Session = Depends(get_db), _admin: User = Depends(require_admin)) -> list[AdminConsumerRow]:
    rows = db.query(ElectricityConsumer).order_by(ElectricityConsumer.id.asc()).all()
    return [_consumer_row(c) for c in rows]


@router.post("/consumers", response_model=AdminConsumerRow, status_code=status.HTTP_201_CREATED)
def create_consumer(
    payload: CreateConsumerRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
) -> AdminConsumerRow:
    if db.query(ElectricityConsumer).filter(
        ElectricityConsumer.consumer_number == payload.consumer_number
    ).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Consumer number already exists")

    consumer = ElectricityConsumer(
        consumer_number=payload.consumer_number,
        consumer_name=payload.consumer_name,
        email=payload.email,
        connection_type=payload.connection_type,
        location=payload.location,
        meter_type=payload.meter_type,
        total_records=0,
        is_demo=True,
    )
    db.add(consumer)
    db.commit()
    db.refresh(consumer)
    log_activity(db, action="consumer_created", user_id=admin.id, entity_type="consumer", entity_id=consumer.id)
    return _consumer_row(consumer)


@router.get("/consumers/{consumer_id}", response_model=AdminConsumerRow)
def get_consumer_detail(
    consumer_id: int, db: Session = Depends(get_db), _admin: User = Depends(require_admin)
) -> AdminConsumerRow:
    consumer = db.get(ElectricityConsumer, consumer_id)
    if consumer is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Consumer not found")
    return _consumer_row(consumer)


@router.patch("/consumers/{consumer_id}", response_model=AdminConsumerRow)
def update_consumer(
    consumer_id: int,
    payload: UpdateConsumerRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
) -> AdminConsumerRow:
    consumer = db.get(ElectricityConsumer, consumer_id)
    if consumer is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Consumer not found")
    for field in ("consumer_name", "connection_type", "location", "meter_type"):
        value = getattr(payload, field)
        if value is not None:
            setattr(consumer, field, value)
    db.commit()
    db.refresh(consumer)
    log_activity(db, action="consumer_updated", user_id=admin.id, entity_type="consumer", entity_id=consumer.id)
    return _consumer_row(consumer)


@router.delete("/consumers/{consumer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_consumer(
    consumer_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)
) -> Response:
    consumer = db.get(ElectricityConsumer, consumer_id)
    if consumer is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Consumer not found")
    db.delete(consumer)
    db.commit()
    log_activity(db, action="consumer_deleted", user_id=admin.id, entity_type="consumer", entity_id=consumer_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# --------------------------- Datasets / Analyses / Anomalies / Reports ---------------------------
@router.get("/datasets", response_model=list[DatasetPublic])
def list_datasets(db: Session = Depends(get_db), _admin: User = Depends(require_admin)) -> list[DatasetPublic]:
    rows = db.query(Dataset).order_by(Dataset.created_at.desc()).all()
    return [DatasetPublic.model_validate(r) for r in rows]


@router.get("/analyses", response_model=list[AnalysisPublic])
def list_analyses(db: Session = Depends(get_db), _admin: User = Depends(require_admin)) -> list[AnalysisPublic]:
    rows = db.query(Analysis).order_by(Analysis.created_at.desc()).all()
    return [AnalysisPublic.model_validate(r) for r in rows]


@router.get("/anomalies", response_model=list[AnomalyRecord])
def list_anomalies(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
    limit: int = Query(200, ge=1, le=1000),
) -> list[AnomalyRecord]:
    rows = db.query(Anomaly).order_by(Anomaly.timestamp.desc()).limit(limit).all()
    return [AnomalyRecord.model_validate(r) for r in rows]


@router.get("/reports", response_model=list[ReportPublic])
def list_reports(db: Session = Depends(get_db), _admin: User = Depends(require_admin)) -> list[ReportPublic]:
    rows = db.query(Report).order_by(Report.created_at.desc()).all()
    return [ReportPublic.model_validate(r) for r in rows]


@router.get("/activity", response_model=list[AdminActivityRow])
def list_activity(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
    limit: int = Query(200, ge=1, le=1000),
) -> list[AdminActivityRow]:
    rows = db.query(ActivityLog).order_by(ActivityLog.created_at.desc()).limit(limit).all()
    return [AdminActivityRow.model_validate(r) for r in rows]


# --------------------------- System health ---------------------------
@router.get("/system-health", response_model=SystemHealthResponse)
def system_health(db: Session = Depends(get_db), _admin: User = Depends(require_admin)) -> SystemHealthResponse:
    components: list[HealthComponent] = []

    # Backend API is responding if this handler runs.
    components.append(HealthComponent(name="Backend API", status="healthy"))

    # Database connectivity.
    try:
        db.execute(text("SELECT 1"))
        components.append(HealthComponent(name="Database", status="healthy"))
    except Exception as exc:  # noqa: BLE001
        components.append(HealthComponent(name="Database", status="unavailable", detail=str(exc)))

    # ML engine availability.
    try:
        import sklearn  # noqa: F401
        components.append(HealthComponent(name="ML Engine", status="healthy"))
    except Exception as exc:  # noqa: BLE001
        components.append(HealthComponent(name="ML Engine", status="unavailable", detail=str(exc)))

    # Storage (data present in DB indicates storage is functional).
    try:
        has_data = (db.query(func.count(ElectricityConsumption.id)).scalar() or 0) > 0
        components.append(
            HealthComponent(
                name="Storage",
                status="healthy" if has_data else "degraded",
                detail=None if has_data else "No consumption data seeded yet.",
            )
        )
    except Exception as exc:  # noqa: BLE001
        components.append(HealthComponent(name="Storage", status="unavailable", detail=str(exc)))

    statuses = {c.status for c in components}
    if "unavailable" in statuses:
        overall = "degraded"
    elif "degraded" in statuses:
        overall = "degraded"
    else:
        overall = "healthy"

    return SystemHealthResponse(overall=overall, components=components)
