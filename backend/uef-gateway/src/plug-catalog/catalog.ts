/**
 * Plug Catalog — Tool Registry
 *
 * The canonical registry of all deployable AI tools, agents, and platforms.
 * Each entry is a PlugDefinition that describes everything needed to spin up,
 * configure, secure, and deliver the tool to a customer.
 *
 * Adding a new tool:
 * 1. Create a PlugDefinition following the interface
 * 2. Add it to PLUG_REGISTRY below
 * 3. The Deploy Engine + Export Engine automatically support it
 *
 * The structure never changes — only the plug content does.
 */

import type { PlugDefinition, CatalogSearchQuery, CatalogSearchResult, PlugCategory } from './types';
import logger from '../logger';

// ---------------------------------------------------------------------------
// Plug Registry — Seed Data
// ---------------------------------------------------------------------------

const PLUG_REGISTRY: PlugDefinition[] = [
  // ── AGENT FRAMEWORKS ────────────────────────────────────────────────────

  {
    id: 'openclaw',
    name: 'OpenClaw',
    tagline: 'Computer-use agent orchestrator with sub-agent spawning',
    description: 'Deploy a full OpenClaw instance with orchestrator + up to 8 sub-agents. Each agent gets its own computer (container) for parallel task execution. Perfect for RPA, desktop automation, and workflow building.',
    category: 'computer-use',
    tags: ['computer-use', 'rpa', 'sub-agents', 'automation', 'orchestrator'],
    tier: 'pro',
    version: '1.0.0',
    sourceUrl: 'https://github.com/openclaw-ai/openclaw',
    license: 'Apache-2.0',
    docker: {
      image: 'openclaw/openclaw:latest',
    },
    resources: { cpuLimit: '2', memoryLimit: '4G', gpuRequired: false },
    ports: [
      { internal: 8080, description: 'Web UI', protocol: 'http' },
      { internal: 8081, description: 'API', protocol: 'http' },
    ],
    volumes: [
      { name: 'openclaw-data', mountPath: '/app/data', description: 'Agent workspace and outputs', persistent: true },
      { name: 'openclaw-skills', mountPath: '/app/skills', description: 'Custom skills directory', persistent: true },
    ],
    healthCheck: { endpoint: '/health', interval: '30s', timeout: '10s', retries: 3, startPeriod: '30s' },
    envVars: [
      { key: 'ANTHROPIC_API_KEY', description: 'Claude API key for agent reasoning', required: true, sensitive: true, category: 'llm' },
      { key: 'OPENAI_API_KEY', description: 'OpenAI fallback key', required: false, sensitive: true, category: 'llm' },
      { key: 'MAX_SUB_AGENTS', description: 'Maximum sub-agents to spawn', required: false, default: '4', sensitive: false, category: 'core' },
      { key: 'AGENT_TIMEOUT_S', description: 'Agent task timeout in seconds', required: false, default: '3600', sensitive: false, category: 'core' },
    ],
    networkPolicy: { internetAccess: true, allowedEgress: ['*'], isolatedSandbox: false, bridgeToAims: true },
    securityLevel: 'hardened',
    customizations: [
      { id: 'sub-agents', label: 'Sub-Agent Count', description: 'How many parallel agents', type: 'select', options: ['1', '2', '4', '8'], default: '4', envMapping: 'MAX_SUB_AGENTS' },
      { id: 'auto-browse', label: 'Auto Browser', description: 'Enable browser automation', type: 'toggle', default: true },
      { id: 'timeout', label: 'Task Timeout', description: 'Max seconds per task', type: 'number', default: 3600, envMapping: 'AGENT_TIMEOUT_S' },
    ],
    dependencies: ['redis'],
    supportedDelivery: ['hosted', 'exported'],
    defaultDelivery: 'hosted',
    icon: 'Bot',
    accentColor: '#6366f1',
    featured: true,
    comingSoon: false,
    addedAt: '2026-02-21',
  },

  {
    id: 'agent-zero',
    name: 'Agent Zero',
    tagline: 'Autonomous AI agent with computer-as-tool capability',
    description: 'A fully autonomous agent that can use a computer, write code, browse the web, and execute tasks independently. Runs in an isolated Docker sandbox for safety. Already integrated into the AIMS stack.',
    category: 'agent-framework',
    tags: ['autonomous', 'computer-use', 'code', 'sandbox', 'docker'],
    tier: 'starter',
    version: 'latest',
    sourceUrl: 'https://github.com/frdel/agent-zero',
    license: 'Apache-2.0',
    docker: {
      image: 'frdel/agent-zero-run:latest',
      composeProfile: 'ii-agents',
    },
    resources: { cpuLimit: '2', memoryLimit: '2G', gpuRequired: false },
    ports: [
      { internal: 80, description: 'Web Interface', protocol: 'http' },
    ],
    volumes: [
      { name: 'agent-zero-data', mountPath: '/app/work_dir', description: 'Agent workspace', persistent: true },
    ],
    healthCheck: { endpoint: '/', interval: '30s', timeout: '10s', retries: 3, startPeriod: '20s' },
    envVars: [
      { key: 'ANTHROPIC_API_KEY', description: 'Claude API for reasoning', required: true, sensitive: true, category: 'llm' },
      { key: 'OPENAI_API_KEY', description: 'OpenAI key for vision/tools', required: false, sensitive: true, category: 'llm' },
    ],
    networkPolicy: { internetAccess: false, allowedEgress: [], isolatedSandbox: true, bridgeToAims: false },
    securityLevel: 'hardened',
    customizations: [
      { id: 'model', label: 'LLM Model', description: 'Primary reasoning model', type: 'select', options: ['claude-sonnet-4-5-20250929', 'claude-opus-4-6', 'gpt-4o'], default: 'claude-sonnet-4-5-20250929' },
    ],
    dependencies: [],
    supportedDelivery: ['hosted', 'exported'],
    defaultDelivery: 'hosted',
    icon: 'Cpu',
    accentColor: '#10b981',
    featured: true,
    comingSoon: false,
    addedAt: '2026-02-21',
  },

  // ── CODE EXECUTION ──────────────────────────────────────────────────────

  {
    id: 'ii-agent',
    name: 'II-Agent',
    tagline: 'Full-stack autonomous code execution with WebSocket streaming',
    description: 'Autonomous execution engine for AIMS. Writes code, runs tests, deploys artifacts. Features real-time WebSocket streaming, PostgreSQL persistence, isolated sandbox, and tool server. Deployed externally via docker-compose.aims.yaml overlay.',
    category: 'code-execution',
    tags: ['code', 'autonomous', 'websocket', 'full-stack', 'sandbox', 'external'],
    tier: 'starter',
    version: '1.0.0',
    license: 'Apache-2.0',
    docker: {
      image: 'ii-agent:latest',
      // Deploy via ii-agent repo's integrations/aims/docker-compose.aims.yaml overlay
    },
    resources: { cpuLimit: '2', memoryLimit: '2G', gpuRequired: false },
    ports: [
      { internal: 8000, description: 'Main agent (WebSocket)', protocol: 'ws' },
      { internal: 1236, description: 'Tools server', protocol: 'http' },
      { internal: 8100, description: 'Sandbox environment', protocol: 'http' },
    ],
    volumes: [
      { name: 'ii-agent-filestore', mountPath: '/app/filestore', description: 'File storage', persistent: true },
      { name: 'ii-agent-pgdata', mountPath: '/var/lib/postgresql/data', description: 'PostgreSQL data', persistent: true },
    ],
    healthCheck: { endpoint: '/health', interval: '30s', timeout: '10s', retries: 3, startPeriod: '30s' },
    envVars: [
      { key: 'ANTHROPIC_API_KEY', description: 'Claude API key', required: true, sensitive: true, category: 'llm' },
      { key: 'E2B_API_KEY', description: 'E2B sandbox key', required: false, sensitive: true, category: 'api-key' },
      { key: 'II_AGENT_DB_USER', description: 'Database username', required: true, default: 'iiagent', sensitive: false, category: 'database' },
      { key: 'II_AGENT_DB_PASSWORD', description: 'Database password', required: true, default: 'iiagent', sensitive: true, category: 'database' },
      { key: 'II_AGENT_DB_NAME', description: 'Database name', required: true, default: 'iiagentdev', sensitive: false, category: 'database' },
    ],
    networkPolicy: { internetAccess: true, allowedEgress: ['*'], isolatedSandbox: false, bridgeToAims: true },
    securityLevel: 'standard',
    customizations: [
      { id: 'sandbox-mode', label: 'Sandbox Mode', description: 'Run code in isolated E2B sandbox', type: 'toggle', default: true },
      { id: 'max-iterations', label: 'Max Iterations', description: 'Maximum agent loop iterations', type: 'number', default: 50 },
    ],
    dependencies: ['redis'],
    supportedDelivery: ['hosted'],
    defaultDelivery: 'hosted',
    icon: 'Terminal',
    accentColor: '#f59e0b',
    featured: true,
    comingSoon: false,
    addedAt: '2026-02-21',
  },

  // ── RESEARCH AGENTS ─────────────────────────────────────────────────────

  {
    id: 'deerflow',
    name: 'DeerFlow',
    tagline: 'Deep research agent with multi-step investigation',
    description: 'An autonomous research agent that conducts deep, multi-step investigations. Crawls the web, synthesizes findings, and produces structured reports. Ideal for market research, competitive analysis, and due diligence.',
    category: 'research-agent',
    tags: ['research', 'deep-search', 'reports', 'analysis', 'web-crawl'],
    tier: 'starter',
    version: '1.0.0',
    sourceUrl: 'https://github.com/bytedance/deer-flow',
    license: 'MIT',
    docker: {
      image: 'deerflow/deerflow:latest',
    },
    resources: { cpuLimit: '1', memoryLimit: '1G', gpuRequired: false },
    ports: [
      { internal: 8000, description: 'API + Web UI', protocol: 'http' },
    ],
    volumes: [
      { name: 'deerflow-outputs', mountPath: '/app/outputs', description: 'Research outputs', persistent: true },
    ],
    healthCheck: { endpoint: '/health', interval: '30s', timeout: '10s', retries: 3, startPeriod: '20s' },
    envVars: [
      { key: 'ANTHROPIC_API_KEY', description: 'Claude API key', required: false, sensitive: true, category: 'llm' },
      { key: 'OPENAI_API_KEY', description: 'OpenAI API key', required: false, sensitive: true, category: 'llm' },
      { key: 'BRAVE_API_KEY', description: 'Brave Search API key', required: false, sensitive: true, category: 'api-key' },
      { key: 'TAVILY_API_KEY', description: 'Tavily search key', required: false, sensitive: true, category: 'api-key' },
    ],
    networkPolicy: { internetAccess: true, allowedEgress: ['*'], isolatedSandbox: false, bridgeToAims: true },
    securityLevel: 'standard',
    customizations: [
      { id: 'search-engine', label: 'Search Engine', description: 'Primary search provider', type: 'select', options: ['brave', 'tavily', 'serper'], default: 'brave' },
      { id: 'max-depth', label: 'Research Depth', description: 'Maximum investigation depth', type: 'select', options: ['shallow', 'standard', 'deep'], default: 'standard' },
    ],
    dependencies: [],
    supportedDelivery: ['hosted', 'exported'],
    defaultDelivery: 'hosted',
    icon: 'Search',
    accentColor: '#3b82f6',
    featured: true,
    comingSoon: false,
    addedAt: '2026-02-21',
  },

  // ── WORKFLOW AUTOMATION ─────────────────────────────────────────────────

  {
    id: 'n8n',
    name: 'n8n',
    tagline: 'Visual workflow automation with 400+ integrations',
    description: 'Self-hosted workflow automation platform with a visual editor, 400+ integrations, and the ability to create complex multi-step automations. Already part of the AIMS core stack — deploy a dedicated instance for clients.',
    category: 'workflow-automation',
    tags: ['workflow', 'automation', 'integrations', 'no-code', 'webhooks'],
    tier: 'starter',
    version: '2.8.2',
    sourceUrl: 'https://github.com/n8n-io/n8n',
    license: 'Sustainable Use License',
    docker: {
      image: 'n8nio/n8n:2.8.2',
    },
    resources: { cpuLimit: '1', memoryLimit: '1G', gpuRequired: false },
    ports: [
      { internal: 5678, description: 'Web UI + API', protocol: 'http' },
    ],
    volumes: [
      { name: 'n8n-data', mountPath: '/home/node/.n8n', description: 'Workflows, credentials, logs', persistent: true },
    ],
    healthCheck: { endpoint: '/healthz', interval: '30s', timeout: '10s', retries: 3, startPeriod: '20s' },
    envVars: [
      { key: 'N8N_BASIC_AUTH_USER', description: 'Admin username', required: true, default: 'admin', sensitive: false, category: 'core' },
      { key: 'N8N_BASIC_AUTH_PASSWORD', description: 'Admin password', required: true, sensitive: true, category: 'core' },
      { key: 'N8N_ENCRYPTION_KEY', description: 'Credential encryption key', required: true, sensitive: true, category: 'core' },
      { key: 'WEBHOOK_URL', description: 'External webhook URL', required: false, sensitive: false, category: 'core' },
    ],
    networkPolicy: { internetAccess: true, allowedEgress: ['*'], isolatedSandbox: false, bridgeToAims: true },
    securityLevel: 'standard',
    customizations: [
      { id: 'auth-type', label: 'Auth Type', description: 'Authentication method', type: 'select', options: ['basic', 'oauth2'], default: 'basic' },
      { id: 'execution-mode', label: 'Execution Mode', description: 'How workflows execute', type: 'select', options: ['regular', 'queue'], default: 'regular' },
    ],
    dependencies: [],
    supportedDelivery: ['hosted', 'exported'],
    defaultDelivery: 'hosted',
    icon: 'Workflow',
    accentColor: '#ff6d5a',
    featured: true,
    comingSoon: false,
    addedAt: '2026-02-21',
  },

  // ── COMPUTER USE ────────────────────────────────────────────────────────

  {
    id: 'trey-ai',
    name: 'Trey AI',
    tagline: 'Browser-native computer use agent for web automation',
    description: 'A computer-use agent specialized for browser automation. Navigates websites, fills forms, extracts data, and automates web-based workflows. Ideal for legacy system integration where no API exists.',
    category: 'computer-use',
    tags: ['browser', 'computer-use', 'web-automation', 'scraping', 'rpa'],
    tier: 'pro',
    version: '1.0.0',
    license: 'MIT',
    docker: {
      image: 'treyai/trey-agent:latest',
    },
    resources: { cpuLimit: '2', memoryLimit: '4G', gpuRequired: false },
    ports: [
      { internal: 3000, description: 'Web UI', protocol: 'http' },
      { internal: 9222, description: 'Chrome DevTools', protocol: 'ws' },
    ],
    volumes: [
      { name: 'trey-sessions', mountPath: '/app/sessions', description: 'Browser session recordings', persistent: true },
    ],
    healthCheck: { endpoint: '/health', interval: '30s', timeout: '10s', retries: 3, startPeriod: '45s' },
    envVars: [
      { key: 'ANTHROPIC_API_KEY', description: 'Claude API for vision + reasoning', required: true, sensitive: true, category: 'llm' },
      { key: 'HEADLESS', description: 'Run browser headless', required: false, default: 'true', sensitive: false, category: 'core' },
    ],
    networkPolicy: { internetAccess: true, allowedEgress: ['*'], isolatedSandbox: false, bridgeToAims: true },
    securityLevel: 'hardened',
    customizations: [
      { id: 'headless', label: 'Headless Mode', description: 'Run browser without visible window', type: 'toggle', default: true, envMapping: 'HEADLESS' },
      { id: 'viewport', label: 'Viewport Size', description: 'Browser viewport dimensions', type: 'select', options: ['1280x720', '1920x1080', '2560x1440'], default: '1920x1080' },
    ],
    dependencies: [],
    supportedDelivery: ['hosted', 'exported'],
    defaultDelivery: 'hosted',
    icon: 'Monitor',
    accentColor: '#8b5cf6',
    featured: false,
    comingSoon: false,
    addedAt: '2026-02-21',
  },

  // ── VOICE AGENTS ────────────────────────────────────────────────────────

  {
    id: 'personaplex',
    name: 'PersonaPlex',
    tagline: 'Full-duplex AI voice agent powered by NVIDIA Nemotron',
    description: 'AIMS native voice intelligence layer. Powered by NVIDIA Nemotron-3-Nano-30B on GCP Vertex AI. Supports full-duplex conversation, avatar rendering, and multi-language voice synthesis via ElevenLabs.',
    category: 'voice-agent',
    tags: ['voice', 'full-duplex', 'avatar', 'nvidia', 'tts', 'stt'],
    tier: 'pro',
    version: '1.0.0',
    license: 'NVIDIA Nemotron Open Model License',
    docker: {
      buildContext: '../services/personaplex',
    },
    resources: { cpuLimit: '2', memoryLimit: '4G', gpuRequired: true, gpuType: 'L4' },
    ports: [
      { internal: 8090, description: 'Voice WebSocket', protocol: 'ws' },
      { internal: 8091, description: 'REST API', protocol: 'http' },
    ],
    volumes: [
      { name: 'personaplex-cache', mountPath: '/app/cache', description: 'Voice model cache', persistent: true },
    ],
    healthCheck: { endpoint: '/health', interval: '30s', timeout: '10s', retries: 3, startPeriod: '60s' },
    envVars: [
      { key: 'PERSONAPLEX_ENDPOINT', description: 'GCP Vertex AI endpoint', required: true, sensitive: false, category: 'core' },
      { key: 'PERSONAPLEX_API_KEY', description: 'Vertex AI auth key', required: true, sensitive: true, category: 'api-key' },
      { key: 'ELEVENLABS_API_KEY', description: 'ElevenLabs TTS key', required: true, sensitive: true, category: 'api-key' },
      { key: 'DEEPGRAM_API_KEY', description: 'Deepgram STT key', required: false, sensitive: true, category: 'api-key' },
    ],
    networkPolicy: { internetAccess: true, allowedEgress: ['*.googleapis.com', 'api.elevenlabs.io', 'api.deepgram.com'], isolatedSandbox: false, bridgeToAims: true },
    securityLevel: 'enterprise',
    customizations: [
      { id: 'voice-id', label: 'Voice', description: 'ElevenLabs voice selection', type: 'select', options: ['rachel', 'adam', 'bella', 'josh', 'custom'], default: 'rachel' },
      { id: 'language', label: 'Language', description: 'Primary language', type: 'select', options: ['en', 'es', 'fr', 'de', 'pt', 'ja'], default: 'en' },
    ],
    dependencies: [],
    supportedDelivery: ['hosted'],
    defaultDelivery: 'hosted',
    icon: 'Mic',
    accentColor: '#76b900',
    featured: true,
    comingSoon: false,
    addedAt: '2026-02-21',
  },

  // ── CUSTOM VERTICALS ────────────────────────────────────────────────────

  {
    id: 'perform-platform',
    name: 'Per|Form',
    tagline: 'AI-powered sports scouting and intelligence platform',
    description: 'The AIMS proof-of-concept vertical. P.A.I. grading system, Boomer_Ang analyst team, three-tier intelligence engine, NFL Draft coverage, Film Room video analysis, and War Room debates. Built entirely with AIMS tools.',
    category: 'custom-vertical',
    tags: ['sports', 'nfl', 'scouting', 'analytics', 'grading', 'vertical'],
    tier: 'enterprise',
    version: '1.0.0',
    license: 'Proprietary',
    docker: {
      composeProfile: 'perform',
    },
    resources: { cpuLimit: '2', memoryLimit: '2G', gpuRequired: false },
    ports: [
      { internal: 5001, description: 'Scout Hub', protocol: 'http' },
      { internal: 5002, description: 'Film Room', protocol: 'http' },
      { internal: 5003, description: 'War Room', protocol: 'http' },
    ],
    volumes: [
      { name: 'perform-debate-logs', mountPath: '/app/debates', description: 'Debate transcripts', persistent: true },
      { name: 'perform-rankings', mountPath: '/app/rankings', description: 'P.A.I. rankings data', persistent: true },
      { name: 'perform-content', mountPath: '/app/content', description: 'Generated articles', persistent: true },
    ],
    healthCheck: { endpoint: '/health', interval: '30s', timeout: '10s', retries: 3, startPeriod: '20s' },
    envVars: [
      { key: 'OPENROUTER_API_KEY', description: 'LLM access via OpenRouter', required: true, sensitive: true, category: 'llm' },
      { key: 'BRAVE_API_KEY', description: 'Web search for scouting', required: true, sensitive: true, category: 'api-key' },
      { key: 'FIRECRAWL_URL', description: 'Web crawling service', required: false, sensitive: false, category: 'api-key' },
      { key: 'GCP_PROJECT_ID', description: 'GCP project for SAM 2', required: false, sensitive: false, category: 'core' },
    ],
    networkPolicy: { internetAccess: true, allowedEgress: ['*'], isolatedSandbox: false, bridgeToAims: true },
    securityLevel: 'standard',
    customizations: [
      { id: 'sport', label: 'Sport', description: 'Primary sport focus', type: 'select', options: ['football', 'basketball', 'baseball', 'soccer'], default: 'football' },
      { id: 'draft-year', label: 'Draft Year', description: 'Focus draft class', type: 'number', default: new Date().getFullYear() },
      { id: 'analyst-count', label: 'Analyst Team Size', description: 'Number of AI analysts', type: 'select', options: ['3', '5', '7'], default: '5' },
    ],
    dependencies: ['redis', 'uef-gateway'],
    supportedDelivery: ['hosted'],
    defaultDelivery: 'hosted',
    icon: 'Trophy',
    accentColor: '#d4af37',
    featured: true,
    comingSoon: false,
    addedAt: '2026-02-21',
  },

  // ── DATA PIPELINE ───────────────────────────────────────────────────────

  {
    id: 'browser-use',
    name: 'Browser Use',
    tagline: 'Headless browser agent for data extraction and web tasks',
    description: 'A lightweight browser automation agent optimized for data extraction, form filling, and web scraping. Uses Claude vision for intelligent page understanding. Lower resource footprint than full computer-use agents.',
    category: 'data-pipeline',
    tags: ['browser', 'scraping', 'data-extraction', 'headless', 'automation'],
    tier: 'starter',
    version: '1.0.0',
    sourceUrl: 'https://github.com/browser-use/browser-use',
    license: 'MIT',
    docker: {
      image: 'browseruse/browser-use:latest',
    },
    resources: { cpuLimit: '1', memoryLimit: '2G', gpuRequired: false },
    ports: [
      { internal: 8000, description: 'API', protocol: 'http' },
    ],
    volumes: [
      { name: 'browser-use-output', mountPath: '/app/output', description: 'Extracted data', persistent: true },
    ],
    healthCheck: { endpoint: '/health', interval: '30s', timeout: '10s', retries: 3, startPeriod: '30s' },
    envVars: [
      { key: 'ANTHROPIC_API_KEY', description: 'Claude for vision understanding', required: true, sensitive: true, category: 'llm' },
    ],
    networkPolicy: { internetAccess: true, allowedEgress: ['*'], isolatedSandbox: false, bridgeToAims: true },
    securityLevel: 'standard',
    customizations: [
      { id: 'concurrent', label: 'Concurrent Browsers', description: 'Parallel browser instances', type: 'select', options: ['1', '2', '4'], default: '2' },
      { id: 'headless', label: 'Headless Mode', description: 'Run without visible browser', type: 'toggle', default: true },
    ],
    dependencies: [],
    supportedDelivery: ['hosted', 'exported'],
    defaultDelivery: 'hosted',
    icon: 'Globe',
    accentColor: '#ec4899',
    featured: false,
    comingSoon: false,
    addedAt: '2026-02-21',
  },

  // ── DEV TOOLS ───────────────────────────────────────────────────────────

  {
    id: 'windmill',
    name: 'Windmill',
    tagline: 'Developer-first workflow engine with script-based automation',
    description: 'An alternative to n8n for developer teams. Write workflows in Python, TypeScript, Go, or SQL. Features a built-in code editor, scheduling, and REST API. Great for data pipelines and internal tools.',
    category: 'workflow-automation',
    tags: ['workflow', 'developer', 'python', 'typescript', 'automation', 'scripts'],
    tier: 'starter',
    version: '1.0.0',
    sourceUrl: 'https://github.com/windmill-labs/windmill',
    license: 'AGPLv3',
    docker: {
      image: 'ghcr.io/windmill-labs/windmill:main',
    },
    resources: { cpuLimit: '2', memoryLimit: '2G', gpuRequired: false },
    ports: [
      { internal: 8000, description: 'Web UI + API', protocol: 'http' },
    ],
    volumes: [
      { name: 'windmill-data', mountPath: '/tmp/windmill', description: 'Workflow cache and logs', persistent: true },
    ],
    healthCheck: { endpoint: '/api/version', interval: '30s', timeout: '10s', retries: 3, startPeriod: '30s' },
    envVars: [
      { key: 'DATABASE_URL', description: 'PostgreSQL connection string', required: true, sensitive: true, category: 'database' },
      { key: 'BASE_URL', description: 'External URL for webhooks', required: false, sensitive: false, category: 'core' },
    ],
    networkPolicy: { internetAccess: true, allowedEgress: ['*'], isolatedSandbox: false, bridgeToAims: true },
    securityLevel: 'standard',
    customizations: [
      { id: 'workers', label: 'Worker Count', description: 'Parallel execution workers', type: 'select', options: ['1', '2', '4'], default: '2' },
    ],
    dependencies: [],
    supportedDelivery: ['hosted', 'exported'],
    defaultDelivery: 'hosted',
    icon: 'Wind',
    accentColor: '#3b82f6',
    featured: false,
    comingSoon: false,
    addedAt: '2026-02-21',
  },

  // ── CONTENT ENGINE ──────────────────────────────────────────────────────

  {
    id: 'content-engine',
    name: 'Content Engine',
    tagline: 'Automated content creation and social media management',
    description: 'An AIMS-native content generation and scheduling platform. Creates blog posts, social media content, email newsletters, and video scripts. Integrates with TikTok, Instagram, LinkedIn, and Twitter APIs for direct publishing.',
    category: 'content-engine',
    tags: ['content', 'social-media', 'marketing', 'scheduling', 'ai-writing'],
    tier: 'starter',
    version: '1.0.0',
    license: 'Proprietary',
    docker: {
      buildContext: '../services/content-engine',
    },
    resources: { cpuLimit: '1', memoryLimit: '1G', gpuRequired: false },
    ports: [
      { internal: 4010, description: 'Content API', protocol: 'http' },
    ],
    volumes: [
      { name: 'content-assets', mountPath: '/app/assets', description: 'Generated content files', persistent: true },
    ],
    healthCheck: { endpoint: '/health', interval: '30s', timeout: '10s', retries: 3, startPeriod: '15s' },
    envVars: [
      { key: 'OPENROUTER_API_KEY', description: 'LLM for content generation', required: true, sensitive: true, category: 'llm' },
      { key: 'BRAVE_API_KEY', description: 'Research for content ideas', required: false, sensitive: true, category: 'api-key' },
    ],
    networkPolicy: { internetAccess: true, allowedEgress: ['*'], isolatedSandbox: false, bridgeToAims: true },
    securityLevel: 'standard',
    customizations: [
      { id: 'platforms', label: 'Platforms', description: 'Target social platforms', type: 'multi-select', options: ['tiktok', 'instagram', 'linkedin', 'twitter', 'youtube'], default: 'linkedin' },
      { id: 'tone', label: 'Content Tone', description: 'Writing style', type: 'select', options: ['professional', 'casual', 'bold', 'educational'], default: 'professional' },
    ],
    dependencies: ['redis'],
    supportedDelivery: ['hosted'],
    defaultDelivery: 'hosted',
    icon: 'PenTool',
    accentColor: '#f97316',
    featured: false,
    comingSoon: true,
    addedAt: '2026-02-21',
  },

  // ── Seedance 2.0 — Video Generation ──────────────────────────────────
  {
    id: 'seedance',
    name: 'Seedance 2.0',
    tagline: 'AI video generation — product URLs to UGC-style marketing videos',
    description: 'Autonomous video generation pipeline powered by KIE.ai. Feed it a product link and it produces platform-ready UGC content. Handles asset extraction, creative brief generation, video synthesis via Seedance 2.0 (ByteDance), and multi-platform formatting. Supports 2K output, native audio, and multimodal input.',
    category: 'content-engine',
    tags: ['video', 'ugc', 'content', 'marketing', 'automation', 'ai-video', 'tiktok', 'ads', 'kie', 'seedance'],
    tier: 'pro',
    version: '2.0.0',
    sourceUrl: 'https://kie.ai/seedance-2-0',
    license: 'Commercial API (via KIE.ai)',
    docker: { image: 'aims-seedance-pipeline:latest' },
    resources: { cpuLimit: '2', memoryLimit: '4G', gpuRequired: false },
    ports: [{ internal: 8080, description: 'Seedance API', protocol: 'http' }],
    volumes: [
      { name: 'seedance-output', mountPath: '/output', description: 'Generated video files', persistent: true },
      { name: 'seedance-assets', mountPath: '/assets', description: 'Extracted product assets', persistent: true },
    ],
    healthCheck: { endpoint: '/health', interval: '30s', timeout: '10s', retries: 3, startPeriod: '30s' },
    envVars: [
      { key: 'KIE_API_KEY', description: 'KIE.ai API key (routes to Seedance 2.0)', required: true, sensitive: true, category: 'api-key' },
      { key: 'OPENROUTER_API_KEY', description: 'LLM for creative brief generation', required: true, sensitive: true, category: 'llm' },
    ],
    networkPolicy: { internetAccess: true, allowedEgress: ['*'], isolatedSandbox: false, bridgeToAims: true },
    securityLevel: 'standard',
    customizations: [
      { id: 'style', label: 'Video Style', description: 'UGC style preset', type: 'select', options: ['ugc-review', 'product-showcase', 'unboxing', 'testimonial', 'comparison'], default: 'ugc-review' },
      { id: 'platforms', label: 'Target Platforms', description: 'Output format optimization', type: 'multi-select', options: ['tiktok', 'instagram-reels', 'youtube-shorts', 'meta-ads', 'twitter'], default: 'tiktok' },
      { id: 'duration', label: 'Video Duration', description: 'Target length in seconds', type: 'select', options: ['15', '30', '60', '90'], default: '30' },
    ],
    dependencies: [],
    supportedDelivery: ['hosted', 'exported'],
    defaultDelivery: 'hosted',
    icon: 'Video',
    accentColor: '#ef4444',
    featured: true,
    comingSoon: false,
    addedAt: '2026-02-22',
  },

  // ── Kling — Advanced Video AI ────────────────────────────────────────
  {
    id: 'kling-video',
    name: 'Kling Video AI',
    tagline: 'Professional AI video generation with motion control and lip sync',
    description: 'Production-grade video generation via KIE.ai — supports Kling 3.0, 2.6 Motion Control, 2.5 Turbo, and O1. Advanced motion control, lip sync, and scene composition. Integrates with the AIMS content pipeline for high-quality marketing material.',
    category: 'content-engine',
    tags: ['video', 'ai-video', 'motion', 'lip-sync', 'production', 'ads', 'kie', 'kling'],
    tier: 'pro',
    version: '3.0.0',
    license: 'Commercial API (via KIE.ai)',
    docker: { image: 'aims-kling-pipeline:latest' },
    resources: { cpuLimit: '2', memoryLimit: '4G', gpuRequired: false },
    ports: [{ internal: 8080, description: 'Kling API Proxy', protocol: 'http' }],
    volumes: [{ name: 'kling-output', mountPath: '/output', description: 'Generated videos', persistent: true }],
    healthCheck: { endpoint: '/health', interval: '30s', timeout: '10s', retries: 3, startPeriod: '20s' },
    envVars: [
      { key: 'KIE_API_KEY', description: 'KIE.ai API key (routes to Kling models)', required: true, sensitive: true, category: 'api-key' },
    ],
    networkPolicy: { internetAccess: true, allowedEgress: ['api.kie.ai'], isolatedSandbox: false, bridgeToAims: true },
    securityLevel: 'standard',
    customizations: [
      { id: 'model', label: 'Model Version', description: 'Kling model to use', type: 'select', options: ['kling-3.0', 'kling-2.6', 'kling-2.5-turbo', 'kling-o1'], default: 'kling-3.0' },
      { id: 'aspect', label: 'Aspect Ratio', description: 'Output aspect ratio', type: 'select', options: ['16:9', '9:16', '1:1'], default: '9:16' },
    ],
    dependencies: [],
    supportedDelivery: ['hosted'],
    defaultDelivery: 'hosted',
    icon: 'Film',
    accentColor: '#8b5cf6',
    featured: false,
    comingSoon: false,
    addedAt: '2026-02-22',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // NEW PLUGS — Competitive Expansion (Railway parity + beyond)
  // ═══════════════════════════════════════════════════════════════════════

  // ── CHAT & LLM UIs ───────────────────────────────────────────────────

  {
    id: 'open-webui',
    name: 'Open WebUI',
    tagline: 'Self-hosted ChatGPT-style interface for any LLM',
    description: 'Feature-rich, user-friendly web UI for interacting with LLMs. Supports OpenAI-compatible APIs, Ollama, and dozens of providers. Includes conversation history, RAG, web search, image generation, model management, and multi-user support.',
    category: 'chat-ui',
    tags: ['chat', 'llm', 'openai', 'ollama', 'rag', 'self-hosted', 'ui'],
    tier: 'starter',
    version: 'latest',
    sourceUrl: 'https://github.com/open-webui/open-webui',
    license: 'MIT',
    docker: { image: 'ghcr.io/open-webui/open-webui:main' },
    resources: { cpuLimit: '1', memoryLimit: '1G', gpuRequired: false },
    ports: [{ internal: 8080, description: 'Web UI', protocol: 'http' }],
    volumes: [{ name: 'open-webui-data', mountPath: '/app/backend/data', description: 'Conversations, settings, uploads', persistent: true }],
    healthCheck: { endpoint: '/health', interval: '30s', timeout: '10s', retries: 3, startPeriod: '30s' },
    envVars: [
      { key: 'OPENAI_API_BASE_URL', description: 'OpenAI-compatible API base URL', required: false, default: 'https://api.openai.com/v1', sensitive: false, category: 'llm' },
      { key: 'OPENAI_API_KEY', description: 'API key for OpenAI-compatible provider', required: false, sensitive: true, category: 'llm' },
      { key: 'OLLAMA_BASE_URL', description: 'Ollama server URL for local models', required: false, sensitive: false, category: 'llm' },
      { key: 'WEBUI_SECRET_KEY', description: 'Secret key for session encryption', required: true, sensitive: true, category: 'core' },
    ],
    networkPolicy: { internetAccess: true, allowedEgress: ['*'], isolatedSandbox: false, bridgeToAims: true },
    securityLevel: 'standard',
    customizations: [
      { id: 'auth', label: 'Require Auth', description: 'Require user login', type: 'toggle', default: true },
      { id: 'rag', label: 'Enable RAG', description: 'Document upload and retrieval', type: 'toggle', default: true },
    ],
    dependencies: [],
    supportedDelivery: ['hosted', 'exported'],
    defaultDelivery: 'hosted',
    icon: 'MessageSquare',
    accentColor: '#000000',
    featured: true,
    comingSoon: false,
    addedAt: '2026-02-22',
  },

  {
    id: 'librechat',
    name: 'LibreChat',
    tagline: 'Multi-provider AI chat with plugins, presets, and conversations',
    description: 'Enhanced ChatGPT clone supporting OpenAI, Anthropic, Google, Mistral, and custom endpoints simultaneously. Features conversation branching, presets, plugins (DALL-E, web browser, calculator), file attachments, and multi-user auth.',
    category: 'chat-ui',
    tags: ['chat', 'llm', 'multi-provider', 'plugins', 'anthropic', 'openai'],
    tier: 'starter',
    version: 'latest',
    sourceUrl: 'https://github.com/danny-avila/LibreChat',
    license: 'MIT',
    docker: { image: 'ghcr.io/danny-avila/librechat:latest' },
    resources: { cpuLimit: '1', memoryLimit: '1G', gpuRequired: false },
    ports: [{ internal: 3080, description: 'Web UI', protocol: 'http' }],
    volumes: [
      { name: 'librechat-data', mountPath: '/app/data', description: 'Conversations and uploads', persistent: true },
      { name: 'librechat-images', mountPath: '/app/client/public/images', description: 'Generated images', persistent: true },
    ],
    healthCheck: { endpoint: '/api/health', interval: '30s', timeout: '10s', retries: 3, startPeriod: '30s' },
    envVars: [
      { key: 'OPENAI_API_KEY', description: 'OpenAI API key', required: false, sensitive: true, category: 'llm' },
      { key: 'ANTHROPIC_API_KEY', description: 'Anthropic Claude key', required: false, sensitive: true, category: 'llm' },
      { key: 'CREDS_KEY', description: 'Credential encryption key', required: true, sensitive: true, category: 'core' },
      { key: 'CREDS_IV', description: 'Credential encryption IV', required: true, sensitive: true, category: 'core' },
      { key: 'JWT_SECRET', description: 'JWT signing secret', required: true, sensitive: true, category: 'core' },
    ],
    networkPolicy: { internetAccess: true, allowedEgress: ['*'], isolatedSandbox: false, bridgeToAims: true },
    securityLevel: 'standard',
    customizations: [
      { id: 'registration', label: 'Open Registration', description: 'Allow public sign-ups', type: 'toggle', default: false },
    ],
    dependencies: [],
    supportedDelivery: ['hosted', 'exported'],
    defaultDelivery: 'hosted',
    icon: 'MessageCircle',
    accentColor: '#6366f1',
    featured: false,
    comingSoon: false,
    addedAt: '2026-02-22',
  },

  // ── RAG & KNOWLEDGE BASE ──────────────────────────────────────────────

  {
    id: 'flowise',
    name: 'Flowise',
    tagline: 'Drag-and-drop LLM flow builder with RAG pipelines',
    description: 'Visual tool for building LLM workflows, chatbots, and RAG pipelines using drag-and-drop components. Supports 100+ integrations including vector stores (Pinecone, Weaviate, Qdrant), document loaders, and tools. No code required.',
    category: 'workflow-automation',
    tags: ['rag', 'langchain', 'no-code', 'visual', 'chatbot', 'workflow'],
    tier: 'starter',
    version: '2.2.0',
    sourceUrl: 'https://github.com/FlowiseAI/Flowise',
    license: 'Apache-2.0',
    docker: { image: 'flowiseai/flowise:latest' },
    resources: { cpuLimit: '1', memoryLimit: '1G', gpuRequired: false },
    ports: [{ internal: 3000, description: 'Web UI + API', protocol: 'http' }],
    volumes: [{ name: 'flowise-data', mountPath: '/root/.flowise', description: 'Flows, credentials, uploads', persistent: true }],
    healthCheck: { endpoint: '/api/v1/ping', interval: '30s', timeout: '10s', retries: 3, startPeriod: '20s' },
    envVars: [
      { key: 'FLOWISE_USERNAME', description: 'Dashboard login username', required: true, default: 'admin', sensitive: false, category: 'core' },
      { key: 'FLOWISE_PASSWORD', description: 'Dashboard login password', required: true, sensitive: true, category: 'core' },
      { key: 'FLOWISE_SECRETKEY_OVERWRITE', description: 'API key override', required: false, sensitive: true, category: 'core' },
    ],
    networkPolicy: { internetAccess: true, allowedEgress: ['*'], isolatedSandbox: false, bridgeToAims: true },
    securityLevel: 'standard',
    customizations: [
      { id: 'execution-mode', label: 'Execution Mode', description: 'Flow execution mode', type: 'select', options: ['main', 'child'], default: 'main' },
    ],
    dependencies: [],
    supportedDelivery: ['hosted', 'exported'],
    defaultDelivery: 'hosted',
    icon: 'GitBranch',
    accentColor: '#5850ec',
    featured: true,
    comingSoon: false,
    addedAt: '2026-02-22',
  },

  {
    id: 'anything-llm',
    name: 'AnythingLLM',
    tagline: 'All-in-one AI app — chat, RAG, agents, and document management',
    description: 'Full-featured AI desktop and server application. Chat with any LLM, embed documents for RAG, create AI agents with tools, and manage multiple workspaces. Supports 30+ LLM providers, 10+ vector databases, and 20+ embedding models.',
    category: 'agent-framework',
    tags: ['rag', 'chat', 'agents', 'documents', 'embeddings', 'workspace'],
    tier: 'starter',
    version: 'latest',
    sourceUrl: 'https://github.com/Mintplex-Labs/anything-llm',
    license: 'MIT',
    docker: { image: 'mintplexlabs/anythingllm:latest' },
    resources: { cpuLimit: '2', memoryLimit: '2G', gpuRequired: false },
    ports: [{ internal: 3001, description: 'Web Interface', protocol: 'http' }],
    volumes: [
      { name: 'anythingllm-storage', mountPath: '/app/server/storage', description: 'Documents, vector DB, settings', persistent: true },
    ],
    healthCheck: { endpoint: '/api/ping', interval: '30s', timeout: '10s', retries: 3, startPeriod: '30s' },
    envVars: [
      { key: 'LLM_PROVIDER', description: 'LLM provider (openai, anthropic, ollama, etc.)', required: true, default: 'openai', sensitive: false, category: 'llm' },
      { key: 'OPENAI_API_KEY', description: 'OpenAI API key (if using OpenAI)', required: false, sensitive: true, category: 'llm' },
      { key: 'ANTHROPIC_API_KEY', description: 'Anthropic API key (if using Claude)', required: false, sensitive: true, category: 'llm' },
      { key: 'AUTH_TOKEN', description: 'Auth token for API access', required: false, sensitive: true, category: 'core' },
    ],
    networkPolicy: { internetAccess: true, allowedEgress: ['*'], isolatedSandbox: false, bridgeToAims: true },
    securityLevel: 'standard',
    customizations: [
      { id: 'embedding-model', label: 'Embedding Model', description: 'Document embedding provider', type: 'select', options: ['openai', 'ollama', 'local'], default: 'openai' },
      { id: 'vector-db', label: 'Vector Database', description: 'Vector store backend', type: 'select', options: ['lancedb', 'pinecone', 'qdrant', 'weaviate'], default: 'lancedb' },
    ],
    dependencies: [],
    supportedDelivery: ['hosted', 'exported'],
    defaultDelivery: 'hosted',
    icon: 'Database',
    accentColor: '#2563eb',
    featured: true,
    comingSoon: false,
    addedAt: '2026-02-22',
  },

  // ── DATABASE & BACKEND ────────────────────────────────────────────────

  {
    id: 'supabase',
    name: 'Supabase',
    tagline: 'Open-source Firebase alternative — Postgres, Auth, Storage, Realtime',
    description: 'Self-hosted Supabase with PostgreSQL, authentication, instant APIs, edge functions, realtime subscriptions, and object storage. Provides a complete backend for web and mobile apps. Includes a dashboard for managing data, users, and policies.',
    category: 'database',
    tags: ['database', 'postgres', 'auth', 'storage', 'realtime', 'api', 'baas'],
    tier: 'pro',
    version: 'latest',
    sourceUrl: 'https://github.com/supabase/supabase',
    license: 'Apache-2.0',
    docker: { image: 'supabase/studio:latest' },
    resources: { cpuLimit: '2', memoryLimit: '4G', gpuRequired: false },
    ports: [
      { internal: 3000, description: 'Studio Dashboard', protocol: 'http' },
      { internal: 8000, description: 'Kong API Gateway', protocol: 'http' },
    ],
    volumes: [
      { name: 'supabase-db', mountPath: '/var/lib/postgresql/data', description: 'PostgreSQL data', persistent: true },
      { name: 'supabase-storage', mountPath: '/var/lib/storage', description: 'Object storage', persistent: true },
    ],
    healthCheck: { endpoint: '/rest/v1/', interval: '30s', timeout: '10s', retries: 3, startPeriod: '60s' },
    envVars: [
      { key: 'POSTGRES_PASSWORD', description: 'PostgreSQL superuser password', required: true, sensitive: true, category: 'database' },
      { key: 'JWT_SECRET', description: 'JWT signing secret (min 32 chars)', required: true, sensitive: true, category: 'core' },
      { key: 'ANON_KEY', description: 'Public anonymous API key', required: true, sensitive: true, category: 'core' },
      { key: 'SERVICE_ROLE_KEY', description: 'Service role API key (admin)', required: true, sensitive: true, category: 'core' },
    ],
    networkPolicy: { internetAccess: true, allowedEgress: ['*'], isolatedSandbox: false, bridgeToAims: true },
    securityLevel: 'hardened',
    customizations: [
      { id: 'realtime', label: 'Enable Realtime', description: 'WebSocket subscriptions for live data', type: 'toggle', default: true },
      { id: 'edge-functions', label: 'Edge Functions', description: 'Enable Deno-based serverless functions', type: 'toggle', default: false },
    ],
    dependencies: [],
    supportedDelivery: ['hosted', 'exported'],
    defaultDelivery: 'hosted',
    icon: 'Zap',
    accentColor: '#3ecf8e',
    featured: true,
    comingSoon: false,
    addedAt: '2026-02-22',
  },

  {
    id: 'minio',
    name: 'MinIO',
    tagline: 'S3-compatible object storage for AI data and model artifacts',
    description: 'High-performance, S3-compatible object storage. Store datasets, model weights, training artifacts, exports, and media files. Features a web console, bucket policies, versioning, and erasure coding. Perfect for AI pipelines that need persistent storage.',
    category: 'storage',
    tags: ['storage', 's3', 'object-storage', 'datasets', 'artifacts', 'backup'],
    tier: 'starter',
    version: 'latest',
    sourceUrl: 'https://github.com/minio/minio',
    license: 'AGPLv3',
    docker: { image: 'minio/minio:latest' },
    resources: { cpuLimit: '1', memoryLimit: '1G', gpuRequired: false },
    ports: [
      { internal: 9000, description: 'S3 API', protocol: 'http' },
      { internal: 9001, description: 'Web Console', protocol: 'http' },
    ],
    volumes: [{ name: 'minio-data', mountPath: '/data', description: 'Object storage data', persistent: true }],
    healthCheck: { endpoint: '/minio/health/live', interval: '30s', timeout: '10s', retries: 3, startPeriod: '15s' },
    envVars: [
      { key: 'MINIO_ROOT_USER', description: 'Admin username', required: true, default: 'minioadmin', sensitive: false, category: 'core' },
      { key: 'MINIO_ROOT_PASSWORD', description: 'Admin password (min 8 chars)', required: true, sensitive: true, category: 'core' },
    ],
    networkPolicy: { internetAccess: false, allowedEgress: [], isolatedSandbox: false, bridgeToAims: true },
    securityLevel: 'standard',
    customizations: [
      { id: 'console', label: 'Enable Console', description: 'Web management console', type: 'toggle', default: true },
    ],
    dependencies: [],
    supportedDelivery: ['hosted', 'exported'],
    defaultDelivery: 'hosted',
    icon: 'HardDrive',
    accentColor: '#c72c48',
    featured: false,
    comingSoon: false,
    addedAt: '2026-02-22',
  },

  // ── MONITORING & OBSERVABILITY ────────────────────────────────────────

  {
    id: 'uptime-kuma',
    name: 'Uptime Kuma',
    tagline: 'Beautiful self-hosted monitoring for all your services',
    description: 'Monitors uptime for HTTP(s), TCP, DNS, Docker, and more. Features a clean dashboard with response time charts, notification integrations (Slack, Discord, Telegram, email, webhook), status pages, and maintenance windows.',
    category: 'monitoring',
    tags: ['monitoring', 'uptime', 'health-check', 'alerts', 'status-page'],
    tier: 'starter',
    version: '1',
    sourceUrl: 'https://github.com/louislam/uptime-kuma',
    license: 'MIT',
    docker: { image: 'louislam/uptime-kuma:1' },
    resources: { cpuLimit: '0.5', memoryLimit: '512M', gpuRequired: false },
    ports: [{ internal: 3001, description: 'Dashboard', protocol: 'http' }],
    volumes: [{ name: 'uptime-kuma-data', mountPath: '/app/data', description: 'Monitor configs and history', persistent: true }],
    healthCheck: { endpoint: '/api/status-page/heartbeat/special', interval: '30s', timeout: '10s', retries: 3, startPeriod: '15s' },
    envVars: [],
    networkPolicy: { internetAccess: true, allowedEgress: ['*'], isolatedSandbox: false, bridgeToAims: true },
    securityLevel: 'standard',
    customizations: [],
    dependencies: [],
    supportedDelivery: ['hosted', 'exported'],
    defaultDelivery: 'hosted',
    icon: 'Activity',
    accentColor: '#5cdd8b',
    featured: false,
    comingSoon: false,
    addedAt: '2026-02-22',
  },

  {
    id: 'grafana',
    name: 'Grafana',
    tagline: 'Operational dashboards for metrics, logs, and traces',
    description: 'Industry-standard visualization platform. Connect to Prometheus, InfluxDB, PostgreSQL, Elasticsearch, Loki, and 100+ data sources. Build custom dashboards for system metrics, business KPIs, AI model performance, and infrastructure health.',
    category: 'monitoring',
    tags: ['monitoring', 'dashboards', 'metrics', 'visualization', 'prometheus', 'logs'],
    tier: 'starter',
    version: 'latest',
    sourceUrl: 'https://github.com/grafana/grafana',
    license: 'AGPLv3',
    docker: { image: 'grafana/grafana-oss:latest' },
    resources: { cpuLimit: '1', memoryLimit: '512M', gpuRequired: false },
    ports: [{ internal: 3000, description: 'Web Dashboard', protocol: 'http' }],
    volumes: [{ name: 'grafana-data', mountPath: '/var/lib/grafana', description: 'Dashboards, datasources, plugins', persistent: true }],
    healthCheck: { endpoint: '/api/health', interval: '30s', timeout: '10s', retries: 3, startPeriod: '20s' },
    envVars: [
      { key: 'GF_SECURITY_ADMIN_USER', description: 'Admin username', required: true, default: 'admin', sensitive: false, category: 'core' },
      { key: 'GF_SECURITY_ADMIN_PASSWORD', description: 'Admin password', required: true, sensitive: true, category: 'core' },
    ],
    networkPolicy: { internetAccess: true, allowedEgress: ['*'], isolatedSandbox: false, bridgeToAims: true },
    securityLevel: 'standard',
    customizations: [
      { id: 'anonymous', label: 'Anonymous Access', description: 'Allow unauthenticated dashboard viewing', type: 'toggle', default: false },
    ],
    dependencies: [],
    supportedDelivery: ['hosted', 'exported'],
    defaultDelivery: 'hosted',
    icon: 'BarChart3',
    accentColor: '#f46800',
    featured: false,
    comingSoon: false,
    addedAt: '2026-02-22',
  },

  // ── CMS & CONTENT MANAGEMENT ──────────────────────────────────────────

  {
    id: 'ghost',
    name: 'Ghost',
    tagline: 'Professional publishing platform with memberships and newsletters',
    description: 'Modern publishing platform for creating content-driven businesses. Features a rich editor, built-in SEO, membership and subscription management, newsletters, custom themes, and a full API. Used by companies like Apple, Tinder, and DuckDuckGo.',
    category: 'cms',
    tags: ['cms', 'blog', 'newsletter', 'publishing', 'membership', 'seo'],
    tier: 'starter',
    version: '5',
    sourceUrl: 'https://github.com/TryGhost/Ghost',
    license: 'MIT',
    docker: { image: 'ghost:5-alpine' },
    resources: { cpuLimit: '1', memoryLimit: '512M', gpuRequired: false },
    ports: [{ internal: 2368, description: 'Web + Admin', protocol: 'http' }],
    volumes: [{ name: 'ghost-content', mountPath: '/var/lib/ghost/content', description: 'Posts, images, themes', persistent: true }],
    healthCheck: { endpoint: '/ghost/api/v4/admin/site/', interval: '30s', timeout: '10s', retries: 3, startPeriod: '30s' },
    envVars: [
      { key: 'url', description: 'Public site URL', required: true, sensitive: false, category: 'core' },
      { key: 'database__client', description: 'Database client', required: false, default: 'sqlite3', sensitive: false, category: 'database' },
    ],
    networkPolicy: { internetAccess: true, allowedEgress: ['*'], isolatedSandbox: false, bridgeToAims: true },
    securityLevel: 'standard',
    customizations: [
      { id: 'members', label: 'Enable Members', description: 'Membership and subscription features', type: 'toggle', default: true },
    ],
    dependencies: [],
    supportedDelivery: ['hosted', 'exported'],
    defaultDelivery: 'hosted',
    icon: 'FileText',
    accentColor: '#15171a',
    featured: false,
    comingSoon: false,
    addedAt: '2026-02-22',
  },

  {
    id: 'strapi',
    name: 'Strapi',
    tagline: 'Headless CMS with customizable API and admin panel',
    description: 'Leading open-source headless CMS. Create content types with a visual builder, manage content via a rich admin panel, and consume via REST or GraphQL APIs. Perfect as a backend for any frontend framework.',
    category: 'cms',
    tags: ['cms', 'headless', 'api', 'graphql', 'rest', 'admin'],
    tier: 'starter',
    version: '4',
    sourceUrl: 'https://github.com/strapi/strapi',
    license: 'MIT',
    docker: { image: 'strapi/strapi:latest' },
    resources: { cpuLimit: '1', memoryLimit: '1G', gpuRequired: false },
    ports: [{ internal: 1337, description: 'API + Admin', protocol: 'http' }],
    volumes: [
      { name: 'strapi-data', mountPath: '/srv/app', description: 'Application data and uploads', persistent: true },
    ],
    healthCheck: { endpoint: '/_health', interval: '30s', timeout: '10s', retries: 3, startPeriod: '45s' },
    envVars: [
      { key: 'DATABASE_CLIENT', description: 'Database type (sqlite, postgres, mysql)', required: true, default: 'sqlite', sensitive: false, category: 'database' },
      { key: 'APP_KEYS', description: 'Application keys (comma-separated)', required: true, sensitive: true, category: 'core' },
      { key: 'API_TOKEN_SALT', description: 'Salt for API tokens', required: true, sensitive: true, category: 'core' },
      { key: 'ADMIN_JWT_SECRET', description: 'JWT secret for admin panel', required: true, sensitive: true, category: 'core' },
    ],
    networkPolicy: { internetAccess: true, allowedEgress: ['*'], isolatedSandbox: false, bridgeToAims: true },
    securityLevel: 'standard',
    customizations: [
      { id: 'graphql', label: 'Enable GraphQL', description: 'GraphQL API endpoint', type: 'toggle', default: false },
    ],
    dependencies: [],
    supportedDelivery: ['hosted', 'exported'],
    defaultDelivery: 'hosted',
    icon: 'Layers',
    accentColor: '#4945ff',
    featured: false,
    comingSoon: false,
    addedAt: '2026-02-22',
  },

  // ── AI DEVELOPMENT PLATFORMS ──────────────────────────────────────────

  {
    id: 'dify',
    name: 'Dify',
    tagline: 'Visual AI app builder with RAG, agents, and workflow orchestration',
    description: 'Open-source LLM application development platform. Build AI chatbots, agents, and workflows with a visual canvas. Supports hundreds of models, RAG pipelines, 50+ built-in tools, MCP protocol, and plugin ecosystem. Deploy as API or embed in apps.',
    category: 'agent-framework',
    tags: ['ai-platform', 'rag', 'agents', 'workflow', 'visual', 'mcp', 'plugins'],
    tier: 'pro',
    version: 'latest',
    sourceUrl: 'https://github.com/langgenius/dify',
    license: 'Apache-2.0',
    docker: { image: 'langgenius/dify-api:latest' },
    resources: { cpuLimit: '2', memoryLimit: '4G', gpuRequired: false },
    ports: [
      { internal: 5001, description: 'API Server', protocol: 'http' },
      { internal: 3000, description: 'Web Frontend', protocol: 'http' },
    ],
    volumes: [
      { name: 'dify-storage', mountPath: '/app/api/storage', description: 'Uploaded files and datasets', persistent: true },
    ],
    healthCheck: { endpoint: '/health', interval: '30s', timeout: '10s', retries: 3, startPeriod: '60s' },
    envVars: [
      { key: 'SECRET_KEY', description: 'Application secret key', required: true, sensitive: true, category: 'core' },
      { key: 'OPENAI_API_KEY', description: 'OpenAI API key', required: false, sensitive: true, category: 'llm' },
      { key: 'ANTHROPIC_API_KEY', description: 'Anthropic Claude key', required: false, sensitive: true, category: 'llm' },
    ],
    networkPolicy: { internetAccess: true, allowedEgress: ['*'], isolatedSandbox: false, bridgeToAims: true },
    securityLevel: 'standard',
    customizations: [
      { id: 'sandbox', label: 'Code Sandbox', description: 'Enable code execution sandbox', type: 'toggle', default: true },
    ],
    dependencies: ['redis'],
    supportedDelivery: ['hosted', 'exported'],
    defaultDelivery: 'hosted',
    icon: 'Sparkles',
    accentColor: '#1677ff',
    featured: true,
    comingSoon: false,
    addedAt: '2026-02-22',
  },

  {
    id: 'ollama',
    name: 'Ollama',
    tagline: 'Run open-source LLMs locally — Llama, Mistral, Gemma, Phi, and more',
    description: 'Simple way to run large language models on your own hardware. Pull models like llama3, mistral, gemma2, phi3, codellama with a single command. OpenAI-compatible API for easy integration. No GPU required (CPU inference supported).',
    category: 'model-serving',
    tags: ['llm', 'local', 'inference', 'llama', 'mistral', 'open-source', 'self-hosted'],
    tier: 'starter',
    version: 'latest',
    sourceUrl: 'https://github.com/ollama/ollama',
    license: 'MIT',
    docker: { image: 'ollama/ollama:latest' },
    resources: { cpuLimit: '4', memoryLimit: '8G', gpuRequired: false },
    ports: [{ internal: 11434, description: 'API (OpenAI-compatible)', protocol: 'http' }],
    volumes: [{ name: 'ollama-models', mountPath: '/root/.ollama', description: 'Downloaded model weights', persistent: true }],
    healthCheck: { endpoint: '/api/tags', interval: '30s', timeout: '10s', retries: 3, startPeriod: '30s' },
    envVars: [
      { key: 'OLLAMA_HOST', description: 'Bind address', required: false, default: '0.0.0.0', sensitive: false, category: 'core' },
      { key: 'OLLAMA_NUM_PARALLEL', description: 'Max concurrent requests', required: false, default: '2', sensitive: false, category: 'core' },
    ],
    networkPolicy: { internetAccess: true, allowedEgress: ['registry.ollama.ai'], isolatedSandbox: false, bridgeToAims: true },
    securityLevel: 'standard',
    customizations: [
      { id: 'default-model', label: 'Default Model', description: 'Model to pull on startup', type: 'select', options: ['llama3.2:3b', 'llama3.1:8b', 'mistral:7b', 'gemma2:9b', 'phi3:mini', 'codellama:7b'], default: 'llama3.2:3b' },
    ],
    dependencies: [],
    supportedDelivery: ['hosted', 'exported'],
    defaultDelivery: 'hosted',
    icon: 'Brain',
    accentColor: '#000000',
    featured: true,
    comingSoon: false,
    addedAt: '2026-02-22',
  },

  // ── COMMUNICATION & COLLABORATION ─────────────────────────────────────

  {
    id: 'typebot',
    name: 'Typebot',
    tagline: 'Visual chatbot builder with conversational forms and integrations',
    description: 'Build advanced chatbots and conversational forms with a beautiful drag-and-drop builder. Embed anywhere — websites, apps, WhatsApp, Messenger. Features conditional logic, variables, integrations (Zapier, webhooks, Google Sheets), and analytics.',
    category: 'chatbot',
    tags: ['chatbot', 'forms', 'conversational', 'no-code', 'embed', 'whatsapp'],
    tier: 'starter',
    version: 'latest',
    sourceUrl: 'https://github.com/baptisteArno/typebot.io',
    license: 'AGPLv3',
    docker: { image: 'baptistearno/typebot-builder:latest' },
    resources: { cpuLimit: '1', memoryLimit: '512M', gpuRequired: false },
    ports: [{ internal: 3000, description: 'Builder UI', protocol: 'http' }],
    volumes: [{ name: 'typebot-data', mountPath: '/app/packages/prisma/data', description: 'Bot definitions and responses', persistent: true }],
    healthCheck: { endpoint: '/api/health', interval: '30s', timeout: '10s', retries: 3, startPeriod: '20s' },
    envVars: [
      { key: 'NEXTAUTH_URL', description: 'Public URL of the builder', required: true, sensitive: false, category: 'core' },
      { key: 'NEXTAUTH_SECRET', description: 'Auth encryption secret', required: true, sensitive: true, category: 'core' },
      { key: 'ENCRYPTION_SECRET', description: 'Data encryption secret', required: true, sensitive: true, category: 'core' },
    ],
    networkPolicy: { internetAccess: true, allowedEgress: ['*'], isolatedSandbox: false, bridgeToAims: true },
    securityLevel: 'standard',
    customizations: [],
    dependencies: [],
    supportedDelivery: ['hosted', 'exported'],
    defaultDelivery: 'hosted',
    icon: 'Bot',
    accentColor: '#0042da',
    featured: false,
    comingSoon: false,
    addedAt: '2026-02-22',
  },

  {
    id: 'nocodb',
    name: 'NocoDB',
    tagline: 'Open-source Airtable alternative — spreadsheet meets database',
    description: 'Turn any database into a smart spreadsheet. Connect to MySQL, PostgreSQL, SQL Server, or SQLite and manage data through a spreadsheet-like interface. Features forms, kanban views, gallery views, API access, automations, and collaboration.',
    category: 'database',
    tags: ['database', 'spreadsheet', 'airtable', 'no-code', 'api', 'collaboration'],
    tier: 'starter',
    version: 'latest',
    sourceUrl: 'https://github.com/nocodb/nocodb',
    license: 'AGPLv3',
    docker: { image: 'nocodb/nocodb:latest' },
    resources: { cpuLimit: '1', memoryLimit: '512M', gpuRequired: false },
    ports: [{ internal: 8080, description: 'Web UI + API', protocol: 'http' }],
    volumes: [{ name: 'nocodb-data', mountPath: '/usr/app/data', description: 'Database and metadata', persistent: true }],
    healthCheck: { endpoint: '/api/v1/health', interval: '30s', timeout: '10s', retries: 3, startPeriod: '20s' },
    envVars: [
      { key: 'NC_AUTH_JWT_SECRET', description: 'JWT secret for auth', required: true, sensitive: true, category: 'core' },
    ],
    networkPolicy: { internetAccess: true, allowedEgress: ['*'], isolatedSandbox: false, bridgeToAims: true },
    securityLevel: 'standard',
    customizations: [],
    dependencies: [],
    supportedDelivery: ['hosted', 'exported'],
    defaultDelivery: 'hosted',
    icon: 'Table',
    accentColor: '#4351e8',
    featured: false,
    comingSoon: false,
    addedAt: '2026-02-22',
  },

  // ── SECURITY & NETWORKING ─────────────────────────────────────────────

  {
    id: 'vaultwarden',
    name: 'Vaultwarden',
    tagline: 'Lightweight Bitwarden-compatible password manager server',
    description: 'Self-hosted password manager compatible with all Bitwarden clients. Store passwords, API keys, secrets, and notes securely. Features TOTP, file attachments, organizations, emergency access, and Send (secure file sharing).',
    category: 'security',
    tags: ['passwords', 'secrets', 'vault', 'bitwarden', 'security', 'totp'],
    tier: 'starter',
    version: 'latest',
    sourceUrl: 'https://github.com/dani-garcia/vaultwarden',
    license: 'AGPLv3',
    docker: { image: 'vaultwarden/server:latest' },
    resources: { cpuLimit: '0.5', memoryLimit: '256M', gpuRequired: false },
    ports: [{ internal: 80, description: 'Web Vault', protocol: 'http' }],
    volumes: [{ name: 'vaultwarden-data', mountPath: '/data', description: 'Encrypted vault database', persistent: true }],
    healthCheck: { endpoint: '/alive', interval: '30s', timeout: '10s', retries: 3, startPeriod: '10s' },
    envVars: [
      { key: 'ADMIN_TOKEN', description: 'Admin panel access token', required: true, sensitive: true, category: 'core' },
      { key: 'DOMAIN', description: 'Public domain URL', required: true, sensitive: false, category: 'core' },
    ],
    networkPolicy: { internetAccess: false, allowedEgress: [], isolatedSandbox: false, bridgeToAims: true },
    securityLevel: 'enterprise',
    customizations: [
      { id: 'signups', label: 'Allow Signups', description: 'Enable new user registration', type: 'toggle', default: false },
    ],
    dependencies: [],
    supportedDelivery: ['hosted', 'exported'],
    defaultDelivery: 'hosted',
    icon: 'Shield',
    accentColor: '#175ddc',
    featured: false,
    comingSoon: false,
    addedAt: '2026-02-22',
  },

  // ── AI CODE ASSISTANTS ────────────────────────────────────────────────

  {
    id: 'continue-dev',
    name: 'Continue',
    tagline: 'Open-source AI code assistant for VS Code and JetBrains',
    description: 'Add AI-powered code completion, chat, and editing to your IDE. Supports any LLM (local Ollama, OpenAI, Anthropic, etc.). Features tab autocomplete, inline editing, codebase context, and custom slash commands. Self-host the proxy for team use.',
    category: 'code-execution',
    tags: ['code-assistant', 'ide', 'vscode', 'autocomplete', 'copilot', 'ai-coding'],
    tier: 'starter',
    version: 'latest',
    sourceUrl: 'https://github.com/continuedev/continue',
    license: 'Apache-2.0',
    docker: { image: 'continuedev/continue-proxy:latest' },
    resources: { cpuLimit: '1', memoryLimit: '512M', gpuRequired: false },
    ports: [{ internal: 8080, description: 'Proxy API', protocol: 'http' }],
    volumes: [{ name: 'continue-config', mountPath: '/app/config', description: 'Model configs and prompts', persistent: true }],
    healthCheck: { endpoint: '/health', interval: '30s', timeout: '10s', retries: 3, startPeriod: '15s' },
    envVars: [
      { key: 'OPENAI_API_KEY', description: 'OpenAI key (if using OpenAI models)', required: false, sensitive: true, category: 'llm' },
      { key: 'ANTHROPIC_API_KEY', description: 'Anthropic key (if using Claude)', required: false, sensitive: true, category: 'llm' },
    ],
    networkPolicy: { internetAccess: true, allowedEgress: ['*'], isolatedSandbox: false, bridgeToAims: true },
    securityLevel: 'standard',
    customizations: [
      { id: 'tab-model', label: 'Autocomplete Model', description: 'Model for tab completion', type: 'select', options: ['codellama:7b', 'starcoder2:3b', 'deepseek-coder:6.7b', 'gpt-4o'], default: 'codellama:7b' },
    ],
    dependencies: [],
    supportedDelivery: ['hosted', 'exported'],
    defaultDelivery: 'exported',
    icon: 'Code',
    accentColor: '#ff4040',
    featured: false,
    comingSoon: false,
    addedAt: '2026-02-22',
  },

  // ── TASK & PROJECT MANAGEMENT ─────────────────────────────────────────

  {
    id: 'plane',
    name: 'Plane',
    tagline: 'Open-source project management — issues, sprints, and roadmaps',
    description: 'Modern project management tool with issues, cycles (sprints), modules, views, pages (wiki), and analytics. Features GitHub and Slack integrations, custom workflows, bulk operations, and spreadsheet/kanban/timeline views.',
    category: 'project-management',
    tags: ['project-management', 'issues', 'sprints', 'kanban', 'jira-alternative'],
    tier: 'starter',
    version: 'latest',
    sourceUrl: 'https://github.com/makeplane/plane',
    license: 'Apache-2.0',
    docker: { image: 'makeplane/plane-frontend:latest' },
    resources: { cpuLimit: '1', memoryLimit: '1G', gpuRequired: false },
    ports: [{ internal: 3000, description: 'Web UI', protocol: 'http' }],
    volumes: [{ name: 'plane-data', mountPath: '/app/data', description: 'Project data and uploads', persistent: true }],
    healthCheck: { endpoint: '/', interval: '30s', timeout: '10s', retries: 3, startPeriod: '30s' },
    envVars: [
      { key: 'SECRET_KEY', description: 'Django secret key', required: true, sensitive: true, category: 'core' },
      { key: 'DATABASE_URL', description: 'PostgreSQL connection URL', required: true, sensitive: true, category: 'database' },
    ],
    networkPolicy: { internetAccess: true, allowedEgress: ['*'], isolatedSandbox: false, bridgeToAims: true },
    securityLevel: 'standard',
    customizations: [],
    dependencies: [],
    supportedDelivery: ['hosted', 'exported'],
    defaultDelivery: 'hosted',
    icon: 'Layout',
    accentColor: '#3f76ff',
    featured: false,
    comingSoon: false,
    addedAt: '2026-02-22',
  },

  // ── COZE STUDIO — ByteDance AI Agent Platform ─────────────────────────

  {
    id: 'coze-studio',
    name: 'Coze Studio',
    tagline: 'ByteDance open-source AI agent builder with visual workflows',
    description: 'Self-hosted version of ByteDance\'s Coze platform. Build AI agents with a visual DAG workflow canvas, knowledge bases, plugins, and multi-model support. Features LLM nodes, code execution (JS/Python/TS), conditional logic, batch processing, and nested workflows. Supports Ollama for local models.',
    category: 'agent-framework',
    tags: ['ai-platform', 'agents', 'workflow', 'visual', 'bytedance', 'knowledge-base', 'plugins'],
    tier: 'pro',
    version: 'latest',
    sourceUrl: 'https://github.com/coze-dev/coze-studio',
    license: 'Apache-2.0',
    docker: { image: 'ghcr.io/coze-dev/coze-studio:latest' },
    resources: { cpuLimit: '2', memoryLimit: '4G', gpuRequired: false },
    ports: [
      { internal: 8080, description: 'Web UI', protocol: 'http' },
      { internal: 8081, description: 'API', protocol: 'http' },
    ],
    volumes: [
      { name: 'coze-data', mountPath: '/app/data', description: 'Agents, workflows, knowledge bases', persistent: true },
    ],
    healthCheck: { endpoint: '/health', interval: '30s', timeout: '10s', retries: 3, startPeriod: '45s' },
    envVars: [
      { key: 'OPENAI_API_KEY', description: 'OpenAI API key', required: false, sensitive: true, category: 'llm' },
      { key: 'ANTHROPIC_API_KEY', description: 'Anthropic Claude key', required: false, sensitive: true, category: 'llm' },
      { key: 'OLLAMA_BASE_URL', description: 'Local Ollama server URL', required: false, sensitive: false, category: 'llm' },
    ],
    networkPolicy: { internetAccess: true, allowedEgress: ['*'], isolatedSandbox: false, bridgeToAims: true },
    securityLevel: 'standard',
    customizations: [
      { id: 'llm-provider', label: 'Default LLM', description: 'Primary model provider', type: 'select', options: ['openai', 'anthropic', 'ollama', 'doubao'], default: 'openai' },
    ],
    dependencies: ['redis'],
    supportedDelivery: ['hosted', 'exported'],
    defaultDelivery: 'hosted',
    icon: 'Wand2',
    accentColor: '#4f6ef7',
    featured: true,
    comingSoon: false,
    addedAt: '2026-02-22',
  },
];

// ---------------------------------------------------------------------------
// Catalog Manager
// ---------------------------------------------------------------------------

export class PlugCatalog {
  private plugs: Map<string, PlugDefinition>;

  constructor() {
    this.plugs = new Map();
    for (const plug of PLUG_REGISTRY) {
      this.plugs.set(plug.id, plug);
    }
    logger.info(
      { count: this.plugs.size },
      '[PlugCatalog] Initialized with registry',
    );
  }

  /** Get a single plug by ID. */
  get(plugId: string): PlugDefinition | undefined {
    return this.plugs.get(plugId);
  }

  /** List all plugs. */
  listAll(): PlugDefinition[] {
    return Array.from(this.plugs.values());
  }

  /** Search the catalog with filters. */
  search(query: CatalogSearchQuery): CatalogSearchResult {
    let results = this.listAll();

    // Filter out coming-soon unless specifically searching
    if (!query.featured) {
      results = results.filter(p => !p.comingSoon || query.q);
    }

    if (query.category) {
      results = results.filter(p => p.category === query.category);
    }

    if (query.tier) {
      results = results.filter(p => p.tier === query.tier);
    }

    if (query.delivery) {
      results = results.filter(p => p.supportedDelivery.includes(query.delivery!));
    }

    if (query.featured !== undefined) {
      results = results.filter(p => p.featured === query.featured);
    }

    if (query.tags && query.tags.length > 0) {
      const searchTags = new Set(query.tags.map(t => t.toLowerCase()));
      results = results.filter(p =>
        p.tags.some(t => searchTags.has(t.toLowerCase())),
      );
    }

    if (query.q) {
      const q = query.q.toLowerCase();
      results = results.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.tagline.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q)),
      );
    }

    // Build category counts from full list (not filtered)
    const allPlugs = this.listAll().filter(p => !p.comingSoon);
    const categories = {} as Record<PlugCategory, number>;
    for (const p of allPlugs) {
      categories[p.category] = (categories[p.category] || 0) + 1;
    }

    return {
      plugs: results,
      total: results.length,
      categories,
    };
  }

  /** Register a new plug definition (for dynamic additions). */
  register(plug: PlugDefinition): void {
    this.plugs.set(plug.id, plug);
    logger.info({ plugId: plug.id, name: plug.name }, '[PlugCatalog] Plug registered');
  }

  /** Remove a plug from the catalog. */
  unregister(plugId: string): boolean {
    const removed = this.plugs.delete(plugId);
    if (removed) {
      logger.info({ plugId }, '[PlugCatalog] Plug unregistered');
    }
    return removed;
  }

  /** Get all unique categories. */
  getCategories(): PlugCategory[] {
    const cats = new Set<PlugCategory>();
    for (const p of this.plugs.values()) {
      cats.add(p.category);
    }
    return Array.from(cats);
  }

  /** Get featured plugs. */
  getFeatured(): PlugDefinition[] {
    return this.listAll().filter(p => p.featured && !p.comingSoon);
  }

  /** Get all plugs (alias for listAll). */
  getAll(): PlugDefinition[] {
    return this.listAll();
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const plugCatalog = new PlugCatalog();
