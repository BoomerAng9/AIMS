from contextlib import asynccontextmanager
from typing import AsyncGenerator, Optional, List
import uuid
import ssl
from urllib.parse import urlparse, parse_qs
from sqlalchemy import asc, select, desc, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.ext.asyncio import async_sessionmaker
from sqlalchemy.ext.asyncio import AsyncSession as DBSession
from ii_tool.integrations.app.config import config

# Use the same db schema without duplication code
from ii_agent.db.models import User, APIKey
from ii_agent.metrics.service import accumulate_session_metrics
from ii_agent.server.credits.service import deduct_user_credits


# Parse the database URL to handle SSL parameters for asyncpg
database_url = config.database_url
connect_args = {}

if "+asyncpg" in database_url:
    # Parse the URL to extract SSL parameters
    parsed = urlparse(database_url)
    if parsed.query:
        query_params = parse_qs(parsed.query)

        # Remove SSL-related parameters from the URL
        clean_params = []
        for key, values in query_params.items():
            if key not in ["sslmode", "channel_binding", "ssl"]:
                for value in values:
                    clean_params.append(f"{key}={value}")

        # Reconstruct the URL without SSL parameters
        clean_query = "&".join(clean_params) if clean_params else ""
        database_url = database_url.split("?")[0]
        if clean_query:
            database_url += "?" + clean_query

        # Configure SSL for asyncpg based on sslmode parameter
        if "sslmode" in query_params:
            sslmode = query_params["sslmode"][0]
            if sslmode in ["require", "verify-ca", "verify-full"]:
                # Create SSL context
                ssl_context = ssl.create_default_context()
                ssl_context.check_hostname = False
                ssl_context.verify_mode = ssl.CERT_NONE
                connect_args["ssl"] = ssl_context

engine = create_async_engine(
    database_url, echo=False, future=True, connect_args=connect_args
)
SessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False)


@asynccontextmanager
async def get_db() -> AsyncGenerator[DBSession, None]:
    """Get a database session as a context manager.

    Yields:
        A database session that will be automatically committed or rolled back
    """
    async with SessionLocal() as db:
        try:
            yield db
            await db.commit()
        except Exception:
            await db.rollback()
            raise


async def get_user_by_api_key(api_key: str) -> User | None:
    """Resolve a user from their API key."""
    async with get_db() as db:
        result = await db.execute(
            select(APIKey)
            .options(selectinload(APIKey.user))
            .where(
                APIKey.api_key == api_key,
                APIKey.is_active.is_(True),
            )
        )
        api_key_obj = result.scalar_one_or_none()

        if not api_key_obj or not api_key_obj.user or not api_key_obj.user.is_active:
            return None

        return api_key_obj.user


async def apply_tool_usage(user_id: str, session_id: str, amount: float) -> bool:
    """Apply tool usage to the user and session."""
    async with get_db() as db:
        apply_session_success = await accumulate_session_metrics(
            db_session=db, session_id=session_id, credits=-amount
        )
        apply_user_success = await deduct_user_credits(
            db_session=db, user_id=user_id, amount=amount
        )
        if apply_session_success and apply_user_success:
            return True
        else:
            return False
