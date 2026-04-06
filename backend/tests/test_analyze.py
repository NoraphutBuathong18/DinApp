import os
import json
from unittest.mock import patch
from config import STORAGE_DIR
from models.soil_data import SoilAnalysis

@patch("routes.analyze.parse_and_summarize")
def test_analyze_file_success(mock_parse, client, db_session):
    # Setup mock return value for the heavy parser/ML model
    mock_parse.return_value = {
        "summary": {"records_processed": 5},
        "dl_analysis": {
            "averages": {
                "N": 80.5,
                "P": 42.1,
                "K": 43.2,
                "ph": 6.8,
                "temperature": 22.5,
                "humidity": 80.0,
                "rainfall": 200.0
            }
        },
        "npk_insights": "Ideal soil conditions"
    }

    dummy_filename = "pytest_analyze_target.csv"
    target_path = os.path.join(STORAGE_DIR, dummy_filename)
    
    # Create an empty file to satisfy os.path.exists check in the endpoint
    with open(target_path, "w") as f:
        f.write("dummy content")

    try:
        response = client.post(
            "/analyze/",
            json={"filename": dummy_filename}
        )
        
        assert response.status_code == 200
        
        # Verify db insertion
        analysis_record = db_session.query(SoilAnalysis).filter(SoilAnalysis.filename == dummy_filename).first()
        assert analysis_record is not None
        assert analysis_record.nitrogen == 80.5
        assert analysis_record.npk_insights == "Ideal soil conditions"
        
    finally:
        # Cleanup
        if os.path.exists(target_path):
            os.remove(target_path)

def test_analyze_file_not_found(client, db_session):
    response = client.post(
        "/analyze/",
        json={"filename": "this_file_does_not_exist_at_all.csv"}
    )
    
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()
    
    # Verify DB has no new records
    records = db_session.query(SoilAnalysis).all()
    assert len(records) == 0

@patch("routes.analyze.parse_and_summarize")
def test_analyze_file_value_error(mock_parse, client, db_session):
    mock_parse.side_effect = ValueError("Invalid columns")
    dummy_filename = "pytest_analyze_target.csv"
    target_path = os.path.join(STORAGE_DIR, dummy_filename)
    with open(target_path, "w") as f:
        f.write("dummy content")
    try:
        response = client.post("/analyze/", json={"filename": dummy_filename})
        assert response.status_code == 400
        assert "Invalid columns" in response.json()["detail"]
    finally:
        os.remove(target_path)

@patch("routes.analyze.parse_and_summarize")
def test_analyze_file_server_error(mock_parse, client, db_session):
    mock_parse.side_effect = Exception("Model Crash")
    dummy_filename = "pytest_analyze_target.csv"
    target_path = os.path.join(STORAGE_DIR, dummy_filename)
    with open(target_path, "w") as f:
        f.write("dummy content")
    try:
        response = client.post("/analyze/", json={"filename": dummy_filename})
        assert response.status_code == 500
        assert "Analysis failed" in response.json()["detail"]
    finally:
        os.remove(target_path)
