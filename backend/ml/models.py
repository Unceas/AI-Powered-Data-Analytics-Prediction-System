import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor, IsolationForest
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score, mean_squared_error, r2_score
from typing import Tuple, Dict

def train_and_evaluate(df: pd.DataFrame, target_col: str, test_size: float = 0.2, random_state: int = 42) -> Tuple[str, Dict[str, float], Dict[str, float]]:
    """
    Auto-detects regression vs classification based on the target column, 
    trains a Random Forest model, and returns metrics and feature importances.
    """
    if target_col not in df.columns:
        raise ValueError(f"Target column '{target_col}' not found in DataFrame.")

    # Drop rows where target is missing
    df = df.dropna(subset=[target_col])
    if len(df) < 3:
        raise ValueError("At least 3 rows with a non-empty target are required for training.")
    
    # Auto-detect task type (if it's an object/category or has few unique values -> classification)
    is_classification = False
    if df[target_col].dtype in ['object', 'category'] or df[target_col].nunique() < 15:
        is_classification = True

    X = df.drop(columns=[target_col])
    y = df[target_col]

    # For baseline, we only use numeric columns (assumes categorical was encoded in processing step)
    X = X.select_dtypes(include=['number']).replace([float("inf"), float("-inf")], pd.NA)
    
    if X.empty:
        raise ValueError("No numeric features available for training. Please run the data processing step to encode categoricals.")

    # Fill any remaining NaNs in features with median just so RandomForest doesn't crash
    X = X.fillna(X.median()).fillna(0)

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=test_size, random_state=random_state)

    metrics = {}
    feature_importance = {}

    if is_classification:
        model = RandomForestClassifier(random_state=random_state, oob_score=True)
        model.fit(X_train, y_train)
        preds = model.predict(X_test)
        
        metrics['accuracy'] = float(accuracy_score(y_test, preds))
        metrics['precision'] = float(precision_score(y_test, preds, average='weighted', zero_division=0))
        metrics['recall'] = float(recall_score(y_test, preds, average='weighted', zero_division=0))
        metrics['f1_score'] = float(f1_score(y_test, preds, average='weighted', zero_division=0))
        metrics['oob_score'] = float(model.oob_score_)
        model_type = "Classification (RandomForestClassifier)"
    else:
        model = RandomForestRegressor(random_state=random_state, oob_score=True)
        model.fit(X_train, y_train)
        preds = model.predict(X_test)
        
        metrics['mse'] = float(mean_squared_error(y_test, preds))
        metrics['r2_score'] = float(r2_score(y_test, preds))
        metrics['oob_score'] = float(model.oob_score_)
        model_type = "Regression (RandomForestRegressor)"

    if hasattr(model, "feature_importances_"):
        importance = model.feature_importances_
        feature_importance = dict(zip(X.columns, map(float, importance)))
        # Sort by importance and get top 10
        feature_importance = {k: v for k, v in sorted(feature_importance.items(), key=lambda item: item[1], reverse=True)[:10]}

    return model_type, metrics, feature_importance

def detect_anomalies(df: pd.DataFrame, contamination: float = 0.05, random_state: int = 42) -> Tuple[int, int, float, list]:
    """
    Uses Isolation Forest to detect anomalies in an unsupervised manner.
    """
    # Use only numeric columns for anomaly detection
    if contamination <= 0 or contamination >= 0.5:
        raise ValueError("Contamination must be greater than 0 and less than 0.5.")

    num_df = df.select_dtypes(include=['number']).copy().replace([float("inf"), float("-inf")], pd.NA)
    
    if num_df.empty:
        raise ValueError("No numeric features available for anomaly detection.")
        
    num_df = num_df.fillna(num_df.median()).fillna(0)
    
    model = IsolationForest(contamination=contamination, random_state=random_state)
    preds = model.fit_predict(num_df)
    
    # Isolation forest returns -1 for anomalies, 1 for normal
    is_anomaly = preds == -1
    
    total_records = len(df)
    anomalies_detected = int(is_anomaly.sum())
    anomaly_percentage = round((anomalies_detected / total_records) * 100, 2) if total_records > 0 else 0.0
    
    # Get preview of anomalous records from original dataframe
    anomalies_preview = df[is_anomaly].head(10).replace({float('nan'): None}).to_dict(orient="records")
    
    return total_records, anomalies_detected, anomaly_percentage, anomalies_preview
