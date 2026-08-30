# InsightGrid System Architecture & Domain Design

InsightGrid is built as an **evidence-backed analytical reasoning operating system**. Rather than acting as a simple visualization wrapper or conversational chat interface, InsightGrid enforces strict analytical integrity, deterministic evidence provenance, calibrated machine learning validation, and persistent workspace state continuity.

---

## 🏛️ Domain Pipeline Architecture

```
Raw CSV / Excel Dataset
           │
           ▼
1. Data Ingestion & Validation (/upload-csv)
           │
           ▼
2. Data Understanding (/understand-csv)
   • ColumnProfiles (Types, Cardinality, Skewness, Candidate Targets)
   • Quality Details & Dataset Limitations
           │
           ▼
3. Statistical Analytics & Feature Profiling (/analyze-dataframe)
   • Pearson Correlation Matrix & Categorical Frequencies
   • Univariate & Bivariate Distribution Moments
   • Isolation Forest Outlier Diagnostics (> 2.1σ)
           │
           ▼
4. Deterministic Evidence Layer (/extract-evidence)
   • Immutable EvidenceItems with Provenance, Physical Units & Scope
   • Zero LLM Modification Allowed
           │
           ▼
5. Calibrated Prediction Engine V1.1 (/predict-csv)
   • Stratified 80/20 Holdout Validation
   • Calibrated Reliability Scores & Driver Attribution
           │
           ▼
6. Proactive Discovery & Insight Prioritization (/generate-insights)
   • Multi-Factor Deterministic Ranking (Magnitude, Severity, Target Relevance)
   • Diversity Deduplication (Penalizes Overlapping Categories/Features)
   • Grounded Investigation Candidates from Actual Column Profiles
           │
           ▼
7. Why? Progressive Decomposition Chains (/investigate-step)
   • InvestigationNode Lineage: Finding → Dimension → Observation → Evidence
   • Grounded in Aggregates (Categorical Summaries, Distributions, Correlations)
   • Strict Investigation Integrity Rules (Zero Fabricated Causality/Numbers)
           │
           ▼
8. Executive Decision Brief Synthesis (/generate-decision-brief)
   • 6-Part Executive Intelligence Brief
           │
           ▼
9. Persistent Analytical Workspace (WorkspaceContext)
   • Single Source of Truth Across Tabs (Understand → Analyze → Predict → Investigate → Ask)
```

---

## 📐 Core Domain Contracts (`backend/domain/contracts.py`)

### 1. `EvidenceItem`
An immutable, mathematically verified analytical fact extracted directly from raw data or validated models.
```python
class EvidenceItem(BaseModel):
    evidence_id: str
    analysis_id: str
    dataset_id: str
    category: Literal["correlation", "anomaly", "distribution", "metric", "driver", "quality", "trend", "segment"]
    title: str
    description: str
    metric_name: str
    metric_value: Any
    unit: Optional[str] = None
    period: Optional[str] = None
    scope: Optional[str] = None
    strength: Literal["High", "Medium", "Low"] = "Medium"
    related_columns: List[str] = Field(default_factory=list)
    source: str
    provenance: Dict[str, Any] = Field(default_factory=dict)
    technical_details: Dict[str, Any] = Field(default_factory=dict)
```

### 2. `InsightItem`
A prioritized analytical finding derived directly from supporting `EvidenceItem` IDs.
```python
class InsightItem(BaseModel):
    insight_id: str
    analysis_id: str
    dataset_id: str
    category: Literal["Correlation", "Prediction", "Anomaly", "Trend", "Quality", "Recommendation"]
    title: str
    summary: str
    why_it_matters: str
    severity: Literal["Critical", "High", "Medium", "Low"]
    priority: Literal["High", "Medium", "Low"] = "Medium"
    priority_score: float = 0.0
    priority_reasons: List[str] = Field(default_factory=list)
    reason_for_priority: Optional[str] = None
    is_key_finding: bool = False
    evidence_ids: List[str] = Field(default_factory=list)
    evidence_items: List[EvidenceItem] = Field(default_factory=list)
    related_columns: List[str] = Field(default_factory=list)
    investigation_candidates: List[str] = Field(default_factory=list)
    recommended_next_step: str
    actionable_investigation_target: Optional[str] = None
```

### 3. `InvestigationNode`
A single node in a progressive decomposition chain communicating analytical lineage.
```python
class InvestigationNode(BaseModel):
    node_id: str
    investigation_id: str
    type: Literal["finding", "dimension", "observation", "evidence"]
    label: str
    value: Optional[Any] = None
    related_columns: List[str] = Field(default_factory=list)
    evidence_ids: List[str] = Field(default_factory=list)
    parent_node_id: Optional[str] = None
    depth: int = 0
    available_next_dimensions: List[str] = Field(default_factory=list)
    description: Optional[str] = None
    metric_name: Optional[str] = None
    metric_value: Optional[Any] = None
    is_terminal: bool = False
```

### 4. `InvestigationContext`
The state container for an analytical investigation workspace.
```python
class InvestigationContext(BaseModel):
    investigation_id: str
    insight_id: Optional[str] = None
    dataset_id: str
    analysis_id: str
    primary_feature: str
    target_feature: Optional[str] = None
    relevant_dimensions: List[InvestigationDimension] = Field(default_factory=list)
    drill_down_path: List[str] = Field(default_factory=list)
    supporting_evidence_ids: List[str] = Field(default_factory=list)
    summary: str
    suggested_prediction_target: Optional[str] = None
    nodes: List[InvestigationNode] = Field(default_factory=list)
    root_node_id: Optional[str] = None
    active_node_id: Optional[str] = None
```

---

## 🔒 Investigation Integrity Rules

To guarantee that InsightGrid never fabricates data or claims unsupported conclusions:

1. **Measurable Verification**: Every observation MUST contain a measurable value or statistic calculated from data.
2. **Column Provenance**: Every observation MUST identify the dataset column(s) used.
3. **Reproducibility**: Every observation MUST be reproducible from the underlying dataset or analytical aggregates (`categorical_summaries`, `distributions`, `correlation_matrix`, or `evidence_items`).
4. **Sample Values Restriction**: `ColumnProfile.sample_values` may be used solely to validate column existence or display sample options, NEVER as evidence for an analytical claim.
5. **No Fabricated Causality**: Correlation is never described as causation. Findings use associative language ("shows the largest observed concentration", "observed linear relationship").
6. **Graceful Insufficiency Handling**: If analytical data is missing for a requested dimension, the system returns `"No supported decomposition available"` rather than inventing numbers.
7. **No Fabricated IDs**: Evidence IDs and node IDs are strictly generated and tracked by the backend.
8. **Backend Single Source of Truth**: React frontend renders strictly what the backend calculates.

---

## 🌐 API Specifications

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/upload-csv` | Ingests CSV dataset, returns row/column count and structure preview |
| `POST` | `/understand-csv` | Computes column profiles, cardinality, candidate targets, and health score |
| `POST` | `/process-data` | Executes missing value imputation, scaling, and categorical encoding |
| `POST` | `/analyze-dataframe` | Computes correlations, distribution moments, and multivariate outliers |
| `POST` | `/extract-evidence` | Extracts deterministic, immutable `EvidenceItem` objects |
| `POST` | `/predict-csv` | Trains estimators on 80/20 holdout with calibrated reliability scoring |
| `POST` | `/generate-insights` | Synthesizes prioritized, deduplicated `InsightItem` findings |
| `POST` | `/investigate-insight` | Initializes `InvestigationContext` and root finding node |
| `POST` | `/investigate-step` | Progressively decomposes an investigation along a selected dimension |
| `POST` | `/generate-decision-brief` | Synthesizes 6-part executive `DecisionBrief` |
| `POST` | `/ask-insightgrid` | Evidence-grounded conversational Q&A with conversational memory |
| `POST` | `/generate-report` | Compiles comprehensive executive PDF intelligence report |
