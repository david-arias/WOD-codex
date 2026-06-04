"""
backend/schemas/chronicle.py — Schemas Pydantic v2 para Crónicas.

Contratos de la API:
    ChronicleCreate      → Body de POST /chronicles
    ChronicleUpdate      → Body de PATCH /chronicles/{id}  (todos los campos opcionales)
    ChronicleResponse    → Respuesta de GET/POST/PATCH
    ChronicleListResponse → Respuesta de GET /chronicles (paginada)
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import Field, field_validator

from backend.models import ChronicleStatus, GameLine
from backend.schemas.common import AppBaseModel, PaginatedResponse, UUIDStr


# ─────────────────────────────────────────────────────────────────
# Schemas de entrada (request body)
# ─────────────────────────────────────────────────────────────────

class ChronicleCreate(AppBaseModel):
    """Body para crear una nueva crónica. El owner lo infiere el backend del JWT."""

    title: str = Field(
        min_length=1,
        max_length=200,
        description="Título de la crónica",
        examples=["Los Últimos Días de Camarilla"],
    )
    tagline: str | None = Field(
        default=None,
        max_length=500,
        description="Frase evocadora de la crónica",
        examples=["Cuando la Mascarada se rompe, solo queda la oscuridad."],
    )
    description: str | None = Field(
        default=None,
        description="Sinopsis extendida de la crónica",
    )
    cover_image_url: str | None = Field(
        default=None,
        max_length=500,
        description="URL de portada (Supabase Storage)",
    )
    game_line: GameLine = Field(
        description="Línea de juego: V20 (Vampiro), W20 (Hombre Lobo) o M20 (Mago)",
        examples=["V20"],
    )
    setting: dict[str, Any] = Field(
        default_factory=dict,
        description=(
            "Configuración del mundo de la crónica. "
            "Estructura sugerida: { city, year, sect_in_power, mood_tags[], house_rules[] }"
        ),
        examples=[{
            "city": "Madrid",
            "year": 1998,
            "sect_in_power": "Camarilla",
            "mood_tags": ["política", "traición", "supervivencia"],
            "house_rules": [],
        }],
    )

    @field_validator("title")
    @classmethod
    def title_no_only_whitespace(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("El título no puede estar vacío o ser solo espacios")
        return v.strip()


class ChronicleUpdate(AppBaseModel):
    """
    Body para actualización parcial (PATCH) de una crónica.
    Todos los campos son opcionales — solo se actualizan los enviados.
    """
    title: str | None = Field(default=None, min_length=1, max_length=200)
    tagline: str | None = Field(default=None, max_length=500)
    description: str | None = None
    cover_image_url: str | None = Field(default=None, max_length=500)
    status: ChronicleStatus | None = None
    setting: dict[str, Any] | None = None


# ─────────────────────────────────────────────────────────────────
# Schemas de salida (response)
# ─────────────────────────────────────────────────────────────────

class ChronicleResponse(AppBaseModel):
    """Representación completa de una crónica en respuestas de la API."""

    id: UUIDStr
    owner_id: UUIDStr
    title: str
    tagline: str | None
    description: str | None
    cover_image_url: str | None
    game_line: GameLine
    status: ChronicleStatus
    setting: dict[str, Any]
    session_count: int
    created_at: datetime
    updated_at: datetime
    last_played_at: datetime | None


# Alias del tipo paginado para crónicas
ChronicleListResponse = PaginatedResponse[ChronicleResponse]
