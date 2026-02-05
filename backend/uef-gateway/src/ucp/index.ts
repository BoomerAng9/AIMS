/**
 * Universal Commerce Protocol (UCP)
 * Models for Cost, Quotes, and Settlements
 */

export interface LUCComponentEstimate {
  componentName: string; // e.g., "Frontend", "Backend"
  tokens: number;
  usd: number;
  model: string; // e.g., "kimi-k2.5", "gemini-3-flash-thinking"
}

export interface LUCCostEstimate {
  totalUsd: number;
  totalTokens: number;
  breakdown: LUCComponentEstimate[];
  byteRoverDiscountApplied: boolean;
  byteRoverSavingsUsd: number;
}

export interface UCPQuote {
  quoteId: string;
  validForSeconds: number;
  variants: {
    name: string; // e.g., "Fast & Cheap", "High Quality"
    estimate: LUCCostEstimate;
  }[];
}

export interface UCPSettlement {
  settlementId: string;
  taskId: string;
  finalCostUsd: number;
  paid: boolean;
  receiptUrl?: string; // Bamaram Receipt
}
