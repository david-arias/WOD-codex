"""
backend/schemas/common.py — Tipos y esquemas base compartidos.

Contiene:
    - UUIDStr       → Alias de tipo para UUIDs como strings
    - PaginatedMeta → Metadatos de paginación reutilizables
    - BaseResponse  → Schema base con campos comunes de respuesta
"""

from __future__ import annotations

from datetime import datetime
from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict, Field

# Tipo alias para claridad semántica en firmas
UUIDStr = str

# TypeVar para respuestas genéricas paginadas
T = TypeVar("T")


class AppBaseModel(BaseModel):
    """
    Base común para todos los schemas del proyecto.
    Activa `model_config` con mode='json' y population by field name.
    """
    model_config = ConfigDict(
        from_attributes=True,        # Permite crear desde objetos ORM (SQLAlchemy)
        populate_by_name=True,       # Acepta tanto alias como nombre de campo
        str_strip_whitespace=True,   # Limpia espacios en strings automáticamente
    )


class PaginatedResponse(AppBaseModel, Generic[T]):
    """Schema genérico para respuestas paginadas."""
    items: list[T]
    total: int = Field(description="Total de registros que coinciden con el filtro")
    page: int  = Field(description="Página actual (base 1)")
    size: int  = Field(description="Tamaño de página aplicado")
    pages: int = Field(description="Total de páginas")
