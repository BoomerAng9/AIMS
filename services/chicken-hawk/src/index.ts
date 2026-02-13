import express, { Request, Response } from "express";
import { mimOrchestrator } from "./containers/mim-orchestrator";
import { boomerangScout } from "./containers/boomerang-scout";
import { oracleVerifier } from "./containers/oracle-verifier";
import { bamamaramGenerator } from "./containers/bamaram-generator";

const app = express();
const PORT = parseInt(process.env.PORT || "8081", 10);
const startTime = Date.now();

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
app.use(express.json());

// CORS headers for internal compose network
app.use((_req: Request, res: Response, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (_req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});

// ---------------------------------------------------------------------------
// GET /health - Simple health check
// ---------------------------------------------------------------------------
app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "chickenhawk-core",
    uptime: Math.floor((Date.now() - startTime) / 1000),
  });
});

// ---------------------------------------------------------------------------
// GET /status - Full service status with container statuses
// ---------------------------------------------------------------------------
app.get("/status", (_req: Request, res: Response) => {
  res.json({
    service: "chickenhawk-core",
    status: "running",
    uptime: Math.floor((Date.now() - startTime) / 1000),
    track: "Track 1 (P0, heavy)",
    containers: [
      mimOrchestrator(),
      boomerangScout(),
      oracleVerifier(),
      bamamaramGenerator(),
    ],
  });
});

// ---------------------------------------------------------------------------
// GET /events - SSE endpoint broadcasting build events every 5s
// ---------------------------------------------------------------------------
app.get("/events", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  // Send initial connection event
  res.write(
    `data: ${JSON.stringify({ type: "connected", ts: new Date().toISOString(), service: "chickenhawk-core" })}\n\n`
  );

  // Heartbeat every 5 seconds
  const interval = setInterval(() => {
    const event = {
      type: "heartbeat",
      ts: new Date().toISOString(),
      service: "chickenhawk-core",
    };
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  }, 5000);

  // Clean up on client disconnect
  _req.on("close", () => {
    clearInterval(interval);
    res.end();
  });
});

// ---------------------------------------------------------------------------
// POST /dispatch - Stub dispatch handler
// ---------------------------------------------------------------------------
app.post("/dispatch", (_req: Request, res: Response) => {
  res.json({
    queued: true,
    jobId: "TODO",
    receivedAt: new Date().toISOString(),
    service: "chickenhawk-core",
  });
});

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
app.listen(PORT, "0.0.0.0", () => {
  console.log(`[chickenhawk-core] listening on port ${PORT}`);
  console.log(`[chickenhawk-core] health: http://127.0.0.1:${PORT}/health`);
  console.log(`[chickenhawk-core] status: http://127.0.0.1:${PORT}/status`);
  console.log(`[chickenhawk-core] events: http://127.0.0.1:${PORT}/events`);
  console.log(`[chickenhawk-core] dispatch: POST http://127.0.0.1:${PORT}/dispatch`);
});
