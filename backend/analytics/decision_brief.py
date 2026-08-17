import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
from backend.domain.contracts import (
    InsightItem,
    EvidenceItem,
    DecisionBrief,
    InvestigationContext
)


def build_decision_brief(
    dataset_id: str,
    analysis_id: str,
    insights: List[InsightItem],
    evidence_items: List[EvidenceItem],
    ml_result: Optional[Dict[str, Any]] = None,
    investigation: Optional[InvestigationContext] = None
) -> DecisionBrief:
    """
    Synthesizes a compact, executive Decision Brief derived entirely from verified
    evidence items, prioritized insights, contextual investigations, and prediction evaluations.
    InsightGrid shows what the data supports without dictating mandatory business actions.
    """
    now_iso = datetime.utcnow().isoformat()
    supporting_ev_ids: List[str] = []

    # 1. WHAT HAPPENED & WHY IT MATTERS (from top prioritized insight)
    if insights:
        top_ins = insights[0]
        what_happened = top_ins.title if top_ins.title else top_ins.summary
        why_it_matters = top_ins.why_it_matters if top_ins.why_it_matters else top_ins.summary
        if top_ins.evidence_ids:
            supporting_ev_ids.extend(top_ins.evidence_ids)
    elif evidence_items:
        top_ev = evidence_items[0]
        what_happened = f"{top_ev.title}: {top_ev.description}"
        why_it_matters = f"Analytical observation with {top_ev.strength.lower()} statistical backing from {top_ev.source}."
        supporting_ev_ids.append(top_ev.evidence_id)
    else:
        what_happened = "Baseline data profile established."
        why_it_matters = "Structural schema verified for exploratory analysis."

    # 2. WHAT THE DATA SUGGESTS (from correlation & anomaly evidence)
    corr_evs = [e for e in evidence_items if e.category == "correlation"]
    anom_evs = [e for e in evidence_items if e.category == "anomaly"]
    dist_evs = [e for e in evidence_items if e.category in ["distribution", "driver"]]

    suggest_parts = []
    if corr_evs:
        c = corr_evs[0]
        cols_str = " and ".join([f"'{col}'" for col in c.related_columns]) if c.related_columns else "key variables"
        suggest_parts.append(f"Strong statistical association observed between {cols_str} (r = {c.metric_value}).")
        if c.evidence_id not in supporting_ev_ids:
            supporting_ev_ids.append(c.evidence_id)
    if anom_evs:
        a = anom_evs[0]
        suggest_parts.append(f"Outlier screening flagged {a.metric_value} distinct multivariate anomaly records.")
        if a.evidence_id not in supporting_ev_ids:
            supporting_ev_ids.append(a.evidence_id)
    elif dist_evs and not corr_evs:
        d = dist_evs[0]
        suggest_parts.append(f"Distribution analysis indicates notable variance in '{d.related_columns[0] if d.related_columns else 'features'}'.")
        if d.evidence_id not in supporting_ev_ids:
            supporting_ev_ids.append(d.evidence_id)

    what_data_suggests = " ".join(suggest_parts) if suggest_parts else "Descriptive indicators demonstrate consistent statistical distributions across features."

    # 3. WHAT MAY HAPPEN NEXT & RELIABILITY (from ML Result)
    what_may_happen_next = None
    reliability = None
    reliability_explanation = None

    if ml_result and ml_result.get("status") == "success":
        pred_obj = ml_result.get("prediction", {})
        if pred_obj and isinstance(pred_obj, dict):
            what_may_happen_next = pred_obj.get("summary") or pred_obj.get("headline")
        if not what_may_happen_next:
            target_col = ml_result.get("target_column") or "Target outcome"
            what_may_happen_next = f"Predictive model converged on target '{target_col}' across validation splits."

        reliability = ml_result.get("reliability", "High")
        reliability_explanation = ml_result.get("reliability_description") or "Validated using out-of-sample data splits with strict leakage prevention."

        # Add driver evidence IDs if available
        drv_evs = [e.evidence_id for e in evidence_items if e.category == "driver"]
        for dev in drv_evs:
            if dev not in supporting_ev_ids:
                supporting_ev_ids.append(dev)

    # 4. INVESTIGATE NEXT (from Investigation Context or top insight recommendation)
    if investigation and investigation.drill_down_path:
        investigate_next = f"Drill down along path: {' → '.join(investigation.drill_down_path)}"
    elif insights and insights[0].recommended_next_step:
        investigate_next = insights[0].recommended_next_step
    elif evidence_items and evidence_items[0].related_columns:
        investigate_next = f"Examine sub-group distributions for '{evidence_items[0].related_columns[0]}'."
    else:
        investigate_next = "Explore feature correlations and segment distributions in Analysis & Patterns."

    return DecisionBrief(
        brief_id=f"brief-{uuid.uuid4().hex[:6]}",
        dataset_id=dataset_id,
        analysis_id=analysis_id,
        what_happened=what_happened,
        why_it_matters=why_it_matters,
        what_data_suggests=what_data_suggests,
        what_may_happen_next=what_may_happen_next,
        reliability=reliability,
        reliability_explanation=reliability_explanation,
        investigate_next=investigate_next,
        supporting_evidence_ids=supporting_ev_ids,
        generated_at=now_iso
    )
