# Autonomous Data Intelligence Platform

An end-to-end data intelligence pipeline that ingests raw datasets, performs automated preprocessing, applies ML models for prediction and anomaly detection, generates natural-language insights using the Gemini AI API, and exposes results via a FastAPI backend and a Streamlit dashboard.

## Features
- **Data Ingestion:** Load CSVs or fetch data from external APIs.
- **Data Processing:** Automatically handle missing values, encode categoricals, and scale numeric features.
- **Analytics:** Generate descriptive statistics, correlation matrices, and categorical summaries.
- **Machine Learning Engine:** Auto-detects classification vs regression to train Random Forest baseline models.
- **Anomaly Detection:** Unsupervised anomaly detection using Isolation Forests.
- **AI Insight Layer:** Generates human-readable, actionable insights from your data using Google Gemini.

## Requirements

You will need a Google Gemini API key if you want to use the AI Insight generation feature. Get one at [Google AI Studio](https://aistudio.google.com/).
Create a `.env` file in the root directory and add:
```
GEMINI_API_KEY=your_api_key_here
```

## Setup & Installation

1. **Create and activate a virtual environment:**
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On Mac/Linux:
   source venv/bin/activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

## Running the Application

This project runs on two separate servers: a backend API (FastAPI) and a frontend dashboard (Streamlit).

### 1. Start the Backend (FastAPI)
Open a terminal, ensure your virtual environment is activated, and run:
```bash
uvicorn backend.main:app --reload
```
*The API will be available at `http://localhost:8000`*
*Interactive API docs (Swagger) available at `http://localhost:8000/docs`*

### 2. Start the Frontend (Streamlit)
Open a **second** terminal, activate your virtual environment, and run:
```bash
streamlit run frontend/app.py
```
*The dashboard will automatically open in your browser (usually `http://localhost:8501`).*

## Usage
1. Upload any CSV dataset on the Streamlit dashboard.
2. Navigate through the tabs to Process Data, Generate Analytics, Train ML Models, or Detect Anomalies.
3. Once Analytics are generated, go to the AI Insights tab to get a Gemini-powered summary of your data.
