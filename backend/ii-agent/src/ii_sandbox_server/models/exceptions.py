"""Custom exceptions for sandbox operations."""

from typing import Optional


class SandboxException(Exception):
    """Base exception for sandbox operations."""

    def __init__(self, message: str, sandbox_id: Optional[str] = None):
        self.message = message
        self.sandbox_id = sandbox_id
        super().__init__(self.message)


class SandboxAuthenticationError(SandboxException):
    """Raised when a sandbox authentication fails."""

    def __init__(self, reason: str):
        super().__init__(f"Sandbox authentication failed: {reason}")


class SandboxTimeoutException(SandboxException):
    """Raised when a sandbox operation times out."""

    def __init__(self, sandbox_id: str, operation: str):
        super().__init__(
            f"Sandbox {sandbox_id} timed out during {operation}", sandbox_id
        )


class SandboxNotFoundException(SandboxException):
    """Raised when a sandbox is not found."""

    def __init__(self, sandbox_id: str):
        super().__init__(f"Sandbox {sandbox_id} not found", sandbox_id)


class SandboxNotInitializedError(SandboxException):
    """Raised when a sandbox is not initialized."""

    def __init__(self, message: str):
        super().__init__(message)


class SandboxGeneralException(SandboxException):
    """Raised when a general sandbox exception occurs."""

    def __init__(self, message: str):
        super().__init__(message)
