"""
config.py — Configuración de la aplicación usando pydantic-settings.

Lee variables desde .env con tipado y validación automáticos.
"""

from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Base de Datos ─────────────────────────────
    DATABASE_URL: str  # postgresql+asyncpg://...

    # ── Supabase ──────────────────────────────────
    SUPABASE_URL: AnyHttpUrl
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_KEY: str
    SUPABASE_JWKS_URL: AnyHttpUrl

    # ── Seguridad ─────────────────────────────────
    SECRET_KEY: str

    # ── IA ────────────────────────────────────────
    GROQ_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3"
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    CHROMA_PERSIST_DIR: str = "./chroma_db"

    # ── Entorno ───────────────────────────────────
    ENVIRONMENT: str = "development"
    FRONTEND_URL: AnyHttpUrl = "http://localhost:5173"
    LOG_LEVEL: str = "INFO"

    @field_validator("ENVIRONMENT")
    @classmethod
    def validate_environment(cls, v: str) -> str:
        allowed = {"development", "staging", "production"}
        if v not in allowed:
            raise ValueError(f"ENVIRONMENT debe ser uno de: {allowed}")
        return v

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

    @property
    def is_development(self) -> bool:
        return self.ENVIRONMENT == "development"


# Singleton de configuración — importar en todo el proyecto
settings = Settings()  # type: ignore[call-arg]
