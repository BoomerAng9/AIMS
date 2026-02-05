"""Event hooks system for processing events before propagation."""

from abc import ABC, abstractmethod
from typing import Optional
from ii_agent.core.event import RealtimeEvent


class EventHook(ABC):
    """Abstract base class for event hooks that can modify events before propagation."""

    @abstractmethod
    async def process_event(self, event: RealtimeEvent) -> Optional[RealtimeEvent]:
        """
        Process an event before it's propagated to subscribers.

        Args:
            event: The original event

        Returns:
            Modified event or None to filter out the event entirely
        """
        pass

    @abstractmethod
    def should_process(self, event: RealtimeEvent) -> bool:
        """
        Determine if this hook should process the given event.

        Args:
            event: The event to check

        Returns:
            True if this hook should process the event, False otherwise
        """
        pass


class EventHookRegistry:
    """Registry for managing event hooks."""

    def __init__(self):
        self._hooks: list[EventHook] = []

    def register_hook(self, hook: EventHook) -> None:
        """Register an event hook."""
        self._hooks.append(hook)

    def unregister_hook(self, hook: EventHook) -> None:
        """Unregister an event hook."""
        if hook in self._hooks:
            self._hooks.remove(hook)

    async def process_event(self, event: RealtimeEvent) -> Optional[RealtimeEvent]:
        """
        Process an event through all registered hooks.

        Args:
            event: The original event

        Returns:
            Processed event or None if filtered out
        """
        current_event = event

        for hook in self._hooks:
            if hook.should_process(current_event):
                processed_event = await hook.process_event(current_event)
                if processed_event is None:
                    # Hook filtered out the event
                    return None
                current_event = processed_event

        return current_event

    def clear_hooks(self) -> None:
        """Remove all registered hooks."""
        self._hooks.clear()
