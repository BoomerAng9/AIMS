// =============================================================================
// Code Ang — OpenCode Executor Inside Chicken Hawk
// Sandboxed code execution: create, modify, delete, run, test, generate files.
// All operations restricted to /app/workspace only.
// This is the coding muscle that makes Chicken Hawk an actual OpenClaw.
// =============================================================================

import type { ToolAdapter, ExecutionContext } from "./base";
import { llm } from "../lib/llm";

type CodeAction = "create" | "modify" | "delete" | "run" | "test" | "generate";

interface CodeAngParams {
  action: CodeAction;
  filePath?: string;
  content?: string;
  command?: string;
  prompt?: string;       // For generate action — LLM generates the code
  language?: string;
}

const WORKSPACE = "/app/workspace";

function validatePath(filePath: string): string {
  const resolved = filePath.startsWith("/") ? filePath : `${WORKSPACE}/${filePath}`;
  if (!resolved.startsWith(WORKSPACE)) {
    throw new Error(`PATH_VIOLATION: Code Ang restricted to ${WORKSPACE}. Got: ${resolved}`);
  }
  return resolved;
}

export const codeAngAdapter: ToolAdapter = {
  id: "code_ang",
  wrapper_type: "CLI_WRAPPER",
  required_permissions: ["code_execution"],
  luc_metered: true,

  async execute(params: Record<string, unknown>, ctx: ExecutionContext) {
    const p = params as unknown as CodeAngParams;
    console.log(`[code-ang] ${ctx.lil_hawk_id} action=${p.action} path=${p.filePath || "n/a"}`);

    const endpoint = process.env.AGENT_BRIDGE_URL || "http://agent-bridge:3010";

    switch (p.action) {
      case "create":
      case "modify": {
        if (!p.filePath || !p.content) throw new Error("create/modify requires filePath + content");
        const fullPath = validatePath(p.filePath);
        const res = await fetch(`${endpoint}/api/exec/file`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            operation: "write",
            path: fullPath,
            content: p.content,
            shift_id: ctx.shift_id,
          }),
        });
        if (!res.ok) throw new Error(`File ${p.action} failed: ${res.status}`);
        return { action: p.action, path: p.filePath, success: true };
      }

      case "delete": {
        if (!p.filePath) throw new Error("delete requires filePath");
        const fullPath = validatePath(p.filePath);
        const res = await fetch(`${endpoint}/api/exec/file`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            operation: "delete",
            path: fullPath,
            shift_id: ctx.shift_id,
          }),
        });
        if (!res.ok) throw new Error(`File delete failed: ${res.status}`);
        return { action: "delete", path: p.filePath, success: true };
      }

      case "run": {
        if (!p.command) throw new Error("run requires command");
        const res = await fetch(`${endpoint}/api/exec/job`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            command: p.command,
            cwd: WORKSPACE,
            shift_id: ctx.shift_id,
            timeout: 60000,
          }),
        });
        if (!res.ok) throw new Error(`Command execution failed: ${res.status}`);
        return res.json();
      }

      case "test": {
        if (!p.command) throw new Error("test requires command");
        const res = await fetch(`${endpoint}/api/exec/job`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            command: p.command,
            cwd: WORKSPACE,
            shift_id: ctx.shift_id,
            timeout: 120000,
          }),
        });
        const result = await res.json();
        return { action: "test", ...result };
      }

      case "generate": {
        if (!p.prompt) throw new Error("generate requires prompt");
        const generated = await llm.prompt(
          p.prompt,
          `You are Code Ang, the coding execution engine for A.I.M.S. Chicken Hawk.
Generate clean, production-grade ${p.language || "TypeScript"} code.
Only output the code. No explanations.`,
          "build",
        );

        if (p.filePath) {
          const fullPath = validatePath(p.filePath);
          const res = await fetch(`${endpoint}/api/exec/file`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              operation: "write",
              path: fullPath,
              content: generated,
              shift_id: ctx.shift_id,
            }),
          });
          if (!res.ok) throw new Error(`Generated file write failed: ${res.status}`);
        }

        return { action: "generate", content: generated, path: p.filePath || null };
      }

      default:
        throw new Error(`Unknown Code Ang action: ${(p as CodeAngParams).action}`);
    }
  },
};
