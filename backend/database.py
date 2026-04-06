from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from config import DATABASE_URL
import os

# Try Postgres, fallback to SQLite for local development if Postgres fails
try:
    if "postgresql" in DATABASE_URL:
        engine = create_engine(DATABASE_URL, connect_args={'connect_timeout': 5})
        # Test connection
        with engine.connect() as conn:
            pass
    else:
        raise ValueError("Not a postgres URL")
except Exception as e:
    print(f"PostgreSQL connection failed ({e}). Falling back to SQLite...")
    SQLITE_URL = "sqlite:///./dinapp.db"
    engine = create_engine(SQLITE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
