import pandas as pd
import numpy as np
import pytest
from backend.ml.models import train_and_evaluate
from backend.ml.schemas import MLPredictionResponse


def test_scenario_1_clean_numerical_regression():
    np.random.seed(42)
    df = pd.DataFrame({
        "revenue": np.random.randn(80) * 10 + 100,
        "feature_a": np.random.randn(80),
        "feature_b": np.random.randn(80) * 2
    })
    (
        model_type, metrics, feature_importance, reliability_score, reliability_details,
        prediction_obj, reliability_str, reliability_desc, drivers_list, warnings_list, technical_obj
    ) = train_and_evaluate(df, target_col="revenue")

    assert "Regression" in model_type
    assert "rmse" in metrics
    assert "mae" in metrics
    assert "Revenue is expected to" in prediction_obj["summary"]
    assert "value" in prediction_obj
    assert reliability_str in ["High", "Medium", "Low"]
    assert len(reliability_desc) > 10


def test_scenario_2_mixed_numerical_categorical_regression():
    np.random.seed(42)
    df = pd.DataFrame({
        "sales": np.random.randn(60) * 50 + 500,
        "num_1": np.random.randn(60),
        "cat_1": np.random.choice(["Tier1", "Tier2", "Tier3"], size=60),
        "cat_2": np.random.choice(["US", "EU", "APAC"], size=60)
    })
    (
        model_type, metrics, feature_importance, reliability_score, reliability_details,
        prediction_obj, reliability_str, reliability_desc, drivers_list, warnings_list, technical_obj
    ) = train_and_evaluate(df, target_col="sales")

    assert "Regression" in model_type
    assert technical_obj["preprocessing"]["numeric_features"] == ["num_1"]
    assert "cat_1" in technical_obj["preprocessing"]["categorical_features"]
    assert technical_obj["training"]["train_samples"] == 48
    assert technical_obj["training"]["val_samples"] == 12


def test_scenario_3_binary_classification():
    np.random.seed(42)
    df = pd.DataFrame({
        "churn": np.random.choice(["Yes", "No"], size=70, p=[0.4, 0.6]),
        "usage_hours": np.random.randn(70),
        "account_type": np.random.choice(["Basic", "Premium"], size=70)
    })
    (
        model_type, metrics, feature_importance, reliability_score, reliability_details,
        prediction_obj, reliability_str, reliability_desc, drivers_list, warnings_list, technical_obj
    ) = train_and_evaluate(df, target_col="churn")

    assert "Classification" in model_type
    assert "f1_score" in metrics
    assert "accuracy" in metrics
    assert "Churn is expected to be" in prediction_obj["summary"]
    assert prediction_obj["value"] in ["Yes", "No"]


def test_scenario_4_imbalanced_classification_stratification():
    np.random.seed(42)
    # Imbalanced 90% / 10%
    df = pd.DataFrame({
        "fraud": np.random.choice([0, 1], size=100, p=[0.9, 0.1]),
        "amount": np.random.randn(100) * 100 + 50,
        "country": np.random.choice(["A", "B", "C"], size=100)
    })
    (
        model_type, metrics, feature_importance, reliability_score, reliability_details,
        prediction_obj, reliability_str, reliability_desc, drivers_list, warnings_list, technical_obj
    ) = train_and_evaluate(df, target_col="fraud")

    assert "Classification" in model_type
    assert technical_obj["training"]["total_samples"] == 100
    assert technical_obj["training"]["train_samples"] == 80
    assert technical_obj["training"]["val_samples"] == 20


def test_scenario_5_missing_value_handling():
    df = pd.DataFrame({
        "target": [10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
        "num_with_null": [1.0, np.nan, 3.0, np.nan, 5.0, 6.0, np.nan, 8.0, 9.0, 10.0],
        "cat_with_null": ["A", "B", None, "A", "B", None, "A", "B", "A", "B"]
    })
    (
        model_type, metrics, feature_importance, reliability_score, reliability_details,
        prediction_obj, reliability_str, reliability_desc, drivers_list, warnings_list, technical_obj
    ) = train_and_evaluate(df, target_col="target")

    assert "Regression" in model_type
    assert technical_obj["model"] in ["RidgeRegression", "RandomForestRegressor", "GradientBoostingRegressor"]


def test_scenario_6_small_dataset_reliability_and_warnings():
    df = pd.DataFrame({
        "target": [10.0, 15.0, 20.0, 25.0, 30.0, 35.0, 40.0],
        "x": [1, 2, 3, 4, 5, 6, 7]
    })
    (
        model_type, metrics, feature_importance, reliability_score, reliability_details,
        prediction_obj, reliability_str, reliability_desc, drivers_list, warnings_list, technical_obj
    ) = train_and_evaluate(df, target_col="target")

    assert reliability_str == "Low"
    assert any("Small dataset" in w for w in warnings_list)
    assert "limited validation confidence" in reliability_desc


def test_scenario_7_temporal_dataset_preserves_order():
    df = pd.DataFrame({
        "timestamp": pd.date_range("2026-01-01", periods=50, freq="D"),
        "sales": np.random.randn(50) * 10 + 100,
        "ad_spend": np.random.randn(50) * 2 + 10
    })
    (
        model_type, metrics, feature_importance, reliability_score, reliability_details,
        prediction_obj, reliability_str, reliability_desc, drivers_list, warnings_list, technical_obj
    ) = train_and_evaluate(df, target_col="sales")

    assert any("Temporal structure detected" in w for w in warnings_list)


def test_scenario_8_invalid_and_degenerate_target_failures():
    # Missing target column
    df1 = pd.DataFrame({"a": [1, 2, 3, 4, 5]})
    with pytest.raises(ValueError, match="Target column 'missing' not found"):
        train_and_evaluate(df1, target_col="missing")

    # Single unique value (constant target)
    df2 = pd.DataFrame({"target": [5, 5, 5, 5, 5, 5], "x": [1, 2, 3, 4, 5, 6]})
    with pytest.raises(ValueError, match="single unique value"):
        train_and_evaluate(df2, target_col="target")

    # Insufficient non-null target rows (< 5)
    df3 = pd.DataFrame({"target": [1, 2, 3, np.nan, np.nan], "x": [1, 2, 3, 4, 5]})
    with pytest.raises(ValueError, match="At least 5 rows"):
        train_and_evaluate(df3, target_col="target")


def test_scenario_9_feature_only_subsets():
    # Numeric features only
    df_num = pd.DataFrame({"target": [10, 20, 30, 40, 50, 60], "n1": [1, 2, 3, 4, 5, 6]})
    m1, met1, _, _, _, _, _, _, _, _, tech1 = train_and_evaluate(df_num, target_col="target")
    assert tech1["preprocessing"]["numeric_features"] == ["n1"]
    assert tech1["preprocessing"]["categorical_features"] == []

    # Categorical features only
    df_cat = pd.DataFrame({"target": [10, 20, 30, 40, 50, 60], "c1": ["A", "B", "A", "B", "A", "B"]})
    m2, met2, _, _, _, _, _, _, _, _, tech2 = train_and_evaluate(df_cat, target_col="target")
    assert tech2["preprocessing"]["numeric_features"] == []
    assert tech2["preprocessing"]["categorical_features"] == ["c1"]


def test_scenario_10_validation_diversity_warning():
    # Extremely small classification validation split resulting in 1 class
    df = pd.DataFrame({
        "target": ["A", "A", "A", "A", "A", "B"],
        "x": [1, 2, 3, 4, 5, 6]
    })
    m, met, fi, rel_score, rel_det, pred, rel, rel_desc, drivers, warnings, tech = train_and_evaluate(df, target_col="target")
    assert any("limited class diversity" in w.lower() for w in warnings)


def test_scenario_11_driver_terminology_and_direction():
    np.random.seed(42)
    df = pd.DataFrame({
        "target": np.random.randn(60) * 10 + 50,
        "feature_high": np.random.randn(60) * 10,
        "feature_low": np.random.randn(60)
    })
    m, met, fi, rel_score, rel_det, pred, rel, rel_desc, drivers, warnings, tech = train_and_evaluate(df, target_col="target")
    
    assert isinstance(drivers, list)
    if len(drivers) > 0:
        d0 = drivers[0]
        assert "feature" in d0
        assert d0["influence"] in ["High influence", "Moderate influence", "Low influence"]
        # Direction can be 'positive', 'negative', or None (not fabricated for trees)
        assert d0.get("direction") in ["positive", "negative", None]


def test_scenario_12_schema_response_structure_compatibility():
    resp = MLPredictionResponse(
        status="success",
        message="Evaluated",
        model_type="Regression (RidgeRegression)",
        metrics={"rmse": 2.5},
        prediction={"value": 100.0, "summary": "Target is expected to increase."},
        reliability="High",
        reliability_description="Based on strong validation results and sufficient data.",
        drivers=[{"feature": "Feature A", "influence": "High influence", "importance": 0.85}],
        warnings=[],
        technical={"model": "RidgeRegression"}
    )
    dumped = resp.model_dump()
    assert dumped["reliability_description"] == "Based on strong validation results and sufficient data."
    assert dumped["prediction"]["summary"] == "Target is expected to increase."
    assert dumped["drivers"][0]["influence"] == "High influence"
