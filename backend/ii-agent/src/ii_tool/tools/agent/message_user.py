"""Tool for communicating with the end user."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Iterable, List

from ii_tool.tools.base import BaseTool, ToolResult


_ALLOWED_MESSAGE_TYPES = {"info", "ask", "result"}


class MessageUserTool(BaseTool):
    name = "message_user"
    display_name = "Message User"
    description = (
        "Send a message to the user with optional file attachments."
    )
    input_schema = {
        "type": "object",
        "properties": {
            "message": {
                "type": "string",
                "description": "Short message to send to the user.",
            },
            "type": {
                "type": "string",
                "enum": sorted(_ALLOWED_MESSAGE_TYPES),
                "description": (
                    "Message category. Use 'info' for progress updates, 'ask' to "
                    "request input, and 'result' for final deliverables."
                ),
                "default": "info",
            },
            "attachments": {
                "type": "array",
                "items": {"type": "string"},
                "description": (
                    "List of file paths to deliver with the message. This must in absolute path."
                    "Directories must be archived before attaching."
                ),
                "default": [],
            },
        },
        "required": ["message"],
        "additionalProperties": False,
    }
    read_only = True

    async def execute(self, tool_input: dict[str, Any]) -> ToolResult:
        message_text = tool_input.get("message", "")
        if not isinstance(message_text, str):
            return self._error_result("`message` must be a string.")

        raw_type = tool_input.get("type", "info")
        if not isinstance(raw_type, str):
            return self._error_result("`type` must be a string.")
        message_type = raw_type.lower().strip()
        if message_type == "":
            message_type = "info"
        if message_type not in _ALLOWED_MESSAGE_TYPES:
            allowed = ", ".join(sorted(_ALLOWED_MESSAGE_TYPES))
            return self._error_result(
                f"Invalid message `type` '{raw_type}'. Expected one of: {allowed}."
            )

        attachments_input = tool_input.get("attachments", [])
        if attachments_input is None:
            attachments_input = []
        if not isinstance(attachments_input, list):
            return self._error_result("`attachments` must be an array of file paths.")

        try:
            attachments = self._normalize_attachments(attachments_input)
        except ValueError as exc:
            return self._error_result(str(exc))

        payload = {
            "tool_name": "message",
            "action": {
                "type": message_type,
                "text": message_text,
                "attachments": attachments,
            },
        }

        payload_json = json.dumps(payload)

        return ToolResult(
            llm_content=payload_json,
            user_display_content=payload,
            is_error=False,
        )

    async def execute_mcp_wrapper(
        self,
        message: str,
        message_type: str = "info",
        attachments: List[str] | None = None,
    ):
        return await self._mcp_wrapper(
            tool_input={
                "message": message,
                "type": message_type,
                "attachments": attachments or [],
            }
        )

    def _normalize_attachments(self, attachments: Iterable[Any]) -> list[str]:
        normalized: list[str] = []
        for raw_path in attachments:
            if not isinstance(raw_path, str):
                raise ValueError("All attachment paths must be strings.")

            expanded = Path(raw_path).expanduser()
            if not expanded.is_absolute():
                expanded = (Path.cwd() / expanded).resolve()
            else:
                expanded = expanded.resolve()

            normalized.append(str(expanded))
        return normalized

    def _error_result(self, message: str) -> ToolResult:
        return ToolResult(
            llm_content=message,
            user_display_content=message,
            is_error=True,
        )

    def is_read_only(self) -> bool:  # Compat helper for AgentToolManager
        return bool(self.read_only)
