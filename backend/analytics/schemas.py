from pydantic import BaseModel
from typing import Dict, Any, List, Optional

class AnalyticsResponse(BaseModel):
    status: str
    message: str
    descriptive_statistics: Dict[str, Any]
    correlation_matrix: Optional[Dict[str, Any]] = None
    categorical_summaries: Optional[Dict[str, Any]] = None
    distributions: Optional[Dict[str, Any]] = None
