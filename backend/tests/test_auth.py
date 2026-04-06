from unittest.mock import patch
from models.user import User, OTPRequest
import datetime

# Mock the email service so tests don't send actual emails
@patch("routes.auth.send_otp_email")
def test_request_otp_success(mock_send_email, client, db_session):
    test_email = "test@example.com"
    
    response = client.post(
        "/auth/request-otp",
        json={"email": test_email}
    )
    
    assert response.status_code == 200
    assert response.json() == {"message": "OTP sent successfully"}
    
    # Verify mock was called
    mock_send_email.assert_called_once()
    
    # Verify User was created
    user = db_session.query(User).filter(User.email == test_email).first()
    assert user is not None
    
    # Verify OTP request was logged
    otp_record = db_session.query(OTPRequest).filter(OTPRequest.email == test_email).first()
    assert otp_record is not None
    assert otp_record.otp_code is not None

def test_verify_otp_invalid_email(client):
    response = client.post(
        "/auth/verify-otp",
        json={"email": "wrong@example.com", "otp": "123456"}
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "No OTP request found for this email"

@patch("routes.auth.send_otp_email")
def test_verify_otp_invalid_code(mock_send_email, client, db_session):
    test_email = "test2@example.com"
    
    # Request OTP first
    client.post("/auth/request-otp", json={"email": test_email})
    mock_send_email.assert_called_once()
    
    # Now verify with wrong OTP
    response = client.post(
        "/auth/verify-otp",
        json={"email": test_email, "otp": "wrong_otp"}
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid OTP code"

@patch("routes.auth.send_otp_email")
def test_verify_otp_success(mock_send_email, client, db_session):
    test_email = "success@example.com"
    
    # First request an OTP
    client.post("/auth/request-otp", json={"email": test_email})
    
    # Get the generated OTP directly from the test database
    otp_record = db_session.query(OTPRequest).filter(OTPRequest.email == test_email).first()
    assert otp_record is not None
    valid_otp = otp_record.otp_code
    
    # Verify the correct OTP
    response = client.post(
        "/auth/verify-otp",
        json={"email": test_email, "otp": valid_otp}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == test_email
    
    # Verify OTP record is deleted after success
    deleted_otp = db_session.query(OTPRequest).filter(OTPRequest.email == test_email).first()
    assert deleted_otp is None

@patch("routes.auth.send_otp_email")
def test_request_otp_email_failure(mock_send_email, client, db_session):
    mock_send_email.side_effect = Exception("SMTP Error")
    response = client.post("/auth/request-otp", json={"email": "failed@example.com"})
    assert response.status_code == 500
    assert "Failed to send OTP email" in response.json()["detail"]

def test_verify_otp_expired(client, db_session):
    otp = OTPRequest(email="expired@example.com", otp_code="123456", expires_at=datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(minutes=10))
    db_session.add(otp)
    db_session.commit()
    response = client.post("/auth/verify-otp", json={"email": "expired@example.com", "otp": "123456"})
    assert response.status_code == 400
    assert "OTP has expired" in response.json()["detail"]

def test_verify_otp_max_attempts(client, db_session):
    otp = OTPRequest(email="blocked@example.com", otp_code="123456", attempts=3, expires_at=datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=10))
    db_session.add(otp)
    db_session.commit()
    response = client.post("/auth/verify-otp", json={"email": "blocked@example.com", "otp": "123456"})
    assert response.status_code == 400
    assert "Maximum attempts reached" in response.json()["detail"]

def test_verify_otp_user_not_found(client, db_session):
    otp = OTPRequest(email="ghost@example.com", otp_code="123456", expires_at=datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=10))
    db_session.add(otp)
    db_session.commit()
    # Ensure no user
    db_session.query(User).filter(User.email=="ghost@example.com").delete()
    db_session.commit()
    
    response = client.post("/auth/verify-otp", json={"email": "ghost@example.com", "otp": "123456"})
    assert response.status_code == 404
    assert "User not found" in response.json()["detail"]
