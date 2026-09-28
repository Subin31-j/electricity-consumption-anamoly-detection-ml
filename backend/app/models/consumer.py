"""Electricity consumer (demo/prototype accounts)."""
from datetime import date, datetime

from sqlalchemy import Date, DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class ElectricityConsumer(Base):
    __tablename__ = "electricity_consumers"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    consumer_number: Mapped[str] = mapped_column(
        String(11), unique=True, index=True, nullable=False
    )
    consumer_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    connection_type: Mapped[str | None] = mapped_column(String(64), nullable=True)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    meter_type: Mapped[str | None] = mapped_column(String(64), nullable=True)
    data_start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    data_end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    total_records: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_demo: Mapped[bool] = mapped_column(default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    consumption = relationship(
        "ElectricityConsumption", back_populates="consumer", cascade="all, delete-orphan"
    )
