"""Initial schema - all ECAD tables.

Revision ID: 0001
Revises:
Create Date: 2026-09-27

Creates all tables from the frozen SQLAlchemy metadata. This migration is the
single source of truth for the initial database structure and must not be
altered by later waves; add new migrations instead.
"""
from typing import Sequence, Union

from alembic import op

from app.db.base import Base

# Import all models so metadata is populated
import app.models  # noqa: F401

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    Base.metadata.create_all(bind=bind)


def downgrade() -> None:
    bind = op.get_bind()
    Base.metadata.drop_all(bind=bind)
