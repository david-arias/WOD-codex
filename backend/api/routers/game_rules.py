"""
backend/api/routers/game_rules.py — Consulta y gestión del Grimorio (fuente de verdad).

Endpoints:
    GET    /gamerules              → Buscar reglas con múltiples filtros
    GET    /gamerules/{id}         → Obtener regla completa
    GET    /gamerules/by-name/{name} → Buscar regla por nombre exacto
    GET    /gamerules/hierarchy/{parent} → Todos los niveles de un poder (ej: Dominar 1-5)
    POST   /gamerules              → Crear regla (protegido — seed/admin)
    PATCH  /gamerules/{id}         → Actualizar regla (protegido)

Acceso:
    - GET endpoints: accesibles por cualquier usuario autenticado.
    - POST / PATCH:  requieren `current_user.is_active` (en el futuro un flag `is_admin`).
      Por ahora cualquier usuario autenticado puede crear reglas para facilitar
      el seeding inicial. El flag `is_verified` distingue reglas oficiales del seed
      de reglas creadas por usuarios.

Diseño:
    Este endpoint es el corazón del Grimorio y del pipeline RAG.
    El campo `embedding_text` se construye automáticamente en el POST
    para que el servicio de IA pueda indexarlo directamente en ChromaDB.
"""

from __future__ import annotations

import math
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.api.dependencies import CurrentUser, DBSession
from backend.models import GameLine, GameRule, RuleCategory
from backend.schemas.game_rule import (
    GameRuleCreate,
    GameRuleListResponse,
    GameRuleResponse,
    GameRuleUpdate,
)

router = APIRouter(tags=["game-rules"])


# ─────────────────────────────────────────────────────────────────
# Helper — construir embedding_text automáticamente
# ─────────────────────────────────────────────────────────────────
def _build_embedding_text(rule: GameRule) -> str:
    """
    Genera el texto optimizado para embedding vectorial (ChromaDB).
    Formato: [{CATEGORÍA}] [{LÍNEA}] {Nombre} Nv{level}: {descripción} | Mecánica: {efecto}
    """
    level_str = f" Nivel {rule.level}" if rule.level else ""
    affinity_str = f" [{rule.group_affinity}]" if rule.group_affinity else ""
    return (
        f"[{rule.category.upper()}] [{rule.game_line}]{affinity_str} "
        f"{rule.name}{level_str}: "
        f"{rule.description} "
        f"| Sistema: {rule.mechanical_effect}"
    ).strip()


# ─────────────────────────────────────────────────────────────────
# GET /gamerules — Buscar reglas con filtros
# ─────────────────────────────────────────────────────────────────
@router.get(
    "/",
    response_model=GameRuleListResponse,
    summary="Buscar reglas del Grimorio",
    description=(
        "Busca reglas con filtros combinables: línea de juego, categoría, "
        "afiliación de clan/tribu/tradición, nivel y búsqueda textual por nombre."
    ),
)
async def list_game_rules(
    current_user: CurrentUser,
    db: DBSession,
    page: Annotated[int, Query(ge=1)] = 1,
    size: Annotated[int, Query(ge=1, le=100)] = 20,
    game_line: Annotated[
        GameLine | None,
        Query(description="Filtrar por línea: V20, W20 o M20"),
    ] = None,
    category: Annotated[
        RuleCategory | None,
        Query(description="Filtrar por categoría: discipline, gift, sphere, merit..."),
    ] = None,
    group_affinity: Annotated[
        str | None,
        Query(description="Filtrar por clan/tribu/tradición (ej: 'Brujah', 'Fianna')"),
    ] = None,
    level: Annotated[
        int | None,
        Query(ge=1, le=10, description="Filtrar por nivel exacto"),
    ] = None,
    search: Annotated[
        str | None,
        Query(description="Búsqueda textual por nombre (case-insensitive, parcial)"),
    ] = None,
    verified_only: Annotated[
        bool,
        Query(description="Solo mostrar reglas verificadas contra el libro oficial"),
    ] = False,
) -> GameRuleListResponse:
    base_query = select(GameRule)

    # Aplicar filtros
    if game_line:
        base_query = base_query.where(GameRule.game_line == game_line)
    if category:
        base_query = base_query.where(GameRule.category == category)
    if group_affinity:
        base_query = base_query.where(
            GameRule.group_affinity.ilike(f"%{group_affinity}%")
        )
    if level is not None:
        base_query = base_query.where(GameRule.level == level)
    if search:
        # Búsqueda en nombre (español e inglés)
        search_term = f"%{search}%"
        base_query = base_query.where(
            or_(
                GameRule.name.ilike(search_term),
                GameRule.name_en.ilike(search_term),
            )
        )
    if verified_only:
        base_query = base_query.where(GameRule.is_verified.is_(True))

    # Contar total
    count_result = await db.execute(
        select(func.count()).select_from(base_query.subquery())
    )
    total = count_result.scalar_one()

    # Paginar — ordenar por nombre del padre, luego por nivel
    offset = (page - 1) * size
    paginated = (
        base_query
        .order_by(
            GameRule.game_line.asc(),
            GameRule.category.asc(),
            GameRule.parent_name.asc().nulls_last(),
            GameRule.level.asc().nulls_last(),
            GameRule.name.asc(),
        )
        .offset(offset)
        .limit(size)
    )

    items_result = await db.execute(paginated)
    rules = items_result.scalars().all()

    return GameRuleListResponse(
        items=[GameRuleResponse.model_validate(r) for r in rules],
        total=total,
        page=page,
        size=size,
        pages=math.ceil(total / size) if total > 0 else 0,
    )


# ─────────────────────────────────────────────────────────────────
# GET /gamerules/hierarchy/{parent_name} — Todos los niveles de un poder
# ─────────────────────────────────────────────────────────────────
@router.get(
    "/hierarchy/{parent_name}",
    response_model=list[GameRuleResponse],
    summary="Obtener todos los niveles de un poder",
    description=(
        "Retorna todos los niveles de una Disciplina, Don o Esfera "
        "ordenados de Nivel 1 al 5. Ideal para el panel de detalle del Grimorio. "
        "Ej: GET /gamerules/hierarchy/Dominación?game_line=V20"
    ),
)
async def get_rule_hierarchy(
    parent_name: str,
    current_user: CurrentUser,
    db: DBSession,
    game_line: Annotated[
        GameLine | None,
        Query(description="Filtrar por línea de juego"),
    ] = None,
) -> list[GameRuleResponse]:
    query = select(GameRule).where(
        or_(
            GameRule.parent_name.ilike(parent_name),
            GameRule.name.ilike(parent_name),
        )
    )
    if game_line:
        query = query.where(GameRule.game_line == game_line)

    query = query.order_by(GameRule.level.asc().nulls_last())
    result = await db.execute(query)
    rules = result.scalars().all()

    if not rules:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No se encontraron reglas para '{parent_name}'",
        )
    return [GameRuleResponse.model_validate(r) for r in rules]


# ─────────────────────────────────────────────────────────────────
# GET /gamerules/{rule_id} — Obtener regla por ID
# ─────────────────────────────────────────────────────────────────
@router.get(
    "/{rule_id}",
    response_model=GameRuleResponse,
    summary="Obtener una regla por ID",
)
async def get_game_rule(
    rule_id: str,
    current_user: CurrentUser,
    db: DBSession,
) -> GameRuleResponse:
    result = await db.execute(
        select(GameRule).where(GameRule.id == rule_id)
    )
    rule = result.scalar_one_or_none()
    if rule is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Regla no encontrada",
        )
    return GameRuleResponse.model_validate(rule)


# ─────────────────────────────────────────────────────────────────
# POST /gamerules — Crear regla (seed / admin)
# ─────────────────────────────────────────────────────────────────
@router.post(
    "/",
    response_model=GameRuleResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear nueva regla en el Grimorio",
    description=(
        "Crea un nuevo registro de regla. Usado principalmente por el script de seed "
        "para cargar las reglas oficiales de V20/W20/M20. "
        "El campo `embedding_text` se genera automáticamente."
    ),
)
async def create_game_rule(
    body: GameRuleCreate,
    current_user: CurrentUser,
    db: DBSession,
) -> GameRuleResponse:
    # Verificar unicidad (game_line + category + name + level)
    existing = await db.execute(
        select(GameRule).where(
            GameRule.game_line == body.game_line,
            GameRule.category == body.category,
            GameRule.name == body.name,
            GameRule.level == body.level,
        )
    )
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Ya existe una regla '{body.name}' "
                f"(nivel {body.level}) para {body.game_line}/{body.category}"
            ),
        )

    rule = GameRule(
        game_line=body.game_line,
        category=body.category,
        name=body.name,
        name_en=body.name_en,
        level=body.level,
        parent_name=body.parent_name,
        group_affinity=body.group_affinity,
        description=body.description,
        mechanical_effect=body.mechanical_effect,
        system_text=body.system_text,
        cost=body.cost.model_dump(),
        prerequisites=body.prerequisites.model_dump(),
        duration=body.duration,
        tags=body.tags,
        source_book=body.source_book,
        source_page=body.source_page,
        is_verified=False,
    )

    # Generar embedding_text automáticamente
    rule.embedding_text = _build_embedding_text(rule)

    db.add(rule)
    await db.flush()
    await db.refresh(rule)
    return GameRuleResponse.model_validate(rule)


# ─────────────────────────────────────────────────────────────────
# PATCH /gamerules/{rule_id} — Actualizar regla
# ─────────────────────────────────────────────────────────────────
@router.patch(
    "/{rule_id}",
    response_model=GameRuleResponse,
    summary="Actualizar una regla del Grimorio",
)
async def update_game_rule(
    rule_id: str,
    body: GameRuleUpdate,
    current_user: CurrentUser,
    db: DBSession,
) -> GameRuleResponse:
    result = await db.execute(
        select(GameRule).where(GameRule.id == rule_id)
    )
    rule = result.scalar_one_or_none()
    if rule is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Regla no encontrada",
        )

    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(rule, field, value)

    # Regenerar embedding_text si cambió el contenido relevante
    if any(f in update_data for f in ("description", "mechanical_effect")):
        rule.embedding_text = _build_embedding_text(rule)
        # Invalidar chroma_id para re-indexación en el próximo ciclo de RAG
        rule.chroma_id = None

    await db.flush()
    await db.refresh(rule)
    return GameRuleResponse.model_validate(rule)
