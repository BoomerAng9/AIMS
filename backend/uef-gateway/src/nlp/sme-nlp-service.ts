/**
 * SME-NLP Service — Subject Matter Expert for Natural Language Processing
 *
 * Thin service layer wrapping the existing NLP pipeline (normalizer, urban-dictionary,
 * dialect registries). Owned by SME-NLP_Ang (Boomer_Ang).
 *
 * Responsibilities:
 * - Centralized intent classification (NLP normalization + vertical triggers)
 * - Glossary term lookup and search
 * - Misclassification feedback collection
 * - NLP pipeline health reporting
 */

import { normalizeInput, containsSlang, getDialectStats } from '../nlp/normalizer';
import type { NormalizationResult } from '../nlp/normalizer';
import logger from '../logger';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface GlossaryTerm {
  key: string;
  technical: string;
  simple: string;
  definition: string;
  category: GlossaryCategory;
  aliases: string[];
}

export type GlossaryCategory =
  | 'agents'
  | 'infrastructure'
  | 'features'
  | 'operations'
  | 'billing'
  | 'design'
  | 'governance'
  | 'nlp';

export interface IntentResult {
  /** Original user input */
  input: string;
  /** NLP normalization result */
  normalization: NormalizationResult;
  /** Detected intent (vertical or action) */
  intent: string;
  /** Confidence score 0.0 – 1.0 */
  confidence: number;
  /** Whether slang was normalized before classification */
  wasNormalized: boolean;
  /** Glossary terms detected in the input */
  matchedTerms: string[];
}

export interface FeedbackEntry {
  id: string;
  input: string;
  expectedIntent: string;
  actualIntent: string;
  timestamp: string;
  userId?: string;
  resolved: boolean;
}

// ─────────────────────────────────────────────────────────────
// Glossary — Technical + Layman's terms
// ─────────────────────────────────────────────────────────────

/**
 * Master glossary. Extends the frontend terminology.ts with full definitions
 * and NLP aliases. This is the server-side canonical source.
 */
export const GLOSSARY: GlossaryTerm[] = [
  // ── Agents ──
  {
    key: 'acheevy',
    technical: 'ACHEEVY',
    simple: 'ACHEEVY',
    definition: 'The AI Executive Orchestrator — the CEO-level agent that coordinates all operations, delegates to Boomer_Angs, and serves as the primary interface for users.',
    category: 'agents',
    aliases: ['the boss', 'main ai', 'assistant', 'your ai', 'the brain'],
  },
  {
    key: 'boomerAng',
    technical: 'Boomer_Ang',
    simple: 'AI Specialist',
    definition: 'A C-Suite or senior-level specialized agent. Each Boomer_Ang owns a domain (engineering, marketing, analytics, etc.) and manages Lil_Hawks to execute tasks within that domain.',
    category: 'agents',
    aliases: ['specialist', 'senior agent', 'expert agent', 'department head', 'domain expert'],
  },
  {
    key: 'lilHawk',
    technical: 'Lil_Hawk',
    simple: 'Task Worker',
    definition: 'An atomic worker agent spawned by Chicken Hawk. Executes single tasks (write code, run test, fetch data) inside ephemeral containers and reports results back up the chain.',
    category: 'agents',
    aliases: ['worker', 'task bot', 'little worker', 'helper', 'minion', 'bot'],
  },
  {
    key: 'chickenHawk',
    technical: 'Chicken Hawk',
    simple: 'Project Manager',
    definition: 'The execution engine. Receives task breakdowns from Boomer_Angs, spawns Lil_Hawks, tracks progress, handles retries, and consolidates results.',
    category: 'agents',
    aliases: ['project manager', 'task runner', 'executor', 'coordinator', 'manager'],
  },
  {
    key: 'avvaNoon',
    technical: 'AVVA NOON',
    simple: 'Strategy AI',
    definition: 'The deep reasoning agent. Handles complex planning, architecture decisions, and high-level strategy before execution begins.',
    category: 'agents',
    aliases: ['strategist', 'planner', 'architect', 'thinker'],
  },
  {
    key: 'smeNlpAng',
    technical: 'SME-NLP_Ang',
    simple: 'Language Expert',
    definition: 'Subject Matter Expert for Natural Language Processing. Owns the NLP pipeline, glossary integrity, intent classification accuracy, and dialect registries.',
    category: 'agents',
    aliases: ['nlp expert', 'language agent', 'text processor', 'understanding engine'],
  },

  // ── Infrastructure ──
  {
    key: 'plug',
    technical: 'Plug',
    simple: 'Tool',
    definition: 'A deployable application or service in the A.I.M.S. catalog. Each Plug runs in its own container with auto-configured networking, SSL, and monitoring.',
    category: 'infrastructure',
    aliases: ['tool', 'app', 'service', 'application', 'thing i want to run', 'software'],
  },
  {
    key: 'container',
    technical: 'Container',
    simple: 'App Instance',
    definition: 'A Docker container running a Plug or agent. Isolated, auto-scaled, monitored. Managed by the platform — users never see Docker directly.',
    category: 'infrastructure',
    aliases: ['instance', 'running app', 'server', 'box', 'environment'],
  },
  {
    key: 'deployDock',
    technical: 'Deploy Dock',
    simple: 'Launch Tools',
    definition: 'The deployment interface where users launch Plugs from the catalog. One-click deploy with auto-configuration.',
    category: 'infrastructure',
    aliases: ['launch pad', 'deploy area', 'start screen', 'app store', 'tool store'],
  },
  {
    key: 'openSandbox',
    technical: 'OpenSandbox',
    simple: 'Code Runner',
    definition: 'Secure code execution environment on VPS2. Runs Python, JavaScript, TypeScript, Bash, Go, Rust in ephemeral Docker containers with resource limits.',
    category: 'infrastructure',
    aliases: ['sandbox', 'code runner', 'playground', 'run my code', 'execute code'],
  },
  {
    key: 'uefGateway',
    technical: 'UEF Gateway',
    simple: 'API Hub',
    definition: 'Unified Experience Framework gateway. The single entry point for all backend services — routes requests to NLP, agents, magazines, deployments, billing, etc.',
    category: 'infrastructure',
    aliases: ['backend', 'api', 'server', 'gateway', 'the api'],
  },
  {
    key: 'wireGuard',
    technical: 'WireGuard Tunnel',
    simple: 'Secure Connection',
    definition: 'Encrypted VPN tunnel connecting VPS1 (main) and VPS2 (sandbox/compute). All cross-server traffic flows through this tunnel.',
    category: 'infrastructure',
    aliases: ['tunnel', 'vpn', 'secure link', 'connection between servers'],
  },

  // ── Features ──
  {
    key: 'magazine',
    technical: 'Magazine',
    simple: 'Context Pack',
    definition: 'A loadable context package containing persona instructions, data sources, and skill bindings. Like a gun magazine — load it, swap it, fire (execute). Up to 3 can be loaded simultaneously.',
    category: 'features',
    aliases: ['context pack', 'knowledge pack', 'persona pack', 'load context', 'switch mode', 'change personality'],
  },
  {
    key: 'dataSource',
    technical: 'Data Source',
    simple: 'Reference Document',
    definition: 'A document, URL, or text block attached to a Magazine. Its content is injected into the AI context when the Magazine is active, providing specialized knowledge.',
    category: 'features',
    aliases: ['document', 'reference', 'knowledge', 'file', 'upload', 'source material', 'context document'],
  },
  {
    key: 'makeItMine',
    technical: 'Make It Mine (MIM)',
    simple: 'Build Something',
    definition: 'The primary creation flow — describe what you want, ACHEEVY orchestrates the build. Covers apps, content, workflows, and deployments.',
    category: 'features',
    aliases: ['build it', 'make it', 'create something', 'i want to make', 'build me', 'can you make'],
  },
  {
    key: 'luc',
    technical: 'LUC Credits',
    simple: 'Usage Credits',
    definition: 'Lowest Unit Cost credits — the platform billing unit. Every AI operation, deployment, and compute cycle costs LUC credits. Transparent, pay-per-use pricing.',
    category: 'billing',
    aliases: ['credits', 'tokens', 'usage', 'balance', 'how much does it cost', 'pricing'],
  },
  {
    key: 'oracle',
    technical: 'ORACLE Gate',
    simple: 'Quality Check',
    definition: 'Orchestrated Review And Compliance Layer for Evidence. Every deliverable must pass evidence verification before being marked complete. No proof, no done.',
    category: 'governance',
    aliases: ['quality check', 'verification', 'review', 'approval', 'is it done'],
  },
  {
    key: 'ntntn',
    technical: 'NtNtN Engine',
    simple: 'Creative Library',
    definition: 'The creative techniques engine. Contains reusable patterns, templates, and frameworks for content creation, strategy, and design.',
    category: 'features',
    aliases: ['creative library', 'templates', 'patterns', 'frameworks', 'techniques'],
  },
  {
    key: 'evidenceLocker',
    technical: 'Evidence Locker',
    simple: 'Proof Storage',
    definition: 'Immutable storage for task evidence — screenshots, test results, logs, configs. Required by ORACLE gates. Every completion has a proof trail.',
    category: 'governance',
    aliases: ['proof', 'evidence', 'receipts', 'show me proof', 'verification records'],
  },

  // ── Operations ──
  {
    key: 'pmoOffice',
    technical: 'PMO Office',
    simple: 'Department',
    definition: 'Project Management Office — organizational unit grouping related Boomer_Angs. Examples: Engineering PMO, Marketing PMO, Executive Office.',
    category: 'operations',
    aliases: ['department', 'team', 'office', 'division', 'group'],
  },
  {
    key: 'hrOffice',
    technical: 'HR Office',
    simple: 'Agent Manager',
    definition: 'Human Resources Office for agents. Monitors container health, fatigue levels (85% capacity triggers pause), performs RAG memory sync, and manages promotions (Lil_Hawk → Chicken Hawk).',
    category: 'operations',
    aliases: ['agent management', 'health monitor', 'agent hr', 'container management'],
  },
  {
    key: 'chainOfCommand',
    technical: 'Chain of Command',
    simple: 'AI Team',
    definition: 'The hierarchical reporting structure: ACHEEVY → Boomer_Angs → Chicken Hawk → Lil_Hawks. Messages flow up/down the chain. No agent can skip levels.',
    category: 'governance',
    aliases: ['team structure', 'hierarchy', 'who reports to who', 'organization'],
  },
  {
    key: 'missionControl',
    technical: 'Mission Control',
    simple: 'Operations Dashboard',
    definition: 'The real-time operations dashboard showing all active agents, containers, deployments, and task progress. The nerve center of the platform.',
    category: 'operations',
    aliases: ['dashboard', 'control panel', 'operations', 'monitoring', 'status page', 'what is running'],
  },
  {
    key: 'containerLifecycle',
    technical: 'Container Lifecycle',
    simple: 'Agent Rotation',
    definition: 'The process of managing agent containers: spawn → execute → monitor (85% capacity) → pause → RAG extract memory → kill → fresh container → resume. Prevents context window exhaustion.',
    category: 'operations',
    aliases: ['agent refresh', 'restart agents', 'memory cleanup', 'recycling'],
  },
  {
    key: 'ragSync',
    technical: 'RAG Sync',
    simple: 'Memory Save',
    definition: 'Retrieval-Augmented Generation memory synchronization. Before an agent container is recycled, its conversation history and learned context are extracted and stored for the replacement.',
    category: 'operations',
    aliases: ['save memory', 'backup context', 'sync knowledge', 'remember'],
  },

  // ── Design ──
  {
    key: 'agenticUi',
    technical: 'Agentic UI',
    simple: 'AI Interface',
    definition: 'The design system for A.I.M.S. — obsidian backgrounds, gold accents, wireframe borders, glass surfaces. Luxury industrial aesthetic inspired by premium AI platforms.',
    category: 'design',
    aliases: ['the look', 'design', 'theme', 'ui', 'interface style'],
  },
  {
    key: 'glassBox',
    technical: 'Glass Box',
    simple: 'Transparent AI',
    definition: 'The observability layer — shows users what the AI agents are doing in real-time (Agent Viewport). Opposite of black-box AI. Users see reasoning, handoffs, and progress.',
    category: 'design',
    aliases: ['transparency', 'see what ai is doing', 'agent activity', 'show me what is happening'],
  },
  {
    key: 'generativeBlock',
    technical: 'Generative Block',
    simple: 'Interactive Card',
    definition: 'A rich UI component rendered in the chat — deployment cards, approval gates, health checks, progress trackers, cost estimates, code execution results. 9 block types available.',
    category: 'design',
    aliases: ['card', 'interactive element', 'rich message', 'action card'],
  },

  // ── Billing ──
  {
    key: 'threeNinePricing',
    technical: '3-6-9 Commitment Model',
    simple: 'Subscription Plans',
    definition: 'The pricing model: P2P (pay-per-use), 3-month, 6-month, or 9-month commitment (pay 9, get 12). Longer commitment = lower per-unit cost.',
    category: 'billing',
    aliases: ['pricing', 'plans', 'subscription', 'how much', 'cost', 'payment'],
  },

  // ── NLP ──
  {
    key: 'slangNormalization',
    technical: 'Slang Normalization',
    simple: 'Language Translation',
    definition: 'The NLP pre-processor that converts colloquial/slang input into platform-standard terms. "tryna whip up a vid" → "create a video". Supports AAVE, Gen Z, tech jargon dialects.',
    category: 'nlp',
    aliases: ['understand slang', 'casual language', 'translate what i said'],
  },
  {
    key: 'intentClassification',
    technical: 'Intent Classification',
    simple: 'Understanding What You Mean',
    definition: 'The pipeline that determines what action the user wants. Combines NLP normalization + vertical trigger patterns + skill matching to route to the correct agent.',
    category: 'nlp',
    aliases: ['what did i mean', 'figure out intent', 'understand me', 'what i want'],
  },
  {
    key: 'verticalTrigger',
    technical: 'Vertical Trigger',
    simple: 'Category Match',
    definition: 'Pattern-matching system that detects which business vertical a user request belongs to (e-commerce, video, analytics, etc.) and routes to the appropriate specialist.',
    category: 'nlp',
    aliases: ['category', 'topic', 'what area', 'which department'],
  },
];

// ─────────────────────────────────────────────────────────────
// Feedback Storage (in-memory, future: persistent)
// ─────────────────────────────────────────────────────────────

const feedbackLog: FeedbackEntry[] = [];

// ─────────────────────────────────────────────────────────────
// Service Methods
// ─────────────────────────────────────────────────────────────

/**
 * Classify user intent — centralized entry point for the NLP pipeline.
 * Combines normalization + glossary term matching.
 */
export function classifyIntent(input: string): IntentResult {
  const normalization = normalizeInput(input);

  // Check normalized text against glossary terms + aliases
  const matchedTerms: string[] = [];
  const lower = normalization.normalized.toLowerCase();

  for (const term of GLOSSARY) {
    // Direct key match
    if (lower.includes(term.technical.toLowerCase()) || lower.includes(term.simple.toLowerCase())) {
      matchedTerms.push(term.key);
      continue;
    }
    // Alias match
    for (const alias of term.aliases) {
      if (lower.includes(alias.toLowerCase())) {
        matchedTerms.push(term.key);
        break;
      }
    }
  }

  // Determine intent
  let intent = 'conversational';
  let confidence = 0.5;

  if (normalization.directIntent) {
    intent = normalization.directIntent.intent;
    confidence = normalization.directIntent.confidence;
  } else if (matchedTerms.length > 0) {
    // Boost confidence when glossary terms are detected
    confidence = Math.min(0.85, 0.5 + matchedTerms.length * 0.1);
  }

  return {
    input,
    normalization,
    intent,
    confidence,
    wasNormalized: normalization.slangDetected,
    matchedTerms,
  };
}

/**
 * Get all glossary terms.
 */
export function getGlossaryTerms(): GlossaryTerm[] {
  return GLOSSARY;
}

/**
 * Search glossary across all fields (technical, simple, definition, aliases).
 */
export function searchGlossary(query: string): GlossaryTerm[] {
  if (!query || query.trim().length === 0) return GLOSSARY;

  const lower = query.toLowerCase().trim();

  return GLOSSARY.filter(term => {
    if (term.key.toLowerCase().includes(lower)) return true;
    if (term.technical.toLowerCase().includes(lower)) return true;
    if (term.simple.toLowerCase().includes(lower)) return true;
    if (term.definition.toLowerCase().includes(lower)) return true;
    if (term.category.toLowerCase().includes(lower)) return true;
    if (term.aliases.some(a => a.toLowerCase().includes(lower))) return true;
    return false;
  });
}

/**
 * Get glossary terms by category.
 */
export function getGlossaryByCategory(category: GlossaryCategory): GlossaryTerm[] {
  return GLOSSARY.filter(t => t.category === category);
}

/**
 * Submit feedback when NLP misclassifies intent.
 * SME-NLP_Ang reviews these to improve the pipeline.
 */
export function submitFeedback(entry: Omit<FeedbackEntry, 'id' | 'timestamp' | 'resolved'>): FeedbackEntry {
  const feedback: FeedbackEntry = {
    ...entry,
    id: `fb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    resolved: false,
  };
  feedbackLog.push(feedback);

  logger.info(
    { input: entry.input, expected: entry.expectedIntent, actual: entry.actualIntent },
    '[SME-NLP] Classification feedback received'
  );

  return feedback;
}

/**
 * Get all unresolved feedback entries.
 */
export function getUnresolvedFeedback(): FeedbackEntry[] {
  return feedbackLog.filter(f => !f.resolved);
}

/**
 * Get NLP pipeline health stats.
 */
export function getPipelineStats() {
  const dialectStats = getDialectStats();
  return {
    glossaryTermCount: GLOSSARY.length,
    aliasCount: GLOSSARY.reduce((sum, t) => sum + t.aliases.length, 0),
    categoryBreakdown: Object.fromEntries(
      (['agents', 'infrastructure', 'features', 'operations', 'billing', 'design', 'governance', 'nlp'] as GlossaryCategory[])
        .map(cat => [cat, GLOSSARY.filter(t => t.category === cat).length])
    ),
    dialectStats,
    feedbackQueue: feedbackLog.filter(f => !f.resolved).length,
    totalFeedback: feedbackLog.length,
  };
}
