import uuid
from typing import Dict, Any, List, Optional
from backend.domain.contracts import EvidenceItem, EvidenceResponse, DataUnderstandingResponse


def extract_evidence(
    dataset_id: str,
    analysis_id: str,
    understanding: Optional[Dict[str, Any]] = None,
    analytics_data: Optional[Dict[str, Any]] = None,
    anomaly_result: Optional[Dict[str, Any]] = None,
    ml_result: Optional[Dict[str, Any]] = None
) -> List[EvidenceItem]:
    """
    Deterministically extracts structured, immutable Evidence items from statistical analytics,
    outlier detection, data understanding, and machine learning prediction outputs.
    All evidence items represent observed analytical facts with explicit source traceability.
    """
    evidence_items: List[EvidenceItem] = []

    # 1. Evidence from Data Understanding & Quality
    if understanding:
        quality_score = understanding.get("quality_score", 100)
        dup_count = understanding.get("duplicate_rows_count", 0)
        col_profiles = understanding.get("column_profiles", [])

        if dup_count > 0:
            evidence_items.append(EvidenceItem(
                evidence_id=f"ev-qual-dup-{uuid.uuid4().hex[:6]}",
                analysis_id=analysis_id,
                dataset_id=dataset_id,
                category="quality",
                title="Duplicate Records Detected",
                description=f"Found {dup_count} duplicate row(s) in dataset.",
                metric_name="duplicate_rows_count",
                metric_value=dup_count,
                strength="High" if dup_count > 10 else "Medium",
                related_columns=[],
                source="Data Understanding Profiler",
                technical_details={"quality_score": quality_score}
            ))

        for prof in col_profiles:
            miss_pct = prof.get("missing_percentage", 0.0)
            col_name = prof.get("name", "")
            if miss_pct > 15.0:
                evidence_items.append(EvidenceItem(
                    evidence_id=f"ev-qual-miss-{uuid.uuid4().hex[:6]}",
                    analysis_id=analysis_id,
                    dataset_id=dataset_id,
                    category="quality",
                    title=f"Significant Missing Values in '{col_name}'",
                    description=f"Column '{col_name}' is missing {miss_pct}% of its data points ({prof.get('missing_count')} rows).",
                    metric_name="missing_percentage",
                    metric_value=miss_pct,
                    strength="High" if miss_pct >= 30.0 else "Medium",
                    related_columns=[col_name],
                    source="Data Understanding Profiler",
                    technical_details={"missing_count": prof.get("missing_count")}
                ))

            skew = prof.get("skewness")
            if skew is not None and abs(skew) >= 1.5:
                direction = "right-skewed (positive)" if skew > 0 else "left-skewed (negative)"
                evidence_items.append(EvidenceItem(
                    evidence_id=f"ev-dist-skew-{uuid.uuid4().hex[:6]}",
                    analysis_id=analysis_id,
                    dataset_id=dataset_id,
                    category="distribution",
                    title=f"Asymmetric Distribution in '{col_name}'",
                    description=f"Column '{col_name}' displays high {direction} skewness (skew = {skew}).",
                    metric_name="skewness",
                    metric_value=skew,
                    strength="High" if abs(skew) >= 2.5 else "Medium",
                    related_columns=[col_name],
                    source="Distribution Analyzer",
                    technical_details={"skewness": skew}
                ))

    # 2. Evidence from Correlation Matrix
    if analytics_data and "correlation_matrix" in analytics_data:
        corr_matrix = analytics_data["correlation_matrix"]
        if isinstance(corr_matrix, dict):
            cols = list(corr_matrix.keys())
            seen_pairs = set()
            for i, col1 in enumerate(cols):
                for j, col2 in enumerate(cols):
                    if i >= j or col1 == col2:
                        continue
                    val = corr_matrix.get(col1, {}).get(col2)
                    if val is not None and isinstance(val, (int, float)):
                        abs_r = abs(val)
                        if abs_r >= 0.40:
                            pair_key = tuple(sorted([col1, col2]))
                            if pair_key in seen_pairs:
                                continue
                            seen_pairs.add(pair_key)

                            rel_type = "positive" if val > 0 else "inverse"
                            strength_label = "High" if abs_r >= 0.65 else "Medium"
                            evidence_items.append(EvidenceItem(
                                evidence_id=f"ev-corr-{uuid.uuid4().hex[:6]}",
                                analysis_id=analysis_id,
                                dataset_id=dataset_id,
                                category="correlation",
                                title=f"Linear Relationship: {col1} & {col2}",
                                description=f"Moderate-to-strong {rel_type} linear association (r = {round(val, 3)}) between '{col1}' and '{col2}'.",
                                metric_name="pearson_correlation",
                                metric_value=round(val, 3),
                                strength=strength_label,
                                related_columns=[col1, col2],
                                source="Correlation Engine",
                                technical_details={"r": round(val, 3)}
                            ))

    # 3. Evidence from Anomaly Detection
    if anomaly_result and anomaly_result.get("status") == "success":
        detected = anomaly_result.get("anomalies_detected", 0)
        pct = anomaly_result.get("anomaly_percentage", 0.0)
        if detected > 0:
            evidence_items.append(EvidenceItem(
                evidence_id=f"ev-anom-{uuid.uuid4().hex[:6]}",
                analysis_id=analysis_id,
                dataset_id=dataset_id,
                category="anomaly",
                title=f"Statistical Outliers Identified ({detected} records)",
                description=f"Multivariate outlier scan identified {detected} unusual records ({pct}% of total observations).",
                metric_name="anomaly_count",
                metric_value=detected,
                strength="High" if pct >= 3.0 else "Medium",
                related_columns=[],
                source="Anomaly Detection Engine",
                technical_details={"percentage": pct}
            ))

    # 4. Evidence from Prediction Drivers
    if ml_result and ml_result.get("status") == "success":
        drivers = ml_result.get("drivers", [])
        for drv in drivers[:3]:
            feat = drv.get("feature", "")
            imp = drv.get("importance", 0.0)
            infl = drv.get("influence", "Moderate influence")
            direction = drv.get("direction")

            dir_text = f" with {direction} orientation" if direction else ""
            evidence_items.append(EvidenceItem(
                evidence_id=f"ev-drv-{uuid.uuid4().hex[:6]}",
                analysis_id=analysis_id,
                dataset_id=dataset_id,
                category="driver",
                title=f"Model Key Factor: {feat}",
                description=f"Feature '{feat}' exhibited {infl.lower()}{dir_text} in candidate model validation.",
                metric_name="feature_importance",
                metric_value=imp,
                strength="High" if "High" in infl else "Medium",
                related_columns=[feat],
                source="Prediction Engine V1.1",
                technical_details={"influence": infl, "direction": direction}
            ))

    return evidence_items
