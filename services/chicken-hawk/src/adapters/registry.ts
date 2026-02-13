// =============================================================================
// Chicken Hawk — Tool Adapter Registry
// Central registry for all tool adapters. Adapters register at startup.
// =============================================================================

import type { ToolAdapter } from "./base";

export class ToolAdapterRegistry {
  private adapters: Map<string, ToolAdapter> = new Map();

  register(adapter: ToolAdapter): void {
    this.adapters.set(adapter.id, adapter);
    console.log(`[adapter-registry] Registered: ${adapter.id} (${adapter.wrapper_type})`);
  }

  get(id: string): ToolAdapter {
    const adapter = this.adapters.get(id);
    if (!adapter) {
      throw new Error(`No adapter registered for capability: ${id}`);
    }
    return adapter;
  }

  has(id: string): boolean {
    return this.adapters.has(id);
  }

  list(): string[] {
    return Array.from(this.adapters.keys());
  }
}
