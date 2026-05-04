from fastapi import APIRouter, UploadFile, File, Body, Form
from backend.ingestion.loader import load_csv_from_upload, load_from_api
from backend.ingestion.schemas import IngestionResponse, APIIngestionRequest
from backend.processing.schemas import ProcessingConfig, ProcessingResponse
from backend.processing.cleaner import clean_and_process
from backend.analytics.schemas import AnalyticsResponse
from backend.analytics.analyzer import analyze_dataframe
from backend.ml.schemas import MLPredictionResponse, AnomalyDetectionResponse
from backend.ml.models import train_and_evaluate, detect_anomalies
from backend.ai.schemas import AIInsightRequest, AIInsightResponse
from backend.ai.insight_generator import generate_natural_language_insights
import json
import numpy as np

router = APIRouter()

@router.post("/upload-csv", response_model=IngestionResponse)
async def upload_csv(file: UploadFile = File(...)):
    """Upload a CSV dataset."""
    df = await load_csv_from_upload(file)
    # Convert dataframe to a format suitable for the response preview
    # Replace NaNs with None for JSON serialization
    preview_df = df.head(5).replace({np.nan: None})
    preview = preview_df.to_dict(orient="records")
    
    return IngestionResponse(
        status="success",
        message="CSV data loaded successfully",
        rows=len(df),
        columns=df.columns.tolist(),
        preview=preview
    )

@router.post("/ingest-api", response_model=IngestionResponse)
async def ingest_api(request: APIIngestionRequest = Body(...)):
    """Ingest dataset from an external API."""
    df = load_from_api(
        url=str(request.url),
        method=request.method,
        headers=request.headers,
        params=request.params,
        data_key=request.data_key
    )
    
    preview_df = df.head(5).replace({np.nan: None})
    preview = preview_df.to_dict(orient="records")
    
    return IngestionResponse(
        status="success",
        message="API data loaded successfully",
        rows=len(df),
        columns=df.columns.tolist(),
        preview=preview
    )

@router.post("/process-csv", response_model=ProcessingResponse)
async def process_csv(
    config: str = Form(...),
    file: UploadFile = File(...)
):
    """Upload a CSV and apply processing/cleaning to it."""
    # load csv
    df = await load_csv_from_upload(file)
    
    # parse config
    config_dict = json.loads(config)
    proc_config = ProcessingConfig(**config_dict)
    
    # process
    processed_df = clean_and_process(df, proc_config)
    
    # return preview
    preview_df = processed_df.head(5).replace({np.nan: None})
    preview = preview_df.to_dict(orient="records")
    
    return ProcessingResponse(
        status="success",
        message="Data processed successfully",
        rows=len(processed_df),
        columns=processed_df.columns.tolist(),
        preview=preview
    )

@router.post("/analyze-csv", response_model=AnalyticsResponse)
async def analyze_csv(file: UploadFile = File(...)):
    """Upload a CSV and generate descriptive statistics and correlations."""
    df = await load_csv_from_upload(file)
    
    desc_stats, corr_matrix, cat_summaries, distributions = analyze_dataframe(df)
    
    return AnalyticsResponse(
        status="success",
        message="Analytics generated successfully",
        descriptive_statistics=desc_stats,
        correlation_matrix=corr_matrix,
        categorical_summaries=cat_summaries,
        distributions=distributions
    )

@router.post("/predict-csv", response_model=MLPredictionResponse)
async def predict_csv(
    target_column: str = Form(...),
    file: UploadFile = File(...)
):
    """Upload a CSV, auto-detect problem type, and train a baseline ML model."""
    if target_column is None or target_column.strip() == "":
        from fastapi import HTTPException
        raise HTTPException(status_code=422, detail="Target column must be provided and non-empty")
    df = await load_csv_from_upload(file)
    
    try:
        model_type, metrics, feature_importance = train_and_evaluate(df, target_col=target_column)
    except ValueError as e:
        return MLPredictionResponse(
            status="error",
            message=str(e),
            model_type="None",
            metrics={}
        )
        
    return MLPredictionResponse(
        status="success",
        message="Model trained successfully",
        model_type=model_type,
        metrics=metrics,
        feature_importance=feature_importance
    )

@router.post("/detect-anomalies", response_model=AnomalyDetectionResponse)
async def detect_anomalies_csv(
    contamination: float = Form(0.05),
    file: UploadFile = File(...)
):
    """Upload a CSV and detect anomalies using Isolation Forest."""
    df = await load_csv_from_upload(file)
    
    try:
        total, detected, percentage, preview = detect_anomalies(df, contamination=contamination)
    except ValueError as e:
        return AnomalyDetectionResponse(
            status="error",
            message=str(e),
            total_records=0,
            anomalies_detected=0,
            anomaly_percentage=0.0,
            anomalies_preview=[]
        )
        
    return AnomalyDetectionResponse(
        status="success",
        message="Anomalies detected successfully",
        total_records=total,
        anomalies_detected=detected,
        anomaly_percentage=percentage,
        anomalies_preview=preview
    )

@router.post("/generate-insights", response_model=AIInsightResponse)
async def generate_insights(request: AIInsightRequest = Body(...)):
    """Generate human-readable insights from data analysis using Gemini API."""
    insights = generate_natural_language_insights(request.analysis_data, request.context)
    
    return AIInsightResponse(
        status="success",
        message="Insights generated",
        insights=insights
    )
