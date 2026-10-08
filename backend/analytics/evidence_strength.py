from typing import Dict, Any, List, Optional, Tuple, Set
from backend.domain.contracts import (
    EvidenceItem,
    EvidenceRelationship,
    EvidenceStrength,
    InsightItem
)


def evaluate_evidence_strength(
    evidence_item: EvidenceItem,
    relationships: Optional[List[EvidenceRelationship]] = None,
    understanding: Optional[Dict[str, Any]] = None,
    target_col: Optional[str] = None
) -> EvidenceStrength:
    """
    Deterministically evaluates the analytical strength of an individual EvidenceItem.
    
    Principles:
    1. Score is an internal deterministic heuristic (0.0 - 100.0), NOT a probability.
    2. Builds on verified statistical signals, sample size, data quality, and graph relationships.
    3. Prevents double-counting of derived evidence lineages.
    4. Materially penalizes verified contradictions.
    """
    score = 0.0
    supporting_factors: List[str] = []
    limiting_factors: List[str] = []

    # 1. Base Statistical Strength from EvidenceItem
    if evidence_item.strength == "High":
        score += 45.0
        supporting_factors.append("High statistical signal classified by analysis engine")
    elif evidence_item.strength == "Medium":
        score += 28.0
        supporting_factors.append("Moderate statistical signal classified by analysis engine")
    else:
        score += 10.0
        limiting_factors.append("Low baseline signal strength")

    # 2. Category-Specific Statistical Metric Magnitudes
    cat = evidence_item.category.lower()
    val = evidence_item.metric_value

    if cat == "correlation" and isinstance(val, (int, float)):
        abs_r = abs(float(val))
        if abs_r >= 0.65:
            score += 12.0
            supporting_factors.append(f"Strong linear association (|r| = {round(abs_r, 3)} >= 0.65)")
        elif abs_r >= 0.40:
            score += 6.0
            supporting_factors.append(f"Moderate linear association (|r| = {round(abs_r, 3)})")
        elif abs_r < 0.20:
            score -= 10.0
            limiting_factors.append(f"Weak linear correlation (|r| = {round(abs_r, 3)} < 0.20)")

    elif cat == "anomaly" and isinstance(val, (int, float)):
        anom_cnt = int(val)
        if anom_cnt >= 20:
            score += 10.0
            supporting_factors.append(f"High-density anomaly cluster ({anom_cnt} verified records)")
        elif anom_cnt < 5:
            score -= 8.0
            limiting_factors.append(f"Sparse anomaly count ({anom_cnt} records)")

    elif cat == "driver" and isinstance(val, (int, float)):
        imp = float(val)
        tech_infl = str(evidence_item.technical_details.get("influence", "")) if evidence_item.technical_details else ""
        if imp >= 0.25 or "High" in tech_infl:
            score += 12.0
            supporting_factors.append(f"Primary predictive factor attribution (importance = {round(imp, 3)})")
        elif imp < 0.05:
            score -= 8.0
            limiting_factors.append(f"Marginal predictive importance ({round(imp, 3)})")

    elif cat == "distribution" and isinstance(val, (int, float)):
        skew = abs(float(val))
        if skew >= 1.5:
            score += 8.0
            supporting_factors.append(f"Marked distribution asymmetry (skew = {round(skew, 2)})")

    elif cat == "quality":
        if evidence_item.metric_name == "missing_percentage" and isinstance(val, (int, float)):
            if float(val) >= 30.0:
                score += 10.0
                supporting_factors.append(f"Severe missingness concentration ({round(float(val), 1)}%)")
        elif evidence_item.metric_name == "duplicate_rows_count" and isinstance(val, (int, float)):
            if int(val) >= 10:
                score += 8.0
                supporting_factors.append(f"Elevated duplicate row count ({int(val)})")

    # 3. Sample Size Support
    sample_size = None
    if evidence_item.provenance and "sample_size" in evidence_item.provenance:
        try:
            sample_size = int(evidence_item.provenance["sample_size"])
        except (ValueError, TypeError):
            pass
    if sample_size is None and understanding and "row_count" in understanding:
        sample_size = int(understanding.get("row_count", 0))

    if sample_size is not None and sample_size > 0:
        if sample_size >= 200:
            score += 15.0
            supporting_factors.append(f"Reliable sample size (N = {sample_size} >= 200)")
        elif sample_size >= 100:
            score += 6.0
            supporting_factors.append(f"Sufficient sample size (N = {sample_size})")
        elif sample_size < 50:
            score -= 15.0
            limiting_factors.append(f"Small sample size (N = {sample_size} < 50) restricts statistical power")
        elif sample_size < 100:
            score -= 6.0
            limiting_factors.append(f"Modest sample size (N = {sample_size})")

    # 4. Data Quality & Missingness on Related Columns
    if understanding:
        col_profiles = understanding.get("column_profiles", [])
        prof_map = {p.get("name"): p for p in col_profiles if isinstance(p, dict)}
        
        has_high_nulls = False
        all_zero_nulls = True
        for col in evidence_item.related_columns:
            if col in prof_map:
                miss_pct = float(prof_map[col].get("missing_percentage", 0.0))
                if miss_pct >= 20.0:
                    has_high_nulls = True
                    limiting_factors.append(f"High missingness in feature '{col}' ({round(miss_pct, 1)}%)")
                if miss_pct > 0.0:
                    all_zero_nulls = False

        if has_high_nulls:
            score -= 15.0
        elif all_zero_nulls and evidence_item.related_columns and understanding.get("quality_score", 100) >= 85:
            score += 8.0
            supporting_factors.append("High data completeness with zero missing values")

    # 5. Target Relevance
    if target_col and target_col in evidence_item.related_columns:
        score += 10.0
        supporting_factors.append(f"Direct relevance to candidate target variable '{target_col}'")

    # 6. Graph Relationships Evaluation
    rel_count = 0
    corrob_count = 0
    contra_count = 0

    if relationships:
        # Enforce strict dataset and analysis isolation
        active_rels = [
            r for r in relationships
            if r.dataset_id == evidence_item.dataset_id
            and r.analysis_id == evidence_item.analysis_id
            and (r.source_evidence_id == evidence_item.evidence_id or r.target_evidence_id == evidence_item.evidence_id)
        ]
        rel_count = len(active_rels)

        # Identify derivation chain links (to prevent double-counting)
        derived_partner_ids: Set[str] = set()
        for r in active_rels:
            if r.relationship_type == "derived_from":
                other_id = r.target_evidence_id if r.source_evidence_id == evidence_item.evidence_id else r.source_evidence_id
                derived_partner_ids.add(other_id)

        for r in active_rels:
            other_id = r.target_evidence_id if r.source_evidence_id == evidence_item.evidence_id else r.source_evidence_id

            if r.relationship_type == "contradicts":
                contra_count += 1
                score -= 35.0
                limiting_factors.append(f"Contradicted by verified analytical evidence '{other_id}'")

            elif r.relationship_type in ("corroborates", "supports"):
                if other_id in derived_partner_ids:
                    # Do not double-count derived links as independent corroboration
                    limiting_factors.append(f"Derivation chain link with '{other_id}' (not counted as independent corroboration)")
                else:
                    corrob_count += 1
                    supporting_factors.append(f"Corroborated by independent evidence '{other_id}'")

        # Independent corroboration bonus (capped at +20)
        score += min(20.0, corrob_count * 10.0)

    # 7. Bound Heuristic Score (0.0 to 100.0)
    bounded_score = max(0.0, min(100.0, round(score, 1)))

    # 8. Strength Level Classification
    if contra_count > 0:
        strength_level = "conflicting"
    elif bounded_score >= 65.0:
        strength_level = "strong"
    elif bounded_score >= 35.0:
        strength_level = "moderate"
    else:
        strength_level = "limited"

    return EvidenceStrength(
        evidence_id=evidence_item.evidence_id,
        strength=strength_level,
        score=bounded_score,
        supporting_factors=supporting_factors,
        limiting_factors=limiting_factors,
        relationship_count=rel_count,
        corroboration_count=corrob_count,
        contradiction_count=contra_count
    )


def batch_evaluate_evidence_strengths(
    evidence_items: List[EvidenceItem],
    relationships: Optional[List[EvidenceRelationship]] = None,
    understanding: Optional[Dict[str, Any]] = None,
    target_col: Optional[str] = None
) -> Dict[str, EvidenceStrength]:
    """
    Evaluates evidence strength for a collection of evidence items deterministically.
    """
    result: Dict[str, EvidenceStrength] = {}
    if not evidence_items:
        return result

    for item in evidence_items:
        result[item.evidence_id] = evaluate_evidence_strength(
            evidence_item=item,
            relationships=relationships,
            understanding=understanding,
            target_col=target_col
        )
    return result


def evaluate_finding_confidence(
    insight: InsightItem,
    evidence_strengths: Dict[str, EvidenceStrength],
    relationships: Optional[List[EvidenceRelationship]] = None,
    understanding: Optional[Dict[str, Any]] = None
) -> Tuple[str, str, List[str], List[str], List[str]]:
    """
    Deterministically evaluates finding confidence for an InsightItem.
    
    Returns:
    (finding_confidence, confidence_reason, supporting_evidence_ids, contradicting_evidence_ids, improvement_suggestions)
    """
    # 1. Identify Supporting Evidence IDs (strictly within same dataset/analysis)
    supporting_ids: List[str] = []
    if insight.evidence_ids:
        for eid in insight.evidence_ids:
            if eid in evidence_strengths and eid not in supporting_ids:
                supporting_ids.append(eid)
    if insight.evidence_items:
        for ev in insight.evidence_items:
            if ev.evidence_id in evidence_strengths and ev.evidence_id not in supporting_ids:
                supporting_ids.append(ev.evidence_id)

    # 2. Identify Contradicting Evidence IDs
    contradicting_ids: Set[str] = set()
    derived_links: Set[Tuple[str, str]] = set()

    if relationships:
        active_rels = [
            r for r in relationships
            if r.dataset_id == insight.dataset_id and r.analysis_id == insight.analysis_id
        ]
        supp_set = set(supporting_ids)

        for r in active_rels:
            if r.relationship_type == "derived_from":
                derived_links.add((r.source_evidence_id, r.target_evidence_id))
                derived_links.add((r.target_evidence_id, r.source_evidence_id))

            if r.relationship_type == "contradicts":
                if r.source_evidence_id in supp_set and r.target_evidence_id not in supp_set:
                    contradicting_ids.add(r.target_evidence_id)
                elif r.target_evidence_id in supp_set and r.source_evidence_id not in supp_set:
                    contradicting_ids.add(r.source_evidence_id)
                elif r.source_evidence_id in supp_set and r.target_evidence_id in supp_set:
                    # Both are in supporting evidence, meaning internal contradiction!
                    contradicting_ids.add(r.target_evidence_id)

    sorted_contradicting_ids = sorted(list(contradicting_ids))

    # 3. Independent Lineages Partitioning (Anti-Double-Counting)
    # Evidence items connected by derived_from belong to the same lineage
    lineages: List[Set[str]] = []
    for eid in supporting_ids:
        merged = False
        for lineage in lineages:
            if any((eid, partner) in derived_links for partner in lineage):
                lineage.add(eid)
                merged = True
                break
        if not merged:
            lineages.append({eid})

    independent_signal_count = len(lineages)

    # 4. Strength Breakdown
    strong_count = sum(1 for eid in supporting_ids if evidence_strengths[eid].strength == "strong")
    moderate_count = sum(1 for eid in supporting_ids if evidence_strengths[eid].strength == "moderate")
    limited_count = sum(1 for eid in supporting_ids if evidence_strengths[eid].strength == "limited")

    # 5. Check Sample and Quality Limitations
    has_sample_limit = any(
        any("small sample" in f.lower() for f in evidence_strengths[eid].limiting_factors)
        for eid in supporting_ids
    )
    has_quality_limit = any(
        any("missingness" in f.lower() or "poor quality" in f.lower() for f in evidence_strengths[eid].limiting_factors)
        for eid in supporting_ids
    )

    # 6. Determine Finding Confidence Level & Deterministic Explanation
    if len(sorted_contradicting_ids) > 0 and len(supporting_ids) > 0:
        confidence = "conflicting"
        reason = "Evidence supports this finding, but verified analytical evidence indicates a conflicting relationship on shared features."

    elif len(supporting_ids) == 0:
        confidence = "low"
        reason = "No direct verified evidence items are linked to substantiate this finding."

    elif strong_count >= 1 and independent_signal_count >= 2 and not has_sample_limit and not has_quality_limit:
        confidence = "high"
        reason = "Supported by multiple independent analytical signals with no verified contradictory evidence."

    elif strong_count >= 1 and any(evidence_strengths[eid].corroboration_count >= 1 for eid in supporting_ids) and not has_sample_limit and not has_quality_limit:
        confidence = "high"
        reason = "Supported by strong analytical evidence and verified independent corroboration."

    elif strong_count >= 1 or moderate_count >= 1:
        confidence = "medium"
        if has_sample_limit:
            reason = "Supported by analytical evidence, but constrained by small sample size."
        elif has_quality_limit:
            reason = "Supported by analytical evidence, but limited by feature missingness or data quality."
        elif independent_signal_count == 1:
            reason = "Supported by a single verified analytical signal; lacking corroboration from independent dimensions."
        else:
            reason = "Supported by useful analytical evidence, but supporting signals remain moderate."

    else:
        confidence = "low"
        reason = "Available evidence is limited or single-faceted; this finding should be interpreted cautiously."

    # 7. Grounded Confidence Improvement Suggestions ("What would increase confidence?")
    # Strictly derived from real dataset columns in understanding, zero hallucinations
    suggestions: List[str] = []
    if understanding:
        temporal_cols = understanding.get("temporal_columns", [])
        col_profiles = understanding.get("column_profiles", [])
        row_count = int(understanding.get("row_count", 0))
        used_cols = set(insight.related_columns)

        # A. Temporal Validation
        if temporal_cols:
            unused_temporal = [t for t in temporal_cols if t not in used_cols]
            if unused_temporal:
                suggestions.append(f"Temporal validation across '{unused_temporal[0]}' could verify if this pattern persists over chronological intervals.")

        # B. Cohort Segmentation Check
        if col_profiles:
            candidate_cohort_dims = [
                p.get("name") for p in col_profiles
                if isinstance(p, dict)
                and p.get("name") not in used_cols
                and (p.get("inferred_type") in ("categorical", "boolean") or p.get("cardinality") in ("binary", "low", "moderate"))
                and 2 <= p.get("unique_count", 0) <= 25
            ]
            if candidate_cohort_dims:
                suggestions.append(f"Cross-segmentation analysis across '{candidate_cohort_dims[0]}' could test whether this pattern holds across distinct cohorts.")

        # C. Sample Size Suggestion
        if 0 < row_count < 200:
            suggestions.append(f"Expanding dataset observations beyond {row_count} rows would increase statistical significance.")

        # D. Missingness Resolution
        if col_profiles and used_cols:
            prof_dict = {p.get("name"): p for p in col_profiles if isinstance(p, dict)}
            for col in sorted(list(used_cols)):
                if col in prof_dict:
                    miss_pct = float(prof_dict[col].get("missing_percentage", 0.0))
                    if miss_pct >= 15.0:
                        suggestions.append(f"Imputing or reducing null values in '{col}' ({round(miss_pct, 1)}% missing) would enhance data completeness.")
                        break

    if not suggestions:
        suggestions.append("Cross-validating this feature against additional operational dimensions would enhance evidentiary confidence.")

    return (
        confidence,
        reason,
        supporting_ids,
        sorted_contradicting_ids,
        suggestions[:3]
    )
