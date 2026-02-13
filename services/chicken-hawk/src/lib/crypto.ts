// =============================================================================
// Chicken Hawk — Crypto Utilities
// SHA-256 hashing for evidence proofs and attestation.
// =============================================================================

import { createHash, randomUUID } from "crypto";

export function sha256(data: string | Buffer): string {
  return createHash("sha256").update(data).digest("hex");
}

export function generateId(prefix: string): string {
  const short = randomUUID().split("-")[0];
  return `${prefix}-${short}`;
}

export function generateEventId(): string {
  return generateId("EVT");
}

export function generateEvidenceId(): string {
  return generateId("EVC");
}
