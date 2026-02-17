"""
This module provides the base layer for unified API calls.
"""
import asyncio
import json
from types import SimpleNamespace
from typing import Optional, Dict, Any, Type, List

import httpx
import litellm
import instructor
from pydantic import BaseModel
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception

try:  # Optional dependency: google-genai
    from google import genai
except ModuleNotFoundError:  # pragma: no cover - optional install
    genai = None

from card_box_core.config import (
    ApiClientSettings,
    LLMAdapterSettings,
    InteractionsAPISettings,
    settings,
)


def _is_retryable_error(exception: BaseException) -> bool:
    """
    Determine whether an exception should be retried.
    Retryable errors include network timeout/connectivity errors and HTTP 5xx errors.
    """
    if isinstance(exception, (httpx.TimeoutException, httpx.ConnectError)):
        return True
    if isinstance(exception, httpx.HTTPStatusError):
        # Only retry on server-side errors (5xx)
        return exception.response.status_code >= 500
    return False


class ApiClient:
    """
    A reusable and robust low-level HTTP client for common API call concerns.

    It wraps `httpx.AsyncClient` for connection pooling and async requests,
    and integrates `tenacity` for automatic retries with exponential backoff.
    """

    def __init__(self, base_url: str = "", headers: Optional[Dict[str, str]] = None, config: ApiClientSettings = settings.API_CLIENT):
        """
        Initialize ApiClient.

        Args:
            base_url (str): Base URL for all requests.
            headers (Optional[Dict[str, str]]): Default headers for all requests.
            config (ApiClientSettings): API client configuration.
        """
        self._client = httpx.AsyncClient(
            base_url=base_url,
            headers=headers or {},
            timeout=config.timeout
        )

    @retry(
        stop=stop_after_attempt(settings.API_CLIENT.retry_attempts),
        wait=wait_exponential(
            multiplier=settings.API_CLIENT.retry_wait_multiplier,
            min=settings.API_CLIENT.retry_wait_min,
            max=settings.API_CLIENT.retry_wait_max
        ),
        retry=retry_if_exception(_is_retryable_error)
    )
    async def request(self, method: str, url: str, **kwargs: Any) -> httpx.Response:
        """
        Execute an HTTP request and retry automatically on retryable failures.

        Args:
            method: HTTP method (for example, 'GET', 'POST').
            url: URL to request.
            **kwargs: Additional arguments passed to httpx.AsyncClient.request.

        Returns:
            httpx.Response object.

        Raises:
            httpx.HTTPStatusError: Raised when response remains 4xx/5xx after retries.
        """
        response = await self._client.request(method, url, **kwargs)
        response.raise_for_status()  # Raise for 4xx/5xx responses.
        return response

    async def __aenter__(self) -> 'ApiClient':
        await self._client.__aenter__()
        return self

    async def __aexit__(
        self,
        exc_type: Optional[Type[BaseException]] = None,
        exc_value: Optional[BaseException] = None,
        traceback: Optional[Any] = None,
    ) -> None:
        await self._client.__aexit__(exc_type, exc_value, traceback)


class _PseudoMessage(SimpleNamespace):
    """Mimics litellm message structure for compatibility."""


class _PseudoChoice(SimpleNamespace):
    """Mimics litellm choice structure for compatibility."""


class InteractionsCompletion:
    """Wrapper to present Interactions API responses like litellm completions."""

    def __init__(self, interaction: Any, content: str, tool_calls: Optional[List[Dict[str, Any]]] = None):
        self.interaction = interaction
        self.interaction_id = getattr(interaction, "id", None)
        self.status = getattr(interaction, "status", None)
        self.outputs = getattr(interaction, "outputs", [])
        message = _PseudoMessage(content=content, tool_calls=tool_calls or None)
        choice = _PseudoChoice(message=message, finish_reason=getattr(interaction, "finish_reason", "stop"))
        self.choices = [choice]
        self.raw_response = interaction


class InteractionsLLMAdapter:
    """Adapter that calls Gemini Interactions API instead of litellm."""

    def __init__(self, config: InteractionsAPISettings):
        if genai is None:  # pragma: no cover - optional dependency guard
            raise RuntimeError(
                "google-genai package is required for the Interactions backend. "
                "Install it via the optional 'interactions' extras."
            )
        self.config = config
        self.client = genai.Client(**(config.client_options or {}))

    async def get_completion(
        self,
        *,
        model: Optional[str],
        messages: Optional[List[Dict[str, Any]]] = None,
        interaction_input: Optional[List[Dict[str, Any]]] = None,
        tools: Optional[List[Dict[str, Any]]] = None,
        previous_interaction_id: Optional[str] = None,
        response_model: Optional[Type[BaseModel]] = None,
        **kwargs: Any,
    ) -> InteractionsCompletion:
        if response_model is not None:
            raise NotImplementedError("response_model is not supported with the Interactions API backend yet.")

        payload: Dict[str, Any] = {
            "model": model or self.config.default_model,
        }

        if interaction_input is None:
            interaction_input = self._convert_messages(messages or [])
        payload["input"] = interaction_input

        if tools:
            payload["tools"] = tools
        if previous_interaction_id and self.config.store:
            payload["previous_interaction_id"] = previous_interaction_id

        payload["store"] = self.config.store

        request_timeout = kwargs.pop("request_timeout", self.config.request_timeout)

        # Remove None values to avoid API complaints
        payload = {key: value for key, value in payload.items() if value is not None}

        interaction = await asyncio.wait_for(
            asyncio.to_thread(self.client.interactions.create, **payload),
            timeout=request_timeout,
        )

        return self._wrap_response(interaction)

    def _convert_messages(self, messages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        converted: List[Dict[str, Any]] = []
        for message in messages:
            role = message.get("role", "user")
            content = message.get("content")
            if isinstance(content, list):
                # Attempt to coerce structured parts into strings when needed
                parts_text = []
                for part in content:
                    if isinstance(part, dict):
                        if part.get("type") == "text" and "text" in part:
                            parts_text.append(str(part["text"]))
                        elif "media_info" in part:
                            parts_text.append(str(part["media_info"].get("content")))
                        else:
                            parts_text.append(json.dumps(part, ensure_ascii=False))
                    else:
                        parts_text.append(str(part))
                content_text = "\n".join([p for p in parts_text if p])
            elif isinstance(content, str):
                content_text = content
            else:
                content_text = json.dumps(content, ensure_ascii=False) if content is not None else ""

            if message.get("tool_calls"):
                tool_call_desc = json.dumps(message["tool_calls"], ensure_ascii=False)
                content_text = f"{content_text}\n[tool_calls]\n{tool_call_desc}".strip()

            role_key = role if role in {"user", "model", "system", "function"} else {
                "assistant": "model",
                "tool": "function"
            }.get(role, role)

            converted.append({
                "role": role_key,
                "content": [{"type": "text", "text": content_text}] if content_text else [],
            })

        return converted or [{"role": "user", "content": []}]

    def _wrap_response(self, interaction: Any) -> InteractionsCompletion:
        text_outputs: List[str] = []
        tool_calls: List[Dict[str, Any]] = []

        for output in getattr(interaction, "outputs", []) or []:
            output_type = getattr(output, "type", None)
            text_value = getattr(output, "text", None)
            if text_value:
                text_outputs.append(str(text_value))
            if output_type == "function_call":
                arguments = getattr(output, "arguments", None)
                if isinstance(arguments, (dict, list)):
                    arguments_str = json.dumps(arguments, ensure_ascii=False)
                else:
                    arguments_str = str(arguments) if arguments is not None else ""
                tool_calls.append({
                    "id": getattr(output, "id", None) or getattr(output, "name", None),
                    "type": "function",
                    "function": {
                        "name": getattr(output, "name", None),
                        "arguments": arguments_str,
                    },
                })

        content = "\n".join(text_outputs).strip()

        return InteractionsCompletion(
            interaction=interaction,
            content=content,
            tool_calls=tool_calls or None,
        )


class LLMAdapter:
    """Unified API adapter for different LLM providers with structured output support."""

    def __init__(
        self,
        config: LLMAdapterSettings = settings.LLM_ADAPTER,
        *,
        backend: Optional[str] = None,
        max_retries: Optional[int] = None,
    ):
        """
        Initialize LLMAdapter.

        Args:
            config: LLM adapter configuration.
            backend: Optional backend override ("litellm" or "interactions").
            max_retries: Optional retry count override.
        """
        self.backend = (backend or settings.LLM_BACKEND).lower()
        self.config = config
        self.max_retries = max_retries if max_retries is not None else config.max_retries

        if self.backend == "interactions":
            self.interactions_client = InteractionsLLMAdapter(settings.INTERACTIONS_API)
        else:
            # LiteLLM is already async, instructor patches it
            self.client = instructor.patch(
                create=litellm.acompletion,
                mode=instructor.Mode.JSON
            )
            self.litellm_params = config.litellm_params

    async def get_completion(
        self,
        messages: List[Dict[str, Any]],
        model: str,
        response_model: Optional[Type[BaseModel]] = None,
        **kwargs: Any
    ) -> Any:
        if self.backend == "interactions":
            return await self.interactions_client.get_completion(
                model=model,
                messages=messages,
                response_model=response_model,
                **kwargs,
            )

        params = {
            "model": model,
            "messages": messages,
            "max_retries": getattr(self, "max_retries", self.config.max_retries),
            **getattr(self, "litellm_params", {}),
            **kwargs,
        }
        if response_model:
            params["response_model"] = response_model

        response = await self.client(**params)
        return response
