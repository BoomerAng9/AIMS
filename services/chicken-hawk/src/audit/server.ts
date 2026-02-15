// =============================================================================
// Chicken Hawk — Audit Service (port 4003)
// Immutable event log + evidence locker.
// Flight recorder with 90-day retention.
//
// Integrates with Common_Chronicle for structured timeline generation.
//
// Endpoints:
//   GET  /health               — Health check
//   POST /api/events/batch     — Receive batch of audit events
//   GET  /api/events/:shift_id — Get events for a shift
//   GET  /api/evidence/:shift_id — Get evidence for a shift
//   GET  /api/timeline/:shift_id — Get structured timeline
//   GET  /api/stats            — Global audit statistics
// =============================================================================

import express, { Request, Response } from "express";
import { writeFileSync, mkdirSync, existsSync, readFileSync, readdirSync } from "fs";
import { join } from "path";
import type { AuditEvent, EvidenceLockerItem } from "../types";
import { generateEvidenceId, sha256 } from "../lib/crypto";

const app = express();
const PORT = parseInt(process.env.PORT || "4003", 10);
const startTime = Date.now();
const EVIDENCE_DIR = process.env.EVIDENCE_DIR || "/data/evidence";
const RETENTION_DAYS = parseInt(process.env.RETENTION_DAYS || "90", 10);

// In-memory event store (backed by file system for persistence)
const eventStore: Map<string, AuditEvent[]> = new Map();
const evidenceStore: Map<string, EvidenceLockerItem[]> = new Map();
let totalEvents = 0;

// Ensure evidence directory exists
if (!existsSync(EVIDENCE_DIR)) {
  mkdirSync(EVIDENCE_DIR, { recursive: true });
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
app.use(express.json({ limit: "5mb" }));
app.use((_req: Request, res: Response, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
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
    service: "chickenhawk-audit",
    version: "1.0.0",
    uptime_seconds: Math.floor((Date.now() - startTime) / 1000),
    total_events: totalEvents,
    active_shifts: eventStore.size,
    retention_days: RETENTION_DAYS,
  });
});

// ---------------------------------------------------------------------------
// POST /api/events/batch — Receive audit events (from chickenhawk-core)
// ---------------------------------------------------------------------------
app.post("/api/events/batch", (req: Request, res: Response) => {
  const { events } = req.body as { events: AuditEvent[] };

  if (!events || !Array.isArray(events)) {
    res.status(400).json({ error: "Expected { events: AuditEvent[] }" });
    return;
  }

  let stored = 0;
  for (const event of events) {
    const shiftId = event.shift_id || "unknown";

    if (!eventStore.has(shiftId)) {
      eventStore.set(shiftId, []);
    }
    eventStore.get(shiftId)!.push(event);
    totalEvents++;
    stored++;

    // Persist to filesystem (append-only log)
    persistEvent(shiftId, event);
  }

  res.json({ stored, total: totalEvents });
});

// ---------------------------------------------------------------------------
// GET /api/events/:shift_id — Retrieve events for a shift
// ---------------------------------------------------------------------------
app.get("/api/events/:shift_id", (req: Request, res: Response) => {
  const { shift_id } = req.params;
  const events = eventStore.get(shift_id) || loadEventsFromDisk(shift_id);
  res.json({ shift_id, count: events.length, events });
});

// ---------------------------------------------------------------------------
// GET /api/evidence/:shift_id — Retrieve evidence items for a shift
// ---------------------------------------------------------------------------
app.get("/api/evidence/:shift_id", (req: Request, res: Response) => {
  const { shift_id } = req.params;
  const items = evidenceStore.get(shift_id) || [];
  res.json({ shift_id, count: items.length, evidence: items });
});

// ---------------------------------------------------------------------------
// GET /api/timeline/:shift_id — Structured timeline (Common_Chronicle format)
// ---------------------------------------------------------------------------
app.get("/api/timeline/:shift_id", (req: Request, res: Response) => {
  const { shift_id } = req.params;
  const events = eventStore.get(shift_id) || loadEventsFromDisk(shift_id);

  // Generate structured timeline from events
  const timeline = events.map((event) => ({
    timestamp: event.timestamp,
    type: event.event_type,
    actor: event.lil_hawk_id || event.squad_id || "chickenhawk-core",
    action: event.action,
    status: event.status,
    duration_ms: event.duration_ms,
    cost_usd: event.luc_cost_usd,
    details: event.metadata,
    evidence: {
      input_hash: event.input_hash,
      output_hash: event.output_hash,
    },
  }));

  res.json({
    shift_id,
    generated_at: new Date().toISOString(),
    event_count: timeline.length,
    timeline,
    summary: generateSummary(events),
  });
});

// ---------------------------------------------------------------------------
// GET /api/stats — Global audit statistics
// ---------------------------------------------------------------------------
app.get("/api/stats", (_req: Request, res: Response) => {
  const shifts = Array.from(eventStore.keys());
  const allEvents = Array.from(eventStore.values()).flat();

  res.json({
    total_events: totalEvents,
    active_shifts: shifts.length,
    events_by_type: countByField(allEvents, "event_type"),
    events_by_status: countByField(allEvents, "status"),
    total_luc_cost_usd: allEvents.reduce((sum, e) => sum + (e.luc_cost_usd || 0), 0),
    retention_days: RETENTION_DAYS,
    evidence_dir: EVIDENCE_DIR,
  });
});

// ---------------------------------------------------------------------------
// Persistence helpers
// ---------------------------------------------------------------------------
function persistEvent(shiftId: string, event: AuditEvent): void {
  try {
    const shiftDir = join(EVIDENCE_DIR, shiftId);
    if (!existsSync(shiftDir)) {
      mkdirSync(shiftDir, { recursive: true });
    }

    const logFile = join(shiftDir, "events.jsonl");
    writeFileSync(logFile, JSON.stringify(event) + "\n", { flag: "a" });
  } catch (err) {
    console.error(`[audit] Failed to persist event: ${err}`);
  }
}

function loadEventsFromDisk(shiftId: string): AuditEvent[] {
  try {
    const logFile = join(EVIDENCE_DIR, shiftId, "events.jsonl");
    if (!existsSync(logFile)) return [];

    const lines = readFileSync(logFile, "utf-8").split("\n").filter(Boolean);
    const events = lines.map((line) => JSON.parse(line) as AuditEvent);

    // Cache in memory
    eventStore.set(shiftId, events);
    return events;
  } catch {
    return [];
  }
}

function generateSummary(events: AuditEvent[]): Record<string, unknown> {
  if (events.length === 0) return { empty: true };

  const first = events[0];
  const last = events[events.length - 1];
  const failures = events.filter((e) => e.status === "failed");
  const totalCost = events.reduce((sum, e) => sum + (e.luc_cost_usd || 0), 0);
  const totalDuration = events.reduce((sum, e) => sum + (e.duration_ms || 0), 0);

  return {
    shift_id: first.shift_id,
    manifest_id: first.manifest_id,
    started_at: first.timestamp,
    ended_at: last.timestamp,
    total_events: events.length,
    total_failures: failures.length,
    total_luc_cost_usd: totalCost,
    total_duration_ms: totalDuration,
    outcome: failures.length === 0 ? "success" : "had_failures",
  };
}

function countByField(events: AuditEvent[], field: keyof AuditEvent): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const event of events) {
    const value = String(event[field] || "unknown");
    counts[value] = (counts[value] || 0) + 1;
  }
  return counts;
}

// ---------------------------------------------------------------------------
// Retention cleanup (run every hour)
// ---------------------------------------------------------------------------
setInterval(() => {
  try {
    const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
    for (const [shiftId, events] of eventStore) {
      if (events.length > 0) {
        const lastEvent = events[events.length - 1];
        if (new Date(lastEvent.timestamp).getTime() < cutoff) {
          eventStore.delete(shiftId);
          console.log(`[audit] Retention cleanup: removed shift ${shiftId}`);
        }
      }
    }
  } catch (err) {
    console.error("[audit] Retention cleanup error:", err);
  }
}, 3600000);

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
app.listen(PORT, "0.0.0.0", () => {
  console.log(`[chickenhawk-audit] Audit & Evidence Locker on port ${PORT}`);
  console.log(`[chickenhawk-audit] Evidence dir: ${EVIDENCE_DIR}`);
  console.log(`[chickenhawk-audit] Retention: ${RETENTION_DAYS} days`);
});
