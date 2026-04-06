from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.soil_data import SoilAnalysis
from models.user import User
from services.auth_service import get_current_user
from schemas.soil import SoilHistoryResponse, SoilHistoryItem
import json

router = APIRouter(prefix="/history", tags=["History"])

@router.get("/", response_model=SoilHistoryResponse)
async def get_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Fetch the logged-in user's past soil analysis records."""
    records = db.query(SoilAnalysis).filter(SoilAnalysis.user_id == current_user.id).order_by(SoilAnalysis.timestamp.desc()).all()
    
    history = []
    for r in records:
        history.append({
            "id": r.id,
            "filename": r.filename,
            "timestamp": r.timestamp.isoformat(),
            "n": r.nitrogen,
            "p": r.phosphorus,
            "k": r.potassium,
            "ph": r.ph,
            "temperature": r.temperature,
            "humidity": r.humidity,
            "rainfall": r.rainfall,
            "insights": r.npk_insights
        })
        
    return {"history": history}
