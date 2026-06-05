"""
backend/schemas/game_rule.py — Schemas Pydantic v2 para Reglas de Juego.

GameRule es la fuente de verdad del Grimorio.
El endpoint POST /gamerules es protegido (requiere el flag is_narrator_admin
o en su defecto un seed script; los usuarios normales no crean reglas).
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import Field, field_validator

from backend.models import GameLine, RuleCategory
from backend.schemas.common import AppBaseModel, PaginatedResponse, UUIDStr


class RuleCost(AppBaseModel):
    """Costo de activación de una regla mecánica."""
    blood_points:  int = Field(ge=0, default=0, description="Puntos de Sangre (V20)")
    willpower:     int = Field(ge=0, default=0, description="Fuerza de Voluntad")
    gnosis:        int = Field(ge=0, default=0, description="Gnosis (W20)")
    rage:          int = Field(ge=0, default=0, description="Rabia (W20)")
    quintessence:  int = Field(ge=0, default=0, description="Quintaesencia (M20)")
    action_type:   str = Field(
        default="standard",
        description="Tipo de acción requerida",
        examples=["standard", "reflexive", "extended", "contested", "resisted"],
    )
    additional_notes: str | None = None


class RulePrerequisites(AppBaseModel):
    """Requisitos para aprender o usar una regla."""
    disciplines:   list[str]       = Field(default_factory=list, description="Ej: ['Dominación 2']")
    gifts:         list[str]       = Field(default_factory=list, description="Ej: ['Rugido Nv1']")
    spheres:       list[str]       = Field(default_factory=list, description="Ej: ['Fuerzas 3']")
    attributes:    dict[str, int]  = Field(default_factory=dict, description="Ej: {'manipulation': 3}")
    abilities:     dict[str, int]  = Field(default_factory=dict, description="Ej: {'occult': 2}")
    other:         list[str]       = Field(default_factory=list, description="Otros requisitos en texto libre")
    experience_cost: int           = Field(ge=0, default=0, description="Costo en puntos de experiencia")


# ─────────────────────────────────────────────────────────────────
# Schemas de entrada (request body)
# ─────────────────────────────────────────────────────────────────

class GameRuleCreate(AppBaseModel):
    """Body para crear una nueva regla (seed o admin)."""
    game_line:         GameLine      = Field(description="V20, W20 o M20")
    category:          RuleCategory  = Field(description="Tipo de regla (discipline, gift, sphere...)")
    name:              str           = Field(min_length=1, max_length=300, description="Nombre en español")
    name_en:           str | None    = Field(default=None, max_length=300, description="Nombre en inglés")
    slug:              str | None    = Field(default=None, max_length=300, description="URL slug (ej: celeridad, camino-de-la-humanidad)")
    level:             int | None    = Field(default=None, ge=1, le=10, description="Nivel (si aplica)")
    parent_name:       str | None    = Field(default=None, max_length=300, description="Nombre del grupo padre")
    group_affinity:    str | None    = Field(default=None, max_length=200, description="Clan/Tribu/Tradición asociada")
    description:       str           = Field(min_length=1, description="Descripción narrativa")
    mechanical_effect: str           = Field(min_length=1, description="Efecto mecánico preciso")
    system_text:       str | None    = None
    cost:              RuleCost      = Field(default_factory=RuleCost)
    prerequisites:     RulePrerequisites = Field(default_factory=RulePrerequisites)
    duration:          str | None    = Field(default=None, max_length=200)
    tags:              list[str]     = Field(default_factory=list)
    source_book:       str | None    = Field(default=None, max_length=300)
    source_page:       int | None    = Field(default=None, ge=1)

    @field_validator("tags")
    @classmethod
    def tags_lowercase(cls, v: list[str]) -> list[str]:
        """Normaliza tags a minúsculas para consistencia en búsquedas."""
        return [tag.lower().strip() for tag in v if tag.strip()]


class GameRuleUpdate(AppBaseModel):
    """Body para actualización parcial de una regla."""
    description:       str | None = None
    mechanical_effect: str | None = None
    system_text:       str | None = None
    cost:              dict[str, Any] | None = None
    prerequisites:     dict[str, Any] | None = None
    duration:          str | None = None
    tags:              list[str] | None = None
    source_book:       str | None = None
    source_page:       int | None = None
    is_verified:       bool | None = None


# ─────────────────────────────────────────────────────────────────
# Schemas de salida (response)
# ─────────────────────────────────────────────────────────────────

class GameRuleResponse(AppBaseModel):
    """Representación completa de una regla en respuestas de la API."""
    id:                UUIDStr
    game_line:         GameLine
    category:          RuleCategory
    name:              str
    name_en:           str | None
    slug:              str | None
    level:             int | None
    parent_name:       str | None
    group_affinity:    str | None
    description:       str
    mechanical_effect: str
    system_text:       str | None
    cost:              dict[str, Any]
    prerequisites:     dict[str, Any]
    duration:          str | None
    tags:              list[str]
    source_book:       str | None
    source_page:       int | None
    is_verified:       bool
    created_at:        datetime
    updated_at:        datetime


# Alias paginado
GameRuleListResponse = PaginatedResponse[GameRuleResponse]
