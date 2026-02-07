// frontend/lib/luc/luc-client.ts
// Live LUC client that fetches estimates from the UEF Gateway via the ACP proxy.

import { LucEstimate } from "./luc.stub";

interface ACPQuoteVariant {
  name: string;
  estimate: {
    totalUsd: number;
    totalTokens: number;
    breakdown: {
      componentName: string;
      tokens: number;
      usd: number;
      model: string;
    }[];
    byteRoverDiscountApplied: boolean;
    byteRoverSavingsUsd: number;
  };
}

interface ACPResponse {
  reqId: string;
  status: string;
  message: string;
  quote?: {
    quoteId: string;
    validForSeconds: number;
    variants: ACPQuoteVariant[];
  };
}

/**
 * Fetches a live LUC estimate from the UEF Gateway.
 * Maps the UCP quote format to the frontend LucEstimate shape.
 */
export { getLucEstimateLive as fetchRealLucQuote };

export async function getLucEstimateLive(query: string): Promise<LucEstimate> {
  const res = await fetch("/api/acp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: query,
      intent: "ESTIMATE_ONLY",
      userId: "anon",
    }),
  });

  if (!res.ok) {
    throw new Error(`LUC fetch failed: ${res.statusText}`);
  }

  const data: ACPResponse = await res.json();

  if (!data.quote || !data.quote.variants.length) {
    throw new Error("No quote returned from UEF Gateway");
  }

  // Use the first variant as the primary estimate
  const primary = data.quote.variants[0];

  return {
    totalUsd: primary.estimate.totalUsd,
    totalTokens: primary.estimate.totalTokens,
    breakdown: primary.estimate.breakdown.map((b) => ({
      label: b.componentName,
      usd: b.usd,
      tokens: b.tokens,
    })),
    modelOptions: data.quote.variants.map((v) => ({
      name: v.name,
      description: `${v.estimate.totalTokens.toLocaleString()} tokens, $${v.estimate.totalUsd.toFixed(4)}`,
      costMultiplier: v.estimate.totalUsd / primary.estimate.totalUsd || 1,
    })),
  };
}
