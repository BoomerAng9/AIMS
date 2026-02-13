// =============================================================================
// Chicken Hawk — Core Service (port 4001)
// A.I.M.S. Execution Engine
//
// Command chain: ACHEEVY → Boomer_Ang → Chicken Hawk → Squad → Lil_Hawk
// Core principle: "Packet first. Proof always."
//
// Endpoints:
//   GET  /health           — Health check
//   GET  /status           — Full engine status
//   GET  /events           — SSE event stream
//   POST /api/manifest     — Submit manifest for execution
//   POST /api/emergency-stop — Emergency stop all operations
//   GET  /api/squads       — List active squads
// =============================================================================

import express, { Request, Response } from "express";
import { ChickenHawkEngine } from "./core/engine";
import type { Manifest } from "./types";

const app = express();
const PORT = parseInt(process.env.PORT || "4001", 10);
const startTime = Date.now();
const engine = new ChickenHawkEngine();

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
app.use(express.json({ limit: "1mb" }));

app.use((_req: Request, res: Response, next) => {
  res.setHeader("Access-Control-Allow-Origin", process.env.CORS_ORIGIN || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
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
    service: "chickenhawk-core",
    version: "1.0.0",
    uptime_seconds: Math.floor((Date.now() - startTime) / 1000),
  });
});

// ---------------------------------------------------------------------------
// GET /status — Full engine status with active squads and adapters
// ---------------------------------------------------------------------------
app.get("/status", (_req: Request, res: Response) => {
  res.json({
    service: "chickenhawk-core",
    version: "1.0.0",
    uptime_seconds: Math.floor((Date.now() - startTime) / 1000),
    engine: engine.getStatus(),
  });
});

// ---------------------------------------------------------------------------
// GET /events — SSE endpoint for real-time execution events
// ---------------------------------------------------------------------------
app.get("/events", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  res.write(`data: ${JSON.stringify({
    type: "connected",
    ts: new Date().toISOString(),
    service: "chickenhawk-core",
  })}\n\n`);

  const interval = setInterval(() => {
    const status = engine.getStatus();
    res.write(`data: ${JSON.stringify({
      type: "heartbeat",
      ts: new Date().toISOString(),
      active_squads: status.active_squads.length,
      buffered_events: status.buffered_audit_events,
    })}\n\n`);
  }, 5000);

  _req.on("close", () => { clearInterval(interval); res.end(); });
});

// ---------------------------------------------------------------------------
// POST /api/manifest — Submit a manifest for execution
// ---------------------------------------------------------------------------
app.post("/api/manifest", async (req: Request, res: Response) => {
  try {
    const manifest = req.body as Manifest;

    if (!manifest.manifest_id || !manifest.shift_id || !manifest.plan?.waves) {
      res.status(400).json({
        error: "Invalid manifest: requires manifest_id, shift_id, and plan.waves",
      });
      return;
    }

    console.log(`[api] Manifest submitted: ${manifest.manifest_id}`);

    const executionPromise = engine.execute(manifest);

    // Small manifests: synchronous. Large: async with 202.
    if (manifest.plan.waves.length <= 2) {
      const result = await executionPromise;
      res.json(result);
      return;
    }

    res.status(202).json({
      queued: true,
      manifest_id: manifest.manifest_id,
      shift_id: manifest.shift_id,
      received_at: new Date().toISOString(),
      message: "Manifest accepted — monitor via GET /events SSE stream.",
    });

    executionPromise.catch((err) => {
      console.error(`[api] Background execution failed for ${manifest.manifest_id}:`, err);
    });
  } catch (err) {
    console.error("[api] Manifest submission error:", err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Internal error" });
  }
});

// ---------------------------------------------------------------------------
// POST /api/emergency-stop — Kill switch
// ---------------------------------------------------------------------------
app.post("/api/emergency-stop", async (_req: Request, res: Response) => {
  console.log("[api] EMERGENCY STOP triggered");
  const result = await engine.emergencyStop();
  res.json({ emergency_stop: true, ...result, timestamp: new Date().toISOString() });
});

// ---------------------------------------------------------------------------
// GET /api/squads — List active squads
// ---------------------------------------------------------------------------
app.get("/api/squads", (_req: Request, res: Response) => {
  const status = engine.getStatus();
  res.json({ squads: status.active_squads });
});

// ---------------------------------------------------------------------------
// Graceful shutdown
// ---------------------------------------------------------------------------
process.on("SIGTERM", async () => {
  console.log("[chickenhawk-core] SIGTERM — shutting down gracefully");
  await engine.shutdown();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("[chickenhawk-core] SIGINT — shutting down");
  await engine.shutdown();
  process.exit(0);
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`  Chicken Hawk Core — A.I.M.S. Execution Engine v1.0.0`);
  console.log(`  Port: ${PORT}`);
  console.log(`  Endpoints:`);
  console.log(`    GET  /health`);
  console.log(`    GET  /status`);
  console.log(`    GET  /events (SSE)`);
  console.log(`    POST /api/manifest`);
  console.log(`    POST /api/emergency-stop`);
  console.log(`    GET  /api/squads`);
  console.log(`${"=".repeat(60)}\n`);
});
