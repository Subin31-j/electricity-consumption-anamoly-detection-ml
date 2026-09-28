"""Helper for writing activity/audit logs. Never logs passwords or secrets."""
import json
from typing import Optional

from sqlalchemy.orm import Session

from app.models.activity_log import ActivityLog


def log_activity(
    db: Session,
    action: str,
    user_id: Optional[int] = None,
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
    metadata: Optional[dict] = None,
    commit: bool = True,
) -> ActivityLog:
    """Record an activity. `metadata` must never contain passwords or auth secrets."""
    entry = ActivityLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        log_metadata=json.dumps(metadata) if metadata else None,
    )
    db.add(entry)
    if commit:
        db.commit()
    return entry
