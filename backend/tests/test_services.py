import os
import pandas as pd
import pytest
from unittest.mock import patch, AsyncMock

from services.csv_parser import parse_and_summarize
from services.ai_service import ai_service, RateLimitError
from services.email_service import send_otp_email

# ===== CSV & SOIL MODEL TESTS =====

def test_csv_parser_and_soil_model(tmp_path):
    # Create fake CSV with extreme values to test all model boundary conditions
    csv_file = tmp_path / "test_soil.csv"
    data = {
        "N": [50.0, 10.0, 150.0], # Normal, Low, Excess
        "P": [30.0, 5.0, 100.0],
        "K": [40.0, 5.0, 100.0],
        "ph": [6.5, 4.0, 9.0],
        "temperature": [25.0, 24.0, 26.0],
        "humidity": [60.0, 55.0, 65.0]
    }
    df = pd.DataFrame(data)
    df.to_csv(csv_file, index=False)
    
    result = parse_and_summarize(str(csv_file))
    
    assert result["total_rows"] == 3
    assert result["filename"] == "test_soil.csv"
    assert "N" in result["summary"]
    assert "dl_analysis" in result
    
    dl = result["dl_analysis"]
    # We purposefully triggered extreme conditions in row 1 & 2
    assert len(dl["risks"]) > 0 
    assert len(dl["fertilizer_recommendations"]) > 0
    assert "npk_insights" in result

def test_csv_parser_unsupported_type():
    with pytest.raises(ValueError, match="Unsupported file type"):
        parse_and_summarize("fake.txt")
        
def test_csv_parser_missing_columns(tmp_path):
    csv_file = tmp_path / "bad.csv"
    df = pd.DataFrame({"age": [10, 20], "name": ["A", "B"]})
    df.to_csv(csv_file, index=False)
    with pytest.raises(ValueError, match="ไม่พบคอลัมน์ข้อมูลดินที่รับรองในไฟล์นี้"):
        parse_and_summarize(str(csv_file))

# ===== AI SERVICE TESTS =====

@pytest.mark.asyncio
@patch("services.ai_service.AIService._call_openai_compatible", new_callable=AsyncMock)
async def test_ai_service_success(mock_call):
    mock_call.return_value = "AI Response"
    reply = await ai_service.chat("Hello")
    assert reply == "AI Response"

@pytest.mark.asyncio
@patch("services.ai_service.AIService._call_openai_compatible", new_callable=AsyncMock)
async def test_ai_service_fallback(mock_call):
    mock_call.side_effect = [RateLimitError("Rate Limit"), "Fallback Response"]
    reply = await ai_service.chat("Hello")
    assert "Fallback Response" in reply

@pytest.mark.asyncio
@patch("services.ai_service.AIService._call_openai_compatible", new_callable=AsyncMock)
async def test_ai_service_all_fail(mock_call):
    mock_call.side_effect = RateLimitError("Rate Limit")
    reply = await ai_service.chat("Hello")
    assert "ถูกจำกัดอัตราการใช้งาน" in reply

# ===== EMAIL SERVICE TESTS =====

@pytest.mark.asyncio
@patch("services.email_service.resend.Emails.send")
async def test_send_email_success(mock_send):
    await send_otp_email("test@example.com", "123456")
    mock_send.assert_called_once()
