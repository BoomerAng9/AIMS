/**
 * Model Intelligence Engine — Autonomous LLM Selection & Routing
 *
 * Not every job needs the same brain.
 *   - Code generation? Opus 4.6 (highest reasoning) with Gemini 3.1 fallback.
 *   - Quick classification? Flash. Don't waste tokens on a yes/no.
 *   - Deep research synthesis? Gemini 3.1 Pro (native logic, 2M context).
 *   - Content writing? Sonnet 4.6 (quality/cost sweet spot).
 *
 * This engine does what a smart CTO would do:
 *   1. ANALYZE the task (NLP intent, complexity, domain, urgency)
 *   2. MATCH to the best model (strengths, cost, context needs)
 *   3. SET FALLBACKS (primary → fallback → economy)
 *   4. LEARN from outcomes (which model performed best on which task)
 *
 * Integrates with:
 *   - L.I.B. (Logic layer drives model selection)
 *   - Look-Listen-Learn (LEARN phase stores model performance data)
 *   - Methodology Engine (different methodologies need different models)
 *   - Transaction Model (LUC cost tracking per model per task)
 *
 * "Use the right brain for the right job. Don't use a sledgehammer
 *  to hang a picture frame."
 */

// ---------------------------------------------------------------------------
// Model Capability Profiles
// ---------------------------------------------------------------------------

/** What a model is good at — its Subject Matter Expertise */
export interface ModelCapabilityProfile {
  id: string;                          // Short key (e.g., 'claude-opus-4.6')
  openRouterId: string;                // Full OpenRouter model ID
  name: string;
  provider: string;
  version: string;

  // ── Architecture ───────────────────────────────────────────────────────
  architecture: {
    type: 'dense' | 'moe' | 'hybrid';  // Model architecture
    activeParams?: string;               // For MoE: active params per token
    totalParams?: string;                // Total params
    contextWindow: number;               // Max tokens
    nativeModalities: string[];          // 'text', 'image', 'audio', 'video', 'code'
    nativeToolUse: boolean;              // Built-in function calling
    nativeReasoning: boolean;            // Built-in chain-of-thought / logic
  };

  // ── Strengths ──────────────────────────────────────────────────────────
  strengths: ModelStrength[];

  // ── Weaknesses ─────────────────────────────────────────────────────────
  weaknesses: string[];

  // ── Task Affinity ──────────────────────────────────────────────────────
  /** Score 0-100 for how well this model fits each task type */
  taskAffinity: Record<TaskType, number>;

  // ── Cost ───────────────────────────────────────────────────────────────
  cost: {
    inputPer1M: number;
    outputPer1M: number;
    tier: 'premium' | 'standard' | 'fast' | 'economy';
  };

  // ── Alignment ──────────────────────────────────────────────────────────
  /** How well this model aligns with AIMS' architecture principles */
  aimsAlignment: {
    logicDriven: number;     // 0-100: How well it handles structured reasoning
    instructionFollowing: number; // 0-100: Follows complex system prompts
    toolUseReliability: number;  // 0-100: Consistent function calling
    creativeProblemSolving: number; // 0-100: Novel solution generation
    codeQuality: number;     // 0-100: Code generation quality
    contextUtilization: number; // 0-100: Effectively uses long context
    consistency: number;     // 0-100: Same prompt → same quality
    costEfficiency: number;  // 0-100: Quality per dollar
  };

  // ── Methodology Fit ────────────────────────────────────────────────────
  /** Which AIMS methodologies this model is best suited for */
  methodologyFit: {
    dmaic: number;           // 0-100: Fix/improve existing systems
    dmadv: number;           // 0-100: Design new from scratch
    foster: number;          // 0-100: Nurture early ideas
    develop: number;         // 0-100: Structured build-out
    hone: number;            // 0-100: Refine and polish
    lookListenLearn: number; // 0-100: Engagement triad
  };

  // ── Metadata ───────────────────────────────────────────────────────────
  releaseDate: string;
  lastUpdated: string;
  notes: string;
}

/** A specific strength with evidence */
export interface ModelStrength {
  domain: string;
  description: string;
  evidenceBasis: string;     // Why we know this is a strength
}

/** Task types that models can be scored against */
export type TaskType =
  | 'code_generation'        // Writing new code from requirements
  | 'code_review'            // Reviewing and improving existing code
  | 'code_debugging'         // Finding and fixing bugs
  | 'architecture_design'    // System design, trade-offs
  | 'research_synthesis'     // Gathering and synthesizing research
  | 'data_analysis'          // Analyzing datasets, finding patterns
  | 'content_writing'        // Marketing copy, documentation, reports
  | 'creative_writing'       // Creative, narrative, storytelling
  | 'conversation'           // Multi-turn chat, customer-facing
  | 'classification'         // Intent detection, categorization
  | 'extraction'             // Parsing structured data from unstructured
  | 'translation'            // Language translation
  | 'summarization'          // Condensing long content
  | 'reasoning'              // Multi-step logical reasoning
  | 'math_computation'       // Calculations, proofs
  | 'planning'               // Project planning, roadmaps
  | 'image_analysis'         // Understanding images, OCR
  | 'document_analysis'      // Processing business documents
  | 'agent_orchestration'    // Coordinating multi-agent workflows
  | 'tool_use'               // Function calling, API interaction
  | 'quick_response';        // Fast, simple, low-latency needs

// ---------------------------------------------------------------------------
// Model Registry — Subject Matter Expert Profiles
// ---------------------------------------------------------------------------

const MODEL_PROFILES: ModelCapabilityProfile[] = [
  // ═══════════════════════════════════════════════════════════════════════
  // CLAUDE OPUS 4.6 — The Architect
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: 'claude-opus-4.6',
    openRouterId: 'anthropic/claude-opus-4.6',
    name: 'Claude Opus 4.6',
    provider: 'Anthropic',
    version: '4.6',
    architecture: {
      type: 'dense',
      contextWindow: 1_000_000,
      nativeModalities: ['text', 'image', 'code'],
      nativeToolUse: true,
      nativeReasoning: true,
    },
    strengths: [
      { domain: 'code_generation', description: 'Best-in-class code generation with deep architectural understanding', evidenceBasis: 'SWE-Bench verified, Anthropic benchmarks' },
      { domain: 'reasoning', description: 'Extended thinking mode enables multi-step logical chains', evidenceBasis: 'Native chain-of-thought architecture' },
      { domain: 'instruction_following', description: 'Follows complex, nested system prompts with high fidelity', evidenceBasis: 'L.I.B. prompt adherence testing' },
      { domain: 'architecture', description: 'Exceptional at system design, trade-off analysis, and technical planning', evidenceBasis: 'Architecture design pattern benchmarks' },
      { domain: 'tool_use', description: 'Reliable function calling with structured outputs', evidenceBasis: 'Anthropic tool use API v2' },
    ],
    weaknesses: [
      'Highest cost per token — not suitable for high-volume low-value tasks',
      'Slower time-to-first-token than Flash-tier models',
      'Can over-engineer solutions when simpler approach suffices',
    ],
    taskAffinity: {
      code_generation: 98, code_review: 95, code_debugging: 96, architecture_design: 98,
      research_synthesis: 88, data_analysis: 85, content_writing: 82, creative_writing: 80,
      conversation: 85, classification: 70, extraction: 80, translation: 75,
      summarization: 85, reasoning: 98, math_computation: 92, planning: 95,
      image_analysis: 80, document_analysis: 85, agent_orchestration: 95, tool_use: 96,
      quick_response: 40,
    },
    cost: { inputPer1M: 5.0, outputPer1M: 25.0, tier: 'premium' },
    aimsAlignment: {
      logicDriven: 98, instructionFollowing: 98, toolUseReliability: 96,
      creativeProblemSolving: 92, codeQuality: 98, contextUtilization: 95,
      consistency: 95, costEfficiency: 55,
    },
    methodologyFit: {
      dmaic: 90, dmadv: 95, foster: 80, develop: 98, hone: 85, lookListenLearn: 80,
    },
    releaseDate: '2025-10-01',
    lastUpdated: '2026-02-22',
    notes: 'AIMS preferred model for Buildsmith/Forge_Ang code generation and architecture. Primary for DEVELOP methodology.',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // CLAUDE SONNET 4.6 — The Workhorse
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: 'claude-sonnet-4.6',
    openRouterId: 'anthropic/claude-sonnet-4.6',
    name: 'Claude Sonnet 4.6',
    provider: 'Anthropic',
    version: '4.6',
    architecture: {
      type: 'dense',
      contextWindow: 1_000_000,
      nativeModalities: ['text', 'image', 'code'],
      nativeToolUse: true,
      nativeReasoning: true,
    },
    strengths: [
      { domain: 'balance', description: 'Best quality-to-cost ratio in the Standard tier', evidenceBasis: 'Internal A/B testing across verticals' },
      { domain: 'content', description: 'Strong at content writing, copywriting, and structured documentation', evidenceBasis: 'Chronicle_Ang output quality metrics' },
      { domain: 'conversation', description: 'Excellent conversational flow with personality adherence', evidenceBasis: 'L.I.B. personality trait inheritance testing' },
      { domain: 'code', description: 'High-quality code generation, though slightly below Opus for complex architecture', evidenceBasis: 'SWE-Bench subset testing' },
    ],
    weaknesses: [
      'Slightly less capable than Opus on complex multi-step reasoning',
      'May need more explicit prompting for edge cases',
    ],
    taskAffinity: {
      code_generation: 90, code_review: 88, code_debugging: 88, architecture_design: 85,
      research_synthesis: 85, data_analysis: 82, content_writing: 92, creative_writing: 88,
      conversation: 92, classification: 78, extraction: 82, translation: 80,
      summarization: 88, reasoning: 88, math_computation: 82, planning: 85,
      image_analysis: 78, document_analysis: 82, agent_orchestration: 85, tool_use: 90,
      quick_response: 55,
    },
    cost: { inputPer1M: 3.0, outputPer1M: 15.0, tier: 'standard' },
    aimsAlignment: {
      logicDriven: 90, instructionFollowing: 92, toolUseReliability: 90,
      creativeProblemSolving: 88, codeQuality: 90, contextUtilization: 88,
      consistency: 92, costEfficiency: 80,
    },
    methodologyFit: {
      dmaic: 85, dmadv: 85, foster: 88, develop: 88, hone: 90, lookListenLearn: 88,
    },
    releaseDate: '2025-10-01',
    lastUpdated: '2026-02-22',
    notes: 'AIMS default for ACHEEVY conversation, content writing, and general-purpose tasks. Best balance of quality and cost.',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // GEMINI 3.1 PRO — The Logician
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: 'gemini-3.1-pro',
    openRouterId: 'google/gemini-3.1-pro',
    name: 'Gemini 3.1 Pro',
    provider: 'Google',
    version: '3.1',
    architecture: {
      type: 'moe',
      contextWindow: 2_000_000,
      nativeModalities: ['text', 'image', 'audio', 'video', 'code'],
      nativeToolUse: true,
      nativeReasoning: true,
    },
    strengths: [
      { domain: 'native_reasoning', description: 'Logic is built into the model architecture — not bolted on. Uses structured reasoning natively, not memorization.', evidenceBasis: 'Google DeepMind architecture, MATH/GPQA benchmarks' },
      { domain: 'multimodal', description: 'True multimodal: text, image, audio, video in a single model — strongest multimodal coverage', evidenceBasis: 'Native architecture, not adapter-based' },
      { domain: 'context_window', description: '2M token context — largest production context window, ideal for massive codebases and document analysis', evidenceBasis: 'Google "Long Context" benchmarks' },
      { domain: 'research', description: 'Exceptional at synthesizing large volumes of information into structured analysis', evidenceBasis: 'Internal research synthesis testing' },
      { domain: 'logic', description: 'Native logical reasoning aligns with AIMS methodology engine (DMAIC/DMADV/FOSTER/DEVELOP/HONE)', evidenceBasis: 'Architecture uses reasoning tokens natively' },
      { domain: 'cost', description: 'Strong capability at lower cost than Claude Opus — excellent for high-volume reasoning tasks', evidenceBasis: 'Pricing comparison at equivalent quality tiers' },
    ],
    weaknesses: [
      'Code generation slightly below Claude Opus for complex architecture patterns',
      'Instruction following for highly nested system prompts can vary',
      'Tool use reliability slightly lower than Anthropic models',
    ],
    taskAffinity: {
      code_generation: 88, code_review: 85, code_debugging: 87, architecture_design: 88,
      research_synthesis: 96, data_analysis: 92, content_writing: 85, creative_writing: 82,
      conversation: 82, classification: 85, extraction: 88, translation: 90,
      summarization: 94, reasoning: 96, math_computation: 95, planning: 90,
      image_analysis: 92, document_analysis: 94, agent_orchestration: 85, tool_use: 85,
      quick_response: 50,
    },
    cost: { inputPer1M: 1.25, outputPer1M: 10.0, tier: 'standard' },
    aimsAlignment: {
      logicDriven: 96, instructionFollowing: 85, toolUseReliability: 82,
      creativeProblemSolving: 90, codeQuality: 88, contextUtilization: 98,
      consistency: 85, costEfficiency: 92,
    },
    methodologyFit: {
      dmaic: 95, dmadv: 92, foster: 85, develop: 88, hone: 85, lookListenLearn: 90,
    },
    releaseDate: '2026-02-01',
    lastUpdated: '2026-02-22',
    notes: 'AIMS preferred fallback for Buildsmith code gen. Primary for DMAIC methodology (logic-driven improvement). Gemini 3.1 native reasoning aligns directly with LLL and methodology engine. Best model for research synthesis and document analysis due to 2M context.',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // GEMINI 3.0 FLASH — The Speedster
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: 'gemini-3.0-flash',
    openRouterId: 'google/gemini-3.0-flash',
    name: 'Gemini 3.0 Flash',
    provider: 'Google',
    version: '3.0',
    architecture: {
      type: 'moe',
      contextWindow: 1_000_000,
      nativeModalities: ['text', 'image', 'code'],
      nativeToolUse: true,
      nativeReasoning: false,
    },
    strengths: [
      { domain: 'speed', description: 'Fastest time-to-first-token in production — ideal for routing and classification', evidenceBasis: 'Latency benchmarks' },
      { domain: 'cost', description: 'Extremely cost-effective at $0.10/M input — 50x cheaper than Opus', evidenceBasis: 'Pricing' },
      { domain: 'volume', description: 'Can handle high-volume, low-complexity tasks without budget impact', evidenceBasis: 'Production usage data' },
    ],
    weaknesses: [
      'Not suitable for complex reasoning or nuanced code generation',
      'May hallucinate on edge cases without strong grounding',
      'Limited creativity and personality adherence',
    ],
    taskAffinity: {
      code_generation: 65, code_review: 60, code_debugging: 60, architecture_design: 50,
      research_synthesis: 65, data_analysis: 70, content_writing: 60, creative_writing: 50,
      conversation: 70, classification: 88, extraction: 82, translation: 75,
      summarization: 78, reasoning: 60, math_computation: 55, planning: 55,
      image_analysis: 70, document_analysis: 72, agent_orchestration: 60, tool_use: 72,
      quick_response: 95,
    },
    cost: { inputPer1M: 0.10, outputPer1M: 0.40, tier: 'fast' },
    aimsAlignment: {
      logicDriven: 55, instructionFollowing: 70, toolUseReliability: 72,
      creativeProblemSolving: 50, codeQuality: 60, contextUtilization: 70,
      consistency: 80, costEfficiency: 98,
    },
    methodologyFit: {
      dmaic: 50, dmadv: 45, foster: 55, develop: 45, hone: 50, lookListenLearn: 70,
    },
    releaseDate: '2025-12-01',
    lastUpdated: '2026-02-22',
    notes: 'AIMS default model for routing, classification, and quick responses. The workhorse for 80% of low-complexity calls. Gateway default.',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // CLAUDE HAIKU 4.5 — The Efficient
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: 'claude-haiku-4.5',
    openRouterId: 'anthropic/claude-haiku-4.5',
    name: 'Claude Haiku 4.5',
    provider: 'Anthropic',
    version: '4.5',
    architecture: {
      type: 'dense',
      contextWindow: 200_000,
      nativeModalities: ['text', 'image', 'code'],
      nativeToolUse: true,
      nativeReasoning: false,
    },
    strengths: [
      { domain: 'extraction', description: 'Fast, reliable structured data extraction', evidenceBasis: 'Anthropic extraction benchmarks' },
      { domain: 'tool_use', description: 'Reliable function calling at low cost — good for agent dispatch', evidenceBasis: 'Anthropic tool use benchmarks' },
      { domain: 'instruction_following', description: 'Follows system prompts better than Flash-tier alternatives', evidenceBasis: 'Anthropic alignment testing' },
    ],
    weaknesses: [
      'Smaller context window than Flash/Pro models (200K vs 1M+)',
      'Not suitable for complex reasoning or architecture design',
      'Less capable at creative writing than Sonnet/Opus',
    ],
    taskAffinity: {
      code_generation: 72, code_review: 70, code_debugging: 68, architecture_design: 55,
      research_synthesis: 68, data_analysis: 72, content_writing: 65, creative_writing: 55,
      conversation: 75, classification: 85, extraction: 88, translation: 78,
      summarization: 80, reasoning: 65, math_computation: 60, planning: 60,
      image_analysis: 72, document_analysis: 75, agent_orchestration: 70, tool_use: 85,
      quick_response: 88,
    },
    cost: { inputPer1M: 0.80, outputPer1M: 4.0, tier: 'fast' },
    aimsAlignment: {
      logicDriven: 65, instructionFollowing: 82, toolUseReliability: 85,
      creativeProblemSolving: 55, codeQuality: 70, contextUtilization: 65,
      consistency: 85, costEfficiency: 90,
    },
    methodologyFit: {
      dmaic: 60, dmadv: 55, foster: 60, develop: 55, hone: 60, lookListenLearn: 75,
    },
    releaseDate: '2025-06-01',
    lastUpdated: '2026-02-22',
    notes: 'AIMS preferred for extraction, parsing, and tool dispatch. Better instruction following than Gemini Flash, slightly higher cost.',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // GPT-5.2 — The Generalist
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: 'gpt-5.2',
    openRouterId: 'openai/gpt-5.2',
    name: 'GPT-5.2',
    provider: 'OpenAI',
    version: '5.2',
    architecture: {
      type: 'dense',
      contextWindow: 128_000,
      nativeModalities: ['text', 'image', 'audio', 'code'],
      nativeToolUse: true,
      nativeReasoning: true,
    },
    strengths: [
      { domain: 'generalist', description: 'Strong across all task types — good when task type is uncertain', evidenceBasis: 'OpenAI benchmarks' },
      { domain: 'creative', description: 'Strong creative writing and ideation', evidenceBasis: 'Content generation quality comparisons' },
      { domain: 'conversation', description: 'Natural conversational flow', evidenceBasis: 'User preference studies' },
    ],
    weaknesses: [
      'Smaller context window than Gemini or Claude (128K)',
      'Code generation quality below Claude Opus',
      'Higher cost per quality unit for code tasks',
    ],
    taskAffinity: {
      code_generation: 85, code_review: 82, code_debugging: 83, architecture_design: 82,
      research_synthesis: 82, data_analysis: 80, content_writing: 90, creative_writing: 92,
      conversation: 90, classification: 80, extraction: 80, translation: 85,
      summarization: 85, reasoning: 85, math_computation: 82, planning: 82,
      image_analysis: 82, document_analysis: 80, agent_orchestration: 80, tool_use: 82,
      quick_response: 50,
    },
    cost: { inputPer1M: 5.0, outputPer1M: 20.0, tier: 'premium' },
    aimsAlignment: {
      logicDriven: 82, instructionFollowing: 82, toolUseReliability: 80,
      creativeProblemSolving: 88, codeQuality: 82, contextUtilization: 75,
      consistency: 80, costEfficiency: 55,
    },
    methodologyFit: {
      dmaic: 78, dmadv: 80, foster: 85, develop: 78, hone: 82, lookListenLearn: 82,
    },
    releaseDate: '2025-11-01',
    lastUpdated: '2026-02-22',
    notes: 'Strong generalist, but AIMS prefers Claude for code and Gemini for research. Best for creative content and conversation where budget allows.',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // DEEPSEEK V3.2 — The Economist
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: 'deepseek-v3.2',
    openRouterId: 'deepseek/deepseek-v3.2',
    name: 'DeepSeek V3.2',
    provider: 'DeepSeek',
    version: '3.2',
    architecture: {
      type: 'moe',
      activeParams: '37B',
      totalParams: '671B',
      contextWindow: 131_072,
      nativeModalities: ['text', 'code'],
      nativeToolUse: true,
      nativeReasoning: true,
    },
    strengths: [
      { domain: 'cost', description: 'Extremely low cost with surprisingly high capability for code and reasoning', evidenceBasis: 'Open benchmarks showing MoE efficiency' },
      { domain: 'code', description: 'Competitive code generation — strong for batch code tasks at scale', evidenceBasis: 'HumanEval, MBPP benchmarks' },
      { domain: 'reasoning', description: 'MoE architecture enables efficient reasoning with low cost', evidenceBasis: 'DeepSeek R1 reasoning chain' },
    ],
    weaknesses: [
      'Weaker instruction following for complex system prompts',
      'Less reliable for enterprise-facing conversation',
      'Personality/tone adherence is inconsistent',
    ],
    taskAffinity: {
      code_generation: 80, code_review: 75, code_debugging: 78, architecture_design: 70,
      research_synthesis: 72, data_analysis: 75, content_writing: 60, creative_writing: 55,
      conversation: 60, classification: 72, extraction: 70, translation: 70,
      summarization: 72, reasoning: 82, math_computation: 85, planning: 68,
      image_analysis: 40, document_analysis: 65, agent_orchestration: 65, tool_use: 70,
      quick_response: 75,
    },
    cost: { inputPer1M: 0.30, outputPer1M: 0.88, tier: 'economy' },
    aimsAlignment: {
      logicDriven: 78, instructionFollowing: 65, toolUseReliability: 68,
      creativeProblemSolving: 72, codeQuality: 78, contextUtilization: 65,
      consistency: 68, costEfficiency: 95,
    },
    methodologyFit: {
      dmaic: 70, dmadv: 65, foster: 55, develop: 72, hone: 60, lookListenLearn: 55,
    },
    releaseDate: '2025-12-01',
    lastUpdated: '2026-02-22',
    notes: 'AIMS economy fallback for batch code generation and math tasks. Use when budget is constrained and task is well-defined.',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // KIMI K2.5 — The Visual Agent
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: 'kimi-k2.5',
    openRouterId: 'moonshotai/Kimi-K2.5',
    name: 'Kimi K2.5',
    provider: 'Moonshot AI',
    version: '2.5',
    architecture: {
      type: 'moe',
      activeParams: '32B',
      totalParams: '1T',
      contextWindow: 262_144,
      nativeModalities: ['text', 'image', 'video', 'code'],
      nativeToolUse: true,
      nativeReasoning: true,
    },
    strengths: [
      { domain: 'multimodal', description: 'Only model with native video understanding input', evidenceBasis: 'Moonshot AI architecture' },
      { domain: 'agent_swarm', description: 'Designed for multi-agent orchestration scenarios', evidenceBasis: 'MoE architecture optimized for agent dispatch' },
      { domain: 'visual', description: 'Strong image and document analysis with visual grounding', evidenceBasis: 'Multimodal benchmarks' },
    ],
    weaknesses: [
      'Availability through OpenRouter can be inconsistent',
      'Less tested for pure text-only code generation',
      'Provider ecosystem is smaller than Anthropic/Google/OpenAI',
    ],
    taskAffinity: {
      code_generation: 75, code_review: 72, code_debugging: 72, architecture_design: 70,
      research_synthesis: 78, data_analysis: 80, content_writing: 68, creative_writing: 65,
      conversation: 70, classification: 78, extraction: 82, translation: 72,
      summarization: 78, reasoning: 80, math_computation: 75, planning: 72,
      image_analysis: 95, document_analysis: 88, agent_orchestration: 90, tool_use: 80,
      quick_response: 55,
    },
    cost: { inputPer1M: 0.90, outputPer1M: 0.90, tier: 'premium' },
    aimsAlignment: {
      logicDriven: 75, instructionFollowing: 72, toolUseReliability: 75,
      creativeProblemSolving: 78, codeQuality: 72, contextUtilization: 80,
      consistency: 70, costEfficiency: 78,
    },
    methodologyFit: {
      dmaic: 70, dmadv: 72, foster: 68, develop: 70, hone: 65, lookListenLearn: 85,
    },
    releaseDate: '2025-11-01',
    lastUpdated: '2026-02-22',
    notes: 'AIMS preferred for visual analysis, video understanding, and multi-agent orchestration. Primary for LOOK phase (image/document analysis).',
  },
];

// ---------------------------------------------------------------------------
// Task Classification — NLP-Based Task Type Detection
// ---------------------------------------------------------------------------

/** Task classification patterns — how we detect what kind of task this is */
const TASK_PATTERNS: Array<{
  type: TaskType;
  signals: RegExp[];
  weight: number;
}> = [
  {
    type: 'code_generation',
    signals: [
      /\b(?:write|create|implement|build|code|develop|generate)\s+(?:a|an|the|some)?\s*(?:function|class|component|module|api|endpoint|service|app)/i,
      /\b(?:typescript|javascript|python|react|node|express|next\.?js)\b/i,
      /\b(?:scaffold|boilerplate|starter|template)\b/i,
    ],
    weight: 1.0,
  },
  {
    type: 'code_review',
    signals: [
      /\b(?:review|check|audit|inspect|evaluate)\s+(?:the|this|my|our)?\s*(?:code|implementation|pr|pull request)/i,
      /\b(?:code quality|best practices|anti-pattern|smell)/i,
    ],
    weight: 0.9,
  },
  {
    type: 'code_debugging',
    signals: [
      /\b(?:debug|fix|bug|error|broken|not working|crash|exception|failing|issue)\b/i,
      /\b(?:stack trace|traceback|undefined|null pointer|type error)\b/i,
    ],
    weight: 0.95,
  },
  {
    type: 'architecture_design',
    signals: [
      /\b(?:architecture|system design|design pattern|trade-off|microservice|monolith|database schema)\b/i,
      /\b(?:scalability|distributed|event-driven|cqrs|ddd)\b/i,
    ],
    weight: 0.9,
  },
  {
    type: 'research_synthesis',
    signals: [
      /\b(?:research|analyze|investigate|compare|benchmark|evaluate|survey|study)\b/i,
      /\b(?:competitors?|market|landscape|trends|state of the art)\b/i,
    ],
    weight: 0.85,
  },
  {
    type: 'data_analysis',
    signals: [
      /\b(?:data|dataset|csv|analytics|metrics|statistics|trends|patterns|correlation)\b/i,
      /\b(?:dashboard|chart|graph|visualization|kpi)\b/i,
    ],
    weight: 0.85,
  },
  {
    type: 'content_writing',
    signals: [
      /\b(?:write|draft|compose|create)\s+(?:a|an|the|some)?\s*(?:blog|article|email|copy|documentation|readme|report|proposal)/i,
      /\b(?:marketing|seo|content strategy|copywriting)\b/i,
    ],
    weight: 0.85,
  },
  {
    type: 'creative_writing',
    signals: [
      /\b(?:story|narrative|creative|fiction|poem|script|screenplay|tagline|slogan)\b/i,
      /\b(?:brainstorm|ideate|imagine|what if)\b/i,
    ],
    weight: 0.8,
  },
  {
    type: 'conversation',
    signals: [
      /\b(?:chat|talk|discuss|conversation|explain|help me understand|tell me about)\b/i,
    ],
    weight: 0.5, // Low weight — many things are conversational
  },
  {
    type: 'classification',
    signals: [
      /\b(?:classify|categorize|label|tag|sort|bucket|route|triage)\b/i,
      /\b(?:is this|which category|what type)\b/i,
    ],
    weight: 0.9,
  },
  {
    type: 'extraction',
    signals: [
      /\b(?:extract|parse|pull out|get the|find all|scrape|structured data)\b/i,
      /\b(?:json|csv|table|fields|columns|rows)\b.*\b(?:from|in)\b/i,
    ],
    weight: 0.9,
  },
  {
    type: 'summarization',
    signals: [
      /\b(?:summarize|summary|tldr|condense|brief|overview|digest)\b/i,
      /\b(?:key points|main ideas|executive summary)\b/i,
    ],
    weight: 0.9,
  },
  {
    type: 'reasoning',
    signals: [
      /\b(?:reason|logic|prove|deduce|infer|therefore|because|implies|chain of thought)\b/i,
      /\b(?:step by step|think through|work out|figure out)\b/i,
    ],
    weight: 0.85,
  },
  {
    type: 'math_computation',
    signals: [
      /\b(?:calculate|compute|formula|equation|math|algebra|statistics|probability)\b/i,
      /\b(?:\d+\s*[+\-*/]\s*\d+|percentage|ratio|average|median)\b/i,
    ],
    weight: 0.9,
  },
  {
    type: 'planning',
    signals: [
      /\b(?:plan|roadmap|timeline|milestone|sprint|schedule|strategy|project plan)\b/i,
      /\b(?:phase|step|stage|priority|backlog)\b/i,
    ],
    weight: 0.8,
  },
  {
    type: 'image_analysis',
    signals: [
      /\b(?:image|photo|picture|screenshot|diagram|wireframe|mockup|logo)\b/i,
      /\b(?:ocr|visual|what do you see|describe this image)\b/i,
    ],
    weight: 0.9,
  },
  {
    type: 'document_analysis',
    signals: [
      /\b(?:document|pdf|contract|invoice|resume|report|spreadsheet|proposal)\b/i,
      /\b(?:uploaded|attached|this file|read this|review this document)\b/i,
    ],
    weight: 0.9,
  },
  {
    type: 'tool_use',
    signals: [
      /\b(?:deploy|spin up|provision|configure|call|api|webhook|integration|connect)\b/i,
      /\b(?:docker|container|instance|server|endpoint)\b/i,
    ],
    weight: 0.85,
  },
  {
    type: 'agent_orchestration',
    signals: [
      /\b(?:agent|orchestrat|coordinat|dispatch|pipeline|workflow|multi-agent|swarm)\b/i,
      /\b(?:boomer_ang|chicken hawk|lil_hawk|forge_ang|scout_ang)\b/i,
    ],
    weight: 0.9,
  },
  {
    type: 'quick_response',
    signals: [
      /^(?:yes|no|ok|sure|thanks|hi|hello|hey|what|when|where|how much|how long)\b/i,
      /^.{0,30}$/,  // Very short messages
    ],
    weight: 0.7,
  },
];

// ---------------------------------------------------------------------------
// Agent-to-Model Preferences — Role-Specific Defaults
// ---------------------------------------------------------------------------

/** Default model chain per AIMS agent role */
export interface AgentModelPreference {
  role: string;
  description: string;
  primary: string;           // Model ID
  fallback: string;          // Fallback model ID
  economy: string;           // Budget fallback
  taskOverrides?: Partial<Record<TaskType, string>>; // Task-specific overrides
}

const AGENT_MODEL_PREFERENCES: AgentModelPreference[] = [
  // ── Engineering ─────────────────────────────────────────────────────────
  {
    role: 'Forge_Ang',
    description: 'Code generation and architecture. Needs highest code quality.',
    primary: 'claude-opus-4.6',
    fallback: 'gemini-3.1-pro',
    economy: 'deepseek-v3.2',
  },
  {
    role: 'Buildsmith',
    description: 'Application builder. Complex code generation, full-stack.',
    primary: 'claude-opus-4.6',
    fallback: 'gemini-3.1-pro',
    economy: 'deepseek-v3.2',
  },
  {
    role: 'Patchsmith_Ang',
    description: 'Bug fixer. Needs debugging and code analysis.',
    primary: 'claude-opus-4.6',
    fallback: 'claude-sonnet-4.6',
    economy: 'deepseek-v3.2',
  },
  {
    role: 'Runner_Ang',
    description: 'Test runner and CI agent. Needs fast, reliable tool use.',
    primary: 'claude-haiku-4.5',
    fallback: 'gemini-3.0-flash',
    economy: 'gemini-3.0-flash',
  },
  {
    role: 'Dockmaster_Ang',
    description: 'Docker and infrastructure. Needs precise tool use.',
    primary: 'claude-sonnet-4.6',
    fallback: 'gemini-3.1-pro',
    economy: 'claude-haiku-4.5',
  },
  {
    role: 'Chicken Hawk',
    description: 'Autonomous build executor. Needs reliable code gen + tool use.',
    primary: 'claude-opus-4.6',
    fallback: 'gemini-3.1-pro',
    economy: 'deepseek-v3.2',
  },

  // ── Research ────────────────────────────────────────────────────────────
  {
    role: 'Scout_Ang',
    description: 'Research and analysis. Needs large context and synthesis.',
    primary: 'gemini-3.1-pro',
    fallback: 'claude-sonnet-4.6',
    economy: 'gemini-3.0-flash',
  },
  {
    role: 'Lab_Ang',
    description: 'Data analysis and experimentation. Needs reasoning + data.',
    primary: 'gemini-3.1-pro',
    fallback: 'claude-sonnet-4.6',
    economy: 'deepseek-v3.2',
  },
  {
    role: 'Index_Ang',
    description: 'Indexing and cataloging. Needs fast extraction and classification.',
    primary: 'claude-haiku-4.5',
    fallback: 'gemini-3.0-flash',
    economy: 'gemini-3.0-flash',
  },

  // ── Content & Marketing ─────────────────────────────────────────────────
  {
    role: 'Chronicle_Ang',
    description: 'Content writer. Needs quality writing with strategic thinking.',
    primary: 'claude-sonnet-4.6',
    fallback: 'gpt-5.2',
    economy: 'gemini-3.0-flash',
  },
  {
    role: 'Showrunner_Ang',
    description: 'Creative producer. Needs creativity and engagement.',
    primary: 'gpt-5.2',
    fallback: 'claude-sonnet-4.6',
    economy: 'gemini-3.0-flash',
  },
  {
    role: 'Scribe_Ang',
    description: 'Technical writer. Needs precision and clarity.',
    primary: 'claude-sonnet-4.6',
    fallback: 'gemini-3.1-pro',
    economy: 'claude-haiku-4.5',
  },

  // ── Operations ──────────────────────────────────────────────────────────
  {
    role: 'Bridge_Ang',
    description: 'Connector and translator. Needs conversational fluency.',
    primary: 'claude-sonnet-4.6',
    fallback: 'gpt-5.2',
    economy: 'gemini-3.0-flash',
  },
  {
    role: 'Gatekeeper_Ang',
    description: 'Security and access. Needs precise classification.',
    primary: 'claude-haiku-4.5',
    fallback: 'gemini-3.0-flash',
    economy: 'gemini-3.0-flash',
  },
  {
    role: 'OpsConsole_Ang',
    description: 'Operations dashboard. Needs fast status and tool use.',
    primary: 'claude-haiku-4.5',
    fallback: 'gemini-3.0-flash',
    economy: 'gemini-3.0-flash',
  },

  // ── Executive ───────────────────────────────────────────────────────────
  {
    role: 'ACHEEVY',
    description: 'The orchestrator. Needs best conversation + routing + personality.',
    primary: 'claude-sonnet-4.6',
    fallback: 'gemini-3.1-pro',
    economy: 'gemini-3.0-flash',
    taskOverrides: {
      code_generation: 'claude-opus-4.6',
      architecture_design: 'claude-opus-4.6',
      research_synthesis: 'gemini-3.1-pro',
      image_analysis: 'kimi-k2.5',
      document_analysis: 'gemini-3.1-pro',
    },
  },

  // ── Visual / Multimodal ─────────────────────────────────────────────────
  {
    role: 'LOOK_Phase',
    description: 'Visual analysis from LLL engine. Needs best multimodal.',
    primary: 'kimi-k2.5',
    fallback: 'gemini-3.1-pro',
    economy: 'gemini-3.0-flash',
  },
];

// ---------------------------------------------------------------------------
// Model Intelligence Engine
// ---------------------------------------------------------------------------

class ModelIntelligenceEngine {
  private profiles: Map<string, ModelCapabilityProfile>;
  private agentPreferences: Map<string, AgentModelPreference>;
  private performanceLog: ModelPerformanceEntry[] = [];

  constructor() {
    this.profiles = new Map();
    for (const profile of MODEL_PROFILES) {
      this.profiles.set(profile.id, profile);
    }

    this.agentPreferences = new Map();
    for (const pref of AGENT_MODEL_PREFERENCES) {
      this.agentPreferences.set(pref.role, pref);
    }
  }

  // ── Task Classification ──────────────────────────────────────────────

  /**
   * Classify a user message or task description into task types.
   * Returns scored task types ranked by confidence.
   */
  classifyTask(message: string): Array<{ type: TaskType; confidence: number }> {
    const scores: Partial<Record<TaskType, number>> = {};

    for (const pattern of TASK_PATTERNS) {
      let matched = false;
      for (const signal of pattern.signals) {
        if (signal.test(message)) {
          matched = true;
          break;
        }
      }
      if (matched) {
        scores[pattern.type] = (scores[pattern.type] || 0) + pattern.weight;
      }
    }

    // Sort by score descending
    return Object.entries(scores)
      .map(([type, confidence]) => ({ type: type as TaskType, confidence: confidence! }))
      .sort((a, b) => b.confidence - a.confidence);
  }

  // ── Model Selection ──────────────────────────────────────────────────

  /**
   * Select the optimal model for a given task.
   * This is the core intelligence — the autonomous model router.
   *
   * Decision logic:
   *   1. Classify the task type from the message
   *   2. Check agent-specific preferences (if agent role provided)
   *   3. Score all models against the detected task types
   *   4. Apply cost/quality trade-off based on budget tier
   *   5. Return primary + fallback chain
   */
  selectModel(params: {
    message: string;
    agentRole?: string;
    budgetTier?: 'premium' | 'standard' | 'economy';
    methodology?: string;
    requireMultimodal?: boolean;
    contextSizeNeeded?: number;
  }): ModelSelection {
    // 1. Classify the task
    const taskTypes = this.classifyTask(params.message);
    const primaryTask = taskTypes[0]?.type || 'conversation';
    const taskConfidence = taskTypes[0]?.confidence || 0.3;

    // 2. Check agent-specific preferences
    const agentPref = params.agentRole
      ? this.agentPreferences.get(params.agentRole)
      : undefined;

    // If agent has a task-specific override, use it
    if (agentPref?.taskOverrides?.[primaryTask]) {
      const overrideModelId = agentPref.taskOverrides[primaryTask]!;
      const profile = this.profiles.get(overrideModelId);
      if (profile) {
        return this.buildSelection(profile, primaryTask, taskTypes, 'agent_task_override', params);
      }
    }

    // 3. Score models against detected task
    const scoredModels = this.scoreModelsForTask(primaryTask, {
      budgetTier: params.budgetTier,
      requireMultimodal: params.requireMultimodal,
      contextSizeNeeded: params.contextSizeNeeded,
      methodology: params.methodology,
    });

    // 4. If agent has a preference and it scores well, prefer it
    if (agentPref) {
      const agentModel = this.profiles.get(agentPref.primary);
      const agentModelScore = scoredModels.find(s => s.modelId === agentPref.primary);
      if (agentModel && agentModelScore && agentModelScore.score > 60) {
        return this.buildSelection(agentModel, primaryTask, taskTypes, 'agent_preference', params);
      }
    }

    // 5. Use highest-scoring model
    const bestModel = scoredModels[0];
    if (bestModel) {
      const profile = this.profiles.get(bestModel.modelId)!;
      return this.buildSelection(profile, primaryTask, taskTypes, 'task_affinity_match', params);
    }

    // 6. Fallback — Gemini Flash for unknown tasks
    const flashProfile = this.profiles.get('gemini-3.0-flash')!;
    return this.buildSelection(flashProfile, primaryTask, taskTypes, 'default_fallback', params);
  }

  /**
   * Score all models for a given task type.
   */
  private scoreModelsForTask(
    task: TaskType,
    filters: {
      budgetTier?: string;
      requireMultimodal?: boolean;
      contextSizeNeeded?: number;
      methodology?: string;
    },
  ): Array<{ modelId: string; score: number; reason: string }> {
    const results: Array<{ modelId: string; score: number; reason: string }> = [];

    for (const [id, profile] of this.profiles) {
      let score = profile.taskAffinity[task] || 50;

      // Budget filter
      if (filters.budgetTier === 'economy' && profile.cost.tier === 'premium') {
        score *= 0.3; // Heavily penalize premium for economy budget
      } else if (filters.budgetTier === 'standard' && profile.cost.tier === 'premium') {
        score *= 0.7; // Moderate penalty
      }

      // Multimodal filter
      if (filters.requireMultimodal) {
        const hasMultimodal = profile.architecture.nativeModalities.length > 2;
        if (!hasMultimodal) score *= 0.5;
      }

      // Context size filter
      if (filters.contextSizeNeeded && filters.contextSizeNeeded > profile.architecture.contextWindow) {
        score *= 0.2; // Heavy penalty if context doesn't fit
      }

      // Methodology bonus
      if (filters.methodology) {
        const methKey = filters.methodology.replace(/-/g, '') as keyof ModelCapabilityProfile['methodologyFit'];
        const methFit = profile.methodologyFit[methKey as keyof typeof profile.methodologyFit];
        if (typeof methFit === 'number') {
          score = score * 0.7 + methFit * 0.3; // Blend task score with methodology fit
        }
      }

      // Cost efficiency bonus for economic choices
      score = score * 0.85 + profile.aimsAlignment.costEfficiency * 0.15;

      results.push({
        modelId: id,
        score: Math.round(score),
        reason: `Task: ${task} (${profile.taskAffinity[task]}), AIMS alignment: ${profile.aimsAlignment.logicDriven}`,
      });
    }

    return results.sort((a, b) => b.score - a.score);
  }

  /**
   * Build the complete model selection result with fallback chain.
   */
  private buildSelection(
    primary: ModelCapabilityProfile,
    primaryTask: TaskType,
    taskTypes: Array<{ type: TaskType; confidence: number }>,
    selectionReason: string,
    params: {
      agentRole?: string;
      message: string;
    },
  ): ModelSelection {
    // Determine fallback from agent preferences or scoring
    const agentPref = params.agentRole
      ? this.agentPreferences.get(params.agentRole)
      : undefined;

    const fallbackId = agentPref?.fallback || this.getDefaultFallback(primary.id);
    const economyId = agentPref?.economy || 'gemini-3.0-flash';

    const fallbackProfile = this.profiles.get(fallbackId);
    const economyProfile = this.profiles.get(economyId);

    return {
      primary: {
        modelId: primary.id,
        openRouterId: primary.openRouterId,
        name: primary.name,
        reason: `Best for ${primaryTask} (score: ${primary.taskAffinity[primaryTask]})`,
      },
      fallback: fallbackProfile
        ? {
            modelId: fallbackProfile.id,
            openRouterId: fallbackProfile.openRouterId,
            name: fallbackProfile.name,
            reason: `Fallback for ${primaryTask}`,
          }
        : undefined,
      economy: economyProfile
        ? {
            modelId: economyProfile.id,
            openRouterId: economyProfile.openRouterId,
            name: economyProfile.name,
            reason: 'Budget-constrained fallback',
          }
        : undefined,
      taskClassification: taskTypes,
      primaryTask,
      selectionReason,
      agentRole: params.agentRole,
      estimatedCostPer1KTokens: {
        input: primary.cost.inputPer1M / 1000,
        output: primary.cost.outputPer1M / 1000,
      },
    };
  }

  /**
   * Get default fallback model for a given primary.
   */
  private getDefaultFallback(primaryId: string): string {
    const fallbacks: Record<string, string> = {
      'claude-opus-4.6': 'gemini-3.1-pro',
      'claude-sonnet-4.6': 'gemini-3.1-pro',
      'gemini-3.1-pro': 'claude-sonnet-4.6',
      'gpt-5.2': 'claude-sonnet-4.6',
      'claude-haiku-4.5': 'gemini-3.0-flash',
      'gemini-3.0-flash': 'claude-haiku-4.5',
      'deepseek-v3.2': 'gemini-3.0-flash',
      'kimi-k2.5': 'gemini-3.1-pro',
    };
    return fallbacks[primaryId] || 'gemini-3.0-flash';
  }

  // ── Performance Tracking ──────────────────────────────────────────────

  /**
   * Record the performance of a model on a specific task.
   * Fed by the LEARN phase — over time, this improves model selection.
   */
  recordPerformance(entry: {
    modelId: string;
    taskType: TaskType;
    agentRole: string;
    quality: number;          // 0-100: user satisfaction or automated eval
    latencyMs: number;
    tokenCost: number;
    timestamp: string;
  }): void {
    this.performanceLog.push({
      ...entry,
      id: `perf-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    });
  }

  /**
   * Get performance summary for a model on a specific task type.
   */
  getPerformanceSummary(modelId: string, taskType?: TaskType): {
    avgQuality: number;
    avgLatencyMs: number;
    avgTokenCost: number;
    sampleCount: number;
  } {
    let entries = this.performanceLog.filter(e => e.modelId === modelId);
    if (taskType) {
      entries = entries.filter(e => e.taskType === taskType);
    }

    if (entries.length === 0) {
      return { avgQuality: 0, avgLatencyMs: 0, avgTokenCost: 0, sampleCount: 0 };
    }

    return {
      avgQuality: Math.round(entries.reduce((sum, e) => sum + e.quality, 0) / entries.length),
      avgLatencyMs: Math.round(entries.reduce((sum, e) => sum + e.latencyMs, 0) / entries.length),
      avgTokenCost: Math.round((entries.reduce((sum, e) => sum + e.tokenCost, 0) / entries.length) * 100) / 100,
      sampleCount: entries.length,
    };
  }

  // ── Queries ──────────────────────────────────────────────────────────

  /** Get a model profile by ID */
  getProfile(modelId: string): ModelCapabilityProfile | undefined {
    return this.profiles.get(modelId);
  }

  /** Get all model profiles */
  getAllProfiles(): ModelCapabilityProfile[] {
    return Array.from(this.profiles.values());
  }

  /** Get agent model preference */
  getAgentPreference(role: string): AgentModelPreference | undefined {
    return this.agentPreferences.get(role);
  }

  /** Get all agent preferences */
  getAllAgentPreferences(): AgentModelPreference[] {
    return Array.from(this.agentPreferences.values());
  }

  /** Get top models for a specific task type */
  getTopModelsForTask(task: TaskType, limit: number = 3): Array<{ model: ModelCapabilityProfile; score: number }> {
    return Array.from(this.profiles.values())
      .map(p => ({ model: p, score: p.taskAffinity[task] || 0 }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /** Get the best model for a specific methodology */
  getBestForMethodology(methodology: string): ModelCapabilityProfile | undefined {
    const key = methodology.replace(/-/g, '') as keyof ModelCapabilityProfile['methodologyFit'];
    return Array.from(this.profiles.values())
      .filter(p => typeof p.methodologyFit[key as keyof typeof p.methodologyFit] === 'number')
      .sort((a, b) => {
        const aScore = a.methodologyFit[key as keyof typeof a.methodologyFit] as number;
        const bScore = b.methodologyFit[key as keyof typeof b.methodologyFit] as number;
        return bScore - aScore;
      })[0];
  }
}

// ---------------------------------------------------------------------------
// Types for Model Selection Results
// ---------------------------------------------------------------------------

export interface ModelSelection {
  primary: {
    modelId: string;
    openRouterId: string;
    name: string;
    reason: string;
  };
  fallback?: {
    modelId: string;
    openRouterId: string;
    name: string;
    reason: string;
  };
  economy?: {
    modelId: string;
    openRouterId: string;
    name: string;
    reason: string;
  };
  taskClassification: Array<{ type: TaskType; confidence: number }>;
  primaryTask: TaskType;
  selectionReason: string;
  agentRole?: string;
  estimatedCostPer1KTokens: {
    input: number;
    output: number;
  };
}

interface ModelPerformanceEntry {
  id: string;
  modelId: string;
  taskType: TaskType;
  agentRole: string;
  quality: number;
  latencyMs: number;
  tokenCost: number;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Singleton Export
// ---------------------------------------------------------------------------

export const modelIntelligence = new ModelIntelligenceEngine();

// Re-export for external reference
export { MODEL_PROFILES, AGENT_MODEL_PREFERENCES, TASK_PATTERNS };
