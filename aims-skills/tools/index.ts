/**
 * AIMS Tool Registry — Programmatic Discovery
 *
 * Chicken Hawk and Lil_Hawks use this registry to discover
 * available tool documentation at runtime.
 *
 * Each entry maps to a .tool.md file in this directory.
 */

export interface ToolEntry {
  readonly id: string;
  readonly file: string;
  readonly category: 'ai' | 'voice' | 'search' | 'payments' | 'database' | 'email' | 'messaging' | 'infra' | 'cloud' | 'video' | 'workflow' | 'web' | 'auth' | 'ui' | 'analytics';
  readonly provider: string;
  readonly envVars: readonly string[];
}

export const TOOL_REGISTRY: readonly ToolEntry[] = [
  // ── AI / LLM ────────────────────────────────────────────────────────
  { id: 'openrouter', file: 'openrouter.tool.md', category: 'ai', provider: 'OpenRouter', envVars: ['OPENROUTER_API_KEY'] },
  { id: 'anthropic-claude', file: 'anthropic-claude.tool.md', category: 'ai', provider: 'Anthropic', envVars: ['ANTHROPIC_API_KEY'] },
  { id: 'vertex-ai', file: 'vertex-ai.tool.md', category: 'ai', provider: 'Google Cloud', envVars: ['GOOGLE_CLOUD_PROJECT', 'GOOGLE_CLOUD_REGION', 'GOOGLE_APPLICATION_CREDENTIALS'] },
  { id: 'groq', file: 'groq.tool.md', category: 'ai', provider: 'Groq', envVars: ['GROQ_API_KEY'] },
  { id: 'e2b', file: 'e2b.tool.md', category: 'ai', provider: 'E2B', envVars: ['E2B_API_KEY'] },

  // ── Voice / Speech ──────────────────────────────────────────────────
  { id: 'elevenlabs', file: 'elevenlabs.tool.md', category: 'voice', provider: 'ElevenLabs', envVars: ['ELEVENLABS_API_KEY', 'ELEVENLABS_VOICE_ID'] },
  { id: 'deepgram', file: 'deepgram.tool.md', category: 'voice', provider: 'Deepgram', envVars: ['DEEPGRAM_API_KEY'] },

  // ── Search ──────────────────────────────────────────────────────────
  { id: 'brave-search', file: 'brave-search.tool.md', category: 'search', provider: 'Brave', envVars: ['BRAVE_SEARCH_API_KEY'] },
  { id: 'tavily', file: 'tavily.tool.md', category: 'search', provider: 'Tavily', envVars: ['TAVILY_API_KEY'] },
  { id: 'serper', file: 'serper.tool.md', category: 'search', provider: 'Serper', envVars: ['SERPER_API_KEY'] },

  // ── Payments ────────────────────────────────────────────────────────
  { id: 'stripe', file: 'stripe.tool.md', category: 'payments', provider: 'Stripe', envVars: ['STRIPE_SECRET_KEY', 'STRIPE_PUBLISHABLE_KEY', 'STRIPE_WEBHOOK_SECRET'] },

  // ── Database / Cache ────────────────────────────────────────────────
  { id: 'firebase', file: 'firebase.tool.md', category: 'database', provider: 'Google', envVars: ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY'] },
  { id: 'redis', file: 'redis.tool.md', category: 'database', provider: 'Redis', envVars: ['REDIS_URL', 'REDIS_PASSWORD'] },
  { id: 'prisma', file: 'prisma.tool.md', category: 'database', provider: 'Prisma', envVars: ['DATABASE_URL'] },

  // ── Email ───────────────────────────────────────────────────────────
  { id: 'resend', file: 'resend.tool.md', category: 'email', provider: 'Resend', envVars: ['RESEND_API_KEY'] },
  { id: 'sendgrid', file: 'sendgrid.tool.md', category: 'email', provider: 'Twilio SendGrid', envVars: ['SENDGRID_API_KEY'] },

  // ── Messaging ───────────────────────────────────────────────────────
  { id: 'telegram', file: 'telegram.tool.md', category: 'messaging', provider: 'Telegram', envVars: ['TELEGRAM_BOT_TOKEN'] },
  { id: 'discord', file: 'discord.tool.md', category: 'messaging', provider: 'Discord', envVars: ['DISCORD_CLIENT_ID', 'DISCORD_CLIENT_SECRET'] },

  // ── Infrastructure ──────────────────────────────────────────────────
  { id: 'nginx', file: 'nginx.tool.md', category: 'infra', provider: 'Nginx', envVars: [] },
  { id: 'certbot', file: 'certbot.tool.md', category: 'infra', provider: "Let's Encrypt", envVars: [] },
  { id: 'hostinger-vps', file: 'hostinger-vps.tool.md', category: 'infra', provider: 'Hostinger', envVars: [] },

  // ── Cloud / GCP ─────────────────────────────────────────────────────
  { id: 'gcp-cloud', file: 'gcp-cloud.tool.md', category: 'cloud', provider: 'Google Cloud', envVars: ['GOOGLE_APPLICATION_CREDENTIALS', 'GOOGLE_CLOUD_PROJECT'] },
  { id: 'google-oauth', file: 'google-oauth.tool.md', category: 'cloud', provider: 'Google', envVars: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'] },

  // ── Video / Media ───────────────────────────────────────────────────
  { id: 'kling-ai', file: 'kling-ai.tool.md', category: 'video', provider: 'Kling AI', envVars: ['KLING_API_KEY'] },

  // ── Workflow / Automation ───────────────────────────────────────────
  { id: 'agent-zero', file: 'agent-zero.tool.md', category: 'workflow', provider: 'Agent Zero', envVars: ['OPENROUTER_API_KEY'] },
  { id: 'composio', file: 'composio.tool.md', category: 'workflow', provider: 'Composio', envVars: ['COMPOSIO_API_KEY'] },

  // ── Web Tools ───────────────────────────────────────────────────────
  { id: 'firecrawl', file: 'firecrawl.tool.md', category: 'web', provider: 'Firecrawl', envVars: ['FIRECRAWL_API_KEY'] },
  { id: 'apify', file: 'apify.tool.md', category: 'web', provider: 'Apify', envVars: ['APIFY_API_KEY'] },

  // ── Auth ────────────────────────────────────────────────────────────
  { id: 'nextauth', file: 'nextauth.tool.md', category: 'auth', provider: 'NextAuth.js', envVars: ['NEXTAUTH_SECRET', 'NEXTAUTH_URL'] },

  // ── UI ──────────────────────────────────────────────────────────────
  { id: 'threejs', file: 'threejs.tool.md', category: 'ui', provider: 'Three.js', envVars: [] },

  // ── Analytics ───────────────────────────────────────────────────────
  { id: 'posthog', file: 'posthog.tool.md', category: 'analytics', provider: 'PostHog', envVars: ['POSTHOG_HOST'] },
  { id: 'plausible', file: 'plausible.tool.md', category: 'analytics', provider: 'Plausible', envVars: ['PLAUSIBLE_HOST', 'PLAUSIBLE_DOMAIN'] },
] as const;

/**
 * Get all tools in a category.
 */
export function getToolsByCategory(category: ToolEntry['category']): readonly ToolEntry[] {
  return TOOL_REGISTRY.filter(t => t.category === category);
}

/**
 * Get a tool by ID.
 */
export function getToolById(id: string): ToolEntry | undefined {
  return TOOL_REGISTRY.find(t => t.id === id);
}

/**
 * Get all env vars needed across all tools.
 */
export function getAllRequiredEnvVars(): string[] {
  const vars = new Set<string>();
  for (const tool of TOOL_REGISTRY) {
    for (const v of tool.envVars) {
      vars.add(v);
    }
  }
  return [...vars].sort();
}

/**
 * Check which tools are configured (have their env vars set).
 */
export function getConfiguredTools(): ToolEntry[] {
  return TOOL_REGISTRY.filter(tool =>
    tool.envVars.length === 0 || tool.envVars.some(v => !!process.env[v])
  );
}
