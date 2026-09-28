"""Shared / common schema definitions."""
from typing import Generic, List, Optional, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class Message(BaseModel):
    message: str


class Paginated(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int = 1
    page_size: int = 20


class HealthComponent(BaseModel):
    name: str
    status: str = Field(description="healthy | degraded | unavailable")
    detail: Optional[str] = None
