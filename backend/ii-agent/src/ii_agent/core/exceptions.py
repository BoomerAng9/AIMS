"""Shared exceptions module."""


class PermissionException(Exception):
    """Exception raised when a user does not have the necessary permissions to perform an action."""

    def __init__(
        self,
        message: str | None = "User does not have the right to perform this action",
    ) -> None:
        """Create a new PermissionException instance.

        Args:
        ----
            message (str, optional): The error message. Has default message.

        """
        self.message = message
        super().__init__(self.message)


class NotFoundException(Exception):
    """Exception raised when an object is not found."""

    def __init__(self, message: str | None = "Object not found") -> None:
        """Create a new NotFoundException instance.

        Args:
        ----
            message (str, optional): The error message. Has default message.

        """
        self.message = message
        super().__init__(self.message)
