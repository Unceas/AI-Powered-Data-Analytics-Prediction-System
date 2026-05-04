import pandas as pd
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_predict_csv_positive_path():
    df = pd.DataFrame({
        "target": [0, 1, 0, 1],
        "feat1": [0.5, 1.5, 0.3, 0.8],
        "feat2": [1.0, 2.0, 1.2, 2.4],
    })
    csv_bytes = df.to_csv(index=False).encode('utf-8')
    resp = client.post("/api/predict-csv", data={"target_column": "target"}, files={"file": ("data.csv", csv_bytes, "text/csv")})
    assert resp.status_code == 200
    data = resp.json()
    assert data.get("status") == "success"
    assert "model_type" in data
    assert "metrics" in data
