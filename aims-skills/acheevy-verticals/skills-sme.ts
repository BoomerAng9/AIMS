/**
 * Skills Subject Matter Expert (SME) Registry
 *
 * Every tool, service, and capability in A.I.M.S. has a formal Skills SME entry.
 * This is NOT documentation for humans. This is documentation FOR AGENTS.
 *
 * When ACHEEVY or any Boomer_Ang encounters a task, they consult this registry
 * to understand:
 *   1. WHAT the tool does (purpose, scope, limitations)
 *   2. HOW to use it (API, parameters, prerequisites)
 *   3. WHEN to use it (triggers, conditions, decision logic)
 *   4. WHEN NOT to use it (anti-patterns, conflicts, cost concerns)
 *   5. HOW IT CONNECTS (dependencies, data flow, integration points)
 *
 * This is the difference between "knowing a tool exists" and
 * "knowing how to use it expertly in the right situation."
 *
 * "A mechanic doesn't just own wrenches. They know which wrench,
 *  which torque, which sequence, and why."
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Skill documentation entry — the SME profile for a tool/service */
export interface SkillSME {
  id: string;
  name: string;
  category: SkillCategory;
  status: 'active' | 'partial' | 'planned' | 'deprecated';

  // ── What ──────────────────────────────────────────────────────────────
  purpose: string;                    // One paragraph: what it does and why
  capabilities: string[];             // Specific things it CAN do
  limitations: string[];              // Things it CANNOT do or shouldn't be used for

  // ── How ───────────────────────────────────────────────────────────────
  usage: {
    apiEndpoint?: string;             // REST endpoint if applicable
    importPath?: string;              // TypeScript import path
    envVars?: string[];               // Required environment variables
    prerequisites?: string[];         // What must be true before using
    parameters?: SkillParameter[];    // Key parameters and their purposes
    exampleInvocation: string;        // How an agent would invoke this
  };

  // ── When ──────────────────────────────────────────────────────────────
  triggers: string[];                 // NLP patterns that should activate this skill
  conditions: string[];               // Conditions that must be true
  decisionLogic: string;              // When to choose this over alternatives

  // ── When NOT ──────────────────────────────────────────────────────────
  antiPatterns: string[];             // Common misuse patterns
  conflicts: string[];                // Skills that conflict with this one
  costConsiderations: string;         // Cost/performance trade-offs

  // ── Connections ───────────────────────────────────────────────────────
  dependencies: string[];             // Skills/services this depends on
  consumers: string[];                // Skills/services that consume this
  dataFlow: string;                   // How data flows through this skill

  // ── AIMS Integration ──────────────────────────────────────────────────
  relatedMethodology?: string;        // Which AIMS methodology this supports
  relatedLIBSection?: 'logic' | 'instructions' | 'behaviors';
  recommendedModel?: string;          // Best LLM for this skill
  lucServiceKey?: string;             // LUC metering key

  // ── Files ─────────────────────────────────────────────────────────────
  sourceFiles: string[];              // TypeScript source files
  skillFile?: string;                 // Skill markdown file
  brainSection?: string;              // ACHEEVY_BRAIN.md section reference
}

export interface SkillParameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
  example?: string;
}

export type SkillCategory =
  | 'llm'                   // Language model routing and inference
  | 'search'                // Web search, research
  | 'voice'                 // TTS, STT, voice pipeline
  | 'deployment'            // Container, plug, instance management
  | 'monitoring'            // Health, metrics, observability
  | 'security'              // Auth, RBAC, compliance
  | 'data'                  // Storage, databases, caching
  | 'communication'         // Messaging, email, social
  | 'content'               // Writing, generation, creative
  | 'code'                  // Code execution, sandboxing
  | 'workflow'              // Automation, pipelines
  | 'analytics'             // Metrics, dashboards, reporting
  | 'billing'               // LUC, Stripe, payments
  | 'agent'                 // Agent management, orchestration
  | 'methodology'           // DMAIC, DMADV, FOSTER, DEVELOP, HONE, LLL
  | 'enterprise';           // Workspace, fleet, security layers

// ---------------------------------------------------------------------------
// Skills SME Registry
// ---------------------------------------------------------------------------

const SKILLS_REGISTRY: SkillSME[] = [
  // ═══════════════════════════════════════════════════════════════════════
  // LLM & Model Intelligence
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: 'openrouter-llm',
    name: 'OpenRouter LLM Gateway',
    category: 'llm',
    status: 'active',
    purpose: 'Unified access to 200+ language models through OpenRouter. Handles chat completions, streaming, cost tracking, and model-specific optimization. This is the engine that powers every agent in AIMS.',
    capabilities: [
      'Chat completions with any model in the OpenRouter catalog',
      'Real-time SSE streaming for token-by-token output',
      'Per-call cost calculation and LUC integration',
      'Automatic model ID resolution (short key → full OpenRouter ID)',
      'Stub mode when API key is not configured (graceful degradation)',
    ],
    limitations: [
      'Cannot run models locally — always requires OpenRouter API',
      'Streaming is SSE-based, not WebSocket',
      'Rate limits depend on OpenRouter account tier',
      'Cannot guarantee model availability (provider outages)',
    ],
    usage: {
      apiEndpoint: '/api/llm/chat, /api/llm/stream',
      importPath: 'backend/uef-gateway/src/llm/openrouter',
      envVars: ['OPENROUTER_API_KEY', 'OPENROUTER_MODEL'],
      prerequisites: ['OPENROUTER_API_KEY must be set'],
      parameters: [
        { name: 'model', type: 'string', required: true, description: 'Model key or full OpenRouter ID', example: 'claude-sonnet-4.6' },
        { name: 'messages', type: 'ChatMessage[]', required: true, description: 'Conversation history' },
        { name: 'max_tokens', type: 'number', required: false, description: 'Max output tokens', example: '4096' },
        { name: 'temperature', type: 'number', required: false, description: 'Creativity (0-2)', example: '0.7' },
        { name: 'stream', type: 'boolean', required: false, description: 'Enable SSE streaming', example: 'true' },
      ],
      exampleInvocation: `const result = await openrouter.chat({ model: 'claude-sonnet-4.6', messages: [{ role: 'user', content: 'Hello' }] });`,
    },
    triggers: ['send to model', 'ask the llm', 'generate response', 'chat completion'],
    conditions: ['OPENROUTER_API_KEY is configured', 'Task requires AI generation'],
    decisionLogic: 'Use for ALL LLM calls. Never call model providers directly. Always route through OpenRouter for unified billing and cost tracking.',
    antiPatterns: [
      'Calling OpenAI/Anthropic APIs directly instead of through OpenRouter',
      'Using Premium tier models for simple classification (use Flash)',
      'Not tracking cost per call (always log LLMResult.cost.usd)',
    ],
    conflicts: [],
    costConsiderations: 'Cost varies 100x between tiers: Flash ($0.10/M) to Opus ($5/M input). Always use Model Intelligence Engine to pick the right tier.',
    dependencies: ['model-intelligence'],
    consumers: ['acheevy-chat', 'boomer-ang-dispatch', 'vertical-execution'],
    dataFlow: 'Agent → Model Intelligence (select model) → OpenRouter Client → OpenRouter API → Response → LUC cost logging',
    relatedMethodology: undefined,
    relatedLIBSection: 'logic',
    recommendedModel: undefined,
    lucServiceKey: 'llm_calls',
    sourceFiles: ['backend/uef-gateway/src/llm/openrouter.ts', 'backend/uef-gateway/src/llm/gateway.ts'],
    skillFile: 'aims-skills/skills/openrouter-llm.skill.md',
    brainSection: 'Section 5: LLM Gateway',
  },

  {
    id: 'model-intelligence',
    name: 'Model Intelligence Engine',
    category: 'llm',
    status: 'active',
    purpose: 'Autonomous model selection based on NLP task classification. Analyzes the task, matches to optimal model strengths, applies budget constraints, and returns a primary + fallback chain. This is the brain behind "which model should I use?"',
    capabilities: [
      'NLP-based task type detection (21 task types)',
      'Model scoring against detected task (capability profiles)',
      'Agent-specific model preferences with task overrides',
      'Budget-tier filtering (premium/standard/economy)',
      'Methodology-aware model selection',
      'Performance tracking and learning from outcomes',
      'Fallback chain generation (primary → fallback → economy)',
    ],
    limitations: [
      'Task classification is pattern-based, not ML — can misclassify novel tasks',
      'Performance learning is in-memory only (no persistence yet)',
      'Does not factor in model availability/outage status',
    ],
    usage: {
      importPath: 'aims-skills/acheevy-verticals/model-intelligence',
      prerequisites: ['Model profiles loaded (automatic on import)'],
      parameters: [
        { name: 'message', type: 'string', required: true, description: 'User message or task description' },
        { name: 'agentRole', type: 'string', required: false, description: 'AIMS agent role (e.g., Buildsmith)', example: 'Buildsmith' },
        { name: 'budgetTier', type: 'string', required: false, description: 'Budget constraint', example: 'standard' },
        { name: 'methodology', type: 'string', required: false, description: 'Active AIMS methodology', example: 'dmaic' },
      ],
      exampleInvocation: `const selection = modelIntelligence.selectModel({ message: 'Build a React component', agentRole: 'Buildsmith' });`,
    },
    triggers: ['which model', 'select model', 'model for this task', 'auto-select'],
    conditions: ['Task requires LLM inference', 'Model selection not hardcoded'],
    decisionLogic: 'Use BEFORE every LLM call to select the optimal model. Only skip if model is explicitly specified by user or configuration.',
    antiPatterns: [
      'Hardcoding model IDs without going through Model Intelligence',
      'Using Opus for everything regardless of task complexity',
      'Ignoring budget tier constraints',
    ],
    conflicts: [],
    costConsiderations: 'The engine itself is zero-cost (runs locally). It SAVES money by routing simple tasks to cheaper models.',
    dependencies: [],
    consumers: ['openrouter-llm', 'acheevy-chat', 'boomer-ang-dispatch'],
    dataFlow: 'Task Message → Task Classifier → Model Scorer → Budget Filter → Selection Result → OpenRouter Client',
    relatedMethodology: undefined,
    relatedLIBSection: 'logic',
    recommendedModel: undefined,
    lucServiceKey: undefined,
    sourceFiles: ['aims-skills/acheevy-verticals/model-intelligence.ts'],
    brainSection: 'Section 31: Model Intelligence Engine',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // Deployment & PaaS
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: 'plug-catalog',
    name: 'Plug Catalog',
    category: 'deployment',
    status: 'active',
    purpose: 'Browsable library of deployable AI tools, agents, and platforms. Every tool follows the MIM template — structure never changes, only the tool does. Users search, filter, and select plugs for one-click deployment.',
    capabilities: [
      'Browse all available plugs by category, tier, tags',
      'Search plugs by free text, category, or delivery mode',
      'Get detailed plug definitions with resource requirements',
      'Filter by delivery mode (hosted/exported/hybrid)',
    ],
    limitations: [
      'Catalog is in-memory (not persisted to database yet)',
      'No user ratings or reviews system',
      'No automatic plug discovery from external registries',
    ],
    usage: {
      apiEndpoint: '/api/plugs/catalog, /api/plugs/search',
      importPath: 'backend/uef-gateway/src/plug-catalog/catalog',
      prerequisites: ['Plug definitions loaded in catalog'],
      parameters: [
        { name: 'q', type: 'string', required: false, description: 'Free text search query' },
        { name: 'category', type: 'PlugCategory', required: false, description: 'Filter by category' },
        { name: 'tier', type: 'PlugTier', required: false, description: 'Filter by pricing tier' },
      ],
      exampleInvocation: `const results = plugCatalog.search({ category: 'agent-framework', tier: 'pro' });`,
    },
    triggers: ['browse tools', 'show me plugs', 'available tools', 'what can I deploy'],
    conditions: ['User wants to discover deployable tools'],
    decisionLogic: 'Use when user is exploring or selecting tools. For actual deployment, hand off to Plug Spin-Up.',
    antiPatterns: ['Deploying without showing the catalog first', 'Not running Needs Analysis for enterprise clients'],
    conflicts: [],
    costConsiderations: 'Browsing is free. Deployment costs vary by plug tier and resources.',
    dependencies: [],
    consumers: ['plug-spinup', 'needs-analysis'],
    dataFlow: 'User Query → Catalog Search → Filtered Results → UI Display → User Selection → Spin-Up Request',
    relatedMethodology: 'foster',
    relatedLIBSection: 'instructions',
    recommendedModel: 'gemini-3.0-flash',
    lucServiceKey: undefined,
    sourceFiles: ['backend/uef-gateway/src/plug-catalog/catalog.ts', 'backend/uef-gateway/src/plug-catalog/types.ts'],
    skillFile: 'aims-skills/skills/plug-catalog/plug-catalog.skill.md',
    brainSection: 'Section 17: Plug Catalog',
  },

  {
    id: 'plug-spinup',
    name: 'Plug Spin-Up Engine',
    category: 'deployment',
    status: 'active',
    purpose: 'One-click container deployment. Takes a plug definition + user customization and provisions a Docker container with auto-generated compose file, nginx reverse proxy, port allocation, and health checks.',
    capabilities: [
      'Generate Docker Compose from plug definition',
      'Allocate ports in 51000+ range with 10-port increments',
      'Generate nginx reverse proxy configuration',
      'Generate .env templates with categorized variables',
      'Generate setup scripts and README',
      'Track instance lifecycle (configuring → provisioning → running)',
      'Export bundles for self-hosting',
    ],
    limitations: [
      'Currently simulates container start (Docker API integration pending)',
      'Port allocation is sequential (no conflict detection against OS)',
      'nginx config is generated but not written to disk automatically',
      'No continuous health monitoring yet',
    ],
    usage: {
      apiEndpoint: '/api/plugs/spin-up',
      importPath: 'backend/uef-gateway/src/plug-catalog/deploy-engine',
      prerequisites: ['Plug must exist in catalog', 'Plug must not be comingSoon', 'Delivery mode must be supported'],
      parameters: [
        { name: 'plugId', type: 'string', required: true, description: 'Plug ID from catalog' },
        { name: 'userId', type: 'string', required: true, description: 'Deploying user ID' },
        { name: 'instanceName', type: 'string', required: true, description: 'User-chosen instance name' },
        { name: 'deliveryMode', type: 'DeliveryMode', required: true, description: 'hosted or exported' },
      ],
      exampleInvocation: `const result = plugDeployEngine.spinUp({ plugId: 'openclaw', userId: 'user-123', instanceName: 'my-agent', deliveryMode: 'hosted', customizations: {}, envOverrides: {} });`,
    },
    triggers: ['spin up', 'deploy', 'launch', 'start instance', 'create instance'],
    conditions: ['User has selected a plug', 'User has required LUC credits', 'Plug is not comingSoon'],
    decisionLogic: 'Use after user selects a plug from the catalog. For enterprise, also require Needs Analysis and approval gate.',
    antiPatterns: ['Deploying without LUC quote', 'Deploying enterprise without approval', 'Spinning up duplicate instances'],
    conflicts: [],
    costConsiderations: 'Each instance has ongoing LUC cost based on tier + resources. Always show estimate before deploying.',
    dependencies: ['plug-catalog', 'port-allocation', 'nginx-manager'],
    consumers: ['fleet-manager', 'health-monitor', 'acheevy-dispatch'],
    dataFlow: 'SpinUpRequest → Validate → Port Alloc → Compose Gen → Nginx Gen → Container Start → Health Check → Running',
    relatedMethodology: 'develop',
    relatedLIBSection: 'instructions',
    recommendedModel: 'claude-haiku-4.5',
    lucServiceKey: 'plug_deploy',
    sourceFiles: ['backend/uef-gateway/src/plug-catalog/deploy-engine.ts'],
    skillFile: 'aims-skills/skills/plug-catalog/plug-spin-up.skill.md',
    brainSection: 'Section 18: Plug Spin-Up',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // Methodology Engine
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: 'methodology-engine',
    name: 'Methodology Engine',
    category: 'methodology',
    status: 'active',
    purpose: 'Six structured methodologies (DMAIC, DMADV, FOSTER, DEVELOP, HONE, Look-Listen-Learn) that guide how ACHEEVY and agents approach every task. Not random — deliberate. The methodology determines the approach before execution begins.',
    capabilities: [
      'Recommend methodology based on task analysis',
      'Detect methodology from natural language (NLP pattern matching)',
      'Manage methodology sessions with phase gating',
      'Track progress through methodology phases',
      'Phase-level deliverable requirements',
    ],
    limitations: [
      'Sessions are in-memory (no persistence yet)',
      'Phase gating is advisory, not enforced at execution level',
      'Cannot run multiple methodologies simultaneously on same session',
    ],
    usage: {
      importPath: 'aims-skills/acheevy-verticals/methodology-engine',
      prerequisites: ['Task context available for recommendation'],
      parameters: [
        { name: 'taskDescription', type: 'string', required: true, description: 'What needs to be done' },
        { name: 'context', type: 'object', required: false, description: 'Current state, constraints' },
      ],
      exampleInvocation: `const recommendation = methodologyEngine.recommend({ taskDescription: 'Fix the auth bug', currentState: 'broken' });`,
    },
    triggers: ['how should we approach', 'methodology', 'framework', 'which process'],
    conditions: ['Task is non-trivial', 'Structured approach would improve outcome'],
    decisionLogic: 'Apply methodology for any multi-step task. DMAIC for fixing, DMADV for creating, FOSTER for nurturing, DEVELOP for building, HONE for polishing, LLL always.',
    antiPatterns: ['Skipping methodology for complex tasks', 'Using DEVELOP for bug fixes (use DMAIC)', 'Applying HONE before DEVELOP is complete'],
    conflicts: [],
    costConsiderations: 'Zero direct cost — methodology is logic, not compute.',
    dependencies: ['model-intelligence'],
    consumers: ['vertical-execution', 'transaction-model', 'acheevy-chat'],
    dataFlow: 'Task → Methodology Recommendation → Session Creation → Phase Progression → Deliverables → Completion',
    relatedMethodology: undefined,
    relatedLIBSection: 'logic',
    recommendedModel: 'gemini-3.1-pro',
    lucServiceKey: undefined,
    sourceFiles: ['aims-skills/acheevy-verticals/methodology-engine.ts'],
    brainSection: 'Section 25: Methodology Engine',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // Transaction Model
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: 'transaction-model',
    name: 'Transaction Model',
    category: 'agent',
    status: 'active',
    purpose: 'Every agent action is an owned, accountable transaction. A transaction has an owner, a lifecycle (draft→pending→executing→review→complete/failed), gates (ORACLE, budget, human), cost tracking, and audit trail. No action without ownership.',
    capabilities: [
      'Create transactions with owner, category, and estimated cost',
      'Gate enforcement (ORACLE 8-gate, budget, human-in-the-loop)',
      'Transaction lifecycle management with state transitions',
      'Cost tracking (estimated vs actual)',
      'Automatic audit trail generation',
      'Transaction categorization for analytics',
    ],
    limitations: [
      'In-memory storage (needs Firestore persistence)',
      'ORACLE gate checks are placeholder (need real implementation)',
      'No transaction rollback mechanism',
    ],
    usage: {
      importPath: 'aims-skills/acheevy-verticals/transaction-model',
      prerequisites: ['Agent has a valid user context', 'Transaction category is valid'],
      exampleInvocation: `const tx = transactionManager.create({ owner: 'Buildsmith', userId: 'user-123', category: 'code_generation', description: 'Build React component', estimatedCost: 0.25 });`,
    },
    triggers: ['track this action', 'create transaction', 'log this work'],
    conditions: ['Agent is performing a billable or auditable action'],
    decisionLogic: 'Create a transaction for EVERY agent action that costs money, modifies state, or requires audit. Skip only for read-only queries.',
    antiPatterns: ['Agent actions without transactions', 'Skipping gates for convenience', 'Not closing completed transactions'],
    conflicts: [],
    costConsiderations: 'Transactions themselves are free. They track the cost of the underlying action.',
    dependencies: ['audit-ledger'],
    consumers: ['vertical-execution', 'luc-engine', 'acheevy-dispatch'],
    dataFlow: 'Agent Action → Transaction Created → Gates Evaluated → Execute → Cost Recorded → Audit Logged → Transaction Closed',
    relatedMethodology: undefined,
    relatedLIBSection: 'behaviors',
    recommendedModel: undefined,
    lucServiceKey: undefined,
    sourceFiles: ['aims-skills/acheevy-verticals/transaction-model.ts'],
    brainSection: 'Section 24: Transaction Model',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // Look-Listen-Learn Engine
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: 'look-listen-learn',
    name: 'Look-Listen-Learn Engine (LLL)',
    category: 'methodology',
    status: 'active',
    purpose: 'The engagement triad that runs in parallel with EVERY interaction. LOOK: analyze visual/document inputs. LISTEN: detect triggers, emotion, engagement patterns. LEARN: store patterns, adapt behavior, build user profiles. Always on.',
    capabilities: [
      'LOOK: Document analysis, entity extraction, visual scanning',
      'LISTEN: Trigger detection, emotional signal analysis, intent recognition',
      'LEARN: User profile building, pattern storage, behavioral adaptation',
      'Composite engagement analysis across all three phases',
      'Continuous adaptation without explicit user instruction',
    ],
    limitations: [
      'LOOK phase needs actual OCR/vision model integration for images',
      'LEARN profiles are in-memory (need persistence)',
      'Emotional signal detection is pattern-based, not ML',
    ],
    usage: {
      importPath: 'aims-skills/acheevy-verticals/look-listen-learn',
      prerequisites: ['User context available', 'Message content provided'],
      exampleInvocation: `const engagement = analyzeEngagement({ message: 'Build me an app', userId: 'user-123' });`,
    },
    triggers: ['Always active — runs on every message'],
    conditions: ['User message exists'],
    decisionLogic: 'ALWAYS run on every user interaction. This is not optional. LLL informs model selection, tone adjustment, and methodology recommendation.',
    antiPatterns: ['Disabling LLL for performance', 'Not feeding LLL results to Model Intelligence', 'Ignoring emotional signals'],
    conflicts: [],
    costConsiderations: 'LLL itself is zero-cost (runs locally). LOOK phase may invoke vision model if images present.',
    dependencies: ['model-intelligence'],
    consumers: ['acheevy-chat', 'personality-inheritance', 'methodology-engine'],
    dataFlow: 'User Message → LOOK + LISTEN + LEARN (parallel) → Engagement Analysis → Inform Response Strategy',
    relatedMethodology: 'lookListenLearn',
    relatedLIBSection: 'behaviors',
    recommendedModel: 'kimi-k2.5',
    lucServiceKey: undefined,
    sourceFiles: ['aims-skills/acheevy-verticals/look-listen-learn.ts'],
    brainSection: 'Section 27: Look-Listen-Learn Engine',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // Enterprise Features
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: 'enterprise-workspace',
    name: 'Enterprise Workspace Manager',
    category: 'enterprise',
    status: 'active',
    purpose: 'Organization-level container that holds members, RBAC, compliance profiles, network isolation, resource limits, and deployed instances. Every enterprise customer operates within a workspace — no workspace, no enterprise features.',
    capabilities: [
      'Create workspaces with 3 plan tiers (Starter $499, Professional $1999, Critical $4999)',
      '6 roles with 17 granular permissions',
      'Member management (add, remove, change role)',
      'Instance registration per workspace',
      'Environment segregation (production/staging/development)',
      'Compliance profile configuration (SOC2/HIPAA/GDPR/PCI-DSS)',
      'Network isolation settings (VPC, ingress/egress policy)',
    ],
    limitations: [
      'RBAC is in-memory (needs Firestore persistence)',
      'Network isolation is configured but not enforced at Docker level',
      'No SSO integration yet',
    ],
    usage: {
      importPath: 'aims-skills/acheevy-verticals/enterprise-workspace',
      prerequisites: ['User has enterprise plan or trial'],
      exampleInvocation: `const ws = workspaceManager.createWorkspace({ name: 'Acme Corp', ownerId: 'owner-123', planId: 'professional' });`,
    },
    triggers: ['enterprise', 'workspace', 'organization', 'team management'],
    conditions: ['User is on enterprise plan', 'Workspace does not already exist'],
    decisionLogic: 'Required for all enterprise features. Create workspace first, then add members, then deploy instances.',
    antiPatterns: ['Deploying instances without workspace', 'Granting admin to all members', 'Skipping compliance setup'],
    conflicts: [],
    costConsiderations: 'Base plan cost + per-instance fees. Always show total fleet cost before approval.',
    dependencies: ['enterprise-security', 'enterprise-fleet'],
    consumers: ['plug-spinup', 'fleet-manager', 'acheevy-dispatch'],
    dataFlow: 'Owner → Create Workspace → Add Members → Configure Compliance → Deploy Instances → Monitor Fleet',
    relatedMethodology: 'develop',
    relatedLIBSection: 'instructions',
    recommendedModel: 'claude-sonnet-4.6',
    lucServiceKey: 'enterprise_workspace',
    sourceFiles: ['aims-skills/acheevy-verticals/enterprise-workspace.ts'],
    brainSection: 'Section 30: Enterprise Launch',
  },

  {
    id: 'enterprise-security',
    name: 'Enterprise Security Layer',
    category: 'security',
    status: 'active',
    purpose: 'Tenant isolation, compliance gates, network security rules, and data boundaries. Every enterprise workspace is a security boundary. What happens inside one workspace CANNOT leak to another. Non-negotiable.',
    capabilities: [
      'Security event logging with severity and outcome tracking',
      'Authorization with RBAC + compliance gate + IP allowlist checks',
      '12 compliance gates across SOC2, HIPAA, GDPR, PCI-DSS',
      'Network security rule evaluation (ingress/egress)',
      'Data boundary enforcement (residency, classification, encryption)',
      'Compliance audit reporting',
    ],
    limitations: [
      'Security events are in-memory (need persistent audit log)',
      'Network rules are evaluated but not enforced at firewall level',
      'Data boundary checks do not intercept actual data movement',
    ],
    usage: {
      importPath: 'aims-skills/acheevy-verticals/enterprise-security',
      prerequisites: ['Workspace exists', 'Compliance profile configured'],
      exampleInvocation: `const authResult = enterpriseSecurity.authorize({ workspaceId: 'ws-123', userId: 'user-456', permission: 'deploy', ... });`,
    },
    triggers: ['compliance', 'security audit', 'access control', 'data boundary'],
    conditions: ['Enterprise workspace is active', 'Action requires authorization'],
    decisionLogic: 'Run on EVERY enterprise action. No bypass. If compliance gate fails, the action is blocked — period.',
    antiPatterns: ['Bypassing security checks', 'Not logging security events', 'Allowing public ingress for enterprise'],
    conflicts: [],
    costConsiderations: 'Security checks are zero-cost. Non-compliance costs are infinite.',
    dependencies: ['enterprise-workspace'],
    consumers: ['plug-spinup', 'fleet-manager', 'acheevy-dispatch'],
    dataFlow: 'Action Request → RBAC Check → IP Allowlist → Compliance Gates → Network Rules → Data Boundary → Allow/Deny + Log',
    relatedMethodology: undefined,
    relatedLIBSection: 'behaviors',
    recommendedModel: undefined,
    lucServiceKey: undefined,
    sourceFiles: ['aims-skills/acheevy-verticals/enterprise-security.ts'],
    brainSection: 'Section 30: Enterprise Launch',
  },

  {
    id: 'enterprise-fleet',
    name: 'Enterprise Fleet Manager',
    category: 'enterprise',
    status: 'active',
    purpose: 'Multi-instance orchestration for organizations that deploy 10, 20, 50+ instances. Handles bulk spin-up from deployment manifests, fleet health monitoring, resource pooling, dependency-aware operations, and environment management.',
    capabilities: [
      'Instance registration with dependency tracking',
      'Deployment manifests for bulk spin-up',
      'Topological sort for dependency-resolved deployment order',
      'Manifest validation against resource limits',
      'Fleet health snapshots (by status, health, environment)',
      'Bulk operations (start, stop, restart, decommission, health-check)',
      'Environment filtering (prod/staging/dev)',
      'Tag-based instance grouping and operations',
    ],
    limitations: [
      'Fleet data is in-memory (needs persistence)',
      'Bulk operations are synchronous (should be async with progress tracking)',
      'No automatic rollback on partial bulk operation failure',
    ],
    usage: {
      importPath: 'aims-skills/acheevy-verticals/enterprise-fleet',
      prerequisites: ['Workspace exists', 'Workspace has instance capacity'],
      exampleInvocation: `const manifest = fleetManager.createManifest({ workspaceId: 'ws-123', name: 'Production Fleet', instances: [...] });`,
    },
    triggers: ['fleet', 'bulk deploy', 'all instances', 'fleet health'],
    conditions: ['Enterprise workspace active', 'Instances exist or manifest provided'],
    decisionLogic: 'Use for any operation involving multiple instances. Single instance operations should go through Plug Spin-Up directly.',
    antiPatterns: ['Deploying large fleets without manifest validation', 'Stopping dependencies before dependents', 'Not checking fleet health after deployment'],
    conflicts: [],
    costConsiderations: 'Fleet cost = sum of all instance costs. Always show aggregate cost estimate from manifest.',
    dependencies: ['enterprise-workspace', 'enterprise-security', 'plug-spinup'],
    consumers: ['acheevy-dispatch'],
    dataFlow: 'Manifest → Validate → Approve → Dependency Sort → Sequential Deploy → Health Check → Fleet Active',
    relatedMethodology: 'develop',
    relatedLIBSection: 'instructions',
    recommendedModel: 'claude-sonnet-4.6',
    lucServiceKey: 'fleet_management',
    sourceFiles: ['aims-skills/acheevy-verticals/enterprise-fleet.ts'],
    brainSection: 'Section 30: Enterprise Launch',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // Personality & L.I.B.
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: 'personality-inheritance',
    name: 'Personality Inheritance Engine',
    category: 'agent',
    status: 'active',
    purpose: 'Every Boomer_Ang carries ACHEEVY DNA. The master trait library (21 traits) is filtered by role-specific preferences to create unique but consistent personalities. This is not cosmetic — personality drives communication style, decision-making bias, and collaboration patterns.',
    capabilities: [
      '21-trait master library with weight, expression, and active conditions',
      '16 role-specific trait preferences',
      'Context-aware trait adjustment (methodology, urgency, formality)',
      'Personality snapshot generation for agent initialization',
    ],
    limitations: [
      'Trait weights are static (not adaptive to user feedback yet)',
      'No personality A/B testing framework',
    ],
    usage: {
      importPath: 'aims-skills/acheevy-verticals/personality-inheritance',
      prerequisites: ['Role is defined in role preferences'],
      exampleInvocation: `const personality = inheritPersonality({ role: 'Buildsmith', context: { methodology: 'develop', urgency: 'standard' } });`,
    },
    triggers: ['agent personality', 'how should this agent act', 'tone', 'communication style'],
    conditions: ['Agent is being initialized or reconfigured'],
    decisionLogic: 'Apply on agent creation and when methodology changes. Personality informs prompt engineering for the agent.',
    antiPatterns: ['All agents having identical personality', 'Overriding personality for every message'],
    conflicts: [],
    costConsiderations: 'Zero cost — personality is computed locally.',
    dependencies: ['acheevy-lib'],
    consumers: ['boomer-ang-dispatch', 'acheevy-chat'],
    dataFlow: 'Role → Master Traits → Role Filter → Context Adjust → Personality Snapshot → System Prompt',
    relatedMethodology: undefined,
    relatedLIBSection: 'behaviors',
    recommendedModel: undefined,
    lucServiceKey: undefined,
    sourceFiles: ['aims-skills/acheevy-verticals/personality-inheritance.ts'],
    brainSection: 'Section 28: Personality Inheritance',
  },

  {
    id: 'acheevy-lib',
    name: 'L.I.B. — Logic, Instructions, Behaviors',
    category: 'agent',
    status: 'active',
    purpose: 'ACHEEVY behavioral specification. Three layers: LOGIC (reasoning principles, decision frameworks), INSTRUCTIONS (operational directives, do/don\'t rules), BEHAVIORS (interaction patterns, personality expression). Not a "soul.md" — a formal spec.',
    capabilities: [
      'Logic layer: decision priority, evidence standards, escalation rules',
      'Instructions layer: operational directives, scope rules, integration points',
      'Behaviors layer: interaction patterns, tone guidelines, personality traits',
      'Prompt builder that composes all three layers into system prompt',
    ],
    limitations: [
      'Static definition — no runtime adaptation',
      'Cannot enforce behaviors at execution level (advisory only)',
    ],
    usage: {
      importPath: 'aims-skills/acheevy-verticals/instructions/acheevy-lib.instructions',
      prerequisites: [],
      exampleInvocation: `const prompt = buildLIBPrompt({ methodology: 'develop', traits: personality.traits });`,
    },
    triggers: ['how should acheevy behave', 'system prompt', 'agent instructions'],
    conditions: ['Building or refreshing agent system prompt'],
    decisionLogic: 'Always include L.I.B. in system prompts. Logic layer first, then Instructions, then Behaviors.',
    antiPatterns: ['Skipping Logic layer', 'Overriding L.I.B. with ad-hoc instructions'],
    conflicts: [],
    costConsiderations: 'Adds ~500 tokens to system prompt. Worth it for consistency.',
    dependencies: [],
    consumers: ['acheevy-chat', 'personality-inheritance', 'boomer-ang-dispatch'],
    dataFlow: 'Agent Init → L.I.B. Prompt Build → System Prompt → LLM Call',
    relatedMethodology: undefined,
    relatedLIBSection: undefined,
    recommendedModel: undefined,
    lucServiceKey: undefined,
    sourceFiles: ['aims-skills/acheevy-verticals/instructions/acheevy-lib.instructions.ts'],
    brainSection: 'Section 26: L.I.B.',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // Search & Research
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: 'unified-search',
    name: 'Unified Search (Brave → Tavily → Serper)',
    category: 'search',
    status: 'active',
    purpose: 'Web search with automatic fallback chain. Brave Search Pro is primary (AI-powered summaries), Tavily is first fallback, Serper is last resort. Every search goes through the priority chain automatically.',
    capabilities: [
      'Web search with AI-powered summaries (Brave Pro)',
      'Automatic fallback: Brave → Tavily → Serper',
      'Results standardized into common format',
    ],
    limitations: [
      'Requires at least one search API key configured',
      'Rate limits vary by provider',
    ],
    usage: {
      apiEndpoint: '/api/search',
      envVars: ['BRAVE_API_KEY', 'TAVILY_API_KEY', 'SERPER_API_KEY'],
      prerequisites: ['At least one search API key configured'],
      exampleInvocation: `const results = await unifiedSearch('latest AI frameworks 2026');`,
    },
    triggers: ['search', 'look up', 'find', 'research', 'what is'],
    conditions: ['Task requires external information'],
    decisionLogic: 'Use when the answer is not in AIMS context. Model Intelligence recommends Gemini 3.1 Pro for research synthesis after search.',
    antiPatterns: ['Searching for information already in AIMS Brain', 'Not caching repeat searches'],
    conflicts: [],
    costConsiderations: 'Brave Pro ~$0.005/search. Budget for research-heavy verticals.',
    dependencies: [],
    consumers: ['scout-ang', 'acheevy-chat', 'research-vertical'],
    dataFlow: 'Query → Brave (primary) → Tavily (fallback) → Serper (last resort) → Standardized Results',
    relatedMethodology: 'dmaic',
    relatedLIBSection: 'logic',
    recommendedModel: 'gemini-3.1-pro',
    lucServiceKey: 'web_search',
    sourceFiles: ['backend/uef-gateway/src/search/unified-search.ts'],
    brainSection: 'Section 6: Search',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // Voice Pipeline
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: 'voice-pipeline',
    name: 'Voice I/O Pipeline',
    category: 'voice',
    status: 'partial',
    purpose: 'Voice input (STT) and output (TTS) pipeline. Groq Whisper for speech-to-text, ElevenLabs for text-to-speech, with Deepgram as fallback for both. Enables voice-first interaction with ACHEEVY.',
    capabilities: [
      'Speech-to-text via Groq Whisper (primary) or Deepgram Nova (fallback)',
      'Text-to-speech via ElevenLabs (primary) or Deepgram Aura (fallback)',
      'Browser SpeechSynthesis as emergency TTS fallback',
    ],
    limitations: [
      'E2E flow not fully tested in production',
      'No real-time voice streaming (request/response only)',
      'Needs voice model personalization for ACHEEVY persona',
    ],
    usage: {
      apiEndpoint: '/api/voice/tts, /api/voice/stt',
      envVars: ['ELEVENLABS_API_KEY', 'GROQ_API_KEY', 'DEEPGRAM_API_KEY'],
      prerequisites: ['At least one TTS and one STT API key configured'],
      exampleInvocation: `const audio = await tts('Hello, I am ACHEEVY.');`,
    },
    triggers: ['speak', 'voice', 'listen', 'talk to me', 'say this'],
    conditions: ['User has microphone access', 'Voice API keys configured'],
    decisionLogic: 'Activate when user enables voice mode or sends audio input.',
    antiPatterns: ['Using voice for data-heavy responses', 'Not providing text fallback'],
    conflicts: [],
    costConsiderations: 'ElevenLabs ~$0.30/1K chars. Use for short responses, text for long.',
    dependencies: ['openrouter-llm'],
    consumers: ['acheevy-chat'],
    dataFlow: 'Audio Input → STT → Text → ACHEEVY → Response Text → TTS → Audio Output',
    relatedMethodology: 'lookListenLearn',
    relatedLIBSection: 'behaviors',
    recommendedModel: undefined,
    lucServiceKey: 'voice_io',
    sourceFiles: [],
    brainSection: 'Section 8: Voice Pipeline',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // Needs Analysis
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: 'needs-analysis',
    name: 'Needs Analysis Engine',
    category: 'deployment',
    status: 'active',
    purpose: '5-section client intake (business, technical, security, delivery, budget) with risk assessment, compliance detection, plug recommendation, and cost estimation. For enterprise clients, this is the first step — always.',
    capabilities: [
      '5-section needs questionnaire generation',
      'Risk assessment and classification',
      'Compliance requirement detection',
      'Plug and tier recommendation',
      'Monthly cost estimation',
      'Definition of done generation',
      'Acceptance criteria (Given/When/Then)',
    ],
    limitations: [
      'Recommendations are rule-based, not ML',
      'Cannot verify client-provided information',
    ],
    usage: {
      apiEndpoint: '/api/plugs/needs-analysis',
      importPath: 'backend/uef-gateway/src/plug-catalog/needs-analysis',
      prerequisites: ['Client context (industry, scale, requirements)'],
      exampleInvocation: `const analysis = needsAnalysis.analyze(responses);`,
    },
    triggers: ['needs analysis', 'requirements', 'what do I need', 'recommend', 'assess'],
    conditions: ['New enterprise client', 'Complex deployment decision'],
    decisionLogic: 'Run for all enterprise clients before deployment. Optional for individual users deploying simple plugs.',
    antiPatterns: ['Skipping for enterprise clients', 'Not running risk assessment'],
    conflicts: [],
    costConsiderations: 'Analysis itself is free. Results inform cost-impacting deployment decisions.',
    dependencies: ['plug-catalog'],
    consumers: ['enterprise-workspace', 'plug-spinup'],
    dataFlow: 'Client Intake → 5-Section Questions → Responses → Risk Assessment → Recommendations → Plug Selection',
    relatedMethodology: 'foster',
    relatedLIBSection: 'instructions',
    recommendedModel: 'claude-sonnet-4.6',
    lucServiceKey: undefined,
    sourceFiles: ['backend/uef-gateway/src/plug-catalog/needs-analysis.ts', 'backend/uef-gateway/src/intake/requirements.ts'],
    brainSection: 'Section 19: Needs Analysis',
  },
];

// ---------------------------------------------------------------------------
// Skills SME Engine
// ---------------------------------------------------------------------------

class SkillsSMEEngine {
  private skills: Map<string, SkillSME>;

  constructor() {
    this.skills = new Map();
    for (const skill of SKILLS_REGISTRY) {
      this.skills.set(skill.id, skill);
    }
  }

  /** Get a skill by ID */
  get(skillId: string): SkillSME | undefined {
    return this.skills.get(skillId);
  }

  /** Get all skills */
  getAll(): SkillSME[] {
    return Array.from(this.skills.values());
  }

  /** Get skills by category */
  getByCategory(category: SkillCategory): SkillSME[] {
    return this.getAll().filter(s => s.category === category);
  }

  /** Get active skills */
  getActive(): SkillSME[] {
    return this.getAll().filter(s => s.status === 'active');
  }

  /**
   * Find skills that match a user message.
   * Used by ACHEEVY to determine which skills are relevant to a task.
   */
  matchSkills(message: string): Array<{ skill: SkillSME; matchedTriggers: string[] }> {
    const matches: Array<{ skill: SkillSME; matchedTriggers: string[] }> = [];
    const lowerMessage = message.toLowerCase();

    for (const skill of this.skills.values()) {
      const matchedTriggers: string[] = [];
      for (const trigger of skill.triggers) {
        if (lowerMessage.includes(trigger.toLowerCase())) {
          matchedTriggers.push(trigger);
        }
      }
      if (matchedTriggers.length > 0) {
        matches.push({ skill, matchedTriggers });
      }
    }

    // Sort by number of matched triggers (more matches = higher relevance)
    return matches.sort((a, b) => b.matchedTriggers.length - a.matchedTriggers.length);
  }

  /**
   * Build a skills context prompt for an agent.
   * Returns a concise summary of relevant skills for the current task.
   */
  buildSkillsContext(message: string): string {
    const matches = this.matchSkills(message);
    if (matches.length === 0) return '';

    const lines = ['## Available Skills for This Task\n'];
    for (const { skill } of matches.slice(0, 5)) {
      lines.push(`### ${skill.name} (${skill.id})`);
      lines.push(`${skill.purpose}\n`);
      lines.push(`**Use when:** ${skill.decisionLogic}`);
      lines.push(`**API:** ${skill.usage.apiEndpoint || skill.usage.importPath || 'Internal'}`);
      if (skill.recommendedModel) {
        lines.push(`**Best model:** ${skill.recommendedModel}`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Get the full SME briefing for a skill.
   * This is the complete knowledge dump for when an agent needs to become
   * an expert on a specific tool.
   */
  getFullBriefing(skillId: string): string | undefined {
    const skill = this.skills.get(skillId);
    if (!skill) return undefined;

    return [
      `# ${skill.name} — Subject Matter Expert Briefing`,
      '',
      `**Status:** ${skill.status}`,
      `**Category:** ${skill.category}`,
      '',
      '## Purpose',
      skill.purpose,
      '',
      '## Capabilities',
      ...skill.capabilities.map(c => `- ${c}`),
      '',
      '## Limitations',
      ...skill.limitations.map(l => `- ${l}`),
      '',
      '## Usage',
      skill.usage.apiEndpoint ? `**Endpoint:** ${skill.usage.apiEndpoint}` : '',
      skill.usage.importPath ? `**Import:** ${skill.usage.importPath}` : '',
      skill.usage.envVars ? `**Env Vars:** ${skill.usage.envVars.join(', ')}` : '',
      skill.usage.prerequisites ? `**Prerequisites:** ${skill.usage.prerequisites.join(', ')}` : '',
      '',
      '## Example',
      '```typescript',
      skill.usage.exampleInvocation,
      '```',
      '',
      '## Decision Logic',
      skill.decisionLogic,
      '',
      '## Anti-Patterns',
      ...skill.antiPatterns.map(a => `- ${a}`),
      '',
      '## Data Flow',
      skill.dataFlow,
      '',
      '## Dependencies',
      skill.dependencies.length > 0 ? skill.dependencies.join(', ') : 'None',
      '',
      '## Cost',
      skill.costConsiderations,
      '',
      skill.recommendedModel ? `**Recommended Model:** ${skill.recommendedModel}` : '',
      skill.relatedMethodology ? `**Methodology:** ${skill.relatedMethodology}` : '',
      skill.brainSection ? `**Brain Reference:** ${skill.brainSection}` : '',
    ].filter(Boolean).join('\n');
  }
}

// ---------------------------------------------------------------------------
// Singleton Export
// ---------------------------------------------------------------------------

export const skillsSME = new SkillsSMEEngine();

// Re-export registry for direct access
export { SKILLS_REGISTRY };
