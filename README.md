# ⚡ InsightGrid — AI-Powered Data Analytics & Prediction System

An end-to-end data intelligence platform that ingests raw datasets, performs automated preprocessing, applies ML models for prediction and anomaly detection, generates natural-language insights using the Groq AI API, and exposes results via a **FastAPI** backend and a **React + Vite** dashboard.

## ✨ Features

- **Data Ingestion** — Upload CSVs/Excel or fetch data from external APIs
- **Data Processing** — Auto-handle missing values, encode categoricals, scale numerics
- **Analytics** — Descriptive statistics, correlation matrices, categorical summaries
- **ML Engine** — Auto-detects classification vs regression; trains Random Forest baselines
- **Anomaly Detection** — Unsupervised anomaly detection via Isolation Forest
- **AI Insight Layer** — Generates human-readable insights using Groq (LLaMA 3.1)

## 🏗️ Architecture

```
Frontend (React + Vite)          Backend (FastAPI + ML Pipeline)
    Vercel                            Render / Railway
       │                                    │
       └──── REST API (JSON) ───────────────┘
```

---

## 🚀 Local Development

### Prerequisites

- **Python 3.11+** and **Node.js 18+**
- A [Groq API key](https://console.groq.com/) for AI insight generation

### 1. Clone & setup backend

```bash
git clone https://github.com/YOUR_USERNAME/insightgrid.git
cd insightgrid

python -m venv venv
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env and add your GROQ_API_KEY
```

### 3. Start the backend

```bash
uvicorn backend.main:app --reload
```

> API → `http://localhost:8000` · Swagger docs → `http://localhost:8000/docs`

### 4. Start the frontend

```bash
cd frontend-react
npm install
npm run dev
```

> Dashboard → `http://localhost:5173`

---

## ☁️ Deployment

### Frontend → Vercel

1. Push the repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new) → Import your repo
3. Set **Root Directory** to `frontend-react`
4. Vercel auto-detects Vite — confirm these settings:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Add environment variable:
   ```
   VITE_API_URL = https://your-backend.onrender.com/api
   ```
6. Deploy ✅

### Backend → Render

1. Go to [render.com](https://render.com) → **New Web Service**
2. Connect your GitHub repo
3. Configure:
   - **Root Directory:** `.` (project root)
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables:
   ```
   GROQ_API_KEY      = your_groq_api_key
   APP_CORS_ORIGINS  = https://your-app.vercel.app
   ```
5. Deploy ✅

> **Tip:** The included `render.yaml` enables one-click Blueprint deployment.

### Backend → Railway (Alternative)

1. Go to [railway.app](https://railway.app) → **New Project** → Deploy from GitHub
2. Railway auto-detects the `Procfile`
3. Add the same environment variables as Render
4. Deploy ✅

---

## 🔗 Frontend ↔ Backend Integration

| Direction | Data |
|-----------|------|
| **Frontend → Backend** | CSV/Excel uploads, preprocessing configs, analytics requests |
| **Backend → Frontend** | Processed data, predictions, AI-generated insights |
| **Format** | JSON over REST APIs |

### Supported Upload Formats

| Format | Handler |
|--------|---------|
| `.csv` | `pandas.read_csv()` |
| `.xlsx` / `.xls` | `pandas.read_excel()` |

---

## 📁 Project Structure

```
├── backend/
│   ├── main.py              # FastAPI app entry point
│   ├── api/routes.py        # REST endpoints
│   ├── ingestion/           # CSV/API data loading
│   ├── processing/          # Auto-cleaning pipeline
│   ├── analytics/           # Statistical analysis
│   ├── ml/                  # ML training & anomaly detection
│   └── ai/                  # Groq-powered insight generation
├── frontend-react/
│   ├── src/                 # React + TypeScript source
│   ├── vercel.json          # Vercel deployment config
│   └── package.json
├── requirements.txt         # Python dependencies
├── Procfile                 # Railway/Render start command
├── render.yaml              # Render Blueprint
├── runtime.txt              # Python version pin
└── .env.example             # Environment variable template
```

---

## ⚡ Production Roadmap

- [ ] Async processing with background workers
- [ ] Redis caching for repeated queries
- [ ] PostgreSQL for persistent dataset storage
- [ ] Celery/RQ worker queues for heavy ML jobs
- [ ] Cloud storage (S3) for uploaded files

---

## 📄 License

MIT
