import os
from dotenv import load_dotenv

load_dotenv(override=True)

# Server
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))

# Storage
STORAGE_DIR = os.path.join(os.path.dirname(__file__), "storage")
os.makedirs(STORAGE_DIR, exist_ok=True)

# AI Models
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")

# Which AI provider to use: "groq" | "openrouter"
AI_PROVIDER = os.getenv("AI_PROVIDER", "groq")

# Database
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:123456789@localhost:5432/dinapp")

# Authentication
SECRET_KEY = os.getenv("SECRET_KEY", "b2c86f7b9eadaeb9a14c330f81a7b82f0bc8a9b3d04d80a9fc777a83421d01ea")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

# Email (Resend)
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
