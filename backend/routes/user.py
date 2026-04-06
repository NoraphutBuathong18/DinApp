from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from models.soil_data import SoilAnalysis
from services.auth_service import get_current_user
from schemas.user import UserResponse, AvatarUpdatePayload

router = APIRouter()

@router.put("/me/avatar", response_model=dict)
def update_avatar(
    payload: AvatarUpdatePayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    profile_picture = payload.profile_picture
    
    current_user.profile_picture = profile_picture
    db.commit()
    db.refresh(current_user)
    return {"message": "Avatar updated successfully", "profile_picture": profile_picture}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.delete("/me", response_model=dict)
def delete_me(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """TC21 fix: Delete the current user's account and all associated soil analysis records."""
    try:
        # 1. Delete all soil analysis records linked to this user first (FK constraint)
        db.query(SoilAnalysis).filter(SoilAnalysis.user_id == current_user.id).delete()
        # 2. Delete the user
        db.delete(current_user)
        db.commit()
        return {"message": "ลบบัญชีเรียบร้อยแล้ว"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"ลบบัญชีไม่สำเร็จ: {str(e)}")
