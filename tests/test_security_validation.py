from fastapi.testclient import TestClient

from backend.ingestion.loader import load_from_api
from backend.main import app


client = TestClient(app)


def test_upload_rejects_unsupported_extension():
    response = client.post(
        "/api/upload-csv",
        files={"file": ("data.txt", b"a,b\n1,2\n", "text/plain")},
    )

    assert response.status_code == 400


def test_process_rejects_invalid_config_json():
    response = client.post(
        "/api/process-csv",
        data={"config": "{not-json"},
        files={"file": ("data.csv", b"a,b\n1,2\n", "text/csv")},
    )

    assert response.status_code == 422


def test_anomaly_detection_rejects_invalid_contamination():
    response = client.post(
        "/api/detect-anomalies",
        data={"contamination": "0.9"},
        files={"file": ("data.csv", b"a,b\n1,2\n3,4\n", "text/csv")},
    )

    assert response.status_code == 422


def test_api_ingestion_blocks_localhost():
    response = client.post(
        "/api/ingest-api",
        json={"url": "http://localhost:8000/health", "method": "GET"},
    )

    assert response.status_code == 400


def test_loader_blocks_private_ip_url():
    try:
        load_from_api("http://127.0.0.1:8000/health")
    except Exception as exc:
        assert getattr(exc, "status_code", None) == 400
    else:
        raise AssertionError("Expected private API URL to be blocked")
