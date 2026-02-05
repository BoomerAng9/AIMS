"""Billing API endpoints."""

from __future__ import annotations

from typing import Literal, Optional

import stripe
from fastapi import APIRouter, HTTPException, Request, Response, status
from pydantic import BaseModel, ConfigDict, Field

from ii_agent.server.api.deps import CurrentUser
from ii_agent.server.services.billing_service import (
    BillingConfigurationError,
    BillingServiceError,
    BillingUnsupportedPlanError,
    CheckoutSessionParams,
)
from ii_agent.server import shared


router = APIRouter(prefix="/billing", tags=["Billing"])


class CheckoutSessionRequest(BaseModel):
    """Request payload for creating a Stripe checkout session."""

    model_config = ConfigDict(populate_by_name=True)

    plan_id: Literal["free", "plus", "pro"] = Field(alias="planId")
    billing_cycle: Literal["monthly", "annually"] = Field(alias="billingCycle")
    return_url: Optional[str] = Field(default=None, alias="returnUrl")


class CheckoutSessionResponse(BaseModel):
    """Response payload returned after creating a checkout session."""

    model_config = ConfigDict(populate_by_name=True)

    session_id: Optional[str] = Field(default=None, alias="sessionId")
    url: Optional[str] = None


class PortalSessionResponse(BaseModel):
    """Response payload for Stripe billing portal session."""

    url: str


class PortalSessionRequest(BaseModel):
    """Request payload for creating a portal session."""

    model_config = ConfigDict(populate_by_name=True)

    return_url: Optional[str] = Field(default=None, alias="returnUrl")


@router.post("/checkout-session", response_model=CheckoutSessionResponse)
async def create_checkout_session(
    payload: CheckoutSessionRequest,
    current_user: CurrentUser,
) -> CheckoutSessionResponse:
    """Create a Stripe checkout session for the selected plan."""

    try:
        session = await shared.billing_service.create_checkout_session(
            CheckoutSessionParams(
                plan_id=payload.plan_id,
                billing_cycle=payload.billing_cycle,
                user_id=str(current_user.id),
                return_url=payload.return_url,
            )
        )
    except BillingUnsupportedPlanError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)
        ) from error
    except BillingConfigurationError as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(error)
        ) from error
    except BillingServiceError as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(error),
        ) from error
    except stripe.error.StripeError as error:  # pragma: no cover - network path
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=error.user_message or "Unable to create checkout session",
        ) from error

    return CheckoutSessionResponse(
        session_id=session.id, url=getattr(session, "url", None)
    )


@router.post("/webhook", status_code=200)
async def stripe_webhook(request: Request) -> Response:
    """Receive and process Stripe webhook events."""

    payload = await request.body()
    signature = request.headers.get("stripe-signature")

    try:
        event = shared.billing_service.construct_webhook_event(payload, signature)
        await shared.billing_service.handle_webhook_event(event)
    except BillingConfigurationError as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(error)
        ) from error
    except BillingServiceError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)
        ) from error
    except stripe.error.StripeError as error:  # pragma: no cover - network path
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=error.user_message or "Stripe webhook error",
        ) from error

    return Response(status_code=status.HTTP_200_OK)


@router.post("/portal-session", response_model=PortalSessionResponse)
async def create_portal_session(
    payload: Optional[PortalSessionRequest], current_user: CurrentUser
) -> PortalSessionResponse:
    """Create a Stripe billing portal session for the current user."""

    try:
        url = await shared.billing_service.create_portal_session(
            str(current_user.id), payload.return_url if payload else None
        )
        return PortalSessionResponse(url=url)
    except BillingConfigurationError as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(error)
        ) from error
    except BillingServiceError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)
        ) from error
    except stripe.error.StripeError as error:  # pragma: no cover - network path
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=error.user_message or "Unable to create billing portal session",
        ) from error
