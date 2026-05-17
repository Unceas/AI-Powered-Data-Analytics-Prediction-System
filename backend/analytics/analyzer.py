import pandas as pd
import numpy as np
from typing import Tuple, Dict, Any, Optional


def _json_safe(value: Any) -> Any:
    if isinstance(value, dict):
        return {key: _json_safe(item) for key, item in value.items()}
    if isinstance(value, list):
        return [_json_safe(item) for item in value]
    if isinstance(value, (np.integer, np.floating)):
        value = value.item()
    if isinstance(value, float) and (pd.isna(value) or np.isinf(value)):
        return None
    if pd.isna(value):
        return None
    return value


def analyze_dataframe(df: pd.DataFrame) -> Tuple[Dict[str, Any], Optional[Dict[str, Any]], Optional[Dict[str, Any]], Dict[str, Any]]:
    """
    Computes descriptive statistics, correlation matrix, and categorical summaries for a given DataFrame.
    """
    # Descriptive Statistics
    desc_stats = _json_safe(df.describe().to_dict()) if not df.empty else {}

    # Correlation Matrix (only for numeric columns)
    num_df = df.select_dtypes(include=[np.number])
    corr_matrix = None
    if not num_df.empty:
        corr_df = num_df.replace([np.inf, -np.inf], np.nan).corr()
        corr_matrix = _json_safe(corr_df.to_dict())
        
    # Categorical Summaries
    cat_df = df.select_dtypes(include=['object', 'category', 'str'])
    cat_summaries = None
    if not cat_df.empty:
        cat_summaries = {}
        for col in cat_df.columns:
            val_counts = _json_safe(cat_df[col].value_counts().head(10).to_dict())
            cat_summaries[col] = {
                "unique_count": int(cat_df[col].nunique()),
                "top_values": val_counts
            }
            
    distributions: Dict[str, Any] = {}
    try:
        numeric_cols = df.select_dtypes(include=['number']).columns
        for col in numeric_cols:
            s = df[col].replace([np.inf, -np.inf], np.nan).dropna()
            if s.empty:
                distributions[col] = {"bins": [], "counts": [], "min": None, "max": None}
                continue
            hist, edges = np.histogram(s, bins=10)
            distributions[col] = {
                "bins": edges.tolist(),
                "counts": hist.tolist(),
                "min": float(s.min()),
                "max": float(s.max())
            }
    except Exception:
        distributions = {}
    return desc_stats, corr_matrix, cat_summaries, distributions
