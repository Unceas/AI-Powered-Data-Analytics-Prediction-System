import pytest
from backend.analytics.evidence import extract_evidence
from backend.analytics.investigation import derive_investigation_context
from backend.analytics.decision_brief import build_decision_brief
from backend.ai.insight_generator import (
    generate_grounded_insights_from_evidence,
    rank_and_prioritize_insights,
    answer_question_grounded_in_evidence
)
from backend.domain.contracts import EvidenceItem, InsightItem, AnalyticalContext


def test_evidence_provenance_and_units():
    understanding = {
        "row_count": 1000,
        "quality_score": 92,
        "duplicate_rows_count": 4,
        "column_profiles": [
            {
                "name": "revenue",
                "inferred_type": "numeric",
                "missing_count": 200,
                "missing_percentage": 20.0,
                "unique_count": 800,
                "cardinality": "high",
                "skewness": 2.8,
                "is_candidate_target": True
            }
        ]
    }
    analytics_data = {
        "correlation_matrix": {
            "revenue": {"revenue": 1.0, "churn": -0.72},
            "churn": {"revenue": -0.72, "churn": 1.0}
        }
    }
    anomaly_result = {
        "status": "success",
        "anomalies_detected": 15,
        "anomaly_percentage": 1.5
    }
    ml_result = {
        "status": "success",
        "model_type": "RandomForestRegressor",
        "drivers": [
            {"feature": "revenue", "importance": 0.65, "influence": "High influence", "direction": "positive"}
        ]
    }

    evidence = extract_evidence(
        dataset_id="ds-prov-001",
        analysis_id="an-prov-001",
        understanding=understanding,
        analytics_data=analytics_data,
        anomaly_result=anomaly_result,
        ml_result=ml_result
    )

    assert len(evidence) >= 4
    for ev in evidence:
        assert ev.dataset_id == "ds-prov-001"
        assert ev.analysis_id == "an-prov-001"
        assert ev.provenance is not None
        assert "method" in ev.provenance
        assert "computed_at" in ev.provenance
        assert ev.unit is not None
        assert ev.strength in ["High", "Medium", "Low"]


def test_deterministic_insight_prioritization():
    insights = [
        InsightItem(
            insight_id="ins-1",
            analysis_id="an-1",
            dataset_id="ds-1",
            category="Trend",
            title="Distribution Skew",
            summary="Feature exhibits slight skewness.",
            why_it_matters="Minor non-linearities present.",
            severity="Low",
            evidence_ids=["ev-dist-1"],
            evidence_items=[
                EvidenceItem(
                    evidence_id="ev-dist-1",
                    analysis_id="an-1",
                    dataset_id="ds-1",
                    category="distribution",
                    title="Distribution Skew",
                    description="Skewed",
                    metric_name="skewness",
                    metric_value=1.5,
                    strength="Medium",
                    source="Distribution Analyzer"
                )
            ],
            recommended_next_step="Inspect scaling."
        ),
        InsightItem(
            insight_id="ins-2",
            analysis_id="an-1",
            dataset_id="ds-1",
            category="Prediction",
            title="Critical Target Driver: revenue",
            summary="Strongest driver of outcome variance.",
            why_it_matters="Dictates 65% of prediction sensitivity.",
            severity="High",
            related_columns=["revenue"],
            actionable_investigation_target="revenue",
            evidence_ids=["ev-drv-1"],
            evidence_items=[
                EvidenceItem(
                    evidence_id="ev-drv-1",
                    analysis_id="an-1",
                    dataset_id="ds-1",
                    category="driver",
                    title="Key Factor",
                    description="Driver",
                    metric_name="feature_importance",
                    metric_value=0.65,
                    strength="High",
                    source="Prediction Engine V1.1"
                )
            ],
            recommended_next_step="Focus retention on revenue."
        )
    ]

    prioritized = rank_and_prioritize_insights(insights, target_col="revenue")

    assert len(prioritized) == 2
    # Prediction driver on target variable must rank higher than minor trend
    assert prioritized[0].insight_id == "ins-2"
    assert prioritized[0].is_key_finding is True
    assert prioritized[0].priority == "High"
    assert prioritized[0].priority_score > prioritized[1].priority_score
    assert len(prioritized[0].priority_reasons) > 0


def test_investigation_dimension_derivation():
    understanding = {
        "candidate_targets": ["churn"],
        "temporal_columns": ["signup_date"],
        "column_profiles": [
            {
                "name": "signup_date",
                "inferred_type": "temporal",
                "cardinality": "high",
                "unique_count": 300,
                "sample_values": ["2026-01-01", "2026-01-02"],
                "is_temporal": True
            },
            {
                "name": "contract_tier",
                "inferred_type": "categorical",
                "cardinality": "low",
                "unique_count": 3,
                "sample_values": ["Monthly", "One-Year", "Two-Year"]
            },
            {
                "name": "region",
                "inferred_type": "categorical",
                "cardinality": "low",
                "unique_count": 4,
                "sample_values": ["North", "South", "East", "West"]
            }
        ]
    }

    insight = InsightItem(
        insight_id="ins-churn",
        analysis_id="an-1",
        dataset_id="ds-1",
        category="Prediction",
        title="High Churn in Monthly Plans",
        summary="Monthly plans show elevated churn.",
        why_it_matters="Directly impacts annual recurring revenue.",
        severity="High",
        related_columns=["contract_tier"],
        actionable_investigation_target="contract_tier",
        evidence_ids=["ev-drv-1"],
        recommended_next_step="Inspect contract tier churn cohorts."
    )

    inv_ctx = derive_investigation_context(
        dataset_id="ds-1",
        analysis_id="an-1",
        insight=insight,
        understanding=understanding,
        target_col="churn"
    )

    assert inv_ctx.primary_feature == "contract_tier"
    assert len(inv_ctx.relevant_dimensions) >= 2
    dim_names = [d.dimension for d in inv_ctx.relevant_dimensions]
    assert "region" in dim_names or "signup_date" in dim_names
    assert "contract_tier" in inv_ctx.drill_down_path
    assert inv_ctx.suggested_prediction_target == "churn"


def test_decision_brief_synthesis():
    evidence_items = [
        EvidenceItem(
            evidence_id="ev-corr-1",
            analysis_id="an-1",
            dataset_id="ds-1",
            category="correlation",
            title="Revenue & Churn",
            description="Inverse association",
            metric_name="pearson_correlation",
            metric_value=-0.72,
            strength="High",
            related_columns=["revenue", "churn"],
            source="Correlation Engine"
        ),
        EvidenceItem(
            evidence_id="ev-anom-1",
            analysis_id="an-1",
            dataset_id="ds-1",
            category="anomaly",
            title="Outlier Spikes",
            description="Anomaly scan flagged 8 records.",
            metric_name="anomaly_count",
            metric_value=8,
            strength="High",
            related_columns=[],
            source="Anomaly Detection Engine"
        )
    ]
    insights = [
        InsightItem(
            insight_id="ins-top",
            analysis_id="an-1",
            dataset_id="ds-1",
            category="Prediction",
            title="Enterprise Revenue Dropped 14.2%",
            summary="Drop concentrated in monthly tiers.",
            why_it_matters="Drives 68% of quarterly variance.",
            severity="Critical",
            is_key_finding=True,
            evidence_ids=["ev-corr-1"],
            recommended_next_step="Inspect Enterprise accounts."
        )
    ]
    ml_result = {
        "status": "success",
        "prediction": {"summary": "Revenue expected to recover by 8.4%"},
        "reliability": "High",
        "reliability_description": "Validated on holdout splits."
    }

    brief = build_decision_brief(
        dataset_id="ds-1",
        analysis_id="an-1",
        insights=insights,
        evidence_items=evidence_items,
        ml_result=ml_result
    )

    assert brief.what_happened == "Enterprise Revenue Dropped 14.2%"
    assert brief.why_it_matters == "Drives 68% of quarterly variance."
    assert "r = -0.72" in brief.what_data_suggests or "correlation" in brief.what_data_suggests.lower()
    assert brief.what_may_happen_next == "Revenue expected to recover by 8.4%"
    assert brief.reliability == "High"
    assert "ev-corr-1" in brief.supporting_evidence_ids


def test_analytical_context_chat_continuity_and_insufficient_evidence():
    evidence_items = [
        EvidenceItem(
            evidence_id="ev-rev-1",
            analysis_id="an-1",
            dataset_id="ds-1",
            category="driver",
            title="Revenue Driver",
            description="Monthly contracts drive churn.",
            metric_name="feature_importance",
            metric_value=0.75,
            strength="High",
            related_columns=["revenue", "contract_type"],
            source="Prediction Engine V1.1"
        )
    ]

    context = AnalyticalContext(
        dataset_id="ds-1",
        dataset_name="Sales Dataset",
        previous_subject="revenue decline",
        active_dimensions=["contract_type", "region"]
    )

    # 1. Test conversational follow-up query
    follow_up_resp = answer_question_grounded_in_evidence(
        question="Why is that happening?",
        dataset_name="Sales Dataset",
        evidence_items=evidence_items,
        context=context
    )
    assert follow_up_resp.status == "success"
    assert "ev-rev-1" in follow_up_resp.referenced_evidence_ids
    assert follow_up_resp.resolved_subject is not None

    # 2. Test explicit insufficient evidence declaration
    untracked_resp = answer_question_grounded_in_evidence(
        question="What is our competitor market share in Europe?",
        dataset_name="Sales Dataset",
        evidence_items=evidence_items,
        context=context
    )
    assert untracked_resp.status == "success"
    assert "does not establish" in untracked_resp.answer.lower() or "limitation" in untracked_resp.answer.lower()
    assert untracked_resp.confidence == "Low"
