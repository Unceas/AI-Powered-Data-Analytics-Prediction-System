import pytest
from backend.analytics.evidence import extract_evidence
from backend.ai.insight_generator import generate_grounded_insights_from_evidence, answer_question_grounded_in_evidence
from backend.domain.contracts import EvidenceItem


def test_deterministic_evidence_extraction():
    understanding = {
        "quality_score": 85,
        "duplicate_rows_count": 5,
        "column_profiles": [
            {
                "name": "income",
                "missing_percentage": 25.0,
                "missing_count": 25,
                "skewness": 3.2
            }
        ]
    }
    analytics_data = {
        "correlation_matrix": {
            "income": {"income": 1.0, "credit_score": 0.72},
            "credit_score": {"income": 0.72, "credit_score": 1.0}
        }
    }
    anomaly_result = {
        "status": "success",
        "anomalies_detected": 8,
        "anomaly_percentage": 4.0
    }
    ml_result = {
        "status": "success",
        "drivers": [
            {"feature": "Income", "importance": 0.55, "influence": "High influence", "direction": "positive"}
        ]
    }

    evidence = extract_evidence(
        dataset_id="ds-001",
        analysis_id="an-001",
        understanding=understanding,
        analytics_data=analytics_data,
        anomaly_result=anomaly_result,
        ml_result=ml_result
    )

    assert len(evidence) >= 4
    cat_set = {e.category for e in evidence}
    assert "quality" in cat_set
    assert "correlation" in cat_set
    assert "anomaly" in cat_set
    assert "driver" in cat_set

    # Check immutability & metadata
    for ev in evidence:
        assert ev.dataset_id == "ds-001"
        assert ev.analysis_id == "an-001"
        assert ev.evidence_id.startswith("ev-")
        assert ev.strength in ["High", "Medium", "Low"]


def test_grounded_insights_generation():
    evidence_items = [
        EvidenceItem(
            evidence_id="ev-drv-1",
            analysis_id="an-1",
            dataset_id="ds-1",
            category="driver",
            title="Model Key Factor: MonthlyCharges",
            description="Feature 'MonthlyCharges' exhibited high influence.",
            metric_name="feature_importance",
            metric_value=0.65,
            strength="High",
            related_columns=["MonthlyCharges"],
            source="Prediction Engine V1.1"
        ),
        EvidenceItem(
            evidence_id="ev-corr-1",
            analysis_id="an-1",
            dataset_id="ds-1",
            category="correlation",
            title="Linear Relationship: tenure & TotalCharges",
            description="Positive association (r = 0.82).",
            metric_name="pearson_correlation",
            metric_value=0.82,
            strength="High",
            related_columns=["tenure", "TotalCharges"],
            source="Correlation Engine"
        )
    ]

    insights = generate_grounded_insights_from_evidence(
        evidence_items=evidence_items,
        dataset_name="Telco Churn",
        analysis_id="an-1",
        dataset_id="ds-1"
    )

    assert len(insights) >= 2
    assert insights[0].evidence_ids == ["ev-drv-1"]
    assert len(insights[0].why_it_matters) > 10
    assert len(insights[0].recommended_next_step) > 10


def test_ask_insightgrid_grounded_fallback():
    evidence_items = [
        EvidenceItem(
            evidence_id="ev-anom-1",
            analysis_id="an-1",
            dataset_id="ds-1",
            category="anomaly",
            title="Statistical Outliers Identified (12 records)",
            description="Multivariate scan flagged 12 outlier rows.",
            metric_name="anomaly_count",
            metric_value=12,
            strength="High",
            related_columns=["amount"],
            source="Anomaly Detection Engine"
        )
    ]

    response = answer_question_grounded_in_evidence(
        question="Are there any outliers in amount?",
        dataset_name="Transactions",
        evidence_items=evidence_items
    )

    assert response.status == "success"
    assert "ev-anom-1" in response.referenced_evidence_ids
    assert "12" in response.answer or "outlier" in response.answer.lower()
