from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta

from database import get_db
from models.user import User, OTPRequest
from services.auth_service import generate_otp, create_access_token
from services.email_service import send_otp_email
from schemas.auth import OTPRequestPayload, OTPVerifyPayload, TokenResponse

router = APIRouter()

@router.post("/request-otp", response_model=dict)
async def request_otp(data: OTPRequestPayload, db: Session = Depends(get_db)):
    email = data.email
    
    # Ensure user exists, create if not
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(email=email)
        db.add(user)
        db.commit()
        db.refresh(user)

    # Generate OTP
    otp = generate_otp()
    
    # Store OTP request (5 mins validity)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)
    otp_record = OTPRequest(email=email, otp_code=otp, expires_at=expires_at)
    db.add(otp_record)
    db.commit()

    # Send Email asynchronously
    try:
        await send_otp_email(email, otp)
    except Exception as e:
        print(f"Error sending email: {e}")
        raise HTTPException(status_code=500, detail="Failed to send OTP email. Check email configuration.")

    return {"message": "OTP sent successfully"}

@router.post("/verify-otp", response_model=TokenResponse)
def verify_otp(data: OTPVerifyPayload, db: Session = Depends(get_db)):
    email = data.email
    otp = data.otp

    # Find latest OTP record for email
    otp_record = db.query(OTPRequest).filter(
        OTPRequest.email == email
    ).order_by(OTPRequest.created_at.desc()).first()

    if not otp_record:
        raise HTTPException(status_code=400, detail="No OTP request found for this email")

    if otp_record.attempts >= 3:
        raise HTTPException(status_code=400, detail="Maximum attempts reached. Request a new OTP.")

    # Convert naive datetime to aware if necessary for comparison
    expires_at_aware = otp_record.expires_at
    if expires_at_aware.tzinfo is None:
        expires_at_aware = expires_at_aware.replace(tzinfo=timezone.utc)

    if datetime.now(timezone.utc) > expires_at_aware:
        raise HTTPException(status_code=400, detail="OTP has expired")

    if otp_record.otp_code != otp:
        otp_record.attempts += 1
        db.commit()
        raise HTTPException(status_code=400, detail="Invalid OTP code")

    # OTP is valid! Delete the record so it can't be reused
    db.delete(otp_record)
    db.commit()

    # Get the user
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Generate Access Token
    access_token = create_access_token(data={"sub": user.email, "id": user.id})

    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": {
            "email": user.email, 
            "id": user.id,
            "is_active": user.is_active,
            "profile_picture": user.profile_picture
        }
    }
