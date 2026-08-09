import pandas as pd
import numpy as np
from typing import Tuple, Dict, List, Any, Optional

from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.linear_model import Ridge, LogisticRegression
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor, GradientBoostingClassifier, GradientBoostingRegressor, IsolationForest
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score, mean_squared_error, mean_absolute_error, r2_score


def _clean_feature_name(name: str) -> str:
    """Cleans transformer prefixes like num__ or cat__ for human readability."""
    if name.startswith("num__"):
        return name[5:].replace("_", " ").title()
    if name.startswith("cat__"):
        parts = name[5:].split("_", 1)
        if len(parts) == 2:
            return f"{parts[0].replace('_', ' ').title()} ({parts[1]})"
        return parts[0].replace("_", " ").title()
    return name.replace("_", " ").title()


def _get_base_column(name: str) -> str:
    """Extracts original column name from transformed feature name."""
    if name.startswith("num__"):
        return name[5:]
    if name.startswith("cat__"):
        return name[5:].split("_", 1)[0]
    return name


def train_and_evaluate(
    df: pd.DataFrame, 
    target_col: str, 
    test_size: float = 0.2, 
    random_state: int = 42
) -> Tuple[str, Dict[str, float], Dict[str, float], int, Dict[str, float], Dict[str, Any], str, List[Dict[str, Any]], List[str], Dict[str, Any]]:
    """
    Evaluates candidate ML models using validation performance (scikit-learn Pipeline with ColumnTransformer).
    Returns backward-compatible outputs along with plain-language prediction, qualitative drivers, warnings, and technical objects.
    """
    warnings: List[str] = []

    # 1. Target and Data Validation
    if target_col not in df.columns:
        raise ValueError(f"Target column '{target_col}' not found in dataset.")

    clean_df = df.dropna(subset=[target_col]).copy()
    if len(clean_df) < 5:
        raise ValueError("At least 5 rows with a non-empty target are required for training and validation.")

    y = clean_df[target_col]
    if y.nunique() <= 1:
        raise ValueError(f"Target column '{target_col}' contains only a single unique value. Model training requires varying target values.")

    is_classification = False
    if y.dtype in ['object', 'category', 'bool'] or y.nunique() < 15:
        is_classification = True

    # 2. Feature Extraction and Preprocessing Setup
    X = clean_df.drop(columns=[target_col])
    if X.empty or len(X.columns) == 0:
        raise ValueError("No feature columns available for training after target column exclusion.")

    numeric_cols = X.select_dtypes(include=['number', 'float', 'int']).columns.tolist()
    categorical_cols = X.select_dtypes(include=['object', 'category', 'bool']).columns.tolist()

    if not numeric_cols and not categorical_cols:
        raise ValueError("No valid numeric or categorical features available for modeling.")

    transformers = []
    if numeric_cols:
        num_pipeline = Pipeline([
            ('imputer', SimpleImputer(strategy='median')),
            ('scaler', StandardScaler())
        ])
        transformers.append(('num', num_pipeline, numeric_cols))

    if categorical_cols:
        cat_pipeline = Pipeline([
            ('imputer', SimpleImputer(strategy='most_frequent')),
            ('encoder', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
        ])
        transformers.append(('cat', cat_pipeline, categorical_cols))

    preprocessor = ColumnTransformer(transformers=transformers, remainder='drop')

    # 3. Validation Strategy & Data Leakage Prevention
    has_temporal = any(
        pd.api.types.is_datetime64_any_dtype(clean_df[col]) or 'date' in col.lower() or 'time' in col.lower() 
        for col in clean_df.columns
    )

    if has_temporal:
        warnings.append("Temporal structure detected. Data split chronologically without random shuffling.")
        X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=test_size, shuffle=False)
    elif is_classification:
        val_counts = y.value_counts()
        if val_counts.min() >= 2:
            X_train, X_val, y_train, y_val = train_test_split(
                X, y, test_size=test_size, random_state=random_state, stratify=y
            )
        else:
            warnings.append("Class count too low for stratified split; used standard random split.")
            X_train, X_val, y_train, y_val = train_test_split(
                X, y, test_size=test_size, random_state=random_state
            )
    else:
        X_train, X_val, y_train, y_val = train_test_split(
            X, y, test_size=test_size, random_state=random_state
        )

    if len(X_val) < 2:
        warnings.append("Validation set contains fewer than 2 samples; metrics may be unstable.")

    # 4. Candidate Set Definition
    if is_classification:
        candidates = [
            ("LogisticRegression", LogisticRegression(max_iter=500, random_state=random_state)),
            ("RandomForestClassifier", RandomForestClassifier(n_estimators=50, random_state=random_state)),
            ("GradientBoostingClassifier", GradientBoostingClassifier(n_estimators=50, random_state=random_state))
        ]
    else:
        candidates = [
            ("RidgeRegression", Ridge(alpha=1.0, random_state=random_state)),
            ("RandomForestRegressor", RandomForestRegressor(n_estimators=50, random_state=random_state)),
            ("GradientBoostingRegressor", GradientBoostingRegressor(n_estimators=50, random_state=random_state))
        ]

    candidate_evaluations: List[Dict[str, Any]] = []
    best_pipeline: Optional[Pipeline] = None
    best_name: str = ""
    best_score: float = -float('inf') if is_classification else float('inf')
    best_metrics: Dict[str, float] = {}

    # 5. Candidate Evaluation Loop (strictly on X_val)
    for name, model in candidates:
        pipeline = Pipeline([
            ('preprocessor', preprocessor),
            ('model', model)
        ])
        try:
            pipeline.fit(X_train, y_train)
            preds = pipeline.predict(X_val)

            if is_classification:
                acc = float(accuracy_score(y_val, preds))
                prec = float(precision_score(y_val, preds, average='weighted', zero_division=0))
                rec = float(recall_score(y_val, preds, average='weighted', zero_division=0))
                f1 = float(f1_score(y_val, preds, average='weighted', zero_division=0))

                cand_metrics = {
                    "accuracy": round(acc, 4),
                    "precision": round(prec, 4),
                    "recall": round(rec, 4),
                    "f1_score": round(f1, 4)
                }
                candidate_evaluations.append({
                    "model": name,
                    "status": "success",
                    "metrics": cand_metrics,
                    "selection_score": round(f1, 4)
                })

                if f1 > best_score:
                    best_score = f1
                    best_name = name
                    best_pipeline = pipeline
                    best_metrics = cand_metrics
            else:
                mse = float(mean_squared_error(y_val, preds))
                rmse = float(np.sqrt(mse))
                mae = float(mean_absolute_error(y_val, preds))
                r2 = float(r2_score(y_val, preds)) if len(y_val) > 1 else 0.0

                cand_metrics = {
                    "mse": round(mse, 4),
                    "rmse": round(rmse, 4),
                    "mae": round(mae, 4),
                    "r2_score": round(r2, 4)
                }
                candidate_evaluations.append({
                    "model": name,
                    "status": "success",
                    "metrics": cand_metrics,
                    "selection_score": round(rmse, 4)
                })

                if rmse < best_score:
                    best_score = rmse
                    best_name = name
                    best_pipeline = pipeline
                    best_metrics = cand_metrics

        except Exception as exc:
            candidate_evaluations.append({
                "model": name,
                "status": "skipped",
                "reason": str(exc)
            })

    if best_pipeline is None:
        raise ValueError("All candidate models failed during fitting. Please verify dataset feature quality.")

    # 6. Classification Diversity Guard Check
    if is_classification and y_val.nunique() < 2:
        warnings.append("Validation set contains only a single target class. F1/Accuracy scores may not reflect generalization.")

    # 7. Extract Feature Importances & Drivers with Transformed Feature Recovery
    fitted_preprocessor = best_pipeline.named_steps['preprocessor']
    fitted_model = best_pipeline.named_steps['model']

    feature_importance: Dict[str, float] = {}
    drivers: List[Dict[str, Any]] = []

    try:
        transformed_feature_names = fitted_preprocessor.get_feature_names_out()
        raw_importances = None

        if hasattr(fitted_model, "feature_importances_"):
            raw_importances = fitted_model.feature_importances_
        elif hasattr(fitted_model, "coef_"):
            coef = fitted_model.coef_
            if coef.ndim > 1:
                raw_importances = np.mean(np.abs(coef), axis=0)
            else:
                raw_importances = np.abs(coef)

        if raw_importances is not None and len(raw_importances) == len(transformed_feature_names):
            total_imp = np.sum(raw_importances)
            norm_importances = raw_importances / total_imp if total_imp > 0 else raw_importances

            base_col_importances: Dict[str, float] = {}
            detailed_feature_importances: Dict[str, float] = {}

            for feat_name, imp_val in zip(transformed_feature_names, norm_importances):
                clean_name = _clean_feature_name(feat_name)
                base_col = _get_base_column(feat_name)

                detailed_feature_importances[clean_name] = float(imp_val)
                base_col_importances[base_col] = base_col_importances.get(base_col, 0.0) + float(imp_val)

            sorted_drivers = sorted(base_col_importances.items(), key=lambda x: x[1], reverse=True)[:5]
            
            for idx, (col_name, imp) in enumerate(sorted_drivers):
                # Qualitative influence level instead of causal percentage
                if idx == 0 or imp >= 0.35:
                    influence_label = "High influence"
                elif imp >= 0.15:
                    influence_label = "Moderate influence"
                else:
                    influence_label = "Low influence"

                formatted_col = col_name.replace("_", " ").title()
                drivers.append({
                    "feature": formatted_col,
                    "influence": influence_label,
                    "importance": round(imp, 4)
                })

            feature_importance = {
                k: round(v, 4) for k, v in sorted(detailed_feature_importances.items(), key=lambda x: x[1], reverse=True)[:10]
            }

    except Exception:
        pass

    # 8. Deterministic, Rule-Based Reliability Assessment
    sample_size = len(clean_df)
    val_sample_size = len(X_val)
    num_warnings = len(warnings)

    if is_classification:
        val_f1 = best_metrics.get("f1_score", 0.0)
        has_good_score = val_f1 >= 0.70
        has_moderate_score = val_f1 >= 0.40
    else:
        val_r2 = best_metrics.get("r2_score", 0.0)
        has_good_score = val_r2 >= 0.50
        has_moderate_score = val_r2 >= 0.20

    if sample_size >= 100 and val_sample_size >= 20 and has_good_score and num_warnings == 0:
        reliability = "High"
        reliability_score = 90
    elif sample_size >= 30 and val_sample_size >= 6 and has_moderate_score and num_warnings <= 1:
        reliability = "Medium"
        reliability_score = 70
    else:
        reliability = "Low"
        reliability_score = 50

    if sample_size < 30:
        warnings.append(f"Small dataset ({sample_size} total records). Model reliability is limited.")

    reliability_details = {
        "sample_size": float(sample_size),
        "validation_samples": float(val_sample_size),
        "warning_count": float(num_warnings),
        "validation_primary_score": float(best_metrics.get("f1_score" if is_classification else "rmse", 0.0))
    }

    # 9. Format User Prediction Result (Plain Language Translation)
    val_preds = best_pipeline.predict(X_val)
    formatted_target = target_col.replace("_", " ").title()

    if is_classification:
        mode_val = y.mode()[0] if not y.mode().empty else "N/A"
        pred_value = str(val_preds[0]) if len(val_preds) > 0 else str(mode_val)
        prediction_obj = {
            "value": pred_value,
            "direction": "stable",
            "change": None,
            "summary": f"{formatted_target} is expected to be '{pred_value}'."
        }
        model_type_str = f"Classification ({best_name})"
    else:
        mean_pred = float(np.mean(val_preds)) if len(val_preds) > 0 else float(y.mean())
        mean_actual = float(y.mean())
        pct_change = round(((mean_pred - mean_actual) / mean_actual) * 100, 1) if mean_actual != 0 else 0.0
        
        if pct_change > 0:
            summary_text = f"{formatted_target} is expected to increase by {pct_change}%."
            direction_str = "increase"
        elif pct_change < 0:
            summary_text = f"{formatted_target} is expected to decrease by {abs(pct_change)}%."
            direction_str = "decrease"
        else:
            summary_text = f"{formatted_target} is expected to remain stable."
            direction_str = "stable"

        prediction_obj = {
            "value": round(mean_pred, 2),
            "direction": direction_str,
            "change": f"{pct_change}%" if pct_change != 0 else None,
            "summary": summary_text
        }
        model_type_str = f"Regression ({best_name})"

    # 10. Technical Diagnostic Details
    technical_obj = {
        "model": best_name,
        "metrics": best_metrics,
        "features": len(X.columns),
        "training": {
            "total_samples": sample_size,
            "train_samples": len(X_train),
            "val_samples": len(X_val),
            "test_size_fraction": test_size
        },
        "candidate_evaluations": candidate_evaluations,
        "preprocessing": {
            "numeric_features": numeric_cols,
            "categorical_features": categorical_cols,
            "scaling": "StandardScaler",
            "imputation": "Median/Mode",
            "encoding": "OneHotEncoder"
        }
    }

    return (
        model_type_str,
        best_metrics,
        feature_importance,
        reliability_score,
        reliability_details,
        prediction_obj,
        reliability,
        drivers,
        warnings,
        technical_obj
    )


def detect_anomalies(df: pd.DataFrame, contamination: float = 0.05, random_state: int = 42) -> Tuple[int, int, float, list]:
    """
    Uses Isolation Forest to detect anomalies in an unsupervised manner.
    """
    if contamination <= 0 or contamination >= 0.5:
        raise ValueError("Contamination must be greater than 0 and less than 0.5.")

    num_df = df.select_dtypes(include=['number']).copy().replace([float("inf"), float("-inf")], pd.NA)
    
    if num_df.empty:
        raise ValueError("No numeric features available for anomaly detection.")
        
    num_df = num_df.fillna(num_df.median()).fillna(0)
    
    model = IsolationForest(contamination=contamination, random_state=random_state)
    preds = model.fit_predict(num_df)
    
    is_anomaly = preds == -1
    total_records = len(df)
    anomalies_detected = int(is_anomaly.sum())
    anomaly_percentage = round((anomalies_detected / total_records) * 100, 2) if total_records > 0 else 0.0
    
    anomalies_preview = df[is_anomaly].head(10).replace({float('nan'): None}).to_dict(orient="records")
    
    return total_records, anomalies_detected, anomaly_percentage, anomalies_preview
