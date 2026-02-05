from dataclasses import dataclass
from typing import Optional

from ii_agent.llm.base import ToolParam


@dataclass
class AgentConfig:
    """Configuration for agents."""
    max_tokens_per_turn: int = 16384
    system_prompt: Optional[str] = None
    temperature: float = 0.0
    timeout: Optional[int] = None
    presence_penalty: float = 0.0
    stop_sequence: Optional[list[str]] = None
    top_p: float = 0.95
    tools: Optional[list[ToolParam]] = None