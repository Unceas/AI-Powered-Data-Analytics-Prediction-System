from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional, Literal
from datetime import datetime


class DatasetSummary(BaseModel):
    dataset_id: str
    name: str
    row_count: int
    column_count: int
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    status: str = "loaded"


class ColumnProfile(BaseModel):
    name: str
    inferred_type: Literal["numeric", "categorical", "temporal", "boolean", "text", "unknown"]
    missing_count: int
    missing_percentage: float
    unique_count: int
    cardinality: Literal["constant", "binary", "low", "moderate", "high", "unique"]
    sample_values: List[Any] = Field(default_factory=list)
    skewness: Optional[float] = None
    is_candidate_target: bool = False
    is_temporal: bool = False


class DataUnderstandingResponse(BaseModel):
    status: str
    message: str
    dataset_id: str
    row_count: int
    column_count: int
    duplicate_rows_count: int
    column_profiles: List[ColumnProfile]
    temporal_columns: List[str]
    candidate_targets: List[str]
    quality_score: int
    quality_details: Dict[str, Any]
    limitations: List[str]


class AnalysisSummary(BaseModel):
    analysis_id: str
    dataset_id: str
    status: str = "success"
    descriptive_statistics: Dict[str, Any]
    correlation_matrix: Optional[Dict[str, Any]] = None
    distributions: Optional[Dict[str, Any]] = None
    anomaly_summary: Optional[Dict[str, Any]] = None
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class EvidenceItem(BaseModel):
    evidence_id: str
    analysis_id: str
    dataset_id: str
    category: Literal["correlation", "anomaly", "distribution", "metric", "driver", "quality", "trend", "segment"]
    title: str
    description: str
    metric_name: str
    metric_value: Any
    unit: Optional[str] = None
    period: Optional[str] = None
    scope: Optional[str] = None
    strength: Literal["High", "Medium", "Low"] = "Medium"
    related_columns: List[str] = Field(default_factory=list)
    source: str
    provenance: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None
    technical_details: Optional[Dict[str, Any]] = None


class EvidenceResponse(BaseModel):
    status: str
    message: str
    analysis_id: str
    dataset_id: str
    total_evidence_count: int
    evidence: List[EvidenceItem]


class InsightItem(BaseModel):
    insight_id: str
    analysis_id: str
    dataset_id: str
    category: Literal["Correlation", "Prediction", "Anomaly", "Trend", "Quality", "Recommendation"]
    title: str
    summary: str
    why_it_matters: str
    severity: Literal["Critical", "High", "Medium", "Low"]
    priority: Literal["High", "Medium", "Low"] = "Medium"
    priority_score: float = 0.0
    priority_reasons: List[str] = Field(default_factory=list)
    is_key_finding: bool = False
    evidence_ids: List[str] = Field(default_factory=list)
    evidence_items: List[EvidenceItem] = Field(default_factory=list)
    related_columns: List[str] = Field(default_factory=list)
    recommended_next_step: str
    actionable_investigation_target: Optional[str] = None


class InsightListResponse(BaseModel):
    status: str
    message: str
    analysis_id: str
    dataset_id: str
    insights: List[InsightItem]


class InvestigationDimension(BaseModel):
    dimension: str
    dimension_type: Literal["categorical", "temporal", "segment", "feature"]
    distinct_count: int
    sample_values: List[Any] = Field(default_factory=list)
    rationale: str


class InvestigationContext(BaseModel):
    investigation_id: str
    insight_id: Optional[str] = None
    dataset_id: str
    analysis_id: str
    primary_feature: str
    target_feature: Optional[str] = None
    relevant_dimensions: List[InvestigationDimension] = Field(default_factory=list)
    drill_down_path: List[str] = Field(default_factory=list)
    supporting_evidence_ids: List[str] = Field(default_factory=list)
    summary: str
    suggested_prediction_target: Optional[str] = None


class InvestigationResponse(BaseModel):
    status: str
    message: str
    investigation: InvestigationContext


class DecisionBrief(BaseModel):
    brief_id: str
    dataset_id: str
    analysis_id: str
    what_happened: str
    why_it_matters: str
    what_data_suggests: str
    what_may_happen_next: Optional[str] = None
    reliability: Optional[str] = None
    reliability_explanation: Optional[str] = None
    investigate_next: str
    supporting_evidence_ids: List[str] = Field(default_factory=list)
    generated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class DecisionBriefResponse(BaseModel):
    status: str
    message: str
    decision_brief: DecisionBrief


class AnalyticalContext(BaseModel):
    dataset_id: str
    dataset_name: Optional[str] = None
    analysis_id: Optional[str] = None
    active_insight_id: Optional[str] = None
    active_target: Optional[str] = None
    active_dimensions: List[str] = Field(default_factory=list)
    previous_subject: Optional[str] = None
    conversation_history: List[Dict[str, str]] = Field(default_factory=list)


class AskInsightGridRequest(BaseModel):
    question: str
    dataset_id: str
    analysis_id: Optional[str] = None
    evidence_items: Optional[List[EvidenceItem]] = None
    dataset_name: Optional[str] = None
    context: Optional[AnalyticalContext] = None
    history: Optional[List[Dict[str, str]]] = None


class GroundedAnswerResponse(BaseModel):
    status: str
    message: str
    question: str
    answer: str
    referenced_evidence_ids: List[str] = Field(default_factory=list)
    confidence: Literal["High", "Medium", "Low"] = "High"
    resolved_subject: Optional[str] = None
    suggested_followups: List[str] = Field(default_factory=list)


class ReportPayload(BaseModel):
    dataset_id: str
    dataset_name: str
    understanding: Optional[DataUnderstandingResponse] = None
    analysis: Optional[AnalysisSummary] = None
    insights: List[InsightItem] = Field(default_factory=list)
    decision_brief: Optional[DecisionBrief] = None
    investigations: List[InvestigationContext] = Field(default_factory=list)
    prediction: Optional[Dict[str, Any]] = None
    evidence: List[EvidenceItem] = Field(default_factory=list)
    executive_summary: str
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
