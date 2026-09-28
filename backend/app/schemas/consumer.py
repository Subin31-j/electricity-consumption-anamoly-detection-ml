"""Consumer and consumption schemas."""
from datetime import date, datetime, time
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class ConsumerVerifyRequest(BaseModel):
    consumer_number: str = Field(min_length=11, max_length=11, pattern=r"^\d{11}$")


class ConsumerStats(BaseModel):
    average_consumption: float
    peak_consumption: float
    minimum_consumption: float
    record_count: int


class ConsumerPublic(BaseModel):
    """Consumer info with masked consumer number for normal displays."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    consumer_number_masked: str = Field(description="e.g. 123*****901")
    consumer_name: str
    connection_type: Optional[str] = None
    location: Optional[str] = None
    meter_type: Optional[str] = None
    data_start_date: Optional[date] = None
    data_end_date: Optional[date] = None
    total_records: int
    is_demo: bool = True


class ConsumerVerifyResponse(BaseModel):
    found: bool
    consumer: Optional[ConsumerPublic] = None
    stats: Optional[ConsumerStats] = None
    message: Optional[str] = None


class ConsumptionRecord(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    timestamp: datetime
    date: date
    time: time
    consumption_kwh: float


class ConsumptionResponse(BaseModel):
    consumer: ConsumerPublic
    stats: ConsumerStats
    preview: List[ConsumptionRecord]
