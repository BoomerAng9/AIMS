/**
 * ORACLE 8-Gates Verification Framework — typed contracts
 * =======================================================
 * Dedicated types for the Oracle pre-flight checks. Keeps the shape
 * of `spec` and `output` explicit so gate functions are type-safe
 * instead of using `any`.
 *
 * Why not reuse ACPStandardizedRequest / ACPResponse from ../acp/types?
 * Because the Oracle accepts a projection — a subset of fields it
 * actually reads. Defining a narrow `OracleSpec` / `OracleOutput`:
 *   - lets tests construct minimal inputs without building full ACP shapes
 *   - makes it obvious at a glance which fields the gates depend on
 *   - decouples the gates from ACP versioning
 *
 * Callers in the main ACP path MUST still build these from valid ACP
 * types — the Oracle trusts the shape but never reaches back into the
 * broader ACP object.
 */

import type { ACPIntent } from '../acp/types';

// ─── Inputs ──────────────────────────────────────────────────────────

/**
 * Minimal spec shape the Oracle inspects.
 * Every field is optional at the type level — the Technical / Strategy /
 * Documentation gates enforce requirements at runtime and fail closed
 * if something is missing or the wrong type.
 */
export interface OracleSpec {
  /** Raw user query or NL intent. Normalized at the top of runGates. */
  query?: unknown;
  /** High-level intent classification. Must be a valid ACPIntent. */
  intent?: unknown;
  /** End-user id for rate/abuse scoping. 'guest' is a literal sentinel. */
  userId?: unknown;
  /** Optional budget envelope for the Effort gate. */
  budget?: unknown;
  /** Arbitrary metadata — not inspected by any gate. */
  metadata?: Record<string, unknown>;
}

/**
 * The normalized spec shape after runGates() runs its type guards.
 * Guaranteed-safe string fields — gates operate on this, not OracleSpec.
 */
export interface NormalizedSpec {
  query: string;
  intent: ACPIntent | 'UNKNOWN';
  userId: string;
  budget?: { maxUsd?: number };
}

// ─── Outputs ─────────────────────────────────────────────────────────

export interface OracleQuoteVariantEstimate {
  totalTokens: number;
  totalUsd: number;
}

export interface OracleQuoteVariant {
  model?: string;
  estimate?: OracleQuoteVariantEstimate;
  /** Some callers flatten the estimate onto the variant itself. */
  totalTokens?: number;
  totalUsd?: number;
}

export interface OracleQuote {
  variants?: OracleQuoteVariant[];
  complexityMultiplier?: number;
}

/**
 * Minimal output shape the Oracle inspects. Judge + Effort read this.
 */
export interface OracleOutput {
  quote?: OracleQuote;
}

// ─── Public result ───────────────────────────────────────────────────

export interface OracleResult {
  passed: boolean;
  /** 0-100 weighted score across all gates */
  score: number;
  /** One entry per failed gate: "GateName: reason" */
  gateFailures: string[];
  /** Non-blocking advisory messages from any gate */
  warnings: string[];
}

// ─── Internal gate shape ─────────────────────────────────────────────

/**
 * Discriminated union — if `passed: false`, `reason` is required.
 * Prevents the "failed gate with no reason" footgun that an optional
 * `reason?` field allowed.
 */
export type GateCheckResult =
  | { passed: true; warnings?: string[] }
  | { passed: false; reason: string; warnings?: string[] };

export interface GateCheck {
  name: string;
  weight: number;
  run: (spec: NormalizedSpec, output: OracleOutput) => GateCheckResult;
}
