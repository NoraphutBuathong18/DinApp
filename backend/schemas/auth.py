from pydantic import BaseModel, EmailStr
from .user import UserResponse

class OTPRequestPayload(BaseModel):
    email: EmailStr

class OTPVerifyPayload(BaseModel):
    email: EmailStr
    otp: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse
