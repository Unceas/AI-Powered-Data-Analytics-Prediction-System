import pandas as pd
from fastapi import UploadFile, HTTPException
import io
import requests
from typing import Dict, Any, Optional

async def load_csv_from_upload(upload_file: UploadFile) -> pd.DataFrame:
    """Loads a CSV file from a FastAPI UploadFile into a Pandas DataFrame."""
    if not upload_file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a CSV file.")
    try:
        contents = await upload_file.read()
        df = pd.read_csv(io.BytesIO(contents))
        return df
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading CSV: {str(e)}")

def load_from_api(url: str, method: str = "GET", headers: Optional[Dict[str, str]] = None, params: Optional[Dict[str, str]] = None, data_key: Optional[str] = None) -> pd.DataFrame:
    """Fetches data from an API and loads it into a Pandas DataFrame."""
    try:
        response = requests.request(method=method, url=url, headers=headers, params=params)
        response.raise_for_status()
        data = response.json()
        
        if data_key:
            if data_key in data:
                data = data[data_key]
            else:
                raise ValueError(f"Data key '{data_key}' not found in API response.")
                
        df = pd.DataFrame(data)
        return df
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=400, detail=f"API request failed: {str(e)}")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Error parsing API response: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error creating DataFrame from API data: {str(e)}")
