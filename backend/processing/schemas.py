from pydantic import BaseModel
from typing import Optional, List, Dict, Any, Literal

class ProcessingConfig(BaseModel):
    handle_missing: Literal["drop", "mean", "median", "mode", "constant"] = "drop"
    missing_constant: Optional[str] = None
    scale_features: bool = False
    scaling_method: Literal["standard", "minmax"] = "standard"
    encode_categorical: bool = False
    encoding_method: Literal["onehot", "label"] = "onehot"

class ProcessingResponse(BaseModel):
    status: str
    message: str
    rows: int
    columns: List[str]
    preview: Optional[List[Dict[str, Any]]] = None
