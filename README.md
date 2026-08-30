# InsightGrid — Evidence-Driven Data Analytics & Analytical Reasoning System

[![Python](https://img.shields.io/badge/Python-3.11%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18%20%7C%20TypeScript-61DAFB.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-Bundler-646CFF.svg)](https://vitejs.dev/)
[![Tests](https://img.shields.io/badge/Pytest-61%2F61%20Passing%20(100%25)-brightgreen.svg)]()
[![Status](https://img.shields.io/badge/Version-V1.4.2%20(Proactive%20Lineage)-blueviolet.svg)]()

InsightGrid is an **evidence-backed analytical reasoning operating system** designed to transform raw tabular data into structured, traceable intelligence. Moving far beyond static dashboards or hallucinated AI summaries, InsightGrid enforces **mathematically verified evidence**, **calibrated predictive validation**, and **interactive progressive decomposition chains** (**Finding $\to$ Dimension $\to$ Observation $\to$ Evidence**).

---

## 🌟 Key Highlights & Architectural Flow

```
Dataset Ingestion
       │
       ▼
Data Understanding & Profiling (Types, Cardinality, Skewness, Candidate Targets)
       │
       ▼
Statistical Analytics (Pearson Correlations, Distribution Moments, Isolation Forest Outliers)
       │
       ▼
Deterministic Evidence Layer (Immutable EvidenceItems with Units, Provenance & Scope)
       │
       ▼
Prediction Engine V1.1 (Stratified Holdout, Calibrated Reliability Scores & Driver Attribution)
       │
       ▼
Proactive Discovery Engine V1.4.1 (Multi-Factor Deterministic Ranking & Top 3–5 Key Findings)
       │
       ▼
Why? Progressive Decomposition Chains V1.4.2 (Interactive Finding → Dimension → Observation → Evidence)
       │
       ▼
Persistent Analytical Workspace (Single Source of Truth Across Tabs & Handoffs)
```

---

## 🚀 Version Evolution Summary

| Version | Milestone | Key Capabilities |
|---|---|---|
| **V1.0** | **Analytics & Preprocessing** | Automated missing value imputation, scaling, Random Forest fitting, Isolation Forest anomaly screening, PDF business reports. |
| **V1.1** | **Calibrated Prediction Engine** | Stratified 80/20 holdout evaluations, zero synthetic metrics, calibrated reliability scoring ($0-100$), multi-factor driver attribution. |
| **V1.2** | **Analytical Intelligence & Decision Layer** | Immutable `EvidenceItem` extraction with statistical units and provenance, deterministic insight scoring, 6-part executive `DecisionBrief`, grounded context derivation. |
| **V1.3** | **Persistent Analytical Workspace** | Centralized `WorkspaceContext` state management, universal 1-click "Why?" buttons, cross-tab continuity (Understand $\leftrightarrow$ Analyze $\leftrightarrow$ Predict $\leftrightarrow$ Investigate $\leftrightarrow$ Ask Copilot), safe root invalidation. |
| **V1.4.1** | **Proactive Discovery Engine** | Deterministic multi-factor scoring (Magnitude, Severity, Target Relevance, Corroboration), diversity deduplication ($-15.0$ redundant penalty), top 3–5 Key Findings showcase (`INSIGHTGRID FOUND: X things worth investigating first`). |
| **V1.4.2** | **Why? Progressive Decomposition Chains** | `InvestigationNode` lineage trees ($Finding \to Dimension \to Observation \to Evidence$), strict Investigation Integrity Rules (measurements derived exclusively from verified aggregates), live `POST /investigate-step` interactive drill-down. |

👉 For full version details and design decisions, see [**docs/VERSION_HISTORY.md**](docs/VERSION_HISTORY.md).  
👉 For complete architectural contracts and pipeline specifications, see [**docs/ARCHITECTURE.md**](docs/ARCHITECTURE.md).

---

## 🔒 Investigation Integrity Rules

InsightGrid adheres to strict principles to ensure every claim is real and verifiable:

1. **Measurable Verification**: Every observation contains an exact measurable statistic (`cohort_record_count`, `mean_distribution`, `pearson_r`).
2. **Column Provenance**: Every observation identifies the dataset column(s) used.
3. **Reproducibility**: Every observation is reproducible from underlying analytical aggregates (`categorical_summaries`, `distributions`, `correlation_matrix`, or `evidence_items`).
4. **Sample Values Restriction**: `ColumnProfile.sample_values` are only used for validating column existence, NEVER as evidence for an analytical claim.
5. **No Fabricated Causality**: Correlation is never described as causation ("shows the largest observed concentration", "observed linear relationship").
6. **Graceful Insufficiency Handling**: If analytical data is missing for a requested dimension, returns `"No supported decomposition available"` rather than inventing numbers.
7. **No Fabricated IDs**: Evidence IDs and node IDs are strictly generated and tracked by the backend.
8. **Backend Single Source of Truth**: The React UI renders strictly what the backend calculates.

---

## 💻 Tech Stack

- **Backend**: Python 3.11+, FastAPI, Pydantic V2, NumPy, Pandas, Scikit-learn, Requests, Pytest.
- **Frontend**: React 18, Vite, TypeScript, Lucide Icons, Recharts, Context API.
- **AI & Natural Language**: Groq API, LLaMA 3.1 8B Instant (for grounded Q&A over verified evidence).

---

## ⚡ Quickstart & Local Setup

### 1. Prerequisites
- Python 3.11+
- Node.js 18+ & npm

### 2. Backend Setup
```bash
# Clone the repository
git clone https://github.com/Unceas/AI-Powered-Data-Analytics-Prediction-System.git
cd AI-Powered-Data-Analytics-Prediction-System

# Create and activate virtual environment
python -m venv venv

# Windows PowerShell:
.\venv\Scripts\Activate.ps1
# Linux / macOS:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env and add your GROQ_API_KEY (optional for LLM grounding; deterministic engine works 100% offline)

# Start backend server
uvicorn backend.main:app --reload --port 8000
```

### 3. Frontend Setup
```bash
cd frontend-react
npm install
npm run dev
```
Open **`http://localhost:5173`** in your browser to access the workspace.

---

## 🧪 Automated Testing & Verification

InsightGrid features an extensive automated test suite verifying data ingestion, statistical calculations, ML holdout validation, evidence provenance, workspace persistence, and progressive decomposition:

```bash
# Run backend pytest suite (61 tests)
python -m pytest

# Run frontend build and type checks
cd frontend-react
npm run build
```

---

## 📡 API Overview

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/upload-csv` | Ingests CSV dataset and returns structural metadata |
| `POST` | `/understand-csv` | Computes column profiles, cardinality, and quality details |
| `POST` | `/process-data` | Imputes missing values, normalizes, and encodes variables |
| `POST` | `/analyze-dataframe` | Computes correlations, distribution moments, and outliers |
| `POST` | `/extract-evidence` | Extracts deterministic, immutable `EvidenceItem` objects |
| `POST` | `/predict-csv` | Trains estimators on 80/20 holdout with calibrated reliability scoring |
| `POST` | `/generate-insights` | Synthesizes prioritized, deduplicated `InsightItem` findings |
| `POST` | `/investigate-insight` | Initializes `InvestigationContext` and root finding node |
| `POST` | `/investigate-step` | Progressively decomposes an investigation along a selected dimension |
| `POST` | `/generate-decision-brief` | Synthesizes 6-part executive `DecisionBrief` |
| `POST` | `/ask-insightgrid` | Evidence-grounded conversational Q&A |
| `POST` | `/generate-report` | Compiles comprehensive executive PDF intelligence report |

---

## 👥 Author & License

- **Author**: Ayush Kushwaha
- **Repository**: [https://github.com/Unceas/AI-Powered-Data-Analytics-Prediction-System](https://github.com/Unceas/AI-Powered-Data-Analytics-Prediction-System)
- **License**: MIT License
