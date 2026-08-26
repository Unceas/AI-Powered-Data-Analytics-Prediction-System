import pytest
from backend.domain.contracts import (
    EvidenceItem, 
    InsightItem, 
    InvestigationContext, 
    InvestigationDimension,
    AnalyticalContext
)
from backend.analytics.investigation import derive_investigation_context
from backend.analytics.evidence import extract_evidence
from backend.ai.insight_generator import answer_question_grounded_in_evidence
from backend.ml.schemas import MLPredictionResponse


def test_dataset_establishes_workspace_root():
    """Verify that dataset establishes the root context and all child entities inherit its IDs."""
    dataset_id = "ds-root-100"
    analysis_id = "an-root-100"
    
    understanding = {
        "row_count": 500,
        "column_count": 5,
        "quality_score": 88,
        "duplicate_rows_count": 4,
        "candidate_targets": ["sales"],
        "column_profiles": [
            {
                "name": "sales",
                "inferred_type": "numeric",
                "missing_count": 25,
                "missing_percentage": 5.0,
                "unique_count": 450,
                "cardinality": "high",
                "is_candidate_target": True
            },
            {
                "name": "region",
                "inferred_type": "categorical",
                "missing_count": 0,
                "missing_percentage": 0.0,
                "unique_count": 4,
                "cardinality": "low",
                "sample_values": ["North", "South", "East", "West"]
            }
        ]
    }
    
    evidence = extract_evidence(
        dataset_id=dataset_id,
        analysis_id=analysis_id,
        understanding=understanding
    )
    
    assert len(evidence) > 0
    for ev in evidence:
        assert ev.dataset_id == dataset_id
        assert ev.analysis_id == analysis_id


def test_insight_sets_active_investigation_with_valid_dimensions():
    """Verify that investigation derived from an insight only uses real dataset columns."""
    dataset_id = "ds-inv-200"
    analysis_id = "an-inv-200"
    
    understanding = {
        "candidate_targets": ["churn_rate"],
        "column_profiles": [
            {
                "name": "churn_rate",
                "inferred_type": "numeric",
                "cardinality": "high",
                "unique_count": 100,
                "is_candidate_target": True
            },
            {
                "name": "tier",
                "inferred_type": "categorical",
                "cardinality": "low",
                "unique_count": 3,
                "sample_values": ["Basic", "Pro", "Enterprise"]
            },
            {
                "name": "country",
                "inferred_type": "categorical",
                "cardinality": "low",
                "unique_count": 5,
                "sample_values": ["US", "India", "UK", "Germany", "Japan"]
            }
        ]
    }
    
    insight = InsightItem(
        insight_id="ins-churn-alert",
        analysis_id=analysis_id,
        dataset_id=dataset_id,
        category="Prediction",
        title="Elevated Churn in Basic Tier",
        summary="Basic tier accounts show accelerated churn.",
        why_it_matters="Directly degrades net revenue retention.",
        severity="High",
        related_columns=["tier"],
        evidence_ids=["ev-churn-1"],
        recommended_next_step="Inspect tier cohorts by geography."
    )
    
    inv_context = derive_investigation_context(
        dataset_id=dataset_id,
        analysis_id=analysis_id,
        insight=insight,
        understanding=understanding,
        target_col="churn_rate"
    )
    
    assert inv_context.dataset_id == dataset_id
    assert inv_context.analysis_id == analysis_id
    assert inv_context.primary_feature == "tier"
    
    # Valid dimensions must only come from the column profiles (country, tier)
    valid_col_names = {"country", "tier", "churn_rate"}
    for dim in inv_context.relevant_dimensions:
        assert dim.dimension in valid_col_names
    
    assert inv_context.suggested_prediction_target == "churn_rate"
    assert "tier" in inv_context.drill_down_path


def test_prediction_inherits_investigation_context():
    """Verify that MLPredictionResponse carries the contextual investigation data."""
    inv_data = {
        "investigation_id": "inv-test-99",
        "subject": "revenue",
        "selected_dimensions": ["tier", "country"],
        "drill_down_path": ["revenue", "tier", "country"]
    }
    
    response = MLPredictionResponse(
        status="success",
        message="Model trained",
        model_type="RandomForestRegressor",
        metrics={"r2_score": 0.89},
        dataset_id="ds-pred-1",
        analysis_id="an-pred-1",
        investigation_context=inv_data
    )
    
    assert response.dataset_id == "ds-pred-1"
    assert response.analysis_id == "an-pred-1"
    assert response.investigation_context is not None
    assert response.investigation_context["subject"] == "revenue"
    assert "country" in response.investigation_context["selected_dimensions"]


def test_ask_insightgrid_receives_structured_workspace_context():
    """Verify that Ask InsightGrid uses structured workspace context (subject, dimensions) to ground answers."""
    evidence_items = [
        EvidenceItem(
            evidence_id="ev-sales-tier",
            analysis_id="an-1",
            dataset_id="ds-1",
            category="driver",
            title="Enterprise Tier Growth",
            description="Enterprise tier accounted for 64% of total sales variance.",
            metric_name="feature_importance",
            metric_value=0.64,
            strength="High",
            related_columns=["sales", "tier"],
            source="Prediction Engine V1.1"
        )
    ]
    
    context = AnalyticalContext(
        dataset_id="ds-1",
        dataset_name="Quarterly Revenue",
        analysis_id="an-1",
        active_insight_id="ins-sales",
        active_target="sales",
        active_dimensions=["tier", "region"],
        investigation={
            "subject": "sales",
            "selected_dimensions": ["tier", "region"]
        }
    )
    
    # Follow-up question referring implicitly to the active investigation
    result = answer_question_grounded_in_evidence(
        question="Why did that happen?",
        dataset_name="Quarterly Revenue",
        evidence_items=evidence_items,
        context=context
    )
    
    assert result.status == "success"
    assert "ev-sales-tier" in result.referenced_evidence_ids
    assert result.resolved_subject == "sales"
    assert result.confidence == "High"


def test_stale_or_missing_evidence_declaration():
    """Verify that asking about topics completely outside workspace evidence yields an explicit limitation notice."""
    evidence_items = [
        EvidenceItem(
            evidence_id="ev-retention",
            analysis_id="an-1",
            dataset_id="ds-1",
            category="metric",
            title="Retention Rate",
            description="Monthly retention is 92.4%",
            metric_name="retention_rate",
            metric_value=0.924,
            strength="High",
            related_columns=["retention"],
            source="Analysis Engine"
        )
    ]
    
    context = AnalyticalContext(
        dataset_id="ds-1",
        dataset_name="Customer Analytics",
        previous_subject="retention",
        active_dimensions=["plan_type"]
    )
    
    result = answer_question_grounded_in_evidence(
        question="What is the CEO salary and external competitor market share?",
        dataset_name="Customer Analytics",
        evidence_items=evidence_items,
        context=context
    )
    
    assert result.status == "success"
    assert result.confidence == "Low"
    assert "limitation notice" in result.answer.lower()
    assert len(result.referenced_evidence_ids) == 0
