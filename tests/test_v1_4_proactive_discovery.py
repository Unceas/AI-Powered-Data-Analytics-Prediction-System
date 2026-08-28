import pytest
from backend.domain.contracts import (
    EvidenceItem,
    InsightItem,
    InvestigationContext,
    InvestigationDimension
)
from backend.ai.insight_generator import (
    rank_and_prioritize_insights,
    generate_grounded_insights_from_evidence
)
from backend.analytics.investigation import derive_investigation_context


def test_deterministic_ranking_consistency():
    """Verify that findings are ranked with 100% deterministic consistency across repeated executions."""
    evidence_1 = EvidenceItem(
        evidence_id="ev-1",
        analysis_id="an-1",
        dataset_id="ds-1",
        category="driver",
        title="Predictive Driver: Churn Risk",
        description="Contract duration drives churn risk.",
        metric_name="feature_importance",
        metric_value=0.72,
        strength="High",
        related_columns=["contract_type", "churn_risk"],
        source="Prediction Engine V1.1"
    )
    
    evidence_2 = EvidenceItem(
        evidence_id="ev-2",
        analysis_id="an-1",
        dataset_id="ds-1",
        category="correlation",
        title="Monthly Charges Correlation",
        description="Strong linear relationship with total charges.",
        metric_name="pearson_r",
        metric_value=0.88,
        strength="High",
        related_columns=["monthly_charges", "total_charges"],
        source="Correlation Engine"
    )
    
    evidence_3 = EvidenceItem(
        evidence_id="ev-3",
        analysis_id="an-1",
        dataset_id="ds-1",
        category="anomaly",
        title="Usage Outliers",
        description="Flagged 12 outlier records.",
        metric_name="outlier_count",
        metric_value=12,
        strength="Medium",
        related_columns=["data_usage"],
        source="Isolation Forest"
    )

    column_profiles = [
        {"name": "contract_type", "inferred_type": "categorical", "cardinality": "low", "unique_count": 3},
        {"name": "region", "inferred_type": "categorical", "cardinality": "low", "unique_count": 5},
        {"name": "tenure_months", "inferred_type": "numeric", "cardinality": "high", "unique_count": 72}
    ]

    # Run multiple times and compare orders
    run1 = generate_grounded_insights_from_evidence(
        [evidence_1, evidence_2, evidence_3],
        target_col="churn_risk",
        column_profiles=column_profiles
    )
    
    run2 = generate_grounded_insights_from_evidence(
        [evidence_1, evidence_2, evidence_3],
        target_col="churn_risk",
        column_profiles=column_profiles
    )

    assert len(run1) == len(run2)
    for i in range(len(run1)):
        assert run1[i].insight_id != ""
        assert run1[i].title == run2[i].title
        assert run1[i].priority_score == run2[i].priority_score
        assert run1[i].priority == run2[i].priority
        assert run1[i].is_key_finding == run2[i].is_key_finding


def test_stronger_evidence_and_target_relevance_increases_priority():
    """Verify that high statistical strength and target relevance increase priority score."""
    weak_insight = InsightItem(
        insight_id="ins-weak",
        analysis_id="an-1",
        dataset_id="ds-1",
        category="Quality",
        title="Minor Missing Values",
        summary="0.5% missing records in postal code.",
        why_it_matters="Slight impact on geocoding.",
        severity="Low",
        priority="Low",
        evidence_items=[
            EvidenceItem(
                evidence_id="ev-w1",
                analysis_id="an-1",
                dataset_id="ds-1",
                category="quality",
                title="Missing Postal",
                description="0.5% missing",
                metric_name="missing_percentage",
                metric_value=0.5,
                strength="Low",
                related_columns=["postal_code"],
                source="Quality Engine"
            )
        ],
        related_columns=["postal_code"],
        recommended_next_step="Impute with mode."
    )

    strong_target_insight = InsightItem(
        insight_id="ins-strong",
        analysis_id="an-1",
        dataset_id="ds-1",
        category="Prediction",
        title="High Influence Driver: Enterprise Revenue",
        summary="Enterprise tier accounts directly predict net revenue retention.",
        why_it_matters="Critical driver for target revenue.",
        severity="High",
        priority="High",
        evidence_items=[
            EvidenceItem(
                evidence_id="ev-s1",
                analysis_id="an-1",
                dataset_id="ds-1",
                category="driver",
                title="Leading Driver",
                description="Enterprise feature importance 0.65",
                metric_name="feature_importance",
                metric_value=0.65,
                strength="High",
                related_columns=["revenue", "segment"],
                source="Prediction Engine"
            ),
            EvidenceItem(
                evidence_id="ev-s2",
                analysis_id="an-1",
                dataset_id="ds-1",
                category="correlation",
                title="Segment Revenue Correlation",
                description="High correlation r = 0.85",
                metric_name="pearson_r",
                metric_value=0.85,
                strength="High",
                related_columns=["revenue", "segment"],
                source="Correlation Engine"
            )
        ],
        related_columns=["revenue", "segment"],
        actionable_investigation_target="revenue",
        recommended_next_step="Inspect segment cohorts."
    )

    ranked = rank_and_prioritize_insights(
        [weak_insight, strong_target_insight],
        target_col="revenue"
    )

    assert ranked[0].insight_id == "ins-strong"
    assert ranked[0].priority_score > ranked[1].priority_score
    assert ranked[0].is_key_finding is True
    assert "revenue" in ranked[0].reason_for_priority.lower() or "evidence" in ranked[0].reason_for_priority.lower()


def test_investigation_candidates_strictly_grounded_in_dataset_columns():
    """Verify that suggested investigation candidates only use actual columns from dataset profiles."""
    column_profiles = [
        {"name": "sales", "inferred_type": "numeric", "unique_count": 1000},
        {"name": "region", "inferred_type": "categorical", "unique_count": 4},
        {"name": "plan_tier", "inferred_type": "categorical", "unique_count": 3},
        {"name": "signup_date", "inferred_type": "temporal", "is_temporal": True, "unique_count": 365}
    ]

    insight = InsightItem(
        insight_id="ins-sales-drop",
        analysis_id="an-1",
        dataset_id="ds-1",
        category="Prediction",
        title="Sales Anomaly Alert",
        summary="Sales dropped in recent evaluation.",
        why_it_matters="Direct revenue risk.",
        severity="High",
        related_columns=["sales"],
        actionable_investigation_target="sales",
        recommended_next_step="Drill down by region."
    )

    ranked = rank_and_prioritize_insights(
        [insight],
        column_profiles=column_profiles
    )

    candidates = ranked[0].investigation_candidates
    assert len(candidates) > 0
    # Must only contain valid categorical/temporal columns and exclude the primary feature 'sales'
    valid_dims = {"region", "plan_tier", "signup_date"}
    for cand in candidates:
        assert cand in valid_dims
        assert cand != "sales"
    assert "non_existent_column" not in candidates


def test_diversity_deduplication_penalizes_redundant_findings():
    """Verify that redundant insights on the same category and feature receive a diversity penalty."""
    ins1 = InsightItem(
        insight_id="ins-corr-1",
        analysis_id="an-1",
        dataset_id="ds-1",
        category="Correlation",
        title="Price and Quantity Correlation A",
        summary="First observation of price and quantity.",
        why_it_matters="Pricing strategy.",
        severity="Medium",
        related_columns=["price", "quantity"],
        actionable_investigation_target="price",
        recommended_next_step="Inspect."
    )

    ins2 = InsightItem(
        insight_id="ins-corr-2",
        analysis_id="an-1",
        dataset_id="ds-1",
        category="Correlation",
        title="Price and Quantity Correlation B",
        summary="Second duplicate observation of price and quantity.",
        why_it_matters="Pricing strategy.",
        severity="Medium",
        related_columns=["price", "quantity"],
        actionable_investigation_target="price",
        recommended_next_step="Inspect."
    )

    ins_diff = InsightItem(
        insight_id="ins-anom-1",
        analysis_id="an-1",
        dataset_id="ds-1",
        category="Anomaly",
        title="Outliers in Latency",
        summary="Multivariate outliers in response latency.",
        why_it_matters="SLA breaches.",
        severity="Medium",
        related_columns=["latency"],
        actionable_investigation_target="latency",
        recommended_next_step="Inspect outliers."
    )

    ranked = rank_and_prioritize_insights([ins1, ins2, ins_diff])
    scores = {item.insight_id: item.priority_score for item in ranked}
    
    # Primary correlation should be higher than the duplicate correlation
    assert scores["ins-corr-1"] > scores["ins-corr-2"]


def test_top_findings_retain_evidence_and_context_linkage():
    """Verify that normalized findings retain evidence_ids and connect to Workspace investigation context."""
    evidence = [
        EvidenceItem(
            evidence_id="ev-churn-driver",
            analysis_id="an-work-1",
            dataset_id="ds-work-1",
            category="driver",
            title="Contract Duration Driver",
            description="Contract duration explains 45% variance.",
            metric_name="feature_importance",
            metric_value=0.45,
            strength="High",
            related_columns=["contract", "churn"],
            source="AutoML Engine"
        )
    ]

    column_profiles = [
        {"name": "churn", "inferred_type": "categorical", "unique_count": 2},
        {"name": "contract", "inferred_type": "categorical", "unique_count": 3},
        {"name": "state", "inferred_type": "categorical", "unique_count": 50}
    ]

    insights = generate_grounded_insights_from_evidence(
        evidence,
        dataset_name="Telecom Churn",
        analysis_id="an-work-1",
        dataset_id="ds-work-1",
        column_profiles=column_profiles
    )

    top_finding = insights[0]
    assert "ev-churn-driver" in top_finding.evidence_ids
    assert top_finding.is_key_finding is True
    assert top_finding.reason_for_priority is not None
    assert len(top_finding.reason_for_priority) > 0

    # Derive investigation context using top finding
    inv_context = derive_investigation_context(
        dataset_id="ds-work-1",
        analysis_id="an-work-1",
        insight=top_finding,
        understanding={"column_profiles": column_profiles, "candidate_targets": ["churn"]}
    )

    assert inv_context.dataset_id == "ds-work-1"
    assert inv_context.analysis_id == "an-work-1"
    assert "ev-churn-driver" in inv_context.supporting_evidence_ids
    assert inv_context.primary_feature in ["contract", "churn"]
