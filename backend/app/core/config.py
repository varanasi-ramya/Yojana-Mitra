from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    # API Keys
    GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY", "")
    PINECONE_API_KEY: str = os.getenv("PINECONE_API_KEY", "")
    PINECONE_INDEX: str = os.getenv("PINECONE_INDEX", "yojana-mitra")

    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        os.getenv("FRONTEND_URL", "https://yojana-mitra.vercel.app"),
        "*",  # Remove in production and set FRONTEND_URL
    ]

    # RAG settings
    TOP_K: int = 3
    MAX_TOKENS: int = 1024

    # Vector store: "pinecone" | "chroma" | "memory"
    VECTOR_STORE: str = os.getenv("VECTOR_STORE", "memory")

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
