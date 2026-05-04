from pydantic import BaseModel, HttpUrl
from typing import Optional, Dict, Any, List

class IngestionResponse(BaseModel):
    status: str
    message: str
    rows: int
    columns: List[str]
    preview: Optional[List[Dict[str, Any]]] = None

class APIIngestionRequest(BaseModel):
    url: HttpUrl
    method: str = "GET"
    headers: Optional[Dict[str, str]] = None
    params: Optional[Dict[str, str]] = None
    data_key: Optional[str] = None  # Key in JSON response where the list of records is stored
