import uuid
from typing import Dict, Any, List, Optional
from backend.domain.contracts import (
    InsightItem,
    EvidenceItem,
    InvestigationContext,
    InvestigationDimension,
    InvestigationResponse
)


def derive_investigation_context(
    dataset_id: str,
    analysis_id: str,
    insight: Optional[InsightItem] = None,
    understanding: Optional[Dict[str, Any]] = None,
    evidence_items: Optional[List[EvidenceItem]] = None,
    target_col: Optional[str] = None
) -> InvestigationContext:
    """
    Deterministically derives a contextual investigation workspace from an Insight's
    underlying evidence and available dataset dimensions (segments, regions, categories, time).
    Never invents arbitrary investigation paths or dimensions outside the dataset schema.
    """
    col_profiles = understanding.get("column_profiles", []) if understanding else []
    candidate_targets = understanding.get("candidate_targets", []) if understanding else []
    temporal_cols = understanding.get("temporal_columns", []) if understanding else []

    # 1. Determine Primary Feature
    primary_feature = "Overview"
    if insight:
        if insight.actionable_investigation_target:
            primary_feature = insight.actionable_investigation_target
        elif insight.related_columns:
            primary_feature = insight.related_columns[0]
    elif evidence_items:
        drv_evs = [e for e in evidence_items if e.category == "driver"]
        if drv_evs and drv_evs[0].related_columns:
            primary_feature = drv_evs[0].related_columns[0]
        elif candidate_targets:
            primary_feature = candidate_targets[0]

    # 2. Identify Valid Investigation Dimensions
    relevant_dimensions: List[InvestigationDimension] = []
    seen_dims = set()

    # Prioritize categorical dimensions (segments, tiers, channels) and temporal columns
    for prof in col_profiles:
        name = prof.get("name", "")
        inferred_type = prof.get("inferred_type", "")
        cardinality = prof.get("cardinality", "")
        unique_cnt = prof.get("unique_count", 0)
        samples = prof.get("sample_values", [])

        if name == primary_feature or name in seen_dims:
            continue

        # Check for temporal dimension
        if prof.get("is_temporal") or inferred_type == "temporal" or name in temporal_cols:
            seen_dims.add(name)
            relevant_dimensions.append(InvestigationDimension(
                dimension=name,
                dimension_type="temporal",
                distinct_count=unique_cnt,
                sample_values=samples[:4],
                rationale=f"Track progression of '{primary_feature}' across chronological intervals."
            ))
            continue

        # Check for categorical segment dimensions
        if inferred_type in ["categorical", "boolean"] or cardinality in ["binary", "low", "moderate"]:
            if 2 <= unique_cnt <= 30:
                dim_type = "segment" if any(kw in name.lower() for kw in ["segment", "tier", "plan", "type", "contract", "region", "department", "category", "status"]) else "categorical"
                seen_dims.add(name)
                relevant_dimensions.append(InvestigationDimension(
                    dimension=name,
                    dimension_type=dim_type,
                    distinct_count=unique_cnt,
                    sample_values=samples[:4],
                    rationale=f"Break down '{primary_feature}' variance across {name} cohorts ({unique_cnt} distinct groups)."
                ))

    # 3. Construct Deterministic Drill-Down Path
    drill_down_path = [primary_feature]
    segment_dims = [d.dimension for d in relevant_dimensions if d.dimension_type == "segment"]
    temporal_dims = [d.dimension for d in relevant_dimensions if d.dimension_type == "temporal"]
    other_dims = [d.dimension for d in relevant_dimensions if d.dimension not in segment_dims and d.dimension not in temporal_dims]

    if segment_dims:
        drill_down_path.append(segment_dims[0])
    if temporal_dims:
        drill_down_path.append(temporal_dims[0])
    elif other_dims:
        drill_down_path.append(other_dims[0])

    # 4. Collect Supporting Evidence IDs
    supporting_ev_ids = []
    if insight and insight.evidence_ids:
        supporting_ev_ids.extend(insight.evidence_ids)
    elif evidence_items:
        matching = [e.evidence_id for e in evidence_items if primary_feature in e.related_columns]
        supporting_ev_ids.extend(matching[:3])

    # 5. Suggested Target for Contextual Prediction
    suggested_target = target_col
    if not suggested_target:
        if candidate_targets:
            suggested_target = candidate_targets[0]
        elif primary_feature in [p.get("name") for p in col_profiles if p.get("is_candidate_target")]:
            suggested_target = primary_feature
        else:
            suggested_target = primary_feature

    summary_text = (
        f"Investigation path for '{primary_feature}' structured across {len(relevant_dimensions)} available dimensions. "
        f"Recommended drill-down path: {' → '.join(drill_down_path)}."
    )

    return InvestigationContext(
        investigation_id=f"inv-{uuid.uuid4().hex[:6]}",
        insight_id=insight.insight_id if insight else None,
        dataset_id=dataset_id,
        analysis_id=analysis_id,
        primary_feature=primary_feature,
        target_feature=suggested_target,
        relevant_dimensions=relevant_dimensions[:5],
        drill_down_path=drill_down_path,
        supporting_evidence_ids=supporting_ev_ids,
        summary=summary_text,
        suggested_prediction_target=suggested_target
    )
