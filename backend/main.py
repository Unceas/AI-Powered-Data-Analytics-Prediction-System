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

# Add CORS middleware to allow Streamlit frontend to communicate with the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
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
