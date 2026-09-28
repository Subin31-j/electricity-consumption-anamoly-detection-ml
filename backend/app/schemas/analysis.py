"""Analysis, results and anomaly schemas. These shapes are FROZEN contracts."""
from datetime import datetime
from typing import Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


class AnalyzeConsumerRequest(BaseModel):
    models: List[str] = Field(default=["isolation_forest", "kmeans", "lof"])


class CreateAnalysisRequest(BaseModel):
    """Trigger analysis from a previously uploaded dataset."""
    dataset_id: int
    models: List[str] = Field(default=["isolation_forest", "kmeans", "lof"])


class AnalysisPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    consumer_id: Optional[int] = None
    dataset_id: Optional[int] = None
    models_used: str
    record_count: int
    anomaly_count: int
    status: str
    processing_time: Optional[float] = None
    created_at: datetime


class AnalysisCreatedResponse(BaseModel):
    analysis_id: int
    status: str


class SummaryStats(BaseModel):
    total_records: int
    normal_records: int
    anomaly_count: int
    anomaly_rate: float
    average_consumption: float
    peak_consumption: float
    minimum_consumption: float


class ModelConfig(BaseModel):
    name: str
    params: Dict = {}
    anomaly_count: int
    scoring_note: Optional[str] = None


class ModelAgreement(BaseModel):
    detected_by_all_three: int
    detected_by_two: int
    detected_by_one: int


class ChartSeries(BaseModel):
    """Generic labelled numeric series for frontend charts."""
    name: str
    points: List[Dict]


class AnomalyRecord(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    timestamp: datetime
    consumption_kwh: float
    iforest_label: bool
    iforest_score: Optional[float] = None
    kmeans_cluster: Optional[int] = None
    kmeans_label: bool
    kmeans_score: Optional[float] = None
    lof_label: bool
    lof_score: Optional[float] = None
    agreement_count: int


class AnalysisResults(BaseModel):
    analysis: AnalysisPublic
    summary: SummaryStats
    models: List[ModelConfig]
    agreement: ModelAgreement
    charts: Dict[str, List[Dict]] = Field(
        default_factory=dict,
        description="keyed chart series: consumption_trend, normal_vs_anomaly, "
        "hourly_pattern, daily_trend, monthly_trend, anomaly_timeline, model_comparison",
    )
    insights: List[str] = []
    disclaimer: str = (
        "Anomalies indicate unusual consumption patterns identified by machine "
        "learning models. They do not prove electricity theft, equipment failure, "
        "or energy wastage."
    )


class AnomaliesResponse(BaseModel):
    analysis_id: int
    total: int
    items: List[AnomalyRecord]
