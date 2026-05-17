import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api.routes import router
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = FastAPI(
    title="Autonomous Data Intelligence Platform",
    description="API for automating data ingestion, processing, analytics, ML, and AI insights.",
    version="1.0.0"
)

def _cors_origins() -> list[str]:
    configured = os.getenv("APP_CORS_ORIGINS")
    if configured:
        return [origin.strip() for origin in configured.split(",") if origin.strip()]
    return [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8501",
        "http://127.0.0.1:8501",
    ]


# Keep local frontend development working without exposing credentialed wildcard CORS.
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins(),
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")


@app.get("/")
def read_root():
    return {"message": "Welcome to the Autonomous Data Intelligence Platform API"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
