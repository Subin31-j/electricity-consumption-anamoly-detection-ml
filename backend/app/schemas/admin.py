"""Admin panel schemas."""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, EmailStr

from app.schemas.common import HealthComponent


class AdminUserRow(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    name: str
    role: str
    status: str
    created_at: datetime


class UpdateUserStatusRequest(BaseModel):
    status: str  # ACTIVE | DISABLED


class AdminConsumerRow(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    consumer_number: str
    consumer_name: str
    connection_type: Optional[str] = None
    location: Optional[str] = None
    meter_type: Optional[str] = None
    total_records: int
    is_demo: bool


class CreateConsumerRequest(BaseModel):
    consumer_number: str
    consumer_name: str
    email: Optional[str] = None
    connection_type: Optional[str] = None
    location: Optional[str] = None
    meter_type: Optional[str] = None


class UpdateConsumerRequest(BaseModel):
    consumer_name: Optional[str] = None
    connection_type: Optional[str] = None
    location: Optional[str] = None
    meter_type: Optional[str] = None


class AdminDashboardStats(BaseModel):
    total_users: int
    active_users: int
    demo_consumers: int
    total_datasets: int
    total_analyses: int
    total_anomalies: int
    analyses_this_month: int
    charts: dict = {}


class AdminActivityRow(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: Optional[int] = None
    action: str
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
    created_at: datetime


class SystemHealthResponse(BaseModel):
    overall: str
    components: List[HealthComponent]
