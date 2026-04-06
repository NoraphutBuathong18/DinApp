import os
import json
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from services.csv_parser import parse_and_summarize
from config import STORAGE_DIR
from database import get_db
from models.soil_data import SoilAnalysis
from models.user import User
from services.auth_service import get_optional_user

router = APIRouter()


class AnalyzeRequest(BaseModel):
    filename: str


@router.post("/")
async def analyze_file(req: AnalyzeRequest, db: Session = Depends(get_db), current_user: User = Depends(get_optional_user)):
    """Read a stored CSV/Excel file, parse it, and return a summary of soil data."""
    file_path = os.path.join(STORAGE_DIR, req.filename)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail=f"File '{req.filename}' not found.")

    try:
        result = parse_and_summarize(file_path)
        
        # Save to PostgreSQL
        averages = result.get("dl_analysis", {}).get("averages", {})
        
        db_analysis = SoilAnalysis(
            user_id=current_user.id if current_user else None,
            filename=req.filename,
            nitrogen=averages.get("N"),
            phosphorus=averages.get("P"),
            potassium=averages.get("K"),
            ph=averages.get("ph"),
            temperature=averages.get("temperature"),
            humidity=averages.get("humidity"),
            rainfall=averages.get("rainfall"),
            npk_insights=result.get("npk_insights"),
            raw_data_summary=json.dumps(result.get("summary"))
        )
        
        db.add(db_analysis)
        db.commit()
        db.refresh(db_analysis)
        
        return result
    except ValueError as e:
        # TC09 fix: invalid file format / missing columns → 400 Bad Request
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
