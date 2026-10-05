import hashlib
from typing import Dict, Any, List, Optional, Set, Tuple
from backend.domain.contracts import (
    EvidenceItem,
    EvidenceRelationship,
    EvidenceGraph,
    EvidenceGraphResponse,
    InsightItem
)


def generate_relationship_id(
    dataset_id: str,
    analysis_id: str,
    source_id: str,
    target_id: str,
    rel_type: str,
    is_directed: bool = False
) -> str:
    """
    Generates a deterministic, stable relationship ID using sha256 hash.
    For symmetric relationships, pair order is normalized so (A, B) and (B, A) yield the exact same ID.
    """
    if is_directed:
        pair_str = f"{source_id}->{target_id}"
    else:
        pair = sorted([source_id, target_id])
        pair_str = f"{pair[0]}<->{pair[1]}"

    raw_key = f"{dataset_id}:{analysis_id}:{pair_str}:{rel_type}"
    digest = hashlib.sha256(raw_key.encode("utf-8")).hexdigest()[:12]
    type_prefix = rel_type[:4]
    return f"rel-{type_prefix}-{digest}"


def build_evidence_graph(
    dataset_id: str,
    analysis_id: str,
    evidence_items: Optional[List[EvidenceItem]] = None,
    analysis_context: Optional[Dict[str, Any]] = None,
    insights: Optional[List[InsightItem]] = None,
    analytics_data: Optional[Dict[str, Any]] = None
) -> EvidenceGraph:
    """
    Deterministically constructs an EvidenceGraph from verified EvidenceItem objects and insights.
    
    Principles:
    1. Deterministic, dataset-scoped, and analysis-scoped.
    2. Zero LLM hallucinations or inferred speculation.
    3. Strict relationship types: 'supports', 'corroborates', 'contradicts', 'related_to', 'derived_from'.
    4. Conservative contradiction detection (strict mathematical incompatibility only).
    5. No self-relations, no duplicate edges, canonical symmetric normalization.
    """
    if not evidence_items:
        return EvidenceGraph(
            dataset_id=dataset_id,
            analysis_id=analysis_id,
            evidence=[],
            relationships=[]
        )

    # 1. Scope and Isolation Filtering
    # Only include evidence items matching dataset_id and analysis_id
    scoped_evidence: List[EvidenceItem] = []
    seen_evidence_ids: Set[str] = set()
    for item in evidence_items:
        if item.dataset_id != dataset_id or item.analysis_id != analysis_id:
            continue
        if item.evidence_id in seen_evidence_ids:
            continue
        seen_evidence_ids.add(item.evidence_id)
        scoped_evidence.append(item)

    if len(scoped_evidence) < 2:
        return EvidenceGraph(
            dataset_id=dataset_id,
            analysis_id=analysis_id,
            evidence=scoped_evidence,
            relationships=[]
        )

    # Map evidence for quick lookup
    ev_by_id: Dict[str, EvidenceItem] = {e.evidence_id: e for e in scoped_evidence}
    candidate_relations: Dict[Tuple[str, str], EvidenceRelationship] = {}

    def get_pair_key(s_id: str, t_id: str, directed: bool) -> Tuple[str, str]:
        if directed:
            return (s_id, t_id)
        return tuple(sorted([s_id, t_id]))

    # Helper to register relationship honoring priority
    # Priority: contradicts (4) > corroborates (3), derived_from (3), supports (3) > related_to (1)
    priority_map = {
        "contradicts": 4,
        "corroborates": 3,
        "derived_from": 3,
        "supports": 3,
        "related_to": 1
    }

    def add_relationship(
        source_id: str,
        target_id: str,
        rel_type: str,
        rationale: str,
        confidence: str,
        related_columns: List[str],
        created_from: str,
        is_directed: bool = False
    ):
        if source_id == target_id:
            return

        pair_key = get_pair_key(source_id, target_id, directed=False)
        current_existing = candidate_relations.get(pair_key)
        new_priority = priority_map.get(rel_type, 1)

        if current_existing:
            existing_priority = priority_map.get(current_existing.relationship_type, 1)
            if new_priority < existing_priority:
                return  # Existing stronger relationship takes precedence
            if new_priority == existing_priority and current_existing.relationship_type == "contradicts":
                return

        # For symmetric relationships, enforce canonical ordering
        if not is_directed:
            norm_source, norm_target = sorted([source_id, target_id])
        else:
            norm_source, norm_target = source_id, target_id

        rel_id = generate_relationship_id(
            dataset_id=dataset_id,
            analysis_id=analysis_id,
            source_id=norm_source,
            target_id=norm_target,
            rel_type=rel_type,
            is_directed=is_directed
        )

        rel = EvidenceRelationship(
            relationship_id=rel_id,
            dataset_id=dataset_id,
            analysis_id=analysis_id,
            source_evidence_id=norm_source,
            target_evidence_id=norm_target,
            relationship_type=rel_type,
            rationale=rationale,
            confidence=confidence,
            related_columns=sorted(list(set(related_columns))),
            created_from=created_from
        )
        candidate_relations[pair_key] = rel

    # --- RULE E: Contradiction Detection (Strict Incompatibility) ---
    for i in range(len(scoped_evidence)):
        for j in range(i + 1, len(scoped_evidence)):
            e1 = scoped_evidence[i]
            e2 = scoped_evidence[j]

            # 1. Contradictory Bivariate Correlations
            if e1.category == "correlation" and e2.category == "correlation":
                cols1 = set(e1.related_columns)
                cols2 = set(e2.related_columns)
                if cols1 and cols1 == cols2 and len(cols1) == 2:
                    val1 = e1.metric_value if isinstance(e1.metric_value, (int, float)) else None
                    val2 = e2.metric_value if isinstance(e2.metric_value, (int, float)) else None
                    if val1 is not None and val2 is not None:
                        # Conservative threshold: opposite signs and both |r| >= 0.35
                        if (val1 >= 0.35 and val2 <= -0.35) or (val1 <= -0.35 and val2 >= 0.35):
                            add_relationship(
                                source_id=e1.evidence_id,
                                target_id=e2.evidence_id,
                                rel_type="contradicts",
                                rationale=f"Opposing correlation coefficients observed for feature pair ({', '.join(sorted(cols1))}): r = {val1} vs r = {val2}.",
                                confidence="high",
                                related_columns=list(cols1),
                                created_from="conflicting_pattern",
                                is_directed=False
                            )
                            continue

            # 2. Contradictory Missingness / Quality Claims
            if e1.category == "quality" and e2.category == "quality":
                shared_cols = set(e1.related_columns) & set(e2.related_columns)
                if shared_cols:
                    col = list(shared_cols)[0]
                    # One claims 0% missing, other claims >= 15% missing
                    if e1.metric_name == "missing_percentage" and e2.metric_name == "missing_percentage":
                        v1 = float(e1.metric_value) if isinstance(e1.metric_value, (int, float)) else 0.0
                        v2 = float(e2.metric_value) if isinstance(e2.metric_value, (int, float)) else 0.0
                        if (v1 == 0.0 and v2 >= 15.0) or (v2 == 0.0 and v1 >= 15.0):
                            add_relationship(
                                source_id=e1.evidence_id,
                                target_id=e2.evidence_id,
                                rel_type="contradicts",
                                rationale=f"Incompatible missingness measurements recorded for column '{col}': {v1}% vs {v2}%.",
                                confidence="high",
                                related_columns=[col],
                                created_from="conflicting_pattern",
                                is_directed=False
                            )
                            continue

            # 3. Contradictory Driver Orientation vs Correlation
            if (e1.category == "driver" and e2.category == "correlation") or (e1.category == "correlation" and e2.category == "driver"):
                drv_ev = e1 if e1.category == "driver" else e2
                corr_ev = e2 if e1.category == "driver" else e1
                if drv_ev.related_columns and corr_ev.related_columns:
                    feat = drv_ev.related_columns[0]
                    if feat in corr_ev.related_columns:
                        direction = drv_ev.technical_details.get("direction") if drv_ev.technical_details else None
                        corr_val = corr_ev.metric_value if isinstance(corr_ev.metric_value, (int, float)) else None
                        if direction and corr_val is not None:
                            if (direction == "positive" and corr_val <= -0.40) or (direction in ["negative", "inverse"] and corr_val >= 0.40):
                                add_relationship(
                                    source_id=e1.evidence_id,
                                    target_id=e2.evidence_id,
                                    rel_type="contradicts",
                                    rationale=f"Model driver orientation ({direction}) for '{feat}' conflicts with observed bivariate correlation (r = {corr_val}).",
                                    confidence="high",
                                    related_columns=[feat],
                                    created_from="conflicting_pattern",
                                    is_directed=False
                                )
                                continue

    # --- RULE A: Corroboration via Shared Finding / Insights ---
    if insights:
        for ins in insights:
            if ins.dataset_id and ins.dataset_id != dataset_id:
                continue
            # Collect evidence IDs linked to this insight
            ins_ev_ids: List[str] = []
            if ins.evidence_ids:
                ins_ev_ids.extend([eid for eid in ins.evidence_ids if eid in ev_by_id])
            if ins.evidence_items:
                ins_ev_ids.extend([e.evidence_id for e in ins.evidence_items if e.evidence_id in ev_by_id])
            
            # Deduplicate while preserving order
            unique_ins_ev_ids = list(dict.fromkeys(ins_ev_ids))
            if len(unique_ins_ev_ids) >= 2:
                conf = "high" if ins.priority == "High" or ins.severity in ["Critical", "High"] else "medium"
                for i in range(len(unique_ins_ev_ids)):
                    for j in range(i + 1, len(unique_ins_ev_ids)):
                        ev1 = ev_by_id[unique_ins_ev_ids[i]]
                        ev2 = ev_by_id[unique_ins_ev_ids[j]]
                        shared_or_union = list(set(ev1.related_columns) | set(ev2.related_columns))
                        add_relationship(
                            source_id=ev1.evidence_id,
                            target_id=ev2.evidence_id,
                            rel_type="corroborates",
                            rationale=f"Both evidence items substantiate finding: '{ins.title}'.",
                            confidence=conf,
                            related_columns=shared_or_union,
                            created_from="shared_finding",
                            is_directed=False
                        )

    # --- RULE C & D: Derivation Chain & Support (Directed) ---
    for i in range(len(scoped_evidence)):
        for j in range(len(scoped_evidence)):
            if i == j:
                continue
            e1 = scoped_evidence[i]
            e2 = scoped_evidence[j]

            # Rule C: Predictive driver is derived from baseline correlation or feature statistics
            if e1.category == "driver" and e2.category == "correlation":
                shared_cols = set(e1.related_columns) & set(e2.related_columns)
                if shared_cols:
                    feat = list(shared_cols)[0]
                    add_relationship(
                        source_id=e1.evidence_id,
                        target_id=e2.evidence_id,
                        rel_type="derived_from",
                        rationale=f"Predictive factor attribution for '{feat}' is derived from underlying bivariate correlation analysis.",
                        confidence="high",
                        related_columns=list(shared_cols),
                        created_from="derivation_chain",
                        is_directed=True
                    )
                    continue

            # Rule D: Distribution or correlation supports anomaly / driver / trend
            if e1.category == "distribution" and e2.category == "anomaly":
                shared_cols = set(e1.related_columns) & set(e2.related_columns)
                cols_to_use = list(shared_cols) if shared_cols else e1.related_columns
                add_relationship(
                    source_id=e1.evidence_id,
                    target_id=e2.evidence_id,
                    rel_type="supports",
                    rationale=f"Distribution characteristics in '{', '.join(cols_to_use)}' provide evidentiary support for outlier concentrations.",
                    confidence="high",
                    related_columns=cols_to_use,
                    created_from="compatible_pattern",
                    is_directed=True
                )
                continue

            if e1.category == "correlation" and e2.category == "driver":
                # If derived_from was not set in reverse, or as a support relationship:
                shared_cols = set(e1.related_columns) & set(e2.related_columns)
                if shared_cols:
                    feat = list(shared_cols)[0]
                    # Check if (e2, e1) is not already derived_from
                    pair_key = get_pair_key(e1.evidence_id, e2.evidence_id, directed=False)
                    if pair_key not in candidate_relations:
                        add_relationship(
                            source_id=e1.evidence_id,
                            target_id=e2.evidence_id,
                            rel_type="supports",
                            rationale=f"Linear correlation involving '{feat}' statistically supports model driver attribution.",
                            confidence="medium",
                            related_columns=[feat],
                            created_from="compatible_pattern",
                            is_directed=True
                        )
                        continue

    # --- RULE B: Related To (Shared Columns Fallback) ---
    for i in range(len(scoped_evidence)):
        for j in range(i + 1, len(scoped_evidence)):
            e1 = scoped_evidence[i]
            e2 = scoped_evidence[j]

            pair_key = get_pair_key(e1.evidence_id, e2.evidence_id, directed=False)
            if pair_key in candidate_relations:
                continue

            shared_cols = set(e1.related_columns) & set(e2.related_columns)
            if shared_cols:
                cols_list = sorted(list(shared_cols))
                confidence_val = "medium" if len(cols_list) >= 2 else "low"
                add_relationship(
                    source_id=e1.evidence_id,
                    target_id=e2.evidence_id,
                    rel_type="related_to",
                    rationale=f"Both evidence items examine shared column(s): {', '.join(cols_list)}.",
                    confidence=confidence_val,
                    related_columns=cols_list,
                    created_from="shared_columns",
                    is_directed=False
                )

    # Sort relationships deterministically by (relationship_type, source_evidence_id, target_evidence_id)
    sorted_relationships = sorted(
        candidate_relations.values(),
        key=lambda r: (r.relationship_type, r.source_evidence_id, r.target_evidence_id)
    )

    return EvidenceGraph(
        dataset_id=dataset_id,
        analysis_id=analysis_id,
        evidence=scoped_evidence,
        relationships=sorted_relationships
    )
