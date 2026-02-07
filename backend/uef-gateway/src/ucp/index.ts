/**
 * Universal Commerce Protocol (UCP)
 * Models for Cost, Quotes, and Settlements
 *
 * Unit Anchor: TOKENS
 * A.I.M.S. anchors on tokens as the billing unit because:
 *   - Transparent: developers understand tokens (like Bolt.new, Factory.ai)
 *   - ByteRover visible: savings show as measurable token reduction
 *   - Task multipliers handle complexity abstraction
 *   - No opaque credit systems hiding costs
 *
 * Flow: Raw Tokens → ByteRover Optimization → Effective Tokens → Task Multiplier → Metered Tokens → Cost
 */

export interface LUCComponentEstimate {
  componentName: string; // e.g., "Planning (AVVA NOON)"
  tokens: number;
  usd: number;
  model: string; // e.g., "claude-sonnet-4.5", "claude-opus-4.6"
}

export interface ByteRoverSavings {
  applied: boolean;
  relevance: number;         // 0.0–1.0
  discountPct: number;       // 0–0.40
  tokensSaved: number;       // absolute token reduction
  savingsUsd: number;        // dollar savings
  preSavingsTokens: number;  // tokens before ByteRover
  postSavingsTokens: number; // tokens after ByteRover
}

export interface LUCCostEstimate {
  totalUsd: number;
  totalTokens: number;
  breakdown: LUCComponentEstimate[];
  byteRoverDiscountApplied: boolean;
  byteRoverSavingsUsd: number;
  byteRover: ByteRoverSavings;
}

export interface UCPQuote {
  quoteId: string;
  validForSeconds: number;
  variants: {
    name: string; // e.g., "Fast (Sonnet 4.5)", "Premium (Opus 4.6)"
    estimate: LUCCostEstimate;
  }[];
  taskType?: string;
  taskMultiplier?: number;
}

export interface UCPSettlement {
  settlementId: string;
  taskId: string;
  finalCostUsd: number;
  paid: boolean;
  receiptUrl?: string; // Bamaram Receipt
  byteRoverSavings?: ByteRoverSavings;
}
