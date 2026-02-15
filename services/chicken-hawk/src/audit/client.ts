// =============================================================================
// Chicken Hawk — Audit Client
// Emits immutable events to chickenhawk-audit service.
// Every action, every outcome, every hash — logged.
// =============================================================================

import type { AuditEvent, AuditEventType } from "../types";
import { generateEventId } from "../lib/crypto";

interface AuditEventInput {
  event_type: AuditEventType;
  shift_id: string;
  manifest_id: string;
  action: string;
  status: string;
  squad_id?: string;
  lil_hawk_id?: string;
  input_hash?: string;
  output_hash?: string;
  duration_ms?: number;
  luc_cost_usd?: number;
  policy_ref?: string;
  approved_by?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

export class AuditClient {
  private auditUrl: string;
  private buffer: AuditEvent[] = [];
  private flushInterval: ReturnType<typeof setInterval> | null = null;

  constructor(auditUrl?: string) {
    this.auditUrl = auditUrl || process.env.AUDIT_URL || "http://chickenhawk-audit:4003";
    // Flush buffer every 2 seconds
    this.flushInterval = setInterval(() => this.flush(), 2000);
  }

  /**
   * Emit an audit event. Buffered and flushed in batches.
   */
  async emit(input: AuditEventInput): Promise<void> {
    const event: AuditEvent = {
      event_id: generateEventId(),
      timestamp: new Date().toISOString(),
      ...input,
    };

    this.buffer.push(event);

    // Log locally as well — defense in depth
    console.log(`[audit] ${event.event_type} | ${event.shift_id} | ${event.action} | ${event.status}`);

    // Flush immediately for critical events
    if (isCritical(event.event_type)) {
      await this.flush();
    }
  }

  /**
   * Flush buffered events to the audit service
   */
  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const batch = [...this.buffer];
    this.buffer = [];

    try {
      const res = await fetch(`${this.auditUrl}/api/events/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events: batch }),
        signal: AbortSignal.timeout(5000),
      });

      if (!res.ok) {
        // Re-buffer on failure — events must not be lost
        this.buffer.unshift(...batch);
        console.error(`[audit] Flush failed: ${res.status} — ${batch.length} events re-buffered`);
      }
    } catch {
      // Re-buffer on network failure
      this.buffer.unshift(...batch);
      console.error(`[audit] Audit service unavailable — ${batch.length} events re-buffered`);
    }
  }

  /**
   * Get all buffered events (for local inspection)
   */
  getBuffer(): AuditEvent[] {
    return [...this.buffer];
  }

  /**
   * Shutdown — flush remaining events
   */
  async shutdown(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    await this.flush();
  }
}

function isCritical(type: AuditEventType): boolean {
  return [
    "emergency_stop",
    "budget_exceeded",
    "shift_failed",
    "rollback_initiated",
  ].includes(type);
}
