"""
backend/core/config.py — Configuración central de la aplicación.

Usa pydantic-settings para leer variables desde .env con tipado estricto.
Singleton `settings` importable en cualquier módulo del proyecto.
"""

from __future__ import annotations

from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",          # Ignora vars de entorno no declaradas
    )

    # ── Base de Datos ──────────────────────────────────────
    # Driver asyncpg para SQLAlchemy async
    DATABASE_URL: str
    # Ej: postgresql+asyncpg://postgres:<pass>@db.<ref>.supabase.co:5432/postgres

    # ── Supabase ───────────────────────────────────────────
    SUPABASE_URL: AnyHttpUrl
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_KEY: str

    # Secreto JWT de Supabase para validación simétrica (HS256).
    # Se obtiene en: Supabase Dashboard → Settings → API → JWT Secret
    SUPABASE_JWT_SECRET: str

    # ── IA (se activa en Fase 4) ───────────────────────────
    GROQ_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3"
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    CHROMA_PERSIST_DIR: str = "./chroma_db"

    # ── Aplicación ─────────────────────────────────────────
    ENVIRONMENT: str = "development"
    FRONTEND_URL: str = "http://localhost:5173"
    LOG_LEVEL: str = "INFO"

    # ── Paginación ─────────────────────────────────────────
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100

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

    @property
    def cors_origins(self) -> list[str]:
        """Orígenes CORS permitidos según el entorno."""
        origins = [self.FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"]
        if self.is_production:
            # En producción, agregar el dominio de Vercel
            # Se sobreescribe desde .env con FRONTEND_URL=https://codice-narrador.vercel.app
            origins = [self.FRONTEND_URL]
        return list(dict.fromkeys(origins))  # Deduplica manteniendo orden


# Singleton — se instancia una sola vez al importar el módulo
settings = Settings()  # type: ignore[call-arg]
