from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.ai_service import ai_service

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    context: str = ""  # Optional: soil analysis summary to include in the prompt


@router.post("/")
async def chat(req: ChatRequest):
    """Send a user message (with optional analysis context) to the AI and return a response."""
    try:
        reply = await ai_service.chat(req.message, req.context)
        return {"reply": reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI chat error: {str(e)}")
