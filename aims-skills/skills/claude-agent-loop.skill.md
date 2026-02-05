---
name: Claude Agent SDK Loop
description: A 4-step autonomous agent loop structure for A.I.M.S. orchestrator (ACHEEVY).
version: 1.0.0
---

# Claude Agent SDK Loop

This skill defines the core operating loop for the ACHEEVY orchestrator agent, based on the Claude Agent SDK architecture.

## Loop Stages

### 1. Gather Context
The agent begins by aggregating necessary information to understand the task.
*   **SubAgents**: Delegate parallelizable sub-tasks. Sub-agents run with isolated context windows and report back key findings.
*   **Compacting**: Automatically condense conversation history to manage context window usage efficienty.
*   **Agentic Search**: Leverage file system tools (grep, tail, find) to explore the codebase.
*   **Semantic Search**: Retrieve relevant documents or code snippets based on meaning rather than just keywords.

### 2. Take Action
The agent executes the "doing" phase using its available capabilities.
*   **Tools**: Custom-built functions for specific capabilities.
*   **MCP (Model Context Protocol)**: Access standardized external integrations (databases, APIs) and provide context.
*   **Bash & Scripts**: Use the "computer" capability to run shell commands, scripts, and file operations.
*   **Code Generation**: Write and execute code (e.g., Python scripts) to generate assets, process data, or build application logic.

### 3. Verify Output
Before finalizing, the agent rigorously checks its work.
*   **Defining Rules**: Check against specific rules for output quality, format, and type.
*   **Visual Feedback**: Use tools like Playwright (via MCP) to visually verify web UI changes or rendering.
*   **LLM-as-a-Judge**: Use a separate LLM call (or self-correction) to evaluate the output quality based on fuzzy logic rules.

### 4. Final Output
Deliver the completed, verified result to the user or requesting process.

## Implementation Guidelines
*   **ACHEEVY Integration**: This loop should be the default operating mode for ACHEEVY when handling complex user requests.
*   **Error Handling**: If "Verify Output" fails, the loop should return to "Gather Context" or "Take Action" with the feedback.
