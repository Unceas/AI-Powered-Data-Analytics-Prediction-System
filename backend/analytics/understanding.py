import pandas as pd
import numpy as np
from typing import Dict, Any, List, Tuple
from backend.domain.contracts import ColumnProfile, DataUnderstandingResponse


def profile_dataset(df: pd.DataFrame, dataset_id: str = "") -> DataUnderstandingResponse:
    """
    Deterministically computes a comprehensive Data Understanding profile for a pandas DataFrame.
    Identifies column data types, missingness, cardinality, temporal columns, candidate targets,
    data quality scores, and analytical limitations.
    """
    row_count = int(len(df))
    column_count = int(len(df.columns))
    duplicate_rows_count = int(df.duplicated().sum()) if row_count > 0 else 0

    column_profiles: List[ColumnProfile] = []
    temporal_columns: List[str] = []
    candidate_targets: List[str] = []
    limitations: List[str] = []

    # 1. Profile Each Column
    total_missing_cells = 0
    constant_columns_count = 0

    for col in df.columns:
        series = df[col]
        missing_count = int(series.isnull().sum())
        total_missing_cells += missing_count
        missing_percentage = round((missing_count / row_count) * 100, 2) if row_count > 0 else 0.0

        non_null_series = series.dropna()
        unique_count = int(non_null_series.nunique())

        # Cardinality categorization
        if unique_count == 0 or (unique_count == 1 and missing_count == 0):
            cardinality = "constant"
            constant_columns_count += 1
            limitations.append(f"Column '{col}' has constant/zero variance and provides no analytical value.")
        elif unique_count == 2:
            cardinality = "binary"
        elif unique_count < 10:
            cardinality = "low"
        elif unique_count < 50:
            cardinality = "moderate"
        elif unique_count == len(non_null_series) and len(non_null_series) > 10:
            cardinality = "unique"
            if 'id' in col.lower() or 'key' in col.lower() or 'uuid' in col.lower():
                limitations.append(f"Column '{col}' appears to be a unique identifier / key.")
        else:
            cardinality = "high"

        # Type inference
        is_temporal = False
        if pd.api.types.is_datetime64_any_dtype(series) or 'date' in col.lower() or 'time' in col.lower() or 'timestamp' in col.lower():
            inferred_type = "temporal"
            is_temporal = True
            temporal_columns.append(col)
        elif pd.api.types.is_bool_dtype(series):
            inferred_type = "boolean"
        elif pd.api.types.is_numeric_dtype(series):
            inferred_type = "numeric"
        elif isinstance(series.dtype, pd.CategoricalDtype):
            inferred_type = "categorical"
        else:
            # Check string / object
            if unique_count > 0 and unique_count / max(1, len(non_null_series)) > 0.8 and unique_count > 30:
                inferred_type = "text"
            else:
                inferred_type = "categorical"

        # Sample values (convert numpy types to python natives)
        sample_vals = []
        for val in non_null_series.head(5):
            if pd.isna(val):
                continue
            if isinstance(val, (np.integer, int)):
                sample_vals.append(int(val))
            elif isinstance(val, (np.floating, float)):
                sample_vals.append(round(float(val), 4))
            else:
                sample_vals.append(str(val))

        # Skewness for numeric
        skew_val = None
        if inferred_type == "numeric" and len(non_null_series) > 5 and unique_count > 1:
            try:
                calc_skew = float(non_null_series.skew())
                if not np.isnan(calc_skew) and not np.isinf(calc_skew):
                    skew_val = round(calc_skew, 3)
            except Exception:
                pass

        # Target candidate determination
        is_target_candidate = False
        if unique_count >= 2 and cardinality != "unique" and missing_percentage < 40.0:
            if inferred_type in ["numeric", "categorical", "boolean"]:
                is_target_candidate = True
                candidate_targets.append(col)

        if missing_percentage > 30.0:
            limitations.append(f"Column '{col}' has {missing_percentage}% missing values.")

        column_profiles.append(ColumnProfile(
            name=col,
            inferred_type=inferred_type,
            missing_count=missing_count,
            missing_percentage=missing_percentage,
            unique_count=unique_count,
            cardinality=cardinality,
            sample_values=sample_vals,
            skewness=skew_val,
            is_candidate_target=is_target_candidate,
            is_temporal=is_temporal
        ))

    # 2. Quality Score Calculation (0 - 100)
    total_cells = max(1, row_count * column_count)
    missing_ratio = total_missing_cells / total_cells
    duplicate_ratio = duplicate_rows_count / max(1, row_count)

    score = 100.0
    # Penalty for missingness
    score -= min(35.0, missing_ratio * 100.0)
    # Penalty for duplicates
    score -= min(25.0, duplicate_ratio * 100.0)
    # Penalty for constant columns
    score -= min(20.0, (constant_columns_count / max(1, column_count)) * 50.0)
    # Penalty for extremely small datasets
    if row_count < 30:
        score -= 15.0
        limitations.append(f"Small dataset ({row_count} rows) restricts statistical confidence.")

    quality_score = max(10, min(100, int(round(score))))

    quality_details = {
        "completeness_score": round((1.0 - missing_ratio) * 100, 1),
        "uniqueness_score": round((1.0 - duplicate_ratio) * 100, 1),
        "useful_columns_ratio": round((column_count - constant_columns_count) / max(1, column_count) * 100, 1),
        "total_missing_cells": total_missing_cells,
        "duplicate_rows": duplicate_rows_count
    }

    if duplicate_rows_count > 0:
        limitations.append(f"Dataset contains {duplicate_rows_count} duplicate rows.")

    return DataUnderstandingResponse(
        status="success",
        message="Data understanding profile computed successfully",
        dataset_id=dataset_id,
        row_count=row_count,
        column_count=column_count,
        duplicate_rows_count=duplicate_rows_count,
        column_profiles=column_profiles,
        temporal_columns=temporal_columns,
        candidate_targets=candidate_targets,
        quality_score=quality_score,
        quality_details=quality_details,
        limitations=limitations
    )
