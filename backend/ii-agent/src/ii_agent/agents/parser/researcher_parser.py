import ast
from datetime import datetime, timezone
import random
import re
import time
from typing import Any, Optional

from ii_agent.agents.parser.base import MessageParser
from ii_agent.llm.base import AssistantContentBlock, LLMMessages, TextPrompt, TextResult, ThinkingBlock, ToolCall, ToolFormattedResult, ToolParam, ToolResult
from ii_agent.prompts.researcher_system_prompt import ConfigConstants, ResearcherConfig

class DeepResearchMessageParser(MessageParser):
    def __init__(self,  tools: list[ToolParam]):
        super().__init__()
        self.tools = tools

    def pre_llm_parse(
        self,
        messages: LLMMessages,
    ) -> LLMMessages:
        """Prepare messages for OpenAI API format.

        Args:
            messages: Internal message format

        Returns:
            List of messages in OpenAI format
        """
        openai_messages = []
        tmp_messages = []
        for message in messages:
            tmp_messages.append(message)
        if isinstance(tmp_messages[-1][0], TextPrompt):
            tmp_messages.append([ThinkingBlock(thinking="", signature="")])
            
        openai_messages.extend(
            self._compress_adjacent_assistant_messages(tmp_messages, self.tools)
        )

        return openai_messages



    def post_llm_parse(self, messages: list[AssistantContentBlock]) -> list[AssistantContentBlock]:
        """Parse the model response."""
        result = []
        for message in messages:
            if isinstance(message, TextResult):
                raw = message.text
                text_before , action_string = self.parse_code_blobs(raw)
                
                # Remove <tool_response> tags from text_before and log if removed
                if text_before and (re.search(r'<tool_response>.*?</tool_response>', text_before, re.DOTALL) or 
                                  '<tool_response>' in text_before or '</tool_response>' in text_before):
                    print("Removed <tool_response> tags from text_before in post_llm_parse")
                    # Remove complete tags first
                    text_before = re.sub(r'<tool_response>.*?</tool_response>', '', text_before, flags=re.DOTALL)
                    # Remove any remaining standalone opening/closing tags
                    text_before = re.sub(r'</?tool_response>', '', text_before)
                    text_before = text_before.strip()
            else:
                result.append(message)
                continue

            if action_string:
                try:
                    action = self.evaluate_block(action_string)
                    result.append(
                        ThinkingBlock(
                            signature="",
                            thinking=text_before.replace(ConfigConstants.THINK_TAG_CLOSE, "").replace("<｜end▁of▁thinking｜>,", "").replace("<｜end▁of▁thinking｜>", "")
                        )
                    )
                    result.append(action)
                except ValueError:
                    
                    if ConfigConstants.THINK_TAG_CLOSE not in raw:
                        result.append(TextResult(text=raw.replace("<｜end▁of▁thinking｜>,", "").replace("<｜end▁of▁thinking｜>", "")))
                    else:
                        split_result = raw.rsplit(ConfigConstants.THINK_TAG_CLOSE, 1)
                        thoughts, text_result = split_result[0], split_result[1]
                        result.append(ThinkingBlock(signature="", thinking=thoughts))
                        result.append(TextResult(text=text_result.replace("<｜end▁of▁thinking｜>,", "").replace("<｜end▁of▁thinking｜>", "")))
            else:
                if ConfigConstants.THINK_TAG_CLOSE not in raw:
                    result.append(TextResult(text=raw.replace("<｜end▁of▁thinking｜>,", "").replace("<｜end▁of▁thinking｜>", "")))
                else:
                    split_result = raw.rsplit(ConfigConstants.THINK_TAG_CLOSE, 1)
                    thoughts, text_result = split_result[0], split_result[1]
                    result.append(ThinkingBlock(signature="", thinking=thoughts.replace("<｜end▁of▁thinking｜>,", "").replace("<｜end▁of▁thinking｜>", "")))
                    result.append(TextResult(text=text_result.replace("<｜end▁of▁thinking｜>,", "").replace("<｜end▁of▁thinking｜>", "")))

        return result

    def _compress_adjacent_assistant_messages(
        self, temp_messages: LLMMessages, tools: list[ToolParam] | None
    ) -> list[dict]:
        """Compress adjacent assistant messages and return final message list."""
        openai_messages = []
        i = 0
        prev_user_msg = None
        while i < len(temp_messages):
            current_msg = temp_messages[i]

            if isinstance(current_msg[0], TextPrompt):
                prev_user_msg = current_msg[0].text
                openai_messages.append(current_msg)
                i += 1

            elif isinstance(current_msg[0], AssistantContentBlock):
                # Collect adjacent assistant messages
                adjacent_assistant_msgs = [current_msg]
                j = i + 1
                while (
                    j < len(temp_messages) and not isinstance(temp_messages[j][0], TextPrompt)
                ):
                    adjacent_assistant_msgs.append(temp_messages[j])
                    j += 1

                # Compress if we have multiple adjacent assistant messages
                if len(adjacent_assistant_msgs) >= 1 and prev_user_msg is not None:
                    compressed_msg = self._compress(
                        prev_user_msg=prev_user_msg,
                        assistant_messages=adjacent_assistant_msgs,
                        tools=tools or [],
                    )
                    openai_messages.append([compressed_msg])
                else:
                    openai_messages.append(current_msg)

                i = j  # Skip the compressed messages
            else:
                openai_messages.append(current_msg)
                i += 1

        return openai_messages

    def _compress(
        self,
        prev_user_msg: str,
        assistant_messages: LLMMessages,
        tools: list[ToolParam],
    ) -> AssistantContentBlock:
        """Compress a list of adjacent assistant messages into a single message."""
        combined_text = []

        for msg in assistant_messages:
            for content_item in msg:
                if isinstance(content_item, ThinkingBlock):
                    combined_text.append(content_item.thinking)
                elif isinstance(content_item, TextResult):
                    combined_text.append(content_item.text)
                elif isinstance(content_item, ToolCall):
                    combined_text.append(self.format_tool_call(content_item))
                elif isinstance(content_item, ToolResult) or isinstance(
                    content_item, ToolFormattedResult
                ):
                    combined_text.append(self.format_tool_result(content_item))
                else:
                    raise ValueError(
                        f"Unsupported content type: {type(content_item)}"
                    )

        instruction = ResearcherConfig().instructions.format(
            current_date=datetime.now(timezone.utc).isoformat(),
            available_tools=ConfigConstants.AVAILABLE_TOOLS,
        )

        if combined_text and combined_text[0]:
            content = (
                f"{ConfigConstants.THINK_TAG_OPEN} \n"
                + "\n".join(combined_text)
                + f"\n{instruction if instruction else ''}"
                + "Let's review the data I jut got and dig a bit deeper, since it's a deep research, and can only end when I have explored everything I need to know. If the data is not good enought, I need to search the web or visit the website again."
            )
            if isinstance(assistant_messages[-1], ThinkingBlock) and (
                not content.strip().endswith(ConfigConstants.THINK_TAG_CLOSE)
            ):
                content += ConfigConstants.THINK_TAG_CLOSE
        else:
            content = (
                f"{ConfigConstants.THINK_TAG_OPEN} {instruction if instruction else ''}. Let's begin the research! \n"
                + "\n".join(combined_text)
            )
        
        return TextResult(text=content)



    def parse_code_blobs(self, text: str) -> tuple[str, str]:
        """Extract code blocks from the LLM's output.

        If a valid code block is passed, it returns it directly.

        Args:
            text (`str`): LLM's output text to parse.
            tool_names (`List[str]`, optional): List of tool names to check in the code block.

        Returns:
            `tuple[str, str]`: Tuple of (text_before_code_block, code_block).
        """
        pattern = r"```\s*(?:py|python)\s*(.*?)\s*```"

        match = re.search(pattern, text, re.DOTALL)
        if match:
            text_before = text[: match.start()].strip()
            code_block = match.group(1).strip()
            return text_before, code_block

        # Maybe the LLM outputted a code blob directly
        try:
            ast.parse(text)
            return "", text
        except SyntaxError:
            pass

        return "", ""


    def evaluate_ast_node(self, node: ast.AST) -> Any:
        """
        Recursively evaluate an AST node to extract its value.

        Args:
            node: An AST node representing a value

        Returns:
            The Python value represented by the node

        Raises:
            ValueError: If the node cannot be evaluated
        """
        # Handle simple literals directly
        if isinstance(node, ast.Constant):
            return node.value

        # Handle lists
        if isinstance(node, ast.List):
            return [self.evaluate_ast_node(elem) for elem in node.elts]

        # Handle dictionaries
        if isinstance(node, ast.Dict):
            keys = [self.evaluate_ast_node(k) for k in node.keys]
            values = [self.evaluate_ast_node(v) for v in node.values]
            return dict(zip(keys, values))

        # Handle tuples
        if isinstance(node, ast.Tuple):
            return tuple(self.evaluate_ast_node(elem) for elem in node.elts)

        # Handle sets
        if isinstance(node, ast.Set):
            return {self.evaluate_ast_node(elem) for elem in node.elts}

        if isinstance(node, ast.Name):
            # Handle special constants like True, False, None
            if node.id == "True":
                return True
            if node.id == "False":
                return False
            if node.id == "None":
                return None
            raise ValueError(f"Cannot evaluate name: {node.id}")

        # For more complex expressions, try using ast.literal_eval
        try:
            # Convert the node to source code
            code = ast.unparse(node)
            # Use ast.literal_eval to safely evaluate expressions
            return ast.literal_eval(code)
        except (AttributeError, ValueError) as exc:
            # For Python versions without ast.unparse or other issues
            raise ValueError(
                f"Cannot evaluate complex expression: {ast.dump(node)}"
            ) from exc


    def evaluate_block(self, string: str) -> Optional["ToolCall"]:
        """
        Parse a string into an Action instance.

        Args:
            string: A string in format "action_name(arg1=value1, arg2=value2)"

        Returns:
            Action instance if parsing succeeds, None otherwise

        Raises:
            ValueError: If the string format is invalid
        """
        try:
            # Remove leading/trailing whitespace
            string = string.strip()

            # Check if string contains function call pattern
            if not (string.endswith(")") and "(" in string):
                raise ValueError(
                    f"String must be in format 'name(arg1=value1, arg2=...)' but got {string}"
                )

            # Parse the AST
            tree = ast.parse(string)
            if not tree.body or not isinstance(tree.body[0].value, ast.Call):
                raise ValueError("String must contain a valid function call")

            call = tree.body[0].value
            name = getattr(call.func, "id", None)
            if not name:
                raise ValueError("Action name must be a valid identifier")

            # Process keyword arguments
            arguments = {}
            for keyword in call.keywords:
                if not keyword.arg:
                    raise ValueError("All arguments must be named (keyword arguments)")

                # Extract the value using ast.literal_eval for complex structures
                value = self.evaluate_ast_node(keyword.value)
                arguments[keyword.arg] = value

            return ToolCall(
                tool_call_id=self.generate_tool_call_id(), tool_name=name, tool_input=arguments
            )

        except SyntaxError as e:
            raise ValueError(f"Invalid action string syntax: {str(e)}") from e
        except ValueError as e:
            raise ValueError(f"Invalid action string format: {str(e)}") from e
        except Exception as e:
            raise ValueError(f"Unexpected error parsing action string: {str(e)}") from e


    def generate_tool_call_id(self) -> str:
        """Generate a unique ID for a tool call.

        Returns:
            A unique string ID combining timestamp and random number.
        """
        timestamp = int(time.time() * 1000)  # Current time in milliseconds
        random_num = random.randint(1000, 9999)  # Random 4-digit number
        return f"call_{timestamp}_{random_num}"


    def format_tool_call(self, tool_call: ToolCall) -> str:
        """Format a ToolCall instance into a string."""
        return f"{ConfigConstants.CODE_BLOCK_START}\n{self.tool_to_string(tool_call)}\n{ConfigConstants.CODE_BLOCK_END}{ConfigConstants.END_CODE}"


    def tool_to_string(self, tool_call: ToolCall) -> Optional[str]:
        """
        Convert ToolCall instance to a string in function call format.

        Returns:
            String in format "name(arg1=value1, arg2=value2)"
        """
        args = []
        if isinstance(tool_call.tool_input, dict):
            for key, value in tool_call.tool_input.items():
                # Handle string values with proper quoting
                if isinstance(value, str):
                    arg_str = f'{key}="{value}"'
                # Handle other types (numbers, booleans, etc.) without quotes
                else:
                    arg_str = f"{key}={value}"
                args.append(arg_str)

            args_str = ", ".join(args)
            return f"{tool_call.tool_name}({args_str})"


    def format_tool_result(self, tool_result: ToolResult | ToolFormattedResult) -> str:
        """Format a ToolResult instance into a string."""
        suffix = "I must not repeat <tool_response> tag in my thinking process and must not repeat myself."
        # if tool_result.tool_name == "web_visit_compress":
        #     suffix = ConfigConstants.VISIT_WEBPAGE_SUFFIX
        # elif tool_result.tool_name == "web_batch_search":
        #     suffix = ConfigConstants.SEARCH_SUFFIX
        return f"The user executed the tool and the result is: {ConfigConstants.TOOL_RESPONSE_OPEN}\n{tool_result.tool_output}\n{ConfigConstants.TOOL_RESPONSE_CLOSE}\n{suffix}"
