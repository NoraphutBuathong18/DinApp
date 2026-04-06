from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.upload import router as upload_router
from routes.analyze import router as analyze_router
from routes.chat import router as chat_router
from routes.auth import router as auth_router
from routes.history import router as history_router
from routes.user import router as user_router
from database import engine, Base
import models.soil_data # Ensure models are registered
import models.user

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="DinApp API",
    description="Soil analysis backend for DinApp",
    version="1.0.0",
)

# CORS — allow Vite dev server and all production origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(upload_router, prefix="/upload", tags=["Upload"])
app.include_router(analyze_router, prefix="/analyze", tags=["Analyze"])
app.include_router(chat_router, prefix="/chat", tags=["Chat"])
app.include_router(auth_router, prefix="/auth", tags=["Auth"])
app.include_router(user_router, prefix="/users", tags=["Users"])
app.include_router(history_router, tags=["History"])


@app.get("/")
async def root():
    return {"message": "DinApp API is running", "version": "1.0.0"}
