"""
backend/api/dependencies.py — Dependencias reutilizables de FastAPI.

Responsabilidades:
    1. `get_db`           → Re-exporta la sesión de DB desde db.database.
    2. `get_current_user` → Valida el JWT de Supabase y retorna el User autenticado.

Diseño JWT de Supabase (proyectos nuevos):
    Supabase firmó con HS256 en proyectos antiguos.
    Proyectos nuevos usan ES256 (ECDSA) con par de claves asimétricas.
    La clave pública se obtiene del endpoint JWKS:
        GET {SUPABASE_URL}/auth/v1/.well-known/jwks.json
    Las claves se cachean en memoria al primer uso (TTL: 1 hora).
    Claims relevantes:
        sub   → UUID del usuario (auth.users.id)
        email → Email del usuario
        exp   → Timestamp de expiración
        aud   → "authenticated"
        role  → "authenticated" | "service_role"
"""

from __future__ import annotations

import time
from typing import Annotated

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.config import settings
from backend.db.database import get_db
from backend.models import User

# ─────────────────────────────────────────────────────────────────
# Bearer scheme
# ─────────────────────────────────────────────────────────────────
_bearer_scheme = HTTPBearer(auto_error=False)


# ─────────────────────────────────────────────────────────────────
# Caché de claves JWKS  (kid → JWK dict)
# ─────────────────────────────────────────────────────────────────
_jwks_cache:      dict[str, dict] = {}
_jwks_fetched_at: float           = 0.0
_JWKS_TTL:        float           = 3600.0   # 1 hora


async def _get_jwks() -> dict[str, dict]:
    """
    Obtiene las claves públicas del endpoint JWKS de Supabase.
    Cachea en memoria durante 1 hora para no hacer una petición por request.
    """
    global _jwks_cache, _jwks_fetched_at

    if _jwks_cache and (time.monotonic() - _jwks_fetched_at) < _JWKS_TTL:
        return _jwks_cache

    jwks_url = f"{settings.SUPABASE_URL}/auth/v1/.well-known/jwks.json"
    async with httpx.AsyncClient(timeout=5.0) as client:
        resp = await client.get(jwks_url)
        resp.raise_for_status()
        data = resp.json()

    _jwks_cache = {key["kid"]: key for key in data.get("keys", [])}
    _jwks_fetched_at = time.monotonic()
    return _jwks_cache


# ─────────────────────────────────────────────────────────────────
# Excepciones HTTP reutilizables
# ─────────────────────────────────────────────────────────────────
def _credentials_exception(detail: str = "No se pudo validar las credenciales") -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def _forbidden_exception(detail: str = "No tienes permiso para realizar esta acción") -> HTTPException:
    return HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=detail)


# ─────────────────────────────────────────────────────────────────
# get_current_user
# ─────────────────────────────────────────────────────────────────
async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    """
    Valida el JWT de Supabase (ES256 o HS256) y retorna el User ORM.

    Flujo:
        1. Extrae el Bearer token del header Authorization.
        2. Lee el header del JWT para obtener alg y kid.
        3. Si alg == ES256 → obtiene clave pública del JWKS de Supabase.
           Si alg == HS256 → usa SUPABASE_JWT_SECRET directamente (proyectos legacy).
        4. Verifica firma, expiración y audience.
        5. Upsert del usuario en la DB local (primer login).
    """
    if credentials is None:
        raise _credentials_exception("Token de autenticación requerido")

    token = credentials.credentials

    # Leer header sin verificar para obtener alg y kid
    try:
        header = jwt.get_unverified_header(token)
    except JWTError as exc:
        raise _credentials_exception(f"Token malformado: {exc}") from exc

    alg = header.get("alg", "HS256")
    kid = header.get("kid")

    # Seleccionar clave de verificación según algoritmo
    try:
        if alg == "ES256":
            # Proyectos nuevos de Supabase — clave pública desde JWKS
            if not kid:
                raise _credentials_exception("Token ES256 sin kid en el header")
            jwks = await _get_jwks()
            if kid not in jwks:
                # Forzar refresco del caché e intentar una vez más
                global _jwks_fetched_at
                _jwks_fetched_at = 0.0
                jwks = await _get_jwks()
            if kid not in jwks:
                raise _credentials_exception(f"Clave pública no encontrada para kid={kid}")
            signing_key = jwks[kid]
        else:
            # Proyectos legacy — HS256 con secreto simétrico
            signing_key = settings.SUPABASE_JWT_SECRET

        payload = jwt.decode(
            token,
            signing_key,
            algorithms=[alg],
            audience="authenticated",
            options={
                "verify_exp": True,
                "verify_aud": True,
                "verify_iss": False,
            },
        )
    except JWTError as exc:
        raise _credentials_exception(f"Token inválido o expirado: {exc}") from exc

    # Extraer claims
    user_id: str | None = payload.get("sub")
    email:   str | None = payload.get("email")
    role:    str | None = payload.get("role")

    if not user_id:
        raise _credentials_exception("Token sin identificador de usuario (sub)")

    if role == "service_role":
        raise _forbidden_exception("Los tokens de service_role no son válidos en este endpoint")

    # Buscar o crear usuario en DB local
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None:
        if not email:
            raise _credentials_exception("Token sin email: no se puede crear el perfil de usuario")
        user = User(
            id=user_id,
            email=email,
            display_name=payload.get("user_metadata", {}).get("display_name"),
            is_active=True,
        )
        db.add(user)
        await db.flush()

    if not user.is_active:
        raise _forbidden_exception("Cuenta de usuario suspendida")

    return user


# ─────────────────────────────────────────────────────────────────
# Type aliases
# ─────────────────────────────────────────────────────────────────
CurrentUser = Annotated[User, Depends(get_current_user)]
DBSession   = Annotated[AsyncSession, Depends(get_db)]
