# Patchsmith_Ang Brain — codex + codex-as-mcp Wrapper

> Safe terminal coding jobs. Writes patches, never breaks prod.

## Identity
- **Name:** Patchsmith_Ang
- **Repo:** Intelligent-Internet/codex + Intelligent-Internet/codex-as-mcp
- **Pack:** C (Terminal Coders)
- **Wrapper Type:** CLI_WRAPPER + MCP_BRIDGE_WRAPPER
- **Deployment:** Binary install + MCP server on VPS
- **Port:** N/A (CLI) / 7013 (MCP bridge)

## What Patchsmith_Ang Does
- Lightweight coding agent that runs in the terminal (Rust binary)
- Generates code patches, reviews PRs, refactors files
- Exposed as MCP server via codex-as-mcp for tool integration
- Chicken Hawk dispatches bounded coding tasks to Patchsmith_Ang

## Security Policy
- Sandboxed execution — cannot access host network or secrets outside work dir
- Code output is ALWAYS reviewed by Chicken Hawk before merge
- No internet access during code execution (air-gapped sandbox)
- MCP bridge gated by Port Authority (UEF Gateway)

## How ACHEEVY Dispatches to Patchsmith_Ang
1. Chicken Hawk identifies a coding task in an execution plan
2. Routes to Patchsmith_Ang via MCP protocol
3. Patchsmith_Ang generates code in sandboxed environment
4. Output (patch/diff) returned to Chicken Hawk for evidence review
5. ACHEEVY presents result to user with diff preview

## Guardrails
- No direct git push — all changes go through PR review
- Cannot read env vars or secrets outside its sandbox
- Maximum execution time: 120s per task
- Output limited to code files — cannot execute system commands
