import pandas as pd
import pytest
from httpx import AsyncClient, ASGITransport
from backend.main import app

@pytest.mark.anyio
async def test_predict_csv_positive_path():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        df = pd.DataFrame({
            "target": [0, 1, 0, 1, 0, 1],
            "feat1": [0.5, 1.5, 0.3, 0.8, 0.4, 1.2],
            "feat2": [1.0, 2.0, 1.2, 2.4, 1.1, 2.2],
        })
        csv_bytes = df.to_csv(index=False).encode('utf-8')
        resp = await ac.post("/api/predict-csv", data={"target_column": "target"}, files={"file": ("data.csv", csv_bytes, "text/csv")})
        assert resp.status_code == 200
        data = resp.json()
        assert data.get("status") == "success"
        assert "model_type" in data
        assert "metrics" in data
        assert "prediction" in data
        assert "reliability" in data
