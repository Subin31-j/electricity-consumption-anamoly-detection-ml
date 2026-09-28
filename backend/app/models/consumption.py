"""Historical electricity consumption readings."""
from datetime import date as date_type
from datetime import datetime
from datetime import time as time_type

from sqlalchemy import Date, DateTime, Float, ForeignKey, Index, Time, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class ElectricityConsumption(Base):
    __tablename__ = "electricity_consumption"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    consumer_id: Mapped[int] = mapped_column(
        ForeignKey("electricity_consumers.id", ondelete="CASCADE"), index=True, nullable=False
    )
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=False), index=True, nullable=False)
    date: Mapped[date_type] = mapped_column(Date, nullable=False)
    time: Mapped[time_type] = mapped_column(Time, nullable=False)
    consumption_kwh: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    consumer = relationship("ElectricityConsumer", back_populates="consumption")

    __table_args__ = (
        Index("ix_consumption_consumer_timestamp", "consumer_id", "timestamp"),
    )
