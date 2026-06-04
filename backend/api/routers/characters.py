"""
backend/api/routers/characters.py — CRUD de Personajes (PJs y PNJs).

Endpoints:
    GET    /characters             → Listar personajes (filtra por chronicle_id obligatorio)
    POST   /characters             → Crear personaje en una crónica
    GET    /characters/{id}        → Obtener personaje por ID
    PATCH  /characters/{id}        → Actualización parcial (stats, nombre, etc.)
    DELETE /characters/{id}        → Eliminar personaje

Seguridad:
    - Verificación de propiedad: el usuario solo puede operar sobre personajes
      de crónicas que le pertenecen. La query encadena chronicle→owner_id.
    - El chronicle_id es requerido en GET list para evitar devolver todos los PNJs
      de un usuario en una sola llamada costosa.
"""

from __future__ import annotations

import math
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.api.dependencies import CurrentUser, DBSession
from backend.models import Character, CharacterType, Chronicle, GameLine
from backend.schemas.character import (
    CharacterCreate,
    CharacterListResponse,
    CharacterResponse,
    CharacterUpdate,
)

router = APIRouter(tags=["characters"])


# ─────────────────────────────────────────────────────────────────
# Helper interno — verificar que el personaje pertenece al usuario
# ─────────────────────────────────────────────────────────────────
async def _get_owned_character(
    character_id: str,
    user_id: str,
    db: AsyncSession,
) -> Character:
    """
    Busca un personaje y verifica que su crónica pertenece al usuario.
    JOIN implícito a través de Chronicle para validar propiedad.
    """
    result = await db.execute(
        select(Character)
        .join(Chronicle, Character.chronicle_id == Chronicle.id)
        .where(
            Character.id == character_id,
            Chronicle.owner_id == user_id,
        )
    )
    character = result.scalar_one_or_none()
    if character is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Personaje no encontrado",
        )
    return character


async def _verify_chronicle_ownership(
    chronicle_id: str,
    user_id: str,
    db: AsyncSession,
) -> Chronicle:
    """Verifica que una crónica existe y pertenece al usuario. 404 si no."""
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
            detail="Crónica no encontrada o no tienes acceso a ella",
        )
    return chronicle


# ─────────────────────────────────────────────────────────────────
# GET /characters — Listar personajes de una crónica
# ─────────────────────────────────────────────────────────────────
@router.get(
    "/",
    response_model=CharacterListResponse,
    summary="Listar personajes de una crónica",
    description=(
        "Retorna los personajes de una crónica específica. "
        "`chronicle_id` es obligatorio. Filtros opcionales por tipo y línea de juego."
    ),
)
async def list_characters(
    current_user: CurrentUser,
    db: DBSession,
    chronicle_id: Annotated[str, Query(description="ID de la crónica (requerido)")],
    page: Annotated[int, Query(ge=1)] = 1,
    size: Annotated[int, Query(ge=1, le=100)] = 50,
    character_type: Annotated[
        CharacterType | None,
        Query(alias="type", description="Filtrar: PC o NPC"),
    ] = None,
    is_active: Annotated[
        bool | None,
        Query(description="Filtrar por personajes activos/inactivos"),
    ] = None,
    game_line: Annotated[
        GameLine | None,
        Query(description="Filtrar por línea de juego"),
    ] = None,
) -> CharacterListResponse:
    # Validar propiedad de la crónica antes de cualquier query de personajes
    await _verify_chronicle_ownership(chronicle_id, current_user.id, db)

    # Query base — solo personajes de la crónica verificada
    base_query = select(Character).where(Character.chronicle_id == chronicle_id)

    if character_type is not None:
        base_query = base_query.where(Character.character_type == character_type)
    if is_active is not None:
        base_query = base_query.where(Character.is_active == is_active)
    if game_line is not None:
        base_query = base_query.where(Character.game_line == game_line)

    # Contar total
    count_result = await db.execute(
        select(func.count()).select_from(base_query.subquery())
    )
    total = count_result.scalar_one()

    # Paginar — PCs primero, luego NPCs; dentro de cada grupo por nombre
    offset = (page - 1) * size
    paginated = (
        base_query
        .order_by(Character.character_type.asc(), Character.name.asc())
        .offset(offset)
        .limit(size)
    )

    items_result = await db.execute(paginated)
    characters = items_result.scalars().all()

    return CharacterListResponse(
        items=[CharacterResponse.model_validate(c) for c in characters],
        total=total,
        page=page,
        size=size,
        pages=math.ceil(total / size) if total > 0 else 0,
    )


# ─────────────────────────────────────────────────────────────────
# POST /characters — Crear personaje
# ─────────────────────────────────────────────────────────────────
@router.post(
    "/",
    response_model=CharacterResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear nuevo personaje",
)
async def create_character(
    body: CharacterCreate,
    current_user: CurrentUser,
    db: DBSession,
) -> CharacterResponse:
    # Verificar que la crónica le pertenece al usuario
    await _verify_chronicle_ownership(body.chronicle_id, current_user.id, db)

    character = Character(
        chronicle_id=body.chronicle_id,
        name=body.name,
        player_name=body.player_name,
        character_type=body.character_type,
        game_line=body.game_line,
        is_active=True,
        stats=body.stats,
    )
    db.add(character)
    await db.flush()
    await db.refresh(character)
    return CharacterResponse.model_validate(character)


# ─────────────────────────────────────────────────────────────────
# GET /characters/{character_id} — Obtener personaje
# ─────────────────────────────────────────────────────────────────
@router.get(
    "/{character_id}",
    response_model=CharacterResponse,
    summary="Obtener un personaje",
)
async def get_character(
    character_id: str,
    current_user: CurrentUser,
    db: DBSession,
) -> CharacterResponse:
    character = await _get_owned_character(character_id, current_user.id, db)
    return CharacterResponse.model_validate(character)


# ─────────────────────────────────────────────────────────────────
# PATCH /characters/{character_id} — Actualización parcial
# ─────────────────────────────────────────────────────────────────
@router.patch(
    "/{character_id}",
    response_model=CharacterResponse,
    summary="Actualizar un personaje",
    description=(
        "Actualización parcial. Para `stats`, el objeto completo se reemplaza "
        "(merge semántico en el cliente). Use PATCH con el stats completo actualizado."
    ),
)
async def update_character(
    character_id: str,
    body: CharacterUpdate,
    current_user: CurrentUser,
    db: DBSession,
) -> CharacterResponse:
    character = await _get_owned_character(character_id, current_user.id, db)

    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(character, field, value)

    await db.flush()
    await db.refresh(character)
    return CharacterResponse.model_validate(character)


# ─────────────────────────────────────────────────────────────────
# DELETE /characters/{character_id} — Eliminar personaje
# ─────────────────────────────────────────────────────────────────
@router.delete(
    "/{character_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar un personaje",
)
async def delete_character(
    character_id: str,
    current_user: CurrentUser,
    db: DBSession,
) -> None:
    character = await _get_owned_character(character_id, current_user.id, db)
    await db.delete(character)
