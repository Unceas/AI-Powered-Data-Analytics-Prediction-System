import pytest
from typing import Dict, Any, List
from backend.domain.contracts import (
    EvidenceItem,
    EvidenceRelationship,
    EvidenceStrength,
    InsightItem,
    InvestigationContext,
    AnalyticalContext,
    ColumnProfile,
    DataUnderstandingResponse
)
from backend.analytics.evidence_strength import (
    evaluate_evidence_strength,
    batch_evaluate_evidence_strengths,
    evaluate_finding_confidence
)
from backend.ai.insight_generator import (
    rank_and_prioritize_insights,
    answer_question_grounded_in_evidence,
    generate_grounded_insights_from_evidence
)
from backend.analytics.investigation import derive_investigation_context


def test_1_empty_evidence_strength_evaluation():
    """Verify empty evidence collection evaluates to empty mapping without errors."""
    strengths = batch_evaluate_evidence_strengths([])
    assert strengths == {}


def test_2_weak_evidence_item_evaluation():
    """Verify a weak statistical signal with low correlation and small sample evaluates to limited."""
    ev = EvidenceItem(
        evidence_id="ev-weak-1",
        analysis_id="an-1",
        dataset_id="ds-1",
        category="correlation",
        title="Weak Correlation",
        description="Weak correlation observed.",
        metric_name="correlation_coefficient",
        metric_value=0.12,
        strength="Low",
        related_columns=["feat_a", "feat_b"],
        source="Correlation Engine",
        provenance={"sample_size": 40}
    )
    strength = evaluate_evidence_strength(ev)
    assert strength.strength == "limited"
    assert strength.score < 40.0
    assert any("low baseline" in f.lower() for f in strength.limiting_factors)
    assert any("weak linear" in f.lower() for f in strength.limiting_factors)
    assert any("small sample" in f.lower() for f in strength.limiting_factors)


def test_3_moderate_evidence_item_evaluation():
    """Verify moderate signal with sufficient sample size evaluates to moderate strength."""
    ev = EvidenceItem(
        evidence_id="ev-mod-1",
        analysis_id="an-1",
        dataset_id="ds-1",
        category="correlation",
        title="Moderate Correlation",
        description="Moderate correlation observed.",
        metric_name="correlation_coefficient",
        metric_value=0.48,
        strength="Medium",
        related_columns=["revenue", "volume"],
        source="Correlation Engine",
        provenance={"sample_size": 150}
    )
    strength = evaluate_evidence_strength(ev)
    assert strength.strength == "moderate"
    assert 40.0 <= strength.score < 70.0
    assert any("moderate" in f.lower() for f in strength.supporting_factors)


def test_4_strong_evidence_item_evaluation():
    """Verify strong statistical signal with large sample size evaluates to strong."""
    ev = EvidenceItem(
        evidence_id="ev-strong-1",
        analysis_id="an-1",
        dataset_id="ds-1",
        category="correlation",
        title="Strong Correlation",
        description="Strong correlation observed.",
        metric_name="correlation_coefficient",
        metric_value=0.88,
        strength="High",
        related_columns=["revenue", "contract_value"],
        source="Correlation Engine",
        provenance={"sample_size": 500}
    )
    understanding = {"row_count": 500, "quality_score": 95, "column_profiles": [
        {"name": "revenue", "missing_percentage": 0.0},
        {"name": "contract_value", "missing_percentage": 0.0}
    ]}
    strength = evaluate_evidence_strength(ev, understanding=understanding)
    assert strength.strength == "strong"
    assert strength.score >= 70.0
    assert any("strong linear" in f.lower() for f in strength.supporting_factors)
    assert any("reliable sample" in f.lower() for f in strength.supporting_factors)


def test_5_corroboration_bonus_increases_score():
    """Verify that independent corroborating evidence increases score deterministically."""
    ev1 = EvidenceItem(
        evidence_id="ev-1",
        analysis_id="an-1",
        dataset_id="ds-1",
        category="correlation",
        title="Revenue Volume",
        description="High correlation.",
        metric_name="correlation_coefficient",
        metric_value=0.55,
        strength="Medium",
        related_columns=["revenue", "volume"],
        source="Correlation Engine",
        provenance={"sample_size": 150}
    )
    rel = EvidenceRelationship(
        relationship_id="rel-1",
        dataset_id="ds-1",
        analysis_id="an-1",
        source_evidence_id="ev-1",
        target_evidence_id="ev-2",
        relationship_type="corroborates",
        rationale="Independent cohort pattern corroborates relationship.",
        confidence="high",
        related_columns=["revenue"],
        created_from="shared_finding"
    )
    strength_isolated = evaluate_evidence_strength(ev1)
    strength_corroborated = evaluate_evidence_strength(ev1, relationships=[rel])

    assert strength_corroborated.score > strength_isolated.score
    assert strength_corroborated.corroboration_count == 1
    assert any("corroborated by independent evidence" in f.lower() for f in strength_corroborated.supporting_factors)


def test_6_anti_double_counting_derivation_chain():
    """Verify that evidence connected via derived_from does NOT grant independent corroboration bonus."""
    ev1 = EvidenceItem(
        evidence_id="ev-corr-1",
        analysis_id="an-1",
        dataset_id="ds-1",
        category="correlation",
        title="Revenue Driver",
        description="Correlation signal.",
        metric_name="correlation_coefficient",
        metric_value=0.72,
        strength="High",
        related_columns=["revenue", "price"],
        source="Correlation Engine"
    )
    # Relationship indicating ev-drv-1 is derived from ev-corr-1
    rel_derived = EvidenceRelationship(
        relationship_id="rel-dev-1",
        dataset_id="ds-1",
        analysis_id="an-1",
        source_evidence_id="ev-drv-1",
        target_evidence_id="ev-corr-1",
        relationship_type="derived_from",
        rationale="Driver derived from correlation feature.",
        confidence="high",
        related_columns=["revenue", "price"],
        created_from="derivation_chain"
    )
    # Even if also marked as supports/corroborates
    rel_supports = EvidenceRelationship(
        relationship_id="rel-supp-1",
        dataset_id="ds-1",
        analysis_id="an-1",
        source_evidence_id="ev-drv-1",
        target_evidence_id="ev-corr-1",
        relationship_type="supports",
        rationale="Supports same finding.",
        confidence="high",
        related_columns=["revenue", "price"],
        created_from="derivation_chain"
    )
    strength = evaluate_evidence_strength(ev1, relationships=[rel_derived, rel_supports])
    # Must NOT have corroboration_count incremented because it is in a derivation chain
    assert strength.corroboration_count == 0
    assert any("derivation chain link" in f.lower() for f in strength.limiting_factors)


def test_7_contradiction_penalizes_evidence_strength():
    """Verify that a verified contradiction heavily penalizes score and forces strength to conflicting."""
    ev = EvidenceItem(
        evidence_id="ev-1",
        analysis_id="an-1",
        dataset_id="ds-1",
        category="correlation",
        title="Revenue Association",
        description="Correlation.",
        metric_name="correlation_coefficient",
        metric_value=0.75,
        strength="High",
        related_columns=["revenue", "discounts"],
        source="Correlation Engine"
    )
    rel = EvidenceRelationship(
        relationship_id="rel-contra-1",
        dataset_id="ds-1",
        analysis_id="an-1",
        source_evidence_id="ev-1",
        target_evidence_id="ev-anom-1",
        relationship_type="contradicts",
        rationale="Segment analysis reveals inverse trend.",
        confidence="high",
        related_columns=["revenue", "discounts"],
        created_from="conflicting_pattern"
    )
    strength = evaluate_evidence_strength(ev, relationships=[rel])
    assert strength.strength == "conflicting"
    assert strength.contradiction_count == 1
    assert any("contradicted by verified" in f.lower() for f in strength.limiting_factors)


def test_8_contradiction_forces_finding_confidence_conflicting():
    """Verify that verified contradictions force finding confidence to conflicting, regardless of strong signals."""
    ins = InsightItem(
        insight_id="ins-contra",
        analysis_id="an-1",
        dataset_id="ds-1",
        category="Prediction",
        title="Churn Driver",
        summary="Tenure strongly predicts churn.",
        why_it_matters="Retention.",
        severity="High",
        evidence_ids=["ev-supp-1"],
        related_columns=["tenure", "churn"],
        recommended_next_step="Inspect"
    )
    ev_strengths = {
        "ev-supp-1": EvidenceStrength(
            evidence_id="ev-supp-1",
            strength="strong",
            score=85.0
        )
    }
    rel = EvidenceRelationship(
        relationship_id="rel-contra",
        dataset_id="ds-1",
        analysis_id="an-1",
        source_evidence_id="ev-supp-1",
        target_evidence_id="ev-other-1",
        relationship_type="contradicts",
        rationale="Cohort analysis shows opposing sign.",
        confidence="high",
        related_columns=["tenure"],
        created_from="conflicting_pattern"
    )
    conf, reason, supp, contra, sugg = evaluate_finding_confidence(
        insight=ins,
        evidence_strengths=ev_strengths,
        relationships=[rel]
    )
    assert conf == "conflicting"
    assert "ev-other-1" in contra
    assert "conflicting relationship" in reason.lower()


def test_9_small_sample_size_penalty():
    """Verify sample size N < 50 applies penalty and logs limiting factor."""
    ev = EvidenceItem(
        evidence_id="ev-sample-test",
        analysis_id="an-1",
        dataset_id="ds-1",
        category="driver",
        title="Feature Influence",
        description="Attribution signal.",
        metric_name="importance",
        metric_value=0.35,
        strength="High",
        related_columns=["cost"],
        source="Prediction Engine",
        provenance={"sample_size": 25}
    )
    strength = evaluate_evidence_strength(ev)
    assert any("small sample size" in f.lower() for f in strength.limiting_factors)


def test_10_missingness_penalty():
    """Verify columns with >= 20% missingness trigger quality penalty."""
    ev = EvidenceItem(
        evidence_id="ev-null-test",
        analysis_id="an-1",
        dataset_id="ds-1",
        category="correlation",
        title="Correlation with missing data",
        description="Correlation.",
        metric_name="correlation_coefficient",
        metric_value=0.65,
        strength="Medium",
        related_columns=["income", "spend"],
        source="Correlation Engine"
    )
    understanding = {
        "row_count": 300,
        "column_profiles": [
            {"name": "income", "missing_percentage": 28.5},
            {"name": "spend", "missing_percentage": 2.0}
        ]
    }
    strength = evaluate_evidence_strength(ev, understanding=understanding)
    assert any("high missingness in feature 'income'" in f.lower() for f in strength.limiting_factors)


def test_11_target_relevance_bonus():
    """Verify target relevance awards deterministic bonus and logs factor."""
    ev = EvidenceItem(
        evidence_id="ev-target-rel",
        analysis_id="an-1",
        dataset_id="ds-1",
        category="correlation",
        title="Target Correlation",
        description="Correlation with outcome.",
        metric_name="correlation_coefficient",
        metric_value=0.55,
        strength="Medium",
        related_columns=["churn", "usage"],
        source="Correlation Engine"
    )
    strength_no_target = evaluate_evidence_strength(ev, target_col="other_col")
    strength_with_target = evaluate_evidence_strength(ev, target_col="churn")

    assert strength_with_target.score > strength_no_target.score
    assert any("candidate target variable 'churn'" in f for f in strength_with_target.supporting_factors)


def test_12_independent_lineages_finding_confidence_high():
    """Verify multiple independent strong signals produce high finding confidence."""
    ins = InsightItem(
        insight_id="ins-multi-ind",
        analysis_id="an-1",
        dataset_id="ds-1",
        category="Prediction",
        title="High Confidence Finding",
        summary="Substantiated by correlation and driver.",
        why_it_matters="High business impact.",
        severity="High",
        evidence_ids=["ev-ind-1", "ev-ind-2"],
        related_columns=["revenue", "sales_calls"],
        recommended_next_step="Action"
    )
    ev_strengths = {
        "ev-ind-1": EvidenceStrength(evidence_id="ev-ind-1", strength="strong", score=78.0),
        "ev-ind-2": EvidenceStrength(evidence_id="ev-ind-2", strength="strong", score=82.0)
    }
    conf, reason, supp, contra, sugg = evaluate_finding_confidence(
        insight=ins,
        evidence_strengths=ev_strengths,
        relationships=[]  # No derivation chain connecting them
    )
    assert conf == "high"
    assert "multiple independent" in reason.lower()
    assert len(contra) == 0


def test_13_single_signal_finding_confidence_medium():
    """Verify single verified signal yields medium confidence with appropriate reason."""
    ins = InsightItem(
        insight_id="ins-single",
        analysis_id="an-1",
        dataset_id="ds-1",
        category="Correlation",
        title="Single Signal Finding",
        summary="Substantiated by one correlation.",
        why_it_matters="Analysis.",
        severity="Medium",
        evidence_ids=["ev-single-1"],
        related_columns=["a", "b"],
        recommended_next_step="Inspect"
    )
    ev_strengths = {
        "ev-single-1": EvidenceStrength(evidence_id="ev-single-1", strength="moderate", score=50.0)
    }
    conf, reason, supp, contra, sugg = evaluate_finding_confidence(
        insight=ins,
        evidence_strengths=ev_strengths
    )
    assert conf == "medium"
    assert "single verified analytical signal" in reason.lower()


def test_14_no_evidence_finding_confidence_low():
    """Verify finding without verified supporting evidence receives low confidence."""
    ins = InsightItem(
        insight_id="ins-no-ev",
        analysis_id="an-1",
        dataset_id="ds-1",
        category="Quality",
        title="Baseline Notice",
        summary="No evidence attached.",
        why_it_matters="Informational.",
        severity="Low",
        evidence_ids=[],
        related_columns=[],
        recommended_next_step="Run analysis"
    )
    conf, reason, supp, contra, sugg = evaluate_finding_confidence(
        insight=ins,
        evidence_strengths={}
    )
    assert conf == "low"
    assert "no direct verified evidence items" in reason.lower()


def test_15_dataset_isolation_enforced():
    """Verify relationships from a different dataset_id are strictly ignored."""
    ev = EvidenceItem(
        evidence_id="ev-ds-a",
        analysis_id="an-1",
        dataset_id="dataset-alpha",
        category="correlation",
        title="Correlation Alpha",
        description="Dataset alpha.",
        metric_name="correlation_coefficient",
        metric_value=0.55,
        strength="Medium",
        related_columns=["col1"],
        source="Engine"
    )
    # Contradiction on dataset-beta
    rel_foreign = EvidenceRelationship(
        relationship_id="rel-foreign",
        dataset_id="dataset-beta",
        analysis_id="an-1",
        source_evidence_id="ev-ds-a",
        target_evidence_id="ev-foreign",
        relationship_type="contradicts",
        rationale="Cross-dataset artifact.",
        confidence="high",
        related_columns=["col1"],
        created_from="conflicting_pattern"
    )
    strength = evaluate_evidence_strength(ev, relationships=[rel_foreign])
    assert strength.contradiction_count == 0
    assert strength.strength != "conflicting"


def test_16_analysis_isolation_enforced():
    """Verify relationships from a different analysis_id are strictly ignored."""
    ev = EvidenceItem(
        evidence_id="ev-an-a",
        analysis_id="analysis-v1",
        dataset_id="ds-1",
        category="correlation",
        title="Correlation V1",
        description="V1.",
        metric_name="correlation_coefficient",
        metric_value=0.55,
        strength="Medium",
        related_columns=["col1"],
        source="Engine"
    )
    # Relationship on analysis-v2
    rel_foreign = EvidenceRelationship(
        relationship_id="rel-foreign-an",
        dataset_id="ds-1",
        analysis_id="analysis-v2",
        source_evidence_id="ev-an-a",
        target_evidence_id="ev-other",
        relationship_type="contradicts",
        rationale="Other analysis run.",
        confidence="high",
        related_columns=["col1"],
        created_from="conflicting_pattern"
    )
    strength = evaluate_evidence_strength(ev, relationships=[rel_foreign])
    assert strength.contradiction_count == 0


def test_17_deterministic_reproducible_scores():
    """Verify deterministic scoring returns identical output across repeated runs."""
    ev = EvidenceItem(
        evidence_id="ev-repeat",
        analysis_id="an-1",
        dataset_id="ds-1",
        category="correlation",
        title="Repeatability Test",
        description="Determinism check.",
        metric_name="correlation_coefficient",
        metric_value=0.68,
        strength="High",
        related_columns=["x", "y"],
        source="Correlation Engine",
        provenance={"sample_size": 250}
    )
    res1 = evaluate_evidence_strength(ev)
    res2 = evaluate_evidence_strength(ev)
    assert res1.score == res2.score
    assert res1.strength == res2.strength
    assert res1.supporting_factors == res2.supporting_factors
    assert res1.limiting_factors == res2.limiting_factors


def test_18_priority_and_confidence_separation():
    """Verify distinction: critical severity maintains high investigation priority even if confidence is limited."""
    # Critical anomaly finding supported by modest sample evidence
    ev = EvidenceItem(
        evidence_id="ev-anom-crit",
        analysis_id="an-1",
        dataset_id="ds-1",
        category="anomaly",
        title="Outliers in Transaction Value",
        description="Anomalous transactions.",
        metric_name="anomaly_count",
        metric_value=8,
        strength="Medium",
        related_columns=["amount"],
        source="Anomaly Detector",
        provenance={"sample_size": 35}  # Small sample size
    )
    ins = InsightItem(
        insight_id="ins-crit-risk",
        analysis_id="an-1",
        dataset_id="ds-1",
        category="Anomaly",
        title="Critical Security Anomaly",
        summary="High-risk transactions detected.",
        why_it_matters="Potential fraudulent activity.",
        severity="Critical",  # High urgency
        evidence_ids=["ev-anom-crit"],
        evidence_items=[ev],
        related_columns=["amount"],
        actionable_investigation_target="amount",
        recommended_next_step="Audit immediately"
    )
    ranked = rank_and_prioritize_insights([ins])
    assert len(ranked) == 1
    # Priority is High because of Critical severity + Anomaly category
    assert ranked[0].priority == "High"
    # But finding confidence reflects small sample size constraints
    assert ranked[0].finding_confidence in ("medium", "low")
    assert any("sample" in f.lower() for f in ranked[0].evidence_items[0].evidence_strength.limiting_factors)


def test_19_confidence_adjustment_in_priority_ranking():
    """Verify confidence adjustment (+10 for high, -10 for low) influences priority score smoothly."""
    ev_high = EvidenceItem(
        evidence_id="ev-h",
        analysis_id="an-1",
        dataset_id="ds-1",
        category="correlation",
        title="High Evidence",
        description="High signal.",
        metric_name="correlation_coefficient",
        metric_value=0.85,
        strength="High",
        related_columns=["revenue", "units"],
        source="Engine",
        provenance={"sample_size": 500}
    )
    ev_high2 = EvidenceItem(
        evidence_id="ev-h2",
        analysis_id="an-1",
        dataset_id="ds-1",
        category="correlation",
        title="High Evidence 2",
        description="High signal.",
        metric_name="correlation_coefficient",
        metric_value=0.75,
        strength="High",
        related_columns=["revenue", "units"],
        source="Engine",
        provenance={"sample_size": 500}
    )
    ins_high = InsightItem(
        insight_id="ins-h",
        analysis_id="an-1",
        dataset_id="ds-1",
        category="Correlation",
        title="High Confidence Insight",
        summary="High evidence.",
        why_it_matters="Matters.",
        severity="Medium",
        evidence_ids=["ev-h", "ev-h2"],
        evidence_items=[ev_high, ev_high2],
        related_columns=["revenue", "units"],
        recommended_next_step="Inspect"
    )

    ins_low = InsightItem(
        insight_id="ins-l",
        analysis_id="an-1",
        dataset_id="ds-1",
        category="Correlation",
        title="Low Confidence Insight",
        summary="No evidence.",
        why_it_matters="Matters.",
        severity="Medium",
        evidence_ids=[],
        evidence_items=[],
        related_columns=["revenue", "units"],
        recommended_next_step="Inspect"
    )

    ranked = rank_and_prioritize_insights([ins_high, ins_low])
    high_res = next(i for i in ranked if i.insight_id == "ins-h")
    low_res = next(i for i in ranked if i.insight_id == "ins-l")

    assert high_res.finding_confidence == "high"
    assert low_res.finding_confidence == "low"
    assert high_res.priority_score > low_res.priority_score


def test_20_grounded_improvement_suggestions_no_hallucination():
    """Verify confidence improvement suggestions strictly derive from real columns in understanding."""
    ins = InsightItem(
        insight_id="ins-test-sugg",
        analysis_id="an-1",
        dataset_id="ds-1",
        category="Correlation",
        title="Sales Pattern",
        summary="Correlation.",
        why_it_matters="Growth.",
        severity="Medium",
        evidence_ids=["ev-1"],
        related_columns=["sales"],
        recommended_next_step="Inspect"
    )
    ev_strengths = {"ev-1": EvidenceStrength(evidence_id="ev-1", strength="moderate", score=50.0)}
    understanding = {
        "row_count": 80,
        "temporal_columns": ["created_at"],
        "column_profiles": [
            {"name": "sales", "inferred_type": "numeric", "missing_percentage": 0.0},
            {"name": "created_at", "inferred_type": "temporal", "is_temporal": True},
            {"name": "plan_tier", "inferred_type": "categorical", "unique_count": 3, "cardinality": "low"}
        ]
    }
    conf, reason, supp, contra, suggestions = evaluate_finding_confidence(
        insight=ins,
        evidence_strengths=ev_strengths,
        understanding=understanding
    )
    assert len(suggestions) > 0
    # Must explicitly mention real columns from understanding
    combined_sugg = " ".join(suggestions)
    assert "created_at" in combined_sugg or "plan_tier" in combined_sugg or "80" in combined_sugg
    # Must NOT hallucinate arbitrary columns
    assert "market_index" not in combined_sugg
    assert "untracked_column" not in combined_sugg


def test_21_investigation_context_incorporates_confidence():
    """Verify derive_investigation_context populates finding_confidence and contradicting_evidence_ids."""
    ev1 = EvidenceItem(
        evidence_id="ev-inv-1",
        analysis_id="an-1",
        dataset_id="ds-1",
        category="correlation",
        title="Revenue Vol",
        description="Correlation.",
        metric_name="correlation_coefficient",
        metric_value=0.75,
        strength="High",
        related_columns=["revenue", "volume"],
        source="Engine"
    )
    ins = InsightItem(
        insight_id="ins-inv-1",
        analysis_id="an-1",
        dataset_id="ds-1",
        category="Correlation",
        title="Revenue Vol",
        summary="Correlation.",
        why_it_matters="Revenue.",
        severity="High",
        evidence_ids=["ev-inv-1"],
        evidence_items=[ev1],
        related_columns=["revenue", "volume"],
        recommended_next_step="Inspect",
        finding_confidence="high",
        confidence_reason="Supported by verified statistical correlation.",
        contradicting_evidence_ids=[]
    )
    ctx = derive_investigation_context(
        dataset_id="ds-1",
        analysis_id="an-1",
        insight=ins,
        evidence_items=[ev1]
    )
    assert ctx.finding_confidence == "high"
    assert "verified statistical correlation" in ctx.confidence_reason
    assert ctx.contradicting_evidence_ids == []


def test_22_copilot_grounded_answer_incorporates_confidence():
    """Verify answer_question_grounded_in_evidence includes confidence in context response."""
    ev = EvidenceItem(
        evidence_id="ev-copilot-1",
        analysis_id="an-1",
        dataset_id="ds-1",
        category="driver",
        title="Top Revenue Driver",
        description="Account tenure explains revenue stability.",
        metric_name="importance",
        metric_value=0.42,
        strength="High",
        related_columns=["tenure", "revenue"],
        source="Model Engine"
    )
    context = AnalyticalContext(
        dataset_id="ds-1",
        active_target="revenue",
        active_finding_confidence="high",
        active_confidence_reason="Supported by multiple independent analytical signals"
    )
    ans = answer_question_grounded_in_evidence(
        question="What drives revenue?",
        dataset_name="Sales Dataset",
        evidence_items=[ev],
        context=context
    )
    assert ans.status == "success"
    assert "Active Finding Confidence: High" in ans.answer or "High" in ans.confidence


def test_23_api_evidence_strength_evaluation():
    """Verify batch_evaluate_evidence_strengths supports multi-item analytical sets."""
    ev1 = EvidenceItem(
        evidence_id="ev-a",
        analysis_id="an-1",
        dataset_id="ds-1",
        category="driver",
        title="Driver A",
        description="Driver.",
        metric_name="importance",
        metric_value=0.35,
        strength="High",
        related_columns=["tenure"],
        source="Engine"
    )
    ev2 = EvidenceItem(
        evidence_id="ev-b",
        analysis_id="an-1",
        dataset_id="ds-1",
        category="anomaly",
        title="Anomaly B",
        description="Outliers.",
        metric_name="anomaly_count",
        metric_value=30,
        strength="High",
        related_columns=["cost"],
        source="Engine"
    )
    strengths = batch_evaluate_evidence_strengths([ev1, ev2])
    assert len(strengths) == 2
    assert "ev-a" in strengths
    assert "ev-b" in strengths
    assert strengths["ev-a"].score >= 0.0
    assert strengths["ev-b"].score >= 0.0


def test_24_confidence_reason_is_transparent_and_deterministic():
    """Verify confidence reason clearly states evidentiary backing without vague statements."""
    ins = InsightItem(
        insight_id="ins-transp",
        analysis_id="an-1",
        dataset_id="ds-1",
        category="Quality",
        title="Missing Values Alert",
        summary="Null values detected.",
        why_it_matters="Data completeness.",
        severity="Medium",
        evidence_ids=["ev-q-1"],
        related_columns=["email"],
        recommended_next_step="Clean data"
    )
    ev_strengths = {
        "ev-q-1": EvidenceStrength(
            evidence_id="ev-q-1",
            strength="moderate",
            score=45.0,
            limiting_factors=["Modest sample size (N = 80)"]
        )
    }
    conf, reason, supp, contra, sugg = evaluate_finding_confidence(
        insight=ins,
        evidence_strengths=ev_strengths
    )
    assert "single verified analytical signal" in reason.lower() or "analytical evidence" in reason.lower()


@pytest.mark.anyio
async def test_25_api_post_evidence_strength_route():
    """Verify POST /api/evidence-strength returns valid EvidenceStrengthResponse."""
    from httpx import AsyncClient, ASGITransport
    from backend.main import app

    ev = EvidenceItem(
        evidence_id="ev-api-1",
        analysis_id="an-api",
        dataset_id="ds-api",
        category="correlation",
        title="API Correlation",
        description="Correlation.",
        metric_name="correlation_coefficient",
        metric_value=0.72,
        strength="High",
        related_columns=["sales", "spend"],
        source="Engine"
    )
    payload = {
        "dataset_id": "ds-api",
        "analysis_id": "an-api",
        "evidence_items": [ev.model_dump()],
        "relationships": [],
        "target_column": "sales"
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/evidence-strength", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["total_evidence_count"] == 1
        assert "ev-api-1" in data["strengths"]
        assert data["strengths"]["ev-api-1"]["strength"] in ["strong", "moderate"]
        assert data["strengths"]["ev-api-1"]["score"] > 50.0

