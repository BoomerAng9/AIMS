"""Custom exceptions for web search."""


class WebSearchError(Exception):
    """Base exception for web search errors."""
    pass

class WebSearchExhaustedError(WebSearchError):
    """Raised when search service is exhausted (Rate limit, quota, bad request)."""
    pass

class WebSearchProviderError(WebSearchError):
    """Raised when search service has server/network issues - can retry."""
    pass

class WebSearchNetworkError(WebSearchError):
    """Raised when there are network/connection issues - temporary."""
    pass