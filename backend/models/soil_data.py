from sqlalchemy import Column, Integer, Float, String, DateTime, Text, ForeignKey
from datetime import datetime
from database import Base

class SoilAnalysis(Base):
    __tablename__ = "soil_analysis"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Used for history
    filename = Column(String, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Core metrics
    nitrogen = Column(Float, nullable=True)
    phosphorus = Column(Float, nullable=True)
    potassium = Column(Float, nullable=True)
    ph = Column(Float, nullable=True)
    temperature = Column(Float, nullable=True)
    humidity = Column(Float, nullable=True)
    rainfall = Column(Float, nullable=True)
    
    # Analysis result
    npk_insights = Column(Text, nullable=True)
    raw_data_summary = Column(Text, nullable=True) # JSON string of average data

    def __repr__(self):
        return f"<SoilAnalysis(id={self.id}, filename={self.filename}, timestamp={self.timestamp})>"
