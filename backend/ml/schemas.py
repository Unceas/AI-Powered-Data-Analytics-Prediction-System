from pydantic import BaseModel
from typing import Dict, Optional

class MLPredictionResponse(BaseModel):
    status: str
    message: str
    model_type: str
    metrics: Dict[str, float]
    feature_importance: Optional[Dict[str, float]] = None

class AnomalyDetectionResponse(BaseModel):
    status: str
    message: str
    total_records: int
    anomalies_detected: int
    anomaly_percentage: float
    anomalies_preview: Optional[list] = None
