# InsightGrid — Version History & Product Roadmap

> Working source of truth assembled from the project history currently available. Empty fields and unknown statuses are intentional. A planned directive is not proof that code was implemented. Repository state, actual test/build output, and commits take precedence.

## 1. Product vision

**InsightGrid — Talk to Data**

An AI-powered analytics platform that moves users from raw datasets to understandable, evidence-backed findings, predictions, investigations, and reports.

Principles:
- Evidence before explanation.
- Findings and answers remain traceable to verified analytical results.
- Backend logic computes facts, validates relationships, ranks findings, and checks actions.
- LLMs explain verified context; they must not invent metrics, columns, evidence, relationships, or causes.
- Investigation is progressive and grounded in real dataset dimensions.
- Priority and confidence are different concepts.
- Correlation is not causation.
- Implement focused iterations, preserve compatibility, and run full regression tests.

## 2. High-level architecture

```text
DATASET
  ↓
DATA UNDERSTANDING
  ↓
ANALYSIS
  ↓
PATTERNS / ANOMALIES / RELATIONSHIPS
  ↓
EVIDENCE
  ↓
INSIGHTS / PRIORITIZED FINDINGS
  ├── PREDICTION
  └── INVESTIGATION
          ↓
    ASK INSIGHTGRID / COPILOT
          ↓
      ACTION / DECISION
          ↓
        REPORTS
```

Core domain concepts:

| Concept | Responsibility |
|---|---|
| Dataset | User data and lifecycle |
| Data Understanding | Column profiles, temporal columns, candidate targets, quality and limitations |
| Analysis | Verified statistics, distributions, correlations, anomalies, and other analytical outputs |
| Evidence | Traceable analytical observation with source, metrics, columns, and provenance |
| Insight / Finding | User-facing interpretation linked to evidence |
| Prediction | Validated prediction with reliability limitations and relevant drivers |
| Investigation | Persistent decomposition of a finding into grounded observations |
| Copilot | Conversational interface over validated analytical context |
| Evidence Graph | Deterministic relationships between evidence items |
| Evidence Strength | Assessment of evidence support and limitations |
| Finding Confidence | Qualitative assessment of how strongly a finding is supported |
| Report | Downstream presentation of verified analytical results |

## 3. Version-label convention

These are **project milestone labels**, not necessarily strict Semantic Versioning releases.

- `V1.4.1`, `V1.4.2`, `V1.4.3` represent iterations within the V1.4 line.
- `V1.4.4.1`, `V1.4.4.2`, `V1.4.4.3` represent sub-iterations of the V1.4.4 initiative.
- A prompt or proposal does not mean implementation is complete.
- Historical test reports are not fresh verification.
- If these labels become public package/API versions, establish a release-version policy. Standard SemVer uses `MAJOR.MINOR.PATCH`; see https://semver.org/.

Status terms:
- **Reported complete:** prior update explicitly reported implementation and verification.
- **Planned / directive prepared:** scope is known, but completion is unconfirmed.
- **Partially documented:** some scope is known; shipping status needs verification.
- **Unknown:** reliable version details are unavailable.

## 4. Version overview

| Version | Scope | Known status |
|---|---|---|
| V1.0 | __________________ | Unknown |
| V1.1 | __________________ | Unknown |
| V1.2 | Evidence provenance/ranking, contextual investigations, prediction context inheritance, analytical conversation memory, Decision Brief, narrative reports | Partially documented; verify in repository |
| V1.3 | __________________ | Unknown |
| V1.4 architecture | Proactive, evidence-driven analytical workflow | Architecture documented |
| V1.4.1 | Proactive Discovery Engine | Reported complete; 54/54 backend tests passed and frontend build reported clean |
| V1.4.2 | Progressive Decomposition Chains | Reported complete; commit `3677256`, 61/61 tests passed and frontend build reported clean |
| V1.4.3 | Conversational Copilot Lineage Traversal | Detailed directive prepared; completion unconfirmed |
| V1.4.4.1 | Evidence Graph | Detailed directive prepared; completion unconfirmed |
| V1.4.4.2 | Evidence Strength & Finding Confidence | Detailed directive prepared; completion unconfirmed |
| V1.4.4.3 | Evidence-Aware Copilot integration | Planned next iteration; implementation not confirmed |
| V1.4.5 | Next product milestone | Scope not yet defined |
| V1.5 | Future milestone | Scope unknown |

## 5. V1.0 — Initial product foundation

**Status:** Unknown.

- Goal: ______________________________
- Implemented capabilities: ______________________________
- Architecture: ______________________________
- Tests/build: ______________________________
- Commit/release: ______________________________

Recover from repository/Git history or earlier project notes; do not guess.

## 6. V1.1 — ______________________________

**Status:** Unknown.

- Goal: ______________________________
- Implemented capabilities: ______________________________
- Technical decisions: ______________________________
- Tests/build: ______________________________
- Commit/release: ______________________________

## 7. V1.2 — Evidence-driven product context

**Status:** Partially documented; verify implementation.

Scope recorded in earlier planning:
- Evidence provenance and ranking
- Contextual investigations
- Prediction context inheritance
- Analytical conversation memory
- Decision Brief
- Narrative reports

Intended value: connect analytics outputs to contextual downstream workflows while preserving analytical provenance.

To verify:
- Which capabilities shipped?
- Which were deferred or replaced?
- What contracts/API changes were made?
- What tests were added?
- What is the final commit/release reference?

Implementation notes: ______________________________

Tests/build: ______________________________

## 8. V1.3 — ______________________________

**Status:** Unknown.

- Goal: ______________________________
- Implemented capabilities: ______________________________
- Technical decisions: ______________________________
- Tests/build: ______________________________
- Commit/release: ______________________________

## 9. V1.4 — Evidence-driven analytical workspace

V1.4's documented direction is a proactive analytical environment with grounded findings, progressive investigation, and conversational access to validated analytical context.

```text
Dataset → Understanding → Analysis → Evidence
        → Prioritized Findings → Investigation
        → Evidence-Grounded Copilot → Action / Reports
```

### V1.4.1 — Proactive Discovery Engine

**Status:** Reported complete in a prior update. Historical report: 54/54 backend tests passed; frontend build reported clean. Not freshly re-run for this document.

**Goal:** Move from a passive dashboard to a workspace that surfaces the most valuable findings after dataset analysis.

Reported implementation:
- Deterministic `rank_and_prioritize_insights` in `backend/ai/insight_generator.py`
- Ranked top 3–5 findings with grounded investigation candidates and reasons for priority
- `InsightItem` / frontend Insight extended with `investigation_candidates` and `reason_for_priority`
- Key-finding flag for findings meeting a score threshold
- Dashboard summary indicating how many findings are worth investigating first
- One-click Investigate initializes existing `WorkspaceContext`
- Other findings remain accessible

Recorded example scoring factors (verify against current source):
- Category: Prediction 25, Anomaly 22, Correlation 18, Quality 14, Trend 12
- Severity: Critical 35, High 25, Medium 15, Low 5
- Target relevance: +25
- Statistical strength/magnitude: up to +20 for high strength; smaller additions for strong correlation/anomaly volume
- Corroboration: +6 per additional evidence item
- Duplicate category/feature penalty: -15

Questions:
- Are these weights still current?
- Has prioritization been integrated with the evidence-confidence layer?
- Are all key findings linked to verified evidence?

### V1.4.2 — Progressive Decomposition Chains

**Status:** Reported complete. Commit `3677256`. Historical report: 61/61 tests passed; frontend build reported clean. Not freshly re-run for this document.

**Goal:** Turn investigation into a progressive evidence-backed chain:

```text
Finding → Dimension → Observation → Dimension → Observation → Evidence
```

Rules:
- Nodes originate from real dataset columns, analytical results, `EvidenceItem`s, or column profiles.
- No fabricated causality.
- Prefer precise language such as “largest observed concentration” or “observed linear relationship.”
- No LLM-generated dimensions or observations.
- State persists in `WorkspaceContext`.
- Chains terminate when no valid dimensions remain or evidence is reached.

Reported backend work:
- `backend/domain/contracts.py`: `InvestigationNode`, `InvestigationContext`, `InvestigationStepRequest`, `InvestigationStepResponse`
- `backend/analytics/investigation.py`: `derive_investigation_context` and `decompose_investigation_step`
- Dimension validation against `understanding.column_profiles`
- Uses categorical summaries, distributions, correlation matrix, and verified evidence
- Sample values validate existence only; they do not prove analytical claims
- Remaining valid dimensions computed; terminal nodes created when appropriate
- `backend/api/routes.py`: `POST /investigate-step` and extended `/investigate-insight`

Reported frontend work:
- `frontend-react/src/types.ts`
- `WorkspaceContext.tsx`
- `Dashboard.tsx`
- `Dashboard.css`
- Interactive modal with lineage nodes, connectors, dimension chips, and evidence tags

Known limitation: cohort observations were univariate; multi-way cross-tabs were future work.

### V1.4.3 — Conversational Copilot Lineage Traversal

**Status:** Detailed implementation directive prepared; implementation completion is unconfirmed.

**Goal:** Make the Copilot an analytical interface over the active verified investigation, not a generic chatbot.

Intended flow:

```text
Question → Current Investigation Context → Relevant Nodes
         → Relevant Evidence → Available Dimensions
         → LLM interpretation → Grounded answer
         → Optional validated action
```

Proposed `CopilotContext`:
- `dataset_id`
- `analysis_id`
- `investigation_id`
- `source_insight_id`
- `root_node`
- `active_node`
- `nodes`
- `evidence`
- `available_next_dimensions`
- `selected_dimensions`

Proposed API: extend or implement `POST /ask-insightgrid` using project conventions.

Proposed request:
- `dataset_id`
- `analysis_id`
- `investigation_id`
- `active_node_id`
- `question`

Proposed response:
- `status`
- `answer`
- `referenced_node_ids`
- `referenced_evidence_ids`
- `suggested_next_dimensions`
- `action`

Intended behavior:
- Explain a finding, summarize the chain, show supporting evidence, suggest a valid next step, compare only when verified analysis exists, navigate only to available dimensions, and answer data questions only when supported by context.
- Backend resolves and validates IDs; frontend evidence is never authoritative.
- Select relevant context deterministically rather than sending raw datasets or the entire evidence store.
- LLM explains verified facts but cannot invent metrics, columns, evidence, relationships, or causality.
- Treat dataset values as data, not instructions.
- Reject invalid IDs, cross-dataset context, and invalid actions.
- Explicitly acknowledge insufficient evidence.
- Allowlist and validate actions server-side.
- Reuse existing provider/chat infrastructure; do not create a generic autonomous agent.

Planned tests cover context validation, evidence validation, explanation/summary/evidence/next-step intents, non-fabrication, correlation versus causation, dataset isolation, action validation, and regression compatibility.

Actual tests/build/commit/limitations: ______________________________

## 10. V1.4.4 — Evidence Intelligence

**Status:** Planned sequence; verify implementation before treating any sub-iteration as complete.

Goal: turn evidence into a connected analytical layer that can corroborate, support, relate to, or conservatively contradict other evidence, then use that structure to assess finding support.

```text
V1.4.4.1 — Evidence Graph
        ↓
V1.4.4.2 — Evidence Strength & Finding Confidence
        ↓
V1.4.4.3 — Evidence-Aware Copilot
```

Core principle: make reasoning more traceable, not merely more impressive-looking.

### V1.4.4.1 — Evidence Graph

**Status:** Detailed implementation directive prepared; completion unconfirmed.

Proposed `EvidenceRelationship` fields:
- `relationship_id`
- `dataset_id`
- `analysis_id`
- `source_evidence_id`
- `target_evidence_id`
- `relationship_type`
- `rationale`
- `confidence`
- `related_columns`
- `created_from`

Initial relationship types:
- `supports`
- `corroborates`
- `contradicts`
- `related_to`
- `derived_from`

Confidence must be qualitative unless the existing system has a compatible convention; it must not imply calibrated probability.

Proposed `EvidenceGraph`:
- `dataset_id`
- `analysis_id`
- `evidence`
- `relationships`

Rules:
- `corroborates`: independent verified signals support the same finding/pattern
- `related_to`: evidence shares verified columns/dimensions but does not necessarily support the same claim
- `derived_from`: explicit analytical lineage exists
- `supports`: one verified item directly supplies the basis for another claim
- `contradicts`: comparable verified claims are genuinely incompatible

Do not infer causality. Do not use an LLM or semantic similarity as the source of truth for relationships.

Integrity requirements:
- No self-links or duplicates
- Normalize symmetric relationships where appropriate
- Preserve direction for directed relationships
- Enforce dataset and analysis isolation
- Stable IDs and deterministic ordering
- Preserve evidence IDs and API compatibility
- Handle contradictions conservatively

Suggested module: `backend/analytics/evidence_graph.py`, unless an existing equivalent is more appropriate.

An endpoint such as `GET /evidence-graph` is optional and should be added only if existing endpoints cannot expose the graph naturally. Backend resolves evidence/analysis context.

Frontend scope: compact supporting/related/conflicting evidence presentation using the current design system. Full graph visualization is not required.

Actual implementation/tests/commit: ______________________________

### V1.4.4.2 — Evidence Strength & Finding Confidence

**Status:** Detailed implementation directive prepared; completion unconfirmed.

Goal: distinguish interesting findings from well-supported, weakly supported, insufficiently supported, or conflicting findings.

**Priority:** “What should I investigate first?”

**Confidence:** “How strongly is this finding supported?”

Proposed `EvidenceStrength`:
- `evidence_id`
- `strength`
- `score`
- `supporting_factors`
- `limiting_factors`
- `relationship_count`
- `corroboration_count`
- `contradiction_count`

Potential qualitative strength:
- `strong`
- `moderate`
- `limited`
- `conflicting`

Proposed finding confidence:
- `high`
- `medium`
- `low`
- `conflicting`
- `confidence_reason`

Only use verified factors:
- Analytical signal strength
- Sample adequacy
- Relevant data quality/missingness
- Independent corroboration
- Verified contradictions
- Target relevance
- Known limitations

Prevent double-counting: multiple evidence items derived from the same metric/lineage must not count as independent signals. Reuse graph lineage where valid.

Contradictions must be visible and materially affect the assessment; do not bury them in an average.

Integrate with V1.4.1 prioritization without replacing it. Confidence must not dominate business severity/importance.

Investigation and Copilot may display/explain confidence only from validated context. Suggestions for additional checks must use real dataset columns and available analytical capabilities.

Do not call heuristic scores probabilities. Do not add Bayesian calibration, new ML, causal inference, or LLM confidence scoring.

Actual implementation/tests/commit: ______________________________

### V1.4.4.3 — Evidence-Aware Copilot

**Status:** Completed & Verified (142/142 backend tests passing, 0 frontend build errors).

Goal: integrate the Evidence Graph and evidence-strength/confidence layer into the existing Copilot. This is an integration iteration, not a new chat architecture.

Relevant context includes:
- Current finding
- Active investigation node and lineage
- Supporting evidence
- Contradictory evidence
- Relevant evidence relationships
- Evidence strength
- Finding confidence and deterministic reason
- Available next dimensions
- Valid checks that could reduce uncertainty

Target questions:
- “Why should I trust this finding?”
- “What evidence supports it?”
- “Is anything contradicting it?”
- “How confident are we, and why?”
- “What have we found so far?”
- “What should I investigate next?”
- “What additional check could strengthen this conclusion?”

Requirements:
- Backend computes facts and validates references.
- LLM explains verified context; it does not create relationships or assign confidence.
- Keep supporting and contradictory evidence distinct.
- Never describe missing evidence as existing evidence.
- Suggested dimensions/checks must exist in actual dataset/analysis context.
- Actions remain allowlisted and validated.
- Preserve current investigation/Copilot state.
- Reuse existing provider and chat infrastructure.
- Do not rewrite V1.4.3 or build a generic autonomous agent.

Verification:
- Grounded explanations and summaries
- Supporting/contradictory evidence retrieval
- Confidence explanations
- Invalid IDs and cross-dataset isolation
- Missing evidence and unsupported questions
- Validated next-dimension suggestions/actions
- Full backend test suite and frontend build

Actual implementation/tests/commit: Implemented in `backend/ai/copilot.py`, `backend/domain/contracts.py`, `backend/api/routes.py`, `frontend-react/src/components/AIChatPage.tsx`. Verified with 32 dedicated unit/integration tests in `tests/test_v1_4_4_3_evidence_aware_copilot.py` (142/142 backend tests pass, frontend build clean).

## 11. V1.4.5 — Next product milestone

**Status:** Not yet defined.

Recommendation: define scope after V1.4.4.1–V1.4.4.3 have been implemented, reviewed, and tested. Use observed product gaps rather than adding features for their own sake.

Candidate areas — not committed scope:
- [ ] Multi-way / cross-tab analytical investigation
- [ ] Stronger temporal validation and time-aware analysis
- [ ] Evidence-aware reports / Decision Brief
- [ ] Dataset/analysis lifecycle reliability
- [ ] Large-dataset performance
- [ ] Investigation usability
- [ ] Other: ______________________________

Decision criteria:
1. Demonstrated user-facing gap
2. Evidence from tests or actual use
3. Reuse of existing architecture
4. Measurable acceptance criteria
5. Independently testable scope

Final goal: ______________________________

Acceptance criteria: ______________________________

Out of scope: ______________________________

## 12. V1.5 — Future milestone

**Status:** Scope not established.

- Goal: ______________________________
- Candidate capabilities: ______________________________
- Dependencies: ______________________________
- Acceptance criteria: ______________________________

Do not treat V1.5 as committed until V1.4.5 is defined and its outcomes are known.

## 13. Cross-version engineering standards

Before implementation:
1. Inspect existing contracts, modules, routes, UI, and tests.
2. Determine what already exists.
3. Reuse abstractions; avoid duplicate systems.
4. Define behavior and acceptance criteria.
5. Keep scope focused.

During implementation:
1. Backend computations remain authoritative.
2. Enforce dataset and analysis isolation.
3. Preserve API compatibility where possible.
4. Use the existing UI language.
5. Avoid unrelated refactors.
6. Test analytical rules, not just object existence.
7. Do not use an LLM where deterministic logic is required.

Before declaring completion:
1. Run targeted tests.
2. Run the full backend test suite.
3. Run the frontend build.
4. Report actual outputs only.
5. Record limitations, changed files, and commit.
6. Update this roadmap with verified status.

Standard implementation report:
- Version / iteration:
- Objective:
- Files inspected:
- Files created:
- Files modified:
- Contract/API changes:
- Backend behavior:
- Frontend behavior:
- Tests added:
- Targeted test result:
- Full backend test result:
- Frontend build result:
- Manual verification:
- Known limitations:
- Commit:
- Next recommended iteration:

## 14. Missing history to recover

- [ ] Exact V1.0 scope/status
- [ ] Exact V1.1 scope/status
- [ ] Which V1.2 capabilities shipped
- [ ] Exact V1.3 scope/status
- [ ] V1.4 work before V1.4.1, if any
- [ ] Whether V1.4.3 was implemented and verified
- [ ] Whether V1.4.4.1 was implemented and verified
- [ ] Whether V1.4.4.2 was implemented and verified
- [ ] Current full backend test count/status
- [ ] Current frontend build status
- [ ] Latest branch and commit
- [ ] Actual contracts/endpoints after implementation
- [ ] Final V1.4.5 scope

## 15. Recommended next sequence

```text
Inspect current repository state
        ↓
Confirm V1.4.3 status
        ↓
Implement / verify V1.4.4.1 — Evidence Graph
        ↓
Implement / verify V1.4.4.2 — Evidence Strength & Finding Confidence
        ↓
Implement / verify V1.4.4.3 — Evidence-Aware Copilot
        ↓
Run full backend regression + frontend build
        ↓
Review real remaining gaps
        ↓
Define V1.4.5
```

Do not blindly execute the next directive if prerequisites are missing or the repository already implements the capability differently. Inspect the actual state and adapt.

## 16. Source-of-truth rule

When sources disagree, use this order:
1. Current repository code and contracts
2. Actual test/build output
3. Git commits and implementation reports
4. This roadmap
5. Earlier proposed plans/prompts

Update the status table when an iteration is verified.

**North star:** InsightGrid should not merely answer analytical questions. It should show what supports an answer, how it was derived, what weakens it, and what the user can validly investigate next.
