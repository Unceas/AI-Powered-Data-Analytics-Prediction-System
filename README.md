# InsightGrid — AI-Powered Data Analytics & Prediction System

![Python](https://img.shields.io/badge/Python-3.11-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688.svg)
![React](https://img.shields.io/badge/React-Frontend-61DAFB.svg)
![ML](https://img.shields.io/badge/Machine%20Learning-Enabled-orange.svg)
![Status](https://img.shields.io/badge/Project-Active-brightgreen)

An AI-powered analytics platform designed for intelligent dataset processing, predictive modeling, anomaly detection, and automated insight generation using modern ML pipelines and LLM-powered interpretation systems.

InsightGrid combines scalable backend services, machine learning workflows, and AI-generated analytical reasoning into a unified full-stack data intelligence platform.

---

## Engineering Motivation

Modern analytics workflows often require multiple disconnected tools for preprocessing, statistical analysis, predictive modeling, anomaly detection, and insight generation.

InsightGrid was designed to unify these capabilities into a modular AI-powered analytics system capable of transforming raw datasets into structured, interpretable intelligence pipelines.

The platform focuses on:
- scalable backend architecture
- automated preprocessing workflows
- intelligent ML orchestration
- AI-assisted dataset interpretation
- extensible analytics infrastructure

---

## Core Features

- Automated dataset ingestion pipeline
- CSV & Excel processing support
- Intelligent preprocessing workflows
- Missing value handling & feature encoding
- Correlation analysis & statistical summaries
- ML-powered prediction pipelines
- Isolation Forest anomaly detection
- LLM-generated business insights using Groq API
- FastAPI backend architecture
- Interactive React + Vite analytics dashboard

---

## Operational Architecture & State Machine

InsightGrid behaves as an **Operational Intelligence Console** rather than a static SaaS dashboard. Its real-time telemetry is governed by a strict, state-driven orchestration engine.

### Pipeline Orchestration States
The pipeline transitions through the following sequential states during dataset processing:
1. **`IDLE`**: Standing by, awaiting data ingestion. Infrastructure is pre-initialized and ready.
2. **`INITIALIZING`**: Acknowledges uploaded file context, extracts basic metadata.
3. **`VALIDATING`**: Performs structural scans, schema verification, and null rate computations.
4. **`PROCESSING`**: Triggers automated feature engineering, imputations, and normalization scaling.
5. **`ANALYZING`**: Maps statistical dimensions, builds attribution matrices, and calculates correlation arrays.
6. **`RUNNING INFERENCE`**: Fits estimators (Random Forest Classifier + Isolation Forest outliers) and computes metrics.
7. **`SYNTHESIZING INSIGHTS`**: Connects LLaMA-3 context vectors via Groq API to formulate natural language intelligence.
8. **`COMPLETE`**: Finalized state. Displays full canvas visuals, interactive anchors, and enables executive report exports.

### Live Telemetry Streaming
- **Execution Trace Logs**: High-frequency streaming output of pipeline event actions (e.g. standardizing variables, converging nodes, OOB accuracy settlements) rendered line-by-line with fine-grained millisecond timestamps.
- **System Heartbeat**: Active pulse telemetry indicating browser-to-runtime endpoint synchronization.

### Explainable AI (XAI) & Interactive Linking
- **Attribution Mapping**: Displays feature importance weights (Gini impurity decreases) directly tied to specific variables.
- **Anomaly Pulse Vectors**: Pulse indicators pinpointing Isolation Forest outlier markers deviating > 2.1σ.
- **Contextual Inspection**: Highlight overlays on the analytics canvas allowing users to trace reasoning nodes directly to prediction vectors.

---

## System Architecture

```bash
Frontend (React + Vite)
        │
        │ REST APIs / JSON
        ▼
Backend (FastAPI)
        │
        ├── Data Processing Pipeline
        ├── Analytics Engine
        ├── ML Prediction Layer
        ├── Anomaly Detection
        └── AI Insight Generation (Groq API)
```

---

## Technical Stack

| Layer | Technologies |
|------|---------------|
| Frontend | React, Vite, TypeScript |
| Backend | FastAPI, Python |
| ML & Analytics | Scikit-learn, Pandas, NumPy |
| AI Layer | Groq API, LLaMA 3.1 |
| Deployment | Vercel, Render, Railway |

---

## Local Development

### Prerequisites

- Python 3.11+
- Node.js 18+
- Groq API Key

### Backend Setup

```bash
git clone https://github.com/YOUR_USERNAME/insightgrid.git
cd insightgrid

python -m venv venv

# Windows
venv\Scripts\activate

# Linux / macOS
source venv/bin/activate

pip install -r requirements.txt
```

### Configure Environment

```bash
cp .env.example .env
```

Add your:

```env
GROQ_API_KEY=your_api_key
```

### Start Backend Server

```bash
uvicorn backend.main:app --reload
```

API:
```bash
http://localhost:8000
```

Swagger Docs:
```bash
http://localhost:8000/docs
```

### Frontend Setup

```bash
cd frontend-react
npm install
npm run dev
```

Dashboard:
```bash
http://localhost:5173
```

---

## Deployment

### Frontend → Vercel

```bash
Build Command:
npm run build

Output Directory:
dist
```

Environment Variable:

```env
VITE_API_URL=https://your-backend.onrender.com/api
```

### Backend → Render

```bash
Build Command:
pip install -r requirements.txt
```

```bash
Start Command:
uvicorn backend.main:app --host 0.0.0.0 --port $PORT
```

Environment Variables:

```env
GROQ_API_KEY=your_groq_api_key
APP_CORS_ORIGINS=https://your-app.vercel.app
```

### Backend → Railway

Railway automatically detects the included:

```bash
Procfile
```

Add the same environment variables used for Render deployment.

---

## API Integration Flow

| Direction | Data Flow |
|-----------|-----------|
| Frontend → Backend | Dataset uploads, analytics requests, preprocessing configurations |
| Backend → Frontend | Predictions, processed data, AI-generated insights |
| Communication Format | JSON over REST APIs |

---

## Supported Upload Formats

| Format | Processing Handler |
|--------|-------------------|
| `.csv` | `pandas.read_csv()` |
| `.xlsx` / `.xls` | `pandas.read_excel()` |

---

## Project Structure

```bash
├── backend/
│   ├── main.py
│   ├── api/routes.py
│   ├── ingestion/
│   ├── processing/
│   ├── analytics/
│   ├── ml/
│   └── ai/
│
├── frontend-react/
│   ├── src/
│   ├── vercel.json
│   └── package.json
│
├── requirements.txt
├── Procfile
├── render.yaml
├── runtime.txt
└── .env.example
```

---

## Core Engineering Concepts

- Modular backend architecture
- ML inference orchestration
- Automated preprocessing pipelines
- Statistical analytics systems
- LLM-powered insight generation
- Full-stack API integration
- AI-assisted business intelligence
- Scalable analytics infrastructure

---

## Production Roadmap

- Async task execution with worker queues
- Redis caching for repeated analytics queries
- PostgreSQL integration for persistent storage
- Distributed ML processing pipelines
- Cloud object storage integration (S3)
- Real-time analytics streaming
- Multi-user dataset management

---

## Future Vision

InsightGrid is being designed as a scalable AI-assisted analytics infrastructure capable of evolving into a fully autonomous business intelligence and predictive analytics platform.

The long-term goal is to combine:
- intelligent data pipelines
- automated ML workflows
- AI-driven interpretation
- scalable backend orchestration

into a unified analytics operating system.

---

## Author

Ayush Kushwaha
