from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class SoilHistoryItem(BaseModel):
    id: int
    filename: Optional[str] = None
    timestamp: datetime
    n: Optional[float] = None
    p: Optional[float] = None
    k: Optional[float] = None
    ph: Optional[float] = None
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    rainfall: Optional[float] = None
    insights: Optional[str] = None

    class Config:
        from_attributes = True

class SoilHistoryResponse(BaseModel):
    history: list[SoilHistoryItem]
