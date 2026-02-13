// frontend/lib/luc/luc.stub.ts

export interface LucEstimate {
  totalUsd: number;
  totalTokens: number;
  breakdown: {
    label: string;
    usd: number;
    tokens: number;
  }[];
  modelOptions: {
    name: string;
    description: string;
    costMultiplier: number;
  }[];
}

export function getLucEstimateStub(query: string = "default"): LucEstimate {
  return {
    totalUsd: 12.45,
    totalTokens: 450000,
    breakdown: [
      { label: "ACHEEVY Orchestration", usd: 4.50, tokens: 150000 },
      { label: "Boomer_Ang Task Execution", usd: 6.20, tokens: 250000 },
      { label: "ByteRover Memory & Storage", usd: 1.75, tokens: 50000 },
    ],
    modelOptions: [
      { name: "Gemini 3 Flash Thinking", description: "Default, fast, efficient", costMultiplier: 1 },
      { name: "Kimi K2.5", description: "Complex business reasoning", costMultiplier: 1.5 },
      { name: "Claude Opus 4.6", description: "Elite agents, 1M context, adaptive thinking", costMultiplier: 3 },
    ]
  };
}
