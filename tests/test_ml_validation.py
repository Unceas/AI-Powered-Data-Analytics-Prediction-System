import pandas as pd
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_predict_csv_missing_target():
    df = pd.DataFrame({"a": [1, 2, 3]})
    csv = df.to_csv(index=False).encode()
    resp = client.post("/api/predict-csv", data={"target_column": ""}, files={"file": ("data.csv", csv, "text/csv")})
    assert resp.status_code == 422
    assert resp.json().get("detail") is not None
