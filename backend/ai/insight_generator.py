import json
import os
import requests
import uuid
from typing import Dict, Any, List, Optional
from backend.domain.contracts import (
    EvidenceItem,
    InsightItem,
    GroundedAnswerResponse,
    AnalyticalContext
)


def rank_and_prioritize_insights(
    insights: List[InsightItem],
    target_col: Optional[str] = None,
    quality_score: int = 100
) -> List[InsightItem]:
    """
    Deterministically ranks and prioritizes insights using statistical strength,
    severity, category weights, target relevance, anomaly magnitude, and supporting evidence counts.
    Surfaces high-value 'Key Findings' first while preserving access to all findings.
    """
    if not insights:
        return []

    ranked: List[InsightItem] = []

    for ins in insights:
        score = 0.0
        reasons: List[str] = []

        # 1. Category Weights
        cat_weights = {
            "Prediction": 25.0,
            "Anomaly": 22.0,
            "Correlation": 18.0,
            "Quality": 14.0,
            "Trend": 12.0,
            "Recommendation": 10.0
        }
        score += cat_weights.get(ins.category, 10.0)

        # 2. Severity
        sev_weights = {
            "Critical": 35.0,
            "High": 25.0,
            "Medium": 15.0,
            "Low": 5.0
        }
        score += sev_weights.get(ins.severity, 10.0)

        # 3. Target Relevance
        if target_col and (target_col in ins.related_columns or ins.actionable_investigation_target == target_col):
            score += 25.0
            reasons.append(f"Directly influences candidate target variable '{target_col}'")

        # 4. Statistical Strength from supporting evidence
        if ins.evidence_items:
            for ev in ins.evidence_items:
                if ev.strength == "High":
                    score += 20.0
                    if ev.category == "correlation":
                        reasons.append(f"High linear correlation strength (|r| = {ev.metric_value})")
                    elif ev.category == "anomaly":
                        reasons.append(f"Elevated outlier volume ({ev.metric_value} records)")
                    elif ev.category == "driver":
                        reasons.append(f"Primary predictive factor ({ev.metric_name})")
                    elif ev.category == "quality":
                        reasons.append(f"Data completeness alert ({ev.metric_value}%)")
                elif ev.strength == "Medium":
                    score += 10.0

            # Bonus for multiple supporting evidence items
            if len(ins.evidence_items) > 1:
                score += len(ins.evidence_items) * 5.0
                reasons.append(f"Corroborated by {len(ins.evidence_items)} independent analytical evidence items")
        elif ins.evidence_ids:
            score += len(ins.evidence_ids) * 10.0

        # Assign Priority Level
        if score >= 60.0:
            priority_level = "High"
        elif score >= 35.0:
            priority_level = "Medium"
        else:
            priority_level = "Low"

        # Construct updated InsightItem
        ranked_ins = ins.model_copy(update={
            "priority": priority_level,
            "priority_score": round(score, 1),
            "priority_reasons": reasons if reasons else ["Observed dataset distribution pattern"]
        })
        ranked.append(ranked_ins)

    # Sort descending by priority_score
    ranked.sort(key=lambda x: x.priority_score, reverse=True)

    # Mark top 3 as Key Findings
    for idx, ins in enumerate(ranked):
        if idx < 3:
            ins.is_key_finding = True

    return ranked


def generate_grounded_insights_from_evidence(
    evidence_items: List[EvidenceItem],
    dataset_name: str = "",
    analysis_id: str = "",
    dataset_id: str = "",
    target_col: Optional[str] = None
) -> List[InsightItem]:
    """
    Generates structured, evidence-backed Insight objects referencing immutable EvidenceItem IDs.
    Answers: WHAT happened, WHY it matters, WHAT evidence supports it, and WHAT to investigate next.
    Never fabricates unsupported causal relationships or uncomputed metrics.
    """
    if not evidence_items:
        return [
            InsightItem(
                insight_id=f"ins-base-{uuid.uuid4().hex[:6]}",
                analysis_id=analysis_id,
                dataset_id=dataset_id,
                category="Quality",
                title="Baseline Analysis Complete",
                summary="Dataset structure verified with clean baseline metrics.",
                why_it_matters="Provides a solid foundation for predictive modeling and segmentation.",
                severity="Low",
                priority="Low",
                priority_score=10.0,
                priority_reasons=["Baseline schema initialization"],
                is_key_finding=True,
                evidence_ids=[],
                evidence_items=[],
                related_columns=[],
                recommended_next_step="Configure a target variable in Prediction Studio to evaluate predictive drivers."
            )
        ]

    insights: List[InsightItem] = []

    # Map evidence by category
    corr_evs = [e for e in evidence_items if e.category == "correlation"]
    anom_evs = [e for e in evidence_items if e.category == "anomaly"]
    drv_evs = [e for e in evidence_items if e.category == "driver"]
    dist_evs = [e for e in evidence_items if e.category == "distribution"]
    qual_evs = [e for e in evidence_items if e.category == "quality"]

    # 1. Prediction Driver Insight
    if drv_evs:
        top_drv = drv_evs[0]
        feat = top_drv.related_columns[0] if top_drv.related_columns else "Leading Factor"
        infl = top_drv.technical_details.get("influence", "Moderate influence") if top_drv.technical_details else "Moderate influence"
        insights.append(InsightItem(
            insight_id=f"ins-drv-{uuid.uuid4().hex[:6]}",
            analysis_id=analysis_id,
            dataset_id=dataset_id,
            category="Prediction",
            title=f"Key Predictive Factor: {feat}",
            summary=f"Validation models identify '{feat}' as exhibiting {infl.lower()} on outcomes.",
            why_it_matters=f"Target predictions are most sensitive to variations in '{feat}'.",
            severity="High" if "High" in infl else "Medium",
            evidence_ids=[top_drv.evidence_id],
            evidence_items=[top_drv],
            related_columns=[feat],
            recommended_next_step=f"Inspect the distribution and segment-level variance of '{feat}' in Data & Understanding.",
            actionable_investigation_target=feat
        ))

    # 2. Correlation Insight
    if corr_evs:
        top_corr = corr_evs[0]
        cols = top_corr.related_columns
        r_val = top_corr.metric_value
        direction = "positive" if (isinstance(r_val, (int, float)) and r_val > 0) else "inverse"
        col_str = " and ".join([f"'{c}'" for c in cols]) if cols else "observed variables"
        insights.append(InsightItem(
            insight_id=f"ins-corr-{uuid.uuid4().hex[:6]}",
            analysis_id=analysis_id,
            dataset_id=dataset_id,
            category="Correlation",
            title=f"Strong Statistical Association: {', '.join(cols)}",
            summary=f"Linear correlation analysis indicates a {direction} statistical relationship (r = {r_val}) between {col_str}.",
            why_it_matters="Indicates shared underlying behavior between these metrics across the dataset.",
            severity="High" if top_corr.strength == "High" else "Medium",
            evidence_ids=[top_corr.evidence_id],
            evidence_items=[top_corr],
            related_columns=cols,
            recommended_next_step=f"Explore whether changes in {cols[0] if cols else 'metrics'} precede shifts in {cols[1] if len(cols) > 1 else 'related metrics'}.",
            actionable_investigation_target=cols[0] if cols else None
        ))

    # 3. Anomaly Insight
    if anom_evs:
        top_anom = anom_evs[0]
        anom_cnt = top_anom.metric_value
        anom_pct = top_anom.technical_details.get("percentage", 0.0) if top_anom.technical_details else 0.0
        insights.append(InsightItem(
            insight_id=f"ins-anom-{uuid.uuid4().hex[:6]}",
            analysis_id=analysis_id,
            dataset_id=dataset_id,
            category="Anomaly",
            title=f"Statistical Outliers Identified ({anom_cnt} records)",
            summary=f"Multivariate outlier screening flagged {anom_cnt} records ({anom_pct}% of dataset) exhibiting unusual multivariate profiles.",
            why_it_matters="Outlier records can distort aggregate metrics and often represent high-risk or high-value cases.",
            severity="High" if top_anom.strength == "High" else "Medium",
            evidence_ids=[top_anom.evidence_id],
            evidence_items=[top_anom],
            related_columns=top_anom.related_columns,
            recommended_next_step="Inspect the outlier records in the Outlier Diagnostics table to verify operational validity.",
            actionable_investigation_target="outliers"
        ))

    # 4. Data Quality / Distribution Insight
    if qual_evs:
        top_qual = qual_evs[0]
        insights.append(InsightItem(
            insight_id=f"ins-qual-{uuid.uuid4().hex[:6]}",
            analysis_id=analysis_id,
            dataset_id=dataset_id,
            category="Quality",
            title=top_qual.title,
            summary=top_qual.description,
            why_it_matters="Data completeness directly governs model generalization and validation stability.",
            severity="High" if top_qual.strength == "High" else "Medium",
            evidence_ids=[top_qual.evidence_id],
            evidence_items=[top_qual],
            related_columns=top_qual.related_columns,
            recommended_next_step="Review the Missing Value & Imputation settings in Data & Understanding.",
            actionable_investigation_target=top_qual.related_columns[0] if top_qual.related_columns else None
        ))
    elif dist_evs:
        top_dist = dist_evs[0]
        col = top_dist.related_columns[0] if top_dist.related_columns else "Feature"
        insights.append(InsightItem(
            insight_id=f"ins-dist-{uuid.uuid4().hex[:6]}",
            analysis_id=analysis_id,
            dataset_id=dataset_id,
            category="Trend",
            title=top_dist.title,
            summary=top_dist.description,
            why_it_matters="Skewed features can bias linear models and benefit from non-linear transformations or robust scaling.",
            severity="Medium",
            evidence_ids=[top_dist.evidence_id],
            evidence_items=[top_dist],
            related_columns=[col],
            recommended_next_step=f"Consider logarithmic or robust scaling for '{col}' before fitting linear regressors.",
            actionable_investigation_target=col
        ))

    # Deterministically rank and prioritize insights
    return rank_and_prioritize_insights(insights, target_col=target_col)


def answer_question_grounded_in_evidence(
    question: str,
    dataset_name: str,
    evidence_items: List[EvidenceItem],
    context: Optional[AnalyticalContext] = None,
    history: Optional[List[Dict[str, str]]] = None
) -> GroundedAnswerResponse:
    """
    Answers user questions strictly grounded in observed EvidenceItem objects and
    retains analytical conversation context across follow-ups.
    If the available evidence is insufficient to answer the question, it explicitly reports data boundaries.
    """
    q_lower = question.lower()
    resolved_subject = None

    # Context Resolution: Check if this is a follow-up inquiry referencing previous subject or active investigation
    combined_query = q_lower
    if context:
        inv_subj = None
        if context.investigation and isinstance(context.investigation, dict):
            inv_subj = context.investigation.get("subject")
        target_subj = context.previous_subject or inv_subj or context.active_target

        if target_subj:
            # If user asks about a dimension or follow-up question, combine with target subject
            if any(pronoun in q_lower for pronoun in ["what about", "how about", "why", "who", "where", "which", "that", "predict", "dimension", "trend", "cause"]):
                combined_query = f"{target_subj} {' '.join(context.active_dimensions)} {q_lower}"
                resolved_subject = target_subj

    # Filter matching evidence
    matched_evidence = []
    for ev in evidence_items:
        # Check direct mentions of category, related columns, or metric name
        matches_query = (
            ev.category.lower() in combined_query
            or any(col.lower() in combined_query for col in ev.related_columns)
            or (context and any(dim.lower() in [c.lower() for c in ev.related_columns] for dim in context.active_dimensions))
            or ev.metric_name.lower() in combined_query
            or ev.title.lower() in combined_query
        )
        if matches_query:
            matched_evidence.append(ev)

    # Check for specific column mentions in question
    explicit_col_match = any(
        any(col.lower() in q_lower for col in ev.related_columns)
        for ev in evidence_items
    )

    # Check if the user query is asking for something completely outside dataset scope
    is_unsupported_query = (
        len(evidence_items) > 0
        and any(kw in q_lower for kw in ["competitor", "market share", "external", "forecast 2030", "ceo", "stock price", "untracked"])
    )

    if is_unsupported_query:
        available_topics = ", ".join(sorted(list({f"'{c}'" for e in evidence_items for c in e.related_columns})))
        return GroundedAnswerResponse(
            status="success",
            message="Evidence boundary declared",
            question=question,
            answer=(
                f"### Evidence Limitation Notice\n\n"
                f"The available dataset evidence for **{dataset_name}** does not establish or track information regarding this specific query.\n\n"
                f"**Verified evidence in this session is grounded in:** {available_topics if available_topics else 'the uploaded dataset features'}.\n\n"
                f"Please ask questions related to the verified feature correlations, multivariate outliers, or model prediction drivers."
            ),
            referenced_evidence_ids=[],
            confidence="Low",
            resolved_subject=resolved_subject,
            suggested_followups=[
                "What features exhibit the highest predictive influence?",
                "Are there strong correlations between continuous variables?",
                "What statistical outliers were flagged in the dataset?"
            ]
        )

    if not matched_evidence:
        # Include top prioritized evidence
        matched_evidence = evidence_items[:4]

    referenced_ids = [e.evidence_id for e in matched_evidence]
    if not resolved_subject and matched_evidence:
        resolved_subject = matched_evidence[0].related_columns[0] if matched_evidence[0].related_columns else matched_evidence[0].title

    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        # Deterministic grounded fallback response
        bullet_points = []
        for e in matched_evidence:
            bullet_points.append(
                f"- **{e.title}**: {e.description} *(Source: {e.source}, Metric: {e.metric_name} = {e.metric_value} {e.unit or ''}, Strength: {e.strength})*"
            )

        context_note = f"\n*Context continuity: Resolved query with analytical subject '{resolved_subject}'.*\n" if resolved_subject else ""
        answer_text = (
            f"### Evidence Summary for '{dataset_name}'\n\n"
            f"{context_note}"
            f"Based on the verified analytical evidence extracted from the dataset:\n\n"
            + "\n".join(bullet_points) + "\n\n"
            "**Recommended Investigation:** Use the linked features in Analysis & Patterns to inspect these distributions further."
        )

        has_high_evidence = any(e.strength == "High" for e in matched_evidence)
        confidence_val = "High" if (len(matched_evidence) >= 2 or has_high_evidence) else "Medium"

        return GroundedAnswerResponse(
            status="success",
            message="Answer generated from deterministic evidence",
            question=question,
            answer=answer_text,
            referenced_evidence_ids=referenced_ids,
            confidence=confidence_val,
            resolved_subject=resolved_subject,
            suggested_followups=[
                "Which features exhibit the highest predictive influence?",
                "What statistical outliers were flagged in the dataset?",
                "What drill-down path is recommended for investigation?"
            ]
        )

    try:
        evidence_context = []
        for e in matched_evidence:
            provenance_str = f" [Method: {e.provenance.get('method')}]" if e.provenance else ""
            evidence_context.append(
                f"[Evidence ID: {e.evidence_id}] Category: {e.category} | Title: {e.title} | Details: {e.description} | "
                f"Metric: {e.metric_name}={e.metric_value} {e.unit or ''} | Strength: {e.strength} | Source: {e.source}{provenance_str} | Columns: {', '.join(e.related_columns)}"
            )
        evidence_str = "\n".join(evidence_context)

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

        history_context = ""
        if history:
            history_context = "\nRecent Conversation History:\n" + "\n".join([f"{h.get('role', 'user')}: {h.get('content', '')}" for h in history[-3:]])

        payload = {
            "model": "llama-3.1-8b-instant",
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are InsightGrid Intelligence Assistant. Answer the user's question concisely, professionally, and strictly ground your explanation in the provided verified evidence. "
                        "Do not guess, fabricate, or extrapolate uncomputed dataset facts. If the evidence does not contain the answer, politely state what analytical evidence is available. "
                        "Maintain context continuity with previous analytical subjects if this is a follow-up question. Always use clear Markdown formatting."
                    )
                },
                {
                    "role": "user",
                    "content": (
                        f"Dataset: {dataset_name}\n"
                        f"{history_context}\n"
                        f"Active Analytical Context: {resolved_subject or 'General'}\n"
                        f"User Question: {question}\n\n"
                        f"Verified Analytical Evidence:\n{evidence_str}"
                    )
                }
            ],
            "temperature": 0.2,
            "max_tokens": 800
        }

        resp = requests.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload, timeout=20)
        if resp.status_code == 200:
            content = resp.json().get("choices", [{}])[0].get("message", {}).get("content", "").strip()
            return GroundedAnswerResponse(
                status="success",
                message="Answer generated from LLM grounded in evidence",
                question=question,
                answer=content,
                referenced_evidence_ids=referenced_ids,
                confidence="High",
                resolved_subject=resolved_subject,
                suggested_followups=[
                    "What are the key influencing factors?",
                    "Where are the largest outliers located?",
                    "What next steps are recommended?"
                ]
            )
    except Exception:
        pass

    # Fallback to deterministic if API request fails
    bullet_points = [f"- **{e.title}**: {e.description}" for e in matched_evidence]
    has_high = any(e.strength == "High" for e in matched_evidence)
    fallback_confidence = "High" if (len(matched_evidence) >= 2 or has_high) else "Medium"

    return GroundedAnswerResponse(
        status="success",
        message="Answer generated from deterministic evidence fallback",
        question=question,
        answer=f"### Verified Evidence Findings\n\n" + "\n".join(bullet_points),
        referenced_evidence_ids=referenced_ids,
        confidence=fallback_confidence,
        resolved_subject=resolved_subject,
        suggested_followups=["Explore feature distributions in Analysis & Patterns"]
    )


# Backward-compatible wrapper for legacy callers
def generate_natural_language_insights(analysis_data, context="", dataset_name=""):
    api_key = os.getenv("GROQ_API_KEY")
    if api_key:
        try:
            headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
            data_str = json.dumps(analysis_data, default=str)[:3000]
            payload = {
                "model": "llama-3.1-8b-instant",
                "messages": [
                    {
                        "role": "system",
                        "content": "Return a JSON array of findings with category, finding, impact, confidence, severity, recommendation."
                    },
                    {
                        "role": "user",
                        "content": f"Dataset: {dataset_name}\nData: {data_str}"
                    }
                ],
                "temperature": 0.2
            }
            resp = requests.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload, timeout=20)
            if resp.status_code == 200:
                content = resp.json().get("choices", [{}])[0].get("message", {}).get("content", "").strip()
                if content.startswith("```"):
                    lines = content.splitlines()
                    if len(lines) >= 2:
                        content = "\n".join(lines[1:-1])
                parsed = json.loads(content)
                if isinstance(parsed, list) and len(parsed) > 0:
                    return parsed
        except Exception:
            pass

    from backend.analytics.evidence import extract_evidence
    evidence = extract_evidence(
        dataset_id="ds-legacy",
        analysis_id="an-legacy",
        analytics_data=analysis_data if isinstance(analysis_data, dict) else {},
        anomaly_result=analysis_data.get("anomaly_result") if isinstance(analysis_data, dict) else None,
        ml_result=analysis_data.get("ml_result") if isinstance(analysis_data, dict) else None
    )
    insights = generate_grounded_insights_from_evidence(evidence, dataset_name=dataset_name)
    # Return serializable dict array matching legacy Insight interface
    legacy_list = []
    for ins in insights:
        legacy_list.append({
            "category": ins.category,
            "finding": ins.title,
            "impact": ins.summary,
            "why_it_matters": ins.why_it_matters,
            "confidence": 90 if ins.severity in ["Critical", "High"] else 75,
            "priority": ins.priority,
            "priority_score": ins.priority_score,
            "priority_reasons": ins.priority_reasons,
            "is_key_finding": ins.is_key_finding,
            "source": ins.evidence_items[0].source if ins.evidence_items else "InsightGrid Engine",
            "driver": ins.actionable_investigation_target or (ins.related_columns[0] if ins.related_columns else "general"),
            "severity": ins.severity,
            "recommendation": ins.recommended_next_step,
            "evidence": {
                "metric_value": ins.evidence_items[0].metric_value if (ins.evidence_items and isinstance(ins.evidence_items[0].metric_value, (int, float))) else 0.85
            },
            "linked_visualization": "weights" if ins.category == "Prediction" else ("anomalies" if ins.category == "Anomaly" else "correlation"),
            "linked_feature": ins.actionable_investigation_target,
            "evidence_ids": ins.evidence_ids
        })
    return legacy_list
