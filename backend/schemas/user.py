from pydantic import BaseModel
from typing import Optional

class UserResponse(BaseModel):
    id: int
    email: str
    is_active: bool
    profile_picture: Optional[str] = None

    class Config:
        from_attributes = True

class AvatarUpdatePayload(BaseModel):
    profile_picture: str
