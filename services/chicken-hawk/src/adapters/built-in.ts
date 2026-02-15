// =============================================================================
// Chicken Hawk — Built-in Tool Adapters
// Core adapters per CHICKENHAWK_SPEC.md Section 7.2
// Each adapter wraps a real backend behind the policy gate.
// =============================================================================

import type { ToolAdapter, ExecutionContext } from "./base";

/**
 * deploy_workload — SERVICE_WRAPPER → Docker API
 */
export const deployWorkloadAdapter: ToolAdapter = {
  id: "deploy_workload",
  wrapper_type: "SERVICE_WRAPPER",
  required_permissions: ["deploy_workload"],
  luc_metered: true,
  async execute(params: Record<string, unknown>, ctx: ExecutionContext) {
    const { image, service_name, port, env } = params;
    console.log(`[adapter:deploy_workload] ${ctx.lil_hawk_id} deploying ${service_name}`);
    // Calls Docker API via Agent Bridge
    const endpoint = process.env.AGENT_BRIDGE_URL || "http://agent-bridge:3010";
    const res = await fetch(`${endpoint}/api/docker/deploy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image, service_name, port, env, shift_id: ctx.shift_id }),
    });
    if (!res.ok) throw new Error(`Deploy failed: ${res.status} ${await res.text()}`);
    return res.json();
  },
};

/**
 * health_check — SERVICE_WRAPPER → HTTP probe
 */
export const healthCheckAdapter: ToolAdapter = {
  id: "health_check",
  wrapper_type: "SERVICE_WRAPPER",
  required_permissions: ["health_check_workload"],
  luc_metered: false,
  async execute(params: Record<string, unknown>, ctx: ExecutionContext) {
    const { url, expected_status } = params;
    console.log(`[adapter:health_check] ${ctx.lil_hawk_id} probing ${url}`);
    const res = await fetch(url as string, { signal: AbortSignal.timeout(10000) });
    return {
      url,
      status: res.status,
      healthy: res.status === (expected_status || 200),
      checked_at: new Date().toISOString(),
    };
  },
};

/**
 * run_n8n_workflow — MCP_BRIDGE_WRAPPER → n8n API
 */
export const runN8nWorkflowAdapter: ToolAdapter = {
  id: "run_n8n_workflow",
  wrapper_type: "MCP_BRIDGE_WRAPPER",
  required_permissions: ["run_n8n_workflow"],
  luc_metered: true,
  async execute(params: Record<string, unknown>, ctx: ExecutionContext) {
    const { workflow_id, payload } = params;
    console.log(`[adapter:run_n8n_workflow] ${ctx.lil_hawk_id} triggering workflow ${workflow_id}`);
    const n8nUrl = process.env.N8N_URL || "http://n8n:5678";
    const res = await fetch(`${n8nUrl}/api/v1/workflows/${workflow_id}/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${Buffer.from(`${process.env.N8N_AUTH_USER}:${process.env.N8N_AUTH_PASSWORD}`).toString("base64")}`,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`n8n workflow failed: ${res.status}`);
    return res.json();
  },
};

/**
 * send_notification — SERVICE_WRAPPER → Telegram/webhook
 */
export const sendNotificationAdapter: ToolAdapter = {
  id: "send_notification",
  wrapper_type: "SERVICE_WRAPPER",
  required_permissions: ["send_notification"],
  luc_metered: false,
  async execute(params: Record<string, unknown>, ctx: ExecutionContext) {
    const { channel, message, chat_id } = params;
    console.log(`[adapter:send_notification] ${ctx.lil_hawk_id} sending via ${channel}`);

    if (channel === "telegram") {
      const token = process.env.TELEGRAM_BOT_TOKEN;
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id, text: message, parse_mode: "Markdown" }),
      });
      return res.json();
    }

    if (channel === "webhook") {
      const { webhook_url } = params;
      const res = await fetch(webhook_url as string, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, shift_id: ctx.shift_id, timestamp: new Date().toISOString() }),
      });
      return { status: res.status, sent: true };
    }

    throw new Error(`Unsupported notification channel: ${channel}`);
  },
};

/**
 * git_operations — CLI_WRAPPER → git CLI
 */
export const gitOperationsAdapter: ToolAdapter = {
  id: "git_operations",
  wrapper_type: "CLI_WRAPPER",
  required_permissions: ["git_operations"],
  luc_metered: false,
  async execute(params: Record<string, unknown>, ctx: ExecutionContext) {
    const { operation, repo_path, args } = params;

    // Git write gate check is done by policy layer, but double-check here
    if (["push", "commit"].includes(operation as string) && !ctx.policy_snapshot.git_write_gate) {
      throw new Error("Git write gate is closed — push/commit operations blocked by Circuit Box");
    }

    console.log(`[adapter:git_operations] ${ctx.lil_hawk_id} git ${operation} in ${repo_path}`);
    const endpoint = process.env.AGENT_BRIDGE_URL || "http://agent-bridge:3010";
    const res = await fetch(`${endpoint}/api/exec/git`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ operation, repo_path, args, shift_id: ctx.shift_id }),
    });
    if (!res.ok) throw new Error(`Git operation failed: ${res.status}`);
    return res.json();
  },
};

/**
 * file_operations — CLI_WRAPPER → fs API
 */
export const fileOperationsAdapter: ToolAdapter = {
  id: "file_operations",
  wrapper_type: "CLI_WRAPPER",
  required_permissions: ["file_operations"],
  luc_metered: false,
  async execute(params: Record<string, unknown>, ctx: ExecutionContext) {
    const { operation, path, content } = params;
    console.log(`[adapter:file_operations] ${ctx.lil_hawk_id} file ${operation} at ${path}`);
    const endpoint = process.env.AGENT_BRIDGE_URL || "http://agent-bridge:3010";
    const res = await fetch(`${endpoint}/api/exec/file`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ operation, path, content, shift_id: ctx.shift_id }),
    });
    if (!res.ok) throw new Error(`File operation failed: ${res.status}`);
    return res.json();
  },
};

/**
 * search_web — SERVICE_WRAPPER → Brave/Tavily
 */
export const searchWebAdapter: ToolAdapter = {
  id: "search_web",
  wrapper_type: "SERVICE_WRAPPER",
  required_permissions: ["search_web"],
  luc_metered: true,
  async execute(params: Record<string, unknown>, ctx: ExecutionContext) {
    const { query, provider } = params;

    if (!ctx.policy_snapshot.network_egress) {
      throw new Error("Network egress is blocked by Circuit Box — web search unavailable");
    }

    console.log(`[adapter:search_web] ${ctx.lil_hawk_id} searching: ${query}`);
    const endpoint = process.env.AGENT_BRIDGE_URL || "http://agent-bridge:3010";
    const res = await fetch(`${endpoint}/api/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, provider: provider || "brave", shift_id: ctx.shift_id }),
    });
    if (!res.ok) throw new Error(`Search failed: ${res.status}`);
    return res.json();
  },
};

/**
 * run_tests — JOB_RUNNER_WRAPPER → npm/pytest
 */
export const runTestsAdapter: ToolAdapter = {
  id: "run_tests",
  wrapper_type: "JOB_RUNNER_WRAPPER",
  required_permissions: ["run_tests"],
  luc_metered: true,
  async execute(params: Record<string, unknown>, ctx: ExecutionContext) {
    const { test_command, working_dir } = params;
    console.log(`[adapter:run_tests] ${ctx.lil_hawk_id} running: ${test_command}`);
    const endpoint = process.env.AGENT_BRIDGE_URL || "http://agent-bridge:3010";
    const res = await fetch(`${endpoint}/api/exec/job`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command: test_command, cwd: working_dir, shift_id: ctx.shift_id, timeout: 120000 }),
    });
    if (!res.ok) throw new Error(`Test run failed: ${res.status}`);
    return res.json();
  },
};

/**
 * Get all built-in adapters for registration
 */
export function getBuiltInAdapters(): ToolAdapter[] {
  return [
    deployWorkloadAdapter,
    healthCheckAdapter,
    runN8nWorkflowAdapter,
    sendNotificationAdapter,
    gitOperationsAdapter,
    fileOperationsAdapter,
    searchWebAdapter,
    runTestsAdapter,
  ];
}
