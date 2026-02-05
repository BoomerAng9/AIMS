"""Abstract sandbox interface to decouple ii_tool from ii_agent."""

from abc import ABC, abstractmethod


class SandboxInterface(ABC):
    """Abstract interface for sandbox operations needed by ii_tool."""

    @abstractmethod
    async def expose_port(self, port: int) -> str:
        """Expose a port in the sandbox and return the public URL."""
        pass