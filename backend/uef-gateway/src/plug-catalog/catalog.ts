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
    tagline: 'Full-stack autonomous code execution with Socket.IO streaming',
    description: 'AIMS native autonomous execution engine. Writes code, runs tests, deploys artifacts. Features real-time Socket.IO streaming, PostgreSQL persistence, isolated sandbox, and tool server. Already part of the core AIMS stack.',
    category: 'code-execution',
    tags: ['code', 'autonomous', 'socket.io', 'full-stack', 'sandbox'],
    tier: 'starter',
    version: '1.0.0',
    license: 'Proprietary',
    docker: {
      buildContext: '../backend/ii-agent',
    },
    resources: { cpuLimit: '2', memoryLimit: '2G', gpuRequired: false },
    ports: [
      { internal: 8000, description: 'Main agent (Socket.IO)', protocol: 'ws' },
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
