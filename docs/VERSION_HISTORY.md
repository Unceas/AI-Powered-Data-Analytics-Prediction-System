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
