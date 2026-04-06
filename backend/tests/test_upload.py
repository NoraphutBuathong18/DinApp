import os
import pytest
from httpx import AsyncClient

# The config module should be importable directly
from config import STORAGE_DIR

def test_upload_valid_file(client):
    file_content = b"N,P,K,temperature,humidity,ph,rainfall,label\n90,42,43,20.8,82.0,6.5,202.9,rice"
    dummy_filename = "pytest_dummy_soil.csv"
    
    # Ensure the file doesn't exist before test
    target_path = os.path.join(STORAGE_DIR, dummy_filename)
    if os.path.exists(target_path):
        os.remove(target_path)
        
    response = client.post(
        "/upload/",
        files={"file": (dummy_filename, file_content, "text/csv")}
    )
    
    assert response.status_code == 200
    assert response.json()["filename"] == dummy_filename
    
    # Assert file was actually saved
    assert os.path.exists(target_path)
    
    # Cleanup
    if os.path.exists(target_path):
        os.remove(target_path)

def test_upload_invalid_file_extension(client):
    file_content = b"Some random text data"
    dummy_filename = "pytest_invalid_file.txt"
    
    response = client.post(
        "/upload/",
        files={"file": (dummy_filename, file_content, "text/plain")}
    )
    
    assert response.status_code == 400
    assert "Unsupported file type" in response.json()["detail"]
    
    # Assert file was NOT saved
    target_path = os.path.join(STORAGE_DIR, dummy_filename)
    assert not os.path.exists(target_path)
