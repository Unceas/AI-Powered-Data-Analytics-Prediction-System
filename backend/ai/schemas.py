from pydantic import BaseModel
from typing import Dict, Any

class AIInsightRequest(BaseModel):
    analysis_data: Dict[str, Any]
    context: str = "Please provide data insights based on the following statistical analysis."

class AIInsightResponse(BaseModel):
    status: str
    message: str
    insights: str
