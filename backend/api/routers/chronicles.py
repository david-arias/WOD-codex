"""
backend/api/routers/chronicles.py — CRUD de Crónicas.

Endpoints:
    GET    /chronicles             → Listar crónicas del usuario autenticado (paginado)
    POST   /chronicles             → Crear nueva crónica
    GET    /chronicles/{id}        → Obtener crónica por ID (solo si es del usuario)
    PATCH  /chronicles/{id}        → Actualización parcial
    DELETE /chronicles/{id}        → Eliminar crónica (hard delete — cascade a sesiones y personajes)

Seguridad:
    - Todos los endpoints requieren JWT válido (CurrentUser dependency).
    - El owner_id siempre se infiere del JWT, nunca del body.
    - Los GETs filtran por owner_id en el nivel de query (no post-filtrado en Python).
"""

from __future__ import annotations

import math
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.api.dependencies import CurrentUser, DBSession
from backend.models import Chronicle, ChronicleStatus
from backend.schemas.chronicle import (
    ChronicleCreate,
    ChronicleListResponse,
    ChronicleResponse,
    ChronicleUpdate,
)

router = APIRouter(tags=["chronicles"])


# ─────────────────────────────────────────────────────────────────
# Helper interno — buscar y validar propiedad
# ─────────────────────────────────────────────────────────────────
async def _get_owned_chronicle(
    chronicle_id: str,
    user_id: str,
    db: AsyncSession,
) -> Chronicle:
    """
    Busca una crónica por ID y verifica que pertenezca al usuario.
    Lanza 404 si no existe o no es del usuario (evita enumerar IDs ajenos).
    """
    result = await db.execute(
        select(Chronicle).where(
            Chronicle.id == chronicle_id,
            Chronicle.owner_id == user_id,
        )
    )
    chronicle = result.scalar_one_or_none()
    if chronicle is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Crónica no encontrada",
        )
    return chronicle


# ─────────────────────────────────────────────────────────────────
# GET /chronicles — Listar crónicas del usuario
# ─────────────────────────────────────────────────────────────────
@router.get(
    "/",
    response_model=ChronicleListResponse,
    summary="Listar mis crónicas",
    description="Retorna todas las crónicas del usuario autenticado, con paginación y filtro por estado.",
)
async def list_chronicles(
    current_user: CurrentUser,
    db: DBSession,
    page: Annotated[int, Query(ge=1, description="Número de página")] = 1,
    size: Annotated[int, Query(ge=1, le=100, description="Resultados por página")] = 20,
    status_filter: Annotated[
        ChronicleStatus | None,
        Query(alias="status", description="Filtrar por estado"),
    ] = None,
) -> ChronicleListResponse:
    # Query base — solo crónicas del usuario autenticado
    base_query = select(Chronicle).where(Chronicle.owner_id == current_user.id)

    if status_filter:
        base_query = base_query.where(Chronicle.status == status_filter)

    # Contar total para metadatos de paginación
    count_result = await db.execute(
        select(func.count()).select_from(base_query.subquery())
    )
    total = count_result.scalar_one()

    # Aplicar paginación y ordenar por fecha de última partida desc
    offset = (page - 1) * size
    paginated = base_query.order_by(
        Chronicle.last_played_at.desc().nulls_last(),
        Chronicle.created_at.desc(),
    ).offset(offset).limit(size)

    items_result = await db.execute(paginated)
    chronicles = items_result.scalars().all()

    return ChronicleListResponse(
        items=[ChronicleResponse.model_validate(c) for c in chronicles],
        total=total,
        page=page,
        size=size,
        pages=math.ceil(total / size) if total > 0 else 0,
    )


# ─────────────────────────────────────────────────────────────────
# POST /chronicles — Crear crónica
# ─────────────────────────────────────────────────────────────────
@router.post(
    "/",
    response_model=ChronicleResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear nueva crónica",
)
async def create_chronicle(
    body: ChronicleCreate,
    current_user: CurrentUser,
    db: DBSession,
) -> ChronicleResponse:
    chronicle = Chronicle(
        owner_id=current_user.id,
        title=body.title,
        tagline=body.tagline,
        description=body.description,
        cover_image_url=body.cover_image_url,
        game_line=body.game_line,
        setting=body.setting,
        status=ChronicleStatus.ACTIVE,
        session_count=0,
    )
    db.add(chronicle)
    await db.flush()   # Genera el ID antes del commit
    await db.refresh(chronicle)
    return ChronicleResponse.model_validate(chronicle)


# ─────────────────────────────────────────────────────────────────
# GET /chronicles/{chronicle_id} — Obtener crónica por ID
# ─────────────────────────────────────────────────────────────────
@router.get(
    "/{chronicle_id}",
    response_model=ChronicleResponse,
    summary="Obtener una crónica",
)
async def get_chronicle(
    chronicle_id: str,
    current_user: CurrentUser,
    db: DBSession,
) -> ChronicleResponse:
    chronicle = await _get_owned_chronicle(chronicle_id, current_user.id, db)
    return ChronicleResponse.model_validate(chronicle)


# ─────────────────────────────────────────────────────────────────
# PATCH /chronicles/{chronicle_id} — Actualización parcial
# ─────────────────────────────────────────────────────────────────
@router.patch(
    "/{chronicle_id}",
    response_model=ChronicleResponse,
    summary="Actualizar una crónica",
)
async def update_chronicle(
    chronicle_id: str,
    body: ChronicleUpdate,
    current_user: CurrentUser,
    db: DBSession,
) -> ChronicleResponse:
    chronicle = await _get_owned_chronicle(chronicle_id, current_user.id, db)

    # Solo actualizamos los campos enviados (exclude_unset)
    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(chronicle, field, value)

    await db.flush()
    await db.refresh(chronicle)
    return ChronicleResponse.model_validate(chronicle)


# ─────────────────────────────────────────────────────────────────
# DELETE /chronicles/{chronicle_id} — Eliminar crónica
# ─────────────────────────────────────────────────────────────────
@router.delete(
    "/{chronicle_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar una crónica",
    description=(
        "Elimina permanentemente la crónica y todo su contenido "
        "(sesiones y personajes) en cascada. Esta acción es irreversible."
    ),
)
async def delete_chronicle(
    chronicle_id: str,
    current_user: CurrentUser,
    db: DBSession,
) -> None:
    chronicle = await _get_owned_chronicle(chronicle_id, current_user.id, db)
    await db.delete(chronicle)
    # El commit lo ejecuta el dependency get_db al salir del contexto
