import time
import random
import asyncio
import json
import logging
import base64
from typing import Any, Tuple, List, Dict, Optional
from google import genai
from google.genai import types, errors
from ii_agent.core.config.llm_config import LLMConfig
from ii_agent.llm.base import (
    LLMClient,
    AssistantContentBlock,
    ThinkingBlock,
    ToolParam,
    TextPrompt,
    ToolCall,
    TextResult,
    LLMMessages,
    ToolFormattedResult,
    ImageBlock,
)

logger = logging.getLogger(__name__)


class GeminiErrorHandler:
    """Handle Gemini-specific errors and validation."""

    @staticmethod
    def validate_function_args(args: Dict[str, Any]) -> Dict[str, Any]:
        """Validate and potentially fix function arguments.

        Args:
            args: Function arguments to validate

        Returns:
            Validated/fixed arguments
        """
        if not args:
            return {}

        # Handle case where args might be a string (malformed response)
        if isinstance(args, str):
            try:
                return json.loads(args)
            except (json.JSONDecodeError, ValueError):
                logger.warning(f"Invalid JSON string in function arguments: {args}")
                return {"raw_input": args}

        # For dict-like objects, ensure it's valid JSON
        try:
            # Ensure it's valid JSON by serializing and deserializing
            json_str = json.dumps(args)
            return json.loads(json_str)
        except (json.JSONDecodeError, TypeError) as e:
            logger.warning(f"Invalid function arguments, attempting to fix: {e}")
            return {}

    @staticmethod
    def sanitize_json_schema(schema: Dict[str, Any]) -> Dict[str, Any]:
        """Sanitize JSON schema to prevent malformed function calls.

        Args:
            schema: The input JSON schema

        Returns:
            Sanitized JSON schema
        """
        if not schema:
            return {"type": "object", "properties": {}}

        # Ensure basic structure
        if "type" not in schema:
            schema["type"] = "object"

        if schema["type"] == "object" and "properties" not in schema:
            schema["properties"] = {}

        # Remove any problematic characters or patterns that might cause issues
        # Deep copy to avoid modifying original
        sanitized = json.loads(json.dumps(schema))
        if "$schema" in sanitized:
            sanitized.pop("$schema")
        if "additionalProperties" in sanitized:
            sanitized.pop("additionalProperties")
        # Track property name changes for updating required array
        name_mapping = {}

        # Ensure all property names are valid identifiers
        if "properties" in sanitized:
            for prop_name in list(sanitized["properties"].keys()):
                # Replace any non-alphanumeric characters (except underscore) with underscore
                clean_name = "".join(
                    c if c.isalnum() or c == "_" else "_" for c in prop_name
                )
                if clean_name != prop_name:
                    sanitized["properties"][clean_name] = sanitized["properties"].pop(
                        prop_name
                    )
                    name_mapping[prop_name] = clean_name
                    logger.warning(
                        f"Renamed property '{prop_name}' to '{clean_name}' for Gemini compatibility"
                    )

        # Update the required array if property names were changed
        if "required" in sanitized and name_mapping:
            updated_required = []
            for req_field in sanitized["required"]:
                if req_field in name_mapping:
                    updated_required.append(name_mapping[req_field])
                else:
                    updated_required.append(req_field)
            sanitized["required"] = updated_required

        return sanitized


def generate_tool_call_id() -> str:
    """Generate a unique ID for a tool call.

    Returns:
        A unique string ID combining timestamp and random number.
    """
    timestamp = int(time.time() * 1000)  # Current time in milliseconds
    random_num = random.randint(1000, 9999)  # Random 4-digit number
    return f"call_{timestamp}_{random_num}"


class GeminiDirectClient(LLMClient):
    """Gemini client for direct API access with comprehensive message handling.

    This client provides both synchronous and asynchronous interfaces for
    interacting with Gemini models, supporting text, images, and function calling.
    """

    def __init__(self, llm_config: LLMConfig):
        """Initialize the Gemini client.

        Args:
            llm_config: LLM configuration containing model, API keys, etc.
        """
        super().__init__(llm_config)
        self.max_retries = llm_config.max_retries
        self._initialize_client(llm_config)
        self.temperature = llm_config.temperature

    def _initialize_client(self, llm_config: LLMConfig) -> None:
        """Initialize the Gemini client based on configuration.

        Args:
            llm_config: LLM configuration
        """
        # Prepare http_options if base_url is provided
        http_options = None
        if llm_config.base_url:
            http_options = types.HttpOptions(
                base_url=llm_config.base_url,
                api_version="v1beta",  # Default to v1beta, can be made configurable if needed
            )
            logger.info(f"Using custom base URL: {llm_config.base_url}")

        if llm_config.vertex_project_id and llm_config.vertex_region:
            self.client = genai.Client(
                vertexai=True,
                project=llm_config.vertex_project_id,
                location=llm_config.vertex_region,
                http_options=http_options,
            )
            print(
                f"====== Using Gemini through Vertex AI API with project_id: {llm_config.vertex_project_id} and region: {llm_config.vertex_region} ======"
            )
        else:
            self.client = genai.Client(
                api_key=(
                    llm_config.api_key.get_secret_value()
                    if llm_config.api_key
                    else None
                ),
                http_options=http_options,
            )
            print("====== Using Gemini directly ======")

    # ===== MESSAGE CONVERSION METHODS =====

    def _convert_messages_to_gemini(self, messages: LLMMessages) -> List[types.Content]:
        """Convert internal message format to Gemini format.

        Args:
            messages: List of message lists in internal format

        Returns:
            List of Gemini Content objects
        """
        gemini_messages = []

        for message_list in messages:
            message_content_list = []
            role = "model"  # Default role

            for message in message_list:
                message_content, message_role = self._convert_single_message(message)
                role = message_role

                # Handle both single parts and lists of parts
                if isinstance(message_content, list):
                    message_content_list.extend(message_content)
                else:
                    message_content_list.append(message_content)

            gemini_messages.append(types.Content(role=role, parts=message_content_list))

        return gemini_messages

    def _convert_single_message(self, message) -> Tuple[Any, str]:
        """Convert a single message to Gemini format.

        Args:
            message: Single message object

        Returns:
            Tuple of (message_content, role)
        """
        if isinstance(message, TextPrompt):
            return self._convert_text_prompt(message)
        elif isinstance(message, ImageBlock):
            return self._convert_image_block(message)
        elif isinstance(message, TextResult):
            return self._convert_text_result(message)
        elif isinstance(message, ToolCall):
            return self._convert_tool_call(message)
        elif isinstance(message, ToolFormattedResult):
            return self._convert_tool_result(message)
        elif isinstance(message, ThinkingBlock):
            return self._convert_thinking_block(message)
        else:
            raise ValueError(f"Unknown message type: {type(message)}")

    def _convert_text_prompt(self, message: TextPrompt) -> Tuple[types.Part, str]:
        """Convert TextPrompt to Gemini format."""
        return types.Part(text=message.text), "user"

    def _convert_thinking_block(self, message: ThinkingBlock) -> Tuple[types.Part, str]:
        """Convert ThinkingBlock to Gemini format."""
        message_content = types.Part(text=message.thinking)
        message_content.thought = True
        return message_content, "model"

    def _convert_image_block(self, message: ImageBlock) -> Tuple[types.Part, str]:
        """Convert ImageBlock to Gemini format."""
        return (
            types.Part.from_bytes(
                data=message.source["data"],
                mime_type=message.source["media_type"],
            ),
            "user",
        )

    def _convert_text_result(self, message: TextResult) -> Tuple[types.Part, str]:
        """Convert TextResult to Gemini format."""
        message_content = types.Part(text=message.text)
        # Preserve thought attributes if they exist, converting string to bytes for Gemini API
        if (
            hasattr(message, "thought_signature")
            and message.thought_signature is not None
        ):
            try:
                message_content.thought_signature = base64.b64decode(
                    message.thought_signature
                )
            except Exception:
                # If decoding fails, skip setting the attribute
                pass
        if hasattr(message, "thought"):
            message_content.thought = message.thought
        return message_content, "model"

    def _convert_tool_call(self, message: ToolCall) -> Tuple[types.Part, str]:
        """Convert ToolCall to Gemini format."""
        message_content = types.Part.from_function_call(
            name=message.tool_name,
            args=message.tool_input,
        )
        # Preserve thought attributes if they exist, converting string to bytes for Gemini API
        if (
            hasattr(message, "thought_signature")
            and message.thought_signature is not None
        ):
            try:
                message_content.thought_signature = base64.b64decode(
                    message.thought_signature
                )
            except Exception:
                # If decoding fails, skip setting the attribute
                pass
        return message_content, "model"

    def _convert_tool_result(self, message: ToolFormattedResult) -> Tuple[Any, str]:
        """Convert ToolFormattedResult to Gemini format."""
        if isinstance(message.tool_output, str):
            return (
                types.Part.from_function_response(
                    name=message.tool_name, response={"result": message.tool_output}
                ),
                "tool",
            )
        elif isinstance(message.tool_output, list):
            return self._convert_tool_result_list(message.tool_output)
        else:
            raise ValueError(f"Unknown tool output type: {type(message.tool_output)}")

    def _convert_tool_result_list(
        self, tool_output: List[Dict[str, Any]]
    ) -> Tuple[List[types.Part], str]:
        """Convert tool result list to Gemini format."""
        message_content = []
        role = "user"

        for item in tool_output:
            if item["type"] == "text":
                message_content.append(types.Part(text=item["text"]))
            elif item["type"] == "image":
                message_content.append(
                    types.Part.from_bytes(
                        data=item["source"]["data"],
                        mime_type=item["source"]["media_type"],
                    )
                )
            else:
                logger.warning(f"Unknown tool output item type: {item['type']}")

        return message_content, role

    # ===== TOOL PREPARATION METHODS =====

    def _prepare_tools(self, tools: List[ToolParam]) -> Optional[List[types.Tool]]:
        """Prepare tool declarations for Gemini.

        Args:
            tools: List of tool parameters

        Returns:
            List of Gemini Tool objects or None if no tools
        """
        if not tools:
            return None

        tool_declarations = []
        for tool in tools:
            # Validate and sanitize the input schema
            sanitized_schema = self._sanitize_json_schema(tool.input_schema)

            tool_declaration = {
                "name": tool.name,
                "description": tool.description,
                "parameters": sanitized_schema,
            }
            tool_declarations.append(tool_declaration)

        return [types.Tool(function_declarations=tool_declarations)]

    def _sanitize_json_schema(self, schema: Dict[str, Any]) -> Dict[str, Any]:
        """Sanitize JSON schema to prevent malformed function calls."""
        return GeminiErrorHandler.sanitize_json_schema(schema)

    def _determine_tool_mode(self, tool_choice: Optional[Dict[str, str]]) -> str:
        """Determine the tool calling mode for Gemini.

        Args:
            tool_choice: Tool choice configuration

        Returns:
            Tool mode string
        """
        if not tool_choice:
            return "AUTO"  # Default to AUTO mode

        choice_type = tool_choice.get("type", "auto")
        if choice_type == "any":
            return "ANY"
        elif choice_type == "auto":
            return "AUTO"
        elif choice_type == "none":
            return "NONE"
        else:
            logger.warning(
                f"Unknown tool_choice type for Gemini: {choice_type}, defaulting to AUTO"
            )
            return "AUTO"

    # ===== RESPONSE PARSING METHODS =====

    def _parse_response(self, response) -> List[AssistantContentBlock]:
        """Parse Gemini response into internal message format.

        Args:
            response: Gemini response object

        Returns:
            List of internal message objects
        """
        internal_messages = []

        for candidate in response.candidates:
            if candidate.content is None:
                error_message = self._handle_empty_candidate_content(candidate)
                if isinstance(error_message, TextPrompt) and error_message.should_retry:
                    internal_messages.append(TextResult(text="Made a function calling"))
                    internal_messages.append(error_message)
                continue

            if candidate.content.parts is None:
                # WARNING: content.parts is None
                continue
            for part in candidate.content.parts:
                message = self._parse_response_part(part)
                if message:
                    internal_messages.append(message)

        return internal_messages

    def _handle_empty_candidate_content(self, candidate) -> Optional[TextResult]:
        """Handle cases where candidate content is None.

        Args:
            candidate: Gemini candidate object

        Returns:
            Error message or None
        """
        if not hasattr(candidate, "finish_reason"):
            logger.warning("Candidate content is None without finish_reason")
            return None

        finish_reason = str(candidate.finish_reason)
        if "MALFORMED_FUNCTION_CALL" not in finish_reason:
            return None
        logger.warning(
            f"MALFORMED_FUNCTION_CALL received. Finish reason: {finish_reason}"
        )
        # Try to extract any partial function call information for debugging
        if hasattr(candidate, "grounding_metadata"):
            logger.debug(f"Grounding metadata: {candidate.grounding_metadata}")

        # Return a more helpful error message that instructs retry with proper format
        error_message = (
            "The function call format was invalid. Please ensure:\n"
            "1. All string parameters are properly escaped (especially quotes and backslashes)\n"
            "2. JSON structure is valid\n"
            "3. Required parameters are included\n"
            "4. Parameter types match the schema\n"
            "\nPlease retry with a properly formatted function call."
        )
        return TextPrompt(text=error_message, should_retry=True)

    def _parse_response_part(self, part) -> Optional[AssistantContentBlock]:
        """Parse a single response part.

        Args:
            part: Gemini response part

        Returns:
            Parsed message or None
        """
        if part.text:
            return self._parse_text_part(part)
        elif part.function_call:
            return self._parse_function_call_part(part)
        else:
            logger.debug(f"Skipping unknown part type: {type(part)}")
            return None

    def _parse_text_part(self, part) -> TextResult:
        """Parse text part from response.

        Args:
            part: Gemini response part with text

        Returns:
            TextResult message
        """
        message = TextResult(text=part.text)
        if hasattr(part, "thought_signature") and part.thought_signature is not None:
            try:
                # Convert bytes back to base64 string for internal storage
                message.thought_signature = base64.b64encode(
                    part.thought_signature
                ).decode("utf-8")
            except Exception:
                # If encoding fails, skip setting the attribute
                pass
        if hasattr(part, "thought"):
            message.thought = part.thought
        return message

    def _parse_function_call_part(self, part) -> AssistantContentBlock:
        """Parse function call part from response.

        Args:
            part: Gemini response part with function call

        Returns:
            ToolCall or TextResult with error message
        """
        try:
            function_call = part.function_call

            # Ensure we have a valid ID
            tool_call_id = (
                function_call.id
                if hasattr(function_call, "id") and function_call.id
                else generate_tool_call_id()
            )

            # Validate and potentially fix the arguments
            tool_input = (
                self._validate_function_args(function_call.args)
                if hasattr(function_call, "args")
                else {}
            )

            tool_call = ToolCall(
                tool_call_id=tool_call_id,
                tool_name=function_call.name,
                tool_input=tool_input,
            )

            if (
                hasattr(part, "thought_signature")
                and part.thought_signature is not None
            ):
                try:
                    # Convert bytes back to base64 string for internal storage
                    tool_call.thought_signature = base64.b64encode(
                        part.thought_signature
                    ).decode("utf-8")
                except Exception:
                    # If encoding fails, skip setting the attribute
                    pass

            return tool_call

        except Exception as e:
            logger.error(f"Error parsing function call: {e}")
            return TextPrompt(
                text=f"Failed to parse function call: {str(e)}. Please retry with valid JSON format.",
                should_retry=True,
            )

    def _validate_function_args(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Validate and potentially fix function arguments."""
        return GeminiErrorHandler.validate_function_args(args)

    # ===== CONFIGURATION AND REQUEST METHODS =====

    def _create_generate_config(
        self,
        tools: Optional[List[types.Tool]],
        system_prompt: Optional[str],
        max_tokens: int,
        temperature: float,
        tool_mode: str,
        response_validation: bool = True,
    ) -> types.GenerateContentConfig:
        """Create Gemini generation configuration.

        Args:
            tools: Prepared Gemini tools
            system_prompt: System instruction
            max_tokens: Maximum output tokens
            temperature: Sampling temperature
            tool_mode: Tool calling mode

        Returns:
            GenerateContentConfig object
        """
        config_dict = {
            "tools": tools,
            "system_instruction": system_prompt,
            "max_output_tokens": max_tokens,
            "temperature": self.temperature,
        }

        # Only add thinking config for models that support it
        config_dict["thinking_config"] = types.ThinkingConfig(
            thinking_budget=8192,
            include_thoughts=True,
        )

        # Note: response_validation is not a valid parameter for GenerateContentConfig
        # It would need to be handled at the chat/client level if needed

        config = types.GenerateContentConfig(**config_dict)

        if tools:
            # Enhanced tool configuration with allowed function names
            allowed_function_names = None
            if tool_mode == "ANY" and tools:
                # When ANY mode, specify allowed function names to prevent hallucinated functions
                allowed_function_names = [
                    decl.name
                    for tool in tools
                    for decl in (tool.function_declarations or [])
                ]

            function_calling_config_dict = {"mode": tool_mode}
            if allowed_function_names:
                function_calling_config_dict["allowed_function_names"] = (
                    allowed_function_names
                )

            config.tool_config = types.ToolConfig(
                function_calling_config=types.FunctionCallingConfig(
                    **function_calling_config_dict
                )
            )

        return config

    # ===== RETRY LOGIC METHODS =====

    async def _retry_with_backoff(self, func, *args, **kwargs):
        """Execute a function with exponential backoff retry logic.

        Args:
            func: Async function to execute
            *args: Positional arguments for func
            **kwargs: Keyword arguments for func

        Returns:
            Result from func
        """
        for retry in range(self.max_retries):
            try:
                return await func(*args, **kwargs)
            except errors.APIError as e:
                # 503: The service may be temporarily overloaded or down.
                # 429: The request was throttled.
                if e.code in [503, 429]:
                    if retry == self.max_retries - 1:
                        print(f"Failed Gemini request after {retry + 1} retries")
                        raise e
                    else:
                        print(f"Error: {e}")
                        print(
                            f"Retrying Gemini request: {retry + 1}/{self.max_retries}"
                        )
                        # Sleep 12-18 seconds with jitter to avoid thundering herd
                        await asyncio.sleep(15 * random.uniform(0.8, 1.2))
                else:
                    raise e

    def _retry_with_backoff_sync(self, func, *args, **kwargs):
        """Execute a function with exponential backoff retry logic (synchronous).

        Args:
            func: Function to execute
            *args: Positional arguments for func
            **kwargs: Keyword arguments for func

        Returns:
            Result from func
        """
        for retry in range(self.max_retries):
            try:
                return func(*args, **kwargs)
            except errors.APIError as e:
                # 503: The service may be temporarily overloaded or down.
                # 429: The request was throttled.
                if e.code in [503, 429]:
                    if retry == self.max_retries - 1:
                        print(f"Failed Gemini request after {retry + 1} retries")
                        raise e
                    else:
                        print(f"Error: {e}")
                        print(
                            f"Retrying Gemini request: {retry + 1}/{self.max_retries}"
                        )
                        # Sleep 12-18 seconds with jitter to avoid thundering herd
                        time.sleep(15 * random.uniform(0.8, 1.2))
                else:
                    raise e

    # ===== PUBLIC API METHODS =====

    def _prepare_generation_request(
        self, messages, max_tokens, system_prompt, temperature, tools, tool_choice
    ):
        """Prepare common generation request parameters.

        Returns:
            Tuple of (gemini_messages, config)
        """
        # Convert messages to Gemini format
        gemini_messages = self._convert_messages_to_gemini(messages)

        # Prepare tools
        tool_params = self._prepare_tools(tools)

        # Determine tool mode
        tool_mode = self._determine_tool_mode(tool_choice)

        # Create generation config with response validation
        config = self._create_generate_config(
            tool_params,
            system_prompt,
            max_tokens,
            temperature,
            tool_mode,
            response_validation=True,  # Enable response validation by default
        )

        return gemini_messages, config

    def _prepare_response_metadata(self, response) -> Dict[str, Any]:
        """Prepare metadata from response.

        Args:
            response: Gemini response object

        Returns:
            Metadata dictionary
        """
        input_tokens_count = response.usage_metadata.prompt_token_count
        output_tokens_count = (
            response.usage_metadata.total_token_count
            - response.usage_metadata.prompt_token_count
        )
        return {
            "raw_response": response,
            "input_tokens": input_tokens_count,
            "output_tokens": output_tokens_count,
        }

    def generate(
        self,
        messages: LLMMessages,
        max_tokens: int,
        system_prompt: str | None = None,
        temperature: float = 1.0,
        tools: list[ToolParam] = [],
        tool_choice: dict[str, str] | None = None,
    ) -> Tuple[list[AssistantContentBlock], dict[str, Any]]:
        """Generate a response using Gemini (synchronous).

        Args:
            messages: Input messages
            max_tokens: Maximum output tokens
            system_prompt: System instruction
            temperature: Sampling temperature
            tools: Available tools
            tool_choice: Tool selection configuration

        Returns:
            Tuple of (response messages, metadata)
        """
        gemini_messages, config = self._prepare_generation_request(
            messages, max_tokens, system_prompt, temperature, tools, tool_choice
        )

        # Make request with retry logic
        response = self._retry_with_backoff_sync(
            self.client.models.generate_content,
            model=self.model_name,
            config=config,
            contents=gemini_messages,
        )

        # Parse response and prepare metadata
        internal_messages = self._parse_response(response)
        message_metadata = self._prepare_response_metadata(response)

        return internal_messages, message_metadata

    async def agenerate(
        self,
        messages: LLMMessages,
        max_tokens: int,
        system_prompt: str | None = None,
        temperature: float = 1.0,
        tools: list[ToolParam] = [],
        tool_choice: dict[str, str] | None = None,
    ) -> Tuple[list[AssistantContentBlock], dict[str, Any]]:
        """Generate a response using Gemini (asynchronous).

        Args:
            messages: Input messages
            max_tokens: Maximum output tokens
            system_prompt: System instruction
            temperature: Sampling temperature
            tools: Available tools
            tool_choice: Tool selection configuration

        Returns:
            Tuple of (response messages, metadata)
        """
        gemini_messages, config = self._prepare_generation_request(
            messages, max_tokens, system_prompt, temperature, tools, tool_choice
        )

        # Make request with retry logic
        response = await self._retry_with_backoff(
            self.client.aio.models.generate_content,
            model=self.model_name,
            config=config,
            contents=gemini_messages,
        )
        # Parse response and prepare metadata
        internal_messages = self._parse_response(response)
        message_metadata = self._prepare_response_metadata(response)
        return internal_messages, message_metadata
