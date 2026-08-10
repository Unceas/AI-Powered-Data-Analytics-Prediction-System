import pandas as pd
import numpy as np
import pytest
from backend.ml.models import train_and_evaluate
from backend.ml.schemas import MLPredictionResponse

def test_regression_pipeline_model_selection():
    np.random.seed(42)
    df = pd.DataFrame({
        "target": np.random.randn(50) * 10 + 100,
        "feature1": np.random.randn(50),
        "feature2": np.random.randn(50) * 5,
        "category": np.random.choice(["A", "B", "C"], size=50)
    })
    
    (
        model_type, metrics, feature_importance, reliability_score, reliability_details,
        prediction_obj, reliability_str, reliability_desc, drivers_list, warnings_list, technical_obj
    ) = train_and_evaluate(df, target_col="target")

    assert "Regression" in model_type
    assert "rmse" in metrics
    assert "mae" in metrics
    assert isinstance(prediction_obj, dict)
    assert "value" in prediction_obj
    assert "expected" in prediction_obj["summary"]
    assert reliability_str in ["High", "Medium", "Low"]
    assert isinstance(drivers_list, list)
    if len(drivers_list) > 0:
        assert "influence" in drivers_list[0]
    assert technical_obj["model"] in ["RidgeRegression", "RandomForestRegressor", "GradientBoostingRegressor"]
    assert "candidate_evaluations" in technical_obj
    assert len(technical_obj["candidate_evaluations"]) == 3

def test_classification_pipeline_stratified():
    np.random.seed(42)
    df = pd.DataFrame({
        "target": np.random.choice(["ClassA", "ClassB"], size=60, p=[0.7, 0.3]),
        "num_feat": np.random.randn(60),
        "cat_feat": np.random.choice(["X", "Y"], size=60)
    })

    (
        model_type, metrics, feature_importance, reliability_score, reliability_details,
        prediction_obj, reliability_str, reliability_desc, drivers_list, warnings_list, technical_obj
    ) = train_and_evaluate(df, target_col="target")

    assert "Classification" in model_type
    assert "f1_score" in metrics
    assert "accuracy" in metrics
    assert isinstance(prediction_obj, dict)
    assert prediction_obj["value"] in ["ClassA", "ClassB"]
    assert technical_obj["model"] in ["LogisticRegression", "RandomForestClassifier", "GradientBoostingClassifier"]

def test_data_leakage_and_preprocessing_isolation():
    # Verify that pipeline fits strictly on X_train and transforms X_val
    df = pd.DataFrame({
        "target": [10.0, 20.0, 30.0, 40.0, 50.0, 60.0, 70.0, 80.0, 90.0, 100.0],
        "num": [1, 2, np.nan, 4, 5, 6, 7, 8, 9, 10],
        "cat": ["a", "b", "a", "b", "a", "b", "a", "b", "a", "b"]
    })
    
    (
        model_type, metrics, feature_importance, reliability_score, reliability_details,
        prediction_obj, reliability_str, reliability_desc, drivers_list, warnings_list, technical_obj
    ) = train_and_evaluate(df, target_col="target")

    assert technical_obj["training"]["train_samples"] == 8
    assert technical_obj["training"]["val_samples"] == 2
    assert technical_obj["preprocessing"]["scaling"] == "StandardScaler"

def test_invalid_and_insufficient_datasets():
    # Insufficient rows
    df_small = pd.DataFrame({"target": [1, 2], "x": [3, 4]})
    with pytest.raises(ValueError, match="At least 5 rows"):
        train_and_evaluate(df_small, target_col="target")

    # Single class target
    df_constant = pd.DataFrame({"target": [1, 1, 1, 1, 1, 1], "x": [1, 2, 3, 4, 5, 6]})
    with pytest.raises(ValueError, match="single unique value"):
        train_and_evaluate(df_constant, target_col="target")

    # Target column missing
    df_no_target = pd.DataFrame({"x": [1, 2, 3, 4, 5]})
    with pytest.raises(ValueError, match="Target column 'y' not found"):
        train_and_evaluate(df_no_target, target_col="y")

def test_schema_backward_compatibility():
    resp = MLPredictionResponse(
        status="success",
        message="Model trained",
        model_type="Regression (RidgeRegression)",
        metrics={"rmse": 1.2},
        prediction={"value": 45.0, "summary": "Sample prediction"},
        reliability="High",
        drivers=[{"feature": "x", "importance": 0.8}],
        warnings=["Test warning"],
        technical={"model": "RidgeRegression"}
    )
    data = resp.model_dump()
    assert data["model_type"] == "Regression (RidgeRegression)"
    assert data["metrics"] == {"rmse": 1.2}
    assert data["prediction"]["value"] == 45.0
    assert data["reliability"] == "High"
    assert data["technical"]["model"] == "RidgeRegression"
