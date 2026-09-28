"""ORM models package. Import all models so Alembic autogenerate can see them."""
from app.models.user import User, UserRole, UserStatus
from app.models.consumer import ElectricityConsumer
from app.models.consumption import ElectricityConsumption
from app.models.dataset import Dataset, DatasetSourceType, DatasetStatus
from app.models.analysis import Analysis, AnalysisStatus
from app.models.anomaly import Anomaly
from app.models.report import Report
from app.models.activity_log import ActivityLog

__all__ = [
    "User",
    "UserRole",
    "UserStatus",
    "ElectricityConsumer",
    "ElectricityConsumption",
    "Dataset",
    "DatasetSourceType",
    "DatasetStatus",
    "Analysis",
    "AnalysisStatus",
    "Anomaly",
    "Report",
    "ActivityLog",
]
