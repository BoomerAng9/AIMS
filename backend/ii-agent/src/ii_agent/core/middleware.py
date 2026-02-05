"""Authentication middleware for FastAPI."""

import logging
import traceback
from typing import Callable
from fastapi import HTTPException, Request, Response
from fastapi.responses import JSONResponse
from ii_agent.core.exceptions import NotFoundException, PermissionException


logger = logging.getLogger(__name__)


async def exception_logging_middleware(
    request: Request, call_next: Callable
) -> Response:
    """Middleware to log unhandled exceptions.

    Args:
    ----
        request (Request): The incoming request.
        call_next (Callable): The next middleware in the chain.

    Returns:
    -------
        Response: The response to the incoming request.

    """
    try:
        response = await call_next(request)
        return response
    except HTTPException as exc:
        return JSONResponse(status_code=exc.status_code, content={"error": exc.detail})
    except Exception as _:
        logger.error(traceback.format_exc(), exc_info=True)
        return JSONResponse(
            status_code=500, content={"detail": "Internal Server Error"}
        )


async def permission_exception_handler(
    request: Request, exc: PermissionException
) -> JSONResponse:
    """Exception handler for PermissionException.

    Args:
    ----
        request (Request): The incoming request that triggered the exception.
        exc (PermissionException): The exception object that was raised.

    Returns:
    -------
        JSONResponse: A 403 Forbidden status response that details the error message.

    """
    return JSONResponse(status_code=403, content={"detail": str(exc)})


async def not_found_exception_handler(
    request: Request, exc: NotFoundException
) -> JSONResponse:
    """Exception handler for NotFoundException.

    Args:
    ----
        request (Request): The incoming request that triggered the exception.
        exc (NotFoundException): The exception object that was raised.

    Returns:
    -------
        JSONResponse: A 404 Not Found status response that details the error message.

    """
    return JSONResponse(status_code=404, content={"detail": str(exc)})
