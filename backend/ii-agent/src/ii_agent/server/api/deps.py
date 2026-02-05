from typing import Annotated, Optional

from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import select

from ii_agent.db.models import User
from ii_agent.server.auth.jwt_handler import jwt_handler
from ii_agent.server.models.auth import TokenPayload

security = HTTPBearer()
security_optional = HTTPBearer(auto_error=False)


async def get_db_session():
    from ii_agent.db.manager import get_db

    async with get_db() as db:
        yield db


DBSession = Annotated[AsyncSession, Depends(get_db_session)]


async def get_current_user(
    db: DBSession,
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> User:
    """Get the current authenticated user."""
    token = credentials.credentials

    # Verify the access token
    payload = jwt_handler.verify_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token_data = TokenPayload(**payload)
    # Get user from database
    # user = db.query(User).filter(User.id == token_data.user_id).first()
    result = await db.execute(select(User).where(User.id == token_data.user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is disabled",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


async def get_current_user_optional(
    db: DBSession,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_optional),
) -> Optional[User]:
    """Get the current authenticated user if token is provided, otherwise return None."""
    if not credentials:
        return None
    
    token = credentials.credentials

    # Verify the access token
    payload = jwt_handler.verify_access_token(token)
    if not payload:
        return None
    
    token_data = TokenPayload(**payload)
    result = await db.execute(select(User).where(User.id == token_data.user_id))
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        return None

    return user


# Alias for backwards compatibility
get_db = get_db_session
