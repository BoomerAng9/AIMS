import json
from typing import Optional, Tuple, Dict, Any, List
from ii_agent.llm.base import (
    GeneralContentBlock,
    ImageBlock,
    LLMClient,
    TextPrompt,
    TextResult,
    ToolCall,
    ToolFormattedResult,
)
from ii_agent.llm.context_manager.base import ContextManager
from ii_agent.llm.token_counter import TokenCounter
from ii_agent.utils.constants import (
    TOKEN_BUDGET,
    SUMMARY_MAX_TOKENS,
    COMPRESSION_TOKEN_THRESHOLD,
)
from ii_agent.core.logger import logger


class LLMCompact(ContextManager):
    def __init__(
        self,
        client: LLMClient,
        token_counter: TokenCounter,
        token_budget: int = TOKEN_BUDGET,
        compression_token_threshold: float = COMPRESSION_TOKEN_THRESHOLD,
    ):
        super().__init__(token_counter=token_counter, token_budget=token_budget)
        self.client = client
        self.token_counter = token_counter
        self.compression_token_threshold = compression_token_threshold

    def _extract_todo_list_from_tools(
        self, message_lists: list[list[GeneralContentBlock]]
    ) -> Optional[List[Dict[str, Any]]]:
        """
        Extract the most recent todo list from TodoWrite tool calls.
        Scans message history for ToolCall with tool_name="TodoWrite" and extracts the structured todos.
        """
        # Scan from most recent to oldest to get the latest state
        for message_list in reversed(message_lists):
            for message in message_list:
                if isinstance(message, ToolCall):
                    # Check if this is a TodoWrite tool call
                    if message.tool_name == "TodoWrite":
                        tool_input = message.tool_input
                        # Extract todos array from tool input
                        if isinstance(tool_input, dict) and "todos" in tool_input:
                            todos = tool_input["todos"]
                            if todos and isinstance(todos, list):
                                logger.info(f"Found TodoWrite with {len(todos)} items")
                                return todos
        return None

    def _format_todo_list(self, todos: List[Dict[str, Any]]) -> str:
        """
        Format todo list for injection into summary.
        Preserves the exact structure: id, content, status, priority.
        """
        lines = ["## Active Todo List (Preserved from Context)"]
        lines.append("")
        lines.append("The following todo list was active before compression:")
        lines.append("")

        # Group by status for better organization
        status_groups = {
            "completed": [],
            "in_progress": [],
            "pending": []
        }

        for todo in todos:
            status = todo.get("status", "pending")
            if status in status_groups:
                status_groups[status].append(todo)

        # Format each group
        for status_key, status_label in [
            ("completed", "✓ Completed"),
            ("in_progress", "→ In Progress"),
            ("pending", "○ Pending")
        ]:
            items = status_groups[status_key]
            if items:
                lines.append(f"**{status_label}:**")
                for todo in items:
                    content = todo.get("content", "")
                    priority = todo.get("priority", "medium")
                    todo_id = todo.get("id", "")

                    # Add priority indicator
                    priority_indicator = {
                        "high": "[HIGH]",
                        "medium": "[MED]",
                        "low": "[LOW]"
                    }.get(priority, "")

                    lines.append(f"  {todo_id}. {content} {priority_indicator}")
                lines.append("")

        return "\n".join(lines)

    async def _try_compress_chat(
        self, message_lists: list[list[GeneralContentBlock]]
    ) -> Optional[Dict[str, Any]]:
        """
        Try to compress the conversation history if it exceeds the threshold.
        Returns compression info with tokens before/after, or None if not compressed.
        """
        # Generate summary of history to compress
        summary_text = await self._generate_compression_summary(message_lists)

        # Extract and preserve todo list from the entire history (compressed + kept)
        # We check all messages to get the most recent todo list state
        todos = self._extract_todo_list_from_tools(message_lists)
        if todos:
            todo_formatted = self._format_todo_list(todos)
            summary_text = f"{summary_text}\n\n{todo_formatted}"

        # Create new message list with summary
        summary_user_message = [TextPrompt(text=f"You're working on a long horizon task for me; below is the context you previously wrote summarizing progress so far. {summary_text}.")]
        compressed_messages = [summary_user_message]

        # Count new tokens
        original_token_count = self.count_tokens(message_lists)
        new_token_count = self.count_tokens(compressed_messages)
        
        logger.info(
            f"Compressed history from {original_token_count} to {new_token_count} tokens "
            f"(saved {original_token_count - new_token_count} tokens, "
            f"{100 * (1 - new_token_count/original_token_count):.1f}% reduction)"
        )
        
        return compressed_messages

    async def _generate_summary_with_llm(
        self, 
        message_lists: list[list[GeneralContentBlock]], 
        prompt: str, 
        system_prompt: str,
    ) -> str:
        """Generate a summary using the LLM with the given prompt."""
        summary_request = [TextPrompt(text=prompt)]
        messages_for_summary = message_lists + [summary_request]
        model_response, _ = await self.client.agenerate(
            messages=messages_for_summary,
            max_tokens=SUMMARY_MAX_TOKENS,
            system_prompt=system_prompt,
        )
        summary_text = ""
        for message in model_response:
            if isinstance(message, TextResult):
                summary_text += message.text
        return summary_text

    async def _generate_compression_summary(
        self, message_lists: list[list[GeneralContentBlock]]
    ) -> str:
        """Generate a structured XML summary of the conversation to compress."""
        return await self._generate_summary_with_llm(
            message_lists=message_lists,
            prompt=COMPACT_PROMPT,
            system_prompt="You are a helpful AI assistant tasked with creating structured conversation summaries.",
        )

    def should_truncate(self, message_lists: list[list[GeneralContentBlock]]) -> bool:
        """Check if truncation is needed based on configurable threshold."""
        current_tokens = self.count_tokens(message_lists)
        return current_tokens > self._token_budget

    async def apply_truncation(
        self, message_lists: list[list[GeneralContentBlock]]
    ) -> list[list[GeneralContentBlock]]:
        """Apply smart truncation using compression when needed."""
        compression_result = await self._try_compress_chat(message_lists)
        return compression_result if compression_result is not None else message_lists
    

COMPACT_USER_MESSAGE = "Use the /compact command to clear the conversation history, and start a new conversation with the summary in context."


COMPACT_PROMPT = """
Your task is to create a detailed summary of the conversation so far, paying close attention to the user's explicit requests and your previous actions.
This summary should be thorough in capturing technical details, code patterns, and architectural decisions that would be essential for continuing development work without losing context.

Before providing your final summary, wrap your analysis in <analysis> tags to organize your thoughts and ensure you've covered all necessary points. In your analysis process:

1. Chronologically analyze each message and section of the conversation. For each section thoroughly identify:
   - The user's explicit requests and intents
   - Your approach to addressing the user's requests
   - Key decisions, technical concepts and code patterns
   - Specific details like file names, full code snippets, function signatures, file edits, etc
2. Double-check for technical accuracy and completeness, addressing each required element thoroughly.

Your summary should include the following sections:

1. Primary Request and Intent: Capture all of the user's explicit requests and intents in detail
2. Key Technical Concepts: List all important technical concepts, technologies, and frameworks discussed.
3. Files and Code Sections: Enumerate specific files and code sections examined, modified, or created. Pay special attention to the most recent messages and include full code snippets where applicable and include a summary of why this file read or edit is important.
4. Problem Solving: Document problems solved and any ongoing troubleshooting efforts.
5. Pending Tasks: Outline any pending tasks that you have explicitly been asked to work on.
6. Current Work: Describe in detail precisely what was being worked on immediately before this summary request, paying special attention to the most recent messages from both user and assistant. Include file names and code snippets where applicable.
7. Optional Next Step: List the next step that you will take that is related to the most recent work you were doing. IMPORTANT: ensure that this step is DIRECTLY in line with the user's explicit requests, and the task you were working on immediately before this summary request. If your last task was concluded, then only list next steps if they are explicitly in line with the users request. Do not start on tangential requests without confirming with the user first.
                       If there is a next step, include direct quotes from the most recent conversation showing exactly what task you were working on and where you left off. This should be verbatim to ensure there's no drift in task interpretation.

Here's an example of how your output should be structured:

<example>
<analysis>
[Your thought process, ensuring all points are covered thoroughly and accurately]
</analysis>

<summary>
1. Primary Request and Intent:
   [Detailed description]

2. Key Technical Concepts:
   - [Concept 1]
   - [Concept 2]
   - [...]

3. Files and Code Sections:
   - [File Name 1]
      - [Summary of why this file is important]
      - [Summary of the changes made to this file, if any]
      - [Important Code Snippet]
   - [File Name 2]
      - [Important Code Snippet]
   - [...]

4. Problem Solving:
   [Description of solved problems and ongoing troubleshooting]

5. Pending Tasks:
   - [Task 1]
   - [Task 2]
   - [...]

6. Current Work:
   [Precise description of current work]

7. Optional Next Step:
   [Optional Next step to take]

</summary>
</example>

Please provide your summary based on the conversation so far, following this structure and ensuring precision and thoroughness in your response. 

There may be additional summarization instructions provided in the included context. If so, remember to follow these instructions when creating the above summary. Examples of instructions include:
<example>
## Compact Instructions
When summarizing the conversation focus on typescript code changes and also remember the mistakes you made and how you fixed them.
</example>

<example>
# Summary instructions
When you are using compact - please focus on test output and code changes. Include file reads verbatim.
</example>
"""