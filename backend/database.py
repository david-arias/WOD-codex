"""
database.py — Configuración del engine SQLAlchemy async y sesión de base de datos.

Usa asyncpg como driver para conexión asíncrona a Supabase (PostgreSQL).
"""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from backend.config import settings


# ─────────────────────────────────────────────
# Engine asíncrono (asyncpg driver)
# ─────────────────────────────────────────────
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.ENVIRONMENT == "development",  # Log SQL solo en dev
    pool_pre_ping=True,          # Verifica conexión antes de cada uso
    pool_size=10,                # Conexiones concurrentes máximas
    max_overflow=20,             # Conexiones extra permitidas
)

# Factory de sesiones asíncronas
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,      # Los objetos siguen usables tras commit
    autoflush=False,
    autocommit=False,
)


# ─────────────────────────────────────────────
# Base declarativa para los modelos SQLAlchemy
# ─────────────────────────────────────────────
class Base(DeclarativeBase):
    """Base class para todos los modelos ORM del proyecto."""
    pass


# ─────────────────────────────────────────────
# Dependency de FastAPI — inyección de sesión
# ─────────────────────────────────────────────
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency que provee una sesión de base de datos por request.
    Garantiza el cierre de la sesión incluso si ocurre una excepción.

    Uso:
        @router.get("/example")
        async def example(db: AsyncSession = Depends(get_db)):
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
