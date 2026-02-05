"""Cache control validation for Anthropic API."""

from typing import Optional, List, Dict, Any, Literal
from dataclasses import dataclass


@dataclass
class AnthropicCacheControl:
    """Anthropic cache control configuration.

    Attributes:
        type: Must be 'ephemeral' for Anthropic's prompt caching
        ttl: Optional time-to-live, either '5m' or '1h' (if supported)
    """

    type: Literal["ephemeral"] = "ephemeral"
    ttl: Optional[Literal["5m", "1h"]] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to Anthropic API format."""
        result = {"type": self.type}
        if self.ttl:
            result["ttl"] = self.ttl
        return result


@dataclass
class CacheControlWarning:
    """Warning about cache control usage.

    Attributes:
        type: Warning type ('unsupported-setting' or 'other')
        setting: The setting that caused the warning (e.g., 'cacheControl')
        details: Human-readable details about the warning
    """

    type: Literal["unsupported-setting", "other"]
    setting: Optional[str] = None
    details: Optional[str] = None


class CacheControlValidator:
    """Validates cache control usage according to Anthropic's limits.

    Anthropic allows a maximum of 4 cache breakpoints per request.
    This class tracks breakpoints and generates warnings when limits are exceeded.
    """

    # Anthropic's maximum cache breakpoints per request
    MAX_CACHE_BREAKPOINTS = 4

    def __init__(self):
        """Initialize the validator."""
        self._breakpoint_count = 0
        self._warnings: List[CacheControlWarning] = []

    def get_cache_control(
        self,
        cache_control: Optional[AnthropicCacheControl],
        context: Dict[str, Any],
    ) -> Optional[Dict[str, Any]]:
        """Get cache control for a content block if valid.

        Args:
            cache_control: The cache control configuration to validate
            context: Context about where cache control is being applied
                     - type: str - Description of the content type
                     - can_cache: bool - Whether this content type supports caching

        Returns:
            Cache control dict for API, or None if invalid/rejected
        """
        if cache_control is None:
            return None

        # Validate that cache_control is allowed in this context
        if not context.get("can_cache", False):
            self._warnings.append(
                CacheControlWarning(
                    type="unsupported-setting",
                    setting="cacheControl",
                    details=f"cache_control cannot be set on {context['type']}. It will be ignored.",
                )
            )
            return None

        # Validate cache breakpoint limit
        self._breakpoint_count += 1
        if self._breakpoint_count > self.MAX_CACHE_BREAKPOINTS:
            self._warnings.append(
                CacheControlWarning(
                    type="unsupported-setting",
                    setting="cacheControl",
                    details=f"Maximum {self.MAX_CACHE_BREAKPOINTS} cache breakpoints exceeded "
                    f"(found {self._breakpoint_count}). This breakpoint will be ignored.",
                )
            )
            return None

        return cache_control.to_dict()

    def get_warnings(self) -> List[CacheControlWarning]:
        """Get all collected warnings.

        Returns:
            List of warnings generated during validation
        """
        return self._warnings.copy()

    def reset(self):
        """Reset the validator state for a new request."""
        self._breakpoint_count = 0
        self._warnings.clear()
