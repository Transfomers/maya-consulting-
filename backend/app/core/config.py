import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent.parent.parent
load_dotenv(ROOT_DIR / '.env')

class Settings:
    PROJECT_NAME: str = "3M SERVICES API"
    DATABASE_URL: str = os.environ.get("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/cap_db")
    JWT_SECRET: str = os.environ.get("JWT_SECRET", "supersecret")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    FRONTEND_URL: str = os.environ.get("FRONTEND_URL", "http://localhost:3000")
    CRAFTI_API_KEY: str = os.environ.get("CRAFTI_API_KEY", "")
    CRAFTI_API_BASE: str = os.environ.get(
        "CRAFTI_API_BASE",
        "https://rag-platform-backend-qt2l.onrender.com",
    ).rstrip("/")

settings = Settings()
