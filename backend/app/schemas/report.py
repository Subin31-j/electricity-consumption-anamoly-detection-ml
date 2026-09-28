"""Report and history schemas."""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict


class ReportPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    analysis_id: int
    user_id: int
    report_type: str
    created_at: datetime


class ReportDetail(BaseModel):
    report: ReportPublic
    content: dict


class HistoryItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    consumer_id: Optional[int] = None
    dataset_id: Optional[int] = None
    models_used: str
    record_count: int
    anomaly_count: int
    status: str
    created_at: datetime


class HistoryResponse(BaseModel):
    total: int
    items: List[HistoryItem]
