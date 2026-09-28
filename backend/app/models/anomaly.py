"""Detected anomaly records."""
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Anomaly(Base):
    __tablename__ = "anomalies"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    analysis_id: Mapped[int] = mapped_column(
        ForeignKey("analyses.id", ondelete="CASCADE"), index=True, nullable=False
    )
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=False), index=True, nullable=False)
    consumption_kwh: Mapped[float] = mapped_column(Float, nullable=False)

    # Isolation Forest
    iforest_label: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    iforest_score: Mapped[float | None] = mapped_column(Float, nullable=True)

    # K-Means
    kmeans_cluster: Mapped[int | None] = mapped_column(Integer, nullable=True)
    kmeans_label: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    kmeans_score: Mapped[float | None] = mapped_column(Float, nullable=True)

    # LOF
    lof_label: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    lof_score: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Model agreement: number of models (0-3) that flagged this record as anomalous
    agreement_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    analysis = relationship("Analysis", back_populates="anomalies")
