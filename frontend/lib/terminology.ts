/**
 * Terminology Simplification Layer — A.I.M.S.
 *
 * Maps technical platform terms to customer-friendly language.
 * Use t(key, mode) in components for mode-aware labels.
 *
 * PRIVATE mode: Full technical vocabulary (developer/owner)
 * PUBLIC mode:  Plain language (customer-facing)
 *
 * Extended with definitions, categories, and NLP aliases for
 * the glossary browser and SME-NLP_Ang pipeline.
 */

import type { PlatformMode } from './platform-mode';

export type GlossaryCategory =
  | 'agents'
  | 'infrastructure'
  | 'features'
  | 'operations'
  | 'billing'
  | 'design'
  | 'governance'
  | 'nlp';

interface TermEntry {
  /** Technical label (shown in PRIVATE/developer mode) */
  technical: string;
  /** Simple label (shown in PUBLIC/customer mode) */
  simple: string;
  /** Full definition for glossary browser */
  definition: string;
  /** Category for grouping */
  category: GlossaryCategory;
  /** Layman's aliases — plain-language phrases for NLP recognition */
  aliases: string[];
}

export const TERMS: Record<string, TermEntry> = {
  // ── Navigation & Layout ────────────────────────────────────
  dashboard: { technical: 'Dashboard', simple: 'Home', definition: 'The main landing screen after login showing active projects, agents, and quick actions.', category: 'features', aliases: ['home screen', 'main page', 'landing'] },
  circuitBox: { technical: 'Circuit Box', simple: 'Settings & Services', definition: 'Configuration panel for platform settings, integrations, and service connections.', category: 'infrastructure', aliases: ['settings', 'config', 'preferences', 'options'] },
  deployDock: { technical: 'Deploy Dock', simple: 'Launch Tools', definition: 'The deployment interface where users launch Plugs from the catalog. One-click deploy with auto-configuration.', category: 'infrastructure', aliases: ['launch pad', 'deploy area', 'start screen', 'app store', 'tool store'] },
  controlPlane: { technical: 'Control Plane', simple: 'Admin Panel', definition: 'Administrative dashboard for platform-wide configuration, user management, and system health.', category: 'operations', aliases: ['admin', 'admin settings', 'management panel'] },
  warRoom: { technical: 'War Room', simple: 'Operations Center', definition: 'Real-time operations monitoring with live agent status, deployment health, and incident management.', category: 'operations', aliases: ['ops center', 'command center', 'monitoring'] },

  // ── Plug System ────────────────────────────────────────────
  plug: { technical: 'Plug', simple: 'Tool', definition: 'A deployable application or service in the A.I.M.S. catalog. Each Plug runs in its own container with auto-configured networking, SSL, and monitoring.', category: 'infrastructure', aliases: ['tool', 'app', 'service', 'application', 'software', 'thing i want to run'] },
  plugCatalog: { technical: 'Plug Catalog', simple: 'Tool Library', definition: 'Browsable marketplace of all available Plugs — pre-built tools, AI agents, and platforms ready for one-click deployment.', category: 'features', aliases: ['tool store', 'app store', 'marketplace', 'library'] },
  spinUp: { technical: 'Spin Up', simple: 'Set Up', definition: 'Initialize and deploy a Plug or container. Includes pulling images, configuring networking, and starting the service.', category: 'operations', aliases: ['start', 'launch', 'turn on', 'set up', 'get it going'] },
  deploy: { technical: 'Deploy', simple: 'Launch', definition: 'Push a Plug or service live — making it accessible to users with SSL, DNS, and monitoring auto-configured.', category: 'operations', aliases: ['launch it', 'start it up', 'get it running', 'turn it on', 'put it live', 'ship it'] },
  decommission: { technical: 'Decommission', simple: 'Remove', definition: 'Gracefully shut down and remove a deployed Plug — stops containers, releases ports, cleans up DNS records.', category: 'operations', aliases: ['remove', 'delete', 'stop', 'shut down', 'turn off', 'kill it'] },
  plugExport: { technical: 'Plug Export', simple: 'Download Package', definition: 'Export a Plug as a portable package (Docker Compose + configs) for self-hosting outside A.I.M.S.', category: 'features', aliases: ['download', 'export', 'take it with me', 'self host'] },

  // ── Infrastructure ─────────────────────────────────────────
  container: { technical: 'Container', simple: 'App Instance', definition: 'A Docker container running a Plug or agent. Isolated, auto-scaled, monitored. Managed by the platform.', category: 'infrastructure', aliases: ['instance', 'running app', 'server', 'box', 'environment'] },
  nginx: { technical: 'Reverse Proxy', simple: 'Web Address', definition: 'Nginx reverse proxy that maps domains/subdomains to containers. Auto-configured with SSL certificates.', category: 'infrastructure', aliases: ['web address', 'url', 'domain', 'how to access it'] },
  dockerCompose: { technical: 'Docker Compose', simple: 'Setup Package', definition: 'Configuration file defining how a Plug runs — which images, ports, volumes, and environment variables.', category: 'infrastructure', aliases: ['setup file', 'config file', 'deployment config'] },
  healthCheck: { technical: 'Health Check', simple: 'Status Check', definition: 'Automated monitoring probe that verifies a container is responsive. Triggers alerts or auto-restart on failure.', category: 'operations', aliases: ['status', 'is it working', 'check on it', 'health status'] },
  portAllocation: { technical: 'Port Allocation', simple: 'Connection Setup', definition: 'Automatic assignment of network ports when deploying a Plug. No manual configuration needed.', category: 'infrastructure', aliases: ['connection', 'networking', 'port setup'] },
  instance: { technical: 'Instance', simple: 'Running Tool', definition: 'A single deployed copy of a Plug, running in its own container with dedicated resources.', category: 'infrastructure', aliases: ['running app', 'active tool', 'live service'] },
  openSandbox: { technical: 'OpenSandbox', simple: 'Code Runner', definition: 'Secure code execution environment on VPS2. Runs Python, JavaScript, TypeScript, Bash, Go, Rust in ephemeral Docker containers.', category: 'infrastructure', aliases: ['sandbox', 'code runner', 'playground', 'run my code', 'execute code'] },
  uefGateway: { technical: 'UEF Gateway', simple: 'API Hub', definition: 'Unified Experience Framework gateway — the single entry point for all backend services.', category: 'infrastructure', aliases: ['backend', 'api', 'server', 'gateway'] },
  wireGuard: { technical: 'WireGuard Tunnel', simple: 'Secure Connection', definition: 'Encrypted VPN tunnel connecting VPS1 and VPS2. All cross-server traffic flows through this tunnel.', category: 'infrastructure', aliases: ['tunnel', 'vpn', 'secure link'] },

  // ── Agents & Chain of Command ──────────────────────────────
  acheevy: { technical: 'ACHEEVY', simple: 'ACHEEVY', definition: 'The AI Executive Orchestrator — CEO-level agent that coordinates all operations and is the primary user interface.', category: 'agents', aliases: ['the boss', 'main ai', 'assistant', 'your ai'] },
  boomerAng: { technical: 'Boomer_Ang', simple: 'AI Specialist', definition: 'C-Suite or senior specialized agent. Each owns a domain (engineering, marketing, analytics) and manages Lil_Hawks.', category: 'agents', aliases: ['specialist', 'senior agent', 'expert', 'department head'] },
  lilHawk: { technical: 'Lil_Hawk', simple: 'Task Worker', definition: 'Atomic worker agent spawned by Chicken Hawk. Executes single tasks in ephemeral containers and reports back.', category: 'agents', aliases: ['worker', 'task bot', 'helper', 'minion'] },
  chickenHawk: { technical: 'Chicken Hawk', simple: 'Project Manager', definition: 'The execution engine — receives task breakdowns, spawns Lil_Hawks, tracks progress, handles retries.', category: 'agents', aliases: ['project manager', 'task runner', 'executor', 'coordinator'] },
  chainOfCommand: { technical: 'Chain of Command', simple: 'AI Team', definition: 'Hierarchical structure: ACHEEVY → Boomer_Angs → Chicken Hawk → Lil_Hawks. Messages flow up/down the chain.', category: 'governance', aliases: ['team structure', 'hierarchy', 'who reports to who'] },
  agentNetwork: { technical: 'Agent Network', simple: 'AI Team', definition: 'The full network of all active agents across all PMO offices.', category: 'agents', aliases: ['all agents', 'the team', 'ai workforce'] },
  avvaNoon: { technical: 'AVVA NOON', simple: 'Strategy AI', definition: 'Deep reasoning agent for complex planning, architecture decisions, and high-level strategy.', category: 'agents', aliases: ['strategist', 'planner', 'architect', 'thinker'] },
  smeNlpAng: { technical: 'SME-NLP_Ang', simple: 'Language Expert', definition: 'Subject Matter Expert for NLP — owns the glossary, intent classification, slang normalization, and dialect registries.', category: 'agents', aliases: ['nlp expert', 'language agent', 'text processor'] },

  // ── Features ───────────────────────────────────────────────
  makeItMine: { technical: 'Make It Mine (MIM)', simple: 'Build Something', definition: 'The primary creation flow — describe what you want, ACHEEVY orchestrates the build.', category: 'features', aliases: ['build it', 'make it', 'create something', 'i want to make'] },
  luc: { technical: 'LUC Credits', simple: 'Usage Credits', definition: 'Lowest Unit Cost credits — the platform billing unit. Every operation costs LUC credits.', category: 'billing', aliases: ['credits', 'tokens', 'usage', 'balance', 'cost'] },
  oracle: { technical: 'ORACLE Gate', simple: 'Quality Check', definition: 'Orchestrated Review And Compliance Layer for Evidence. Deliverables must pass evidence verification.', category: 'governance', aliases: ['quality check', 'verification', 'review', 'approval'] },
  ntntn: { technical: 'NtNtN Engine', simple: 'Creative Library', definition: 'Creative techniques engine with reusable patterns, templates, and frameworks for content creation.', category: 'features', aliases: ['creative library', 'templates', 'patterns', 'frameworks'] },
  liveSim: { technical: 'LiveSim', simple: 'Live Workspace', definition: 'Real-time collaborative workspace with live preview of deployments and changes.', category: 'features', aliases: ['live preview', 'workspace', 'sandbox'] },
  vertical: { technical: 'Vertical', simple: 'Marketplace', definition: 'Business category for specialized tools and agents (e-commerce, video, analytics, sports).', category: 'features', aliases: ['category', 'topic', 'market'] },
  magazine: { technical: 'Magazine', simple: 'Context Pack', definition: 'Loadable context package — persona + data sources + skills. Like a gun magazine: load, swap, fire.', category: 'features', aliases: ['context pack', 'knowledge pack', 'persona pack', 'switch mode'] },
  dataSource: { technical: 'Data Source', simple: 'Reference Document', definition: 'Document, URL, or text attached to a Magazine. Injected into AI context when active.', category: 'features', aliases: ['document', 'reference', 'knowledge', 'file', 'upload'] },
  evidenceLocker: { technical: 'Evidence Locker', simple: 'Proof Storage', definition: 'Immutable storage for task evidence — screenshots, test results, logs. Required by ORACLE gates.', category: 'governance', aliases: ['proof', 'evidence', 'receipts', 'show me proof'] },
  generativeBlock: { technical: 'Generative Block', simple: 'Interactive Card', definition: 'Rich UI component in chat — deployment cards, approval gates, health checks, code execution results.', category: 'design', aliases: ['card', 'interactive element', 'rich message'] },
  glassBox: { technical: 'Glass Box', simple: 'Transparent AI', definition: 'Observability layer showing AI reasoning in real-time via Agent Viewport. Opposite of black-box AI.', category: 'design', aliases: ['transparency', 'see what ai is doing', 'show me what is happening'] },

  // ── Operations ─────────────────────────────────────────────
  pmoOffice: { technical: 'PMO Office', simple: 'Department', definition: 'Project Management Office grouping related Boomer_Angs (Engineering PMO, Marketing PMO, etc.).', category: 'operations', aliases: ['department', 'team', 'office', 'division'] },
  hrOffice: { technical: 'HR Office', simple: 'Agent Manager', definition: 'Monitors container health/fatigue, performs RAG memory sync, manages promotions (Lil_Hawk → Chicken Hawk).', category: 'operations', aliases: ['agent management', 'health monitor'] },
  missionControl: { technical: 'Mission Control', simple: 'Operations Dashboard', definition: 'Real-time dashboard showing all active agents, containers, deployments, and task progress.', category: 'operations', aliases: ['dashboard', 'control panel', 'monitoring', 'status page'] },
  containerLifecycle: { technical: 'Container Lifecycle', simple: 'Agent Rotation', definition: 'Spawn → execute → 85% capacity → pause → RAG extract → kill → fresh container → resume.', category: 'operations', aliases: ['agent refresh', 'restart', 'memory cleanup', 'recycling'] },
  ragSync: { technical: 'RAG Sync', simple: 'Memory Save', definition: 'Before an agent is recycled, conversation history and learned context are extracted for the replacement.', category: 'operations', aliases: ['save memory', 'backup context', 'sync knowledge'] },

  // ── Actions ────────────────────────────────────────────────
  provision: { technical: 'Provision', simple: 'Prepare', definition: 'Allocate resources and configure infrastructure before a deployment goes live.', category: 'operations', aliases: ['prepare', 'set up', 'allocate'] },
  orchestrate: { technical: 'Orchestrate', simple: 'Coordinate', definition: 'Manage a multi-step workflow across multiple agents and services.', category: 'operations', aliases: ['coordinate', 'manage', 'handle', 'run the process'] },
  dispatch: { technical: 'Dispatch', simple: 'Assign', definition: 'Send a task to a specific agent or Lil_Hawk for execution.', category: 'operations', aliases: ['assign', 'send task', 'delegate'] },
  buildManifest: { technical: 'Build Manifest', simple: 'Project Plan', definition: 'Structured plan generated by ACHEEVY before execution — steps, agents, tools, and success criteria.', category: 'features', aliases: ['project plan', 'build plan', 'steps to build'] },

  // ── Plans & Tiers ──────────────────────────────────────────
  yourSpace: { technical: 'Your Space', simple: 'My Workspace', definition: 'Personal workspace with projects, deployments, and customizations.', category: 'features', aliases: ['my workspace', 'my stuff', 'personal space'] },
  modelGarden: { technical: 'Model Garden', simple: 'AI Models', definition: 'Selection of available AI models (Claude, GPT-4, Gemini, Qwen) with cost and capability comparison.', category: 'features', aliases: ['ai models', 'model picker', 'which ai'] },
  workbench: { technical: 'Workbench', simple: 'Tools', definition: 'Development environment with IDE, terminal, and debugging tools for hands-on work.', category: 'features', aliases: ['tools', 'editor', 'dev environment'] },
  workstreams: { technical: 'Workstreams', simple: 'Projects', definition: 'Organized project streams with task tracking, agent assignments, and progress monitoring.', category: 'features', aliases: ['projects', 'tasks', 'work items'] },

  // ── Billing ────────────────────────────────────────────────
  threeNinePricing: { technical: '3-6-9 Commitment Model', simple: 'Subscription Plans', definition: 'Pricing tiers: P2P (pay-per-use), 3-month, 6-month, 9-month (pay 9, get 12).', category: 'billing', aliases: ['pricing', 'plans', 'subscription', 'how much', 'cost'] },

  // ── Design ─────────────────────────────────────────────────
  agenticUi: { technical: 'Agentic UI', simple: 'AI Interface', definition: 'The design system: obsidian backgrounds, gold accents, wireframe borders, glass surfaces. Luxury industrial.', category: 'design', aliases: ['the look', 'design', 'theme', 'ui style'] },

  // ── NLP ────────────────────────────────────────────────────
  slangNormalization: { technical: 'Slang Normalization', simple: 'Language Translation', definition: 'NLP pre-processor converting colloquial input to platform terms. "tryna whip up a vid" → "create a video".', category: 'nlp', aliases: ['understand slang', 'casual language'] },
  intentClassification: { technical: 'Intent Classification', simple: 'Understanding What You Mean', definition: 'Pipeline determining user intent — combines NLP normalization + vertical triggers + skill matching.', category: 'nlp', aliases: ['what did i mean', 'figure out intent', 'understand me'] },
};

/**
 * Get a mode-aware label for a term.
 *
 * @param key - The term key from TERMS
 * @param mode - PRIVATE (technical) or PUBLIC (simple)
 * @returns The appropriate label, or the key itself if not found
 *
 * @example
 * const { mode } = usePlatformMode();
 * <h2>{t('circuitBox', mode)}</h2>
 * // PRIVATE → "Circuit Box"
 * // PUBLIC  → "Settings & Services"
 */
export function t(key: string, mode: PlatformMode): string {
  const entry = TERMS[key];
  if (!entry) return key;
  return mode === 'PRIVATE' ? entry.technical : entry.simple;
}

/**
 * Get all terms for a given mode (useful for bulk rendering).
 */
export function getAllTerms(mode: PlatformMode): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, entry] of Object.entries(TERMS)) {
    result[key] = mode === 'PRIVATE' ? entry.technical : entry.simple;
  }
  return result;
}
