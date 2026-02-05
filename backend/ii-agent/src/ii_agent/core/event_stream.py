import asyncio
import logging
from abc import ABC, abstractmethod
from typing import Set
from threading import Lock

from ii_agent.core.event import RealtimeEvent
from ii_agent.core.event_hooks import EventHookRegistry
from ii_agent.subscribers.subscriber import EventSubscriber


class EventStream(ABC):
    """Abstract base class for event streaming."""

    @abstractmethod
    async def publish(self, event: RealtimeEvent) -> None:
        """Add an event to the stream."""
        pass

    @abstractmethod
    def subscribe(self, subscriber: EventSubscriber) -> None:
        """Subscribe to events in the stream."""
        pass

    @abstractmethod
    def unsubscribe(self, subscriber: EventSubscriber) -> None:
        """Unsubscribe from events in the stream."""
        pass


class AsyncEventStream(EventStream):
    """Async implementation of EventStream that manages event subscribers."""

    def __init__(self, logger: logging.Logger | None = None):
        # TODO: using event name instead of class instance for subscriber management. can cause duplication
        self._subscribers: Set[EventSubscriber] = set()
        self._lock = Lock()
        self._logger = logger or logging.getLogger(__name__)
        self._hook_registry = EventHookRegistry()

    async def publish(self, event: RealtimeEvent) -> None:
        """Add an event to the stream and notify all subscribers."""
        # Process event through hooks first
        try:
            processed_event = await self._hook_registry.process_event(event)
        except Exception as e:
            self._logger.error(f"Error processing event hooks: {e}")
            processed_event = event  # Fall back to original event

        # If event was filtered out by hooks, don't propagate
        if processed_event is None:
            return

        with self._lock:
            subscribers = self._subscribers.copy()

        # Notify all subscribers
        for subscriber in subscribers:
            try:
                # Call the handle_event method on the subscriber
                asyncio.create_task(subscriber.handle_event(processed_event))
            except Exception as e:
                self._logger.error(
                    f"Error in event subscriber {type(subscriber).__name__}: {e}"
                )

    def subscribe(self, subscriber: EventSubscriber) -> None:
        """Subscribe to events in the stream."""
        with self._lock:
            self._subscribers.add(subscriber)

    def unsubscribe(self, subscriber: EventSubscriber) -> None:
        """Unsubscribe from events in the stream."""
        with self._lock:
            self._subscribers.discard(subscriber)

    def clear_subscribers(self) -> None:
        """Remove all subscribers."""
        with self._lock:
            self._subscribers.clear()

    def get_subscribers(self) -> Set[EventSubscriber]:
        """Get a copy of all current subscribers."""
        with self._lock:
            return self._subscribers.copy()

    def get_subscriber_count(self) -> int:
        """Get the number of active subscribers."""
        with self._lock:
            return len(self._subscribers)

    def has_subscriber(self, subscriber: EventSubscriber) -> bool:
        """Check if a specific subscriber is registered."""
        with self._lock:
            return subscriber in self._subscribers

    def register_hook(self, hook) -> None:
        """Register an event hook."""
        self._hook_registry.register_hook(hook)

    def unregister_hook(self, hook) -> None:
        """Unregister an event hook."""
        self._hook_registry.unregister_hook(hook)

    def clear_hooks(self) -> None:
        """Remove all registered hooks."""
        self._hook_registry.clear_hooks()
