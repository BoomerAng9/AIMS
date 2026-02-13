// =============================================================================
// Chicken Hawk — Policy Service (port 4002)
// Circuit Box policy enforcement engine.
// Controls what Lil_Hawks can and cannot do.
//
// Endpoints:
//   GET  /health         — Health check
//   GET  /api/config     — Get current Circuit Box config
//   PUT  /api/config     — Update Circuit Box config
//   POST /api/check      — Check if a task is policy-allowed
//   POST /api/emergency-stop — Activate emergency stop
//   POST /api/emergency-clear — Clear emergency stop
// =============================================================================

import express, { Request, Response } from "express";
import type { CircuitBoxConfig, PolicyCheckRequest, PolicyCheckResult } from "../types";

const app = express();
const PORT = parseInt(process.env.PORT || "4002", 10);
const startTime = Date.now();

// ---------------------------------------------------------------------------
// State: Circuit Box configuration (loaded from file or defaults)
// ---------------------------------------------------------------------------
let circuitBox: CircuitBoxConfig = {
  autonomy_level: "supervised",
  tool_permissions: {
    deploy_workload: "allow",
    health_check: "allow",
    run_n8n_workflow: "allow",
    send_notification: "allow",
    git_operations: "require_approval",
    file_operations: "allow",
    search_web: "allow",
    run_tests: "allow",
  },
  network_egress: true,
  git_write_gate: false,
  voice_provider_routing: "elevenlabs",
  evidence_required: true,
  emergency_stop: false,
  budget_cap_usd: 10.0,
  concurrency_limit: 5,
  shift_timeout_seconds: 300,
};

// Load from file if available
try {
  const configPath = process.env.CIRCUIT_BOX_CONFIG || "/config/circuit-box/circuit-box-config.json";
  const fs = await import("fs");
  if (fs.existsSync(configPath)) {
    const data = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    circuitBox = { ...circuitBox, ...data };
    console.log(`[policy] Loaded Circuit Box config from ${configPath}`);
  }
} catch {
  console.log("[policy] Using default Circuit Box config");
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
app.use(express.json());
app.use((_req: Request, res: Response, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (_req.method === "OPTIONS") { res.sendStatus(204); return; }
  next();
});

// ---------------------------------------------------------------------------
// GET /health
// ---------------------------------------------------------------------------
app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "chickenhawk-policy",
    version: "1.0.0",
    uptime_seconds: Math.floor((Date.now() - startTime) / 1000),
    emergency_stop: circuitBox.emergency_stop,
  });
});

// ---------------------------------------------------------------------------
// GET /api/config — Return current Circuit Box state
// ---------------------------------------------------------------------------
app.get("/api/config", (_req: Request, res: Response) => {
  res.json(circuitBox);
});

// ---------------------------------------------------------------------------
// PUT /api/config — Update Circuit Box levers
// ---------------------------------------------------------------------------
app.put("/api/config", (req: Request, res: Response) => {
  const updates = req.body as Partial<CircuitBoxConfig>;
  circuitBox = { ...circuitBox, ...updates };
  console.log("[policy] Circuit Box updated:", Object.keys(updates).join(", "));
  res.json({ updated: true, config: circuitBox });
});

// ---------------------------------------------------------------------------
// POST /api/check — Evaluate a policy check request
// ---------------------------------------------------------------------------
app.post("/api/check", (req: Request, res: Response) => {
  const request = req.body as PolicyCheckRequest;
  const result = evaluatePolicy(request);

  console.log(
    `[policy] Check: ${request.capability_id} (${request.badge_level}) → ${result.allowed ? "ALLOW" : "DENY"}: ${result.reason}`,
  );

  res.json(result);
});

// ---------------------------------------------------------------------------
// POST /api/emergency-stop — Activate kill switch
// ---------------------------------------------------------------------------
app.post("/api/emergency-stop", (_req: Request, res: Response) => {
  circuitBox.emergency_stop = true;
  console.log("[policy] EMERGENCY STOP ACTIVATED");
  res.json({ emergency_stop: true, activated_at: new Date().toISOString() });
});

// ---------------------------------------------------------------------------
// POST /api/emergency-clear — Deactivate kill switch
// ---------------------------------------------------------------------------
app.post("/api/emergency-clear", (_req: Request, res: Response) => {
  circuitBox.emergency_stop = false;
  console.log("[policy] Emergency stop CLEARED");
  res.json({ emergency_stop: false, cleared_at: new Date().toISOString() });
});

// ---------------------------------------------------------------------------
// Policy Evaluation Logic
// ---------------------------------------------------------------------------
function evaluatePolicy(request: PolicyCheckRequest): PolicyCheckResult {
  // Emergency stop — deny everything
  if (circuitBox.emergency_stop) {
    return deny("Emergency stop is active — all operations blocked");
  }

  // Budget check
  if (request.estimated_cost_usd > circuitBox.budget_cap_usd) {
    return deny(`Cost $${request.estimated_cost_usd} exceeds budget cap $${circuitBox.budget_cap_usd}`);
  }

  // Tool permission check
  const toolPerm = circuitBox.tool_permissions[request.capability_id];
  if (toolPerm === "deny") {
    return deny(`Tool ${request.capability_id} is explicitly denied`);
  }

  // Badge level enforcement per capability-registry.json
  if (request.badge_level === "red") {
    return {
      allowed: false,
      reason: "Red badge — requires explicit owner approval",
      requires_approval: true,
      approver: "owner",
      policy_snapshot: circuitBox,
    };
  }

  if (request.badge_level === "amber") {
    return {
      allowed: false,
      reason: "Amber badge — requires Boomer_Ang supervisor approval",
      requires_approval: true,
      approver: "boomer_ang",
      policy_snapshot: circuitBox,
    };
  }

  // Green badge
  if (toolPerm === "require_approval") {
    return {
      allowed: false,
      reason: `Tool ${request.capability_id} requires explicit approval`,
      requires_approval: true,
      approver: "boomer_ang",
      policy_snapshot: circuitBox,
    };
  }

  if (circuitBox.autonomy_level === "manual") {
    return {
      allowed: false,
      reason: "Manual mode — all operations require approval",
      requires_approval: true,
      approver: "boomer_ang",
      policy_snapshot: circuitBox,
    };
  }

  // Green + supervised/auto → allowed
  return {
    allowed: true,
    reason: `Green badge — approved under ${circuitBox.autonomy_level} autonomy`,
    requires_approval: false,
    policy_snapshot: circuitBox,
  };
}

function deny(reason: string): PolicyCheckResult {
  return {
    allowed: false,
    reason,
    requires_approval: false,
    policy_snapshot: circuitBox,
  };
}

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
app.listen(PORT, "0.0.0.0", () => {
  console.log(`[chickenhawk-policy] Circuit Box Policy Engine on port ${PORT}`);
  console.log(`[chickenhawk-policy] Autonomy: ${circuitBox.autonomy_level} | Budget cap: $${circuitBox.budget_cap_usd}`);
  console.log(`[chickenhawk-policy] Emergency stop: ${circuitBox.emergency_stop ? "ACTIVE" : "clear"}`);
});
