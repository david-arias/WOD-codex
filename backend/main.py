"""
backend/main.py — Entry point de El Códice del Narrador API.

Versión: 0.2.0 (Fase 2 — API Base completa)
Cambios desde 0.1.0:
    - Estructura de módulos reorganizada (core/, db/, api/)
    - Routers de chronicles, characters y game_rules registrados
    - Exception handlers globales (400, 422, 500)
    - Middleware de tiempo de respuesta (X-Process-Time)
"""

from __future__ import annotations

import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.core.config import settings
from backend.db.database import Base, engine

# ── Routers ────────────────────────────────────────────────────
from backend.api.routers.chronicles  import router as chronicles_router
from backend.api.routers.characters  import router as characters_router
from backend.api.routers.game_rules  import router as game_rules_router


# ─────────────────────────────────────────────────────────────────
# Lifespan — Startup / Shutdown
# ─────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Ciclo de vida de la aplicación.

    Startup:
        - En desarrollo: crea las tablas si no existen (sin Alembic).
          En producción SIEMPRE usar Alembic para migraciones controladas.

    Shutdown:
        - Cierra el pool de conexiones limpiamente.
    """
    # ── Startup ──
    if settings.is_development:
        async with engine.begin() as conn:
            # create_all es idempotente — no destruye datos existentes
            await conn.run_sync(Base.metadata.create_all)

    yield  # La app corre aquí

    # ── Shutdown ──
    await engine.dispose()


# ─────────────────────────────────────────────────────────────────
# Instancia FastAPI
# ─────────────────────────────────────────────────────────────────
app = FastAPI(
    title="El Códice del Narrador — API",
    description=(
        "Backend API para la plataforma SaaS de Directores de Juego del "
        "**Mundo de Tinieblas** (V20, W20, M20 — Ediciones 20 Aniversario).\n\n"
        "Documentación de autenticación: todos los endpoints marcados con 🔒 "
        "requieren un header `Authorization: Bearer <supabase_jwt_token>`."
    ),
    version="0.2.0",
    # Deshabilitar /docs y /redoc en producción (evitar exposición del schema)
    docs_url="/docs"  if not settings.is_production else None,
    redoc_url="/redoc" if not settings.is_production else None,
    openapi_url="/openapi.json" if not settings.is_production else None,
    lifespan=lifespan,
)


# ─────────────────────────────────────────────────────────────────
# Middleware CORS
# ─────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,   # ["http://localhost:5173", "https://*.vercel.app"]
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
    expose_headers=["X-Process-Time", "X-Total-Count"],
)


# ─────────────────────────────────────────────────────────────────
# Middleware de tiempo de respuesta
# ─────────────────────────────────────────────────────────────────
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    """
    Añade el header `X-Process-Time` con el tiempo de procesamiento en ms.
    Útil para monitoreo y optimización de endpoints lentos.
    """
    start = time.perf_counter()
    response = await call_next(request)
    duration_ms = (time.perf_counter() - start) * 1000
    response.headers["X-Process-Time"] = f"{duration_ms:.2f}ms"
    return response


# ─────────────────────────────────────────────────────────────────
# Exception Handlers globales
# ─────────────────────────────────────────────────────────────────
@app.exception_handler(404)
async def not_found_handler(request: Request, exc) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={"detail": "El recurso solicitado no existe", "path": str(request.url.path)},
    )


@app.exception_handler(500)
async def internal_error_handler(request: Request, exc) -> JSONResponse:
    # En producción no exponemos el detalle del error interno
    detail = str(exc) if settings.is_development else "Error interno del servidor"
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": detail},
    )


# ─────────────────────────────────────────────────────────────────
# Endpoints del sistema
# ─────────────────────────────────────────────────────────────────
@app.get(
    "/health",
    tags=["system"],
    summary="Health check",
    response_description="Estado del servicio",
)
async def health_check() -> JSONResponse:
    """
    Endpoint de health check para balanceadores de carga y monitoreo.
    No requiere autenticación.
    """
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "status":      "ok",
            "service":     "codice-del-narrador-api",
            "version":     "0.2.0",
            "environment": settings.ENVIRONMENT,
        },
    )


# ─────────────────────────────────────────────────────────────────
# Registro de Routers
# ─────────────────────────────────────────────────────────────────
API_V1_PREFIX = "/api/v1"

app.include_router(
    chronicles_router,
    prefix=f"{API_V1_PREFIX}/chronicles",
)
app.include_router(
    characters_router,
    prefix=f"{API_V1_PREFIX}/characters",
)
app.include_router(
    game_rules_router,
    prefix=f"{API_V1_PREFIX}/gamerules",
)

# ── Fase 4 (IA) ────────────────────────────────────────────────
# from backend.api.routers.ai_chat   import router as ai_router
# from backend.api.routers.npc_forge import router as forge_router
# app.include_router(ai_router,    prefix=f"{API_V1_PREFIX}/ai")
# app.include_router(forge_router, prefix=f"{API_V1_PREFIX}/forge")


# ─────────────────────────────────────────────────────────────────
# Mapa de rutas en startup (solo en development)
# ─────────────────────────────────────────────────────────────────
if settings.is_development:
    print("\n📜 El Códice del Narrador — API v0.2.0")
    print(f"   Docs:   http://localhost:8000/docs")
    print(f"   Health: http://localhost:8000/health")
    print(f"   CORS:   {settings.cors_origins}")
    print()
