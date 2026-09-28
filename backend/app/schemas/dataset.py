"""Dataset schemas."""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict


class DatasetPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    name: str
    source_type: str
    record_count: int
    status: str
    created_at: datetime


class DatasetPreviewRow(BaseModel):
    timestamp: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    consumption_kwh: Optional[float] = None


class DatasetUploadResponse(BaseModel):
    dataset: DatasetPublic
    detected_columns: dict
    record_count: int
    preview: List[DatasetPreviewRow]
    warnings: List[str] = []
