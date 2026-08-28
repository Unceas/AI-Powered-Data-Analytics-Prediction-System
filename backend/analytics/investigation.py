import uuid
from typing import Dict, Any, List, Optional
from backend.domain.contracts import (
    InsightItem,
    EvidenceItem,
    InvestigationContext,
    InvestigationDimension,
    InvestigationNode,
    InvestigationResponse,
    InvestigationStepResponse
)


def derive_investigation_context(
    dataset_id: str,
    analysis_id: str,
    insight: Optional[InsightItem] = None,
    understanding: Optional[Dict[str, Any]] = None,
    evidence_items: Optional[List[EvidenceItem]] = None,
    target_col: Optional[str] = None,
    analytics_data: Optional[Dict[str, Any]] = None
) -> InvestigationContext:
    """
    Deterministically derives a contextual investigation workspace and initializes
    the root node of the Progressive Decomposition Chain.
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
            if 2 <= unique_cnt <= 50:
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

    inv_id = f"inv-{uuid.uuid4().hex[:6]}"
    root_node_id = f"node-root-{uuid.uuid4().hex[:6]}"
    available_dims = [d.dimension for d in relevant_dimensions[:4]]

    # Initialize Root Finding Node
    root_node = InvestigationNode(
        node_id=root_node_id,
        investigation_id=inv_id,
        type="finding",
        label=insight.title if insight else f"Investigation: {primary_feature}",
        value=insight.summary if insight else summary_text,
        related_columns=insight.related_columns if (insight and insight.related_columns) else [primary_feature],
        evidence_ids=supporting_ev_ids,
        parent_node_id=None,
        depth=0,
        available_next_dimensions=available_dims,
        description=insight.why_it_matters if insight else summary_text
    )

    return InvestigationContext(
        investigation_id=inv_id,
        insight_id=insight.insight_id if insight else None,
        dataset_id=dataset_id,
        analysis_id=analysis_id,
        primary_feature=primary_feature,
        target_feature=suggested_target,
        relevant_dimensions=relevant_dimensions[:5],
        drill_down_path=drill_down_path,
        supporting_evidence_ids=supporting_ev_ids,
        summary=summary_text,
        suggested_prediction_target=suggested_target,
        nodes=[root_node],
        root_node_id=root_node_id,
        active_node_id=root_node_id
    )


def decompose_investigation_step(
    dataset_id: str,
    analysis_id: str,
    investigation_id: str,
    dimension: str,
    parent_node_id: Optional[str] = None,
    current_nodes: Optional[List[InvestigationNode]] = None,
    understanding: Optional[Dict[str, Any]] = None,
    analytics_data: Optional[Dict[str, Any]] = None,
    evidence_items: Optional[List[EvidenceItem]] = None,
    source_insight: Optional[InsightItem] = None
) -> InvestigationStepResponse:
    """
    Deterministically computes a single progressive decomposition step (Dimension -> Observation -> Evidence/Next Dimensions).
    Adheres strictly to INVESTIGATION INTEGRITY RULES:
    1. Every observation contains measurable analytical values or statistics.
    2. Identifies dataset columns used.
    3. Reproducible from underlying dataset/analysis aggregates.
    4. Never claims causality from correlation.
    5. Returns 'No supported decomposition available' if analytical data is insufficient.
    """
    col_profiles = understanding.get("column_profiles", []) if understanding else []
    total_rows = understanding.get("row_count", 1) if understanding else 1

    # 1. Validate Dimension Exists in Dataset Profiles
    matching_profile = next((p for p in col_profiles if p.get("name") == dimension), None)
    if not matching_profile:
        # Invalid / non-existent dimension requested
        error_node = InvestigationNode(
            node_id=f"node-err-{uuid.uuid4().hex[:6]}",
            investigation_id=investigation_id,
            type="observation",
            label="Invalid Dimension",
            value="Unknown",
            description=f"No supported decomposition available. Column '{dimension}' does not exist in dataset schema.",
            related_columns=[],
            evidence_ids=[],
            parent_node_id=parent_node_id,
            depth=len(current_nodes or []) + 1,
            available_next_dimensions=[],
            is_terminal=True
        )
        return InvestigationStepResponse(
            status="error",
            message=f"Dimension '{dimension}' is not a valid dataset column.",
            investigation_id=investigation_id,
            new_nodes=[error_node],
            all_nodes=(current_nodes or []) + [error_node],
            available_next_dimensions=[],
            supporting_evidence_ids=[],
            is_terminal=True
        )

    # Calculate Current Depth and Used Dimensions in Ancestor Chain
    existing_nodes = list(current_nodes or [])
    used_dimensions = {node.value for node in existing_nodes if node.type == "dimension"}
    used_dimensions.add(dimension)
    current_depth = len(existing_nodes)

    # 2. Extract Measurable Analytical Aggregate
    metric_name: Optional[str] = None
    metric_value: Optional[Any] = None
    observation_label = f"{dimension} Analysis"
    observation_desc = ""
    matched_evidence_ids: List[str] = []

    # Check for verified evidence referencing this dimension
    if evidence_items:
        dim_evidence = [e for e in evidence_items if dimension in e.related_columns or e.metric_name == dimension]
        for ev in dim_evidence:
            if ev.evidence_id not in matched_evidence_ids:
                matched_evidence_ids.append(ev.evidence_id)

    # Priority A: Check Categorical Summaries / Frequencies in Analytics Data
    cat_summaries = analytics_data.get("categorical_summaries", {}) if isinstance(analytics_data, dict) else {}
    if dimension in cat_summaries and isinstance(cat_summaries[dimension], dict) and cat_summaries[dimension]:
        summary_dict = cat_summaries[dimension]
        # Find top cohort by frequency count
        top_cohort, count_val = max(summary_dict.items(), key=lambda item: item[1] if isinstance(item[1], (int, float)) else 0)
        pct = round((count_val / total_rows) * 100, 1) if total_rows > 0 else 0.0
        metric_name = "cohort_record_count"
        metric_value = count_val
        observation_label = f"{dimension}: {top_cohort}"
        observation_desc = f"Distribution analysis indicates '{top_cohort}' accounts for the largest observed concentration ({count_val} records, {pct}% of dataset)."

    # Priority B: Check Distributions in Analytics Data
    elif isinstance(analytics_data, dict) and "distributions" in analytics_data and dimension in analytics_data["distributions"]:
        dist = analytics_data["distributions"][dimension]
        mean_val = round(dist.get("mean", 0), 2)
        std_val = round(dist.get("std", 0), 2)
        metric_name = "mean_distribution"
        metric_value = mean_val
        observation_label = f"{dimension} Distribution"
        observation_desc = f"Observed distribution metrics for '{dimension}': mean = {mean_val}, standard deviation = {std_val}."

    # Priority C: Check Correlation Matrix
    elif isinstance(analytics_data, dict) and "correlation_matrix" in analytics_data and dimension in analytics_data["correlation_matrix"]:
        corr_row = analytics_data["correlation_matrix"][dimension]
        # Find strongest non-self correlation
        other_corrs = {k: abs(v) for k, v in corr_row.items() if k != dimension and isinstance(v, (int, float))}
        if other_corrs:
            top_partner, r_mag = max(other_corrs.items(), key=lambda x: x[1])
            actual_r = round(corr_row[top_partner], 3)
            metric_name = "pearson_r"
            metric_value = actual_r
            observation_label = f"Correlation: {dimension} & {top_partner}"
            observation_desc = f"Observed linear relationship between '{dimension}' and '{top_partner}' is r = {actual_r}."

    # Priority D: Check matched evidence
    elif matched_evidence_ids and evidence_items:
        primary_ev = next(e for e in evidence_items if e.evidence_id == matched_evidence_ids[0])
        metric_name = primary_ev.metric_name
        metric_value = primary_ev.metric_value
        observation_label = primary_ev.title
        observation_desc = f"Analytical evidence indicates: {primary_ev.description}"

    else:
        # Rule 6: Insufficient analytical data exists -> return explicit grounded message
        observation_label = f"{dimension} Breakdown"
        observation_desc = f"No supported decomposition available for '{dimension}' in current analytical aggregates."
        metric_name = "data_availability"
        metric_value = "insufficient"

    # 3. Derive Next Available Dimensions (excluding already used dimensions)
    available_next_dims: List[str] = []
    for prof in col_profiles:
        p_name = prof.get("name", "")
        p_type = prof.get("inferred_type", "")
        p_card = prof.get("cardinality", "")
        p_temporal = prof.get("is_temporal", False)
        if p_name not in used_dimensions and (p_type in ["categorical", "temporal", "boolean"] or p_temporal or p_card in ["binary", "low", "moderate"]):
            if p_name not in available_next_dims:
                available_next_dims.append(p_name)

    # 4. Construct Progressive Investigation Nodes
    dim_node_id = f"node-dim-{uuid.uuid4().hex[:6]}"
    obs_node_id = f"node-obs-{uuid.uuid4().hex[:6]}"

    # Node 1: Dimension Node
    dimension_node = InvestigationNode(
        node_id=dim_node_id,
        investigation_id=investigation_id,
        type="dimension",
        label=f"Break down by {dimension}",
        value=dimension,
        related_columns=[dimension],
        evidence_ids=[],
        parent_node_id=parent_node_id,
        depth=current_depth + 1,
        available_next_dimensions=[],
        description=f"Decomposing investigation along dataset dimension '{dimension}'."
    )

    # Determine if this step should terminate with Evidence
    is_terminal = (len(available_next_dims) == 0) or (current_depth >= 4) or (len(matched_evidence_ids) > 0 and len(available_next_dims) <= 1)
    
    # Node 2: Observation Node
    observation_node = InvestigationNode(
        node_id=obs_node_id,
        investigation_id=investigation_id,
        type="observation",
        label=observation_label,
        value=metric_value,
        related_columns=[dimension],
        evidence_ids=matched_evidence_ids,
        parent_node_id=dim_node_id,
        depth=current_depth + 2,
        available_next_dimensions=available_next_dims[:3] if not is_terminal else [],
        description=observation_desc,
        metric_name=metric_name,
        metric_value=metric_value,
        is_terminal=is_terminal
    )

    new_nodes = [dimension_node, observation_node]

    # Node 3: Optional Terminal Evidence Node
    if is_terminal and matched_evidence_ids:
        ev_node_id = f"node-ev-{uuid.uuid4().hex[:6]}"
        evidence_node = InvestigationNode(
            node_id=ev_node_id,
            investigation_id=investigation_id,
            type="evidence",
            label=f"Verified Evidence ({len(matched_evidence_ids)} items)",
            value=len(matched_evidence_ids),
            related_columns=[dimension],
            evidence_ids=matched_evidence_ids,
            parent_node_id=obs_node_id,
            depth=current_depth + 3,
            available_next_dimensions=[],
            description="Observations substantiated by verified analytical evidence items.",
            is_terminal=True
        )
        new_nodes.append(evidence_node)

    all_nodes = existing_nodes + new_nodes

    return InvestigationStepResponse(
        status="success",
        message=f"Decomposed investigation along '{dimension}'.",
        investigation_id=investigation_id,
        new_nodes=new_nodes,
        all_nodes=all_nodes,
        available_next_dimensions=observation_node.available_next_dimensions,
        supporting_evidence_ids=matched_evidence_ids,
        is_terminal=is_terminal
    )
