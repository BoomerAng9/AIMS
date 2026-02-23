/**
 * mHC: Manifold-Constrained Hyper-Connections
 * Research Module — A.I.M.S. Model Intelligence Library
 *
 * Paper: "mHC: Manifold-Constrained Hyper-Connections" (DeepSeek-AI, Dec 2025)
 * arXiv: https://arxiv.org/abs/2512.24880
 *
 * This module provides:
 *  1. TypeScript type definitions for the mHC architecture
 *  2. A pure-math reference of the Sinkhorn-Knopp projection
 *  3. Configuration presets matching the paper's experiments
 *  4. Integration points for ACHEEVY's Model Garden and PersonaPlex
 *
 * The actual neural-network training happens in Python (see mhc_layer.py).
 * This TypeScript module is the catalog / orchestration layer that lets
 * ACHEEVY reason about, configure, and deploy mHC-enhanced models.
 */

// ─── Core Types ──────────────────────────────────────────────────────────────

export interface MHCConfig {
  /** Number of parallel residual streams (paper default: 4) */
  numStreams: number;
  /** Sinkhorn-Knopp iterations for doubly-stochastic projection (paper default: 20) */
  sinkhornIters: number;
  /** Temperature for Sinkhorn log-domain projection */
  sinkhornTau: number;
  /** Projection method for H_res */
  hResProjection: 'sinkhorn' | 'orthostochastic';
  /** Whether to mix H_res with identity: H_res = (1-α)I + αS */
  residualIdentityMix: boolean;
  /** Initial α for identity mixing (paper: 0.01) */
  residualAlpha: number;
  /** Feature dimension of the model */
  dim: number;
  /** Hidden dimension for the residual MLP (default: 4 * dim) */
  hiddenDim?: number;
  /** Dropout rate */
  dropout: number;
}

export interface MHCLayerStats {
  /** Minimum entry in H_res (should be ≥ 0 for doubly stochastic) */
  hResMin: number;
  /** Mean row sum of H_res (should be ≈ 1.0) */
  hResRowSum: number;
  /** Mean column sum of H_res (should be ≈ 1.0) */
  hResColSum: number;
  /** Maximum gain magnitude across layers */
  maxGainMagnitude: number;
  /** Training loss at current step */
  trainingLoss: number;
}

export interface MHCBenchmarkResult {
  modelSize: string;
  dataset: string;
  baseline: number;
  hcScore: number;
  mhcScore: number;
  improvement: string;
}

export interface MHCModelVariant {
  name: string;
  params: string;
  architecture: 'dense' | 'moe';
  config: MHCConfig;
  trainingTokens: string;
  benchmarks: MHCBenchmarkResult[];
}

// ─── Mathematical Reference ──────────────────────────────────────────────────

/**
 * Sinkhorn-Knopp algorithm (log-domain, numerically stable).
 *
 * Projects an arbitrary square matrix onto the Birkhoff polytope
 * (the set of doubly stochastic matrices: non-negative, rows & cols sum to 1).
 *
 * This is a pure TypeScript reference for visualization / debugging.
 * Production training uses the PyTorch CUDA implementation.
 *
 * Mathematical properties of doubly stochastic matrices:
 *   1. Norm Preservation: spectral norm ≤ 1 → non-expansive mapping
 *   2. Compositional Closure: product of DS matrices is DS → stable across layers
 *   3. Geometric: convex hull of permutation matrices → controlled feature mixing
 */
export function sinkhornKnopp(logits: number[][], iters: number = 20, tau: number = 0.05): number[][] {
  const n = logits.length;

  // Scale by temperature
  const Z = logits.map(row => row.map(v => v / tau));

  const logMarginal = -Math.log(n);
  const u = new Array(n).fill(0);
  const v = new Array(n).fill(0);

  for (let iter = 0; iter < iters; iter++) {
    // Update u: row normalization in log domain
    for (let i = 0; i < n; i++) {
      let logSumExp = -Infinity;
      for (let j = 0; j < n; j++) {
        const val = Z[i][j] + v[j];
        logSumExp = logAddExp(logSumExp, val);
      }
      u[i] = logMarginal - logSumExp;
    }

    // Update v: column normalization in log domain
    for (let j = 0; j < n; j++) {
      let logSumExp = -Infinity;
      for (let i = 0; i < n; i++) {
        const val = Z[i][j] + u[i];
        logSumExp = logAddExp(logSumExp, val);
      }
      v[j] = logMarginal - logSumExp;
    }
  }

  // Construct doubly stochastic matrix
  const result: number[][] = [];
  for (let i = 0; i < n; i++) {
    result[i] = [];
    for (let j = 0; j < n; j++) {
      result[i][j] = Math.exp(Z[i][j] + u[i] + v[j]) * n;
    }
  }

  return result;
}

function logAddExp(a: number, b: number): number {
  if (a === -Infinity) return b;
  if (b === -Infinity) return a;
  const max = Math.max(a, b);
  return max + Math.log(Math.exp(a - max) + Math.exp(b - max));
}

/**
 * Verify that a matrix is doubly stochastic (rows and columns sum to ~1).
 */
export function verifyDoublyStochastic(matrix: number[][], tolerance: number = 1e-4): {
  valid: boolean;
  rowSums: number[];
  colSums: number[];
  minEntry: number;
} {
  const n = matrix.length;
  const rowSums = matrix.map(row => row.reduce((a, b) => a + b, 0));
  const colSums: number[] = [];
  let minEntry = Infinity;

  for (let j = 0; j < n; j++) {
    let sum = 0;
    for (let i = 0; i < n; i++) {
      sum += matrix[i][j];
      minEntry = Math.min(minEntry, matrix[i][j]);
    }
    colSums.push(sum);
  }

  const rowOk = rowSums.every(s => Math.abs(s - 1) < tolerance);
  const colOk = colSums.every(s => Math.abs(s - 1) < tolerance);
  const nonNeg = minEntry >= -tolerance;

  return { valid: rowOk && colOk && nonNeg, rowSums, colSums, minEntry };
}

// ─── Paper Configuration Presets ─────────────────────────────────────────────

/**
 * The four model variants from the paper's experiments.
 */
export const MHC_MODEL_VARIANTS: MHCModelVariant[] = [
  {
    name: 'mHC-3B-Scaling',
    params: '3B',
    architecture: 'moe',
    config: {
      numStreams: 4,
      sinkhornIters: 20,
      sinkhornTau: 0.05,
      hResProjection: 'sinkhorn',
      residualIdentityMix: false,
      residualAlpha: 0.01,
      dim: 2048,
      dropout: 0.0,
    },
    trainingTokens: '~100B (compute scaling)',
    benchmarks: [],
  },
  {
    name: 'mHC-3B-Token',
    params: '3B',
    architecture: 'moe',
    config: {
      numStreams: 4,
      sinkhornIters: 20,
      sinkhornTau: 0.05,
      hResProjection: 'sinkhorn',
      residualIdentityMix: false,
      residualAlpha: 0.01,
      dim: 2048,
      dropout: 0.0,
    },
    trainingTokens: '1T (token scaling)',
    benchmarks: [],
  },
  {
    name: 'mHC-9B',
    params: '9B',
    architecture: 'moe',
    config: {
      numStreams: 4,
      sinkhornIters: 20,
      sinkhornTau: 0.05,
      hResProjection: 'sinkhorn',
      residualIdentityMix: false,
      residualAlpha: 0.01,
      dim: 3072,
      dropout: 0.0,
    },
    trainingTokens: '~300B (compute scaling)',
    benchmarks: [],
  },
  {
    name: 'mHC-27B',
    params: '27B',
    architecture: 'moe',
    config: {
      numStreams: 4,
      sinkhornIters: 20,
      sinkhornTau: 0.05,
      hResProjection: 'sinkhorn',
      residualIdentityMix: false,
      residualAlpha: 0.01,
      dim: 4096,
      dropout: 0.0,
    },
    trainingTokens: 'proportional to params',
    benchmarks: [
      { modelSize: '27B', dataset: 'BBH', baseline: 43.8, hcScore: 48.9, mhcScore: 51.0, improvement: '+2.1 vs HC, +7.2 vs baseline' },
      { modelSize: '27B', dataset: 'DROP', baseline: 32.5, hcScore: 34.2, mhcScore: 36.5, improvement: '+2.3 vs HC' },
      { modelSize: '27B', dataset: 'GSM8K', baseline: 54.1, hcScore: 57.3, mhcScore: 59.2, improvement: '+1.9 vs HC' },
      { modelSize: '27B', dataset: 'MMLU', baseline: 62.7, hcScore: 64.1, mhcScore: 65.8, improvement: '+1.7 vs HC' },
    ],
  },
];

// ─── Key Insights (for ACHEEVY reasoning) ────────────────────────────────────

export const MHC_KEY_INSIGHTS = {
  problem: 'Standard Hyper-Connections (HC) expand the residual stream to n parallel lanes but compromise the identity mapping property. At 27B scale, unconstrained HC causes signal gains exceeding 3000×, leading to catastrophic divergence.',

  solution: 'mHC constrains the residual mixing matrix H_res to be doubly stochastic (Birkhoff polytope) via Sinkhorn-Knopp projection. This restores the identity mapping property while keeping the expanded residual stream.',

  mechanism: {
    birkhoffPolytope: 'The set of n×n doubly stochastic matrices: all entries ≥ 0, all rows sum to 1, all columns sum to 1. Equivalently, the convex hull of permutation matrices.',
    sinkhornKnopp: 'A 1967 algorithm that iteratively normalizes rows and columns of a non-negative matrix until it converges to a doubly stochastic matrix. mHC uses 20 iterations in log-domain for numerical stability.',
    threeProperties: [
      'Norm Preservation: spectral norm ≤ 1 → non-expansive → no gradient explosion',
      'Compositional Closure: product of DS matrices is DS → stable across 100+ layers',
      'Geometric: convex combination of permutations → controlled feature mixing',
    ],
  },

  layerFormula: 'x_{l+1} = H_res^l · x_l + (H_post^l)^T · F(H_pre^l · x_l, W_l)',

  constraints: {
    hRes: 'Doubly stochastic via Sinkhorn-Knopp (Birkhoff polytope)',
    hPre: 'Non-negative via softmax',
    hPost: 'Non-negative via softmax',
  },

  overhead: '6.7% training time overhead (Sinkhorn operates on small n×n matrices, n=4 typically)',

  references: {
    paper: 'https://arxiv.org/abs/2512.24880',
    codeTokenbender: 'https://github.com/tokenbender/mHC-manifold-constrained-hyper-connections',
    codeCuda: 'https://github.com/AndreSlavescu/mHC.cu',
    codeResnet: 'https://github.com/Chenhao-Guan/deepseek-mhc',
    huggingface: 'https://huggingface.co/papers/2512.24880',
  },
} as const;

// ─── Integration with ACHEEVY Model Garden ───────────────────────────────────

export interface ModelGardenEntry {
  id: string;
  name: string;
  provider: string;
  architecture: string;
  connectionType: 'residual' | 'hc' | 'mhc';
  mhcConfig?: MHCConfig;
  description: string;
  status: 'research' | 'experimental' | 'production';
}

/**
 * Generate a Model Garden catalog entry for an mHC-enhanced model.
 */
export function createMHCModelEntry(
  variant: MHCModelVariant,
  overrides?: Partial<ModelGardenEntry>,
): ModelGardenEntry {
  return {
    id: `mhc-${variant.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    name: `DeepSeek ${variant.name}`,
    provider: 'DeepSeek-AI',
    architecture: `${variant.architecture.toUpperCase()} + mHC (${variant.config.numStreams} streams)`,
    connectionType: 'mhc',
    mhcConfig: variant.config,
    description: `${variant.params} parameter model with Manifold-Constrained Hyper-Connections. ${variant.trainingTokens} training tokens. Sinkhorn-Knopp projection onto Birkhoff polytope for stable multi-stream residuals.`,
    status: 'research',
    ...overrides,
  };
}
