import pytest
from unittest.mock import patch, AsyncMock

def test_chat_success(client):
    with patch("routes.chat.ai_service.chat", new_callable=AsyncMock) as mock_chat:
        mock_chat.return_value = "This is a mock AI response."
        
        response = client.post(
            "/chat/",
            json={"message": "Hello", "context": "Testing"}
        )
        assert response.status_code == 200
        assert response.json()["reply"] == "This is a mock AI response."

def test_chat_error(client):
    with patch("routes.chat.ai_service.chat", new_callable=AsyncMock) as mock_chat:
        mock_chat.side_effect = Exception("Mock AI Error")
        
        response = client.post(
            "/chat/",
            json={"message": "Hello"}
        )
        assert response.status_code == 500
        assert "AI chat error:" in response.json()["detail"]
