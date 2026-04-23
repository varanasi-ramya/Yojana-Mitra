from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import traceback

from app.services.rag import rag_service

router = APIRouter()


class ChatContext(BaseModel):
    district: Optional[str] = None
    land_acres: Optional[float] = None


class ChatRequest(BaseModel):
    query: str
    language: str = "en"
    context: Optional[ChatContext] = None
    session_id: Optional[str] = None
    scheme: Optional[str] = None


class ChatResponse(BaseModel):
    answer: str
    sources: List[str] = []
    language: str
    session_id: Optional[str] = None


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    try:
        result = await rag_service.query(
            query=request.query,
            language=request.language,
            context=request.context.model_dump() if request.context else {},
            session_id=request.session_id,
            scheme=request.scheme,
        )
        return ChatResponse(
            answer=result["answer"],
            sources=result.get("sources", []),
            language=request.language,
            session_id=request.session_id,
        )
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
