"""
backend/api/dependencies.py — Dependencias reutilizables de FastAPI.

Responsabilidades:
    1. `get_db`           → Re-exporta la sesión de DB desde db.database.
    2. `get_current_user` → Valida el JWT de Supabase y retorna el User autenticado.
       - Extrae el Bearer token del header Authorization.
       - Valida la firma con SUPABASE_JWT_SECRET (HS256).
       - Verifica expiración, audience e issuer.
       - Si el usuario no existe en nuestra DB local, lo crea (upsert en primer login).
       - Retorna el objeto User ORM listo para usar en cualquier endpoint.

Diseño JWT de Supabase:
    Supabase emite JWTs firmados con HMAC-SHA256 (HS256).
    El secreto se obtiene en: Dashboard → Settings → API → JWT Secret.
    Claims relevantes:
        sub   → UUID del usuario (auth.users.id)
        email → Email del usuario
        exp   → Timestamp de expiración
        aud   → "authenticated"
        role  → "authenticated" (usuarios normales) | "service_role" (admin)
"""

from __future__ import annotations

from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.config import settings
from backend.db.database import get_db
from backend.models import User

# ─────────────────────────────────────────────────────────────────
# Esquema de seguridad HTTP Bearer
# auto_error=False → controlamos el error nosotros (mejor mensaje)
# ─────────────────────────────────────────────────────────────────
_bearer_scheme = HTTPBearer(auto_error=False)


# ─────────────────────────────────────────────────────────────────
# Excepciones HTTP estándar reutilizables
# ─────────────────────────────────────────────────────────────────
def _credentials_exception(detail: str = "No se pudo validar las credenciales") -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def _forbidden_exception(detail: str = "No tienes permiso para realizar esta acción") -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=detail,
    )


# ─────────────────────────────────────────────────────────────────
# Dependencia principal: get_current_user
# ─────────────────────────────────────────────────────────────────
async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    """
    Valida el JWT de Supabase y retorna el User ORM del usuario autenticado.

    Flujo:
        1. Extrae el Bearer token del header `Authorization`.
        2. Decodifica y valida la firma con SUPABASE_JWT_SECRET (HS256).
        3. Verifica `aud == "authenticated"`.
        4. Busca el User en nuestra tabla `users` por `sub` (UUID).
        5. Si no existe → lo crea con los datos del JWT (primer login / upsert).
        6. Si está desactivado (is_active=False) → 403 Forbidden.

    Raises:
        HTTPException 401 → Token ausente, malformado, expirado o firma inválida.
        HTTPException 403 → Usuario suspendido (is_active=False).
    """
    # 1. Verificar que el token existe
    if credentials is None:
        raise _credentials_exception("Token de autenticación requerido")

    token = credentials.credentials

    # 2. Decodificar y validar el JWT
    try:
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            # Supabase emite tokens con audience "authenticated" para usuarios normales
            audience="authenticated",
            options={
                "verify_exp": True,       # Verificar expiración
                "verify_aud": True,       # Verificar audience
                "verify_iss": False,      # Issuer opcional (varía por proyecto)
            },
        )
    except JWTError as exc:
        # Captura: firma inválida, token expirado, formato incorrecto
        raise _credentials_exception(f"Token inválido o expirado: {exc}") from exc

    # 3. Extraer claims del JWT
    user_id: str | None = payload.get("sub")
    email: str | None = payload.get("email")
    role: str | None = payload.get("role")

    if not user_id:
        raise _credentials_exception("Token sin identificador de usuario (sub)")

    # Bloquear tokens de service_role (solo para uso interno de Supabase)
    if role == "service_role":
        raise _forbidden_exception("Los tokens de service_role no son válidos en este endpoint")

    # 4. Buscar el usuario en nuestra DB
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    # 5. Upsert en primer login — crear el registro local si no existe
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
        await db.flush()   # Persiste en la transacción sin commit final
        # El commit lo hace el get_db dependency al cerrar la sesión

    # 6. Verificar que el usuario no esté suspendido
    if not user.is_active:
        raise _forbidden_exception("Cuenta de usuario suspendida")

    return user


# ─────────────────────────────────────────────────────────────────
# Type alias — simplifica las firmas de los routers
# ─────────────────────────────────────────────────────────────────
# Uso: async def my_endpoint(current_user: CurrentUser, db: DBSession)
CurrentUser = Annotated[User, Depends(get_current_user)]
DBSession   = Annotated[AsyncSession, Depends(get_db)]
