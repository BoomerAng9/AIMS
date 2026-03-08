# Chicken Hawk Go-Live Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make Chicken Hawk a production-ready secure OpenClaw with the same autonomous capabilities — Code Ang execution, Lil_Hawk job deployment, persistent memory, multi-model LLM routing — plus Docker hardening, ORACLE gates, and a polished admin UI.

**Architecture:** Chicken Hawk is 3 Docker services (core:4001, policy:4002, audit:4003) that execute manifests via Lil_Hawk squads. We're adding the actual execution muscles (Code Ang, LLM router, memory store) so Lil_Hawks can be deployed as real workers for jobs, not just in-memory objects. Security hardening (read-only FS, Docker secrets, ORACLE gates) wraps everything. Admin UI gets SSE real-time streaming.

**Tech Stack:** Bun runtime, Express, Docker Compose, Next.js 14 (App Router), React, Tailwind CSS, Firestore (memory), GCP Cloud Run (Lil_Hawk jobs)

---

## Task 1: Docker Security Hardening — Compose Config

**Files:**
- Modify: `infra/docker-compose.prod.yml:489-603`

**Step 1: Add security hardening to all 3 Chicken Hawk services**

Add to `chickenhawk-policy` and `chickenhawk-audit`:
```yaml
    cap_drop:
      - ALL
    read_only: true
    tmpfs:
      - /tmp:size=50M
```

Add to `chickenhawk-core`:
```yaml
    cap_drop:
      - ALL
    read_only: true
    tmpfs:
      - /tmp:size=100M
      - /app/workspace:size=500M
```

**Step 2: Add Docker secrets block at top level**

```yaml
secrets:
  openrouter_api_key:
    environment: OPENROUTER_API_KEY
  gemini_api_key:
    environment: GEMINI_API_KEY
  redis_password:
    environment: REDIS_PASSWORD
```

Update chickenhawk-core to reference secrets, remove API keys from environment.

**Step 3: Rename agent-zero to avva-noon**

In `infra/docker-compose.prod.yml:465-483`:
- Service: `agent-zero` → `avva-noon`
- Volume: `agent-zero-data` → `avva-noon-data`

**Step 4: Verify**

Run: `cd infra && docker compose -f docker-compose.prod.yml config --quiet`

**Step 5: Commit**

```bash
git add infra/docker-compose.prod.yml
git commit -m "security: harden Chicken Hawk — read-only FS, cap_drop ALL, Docker secrets, rename agent-zero to avva-noon"
```

---

## Task 2: Secrets Reader + LLM Router Upgrade

**Files:**
- Create: `services/chicken-hawk/src/lib/secrets.ts`
- Modify: `services/chicken-hawk/src/lib/llm.ts`
- Modify: `services/chicken-hawk/src/index.ts`

**Step 1: Create secrets reader**

Create `services/chicken-hawk/src/lib/secrets.ts` — reads from `/run/secrets/` with env fallback. Secrets are NEVER logged.

```typescript
import { readFileSync, existsSync } from "fs";

export function readSecret(name: string, envFallback?: string): string {
  const secretPath = `/run/secrets/${name}`;
  if (existsSync(secretPath)) return readFileSync(secretPath, "utf-8").trim();
  return (envFallback ? process.env[envFallback] : process.env[name.toUpperCase()]) || "";
}

export const secrets = {
  openrouterApiKey: readSecret("openrouter_api_key", "OPENROUTER_API_KEY"),
  geminiApiKey: readSecret("gemini_api_key", "GEMINI_API_KEY"),
  redisPassword: readSecret("redis_password", "REDIS_PASSWORD"),
} as const;
```

**Step 2: Upgrade LLM router with task-type routing**

Modify `services/chicken-hawk/src/lib/llm.ts` to:
- Import from `secrets.ts` instead of reading `process.env` directly
- Add task-type model routing per the spec:

| Task Type | Primary | Fallback |
|-----------|---------|----------|
| Standard build | claude-opus-4-5 via OpenRouter | gemini-3-flash-thinking |
| Deep research / M.I.M. | gemini-3-pro | kimi-k2.5 |
| Departmental tasks | kimi-k2.5 | gemini-3-flash-thinking |

Add a `routeModel(taskType)` method that returns the right primary + fallback combo.

**Step 3: Update index.ts startup log**

```typescript
import { secrets } from "./lib/secrets";
console.log(`  Secrets: ${secrets.openrouterApiKey ? "loaded" : "MISSING"}, ${secrets.geminiApiKey ? "loaded" : "MISSING"}`);
```

**Step 4: Commit**

```bash
git add services/chicken-hawk/src/lib/secrets.ts services/chicken-hawk/src/lib/llm.ts services/chicken-hawk/src/index.ts
git commit -m "feat: secrets reader + task-type LLM routing (Claude/Gemini/Kimi)"
```

---

## Task 3: Code Ang — Sandboxed Code Execution Adapter

**Files:**
- Create: `services/chicken-hawk/src/adapters/code-ang.ts`
- Modify: `services/chicken-hawk/src/adapters/built-in.ts` (register Code Ang)

**Step 1: Create Code Ang adapter**

Create `services/chicken-hawk/src/adapters/code-ang.ts`:

```typescript
// =============================================================================
// Code Ang — OpenCode Executor Inside Chicken Hawk
// Sandboxed code execution: create, modify, delete, run, test files.
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

function validatePath(filePath: string): void {
  const resolved = filePath.startsWith("/") ? filePath : `${WORKSPACE}/${filePath}`;
  if (!resolved.startsWith(WORKSPACE)) {
    throw new Error(`PATH_VIOLATION: Code Ang restricted to ${WORKSPACE}. Got: ${resolved}`);
  }
}

export const codeAngAdapter: ToolAdapter = {
  id: "code_ang",
  wrapper_type: "CLI_WRAPPER",
  required_permissions: ["code_execution"],
  luc_metered: true,

  async execute(params: Record<string, unknown>, ctx: ExecutionContext) {
    const p = params as unknown as CodeAngParams;
    console.log(`[code-ang] ${ctx.lil_hawk_id} action=${p.action} path=${p.filePath || "n/a"}`);

    // All file paths must be inside workspace
    if (p.filePath) validatePath(p.filePath);

    const endpoint = process.env.AGENT_BRIDGE_URL || "http://agent-bridge:3010";

    switch (p.action) {
      case "create":
      case "modify": {
        if (!p.filePath || !p.content) throw new Error("create/modify requires filePath + content");
        const res = await fetch(`${endpoint}/api/exec/file`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            operation: p.action === "create" ? "write" : "write",
            path: p.filePath.startsWith("/") ? p.filePath : `${WORKSPACE}/${p.filePath}`,
            content: p.content,
            shift_id: ctx.shift_id,
          }),
        });
        if (!res.ok) throw new Error(`File ${p.action} failed: ${res.status}`);
        return { action: p.action, path: p.filePath, success: true };
      }

      case "delete": {
        if (!p.filePath) throw new Error("delete requires filePath");
        const res = await fetch(`${endpoint}/api/exec/file`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            operation: "delete",
            path: p.filePath.startsWith("/") ? p.filePath : `${WORKSPACE}/${p.filePath}`,
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
        // Use LLM to generate code, then write to workspace
        const generated = await llm.prompt(
          p.prompt,
          `You are Code Ang, the coding execution engine for A.I.M.S. Chicken Hawk.
Generate clean, production-grade ${p.language || "TypeScript"} code.
Only output the code. No explanations.`,
        );

        if (p.filePath) {
          validatePath(p.filePath);
          const res = await fetch(`${endpoint}/api/exec/file`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              operation: "write",
              path: p.filePath.startsWith("/") ? p.filePath : `${WORKSPACE}/${p.filePath}`,
              content: generated,
              shift_id: ctx.shift_id,
            }),
          });
          if (!res.ok) throw new Error(`Generated file write failed: ${res.status}`);
        }

        return { action: "generate", content: generated, path: p.filePath || null };
      }

      default:
        throw new Error(`Unknown Code Ang action: ${p.action}`);
    }
  },
};
```

**Step 2: Register in built-in.ts**

Add to `services/chicken-hawk/src/adapters/built-in.ts`:

```typescript
import { codeAngAdapter } from "./code-ang";

export function getBuiltInAdapters(): ToolAdapter[] {
  return [
    codeAngAdapter,           // NEW — Code Ang sandboxed execution
    deployWorkloadAdapter,
    healthCheckAdapter,
    // ... existing adapters
  ];
}
```

**Step 3: Commit**

```bash
git add services/chicken-hawk/src/adapters/code-ang.ts services/chicken-hawk/src/adapters/built-in.ts
git commit -m "feat: add Code Ang adapter — sandboxed code execution with LLM generation"
```

---

## Task 4: Persistent Memory Store

**Files:**
- Create: `services/chicken-hawk/src/lib/memory.ts`
- Modify: `services/chicken-hawk/src/core/engine.ts` (save/restore execution state)
- Modify: `services/chicken-hawk/src/types/manifest.ts` (add MemorySnapshot type)

**Step 1: Add memory types**

Append to `services/chicken-hawk/src/types/manifest.ts`:

```typescript
export interface OracleGateResult {
  gate: number;
  name: string;
  passed: boolean;
  blocking: boolean;
  reason: string;
}

export interface OracleVerdict {
  approved: boolean;
  gates: OracleGateResult[];
  blocking_failures: OracleGateResult[];
  advisory_warnings: OracleGateResult[];
  verified_at: string;
}

export interface MemorySnapshot {
  agent_id: string;          // Lil_Hawk or Chicken Hawk ID
  shift_id: string;
  manifest_id: string;
  state: Record<string, unknown>;
  outcomes: Array<{
    task_id: string;
    status: string;
    lesson: string;          // What was learned
  }>;
  preferences: Record<string, unknown>;
  decisions: Array<{
    decision: string;
    reason: string;
    timestamp: string;
  }>;
  created_at: string;
  updated_at: string;
}
```

**Step 2: Create memory store**

Create `services/chicken-hawk/src/lib/memory.ts`:

```typescript
// =============================================================================
// Chicken Hawk — Persistent Memory Store
// Cross-execution state so agents never start fresh.
// Backend: Redis (fast cache) + file persistence (durable).
// When Firestore is available, syncs there for long-term storage.
// =============================================================================

import type { MemorySnapshot } from "../types";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const MEMORY_DIR = process.env.MEMORY_DIR || "/app/data/memory";

export class MemoryStore {
  private cache: Map<string, MemorySnapshot> = new Map();

  constructor() {
    try {
      mkdirSync(MEMORY_DIR, { recursive: true });
    } catch {
      // tmpfs or read-only — use in-memory only
    }
    this.loadFromDisk();
  }

  /**
   * Get memory for an agent. Returns empty snapshot if none exists.
   */
  get(agentId: string): MemorySnapshot {
    return this.cache.get(agentId) || this.emptySnapshot(agentId);
  }

  /**
   * Save/update memory for an agent.
   */
  save(snapshot: MemorySnapshot): void {
    snapshot.updated_at = new Date().toISOString();
    this.cache.set(snapshot.agent_id, snapshot);
    this.persistToDisk(snapshot);
  }

  /**
   * Record an outcome from a completed task.
   */
  recordOutcome(agentId: string, taskId: string, status: string, lesson: string): void {
    const mem = this.get(agentId);
    mem.outcomes.push({ task_id: taskId, status, lesson });
    // Keep last 100 outcomes
    if (mem.outcomes.length > 100) mem.outcomes = mem.outcomes.slice(-100);
    this.save(mem);
  }

  /**
   * Record a decision made during execution.
   */
  recordDecision(agentId: string, decision: string, reason: string): void {
    const mem = this.get(agentId);
    mem.decisions.push({ decision, reason, timestamp: new Date().toISOString() });
    if (mem.decisions.length > 50) mem.decisions = mem.decisions.slice(-50);
    this.save(mem);
  }

  /**
   * Get all stored agent IDs.
   */
  listAgents(): string[] {
    return Array.from(this.cache.keys());
  }

  private emptySnapshot(agentId: string): MemorySnapshot {
    return {
      agent_id: agentId,
      shift_id: "",
      manifest_id: "",
      state: {},
      outcomes: [],
      preferences: {},
      decisions: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  private persistToDisk(snapshot: MemorySnapshot): void {
    try {
      const filePath = join(MEMORY_DIR, `${snapshot.agent_id}.json`);
      writeFileSync(filePath, JSON.stringify(snapshot, null, 2));
    } catch {
      // Disk write failed (read-only FS?) — memory stays in cache only
    }
  }

  private loadFromDisk(): void {
    try {
      if (!existsSync(MEMORY_DIR)) return;
      const { readdirSync } = require("fs");
      const files = readdirSync(MEMORY_DIR) as string[];
      for (const file of files) {
        if (!file.endsWith(".json")) continue;
        try {
          const data = JSON.parse(readFileSync(join(MEMORY_DIR, file), "utf-8"));
          this.cache.set(data.agent_id, data);
        } catch {
          // Corrupted file — skip
        }
      }
      console.log(`[memory] Loaded ${this.cache.size} agent memories from disk`);
    } catch {
      console.log("[memory] No disk memories found — starting fresh");
    }
  }
}

export const memory = new MemoryStore();
```

**Step 3: Integrate memory into engine.ts**

In `services/chicken-hawk/src/core/engine.ts`:
- Import `memory` store
- Before execution: load prior memory for the manifest's agents
- After each task: `memory.recordOutcome()` with the result
- After manifest completes: save full memory snapshot

**Step 4: Commit**

```bash
git add services/chicken-hawk/src/lib/memory.ts services/chicken-hawk/src/core/engine.ts services/chicken-hawk/src/types/manifest.ts
git commit -m "feat: persistent memory store — cross-execution state for Lil_Hawks and Chicken Hawk"
```

---

## Task 5: Lil_Hawk Job Deployer

**Files:**
- Create: `services/chicken-hawk/src/core/job-deployer.ts`
- Modify: `services/chicken-hawk/src/core/squad-manager.ts` (deploy Lil_Hawks as containers)
- Modify: `services/chicken-hawk/src/types/lil-hawk.ts` (add deployment fields)

**Step 1: Add deployment types to lil-hawk.ts**

Append to `services/chicken-hawk/src/types/lil-hawk.ts`:

```typescript
export type DeployTarget = "local" | "cloud_run" | "docker";

export interface LilHawkDeployment {
  target: DeployTarget;
  container_id?: string;        // Docker container ID if docker target
  cloud_run_job_id?: string;    // Cloud Run job execution ID
  endpoint?: string;            // HTTP endpoint if the Lil_Hawk exposes one
  deployed_at: string;
  terminated_at?: string;
}
```

Add `deployment?: LilHawkDeployment` to the existing `LilHawk` interface.

**Step 2: Create job deployer**

Create `services/chicken-hawk/src/core/job-deployer.ts`:

```typescript
// =============================================================================
// Chicken Hawk — Lil_Hawk Job Deployer
// Deploys Lil_Hawks as real workers — Docker containers on VPS or
// Cloud Run Jobs on GCP. Each Lil_Hawk gets its own isolated execution
// environment with workspace, tools, and memory access.
// =============================================================================

import type { LilHawk, LilHawkDeployment, DeployTarget, ManifestTask } from "../types";
import { memory } from "../lib/memory";

const AGENT_BRIDGE_URL = process.env.AGENT_BRIDGE_URL || "http://agent-bridge:3010";
const DEPLOY_TARGET: DeployTarget = (process.env.LILHAWK_DEPLOY_TARGET as DeployTarget) || "local";

export class JobDeployer {
  /**
   * Deploy a Lil_Hawk for a specific task.
   * - "local": execute in-process (current behavior, fastest)
   * - "docker": spawn a Docker container via Agent Bridge
   * - "cloud_run": dispatch a GCP Cloud Run Job
   */
  async deploy(hawk: LilHawk, task: ManifestTask): Promise<LilHawkDeployment> {
    const target = this.resolveTarget(task);

    console.log(`[job-deployer] Deploying ${hawk.moniker} via ${target} for task ${task.task_id}`);

    switch (target) {
      case "docker":
        return this.deployDocker(hawk, task);
      case "cloud_run":
        return this.deployCloudRun(hawk, task);
      case "local":
      default:
        return this.deployLocal(hawk);
    }
  }

  /**
   * Terminate a deployed Lil_Hawk.
   */
  async terminate(hawk: LilHawk): Promise<void> {
    if (!hawk.deployment) return;

    console.log(`[job-deployer] Terminating ${hawk.moniker} (${hawk.deployment.target})`);

    if (hawk.deployment.target === "docker" && hawk.deployment.container_id) {
      try {
        await fetch(`${AGENT_BRIDGE_URL}/api/docker/stop`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ container_id: hawk.deployment.container_id }),
        });
      } catch (err) {
        console.warn(`[job-deployer] Failed to stop container: ${err}`);
      }
    }

    hawk.deployment.terminated_at = new Date().toISOString();

    // Persist Lil_Hawk memory before termination
    memory.save(memory.get(hawk.id));
  }

  /**
   * Choose deployment target based on task requirements.
   * Heavy tasks (badge_level red, high cost) go to Cloud Run.
   * Green badge tasks run locally for speed.
   */
  private resolveTarget(task: ManifestTask): DeployTarget {
    // Global override
    if (DEPLOY_TARGET !== "local") return DEPLOY_TARGET;

    // Red badge or high cost → Cloud Run for isolation
    if (task.badge_level === "red" || task.estimated_cost_usd > 1.0) {
      return process.env.GCP_PROJECT_ID ? "cloud_run" : "docker";
    }

    // Amber badge → Docker for sandboxing
    if (task.badge_level === "amber") return "docker";

    // Green badge → local for speed
    return "local";
  }

  private async deployLocal(hawk: LilHawk): Promise<LilHawkDeployment> {
    return {
      target: "local",
      deployed_at: new Date().toISOString(),
    };
  }

  private async deployDocker(hawk: LilHawk, task: ManifestTask): Promise<LilHawkDeployment> {
    const res = await fetch(`${AGENT_BRIDGE_URL}/api/docker/deploy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image: "aims/lil-hawk-worker:latest",
        service_name: `lil-hawk-${hawk.kyb.identity}`,
        env: {
          HAWK_ID: hawk.id,
          SHIFT_ID: hawk.kyb.shift_id,
          TASK_ID: task.task_id,
          TASK_FUNCTION: task.function,
          CHICKENHAWK_CORE_URL: `http://chickenhawk-core:4001`,
          AUDIT_URL: process.env.AUDIT_URL || "http://chickenhawk-audit:4003",
        },
        labels: {
          "aims.role": "lil-hawk",
          "aims.shift": hawk.kyb.shift_id,
          "aims.squad": hawk.kyb.squad_id,
        },
        network: "sandbox-network",
        read_only: true,
        cap_drop: ["ALL"],
        memory_limit: "256m",
        cpu_limit: "0.5",
      }),
    });

    if (!res.ok) throw new Error(`Docker deploy failed: ${res.status} ${await res.text()}`);
    const data = await res.json() as { container_id: string };

    return {
      target: "docker",
      container_id: data.container_id,
      deployed_at: new Date().toISOString(),
    };
  }

  private async deployCloudRun(hawk: LilHawk, task: ManifestTask): Promise<LilHawkDeployment> {
    // GCP Cloud Run Job dispatch
    const gcpProjectId = process.env.GCP_PROJECT_ID || "ai-managed-services";
    const region = process.env.GCP_REGION || "us-central1";

    const res = await fetch(
      `https://${region}-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/${gcpProjectId}/jobs/lil-hawk-worker:run`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await this.getGCPToken()}`,
        },
        body: JSON.stringify({
          overrides: {
            containerOverrides: [{
              env: [
                { name: "HAWK_ID", value: hawk.id },
                { name: "SHIFT_ID", value: hawk.kyb.shift_id },
                { name: "TASK_ID", value: task.task_id },
                { name: "TASK_FUNCTION", value: task.function },
                { name: "TASK_PARAMS", value: JSON.stringify(task.params) },
              ],
            }],
          },
        }),
      },
    );

    if (!res.ok) throw new Error(`Cloud Run job dispatch failed: ${res.status}`);
    const data = await res.json() as { metadata: { name: string } };

    return {
      target: "cloud_run",
      cloud_run_job_id: data.metadata.name,
      deployed_at: new Date().toISOString(),
    };
  }

  private async getGCPToken(): Promise<string> {
    // Try metadata server (when running on GCP)
    try {
      const res = await fetch(
        "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token",
        { headers: { "Metadata-Flavor": "Google" }, signal: AbortSignal.timeout(2000) },
      );
      if (res.ok) {
        const data = await res.json() as { access_token: string };
        return data.access_token;
      }
    } catch {
      // Not on GCP
    }
    // Fallback: env var
    return process.env.GCP_ACCESS_TOKEN || "";
  }
}

export const jobDeployer = new JobDeployer();
```

**Step 3: Integrate deployer into squad-manager.ts**

In `services/chicken-hawk/src/core/squad-manager.ts`:
- Import `jobDeployer`
- After spawning each Lil_Hawk, call `jobDeployer.deploy(hawk, task)` and attach the deployment to the hawk
- On squad finalize, call `jobDeployer.terminate()` for each hawk

**Step 4: Commit**

```bash
git add services/chicken-hawk/src/core/job-deployer.ts services/chicken-hawk/src/core/squad-manager.ts services/chicken-hawk/src/types/lil-hawk.ts
git commit -m "feat: Lil_Hawk job deployer — deploy workers as Docker containers or Cloud Run jobs"
```

---

## Task 6: ORACLE 7-Gate Verification

**Files:**
- Create: `services/chicken-hawk/src/core/oracle.ts`
- Modify: `services/chicken-hawk/src/core/engine.ts:190-228`

**Step 1: Create ORACLE module**

Create `services/chicken-hawk/src/core/oracle.ts` with 7 gates:
- Gate 1 (Technical) — BLOCKING: all waves succeeded
- Gate 2 (Security) — BLOCKING: all tasks have evidence
- Gate 3 (UX) — advisory
- Gate 4 (Performance) — advisory: avg wave <60s
- Gate 5 (Compliance) — BLOCKING: no budget anomaly
- Gate 6 (Strategy) — advisory
- Gate 7 (Docs) — advisory: run logs present

**Step 2: Integrate into engine.ts after wave execution, before finalize**

Add `"verifying"` status phase. If ORACLE blocks, override status to `"failed"`. Emit audit event.

**Step 3: Commit**

```bash
git add services/chicken-hawk/src/core/oracle.ts services/chicken-hawk/src/core/engine.ts
git commit -m "feat: ORACLE 7-gate verification — gates 1,2,5 blocking"
```

---

## Task 7: SSE Proxy + Admin UI Polish

**Files:**
- Create: `frontend/app/api/admin/chicken-hawk/events/route.ts`
- Modify: `frontend/app/dashboard/admin/chicken-hawk/page.tsx`

**Step 1: Create SSE proxy route**

Owner-gated Next.js API route that proxies `chickenhawk-core:4001/events` to the browser.

**Step 2: Replace 30s polling with EventSource**

Wire `new EventSource("/api/admin/chicken-hawk/events")` into the admin page. Heartbeats update squad count. Events append to a live feed.

**Step 3: Add structured live event feed**

Replace raw JSON output with color-coded event cards showing:
- Timestamp + event type + Lil_Hawk ID + status badge
- Wave progress, task completions, ORACLE gate results

**Step 4: Add Circuit Box policy snapshot panel**

Inline panel showing autonomy level, budget cap, concurrency limit, kill switch state.

**Step 5: Collapsible raw output fallback**

Keep JSON dump behind a toggle for debugging.

**Step 6: Build check**

Run: `cd frontend && npm run build`

**Step 7: Commit**

```bash
git add frontend/app/api/admin/chicken-hawk/events/route.ts frontend/app/dashboard/admin/chicken-hawk/page.tsx
git commit -m "feat: admin UI — SSE live feed, policy snapshot, structured output"
```

---

## Task 8: Stack Verification

**Step 1:** `cd frontend && npm run build` — clean build
**Step 2:** `cd infra && docker compose -f docker-compose.prod.yml config --quiet` — valid compose
**Step 3:** Grep for dangling voice-router references — should be zero
**Step 4:** Final commit

```bash
git commit -m "chore: stack update 2026-03-01 — Chicken Hawk go-live with OpenClaw autonomy"
```
