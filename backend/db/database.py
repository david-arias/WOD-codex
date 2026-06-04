"""
backend/db/database.py — Engine SQLAlchemy async y sesión de base de datos.

Configura la conexión a Supabase (PostgreSQL) usando asyncpg como driver.
Exporta:
    - engine        → AsyncEngine (para migraciones Alembic y creación de tablas)
    - Base          → DeclarativeBase (todos los modelos heredan de aquí)
    - get_db        → FastAPI dependency que provee AsyncSession por request
"""

from __future__ import annotations

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from backend.core.config import settings


# ─────────────────────────────────────────────────────────────────
# Engine asíncrono
# ─────────────────────────────────────────────────────────────────
engine = create_async_engine(
    settings.DATABASE_URL,
    # Logging de SQL solo en desarrollo (verbose pero útil para debug)
    echo=settings.is_development,
    # pool_pre_ping: ejecuta "SELECT 1" antes de usar una conexión del pool.
    # Crítico para Supabase, que cierra conexiones idle tras ~5min.
    pool_pre_ping=True,
    # Tamaño del pool de conexiones concurrentes
    pool_size=5,
    max_overflow=10,
    # Tiempo máximo de espera para obtener una conexión del pool (segundos)
    pool_timeout=30,
    # Recicla conexiones cada 30min para evitar stale connections con Supabase
    pool_recycle=1800,
)

# Factory de sesiones asíncronas
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    # expire_on_commit=False → los objetos ORM siguen siendo accesibles
    # después del commit (importante para retornar datos en respuestas API)
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


# ─────────────────────────────────────────────────────────────────
# Base declarativa — todos los modelos heredan de aquí
# ─────────────────────────────────────────────────────────────────
class Base(DeclarativeBase):
    """Base class para todos los modelos ORM del proyecto."""
    pass


# ─────────────────────────────────────────────────────────────────
# Dependency FastAPI — inyección de sesión de DB por request
# ─────────────────────────────────────────────────────────────────
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Provee una sesión de DB por request HTTP.
    Garantiza commit en éxito, rollback en excepción y cierre siempre.

    Uso en routers:
        @router.get("/example")
        async def example(db: AsyncSession = Depends(get_db)):
            result = await db.execute(select(Chronicle))
            ...
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
