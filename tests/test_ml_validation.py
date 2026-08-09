import pandas as pd
import pytest
from httpx import AsyncClient, ASGITransport
from backend.main import app

@pytest.mark.anyio
async def test_predict_csv_missing_target():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        df = pd.DataFrame({"a": [1, 2, 3]})
        csv = df.to_csv(index=False).encode()
        resp = await ac.post("/api/predict-csv", data={"target_column": ""}, files={"file": ("data.csv", csv, "text/csv")})
        assert resp.status_code == 422
        assert resp.json().get("detail") is not None
