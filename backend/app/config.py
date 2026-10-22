from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Attendance Tracker Pro"
    API_V1_STR: str = "/api"
    # Required: no default on purpose. Generate one with:
    #   python -c "import secrets; print(secrets.token_hex(32))"
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day

    # PostgreSQL URL
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/attendance_db"
    # Optional SQLite fallback for quick local demos. OFF by default so a database outage
    # fails loudly instead of silently splitting your data into a second database.
    ALLOW_SQLITE_FALLBACK: bool = False
    SQLITE_FALLBACK_URL: str = "sqlite:///./attendance.db"

    # Initial admin account created by seed.py (no hard-coded default password).
    # If ADMIN_PASSWORD is empty a random one is generated and printed once.
    ADMIN_EMAIL: str = "admin@attendance.pro"
    ADMIN_PASSWORD: str = ""

    # Default late threshold
    DEFAULT_SHIFT_START: str = "09:30"

    # Allowed CORS Origins
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
