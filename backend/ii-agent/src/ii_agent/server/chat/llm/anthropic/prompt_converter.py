"""Convert messages to Anthropic format."""

import logging
import json
from typing import List, Dict, Any, Tuple, Optional

from pydantic import BaseModel

from ii_agent.server.chat.models import (
    BinaryContent,
    ImageURLContent,
    Message,
    MessageRole,
    ReasoningContent,
    TextContent,
    TextResultContent,
    JsonResultContent,
    ExecutionDeniedContent,
    ErrorTextContent,
    ErrorJsonContent,
    ArrayResultContent,
    TextContentPart,
    ImageDataContentPart,
    FileDataContentPart,
    ToolCall,
    ToolResult,
)
from .cache_control import CacheControlValidator, AnthropicCacheControl

logger = logging.getLogger(__name__)


class MessageBlock(BaseModel):
    """Base class for message blocks."""

    type: str
    messages: List[Message]


class SystemBlock(MessageBlock):
    """System message block."""

    type: str = "system"


class UserBlock(MessageBlock):
    """User and tool message block (combined)."""

    type: str = "user"


class AssistantBlock(MessageBlock):
    """Assistant message block."""

    type: str = "assistant"


def group_into_blocks(messages: List[Message]) -> List[MessageBlock]:
    """
    Group messages into blocks

    Tool messages are grouped with user messages into UserBlock.
    This matches the Anthropic API requirement that tool results
    must be sent as user messages.
    """
    blocks: List[MessageBlock] = []
    current_block: MessageBlock | None = None

    for message in messages:
        role = message.role

        if role == MessageRole.SYSTEM:
            if current_block is None or current_block.type != "system":
                current_block = SystemBlock(type="system", messages=[])
                blocks.append(current_block)
            current_block.messages.append(message)

        elif role == MessageRole.ASSISTANT:
            if current_block is None or current_block.type != "assistant":
                current_block = AssistantBlock(type="assistant", messages=[])
                blocks.append(current_block)
            current_block.messages.append(message)

        elif role == MessageRole.USER:
            if current_block is None or current_block.type != "user":
                current_block = UserBlock(type="user", messages=[])
                blocks.append(current_block)
            current_block.messages.append(message)

        elif role == MessageRole.TOOL:
            # Tool messages group with user messages
            if current_block is None or current_block.type != "user":
                current_block = UserBlock(type="user", messages=[])
                blocks.append(current_block)
            current_block.messages.append(message)

    return blocks


def convert_tool_result_content(result) -> Tuple[Any, bool]:
    """
    Convert tool result to Anthropic format

    Returns:
        Tuple of (content_value, is_error)
    """
    output = result.output
    is_error = False

    # Handle different output types
    if isinstance(output, ArrayResultContent):
        # Map content parts to Anthropic format
        content_parts = []
        for item in output.value:
            if isinstance(item, TextContentPart):
                content_parts.append({"type": "text", "text": item.text})
            elif isinstance(item, ImageDataContentPart):
                content_parts.append(
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": item.media_type,
                            "data": item.data,
                        },
                    }
                )
            elif isinstance(item, FileDataContentPart):
                if item.mime_type == "application/pdf":
                    content_parts.append(
                        {
                            "type": "document",
                            "source": {
                                "type": "base64",
                                "media_type": item.mime_type,
                                "data": item.data,
                            },
                        }
                    )
                else:
                    logger.warning(
                        f"Unsupported file media type in tool result: {item.mime_type}"
                    )
            else:
                logger.warning(f"Unsupported tool content part type: {item.type}")
        return content_parts if content_parts else "No content", is_error

    elif isinstance(output, TextResultContent):
        return output.value, False

    elif isinstance(output, ErrorTextContent):
        return output.value, True

    elif isinstance(output, ExecutionDeniedContent):
        return output.reason or "Tool execution denied.", False

    elif isinstance(output, JsonResultContent):
        return json.dumps(output.value), False

    elif isinstance(output, ErrorJsonContent):
        return json.dumps(output.value), True

    else:
        # Fallback for unknown types
        logger.warning(f"Unknown tool result output type: {type(output)}")
        return str(output), False


def convert_to_anthropic_messages(
    messages: List[Message],
    system_prompt: str,
    enable_caching: bool = True,
    provider_files: Optional[List[Any]] = None,
) -> Tuple[str, List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Convert messages to Anthropic format with cache control.

    Args:
        messages: List of messages to convert
        system_prompt: System prompt text
        enable_caching: Whether to enable cache control (default: True)
        provider_files: Optional list of FileResponseObject with provider file IDs

    Returns:
        Tuple of (system_prompt, anthropic_messages, warnings)
    """
    # Build file ID mapping (internal UUID -> provider file ID)
    file_id_map = {}
    if provider_files:
        file_id_map = {pf.id: pf.provider_file_id for pf in provider_files}

    # Create validator for this request
    validator = CacheControlValidator() if enable_caching else None
    cache_control_config = AnthropicCacheControl(type="ephemeral")

    blocks = group_into_blocks(messages)
    anthropic_messages = []
    final_system_prompt = system_prompt

    # Track which blocks to add cache control to (last 4 blocks)
    blocks_to_cache = set(range(max(0, len(blocks) - 4), len(blocks)))

    for block_idx, block in enumerate(blocks):
        should_cache_block = block_idx in blocks_to_cache and enable_caching

        match block.type:
            case "system":
                for msg in block.messages:
                    text_part = msg.content()
                    if text_part:
                        final_system_prompt = text_part.text

            case "user":
                # combines all user and tool messages in this block into a single message:
                anthropic_content = []

                for msg_idx, msg in enumerate(block.messages):
                    match msg.role:
                        case MessageRole.USER:
                            # Track file_id index for mapping BinaryContent to file_ids
                            file_id_index = 0
                            msg_file_ids = msg.file_ids or []
                            processed_file_ids = set()

                            for i, part in enumerate(msg.parts):
                                # cache control: first add cache control from part.
                                # for the last part of a message,
                                # check also if the message has cache control.
                                is_last_part = i == len(msg.parts) - 1
                                match part:
                                    case TextContent():
                                        text_block = {"type": "text", "text": part.text}

                                        if (
                                            should_cache_block
                                            and is_last_part
                                            and validator
                                        ):
                                            cache_ctrl = validator.get_cache_control(
                                                cache_control_config,
                                                {
                                                    "type": "user message text",
                                                    "can_cache": True,
                                                },
                                            )
                                            if cache_ctrl:
                                                text_block["cache_control"] = cache_ctrl
                                        anthropic_content.append(text_block)
                                    case BinaryContent():
                                        # Check if we can use file ID reference
                                        use_file_id = False
                                        provider_file_id = None

                                        if file_id_index < len(msg_file_ids):
                                            internal_file_id = msg_file_ids[
                                                file_id_index
                                            ]
                                            if internal_file_id in file_id_map:
                                                use_file_id = True
                                                provider_file_id = file_id_map[
                                                    internal_file_id
                                                ]
                                                processed_file_ids.add(internal_file_id)
                                            file_id_index += 1

                                        # Handle different file types according to Anthropic Files API
                                        if part.mime_type.startswith("image/"):
                                            # Images: JPEG, PNG, GIF, WebP -> image block
                                            if use_file_id:
                                                content_block = {
                                                    "type": "image",
                                                    "source": {
                                                        "type": "file",
                                                        "file_id": provider_file_id,
                                                    },
                                                }
                                            else:
                                                # Fall back to base64
                                                content_block = {
                                                    "type": "image",
                                                    "source": {
                                                        "type": "base64",
                                                        "media_type": part.mime_type,
                                                        "data": part.to_base64(
                                                            "anthropic"
                                                        ),
                                                    },
                                                }

                                            if (
                                                should_cache_block
                                                and is_last_part
                                                and validator
                                            ):
                                                cache_ctrl = validator.get_cache_control(
                                                    cache_control_config,
                                                    {
                                                        "type": "user message image",
                                                        "can_cache": True,
                                                    },
                                                )
                                                if cache_ctrl:
                                                    content_block["cache_control"] = (
                                                        cache_ctrl
                                                    )
                                            anthropic_content.append(content_block)

                                        elif part.mime_type in (
                                            "application/pdf",
                                            "text/plain",
                                        ):
                                            # PDFs and plain text -> document block
                                            if use_file_id:
                                                content_block = {
                                                    "type": "document",
                                                    "source": {
                                                        "type": "file",
                                                        "file_id": provider_file_id,
                                                    },
                                                }
                                            else:
                                                # Fall back to base64
                                                content_block = {
                                                    "type": "document",
                                                    "source": {
                                                        "type": "base64",
                                                        "media_type": part.mime_type,
                                                        "data": part.to_base64(
                                                            "anthropic"
                                                        ),
                                                    },
                                                }

                                            if (
                                                should_cache_block
                                                and is_last_part
                                                and validator
                                            ):
                                                cache_ctrl = validator.get_cache_control(
                                                    cache_control_config,
                                                    {
                                                        "type": "user message document",
                                                        "can_cache": True,
                                                    },
                                                )
                                                if cache_ctrl:
                                                    content_block["cache_control"] = (
                                                        cache_ctrl
                                                    )
                                            anthropic_content.append(content_block)

                                        else:
                                            # Datasets and other files -> container_upload block
                                            # (CSV, XLSX, JSON, XML, etc.)
                                            if use_file_id:
                                                content_block = {
                                                    "type": "container_upload",
                                                    "file_id": provider_file_id,
                                                }

                                                if (
                                                    should_cache_block
                                                    and is_last_part
                                                    and validator
                                                ):
                                                    cache_ctrl = validator.get_cache_control(
                                                        cache_control_config,
                                                        {
                                                            "type": "user message file",
                                                            "can_cache": True,
                                                        },
                                                    )
                                                    if cache_ctrl:
                                                        content_block[
                                                            "cache_control"
                                                        ] = cache_ctrl
                                                anthropic_content.append(content_block)
                                            else:
                                                # container_upload requires file ID, cannot fall back to base64
                                                logger.warning(
                                                    f"Cannot send file with mime_type {part.mime_type} "
                                                    f"without file ID - container_upload requires Files API"
                                                )

                                    case ImageURLContent():
                                        image_block = {
                                            "type": "image",
                                            "source": {"type": "url", "url": part.url},
                                        }
                                        if (
                                            should_cache_block
                                            and is_last_part
                                            and validator
                                        ):
                                            cache_ctrl = validator.get_cache_control(
                                                cache_control_config,
                                                {
                                                    "type": "user message image",
                                                    "can_cache": True,
                                                },
                                            )
                                            if cache_ctrl:
                                                image_block["cache_control"] = (
                                                    cache_ctrl
                                                )
                                        anthropic_content.append(image_block)

                            # Handle file_ids that don't have BinaryContent parts
                            # (when files are uploaded but not included as BinaryContent)
                            for internal_file_id in msg_file_ids:
                                if internal_file_id not in processed_file_ids:
                                    if internal_file_id in file_id_map:
                                        provider_file_id = file_id_map[internal_file_id]

                                        # Get file metadata from provider_files
                                        file_info = next(
                                            (
                                                pf
                                                for pf in (provider_files or [])
                                                if pf.id == internal_file_id
                                            ),
                                            None,
                                        )

                                        if file_info:
                                            content_type = file_info.content_type

                                            # Determine content block type based on MIME type
                                            if content_type.startswith("image/"):
                                                content_block = {
                                                    "type": "image",
                                                    "source": {
                                                        "type": "file",
                                                        "file_id": provider_file_id,
                                                    },
                                                }
                                            elif content_type in (
                                                "application/pdf",
                                                "text/plain",
                                            ):
                                                content_block = {
                                                    "type": "document",
                                                    "source": {
                                                        "type": "file",
                                                        "file_id": provider_file_id,
                                                    },
                                                }
                                            else:
                                                # Datasets and other files
                                                content_block = {
                                                    "type": "container_upload",
                                                    "file_id": provider_file_id,
                                                }

                                            anthropic_content.append(content_block)
                                            logger.debug(
                                                f"Added file content block from file_ids: {internal_file_id} -> {provider_file_id} ({content_type})"
                                            )

                            # tool results
                        case MessageRole.TOOL:
                            for i, part in enumerate(msg.parts):
                                is_last_part = i == len(msg.parts) - 1

                                # Handle provider-executed code_execution tool results
                                if part.name == "code_execution" and isinstance(
                                    part.output, JsonResultContent
                                ):
                                    output_value = part.output.value

                                    # Check if it's a valid code execution result
                                    if (
                                        isinstance(output_value, dict)
                                        and "type" in output_value
                                        and isinstance(output_value["type"], str)
                                    ):
                                        result_type = output_value["type"]

                                        # Code execution 20250522
                                        if result_type == "code_execution_result":
                                            code_exec_result = {
                                                "type": "code_execution_tool_result",
                                                "tool_use_id": part.tool_call_id,
                                                "content": {
                                                    "type": output_value["type"],
                                                    "stdout": output_value.get(
                                                        "stdout", ""
                                                    ),
                                                    "stderr": output_value.get(
                                                        "stderr", ""
                                                    ),
                                                    "return_code": output_value.get(
                                                        "return_code", 0
                                                    ),
                                                },
                                            }
                                            if (
                                                should_cache_block
                                                and is_last_part
                                                and validator
                                            ):
                                                cache_ctrl = (
                                                    validator.get_cache_control(
                                                        cache_control_config,
                                                        {
                                                            "type": "tool result",
                                                            "can_cache": True,
                                                        },
                                                    )
                                                )
                                                if cache_ctrl:
                                                    code_exec_result[
                                                        "cache_control"
                                                    ] = cache_ctrl
                                            anthropic_content.append(code_exec_result)

                                        # Code execution 20250825
                                        elif result_type in (
                                            "bash_code_execution_result",
                                            "bash_code_execution_tool_result_error",
                                        ):
                                            bash_result = {
                                                "type": "bash_code_execution_tool_result",
                                                "tool_use_id": part.tool_call_id,
                                                "content": output_value,
                                            }
                                            if (
                                                should_cache_block
                                                and is_last_part
                                                and validator
                                            ):
                                                cache_ctrl = (
                                                    validator.get_cache_control(
                                                        cache_control_config,
                                                        {
                                                            "type": "tool result",
                                                            "can_cache": True,
                                                        },
                                                    )
                                                )
                                                if cache_ctrl:
                                                    bash_result["cache_control"] = (
                                                        cache_ctrl
                                                    )
                                            anthropic_content.append(bash_result)

                                        elif result_type in (
                                            "text_editor_code_execution_result",
                                            "text_editor_code_execution_tool_result_error",
                                        ):
                                            text_editor_result = {
                                                "type": "text_editor_code_execution_tool_result",
                                                "tool_use_id": part.tool_call_id,
                                                "content": output_value,
                                            }
                                            if (
                                                should_cache_block
                                                and is_last_part
                                                and validator
                                            ):
                                                cache_ctrl = (
                                                    validator.get_cache_control(
                                                        cache_control_config,
                                                        {
                                                            "type": "tool result",
                                                            "can_cache": True,
                                                        },
                                                    )
                                                )
                                                if cache_ctrl:
                                                    text_editor_result[
                                                        "cache_control"
                                                    ] = cache_ctrl
                                            anthropic_content.append(text_editor_result)

                                        else:
                                            # Unknown code execution result type, fallback to normal handling
                                            content_value, is_error = (
                                                convert_tool_result_content(part)
                                            )
                                            tool_result_block = {
                                                "type": "tool_result",
                                                "tool_use_id": part.tool_call_id,
                                                "content": content_value,
                                                "is_error": is_error,
                                            }
                                            if (
                                                should_cache_block
                                                and is_last_part
                                                and validator
                                            ):
                                                cache_ctrl = (
                                                    validator.get_cache_control(
                                                        cache_control_config,
                                                        {
                                                            "type": "tool result",
                                                            "can_cache": True,
                                                        },
                                                    )
                                                )
                                                if cache_ctrl:
                                                    tool_result_block[
                                                        "cache_control"
                                                    ] = cache_ctrl
                                            anthropic_content.append(tool_result_block)
                                    else:
                                        # Invalid code execution result, fallback to normal handling
                                        content_value, is_error = (
                                            convert_tool_result_content(part)
                                        )
                                        tool_result_block = {
                                            "type": "tool_result",
                                            "tool_use_id": part.tool_call_id,
                                            "content": content_value,
                                            "is_error": is_error,
                                        }
                                        if (
                                            should_cache_block
                                            and is_last_part
                                            and validator
                                        ):
                                            cache_ctrl = validator.get_cache_control(
                                                cache_control_config,
                                                {
                                                    "type": "tool result",
                                                    "can_cache": True,
                                                },
                                            )
                                            if cache_ctrl:
                                                tool_result_block["cache_control"] = (
                                                    cache_ctrl
                                                )
                                        anthropic_content.append(tool_result_block)
                                else:
                                    # Normal tool result
                                    content_value, is_error = (
                                        convert_tool_result_content(part)
                                    )
                                    tool_result_block = {
                                        "type": "tool_result",
                                        "tool_use_id": part.tool_call_id,
                                        "content": content_value,
                                        "is_error": is_error,
                                    }

                                    if (
                                        should_cache_block
                                        and is_last_part
                                        and validator
                                    ):
                                        cache_ctrl = validator.get_cache_control(
                                            cache_control_config,
                                            {"type": "tool result", "can_cache": True},
                                        )
                                        if cache_ctrl:
                                            tool_result_block["cache_control"] = (
                                                cache_ctrl
                                            )

                                    anthropic_content.append(tool_result_block)
                        case _:
                            logger.warning(
                                f"Unknown message role in user block: {msg.role}"
                            )
                anthropic_messages.append(
                    {"role": "user", "content": anthropic_content}
                )
            case "assistant":
                # Validate tool calls/results within this assistant block.
                # Note: We only validate provider-executed tools (e.g., code_execution).
                # Client-executed tools are always preserved regardless of pairing.
                provider_tool_call_ids = set()
                tool_result_ids = set()

                for msg in block.messages:
                    for part in msg.parts:
                        if isinstance(part, ToolCall) and part.provider_executed:
                            provider_tool_call_ids.add(part.id)
                        elif isinstance(part, ToolResult):
                            tool_result_ids.add(part.tool_call_id)

                # Find unpaired items within this assistant block
                unpaired_calls = provider_tool_call_ids - tool_result_ids
                orphaned_results = tool_result_ids - provider_tool_call_ids

                if unpaired_calls:
                    logger.warning(
                        f"Found {len(unpaired_calls)} unpaired server tool calls in assistant block. "
                        f"These will be removed to prevent API errors. Tool call IDs: {unpaired_calls}"
                    )

                if orphaned_results:
                    logger.warning(
                        f"Found {len(orphaned_results)} orphaned tool results in assistant block. "
                        f"These will be removed to prevent API errors. Tool result IDs: {orphaned_results}"
                    )

                # Only process paired tool calls/results
                valid_provider_calls = provider_tool_call_ids - unpaired_calls
                valid_tool_result_ids = tool_result_ids - orphaned_results

                anthropic_content = []
                for msg_idx, msg in enumerate(block.messages):
                    for i, part in enumerate(msg.parts):
                        is_last_part = i == len(msg.parts) - 1
                        match part:
                            case ReasoningContent():
                                if not part.signature:
                                    continue  # skip invalid thinking block
                                thinking_block = {
                                    "type": "thinking",
                                    "thinking": part.thinking,
                                    "signature": part.signature,
                                }
                                # validate that thinking blocks cannot have cache_control
                                if should_cache_block and validator:
                                    validator.get_cache_control(
                                        cache_control_config,
                                        {"type": "thinking block", "can_cache": False},
                                    )
                                anthropic_content.append(thinking_block)
                            case TextContent():
                                text_block = {"type": "text", "text": part.text}

                                if should_cache_block and is_last_part and validator:
                                    cache_ctrl = validator.get_cache_control(
                                        cache_control_config,
                                        {
                                            "type": "assistant message text",
                                            "can_cache": True,
                                        },
                                    )
                                    if cache_ctrl:
                                        text_block["cache_control"] = cache_ctrl
                                anthropic_content.append(text_block)
                            case ToolCall():
                                # Skip unpaired provider-executed tools only
                                # (client-executed tools are always kept)
                                if (
                                    part.provider_executed
                                    and part.id not in valid_provider_calls
                                ):
                                    logger.debug(
                                        f"Skipping unpaired provider tool call: {part.id}"
                                    )
                                    continue

                                # Handle provider-executed tools (currently only code_execution)
                                if (
                                    part.provider_executed
                                    and part.name == "code_execution"
                                ):
                                    tool_input = (
                                        json.loads(part.input)
                                        if isinstance(part.input, str)
                                        else part.input
                                    )

                                    # Check if it's code_execution with subtools (20250825)
                                    if (
                                        isinstance(tool_input, dict)
                                        and "type" in tool_input
                                        and tool_input["type"]
                                        in (
                                            "bash_code_execution",
                                            "text_editor_code_execution",
                                        )
                                    ):
                                        server_tool_block = {
                                            "type": "server_tool_use",
                                            "id": part.id,
                                            "name": tool_input[
                                                "type"
                                            ],  # Use subtool name
                                            "input": tool_input,
                                        }
                                        if (
                                            should_cache_block
                                            and is_last_part
                                            and validator
                                        ):
                                            cache_ctrl = validator.get_cache_control(
                                                cache_control_config,
                                                {
                                                    "type": "assistant tool call",
                                                    "can_cache": True,
                                                },
                                            )
                                            if cache_ctrl:
                                                server_tool_block["cache_control"] = (
                                                    cache_ctrl
                                                )
                                        anthropic_content.append(server_tool_block)
                                    else:
                                        # Code execution 20250522
                                        server_tool_block = {
                                            "type": "server_tool_use",
                                            "id": part.id,
                                            "name": "code_execution",
                                            "input": tool_input,
                                        }
                                        if (
                                            should_cache_block
                                            and is_last_part
                                            and validator
                                        ):
                                            cache_ctrl = validator.get_cache_control(
                                                cache_control_config,
                                                {
                                                    "type": "assistant tool call",
                                                    "can_cache": True,
                                                },
                                            )
                                            if cache_ctrl:
                                                server_tool_block["cache_control"] = (
                                                    cache_ctrl
                                                )
                                        anthropic_content.append(server_tool_block)
                                else:
                                    # Normal tool use
                                    tool_use_block = {
                                        "type": "tool_use",
                                        "id": part.id,
                                        "name": part.name,
                                        "input": (
                                            json.loads(part.input)
                                            if isinstance(part.input, str)
                                            else part.input
                                        ),
                                    }

                                    if (
                                        should_cache_block
                                        and is_last_part
                                        and validator
                                    ):
                                        cache_ctrl = validator.get_cache_control(
                                            cache_control_config,
                                            {
                                                "type": "assistant tool call",
                                                "can_cache": True,
                                            },
                                        )
                                        if cache_ctrl:
                                            tool_use_block["cache_control"] = cache_ctrl
                                    anthropic_content.append(tool_use_block)
                            case ToolResult():
                                # Skip unpaired tool results
                                if part.tool_call_id not in valid_tool_result_ids:
                                    logger.debug(
                                        f"Skipping unpaired tool result for tool_call_id: {part.tool_call_id}"
                                    )
                                    continue

                                # Handle provider-executed tool results in assistant messages
                                if part.name == "code_execution" and isinstance(
                                    part.output, JsonResultContent
                                ):
                                    output_value = part.output.value

                                    # Check if it's a valid code execution result
                                    if (
                                        isinstance(output_value, dict)
                                        and "type" in output_value
                                        and isinstance(output_value["type"], str)
                                    ):
                                        result_type = output_value["type"]

                                        # Code execution 20250522
                                        if result_type == "code_execution_result":
                                            code_exec_result = {
                                                "type": "code_execution_tool_result",
                                                "tool_use_id": part.tool_call_id,
                                                "content": {
                                                    "type": output_value["type"],
                                                    "stdout": output_value.get(
                                                        "stdout", ""
                                                    ),
                                                    "stderr": output_value.get(
                                                        "stderr", ""
                                                    ),
                                                    "return_code": output_value.get(
                                                        "return_code", 0
                                                    ),
                                                },
                                            }
                                            if (
                                                should_cache_block
                                                and is_last_part
                                                and validator
                                            ):
                                                cache_ctrl = (
                                                    validator.get_cache_control(
                                                        cache_control_config,
                                                        {
                                                            "type": "tool result",
                                                            "can_cache": True,
                                                        },
                                                    )
                                                )
                                                if cache_ctrl:
                                                    code_exec_result[
                                                        "cache_control"
                                                    ] = cache_ctrl
                                            anthropic_content.append(code_exec_result)

                                        # Code execution 20250825
                                        elif result_type in (
                                            "bash_code_execution_result",
                                            "bash_code_execution_tool_result_error",
                                        ):
                                            bash_result = {
                                                "type": "bash_code_execution_tool_result",
                                                "tool_use_id": part.tool_call_id,
                                                "content": output_value,
                                            }
                                            if (
                                                should_cache_block
                                                and is_last_part
                                                and validator
                                            ):
                                                cache_ctrl = (
                                                    validator.get_cache_control(
                                                        cache_control_config,
                                                        {
                                                            "type": "tool result",
                                                            "can_cache": True,
                                                        },
                                                    )
                                                )
                                                if cache_ctrl:
                                                    bash_result["cache_control"] = (
                                                        cache_ctrl
                                                    )
                                            anthropic_content.append(bash_result)

                                        elif result_type in (
                                            "text_editor_code_execution_result",
                                            "text_editor_code_execution_tool_result_error",
                                            "text_editor_code_execution_create_result",
                                            "text_editor_code_execution_view_result",
                                            "text_editor_code_execution_str_replace_result",
                                        ):
                                            text_editor_result = {
                                                "type": "text_editor_code_execution_tool_result",
                                                "tool_use_id": part.tool_call_id,
                                                "content": output_value,
                                            }
                                            if (
                                                should_cache_block
                                                and is_last_part
                                                and validator
                                            ):
                                                cache_ctrl = (
                                                    validator.get_cache_control(
                                                        cache_control_config,
                                                        {
                                                            "type": "tool result",
                                                            "can_cache": True,
                                                        },
                                                    )
                                                )
                                                if cache_ctrl:
                                                    text_editor_result[
                                                        "cache_control"
                                                    ] = cache_ctrl
                                            anthropic_content.append(text_editor_result)

                                        else:
                                            # Unknown code execution result type
                                            logger.warning(
                                                f"Unknown code execution result type in assistant message: {result_type}"
                                            )
                                    else:
                                        # Invalid code execution result structure
                                        logger.warning(
                                            f"Invalid code execution result structure in assistant message for tool {part.name}"
                                        )
                                else:
                                    # Unsupported provider-executed tool result
                                    logger.warning(
                                        f"Provider-executed tool result for tool {part.name} in assistant message is not supported or has unsupported output type"
                                    )

                            case _:
                                logger.warning(
                                    f"Unknown message part in assistant block: {part.type}"
                                )

                anthropic_messages.append(
                    {"role": "assistant", "content": anthropic_content}
                )
    # Get warnings from validator
    warnings = []
    if validator:
        warnings = [
            {
                "type": w.type,
                "setting": w.setting,
                "details": w.details,
            }
            for w in validator.get_warnings()
        ]

    return final_system_prompt, anthropic_messages, warnings
