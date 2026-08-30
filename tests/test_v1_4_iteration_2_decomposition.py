import pytest
from backend.domain.contracts import (
    InsightItem,
    EvidenceItem,
    InvestigationContext,
    InvestigationDimension,
    InvestigationNode,
    InvestigationStepRequest,
    InvestigationStepResponse
)
from backend.analytics.investigation import (
    derive_investigation_context,
    decompose_investigation_step
)


def test_investigation_starts_from_existing_insight_and_retains_ids():
    """Verify that an investigation initializes from an Insight and retains dataset/analysis IDs in root node."""
    insight = InsightItem(
        insight_id="ins-churn-01",
        analysis_id="an-telecom-99",
        dataset_id="ds-telecom-99",
        category="Prediction",
        title="High Churn Rate in Month-to-Month Contracts",
        summary="Month-to-month accounts exhibit 42% churn risk compared to baseline 12%.",
        why_it_matters="Contract structure is the strongest single predictor of account retention.",
        severity="High",
        priority="High",
        evidence_ids=["ev-churn-driver", "ev-contract-corr"],
        related_columns=["contract_type", "churn_label"],
        actionable_investigation_target="contract_type",
        recommended_next_step="Evaluate discount incentives for 1-year contract migration."
    )

    understanding = {
        "column_profiles": [
            {"name": "contract_type", "inferred_type": "categorical", "unique_count": 3, "sample_values": ["Month-to-month", "One year", "Two year"]},
            {"name": "payment_method", "inferred_type": "categorical", "unique_count": 4, "sample_values": ["Electronic check", "Mailed check", "Bank transfer", "Credit card"]},
            {"name": "internet_service", "inferred_type": "categorical", "unique_count": 3, "sample_values": ["DSL", "Fiber optic", "No"]},
            {"name": "tenure_months", "inferred_type": "numeric", "unique_count": 72, "sample_values": [1, 12, 24, 72]}
        ],
        "candidate_targets": ["churn_label"],
        "row_count": 7043
    }

    inv_ctx = derive_investigation_context(
        dataset_id="ds-telecom-99",
        analysis_id="an-telecom-99",
        insight=insight,
        understanding=understanding
    )

    assert inv_ctx.dataset_id == "ds-telecom-99"
    assert inv_ctx.analysis_id == "an-telecom-99"
    assert inv_ctx.insight_id == "ins-churn-01"
    assert len(inv_ctx.nodes) == 1
    
    root_node = inv_ctx.nodes[0]
    assert root_node.type == "finding"
    assert root_node.label == insight.title
    assert "contract_type" in root_node.related_columns
    assert "ev-churn-driver" in root_node.evidence_ids
    assert len(root_node.available_next_dimensions) > 0


def test_dimension_decomposition_produces_real_measurable_observations():
    """Verify that selecting a dimension computes real measurable statistics from analytics data without fake numbers."""
    understanding = {
        "column_profiles": [
            {"name": "contract_type", "inferred_type": "categorical", "unique_count": 3},
            {"name": "payment_method", "inferred_type": "categorical", "unique_count": 4},
            {"name": "internet_service", "inferred_type": "categorical", "unique_count": 3}
        ],
        "row_count": 1000
    }

    analytics_data = {
        "categorical_summaries": {
            "payment_method": {
                "Electronic check": 450,
                "Mailed check": 250,
                "Bank transfer": 180,
                "Credit card": 120
            }
        }
    }

    evidence_items = [
        EvidenceItem(
            evidence_id="ev-pay-1",
            analysis_id="an-1",
            dataset_id="ds-1",
            category="segment",
            title="Electronic Check Concentration",
            description="Electronic check represents 45% of churn instances.",
            metric_name="cohort_record_count",
            metric_value=450,
            strength="High",
            related_columns=["payment_method"],
            source="Categorical Engine"
        )
    ]

    res = decompose_investigation_step(
        dataset_id="ds-1",
        analysis_id="an-1",
        investigation_id="inv-1",
        dimension="payment_method",
        understanding=understanding,
        analytics_data=analytics_data,
        evidence_items=evidence_items
    )

    assert res.status == "success"
    assert len(res.new_nodes) >= 2  # Dimension node + Observation node
    
    dim_node = res.new_nodes[0]
    obs_node = res.new_nodes[1]

    assert dim_node.type == "dimension"
    assert dim_node.value == "payment_method"

    assert obs_node.type == "observation"
    assert "Electronic check" in obs_node.label
    assert obs_node.metric_name == "cohort_record_count"
    assert obs_node.metric_value == 450
    assert "payment_method" in obs_node.related_columns
    assert "ev-pay-1" in obs_node.evidence_ids
    assert "Electronic check" in obs_node.description
    assert "450 records" in obs_node.description


def test_invalid_dimension_is_strictly_rejected():
    """Verify that requesting a dimension not present in column profiles is rejected without fabrication."""
    understanding = {
        "column_profiles": [
            {"name": "region", "inferred_type": "categorical", "unique_count": 4}
        ],
        "row_count": 500
    }

    res = decompose_investigation_step(
        dataset_id="ds-1",
        analysis_id="an-1",
        investigation_id="inv-1",
        dimension="fabricated_unknown_dimension",
        understanding=understanding
    )

    assert res.status == "error"
    assert res.is_terminal is True
    assert "not a valid dataset column" in res.message
    assert "No supported decomposition available" in res.new_nodes[0].description


def test_insufficient_analytical_data_returns_grounded_message_without_fake_numbers():
    """Verify that when no measurements exist for a column, the engine returns explicit insufficient data status."""
    understanding = {
        "column_profiles": [
            {"name": "obscure_col", "inferred_type": "categorical", "unique_count": 5}
        ],
        "row_count": 500
    }

    analytics_data = {}  # Empty analytics data

    res = decompose_investigation_step(
        dataset_id="ds-1",
        analysis_id="an-1",
        investigation_id="inv-1",
        dimension="obscure_col",
        understanding=understanding,
        analytics_data=analytics_data,
        evidence_items=[]
    )

    assert res.status == "success"
    obs_node = res.new_nodes[1]
    assert obs_node.metric_name == "data_availability"
    assert obs_node.metric_value == "insufficient"
    assert "No supported decomposition available" in obs_node.description


def test_multi_step_progressive_decomposition_and_evidence_termination():
    """Verify that multiple steps progressively accumulate in the chain and naturally terminate with evidence."""
    understanding = {
        "column_profiles": [
            {"name": "segment", "inferred_type": "categorical", "unique_count": 3},
            {"name": "region", "inferred_type": "categorical", "unique_count": 4},
            {"name": "channel", "inferred_type": "categorical", "unique_count": 2}
        ],
        "row_count": 1000
    }

    analytics_data = {
        "categorical_summaries": {
            "segment": {"Enterprise": 600, "SMB": 400},
            "region": {"India": 400, "US": 350, "EU": 250},
            "channel": {"Direct": 800, "Partner": 200}
        }
    }

    evidence = [
        EvidenceItem(
            evidence_id="ev-india-drop",
            analysis_id="an-1",
            dataset_id="ds-1",
            category="segment",
            title="Regional Drop: India",
            description="India region concentrated 40% of cohort drop.",
            metric_name="cohort_record_count",
            metric_value=400,
            strength="High",
            related_columns=["region"],
            source="Segment Engine"
        )
    ]

    # Step 1: Decompose by Segment
    step1_res = decompose_investigation_step(
        dataset_id="ds-1",
        analysis_id="an-1",
        investigation_id="inv-multi",
        dimension="segment",
        understanding=understanding,
        analytics_data=analytics_data,
        evidence_items=evidence
    )

    assert len(step1_res.all_nodes) == 2
    assert "segment" not in step1_res.available_next_dimensions
    assert "region" in step1_res.available_next_dimensions

    # Step 2: Decompose by Region
    step2_res = decompose_investigation_step(
        dataset_id="ds-1",
        analysis_id="an-1",
        investigation_id="inv-multi",
        dimension="region",
        current_nodes=step1_res.all_nodes,
        understanding=understanding,
        analytics_data=analytics_data,
        evidence_items=evidence
    )

    # Step 2 should contain previous nodes + dimension + observation + evidence node
    assert len(step2_res.all_nodes) >= 4
    assert any(n.type == "evidence" for n in step2_res.all_nodes)
    assert "ev-india-drop" in step2_res.supporting_evidence_ids


def test_non_causal_language_in_observations():
    """Verify that observations use associative and observational language, never claiming unsupported causality."""
    understanding = {
        "column_profiles": [
            {"name": "promo_code", "inferred_type": "categorical", "unique_count": 3}
        ],
        "row_count": 200
    }

    analytics_data = {
        "categorical_summaries": {
            "promo_code": {"DISCOUNT50": 120, "SUMMER": 80}
        }
    }

    res = decompose_investigation_step(
        dataset_id="ds-1",
        analysis_id="an-1",
        investigation_id="inv-promo",
        dimension="promo_code",
        understanding=understanding,
        analytics_data=analytics_data
    )

    obs_desc = res.new_nodes[1].description.lower()
    # Check for non-causal terminology
    assert "caused" not in obs_desc
    assert "led to" not in obs_desc
    assert "is responsible for" not in obs_desc
    assert any(w in obs_desc for w in ["accounts for", "concentration", "observed", "distribution", "relationship"])


def test_investigation_context_serialization():
    """Verify that the investigation context with InvestigationNodes serializes and deserializes cleanly."""
    node1 = InvestigationNode(
        node_id="n-1",
        investigation_id="inv-ser",
        type="finding",
        label="Root Finding",
        value=14.2,
        related_columns=["revenue"],
        evidence_ids=["ev-1"]
    )
    node2 = InvestigationNode(
        node_id="n-2",
        investigation_id="inv-ser",
        type="dimension",
        label="Break down by region",
        value="region",
        parent_node_id="n-1",
        depth=1
    )

    ctx = InvestigationContext(
        investigation_id="inv-ser",
        dataset_id="ds-ser",
        analysis_id="an-ser",
        primary_feature="revenue",
        summary="Investigation summary",
        nodes=[node1, node2],
        root_node_id="n-1",
        active_node_id="n-2"
    )

    dumped = ctx.model_dump()
    assert dumped["investigation_id"] == "inv-ser"
    assert len(dumped["nodes"]) == 2
    assert dumped["nodes"][0]["type"] == "finding"
    assert dumped["nodes"][1]["type"] == "dimension"

    reloaded = InvestigationContext.model_validate(dumped)
    assert reloaded.investigation_id == ctx.investigation_id
    assert len(reloaded.nodes) == 2
    assert reloaded.nodes[0].node_id == "n-1"
    assert reloaded.nodes[1].type == "dimension"

