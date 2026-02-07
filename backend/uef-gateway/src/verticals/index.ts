/**
 * Verticals Registry — External Tool Integrations for A.I.M.S.
 *
 * Two categories:
 *   AGENT   — Autonomous agent frameworks (do work independently)
 *   COMMONS — Shared CLI tools & infrastructure (utilities for everyone)
 *
 * Each vertical is a Plug that lives on the Shelf. Users activate
 * which ones they want. Combined Arsenal = Plugs + Boomer_Angs.
 */

import logger from '../logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type VerticalCategory = 'AGENT' | 'COMMONS';

export interface Vertical {
  id: string;
  name: string;
  category: VerticalCategory;
  description: string;
  homepage: string;
  repo: string;
  install: string;               // How to install on VPS
  invoke: string;                // How to run it
  envKey: string | null;         // API key env var (null if none needed)
  dockerImage: string | null;    // Docker image for container deployment
  port: number | null;           // Default port (null if CLI-only)
  status: 'available' | 'installed' | 'running' | 'disabled';
  capabilities: string[];
}

// ---------------------------------------------------------------------------
// Agent Verticals — Autonomous AI Agent Frameworks
// ---------------------------------------------------------------------------

const OPENCLAW: Vertical = {
  id: 'openclaw',
  name: 'OpenClaw',
  category: 'AGENT',
  description: 'Autonomous AI agent — executes tasks via LLMs, 100+ AgentSkills, messaging UI (Signal/Telegram/Discord). Model-agnostic, runs locally.',
  homepage: 'https://openclaw.ai',
  repo: 'https://github.com/psteinroe/openclaw',
  install: 'pip install openclaw',
  invoke: 'openclaw --config /home/aims/AIMS/infra/openclaw.yaml',
  envKey: 'OPENROUTER_API_KEY',   // Uses same OpenRouter key
  dockerImage: null,
  port: null,
  status: 'available',
  capabilities: [
    'autonomous-execution',
    'messaging-ui',
    'shell-commands',
    'file-management',
    'web-automation',
    'multi-model',
  ],
};

const AGENT_ZERO: Vertical = {
  id: 'agent-zero',
  name: 'Agent Zero',
  category: 'AGENT',
  description: 'Open-source AI framework — uses computer as a tool. Multi-agent cooperation, Docker sandboxed, web UI. Dynamic tool creation, self-correcting.',
  homepage: 'https://www.agent-zero.ai',
  repo: 'https://github.com/agent0ai/agent-zero',
  install: 'docker pull frdel/agent-zero-run',
  invoke: 'docker run -p 50001:80 frdel/agent-zero-run',
  envKey: 'OPENROUTER_API_KEY',
  dockerImage: 'frdel/agent-zero-run',
  port: 50001,
  status: 'available',
  capabilities: [
    'computer-use',
    'multi-agent',
    'docker-sandbox',
    'web-ui',
    'tool-creation',
    'self-correction',
    'code-execution',
  ],
};

// ---------------------------------------------------------------------------
// Commons Verticals — Shared CLI Tools & Infrastructure
// ---------------------------------------------------------------------------

const CLAUDE_CODE: Vertical = {
  id: 'claude-code',
  name: 'Claude Code',
  category: 'COMMONS',
  description: 'Anthropic CLI for Claude — agentic coding, file ops, git, terminal. Full codebase understanding with extended thinking.',
  homepage: 'https://docs.anthropic.com/en/docs/claude-code',
  repo: 'https://github.com/anthropics/claude-code',
  install: 'npm install -g @anthropic-ai/claude-code',
  invoke: 'claude',
  envKey: 'ANTHROPIC_API_KEY',
  dockerImage: null,
  port: null,
  status: 'available',
  capabilities: [
    'code-generation',
    'file-operations',
    'git-operations',
    'terminal-access',
    'codebase-search',
    'multi-file-editing',
  ],
};

const GEMINI_CLI: Vertical = {
  id: 'gemini-cli',
  name: 'Gemini CLI',
  category: 'COMMONS',
  description: 'Google CLI for Gemini — YOLO mode auto-approves all tool calls. Shell execution, file management, web search. Good for automated VPS ops.',
  homepage: 'https://github.com/google/gemini-cli',
  repo: 'https://github.com/google/gemini-cli',
  install: 'npm install -g @google/gemini-cli',
  invoke: 'gemini -y',
  envKey: 'GEMINI_API_KEY',
  dockerImage: null,
  port: null,
  status: 'available',
  capabilities: [
    'shell-execution',
    'file-management',
    'web-search',
    'yolo-mode',
    'automated-ops',
  ],
};

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const ALL_VERTICALS: Vertical[] = [
  // Agent (II)
  OPENCLAW,
  AGENT_ZERO,
  // Commons (II)
  CLAUDE_CODE,
  GEMINI_CLI,
];

class VerticalRegistry {
  private verticals: Map<string, Vertical>;

  constructor(initial: Vertical[]) {
    this.verticals = new Map(initial.map(v => [v.id, v]));
    logger.info({ count: this.verticals.size }, '[Verticals] Registry initialized');
  }

  /** List all registered verticals */
  list(): Vertical[] {
    return Array.from(this.verticals.values());
  }

  /** List by category */
  listByCategory(category: VerticalCategory): Vertical[] {
    return this.list().filter(v => v.category === category);
  }

  /** Get a specific vertical */
  get(id: string): Vertical | undefined {
    return this.verticals.get(id);
  }

  /** Check if a vertical's API key is configured */
  isKeyed(id: string): boolean {
    const v = this.verticals.get(id);
    if (!v || !v.envKey) return true; // No key needed = always ready
    return !!process.env[v.envKey];
  }

  /** Summary stats */
  getStats(): { total: number; agents: number; commons: number; keyed: number } {
    const all = this.list();
    return {
      total: all.length,
      agents: all.filter(v => v.category === 'AGENT').length,
      commons: all.filter(v => v.category === 'COMMONS').length,
      keyed: all.filter(v => this.isKeyed(v.id)).length,
    };
  }
}

export const verticalRegistry = new VerticalRegistry(ALL_VERTICALS);
