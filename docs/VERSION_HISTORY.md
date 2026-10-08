# InsightGrid Version History & Evolution

InsightGrid has evolved from a baseline analytics tool into an **Evidence-Driven Analytical Reasoning & Intelligence System**. Every release has strictly followed domain-driven design, deterministic statistical guarantees, and persistent workspace continuity.

---

## 🗺️ Architectural Evolution at a Glance

```
V1.0: Analytics & Inference
  │  Automated Preprocessing, Model Training, AI Insights
  ▼
V1.1: Calibrated Prediction Engine
  │  Representative Holdout Validation, Calibrated Reliability Scores, Driver Attribution
  ▼
V1.2: Analytical Intelligence & Decision Layer
  │  Immutable EvidenceItems, Provenance & Physical Units, 6-Part DecisionBrief, Contextual Investigation
  ▼
V1.3: Persistent Analytical Workspace
  │  WorkspaceContext Single Source of Truth, Cross-Tab Continuity, Safe Root Invalidation
  ▼
V1.4 (Iteration 1): Proactive Discovery Engine
  │  Deterministic Multi-Factor Scoring, Diversity Deduplication, Top 3–5 Key Findings Showcase
  ▼
V1.4 (Iteration 2): Why? Progressive Decomposition Chains
  │  InvestigationNode Lineage (Finding → Dimension → Observation → Evidence), Investigation Integrity Rules
  ▼
V1.4.4.1: Deterministic Evidence Graph
  │  Inter-Evidence Relationship Layer (Supports, Corroborates, Contradicts, Derived-From, Related-To)
  ▼
V1.4.4.2: Evidence Strength & Finding Confidence Layer
  │  EvidenceStrength Engine, Anti-Double-Counting Lineages, Deterministic Finding Confidence, Schema-Grounded Suggestions
```

---

## 📦 Version Details

### 🔹 InsightGrid V1.0 — Baseline Analytics & Inference
*Foundational ingestion, statistical profiling, machine learning inference, and AI interpretation.*

- **Automated Preprocessing**: Missing value imputation (mode/median), standard/robust scaling, one-hot encoding for categorical variables.
- **Analytics Engine**: Pearson correlation matrices, univariate & bivariate feature distributions, IQR & Isolation Forest anomaly detection.
- **Machine Learning**: Automated classification & regression modeling with Random Forest, feature importance attribution, and basic metrics (Accuracy, F1, MSE, R²).
- **AI Interpretation**: Initial natural language summary generation via LLaMA 3.1 & Groq API.
- **Executive PDF Report**: Automated client-ready business reports compiling visual graphs and summary metrics.

---

### 🔹 InsightGrid V1.1 — Calibrated Prediction Engine
*Eliminating synthetic metrics and establishing rigorous machine learning validation standards.*

- **Calibrated Reliability Scoring**: Multi-factor scoring ($0-100$) evaluating sample size ($N \ge 200$), validation metric stability ($R^2$, Balanced Accuracy), holdout separation ($80/20$ train/test), and feature diversity.
- **Zero Hallucinated Metrics**: Strict holdout evaluation preventing synthetic perfect scores (e.g. replacing hardcoded $98.5\%$ with actual out-of-bag cross-validation scores).
- **Driver Attribution**: Normalization of model coefficients and Gini impurity reductions into explicit relative percentage contributions.
- **Representative Scenario Matrix**: Validated across 12 distinct machine learning scenarios (e.g. small datasets, imbalanced classes, multi-class targets, extreme skewness, sparse matrices).

---

### 🔹 InsightGrid V1.2 — Analytical Intelligence & Decision Layer
*Moving from disconnected findings to immutable evidence and structured decision briefs.*

- **Immutable `EvidenceItem` Contract**:
  - Every analytical observation (correlation, anomaly, distribution, driver, segment) is formalized into an immutable domain object with `evidence_id`, `metric_name`, `metric_value`, `unit`, `scope`, `provenance`, and `technical_details`.
  - Evidence represents observed analytical facts and cannot be altered or fabricated by LLMs.
- **Deterministic Insight Prioritization**:
  - Multi-factor scoring ranking findings by severity, category weight, target relevance, and corroborating evidence counts.
  - Identification of top `★ KEY FINDINGS`.
- **6-Part Executive `DecisionBrief`**:
  - Synthesizes:
    1. *What Happened*
    2. *Why It Matters*
    3. *What the Data Suggests*
    4. *What May Happen Next*
    5. *Calibrated Reliability Score & Explanation*
    6. *Recommended Next Investigation Action*
- **Contextual Investigation Derivation**:
  - `derive_investigation_context()` generates grounded drill-down paths from actual dataset dimensions (segments, regions, categories, time).
- **Conversational Grounding**:
  - `POST /ask-insightgrid` provides deterministic evidence-backed answers with explicit declarations of insufficient evidence when queries cannot be verified.

---

### 🔹 InsightGrid V1.3 — Persistent Analytical Workspace
*Unifying disparate dashboard pages into a single, cohesive, living analytical environment.*

- **`WorkspaceContext` Single Source of Truth**:
  - Centralized React context managing `dataset_id`, `analysis_id`, `active_insight_id`, `active_evidence_ids`, `investigation`, and `prediction_context`.
- **Safe Root Invalidation**:
  - When the active dataset changes, all downstream caches and state invalidate cleanly, preventing stale analytical cross-contamination.
- **Universal "Why?" Actions**:
  - 1-click handoffs from any insight or finding directly into the investigation workspace modal.
- **Investigation $\to$ Prediction Continuity**:
  - Contextual handoffs from findings directly into Prediction Studio, pre-populating target columns and displaying contextual lineage banners.
- **Persistent Header Telemetry**:
  - `WorkspaceContextBanner` component tracking active investigation subjects, selected dimensions, and supporting evidence counts across all tabs.

---

### 🔹 InsightGrid V1.4 (Iteration 1) — Proactive Discovery Engine
*From passive dashboards that wait for exploration to an engine that surfaces what to look at first.*

- **100% Deterministic Ranking Layer**:
  - Calculates finding priority from category weights, severity weights, target relevance ($+25.0$), statistical strength ($+20.0$ for High strength, $+5.0$ for $|r| \ge 0.7$ or elevated outliers), and multi-evidence corroboration ($+6.0$ per additional evidence item).
- **Diversity Deduplication**:
  - Penalizes duplicate category/feature findings ($-15.0$) to guarantee top findings represent diverse facets (Predictions, Anomalies, Correlations, Quality).
- **Normalized Finding Contracts**:
  - Added `investigation_candidates` (grounded column names derived strictly from column profiles) and `reason_for_priority` (concise human-readable rationale).
- **Proactive Discovery UI Showcase**:
  - `INSIGHTGRID FOUND: X things worth investigating first` section in `Dashboard.tsx` highlighting numbered findings (`01`, `02`, `03`), priority reason chips, and 1-click `Investigate by: [→ Dim]` buttons.
  - Complete operational findings console preserved underneath for 100% data accessibility.

---

### 🔹 InsightGrid V1.4 (Iteration 2) — Why? Progressive Decomposition Chains
*Transforming investigations into interactive, multi-step analytical lineage trees.*

- **`InvestigationNode` Schema**:
  - Represents individual steps in an investigation: `finding` (Root), `dimension`, `observation`, and `evidence` (Terminal).
- **Progressive Lineage Engine**:
  - `POST /investigate-step` decomposes findings along user-selected dimensions (e.g. `Finding → Dimension → Observation → Dimension → Observation → Evidence`).
- **Strict Investigation Integrity Rules**:
  1. Every observation contains measurable analytical values or statistics (`cohort_record_count`, `mean_distribution`, `pearson_r`).
  2. Every observation identifies the dataset column(s) used.
  3. Every observation is reproducible from underlying analytical aggregates (`categorical_summaries`, `distributions`, `correlation_matrix`, `evidence_items`).
  4. `ColumnProfile.sample_values` are only used for validating column existence, never as proof for an analytical claim.
  5. Correlation is never described as causation.
  6. If insufficient data exists, returns `"No supported decomposition available"` rather than inventing numbers.
  7. Rejects unknown/fabricated dimensions.
  8. Excludes already used dimensions in ancestor chains.
  9. Naturally terminates with verified `EvidenceItem` references.
- **Backend as Analytical Source of Truth**:
  - React frontend renders strictly what the backend proves, maintaining full state persistence in `WorkspaceContext`.

---

### 🔹 InsightGrid V1.4.4.1 — Deterministic Evidence Graph
*Elevating evidence from isolated attachments into an interconnected, deterministic analytical graph.*

- **Graph Layer Architecture**:
  - Evolved system flow: `DATA → UNDERSTANDING → ANALYSIS → EVIDENCE → EVIDENCE RELATIONSHIPS → FINDINGS / INVESTIGATION / COPILOT`.
  - Zero LLM inferences or hallucinations: relationships are strictly computed from analytical aggregates, schema definitions, and statistical facts.
- **Strict Relationship Taxonomy**:
  - `supports`: Directed relationship where an evidence item provides statistical grounding or evidentiary foundation for another (e.g. distribution moments supporting anomaly detection).
  - `corroborates`: Symmetric relationship where two evidence items substantiate the same finding or demonstrate compatible statistical patterns across identical features.
  - `contradicts`: Conservative mathematical inconsistency detection (e.g. opposing correlation signs with both $|r| \ge 0.35$, or conflicting missingness claims on the same column).
  - `derived_from`: Directed derivation where one evidence item is analytically derived from another (e.g. model feature driver attribution derived from bivariate correlation).
  - `related_to`: Symmetric relationship connecting evidence items that share one or more verified dataset columns.
- **Determinism & Integrity Guarantees**:
  - Stable, reproducible relationship IDs computed via SHA-256 hashes of dataset, analysis, canonical entity IDs, and relationship types.
  - Canonical symmetric normalization: unordered pairs strictly enforced with `source_evidence_id < target_evidence_id`.
  - Zero duplicate edges: only the highest-priority relationship is retained per pair (`contradicts` > `corroborates` / `derived_from` / `supports` > `related_to`).
  - Strict dataset and analysis isolation: evidence items from different datasets or analysis runs are never cross-linked.
  - Self-relationships strictly prohibited (`source_evidence_id != target_evidence_id`).
- **Comprehensive System Integration**:
  - Backend API: `POST /evidence-graph` endpoint returning verified `EvidenceGraphResponse`, and updated `POST /extract-evidence` attaching graph relationships.
  - Investigation Workspace: Progressive decomposition lineage trees and investigation contexts display relevant inter-evidence relationships.
  - Copilot Grounded Q&A: `POST /ask-insightgrid` injects verified evidence relationships to contextualize answers and declare evidence boundaries.
  - Test Suite: 23 dedicated unit and integration tests in `tests/test_v1_4_4_1_evidence_graph.py` (84/84 tests passing overall).

---

### 🔹 InsightGrid V1.4.4.2 — Evidence Strength and Finding Confidence Layer
*Distinguishing between what to investigate (Priority) and how strongly a finding is analytically substantiated (Confidence).*

- **Architectural Separation of Concerns**:
  - **Priority ("What should I look at?")**: Driven by business impact, severity, category weights, anomaly volume, and target relevance.
  - **Finding Confidence ("How strongly is this supported?")**: Deterministic interpretation of verified evidence quality, independent signals, contradiction absence, sample size, and data completeness.
  - Zero LLM generation or calibrated ML probability: confidence is computed deterministically from verified analytical aggregates.
- **`EvidenceStrength` Heuristic Engine (`backend/analytics/evidence_strength.py`)**:
  - Scores each `EvidenceItem` ($0.0 - 100.0$ bounded heuristic):
    - Base statistical strength: `High` (+45), `Medium` (+28), `Low` (+10).
    - Category metric magnitudes: Pearson $|r| \ge 0.65$ (+12), anomaly clusters $\ge 20$ (+10), predictive driver importance $\ge 0.25$ (+12), distribution skew $\ge 1.5$ (+8).
    - Sample size power: $N \ge 200$ (+15), $N < 50$ ($-15$ penalty).
    - Data completeness: Feature missingness $\ge 20\%$ ($-15$ penalty), zero nulls with high quality (+8).
    - Target relevance: Direct connection to candidate prediction target (+10).
    - Verified graph relationships: Independent corroboration (+10 up to +20 max), verified contradictions ($-35$ penalty, forces strength to `conflicting`).
  - Classifies into four distinct levels: `strong` ($\ge 65$), `moderate` ($\ge 35$), `limited` ($< 35$), `conflicting` (verified contradictions).
- **Anti-Double-Counting Lineages**:
  - Derivation chains connected via `derived_from` (e.g. predictive driver derived from correlation) are grouped into a single lineage and cannot be counted as multiple independent corroborating signals.
- **Finding Confidence Evaluation**:
  - Levels: `high`, `medium`, `low`, `conflicting`.
  - Contradiction Primacy: Any verified `contradicts` relationship connected to supporting evidence immediately forces finding confidence to `conflicting`.
  - Transparent deterministic rationales explaining exact evidentiary status.
- **Schema-Grounded Confidence Improvement Suggestions**:
  - Deterministically proposes next analytical steps strictly using real columns from `DataUnderstanding` (`column_profiles`, `temporal_columns`):
    - Chronological intervals across verified temporal columns.
    - Cross-segmentation tests across verified categorical/cohort columns.
    - Missingness resolution on features with elevated null percentages.
    - Zero hallucinated columns or metrics.
- **Balanced Priority Adjustments**:
  - Smooth adjustments (+10 for `high`, 0 for `medium`, -10 for `low`, -15 for `conflicting`) without allowing confidence to suppress critical severity alerts (critical severity anomalies retain High priority for urgent investigation).
- **Comprehensive Workspace & System Integration**:
  - Backend API: `POST /evidence-strength` endpoint returning `EvidenceStrengthResponse`, and embedded strengths in `POST /extract-evidence` and `POST /generate-insights`.
  - Investigation Workspace: Investigation Context embeds finding confidence, confidence rationale, and contradiction warnings.
  - Copilot Grounded Q&A: Injects active finding confidence and detailed evidence strength into responses.
  - React Frontend: Status badges (`[HIGH CONFIDENCE]`, `[CONFLICTING]`, etc.), evidence signal counts, and "Next to verify" guidance chips.
  - Test Suite: 26 dedicated unit and integration tests in `tests/test_v1_4_4_2_evidence_strength.py` (110/110 tests passing overall, 0 frontend build errors).

