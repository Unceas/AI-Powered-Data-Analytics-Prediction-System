import pandas as pd
from fastapi import UploadFile, HTTPException
import io
import requests
import ipaddress
import os
import socket
from typing import Dict, Optional
from urllib.parse import urlparse

MAX_UPLOAD_BYTES = int(os.getenv("MAX_UPLOAD_MB", "10")) * 1024 * 1024
MAX_API_RESPONSE_BYTES = int(os.getenv("MAX_API_RESPONSE_MB", "5")) * 1024 * 1024
REQUEST_TIMEOUT_SECONDS = float(os.getenv("API_INGEST_TIMEOUT_SECONDS", "10"))
ALLOWED_API_METHODS = {"GET", "POST"}
ALLOWED_API_SCHEMES = {"http", "https"}


def _is_private_hostname(hostname: str) -> bool:
    if hostname.lower() == "localhost":
        return True

    try:
        addresses = socket.getaddrinfo(hostname, None)
    except socket.gaierror:
        raise HTTPException(status_code=400, detail="API hostname could not be resolved.")

    for address in addresses:
        ip = ipaddress.ip_address(address[4][0])
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_multicast or ip.is_reserved:
            return True
    return False


def _validate_api_url(url: str) -> None:
    parsed = urlparse(url)
    if parsed.scheme not in ALLOWED_API_SCHEMES or not parsed.hostname:
        raise HTTPException(status_code=400, detail="Only absolute http(s) API URLs are allowed.")
    if _is_private_hostname(parsed.hostname):
        raise HTTPException(status_code=400, detail="Private, local, and reserved API hosts are not allowed.")


def _clean_headers(headers: Optional[Dict[str, str]]) -> Optional[Dict[str, str]]:
    if not headers:
        return None
    blocked = {"host", "content-length", "transfer-encoding", "connection"}
    return {key: value for key, value in headers.items() if key.lower() not in blocked}

async def load_csv_from_upload(upload_file: UploadFile) -> pd.DataFrame:
    """Loads a CSV or Excel file from a FastAPI UploadFile into a Pandas DataFrame."""
    if not upload_file.filename:
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a CSV or Excel file.")
    
    filename = upload_file.filename.lower()
    is_csv = filename.endswith('.csv')
    is_excel = filename.endswith('.xlsx') or filename.endswith('.xls')
    
    if not (is_csv or is_excel):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a CSV or Excel file.")
        
    try:
        contents = await upload_file.read(MAX_UPLOAD_BYTES + 1)
        if len(contents) > MAX_UPLOAD_BYTES:
            max_mb = MAX_UPLOAD_BYTES // (1024 * 1024)
            raise HTTPException(status_code=413, detail=f"Uploaded file exceeds the {max_mb} MB limit.")
        if is_csv:
            df = pd.read_csv(io.BytesIO(contents))
        else:
            df = pd.read_excel(io.BytesIO(contents))
        if df.empty:
            raise HTTPException(status_code=400, detail="Uploaded file contains no data.")
        return df
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading uploaded file: {str(e)}")

def load_from_api(url: str, method: str = "GET", headers: Optional[Dict[str, str]] = None, params: Optional[Dict[str, str]] = None, data_key: Optional[str] = None) -> pd.DataFrame:
    """Fetches data from an API and loads it into a Pandas DataFrame."""
    try:
        method = method.upper()
        if method not in ALLOWED_API_METHODS:
            raise HTTPException(status_code=400, detail="Only GET and POST API ingestion requests are allowed.")
        _validate_api_url(url)

        response = requests.request(
            method=method,
            url=url,
            headers=_clean_headers(headers),
            params=params,
            timeout=REQUEST_TIMEOUT_SECONDS,
            allow_redirects=False,
            stream=True,
        )
        response.raise_for_status()
        content = response.content
        if len(content) > MAX_API_RESPONSE_BYTES:
            max_mb = MAX_API_RESPONSE_BYTES // (1024 * 1024)
            raise HTTPException(status_code=413, detail=f"API response exceeds the {max_mb} MB limit.")
        data = response.json()
        
        if data_key:
            if isinstance(data, dict) and data_key in data:
                data = data[data_key]
            else:
                raise ValueError(f"Data key '{data_key}' not found in API response.")
                
        df = pd.DataFrame(data)
        if df.empty:
            raise ValueError("API response did not contain tabular data.")
        return df
    except HTTPException:
        raise
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=400, detail=f"API request failed: {str(e)}")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Error parsing API response: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error creating DataFrame from API data: {str(e)}")
