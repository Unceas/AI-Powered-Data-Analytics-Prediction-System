from pydantic import BaseModel
from typing import Dict, Optional, Any, List

class MLPredictionResponse(BaseModel):
    status: str
    message: str
    model_type: Optional[str] = "None"
    metrics: Optional[Dict[str, float]] = None
    feature_importance: Optional[Dict[str, float]] = None
    reliability_score: Optional[int] = 90
    reliability_details: Optional[Dict[str, float]] = None
    
    # User-facing layer
    prediction: Optional[Dict[str, Any]] = None
    reliability: Optional[str] = None
    drivers: Optional[List[Dict[str, Any]]] = None
    warnings: Optional[List[str]] = None
    
    # Developer/Technical layer
    technical: Optional[Dict[str, Any]] = None

class AnomalyDetectionResponse(BaseModel):
    status: str
    message: str
    total_records: int
    anomalies_detected: int
    anomaly_percentage: float
    anomalies_preview: Optional[list] = None
