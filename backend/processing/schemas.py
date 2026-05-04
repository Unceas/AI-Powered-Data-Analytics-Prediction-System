from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class ProcessingConfig(BaseModel):
    handle_missing: str = "drop" # options: "drop", "mean", "median", "mode", "constant"
    missing_constant: Optional[str] = None
    scale_features: bool = False
    scaling_method: str = "standard" # options: "standard", "minmax"
    encode_categorical: bool = False
    encoding_method: str = "onehot" # options: "onehot", "label"

class ProcessingResponse(BaseModel):
    status: str
    message: str
    rows: int
    columns: List[str]
    preview: Optional[List[Dict[str, Any]]] = None
