import pandas as pd
import numpy as np
from typing import Tuple, Dict, Any

def analyze_dataframe(df: pd.DataFrame) -> Tuple[Dict[str, Any], Dict[str, Any], Dict[str, Any], Dict[str, Any]]:
    """
    Computes descriptive statistics, correlation matrix, and categorical summaries for a given DataFrame.
    """
    # Descriptive Statistics
    desc_stats = df.describe().to_dict()
    
    # Replace NaN/Infinity with None for JSON serialization
    for col in desc_stats:
        for stat in desc_stats[col]:
            val = desc_stats[col][stat]
            if pd.isna(val) or np.isinf(val):
                desc_stats[col][stat] = None

    # Correlation Matrix (only for numeric columns)
    num_df = df.select_dtypes(include=[np.number])
    corr_matrix = None
    if not num_df.empty:
        corr_df = num_df.corr().replace({np.nan: None})
        corr_matrix = corr_df.to_dict()
        
    # Categorical Summaries
    cat_df = df.select_dtypes(include=['object', 'category'])
    cat_summaries = None
    if not cat_df.empty:
        cat_summaries = {}
        for col in cat_df.columns:
            val_counts = cat_df[col].value_counts().head(10).to_dict()
            cat_summaries[col] = {
                "unique_count": int(cat_df[col].nunique()),
                "top_values": val_counts
            }
            
    distributions = {}
    try:
        numeric_cols = df.select_dtypes(include=['number']).columns
        for col in numeric_cols:
            s = df[col].dropna()
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
