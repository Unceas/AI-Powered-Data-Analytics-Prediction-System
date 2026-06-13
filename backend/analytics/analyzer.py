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

def calculate_dataset_health(df: pd.DataFrame) -> Tuple[int, Dict[str, float]]:
    if df.empty:
        return 100, {"missing_pct": 0.0, "outliers_pct": 0.0, "duplicates_pct": 0.0, "imbalance_ratio": 0.0, "invalid_pct": 0.0}
    
    total_cells = df.size
    
    # 1. Missing values
    missing_count = int(df.isnull().sum().sum())
    missing_pct = (missing_count / total_cells) * 100 if total_cells > 0 else 0.0
    
    # 2. Outliers (using IQR for numeric columns)
    num_df = df.select_dtypes(include=[np.number])
    outliers_count = 0
    total_num_cells = num_df.size
    for col in num_df.columns:
        s = num_df[col].dropna()
        if len(s) > 0:
            q1 = s.quantile(0.25)
            q3 = s.quantile(0.75)
            iqr = q3 - q1
            lower = q1 - 1.5 * iqr
            upper = q3 + 1.5 * iqr
            outliers_count += int(((s < lower) | (s > upper)).sum())
    outliers_pct = (outliers_count / total_num_cells) * 100 if total_num_cells > 0 else 0.0
    
    # 3. Duplicate rows
    duplicate_count = int(df.duplicated().sum())
    duplicates_pct = (duplicate_count / len(df)) * 100 if len(df) > 0 else 0.0
    
    # 4. Class imbalance (average ratio of max class to min class count relative to length)
    imbalance_ratio = 0.0
    cat_df = df.select_dtypes(include=['object', 'category'])
    if not cat_df.empty:
        ratios = []
        for col in cat_df.columns:
            counts = cat_df[col].value_counts()
            if len(counts) > 1:
                ratios.append(float((counts.max() - counts.min()) / len(df)))
        if ratios:
            imbalance_ratio = float(np.mean(ratios)) * 100

    # 5. Invalid values (Inf / -Inf)
    invalid_count = 0
    if not num_df.empty:
        invalid_count = int(np.isinf(num_df).sum().sum())
    invalid_pct = (invalid_count / total_num_cells) * 100 if total_num_cells > 0 else 0.0
    
    # Deductions
    deductions = (missing_pct * 1.5) + (outliers_pct * 1.0) + (duplicates_pct * 2.0) + (imbalance_ratio * 0.1) + (invalid_pct * 3.0)
    health_score = max(30, min(100, int(100 - deductions)))
    
    details = {
        "missing_pct": float(round(missing_pct, 2)),
        "outliers_pct": float(round(outliers_pct, 2)),
        "duplicates_pct": float(round(duplicates_pct, 2)),
        "imbalance_ratio": float(round(imbalance_ratio, 2)),
        "invalid_pct": float(round(invalid_pct, 2))
    }
    return health_score, details

def analyze_dataframe(df: pd.DataFrame) -> Tuple[Dict[str, Any], Optional[Dict[str, Any]], Optional[Dict[str, Any]], Dict[str, Any], int, Dict[str, float]]:
    """
    Computes descriptive statistics, correlation matrix, categorical summaries,
    distributions, and dataset health score for a given DataFrame.
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
    cat_df = df.select_dtypes(include=['object', 'category'])
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

    # Calculate Dataset Health Score
    health_score, health_details = calculate_dataset_health(df)

    return desc_stats, corr_matrix, cat_summaries, distributions, health_score, health_details
