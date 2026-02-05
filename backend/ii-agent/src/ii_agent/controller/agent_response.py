"""Agent response model that includes both content and metrics."""

from typing import Optional, Dict, Any
from pydantic import BaseModel
from ii_agent.llm.base import AssistantContentBlock
from ii_agent.metrics.models import TokenUsage


class AgentResponse(BaseModel):
    """Response from an agent containing both content and metrics.

    This class encapsulates the full response from an LLM agent, including:
    - The actual content blocks (text, tool calls, etc.)
    - Structured metrics about token usage and performance
    """

    content: list[AssistantContentBlock]
    """The actual response content from the agent."""

    metrics: Optional[TokenUsage] = None
    """Structured metadata about the response including token counts, timing, etc."""

    @property
    def has_metrics(self) -> bool:
        """Check if this response contains metrics data."""
        return self.metrics is not None

    @classmethod
    def from_content_and_raw_metrics(
        cls,
        content: list[AssistantContentBlock],
        raw_metrics: Optional[Dict[str, Any]],
        model_name: Optional[str] = None,
    ) -> "AgentResponse":
        """Create AgentResponse from content and raw metrics dict.

        Args:
            content: The response content blocks
            raw_metrics: Raw metrics dictionary from LLM API
            model_name: Optional model name

        Returns:
            AgentResponse with structured metrics
        """
        structured_metrics = None
        if raw_metrics:
            structured_metrics = TokenUsage.from_raw_metrics(raw_metrics, model_name)

        return cls(content=content, metrics=structured_metrics)
