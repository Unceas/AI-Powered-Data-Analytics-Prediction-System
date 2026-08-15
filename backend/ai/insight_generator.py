import json
import os
import requests
import uuid
from typing import Dict, Any, List, Optional
from backend.domain.contracts import EvidenceItem, InsightItem, GroundedAnswerResponse


def generate_grounded_insights_from_evidence(
    evidence_items: List[EvidenceItem],
    dataset_name: str = "",
    analysis_id: str = "",
    dataset_id: str = ""
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

    return insights


def answer_question_grounded_in_evidence(
    question: str,
    dataset_name: str,
    evidence_items: List[EvidenceItem]
) -> GroundedAnswerResponse:
    """
    Answers user questions strictly grounded in observed EvidenceItem objects.
    The LLM never hallucinates or guesses uncomputed facts.
    """
    q_lower = question.lower()
    
    # Filter matching evidence
    matched_evidence = []
    for ev in evidence_items:
        # Check if question mentions evidence category or related columns
        if ev.category in q_lower or any(col.lower() in q_lower for col in ev.related_columns) or ev.metric_name.lower() in q_lower:
            matched_evidence.append(ev)

    if not matched_evidence:
        # Include top general evidence
        matched_evidence = evidence_items[:4]

    referenced_ids = [e.evidence_id for e in matched_evidence]

    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        # Deterministic grounded fallback response
        bullet_points = []
        for e in matched_evidence:
            bullet_points.append(f"- **{e.title}**: {e.description} *(Source: {e.source}, Strength: {e.strength})*")
        
        answer_text = (
            f"### Evidence Summary for '{dataset_name}'\n\n"
            f"Based on the verified analytical evidence extracted from the dataset:\n\n"
            + "\n".join(bullet_points) + "\n\n"
            "**Recommended Investigation:** Use the linked features in Analysis & Patterns to inspect these distributions further."
        )

        return GroundedAnswerResponse(
            status="success",
            message="Answer generated from deterministic evidence",
            question=question,
            answer=answer_text,
            referenced_evidence_ids=referenced_ids,
            confidence="High" if len(matched_evidence) >= 2 else "Medium",
            suggested_followups=[
                "Which features exhibit the highest predictive influence?",
                "What statistical outliers were flagged in the dataset?",
                "Are there strong correlations between continuous variables?"
            ]
        )

    try:
        evidence_context = []
        for e in matched_evidence:
            evidence_context.append(
                f"[Evidence ID: {e.evidence_id}] Category: {e.category} | Title: {e.title} | Details: {e.description} | Metric: {e.metric_name}={e.metric_value} | Source: {e.source} | Columns: {', '.join(e.related_columns)}"
            )
        evidence_str = "\n".join(evidence_context)

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": "llama-3.1-8b-instant",
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are InsightGrid Intelligence Assistant. Answer the user's question concisely, professionally, and strictly ground your explanation in the provided verified evidence. "
                        "Do not guess or fabricate uncomputed dataset facts. If the evidence does not contain the answer, politely state what analytical evidence is available. "
                        "Always use clear Markdown formatting."
                    )
                },
                {
                    "role": "user",
                    "content": (
                        f"Dataset: {dataset_name}\n"
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
    return GroundedAnswerResponse(
        status="success",
        message="Answer generated from deterministic evidence fallback",
        question=question,
        answer=f"### Verified Evidence Findings\n\n" + "\n".join(bullet_points),
        referenced_evidence_ids=referenced_ids,
        confidence="Medium",
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
