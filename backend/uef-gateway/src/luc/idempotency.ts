/**
 * LUC allocator — Stripe webhook idempotency.
 *
 * "Process this event exactly once." markEventProcessed does an atomic
 * INSERT OR IGNORE on the event id and reports whether THIS call won the insert.
 * A duplicate Stripe delivery (same event.id) loses and is skipped — so a BMC
 * reload can't double-credit and a plan can't double-provision. unmarkEvent
 * releases the claim if provisioning failed, so a Stripe retry can re-process.
 *
 * Depends only on the structural SqlDb (no native import) — prod passes
 * better-sqlite3, tests pass node:sqlite.
 *
 * PROPRIETARY — A.I.M.S.
 */

import { SqlDb } from './sqlite-ledger';

/** Claim an event id. Returns true if newly claimed, false if already processed. */
export function markEventProcessed(db: SqlDb, eventId: string, nowIso?: string): boolean {
  const ts = nowIso ?? new Date().toISOString();
  const r = db.prepare('INSERT OR IGNORE INTO luc_processed_events (event_id, ts) VALUES (?, ?)').run(eventId, ts);
  return Number(r.changes) === 1;
}

/** Release a claim (call when provisioning failed, so a retry can re-process). */
export function unmarkEvent(db: SqlDb, eventId: string): void {
  db.prepare('DELETE FROM luc_processed_events WHERE event_id = ?').run(eventId);
}
