"""Data models for LLM metrics tracking."""

from typing import Dict, Optional
from datetime import datetime, timezone
from pydantic import BaseModel, Field, model_validator, ConfigDict

from ii_tool.tools.media.image_generate import ImageGenerateTool
from ii_tool.tools.media.video_generate import VideoGenerateTool


class TokenUsage(BaseModel):
    """Token usage statistics for an LLM call."""

    model_config = ConfigDict(extra="allow")

    prompt_tokens: int = Field(default=0, description="Number of tokens in the prompt")
    completion_tokens: int = Field(
        default=0, description="Number of tokens in the completion"
    )
    cache_read_tokens: int = Field(
        default=0, description="Number of tokens read from cache"
    )
    cache_write_tokens: int = Field(
        default=0, description="Number of tokens written to cache"
    )

    # Additional response metadata
    model_name: Optional[str] = Field(
        default=None, description="Name of the model used"
    )
    response_time_ms: Optional[float] = Field(
        default=None, description="Response time in milliseconds"
    )

    total_tokens: Optional[int] = Field(
        default=None, description="Total tokens used (prompt + completion)"
    )

    input_token_details: Optional[Dict] = Field(default=None)

    output_token_details: Optional[Dict] = Field(default=None)

    @model_validator(mode='after')
    def calculate_total_tokens(self) -> 'TokenUsage':
        """Calculate total_tokens if not provided."""
        if self.total_tokens is None:
            self.total_tokens = self.prompt_tokens + self.completion_tokens
        return self

    @classmethod
    def from_raw_metrics(
        cls, raw_metrics: dict, model_name: Optional[str] = None
    ) -> "TokenUsage":
        return cls(
            prompt_tokens=raw_metrics.get("input_tokens", 0),
            completion_tokens=raw_metrics.get("output_tokens", 0),
            cache_read_tokens=raw_metrics.get("cache_read_input_tokens", 0),
            cache_write_tokens=raw_metrics.get("cache_creation_input_tokens", 0),
            model_name=model_name or raw_metrics.get("model_name"),
            response_time_ms=raw_metrics.get("response_time_ms"),
        )


class LLMMetrics(BaseModel):
    """Complete metrics for an LLM call."""

    token_usage: TokenUsage
    credits: Optional[float] = Field(default=None, description="Credits used")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    session_id: Optional[str] = None
    request_id: Optional[str] = None

    def calculate_credits(self, pricing: Optional["ModelPricing"] = None) -> float:
        """Calculate the credits based on token usage and model pricing."""
        if pricing is None:
            pricing = ModelPricing.get_default_pricing(
                self.token_usage.model_name or "unknown"
            )

        # Calculate cost per 1M tokens
        prompt_cost = (
            (self.token_usage.prompt_tokens - self.token_usage.cache_read_tokens)
            / 1_000_000
        ) * pricing.input_price_per_million
        completion_cost = (
            self.token_usage.completion_tokens / 1_000_000
        ) * pricing.output_price_per_million
        cache_write_cost = (
            self.token_usage.cache_write_tokens / 1_000_000
        ) * pricing.cache_write_price_per_million
        cache_read_cost = (
            self.token_usage.cache_read_tokens / 1_000_000
        ) * pricing.cache_read_price_per_million

        total_credits = (
            prompt_cost + completion_cost + cache_write_cost + cache_read_cost
        )
        # Convert cost to credits (1 credit = $0.001)
        self.credits = total_credits
        return total_credits


class ModelPricing(BaseModel):
    """Pricing information for different LLM models."""

    model_name: str
    input_price_per_million: float = Field(
        description="Price per million input tokens in USD"
    )
    output_price_per_million: float = Field(
        description="Price per million output tokens in USD"
    )
    cache_write_price_per_million: float = Field(
        default=0, description="Price per million cache write tokens"
    )
    cache_read_price_per_million: float = Field(
        default=0, description="Price per million cache read tokens"
    )

    @classmethod
    def get_default_pricing(cls, model_name: str) -> "ModelPricing":
        """Get default pricing for common models."""
        # Pricing for system-provided models only
        pricing_map = {
            # Claude 4 models
            "claude-4-5-sonnet": ModelPricing(
                model_name="claude-4-5-sonnet",
                input_price_per_million=300,
                output_price_per_million=1500,
                cache_write_price_per_million=600,
                cache_read_price_per_million=30,
            ),
            "claude-4-sonnet": ModelPricing(
                model_name="claude-4-sonnet",
                input_price_per_million=300,
                output_price_per_million=1500,
                cache_write_price_per_million=600,
                cache_read_price_per_million=30,
            ),
            "claude-4-opus": ModelPricing(
                model_name="claude-4-opus",
                input_price_per_million=1500,
                output_price_per_million=7500,
                cache_write_price_per_million=3000,
                cache_read_price_per_million=150,
            ),
            # OpenAI GPT-5
            "gpt-5": ModelPricing(
                model_name="gpt-5",
                input_price_per_million=125,
                output_price_per_million=1000,
                cache_read_price_per_million=12.5,
            ),
            "gpt-5-codex": ModelPricing(
                model_name="gpt-5-codex",
                input_price_per_million=125,
                output_price_per_million=1000,
                cache_read_price_per_million=12.5,
            ),
            # Google Gemini 2.5 Pro
            "gemini-2.5-pro": ModelPricing(
                model_name="gemini-2.5-pro",
                input_price_per_million=125,
                output_price_per_million=1000,
            ),
            "gemini-2.5-flash": ModelPricing(
                model_name="gemini-2.5-flash",
                input_price_per_million=30,
                output_price_per_million=250,
            ),
            # Deepseek Reasoner R1
            "r1": ModelPricing(
                model_name="r1",
                input_price_per_million=28,
                cache_read_price_per_million=2.8,
                output_price_per_million=42,
            ),
        }

        # Try to find exact match first
        if model_name in pricing_map:
            return pricing_map[model_name]

        # Try to find partial match (e.g., "claude-3-opus-20240229" matches "claude-3-opus")
        for key, pricing in pricing_map.items():
            if model_name.startswith(key):
                return pricing

        # Default pricing if model not found
        return ModelPricing(
            model_name=model_name,
            input_price_per_million=125,
            output_price_per_million=1000,
            cache_read_price_per_million=12.5,
        )


class ToolUsage(BaseModel):
    """Tool usage statistics for tracking tool execution costs."""

    tool_name: str = Field(description="Name of the tool that was executed")
    credits: float = Field(description="Credits charged for tool usage")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    session_id: Optional[str] = None
    tool_input: Optional[dict] = Field(
        default=None, description="Input parameters passed to the tool"
    )
    is_error: bool | None = Field(
        default=False, description="Whether the tool execution resulted in an error"
    )

    @classmethod
    def from_tool_result(
        cls,
        tool_name: str,
        tool_input: dict,
        is_error: bool | None,
        session_id: Optional[str] = None,
    ) -> "ToolUsage":
        """Create ToolUsage from tool result data."""
        credits = cls._calculate_tool_credits(tool_name, tool_input, is_error)

        return cls(
            tool_name=tool_name,
            credits=credits,
            tool_input=tool_input,
            is_error=is_error,
            session_id=session_id,
        )

    @staticmethod
    def _calculate_tool_credits(
        tool_name: str, tool_input: dict, is_error: bool | None
    ) -> float:
        """Calculate credits based on tool type and usage parameters."""
        # Don't charge credits for failed tool executions
        if is_error:
            return 0.0

        # Define credit costs for different tools
        tool_pricing = {
            ImageGenerateTool.name: 4.0,  # 4 credits per image generation
            VideoGenerateTool.name: 50.0,  # 50 credits per video generation
        }

        base_credits = tool_pricing.get(tool_name, 0.0)

        # For video generation, adjust credits based on duration
        if tool_name == "generate_video" and "duration_seconds" in tool_input:
            duration = tool_input["duration_seconds"]
            # Scale credits based on duration (base is for 5 seconds)
            base_duration = 1
            credits_multiplier = duration / base_duration
            return base_credits * credits_multiplier

        return base_credits
