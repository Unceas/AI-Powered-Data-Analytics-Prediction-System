import pytest
from backend.domain.contracts import (
    EvidenceItem,
    EvidenceRelationship,
    EvidenceGraph,
    EvidenceGraphResponse,
    InsightItem,
    InvestigationContext,
    AnalyticalContext
)
from backend.analytics.evidence_graph import build_evidence_graph, generate_relationship_id
from backend.analytics.investigation import derive_investigation_context
from backend.ai.insight_generator import answer_question_grounded_in_evidence
from httpx import AsyncClient, ASGITransport
from backend.main import app

DS_ID = "ds-test-v1441"
AN_ID = "an-test-v1441"


def make_evidence(
    eid: str,
    category: str = "correlation",
    title: str = "Test Evidence",
    desc: str = "Description",
    metric_name: str = "metric",
    metric_value: any = 0.5,
    columns: list = None,
    dataset_id: str = DS_ID,
    analysis_id: str = AN_ID,
    technical_details: dict = None
) -> EvidenceItem:
    return EvidenceItem(
        evidence_id=eid,
        analysis_id=analysis_id,
        dataset_id=dataset_id,
        category=category,
        title=title,
        description=desc,
        metric_name=metric_name,
        metric_value=metric_value,
        strength="High",
        related_columns=columns or [],
        source="Test Engine",
        technical_details=technical_details
    )


# 1. Empty Evidence Graph
def test_empty_evidence_graph():
    graph = build_evidence_graph(DS_ID, AN_ID, evidence_items=[])
    assert graph.dataset_id == DS_ID
    assert graph.analysis_id == AN_ID
    assert len(graph.evidence) == 0
    assert len(graph.relationships) == 0


# 2. Single Evidence Item
def test_single_evidence_item():
    e1 = make_evidence("ev-1", columns=["revenue"])
    graph = build_evidence_graph(DS_ID, AN_ID, evidence_items=[e1])
    assert len(graph.evidence) == 1
    assert len(graph.relationships) == 0


# 3. Related To via Shared Columns
def test_related_to_shared_columns():
    e1 = make_evidence("ev-1", category="metric", columns=["revenue", "region"])
    e2 = make_evidence("ev-2", category="trend", columns=["region", "cost"])
    graph = build_evidence_graph(DS_ID, AN_ID, evidence_items=[e1, e2])

    assert len(graph.relationships) == 1
    rel = graph.relationships[0]
    assert rel.relationship_type == "related_to"
    assert rel.created_from == "shared_columns"
    assert "region" in rel.related_columns


# 4. No Shared Columns -> No Relation
def test_no_shared_columns_no_relation():
    e1 = make_evidence("ev-1", category="metric", columns=["revenue"])
    e2 = make_evidence("ev-2", category="metric", columns=["temperature"])
    graph = build_evidence_graph(DS_ID, AN_ID, evidence_items=[e1, e2])
    assert len(graph.relationships) == 0


# 5. Corroborates via Shared Finding
def test_corroborates_shared_finding():
    e1 = make_evidence("ev-1", columns=["revenue"])
    e2 = make_evidence("ev-2", columns=["churn"])
    insight = InsightItem(
        insight_id="ins-1",
        analysis_id=AN_ID,
        dataset_id=DS_ID,
        category="Prediction",
        title="Revenue Churn Convergence",
        summary="Both indicate risk.",
        why_it_matters="Critical financial impact.",
        severity="High",
        priority="High",
        evidence_ids=["ev-1", "ev-2"],
        recommended_next_step="Inspect churn driver distribution"
    )
    graph = build_evidence_graph(DS_ID, AN_ID, evidence_items=[e1, e2], insights=[insight])
    assert len(graph.relationships) == 1
    rel = graph.relationships[0]
    assert rel.relationship_type == "corroborates"
    assert rel.created_from == "shared_finding"
    assert rel.confidence == "high"


# 6. Corroborates Supersedes Generic Related-To
def test_corroborates_supersedes_related_to():
    e1 = make_evidence("ev-1", columns=["revenue", "region"])
    e2 = make_evidence("ev-2", columns=["revenue", "segment"])
    insight = InsightItem(
        insight_id="ins-1",
        analysis_id=AN_ID,
        dataset_id=DS_ID,
        category="Correlation",
        title="Revenue Regional Concentration",
        summary="Summary",
        why_it_matters="Matters",
        severity="Medium",
        evidence_ids=["ev-1", "ev-2"],
        recommended_next_step="Inspect"
    )
    graph = build_evidence_graph(DS_ID, AN_ID, evidence_items=[e1, e2], insights=[insight])
    # Should only emit 1 relationship for the pair (corroborates), NOT also related_to
    assert len(graph.relationships) == 1
    assert graph.relationships[0].relationship_type == "corroborates"


# 7. Derived From: Driver and Correlation
def test_derived_from_driver_and_correlation():
    e_corr = make_evidence("ev-corr", category="correlation", columns=["tenure", "churn"], metric_name="pearson_correlation", metric_value=0.58)
    e_drv = make_evidence("ev-drv", category="driver", columns=["tenure"], metric_name="feature_importance", metric_value=0.34)
    graph = build_evidence_graph(DS_ID, AN_ID, evidence_items=[e_drv, e_corr])

    assert len(graph.relationships) == 1
    rel = graph.relationships[0]
    assert rel.relationship_type == "derived_from"
    assert rel.source_evidence_id == "ev-drv"
    assert rel.target_evidence_id == "ev-corr"
    assert rel.created_from == "derivation_chain"


# 8. Supports Relationship
def test_supports_relationship():
    e_dist = make_evidence("ev-dist", category="distribution", columns=["spend"], metric_name="skewness", metric_value=2.4)
    e_anom = make_evidence("ev-anom", category="anomaly", columns=["spend"], metric_name="anomaly_count", metric_value=45)
    graph = build_evidence_graph(DS_ID, AN_ID, evidence_items=[e_dist, e_anom])

    assert len(graph.relationships) == 1
    rel = graph.relationships[0]
    assert rel.relationship_type == "supports"
    assert rel.source_evidence_id == "ev-dist"
    assert rel.target_evidence_id == "ev-anom"
    assert rel.created_from == "compatible_pattern"


# 9. Contradiction: Opposing Correlations
def test_contradiction_opposing_correlations():
    e1 = make_evidence("ev-c1", category="correlation", columns=["price", "demand"], metric_name="pearson_correlation", metric_value=0.62)
    e2 = make_evidence("ev-c2", category="correlation", columns=["demand", "price"], metric_name="pearson_correlation", metric_value=-0.55)
    graph = build_evidence_graph(DS_ID, AN_ID, evidence_items=[e1, e2])

    assert len(graph.relationships) == 1
    rel = graph.relationships[0]
    assert rel.relationship_type == "contradicts"
    assert rel.created_from == "conflicting_pattern"
    assert rel.confidence == "high"


# 10. Contradiction Supersedes All Other Relations
def test_contradiction_supersedes_all():
    e1 = make_evidence("ev-c1", category="correlation", columns=["price", "demand"], metric_name="pearson_correlation", metric_value=0.62)
    e2 = make_evidence("ev-c2", category="correlation", columns=["demand", "price"], metric_name="pearson_correlation", metric_value=-0.55)
    insight = InsightItem(
        insight_id="ins-contra",
        analysis_id=AN_ID,
        dataset_id=DS_ID,
        category="Correlation",
        title="Price Sensitivity",
        summary="Summary",
        why_it_matters="Matters",
        severity="High",
        evidence_ids=["ev-c1", "ev-c2"],
        recommended_next_step="Audit pipeline"
    )
    graph = build_evidence_graph(DS_ID, AN_ID, evidence_items=[e1, e2], insights=[insight])
    assert len(graph.relationships) == 1
    assert graph.relationships[0].relationship_type == "contradicts"


# 11. Weak Difference is NOT a Contradiction
def test_weak_difference_not_contradiction():
    e1 = make_evidence("ev-c1", category="correlation", columns=["feature_a", "feature_b"], metric_name="pearson_correlation", metric_value=0.45)
    e2 = make_evidence("ev-c2", category="correlation", columns=["feature_a", "feature_b"], metric_name="pearson_correlation", metric_value=0.55)
    graph = build_evidence_graph(DS_ID, AN_ID, evidence_items=[e1, e2])
    # Both positive moderate correlations - should NOT contradict
    for rel in graph.relationships:
        assert rel.relationship_type != "contradicts"


# 12. Weak Correlation Sign Flip is NOT a Contradiction
def test_weak_correlation_sign_flip_not_contradiction():
    # Near zero noise: r = 0.08 vs r = -0.05 must not trigger contradiction
    e1 = make_evidence("ev-c1", category="correlation", columns=["col_x", "col_y"], metric_name="pearson_correlation", metric_value=0.08)
    e2 = make_evidence("ev-c2", category="correlation", columns=["col_x", "col_y"], metric_name="pearson_correlation", metric_value=-0.05)
    graph = build_evidence_graph(DS_ID, AN_ID, evidence_items=[e1, e2])
    for rel in graph.relationships:
        assert rel.relationship_type != "contradicts"


# 13. No Self-Relationships
def test_no_self_relationships():
    e1 = make_evidence("ev-1", category="driver", columns=["feature_z"])
    # Passing e1 multiple times
    graph = build_evidence_graph(DS_ID, AN_ID, evidence_items=[e1, e1])
    assert len(graph.relationships) == 0
    for rel in graph.relationships:
        assert rel.source_evidence_id != rel.target_evidence_id


# 14. No Duplicate Relationships
def test_no_duplicate_relationships():
    e1 = make_evidence("ev-1", columns=["revenue", "region"])
    e2 = make_evidence("ev-2", columns=["revenue", "region"])
    graph = build_evidence_graph(DS_ID, AN_ID, evidence_items=[e1, e2])
    assert len(graph.relationships) == 1


# 15. Symmetric Normalization
def test_symmetric_normalization():
    e1 = make_evidence("ev-b", category="metric", columns=["col_k"])
    e2 = make_evidence("ev-a", category="metric", columns=["col_k"])
    graph = build_evidence_graph(DS_ID, AN_ID, evidence_items=[e1, e2])
    rel = graph.relationships[0]
    # For symmetric relationships, source must be alphabetically earlier than target
    assert rel.source_evidence_id == "ev-a"
    assert rel.target_evidence_id == "ev-b"


# 16. Directed Preservation
def test_directed_preservation():
    e_drv = make_evidence("ev-driver", category="driver", columns=["gpa"], metric_name="feature_importance", metric_value=0.4)
    e_corr = make_evidence("ev-corr", category="correlation", columns=["gpa", "target"], metric_name="pearson_correlation", metric_value=0.6)
    graph = build_evidence_graph(DS_ID, AN_ID, evidence_items=[e_drv, e_corr])
    rel = graph.relationships[0]
    assert rel.relationship_type == "derived_from"
    assert rel.source_evidence_id == "ev-driver"
    assert rel.target_evidence_id == "ev-corr"


# 17. Dataset Isolation
def test_dataset_isolation():
    e1 = make_evidence("ev-1", dataset_id="ds-A", columns=["score"])
    e2 = make_evidence("ev-2", dataset_id="ds-B", columns=["score"])
    # Building graph for ds-A must exclude ds-B
    graph = build_evidence_graph("ds-A", AN_ID, evidence_items=[e1, e2])
    assert len(graph.evidence) == 1
    assert graph.evidence[0].dataset_id == "ds-A"
    assert len(graph.relationships) == 0


# 18. Analysis Isolation
def test_analysis_isolation():
    e1 = make_evidence("ev-1", analysis_id="an-alpha", columns=["score"])
    e2 = make_evidence("ev-2", analysis_id="an-beta", columns=["score"])
    graph = build_evidence_graph(DS_ID, "an-alpha", evidence_items=[e1, e2])
    assert len(graph.evidence) == 1
    assert graph.evidence[0].analysis_id == "an-alpha"
    assert len(graph.relationships) == 0


# 19. Stable IDs and Deterministic Ordering
def test_stable_ids_and_ordering():
    e1 = make_evidence("ev-1", category="metric", columns=["feature_1"])
    e2 = make_evidence("ev-2", category="metric", columns=["feature_1"])
    e3 = make_evidence("ev-3", category="metric", columns=["feature_1"])

    graph1 = build_evidence_graph(DS_ID, AN_ID, evidence_items=[e1, e2, e3])
    graph2 = build_evidence_graph(DS_ID, AN_ID, evidence_items=[e3, e2, e1])

    assert len(graph1.relationships) == len(graph2.relationships)
    for r1, r2 in zip(graph1.relationships, graph2.relationships):
        assert r1.relationship_id == r2.relationship_id
        assert r1.source_evidence_id == r2.source_evidence_id
        assert r1.target_evidence_id == r2.target_evidence_id
        assert r1.relationship_type == r2.relationship_type


# 20. Evidence Graph API Response Contract
@pytest.mark.anyio
async def test_evidence_graph_response_contract():
    e1 = make_evidence("ev-10", category="metric", columns=["sales"])
    e2 = make_evidence("ev-20", category="metric", columns=["sales"])

    payload = {
        "dataset_id": DS_ID,
        "analysis_id": AN_ID,
        "evidence_items": [e1.model_dump(), e2.model_dump()]
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/evidence-graph", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["total_evidence_count"] == 2
        assert data["total_relationship_count"] == 1
        assert "graph" in data
        assert len(data["graph"]["relationships"]) == 1


# 21. Investigation Context Integration
def test_investigation_context_integration():
    e1 = make_evidence("ev-inv-1", category="driver", columns=["satisfaction"])
    e2 = make_evidence("ev-inv-2", category="correlation", columns=["satisfaction", "churn"])
    
    context = derive_investigation_context(
        dataset_id=DS_ID,
        analysis_id=AN_ID,
        evidence_items=[e1, e2]
    )
    assert hasattr(context, "evidence_relationships")
    assert len(context.evidence_relationships) >= 1
    assert context.evidence_relationships[0].relationship_type == "derived_from"


# 22. Copilot Grounded Answering with Evidence Graph
def test_ask_copilot_grounded_with_evidence_graph():
    e1 = make_evidence("ev-cop-1", category="driver", columns=["satisfaction"], title="Satisfaction Driver", desc="Key retention driver")
    e2 = make_evidence("ev-cop-2", category="correlation", columns=["satisfaction", "churn"], title="Satisfaction Churn Correlation", desc="Strong negative correlation")
    
    rel = EvidenceRelationship(
        relationship_id="rel-test-1",
        dataset_id=DS_ID,
        analysis_id=AN_ID,
        source_evidence_id="ev-cop-1",
        target_evidence_id="ev-cop-2",
        relationship_type="derived_from",
        rationale="Satisfaction driver is derived from correlation matrix.",
        confidence="high",
        related_columns=["satisfaction"],
        created_from="derivation_chain"
    )

    ans = answer_question_grounded_in_evidence(
        question="How does satisfaction impact churn?",
        dataset_name="Customer Dataset",
        evidence_items=[e1, e2],
        evidence_relationships=[rel]
    )
    assert ans.status == "success"
    assert "ev-cop-1" in ans.referenced_evidence_ids
    assert "ev-cop-2" in ans.referenced_evidence_ids
    assert "Inter-Evidence" in ans.answer
    assert "Satisfaction driver is derived from correlation matrix" in ans.answer
