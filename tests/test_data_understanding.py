import pandas as pd
import numpy as np
import pytest
from backend.analytics.understanding import profile_dataset


def test_data_understanding_profiling():
    df = pd.DataFrame({
        "customer_id": [f"CUST_{i}" for i in range(50)],
        "age": [20, 25, 30, 35, np.nan] * 10,
        "churn": ["Yes", "No"] * 25,
        "signup_date": pd.date_range("2026-01-01", periods=50, freq="D"),
        "constant_col": [1] * 50
    })

    profile = profile_dataset(df, dataset_id="ds-test-123")

    assert profile.status == "success"
    assert profile.dataset_id == "ds-test-123"
    assert profile.row_count == 50
    assert profile.column_count == 5
    assert len(profile.column_profiles) == 5

    # Check temporal column identification
    assert "signup_date" in profile.temporal_columns

    # Check candidate target identification
    assert "churn" in profile.candidate_targets

    # Check column types
    col_map = {p.name: p for p in profile.column_profiles}
    assert col_map["age"].inferred_type == "numeric"
    assert col_map["age"].missing_count == 10
    assert col_map["age"].missing_percentage == 20.0
    assert col_map["churn"].inferred_type == "categorical"
    assert col_map["signup_date"].is_temporal is True
    assert col_map["constant_col"].cardinality == "constant"

    # Check quality score calculation
    assert 10 <= profile.quality_score <= 100
    assert "completeness_score" in profile.quality_details
    assert len(profile.limitations) > 0


def test_data_understanding_empty_and_duplicate():
    df = pd.DataFrame({
        "val": [10, 20, 10, 20],
        "cat": ["A", "B", "A", "B"]
    })
    profile = profile_dataset(df, dataset_id="ds-dup")
    assert profile.duplicate_rows_count == 2
    assert any("duplicate rows" in lim for lim in profile.limitations)
