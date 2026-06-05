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
from sqlalchemy.pool import NullPool

from backend.core.config import settings


# ─────────────────────────────────────────────────────────────────
# Engine asíncrono
# ─────────────────────────────────────────────────────────────────
# NullPool: Supabase usa PgBouncer en modo Transaction, incompatible
# con prepared statements de asyncpg. NullPool abre/cierra una
# conexión nueva por request, evitando el conflicto. Supabase gestiona
# el pooling en su propio lado (PgBouncer), así que no perdemos nada.
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.is_development,
    poolclass=NullPool,
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
