from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.chat import router as chat_router
from app.core.config import settings

app = FastAPI(
    title="Yojana Mitra API",
    description="RAG-powered agriculture scheme chatbot for Telangana farmers",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router, prefix="/api/v1")

@app.get("/")
def root():
    return {"status": "ok", "service": "Yojana Mitra API"}

@app.get("/health")
def health():
    return {"status": "healthy"}
