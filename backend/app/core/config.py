import os
from typing import List
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Settings:
    PROJECT_NAME: str = "TaskExecutor API"
    API_V1_STR: str = "/api/v1"
    
    # JWT Security Configuration
    # In production, this must be a secure, random string loaded from environment
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-key-change-me-in-production-1234567890")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Database Configuration
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://admin:admin@localhost:5432/todo_dev",
    )

    # Google OAuth Configuration
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")

    # Gemini API Key
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    # Gemini Model Selection (e.g. gemini-2.5-flash or gemini-2.5-flash-lite)
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    
    # Gemini request timeout in seconds
    # Planning workflows require multiple sequential LLM calls (routing + planner + DB tools)
    # so 30s is too short. Default to 120s for reliable multi-agent operation.
    GEMINI_TIMEOUT: int = int(os.getenv("GEMINI_TIMEOUT", "120"))

    # Per-user monthly LLM token quota (0 = unlimited)
    LLM_MONTHLY_TOKEN_QUOTA: int = int(os.getenv("LLM_MONTHLY_TOKEN_QUOTA", "100000"))
    
    # CORS Configuration
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

settings = Settings()
