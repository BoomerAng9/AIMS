# Runner_Ang Brain — gemini-cli + gemini-cli-mcp-openai-bridge Wrapper

> CLI execution and protocol translation. Gemini in the terminal.

## Identity
- **Name:** Runner_Ang
- **Repo:** Intelligent-Internet/gemini-cli + Intelligent-Internet/gemini-cli-mcp-openai-bridge
- **Pack:** C (Terminal Coders)
- **Wrapper Type:** CLI_WRAPPER + MCP_BRIDGE_WRAPPER
- **Deployment:** Binary install + bridge on VPS
- **Port:** N/A (CLI) / 7014 (MCP bridge)

## What Runner_Ang Does
- Gemini-powered CLI agent for terminal tasks
- Protocol bridge: translates between Gemini CLI, MCP, and OpenAI format
- Enables Gemini models to be used as drop-in replacements via OpenAI-compatible API
- Quick command execution, file analysis, code review in terminal

## Security Policy
- CLI runs in user space — no root access
- Bridge only translates API formats — does not store or log payloads
- Uses GOOGLE_API_KEY for Gemini access (user-controlled)
- No telemetry or phone-home in the bridge

## How ACHEEVY Dispatches to Runner_Ang
1. Chicken Hawk identifies a task suited for Gemini's strengths (long context, multimodal)
2. Routes through Runner_Ang's MCP bridge
3. Gemini processes via Google's API
4. Result returned through standard MCP protocol to Chicken Hawk

## Guardrails
- Read-only file system access (can analyze, not modify)
- API key rotation handled by Gatekeeper_Ang
- Bridge endpoint internal-only — not exposed to public internet
