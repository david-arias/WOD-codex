"""
main.py — Entry point de la aplicación FastAPI.

El Códice del Narrador — Backend API v0.1.0
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.config import settings
from backend.database import engine, Base


# ─────────────────────────────────────────────
# Lifespan: startup / shutdown
# ─────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Ejecuta lógica de inicio y apagado de la aplicación.
    En producción las tablas se crean con Alembic, no aquí.
    """
    # Startup
    if settings.is_development:
        # Solo en dev: crear tablas si no existen (sin Alembic)
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    yield  # La app corre aquí

    # Shutdown
    await engine.dispose()


# ─────────────────────────────────────────────
# Instancia FastAPI
# ─────────────────────────────────────────────
app = FastAPI(
    title="El Códice del Narrador — API",
    description=(
        "Backend API para la plataforma SaaS de Directores de Juego del "
        "Mundo de Tinieblas (V20, W20, M20 — Ediciones 20 Aniversario)."
    ),
    version="0.1.0",
    docs_url="/docs" if not settings.is_production else None,
    redoc_url="/redoc" if not settings.is_production else None,
    lifespan=lifespan,
)


# ─────────────────────────────────────────────
# Middleware CORS
# ─────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(settings.FRONTEND_URL)],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)


# ─────────────────────────────────────────────
# Rutas base
# ─────────────────────────────────────────────
@app.get("/health", tags=["system"])
async def health_check() -> JSONResponse:
    """Health check endpoint para monitoreo y deploys."""
    return JSONResponse(
        content={
            "status": "ok",
            "service": "codice-del-narrador-api",
            "version": "0.1.0",
            "environment": settings.ENVIRONMENT,
        }
    )


# ─────────────────────────────────────────────
# Routers (se añaden en fases posteriores)
# ─────────────────────────────────────────────
# from backend.routers import auth, chronicles, characters, sessions, game_rules, ai_chat
# app.include_router(auth.router, prefix="/auth", tags=["auth"])
# app.include_router(chronicles.router, prefix="/chronicles", tags=["chronicles"])
# app.include_router(characters.router, prefix="/characters", tags=["characters"])
# app.include_router(sessions.router, prefix="/sessions", tags=["sessions"])
# app.include_router(game_rules.router, prefix="/rules", tags=["rules"])
# app.include_router(ai_chat.router, prefix="/ai", tags=["ai"])
