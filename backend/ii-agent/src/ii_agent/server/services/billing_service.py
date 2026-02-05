"""Billing service that integrates with Stripe checkout sessions and webhooks."""

from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict, Optional, Tuple

import stripe
from fastapi.concurrency import run_in_threadpool
from sqlalchemy import select

from ii_agent.core.config.ii_agent_config import IIAgentConfig, config
from ii_agent.db.manager import get_db_session_local
from ii_agent.db.models import BillingTransaction, User


logger = logging.getLogger(__name__)


class BillingServiceError(Exception):
    """Base error for billing service issues."""


class BillingConfigurationError(BillingServiceError):
    """Raised when billing configuration is missing or invalid."""


class BillingUnsupportedPlanError(BillingServiceError):
    """Raised when a requested plan or billing cycle is not supported."""


@dataclass(slots=True)
class CheckoutSessionParams:
    """Parameters required to create a checkout session."""

    plan_id: str
    billing_cycle: str
    user_id: str
    return_url: Optional[str]


class BillingService:
    """Service responsible for creating Stripe checkout sessions and handling webhooks."""

    def __init__(self, config: IIAgentConfig) -> None:
        self._config = config
        self._price_map: Dict[str, Dict[str, Optional[str]]] = {
            "plus": {
                "monthly": self._config.stripe_price_plus_monthly,
                "annually": self._config.stripe_price_plus_annually,
            },
            "pro": {
                "monthly": self._config.stripe_price_pro_monthly,
                "annually": self._config.stripe_price_pro_annually,
            },
        }

    # ------------------------------------------------------------------
    # Stripe client helpers
    # ------------------------------------------------------------------
    def _ensure_api_key(self) -> None:
        if not self._config.stripe_secret_key:
            raise BillingConfigurationError("Stripe secret key is not configured")

        if stripe.api_key != self._config.stripe_secret_key:
            stripe.api_key = self._config.stripe_secret_key

    def _get_price_id(self, plan_id: str, billing_cycle: str) -> str:
        plan_prices = self._price_map.get(plan_id)
        if not plan_prices:
            raise BillingUnsupportedPlanError(
                f"Plan '{plan_id}' is not available for upgrade"
            )

        price_id = plan_prices.get(billing_cycle)
        if not price_id:
            raise BillingConfigurationError(
                f"Stripe price id is not configured for plan '{plan_id}' with billing cycle '{billing_cycle}'"
            )

        return price_id

    def _plan_cycle_from_price(
        self, price_id: Optional[str]
    ) -> Optional[Tuple[str, str]]:
        if not price_id:
            return None

        for plan_id, cycles in self._price_map.items():
            for cycle, configured_price in cycles.items():
                if configured_price and configured_price == price_id:
                    return plan_id, cycle
        return None

    def _resolve_return_urls(self, return_url: Optional[str]) -> tuple[str, str]:
        base_url = (return_url or self._config.stripe_return_url or "").rstrip("/")

        success_url = self._config.stripe_success_url
        cancel_url = self._config.stripe_cancel_url

        if base_url:
            success_url = (
                success_url
                or f"{base_url}/billing/success?session_id={{CHECKOUT_SESSION_ID}}"
            )
            cancel_url = cancel_url or f"{base_url}"

        if not success_url or not cancel_url:
            raise BillingConfigurationError(
                "Stripe success and cancel URLs are not configured. Provide them via configuration or request."
            )

        return success_url, cancel_url

    @staticmethod
    def _to_datetime(timestamp: Optional[int]) -> Optional[datetime]:
        if not timestamp:
            return None
        return datetime.fromtimestamp(timestamp, tz=timezone.utc)

    @staticmethod
    def _as_dict(stripe_object: Any) -> Dict[str, Any]:
        if stripe_object is None:
            return {}
        if isinstance(stripe_object, dict):
            return stripe_object
        if hasattr(stripe_object, "to_dict_recursive"):
            return stripe_object.to_dict_recursive()
        return dict(stripe_object)

    def _plan_credits(self, plan_id: Optional[str]) -> Optional[float]:
        if not plan_id:
            return None
        return config.default_plans_credits.get(plan_id)

    async def _get_user(self, user_id: str) -> Optional[User]:
        async with get_db_session_local() as db:
            return await db.get(User, user_id)

    async def _record_transaction(
        self,
        *,
        event_id: Optional[str],
        user_id: str,
        values: Dict[str, Any],
    ) -> None:
        if not event_id:
            logger.warning(
                "Skipping billing transaction for user %s due to missing event id",
                user_id,
            )
            return

        async with get_db_session_local() as db:
            existing = await db.execute(
                select(BillingTransaction).where(
                    BillingTransaction.stripe_event_id == event_id
                )
            )
            if existing.scalar_one_or_none():
                logger.debug(
                    "Billing transaction already exists for event %s", event_id
                )
                return

            transaction = BillingTransaction(
                user_id=user_id,
                stripe_event_id=event_id,
                **values,
            )
            db.add(transaction)
            logger.info(
                "Stored billing transaction for user %s (event %s)",
                user_id,
                event_id,
            )

    async def _lookup_user_by_customer_id(
        self, customer_id: Optional[str]
    ) -> Optional[str]:
        if not customer_id:
            return None

        async with get_db_session_local() as db:
            result = await db.execute(
                select(User.id).where(User.stripe_customer_id == customer_id)
            )
            row = result.first()
            return row[0] if row else None

    async def _retrieve_subscription(
        self, subscription_id: Optional[str]
    ) -> Optional[Dict[str, Any]]:
        if not subscription_id:
            return None

        self._ensure_api_key()

        try:
            subscription = await run_in_threadpool(
                stripe.Subscription.retrieve, subscription_id
            )
            return self._as_dict(subscription)
        except stripe.error.StripeError as exc:  # pragma: no cover - network path
            logger.error("Failed to retrieve subscription %s: %s", subscription_id, exc)
            return None

    # ------------------------------------------------------------------
    # Checkout session creation
    # ------------------------------------------------------------------
    async def create_checkout_session(
        self, params: CheckoutSessionParams
    ) -> stripe.checkout.Session:
        if params.plan_id == "free":
            raise BillingUnsupportedPlanError("Free plan does not require checkout")

        self._ensure_api_key()

        price_id = self._get_price_id(params.plan_id, params.billing_cycle)
        success_url, cancel_url = self._resolve_return_urls(params.return_url)

        metadata = {
            "plan_id": params.plan_id,
            "billing_cycle": params.billing_cycle,
            "user_id": params.user_id,
        }

        # Use the stored customer, if available, so Stripe reuses payment details.
        # When not provided, Stripe will create a new customer automatically for the session.
        customer_kwargs: Dict[str, Any] = {}
        user = await self._get_user(params.user_id)
        if user and user.stripe_customer_id:
            customer_kwargs["customer"] = user.stripe_customer_id

        session = await run_in_threadpool(
            stripe.checkout.Session.create,
            mode="subscription",
            line_items=[{"price": price_id, "quantity": 1}],
            success_url=success_url,
            cancel_url=cancel_url,
            client_reference_id=params.user_id,
            metadata=metadata,
            subscription_data={"metadata": metadata},
            automatic_tax={"enabled": True},
            **customer_kwargs,
        )

        return session

    async def create_portal_session(
        self, user_id: str, return_url: Optional[str] = None
    ) -> str:
        user = await self._get_user(user_id)
        if not user:
            raise BillingServiceError("User not found")

        if not user.stripe_customer_id:
            raise BillingServiceError(
                "Stripe customer not found for this account. Complete a checkout first."
            )

        portal_return_url = return_url or self._config.stripe_portal_return_url
        if not portal_return_url:
            raise BillingConfigurationError(
                "A return URL must be provided for the billing portal session"
            )

        self._ensure_api_key()

        try:
            session = await run_in_threadpool(
                stripe.billing_portal.Session.create,
                customer=user.stripe_customer_id,
                return_url=portal_return_url,
            )
        except stripe.error.StripeError as exc:  # pragma: no cover - network path
            raise BillingServiceError(
                f"Failed to create billing portal session: {exc.user_message or str(exc)}"
            ) from exc

        url = getattr(session, "url", None)
        if not url:
            raise BillingServiceError("Stripe did not return a portal URL")

        return url

    # ------------------------------------------------------------------
    # Webhook handling
    # ------------------------------------------------------------------
    def construct_webhook_event(
        self, payload: bytes, signature: Optional[str]
    ) -> stripe.Event:
        if not self._config.stripe_webhook_secret:
            raise BillingConfigurationError("Stripe webhook secret is not configured")
        if not signature:
            raise BillingServiceError("Missing Stripe signature header")

        self._ensure_api_key()

        try:
            return stripe.Webhook.construct_event(
                payload, signature, self._config.stripe_webhook_secret
            )
        except ValueError as exc:  # pragma: no cover - malformed payload
            raise BillingServiceError("Invalid Stripe webhook payload") from exc
        except stripe.error.SignatureVerificationError as exc:  # pragma: no cover
            raise BillingServiceError("Invalid Stripe signature") from exc

    async def handle_webhook_event(self, event: stripe.Event) -> None:
        event_type = event.get("type")
        event_id = event.get("id")
        data_object = event.get("data", {}).get("object")

        logger.info("Processing Stripe event %s (%s)", event_id, event_type)

        if event_type == "checkout.session.completed":
            await self._handle_checkout_session_completed(event_id, data_object)
        elif event_type == "invoice.payment_succeeded":
            await self._handle_invoice_payment_succeeded(event_id, data_object)
        elif event_type == "customer.subscription.deleted":
            await self._handle_subscription_deleted(event_id, data_object)
        elif event_type == "customer.subscription.updated":
            await self._handle_subscription_updated(event_id, data_object)
        else:
            logger.debug("Unhandled Stripe event type: %s", event_type)

    async def _handle_checkout_session_completed(
        self, event_id: Optional[str], session_object: Any
    ) -> None:
        session_data = self._as_dict(session_object)
        metadata = session_data.get("metadata", {}) or {}

        user_id = metadata.get("user_id")
        plan_id = metadata.get("plan_id")
        billing_cycle = metadata.get("billing_cycle")
        subscription_id = session_data.get("subscription")
        customer_id = session_data.get("customer")

        if not user_id:
            logger.warning(
                "Checkout session %s missing user or plan metadata", event_id
            )
            return

        subscription = await self._retrieve_subscription(subscription_id)
        status = (
            subscription.get("status") if subscription else session_data.get("status")
        )

        resolved_plan_id = plan_id
        resolved_billing_cycle = billing_cycle

        if subscription:
            subscription_metadata = subscription.get("metadata", {}) or {}
            resolved_plan_id = resolved_plan_id or subscription_metadata.get("plan_id")
            resolved_billing_cycle = (
                resolved_billing_cycle or subscription_metadata.get("billing_cycle")
            )

            items = subscription.get("items", {}).get("data", []) or []
            first_item = items[0] if items else {}
            price = first_item.get("price") or {}
            price_id = price.get("id")

            if price_id and (not resolved_plan_id or not resolved_billing_cycle):
                mapped = self._plan_cycle_from_price(price_id)
                if mapped:
                    derived_plan, derived_cycle = mapped
                    resolved_plan_id = resolved_plan_id or derived_plan
                    resolved_billing_cycle = resolved_billing_cycle or derived_cycle

            if not customer_id:
                customer_id = subscription.get("customer")

        period_end = first_item.get("current_period_end") if first_item else None

        credits = self._plan_credits(resolved_plan_id)

        async with get_db_session_local() as db:
            user = await db.get(User, user_id)
            if not user:
                raise BillingServiceError(
                    f"User {user_id} not found for checkout session completion"
                )

            user.subscription_plan = plan_id
            user.subscription_status = status
            if resolved_billing_cycle:
                user.subscription_billing_cycle = resolved_billing_cycle
            if customer_id:
                user.stripe_customer_id = customer_id
            if period_end:
                user.subscription_current_period_end = self._to_datetime(period_end)
            if credits is not None:
                user.credits = credits

            logger.info(
                "Updated subscription for user %s via checkout completion: plan=%s, status=%s",
                user_id,
                resolved_plan_id,
                status,
            )

        await self._record_transaction(
            event_id=event_id or session_data.get("id"),
            user_id=user_id,
            values={
                "stripe_object_id": session_data.get("id"),
                "stripe_customer_id": customer_id,
                "stripe_subscription_id": subscription_id,
                "plan_id": resolved_plan_id,
                "billing_cycle": resolved_billing_cycle,
                "status": status,
                "raw_payload": session_data,
            },
        )

    async def _handle_invoice_payment_succeeded(
        self, event_id: Optional[str], invoice_object: Any
    ) -> None:
        invoice_data = self._as_dict(invoice_object)
        invoice_id = invoice_data.get("id")
        subscription_id = invoice_data.get("subscription")
        customer_id = invoice_data.get("customer")
        metadata = invoice_data.get("metadata", {}) or {}

        user_id = metadata.get("user_id")
        plan_id = metadata.get("plan_id")
        billing_cycle = metadata.get("billing_cycle")

        subscription = await self._retrieve_subscription(subscription_id)
        if subscription:
            subscription_metadata = subscription.get("metadata", {}) or {}
            user_id = user_id or subscription_metadata.get("user_id")
            plan_id = plan_id or subscription_metadata.get("plan_id")
            billing_cycle = billing_cycle or subscription_metadata.get("billing_cycle")
            customer_id = customer_id or subscription.get("customer")

        if not user_id:
            user_id = await self._lookup_user_by_customer_id(customer_id)

        if not user_id:
            logger.warning(
                "Invoice payment event %s missing user identification", event_id
            )
            return

        if not plan_id:
            line_items = invoice_data.get("lines", {}).get("data", [])
            if line_items:
                price = (line_items[0] or {}).get("price") or {}
                price_id = price.get("id")
                mapped = self._plan_cycle_from_price(price_id)
                if mapped:
                    plan_id, inferred_cycle = mapped
                    billing_cycle = billing_cycle or inferred_cycle

        credits = self._plan_credits(plan_id)
        amount_paid = invoice_data.get("amount_paid")
        currency = invoice_data.get("currency")
        status = invoice_data.get("status")
        period_end = subscription.get("current_period_end") if subscription else None

        async with get_db_session_local() as db:
            user = await db.get(User, user_id)
            if not user:
                raise BillingServiceError(f"User {user_id} not found for invoice event")

            if plan_id:
                user.subscription_plan = plan_id
            user.subscription_status = (
                subscription.get("status", status) if subscription else status
            )
            if customer_id:
                user.stripe_customer_id = customer_id
            if period_end:
                user.subscription_current_period_end = self._to_datetime(period_end)
            if credits is not None:
                user.credits = credits
            if billing_cycle:
                user.subscription_billing_cycle = billing_cycle

        await self._record_transaction(
            event_id=event_id or invoice_id,
            user_id=user_id,
            values={
                "stripe_object_id": invoice_id,
                "stripe_customer_id": customer_id,
                "stripe_subscription_id": subscription_id,
                "stripe_invoice_id": invoice_id,
                "stripe_payment_intent_id": invoice_data.get("payment_intent"),
                "amount": (amount_paid or 0) / 100 if amount_paid is not None else None,
                "currency": currency,
                "plan_id": plan_id,
                "billing_cycle": billing_cycle,
                "credits": credits,
                "status": invoice_data.get("status"),
                "raw_payload": self._as_dict(invoice_data),
            },
        )

        logger.info(
            "Recorded billing transaction for user %s: invoice=%s, plan=%s, amount=%s",
            user_id,
            invoice_id,
            plan_id,
            (amount_paid or 0) / 100 if amount_paid is not None else None,
        )

    async def _handle_subscription_deleted(
        self, event_id: Optional[str], subscription_object: Any
    ) -> None:
        subscription_data = self._as_dict(subscription_object)
        metadata = subscription_data.get("metadata", {}) or {}
        user_id = metadata.get("user_id")
        customer_id = subscription_data.get("customer")

        if not user_id:
            user_id = await self._lookup_user_by_customer_id(customer_id)

        if not user_id:
            logger.warning(
                "Subscription cancel event %s missing user identification", event_id
            )
            return

        status = subscription_data.get("status") or "canceled"
        period_end = subscription_data.get(
            "current_period_end"
        ) or subscription_data.get("canceled_at")

        async with get_db_session_local() as db:
            user = await db.get(User, user_id)
            if not user:
                logger.warning(
                    "Could not update canceled subscription for missing user %s",
                    user_id,
                )
                return

            user.subscription_status = status
            user.subscription_plan = "free"
            user.subscription_billing_cycle = None
            user.credits = config.default_user_credits
            if period_end:
                user.subscription_current_period_end = self._to_datetime(period_end)

            logger.info(
                "Marked subscription canceled for user %s via event %s",
                user_id,
                event_id,
            )

        items = subscription_data.get("items", {}).get("data", []) or []
        first_plan = items[0].get("plan", {}) if items else {}
        billing_cycle = first_plan.get("interval")

        await self._record_transaction(
            event_id=event_id or subscription_data.get("id"),
            user_id=user_id,
            values={
                "stripe_object_id": subscription_data.get("id"),
                "stripe_customer_id": customer_id,
                "stripe_subscription_id": subscription_data.get("id"),
                "status": status,
                "plan_id": "free",
                "billing_cycle": billing_cycle,
                "raw_payload": subscription_data,
            },
        )

    async def _handle_subscription_updated(
        self, event_id: Optional[str], subscription_object: Any
    ) -> None:
        subscription_data = self._as_dict(subscription_object)
        metadata = subscription_data.get("metadata", {}) or {}
        user_id = metadata.get("user_id")
        plan_id = metadata.get("plan_id")
        billing_cycle = metadata.get("billing_cycle")
        customer_id = subscription_data.get("customer")

        items = subscription_data.get("items", {}).get("data", []) or []
        first_item = items[0] if items else {}
        price = first_item.get("price") or {}
        price_id = price.get("id")

        if price_id:
            mapped = self._plan_cycle_from_price(price_id)
            if mapped:
                mapped_plan_id, mapped_cycle = mapped
                plan_id = mapped_plan_id
                billing_cycle = billing_cycle or mapped_cycle

        if not billing_cycle:
            recurring = price.get("recurring") or {}
            interval = recurring.get("interval")
            if interval:
                billing_cycle = billing_cycle or interval
            elif first_item:
                plan_interval = (first_item.get("plan") or {}).get("interval")
                if plan_interval:
                    billing_cycle = plan_interval

        if not user_id:
            user_id = await self._lookup_user_by_customer_id(customer_id)

        if not user_id:
            logger.warning(
                "Subscription update event %s missing user identification", event_id
            )
            return

        status = subscription_data.get("status")
        period_end = subscription_data.get("current_period_end")
        credits = self._plan_credits(plan_id)

        async with get_db_session_local() as db:
            user = await db.get(User, user_id)
            if not user:
                logger.warning(
                    "Could not update subscription for missing user %s", user_id
                )
                return

            if plan_id:
                user.subscription_plan = plan_id
            if status:
                user.subscription_status = status
            if billing_cycle:
                user.subscription_billing_cycle = billing_cycle
            if customer_id:
                user.stripe_customer_id = customer_id
            if period_end:
                user.subscription_current_period_end = self._to_datetime(period_end)
            if credits is not None:
                user.credits = credits

            logger.info(
                "Updated subscription for user %s via subscription updated event: plan=%s, status=%s",
                user_id,
                plan_id,
                status,
            )

        await self._record_transaction(
            event_id=event_id or subscription_data.get("id"),
            user_id=user_id,
            values={
                "stripe_object_id": subscription_data.get("id"),
                "stripe_customer_id": customer_id,
                "stripe_subscription_id": subscription_data.get("id"),
                "plan_id": plan_id,
                "billing_cycle": billing_cycle,
                "credits": credits,
                "status": status,
                "raw_payload": subscription_data,
            },
        )


__all__ = [
    "BillingService",
    "BillingServiceError",
    "BillingConfigurationError",
    "BillingUnsupportedPlanError",
    "CheckoutSessionParams",
]
