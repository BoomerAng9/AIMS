// =============================================================================
// Chicken Hawk — Tool Adapter Registry
// Central registry for all tool adapters. Adapters register at startup.
// =============================================================================

import type { ToolAdapter } from "./base";

// Maps manifest task function names to adapter IDs
const FUNCTION_TO_ADAPTER: Record<string, string> = {
  deploy: "deploy_workload", scale: "deploy_workload", update: "deploy_workload",
  swap: "deploy_workload", canary: "deploy_workload", rollback: "deploy_workload",
  terminate: "deploy_workload",
  health: "health_check", check: "health_check", monitor: "health_check",
  dispatch: "run_n8n_workflow",
  guard: "send_notification", notify: "send_notification",
  verify: "run_tests", test: "run_tests",
  move: "file_operations", export: "file_operations", import: "file_operations",
  cleanup: "file_operations", rotate: "file_operations",
  search: "search_web", detect: "search_web",
};

export class ToolAdapterRegistry {
  private adapters: Map<string, ToolAdapter> = new Map();

  register(adapter: ToolAdapter): void {
    this.adapters.set(adapter.id, adapter);
    console.log(`[adapter-registry] Registered: ${adapter.id} (${adapter.wrapper_type})`);
  }

  get(id: string): ToolAdapter {
    // Direct match first
    const direct = this.adapters.get(id);
    if (direct) return direct;

    // Function name → adapter ID lookup
    const mapped = FUNCTION_TO_ADAPTER[id];
    if (mapped) {
      const adapter = this.adapters.get(mapped);
      if (adapter) return adapter;
    }

    throw new Error(`No adapter registered for capability: ${id}`);
  }

  has(id: string): boolean {
    return this.adapters.has(id) || !!(FUNCTION_TO_ADAPTER[id] && this.adapters.has(FUNCTION_TO_ADAPTER[id]));
  }

  list(): string[] {
    return Array.from(this.adapters.keys());
  }
}
