import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/auth/require-role';

const METADATA_KEY = 'operatorConfig';

interface OperatorConfig {
  workspaceName: string;
  industry: string;
  timezone: string;
  sessionTimeout: string;
  chatRuntimeUrl: string;
  openRouterBaseUrl: string;
  openRouterModel: string;
  notifications: Record<string, boolean>;
}

const DEFAULT_CONFIG: OperatorConfig = {
  workspaceName: 'My ACHEEVY Workspace',
  industry: 'Technology / SaaS',
  timezone: 'America/New_York (EST)',
  sessionTimeout: '30 minutes',
  chatRuntimeUrl: process.env.CHAT_RUNTIME_URL || process.env.CHAT_INTERFACE_URL || 'https://chat.your-domain.com',
  openRouterBaseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
  openRouterModel: process.env.OPENROUTER_MODEL || 'anthropic/claude-sonnet-4-5-20250929',
  notifications: {
    taskCompletion: true,
    budgetWarnings: true,
    oracleFailures: false,
    weeklyDigest: false,
  },
};

function parseMetadata(metadata: string | null): Record<string, unknown> {
  if (!metadata) return {};
  try {
    const parsed = JSON.parse(metadata) as Record<string, unknown>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function sanitizeConfig(input: unknown): OperatorConfig {
  const raw = (input && typeof input === 'object' ? input : {}) as Partial<OperatorConfig>;
  return {
    workspaceName: typeof raw.workspaceName === 'string' && raw.workspaceName.trim() ? raw.workspaceName : DEFAULT_CONFIG.workspaceName,
    industry: typeof raw.industry === 'string' && raw.industry.trim() ? raw.industry : DEFAULT_CONFIG.industry,
    timezone: typeof raw.timezone === 'string' && raw.timezone.trim() ? raw.timezone : DEFAULT_CONFIG.timezone,
    sessionTimeout: typeof raw.sessionTimeout === 'string' && raw.sessionTimeout.trim() ? raw.sessionTimeout : DEFAULT_CONFIG.sessionTimeout,
    chatRuntimeUrl: typeof raw.chatRuntimeUrl === 'string' && raw.chatRuntimeUrl.trim() ? raw.chatRuntimeUrl : DEFAULT_CONFIG.chatRuntimeUrl,
    openRouterBaseUrl: typeof raw.openRouterBaseUrl === 'string' && raw.openRouterBaseUrl.trim() ? raw.openRouterBaseUrl : DEFAULT_CONFIG.openRouterBaseUrl,
    openRouterModel: typeof raw.openRouterModel === 'string' && raw.openRouterModel.trim() ? raw.openRouterModel : DEFAULT_CONFIG.openRouterModel,
    notifications: {
      taskCompletion: Boolean(raw.notifications?.taskCompletion ?? DEFAULT_CONFIG.notifications.taskCompletion),
      budgetWarnings: Boolean(raw.notifications?.budgetWarnings ?? DEFAULT_CONFIG.notifications.budgetWarnings),
      oracleFailures: Boolean(raw.notifications?.oracleFailures ?? DEFAULT_CONFIG.notifications.oracleFailures),
      weeklyDigest: Boolean(raw.notifications?.weeklyDigest ?? DEFAULT_CONFIG.notifications.weeklyDigest),
    },
  };
}

function buildKeyStatus() {
  return {
    openRouterApiKeyConfigured: Boolean(process.env.OPENROUTER_API_KEY),
    chatRuntimeBridgeSecretConfigured: Boolean(
      process.env.CHAT_RUNTIME_BRIDGE_SECRET
      || process.env.CHAT_INTERFACE_BRIDGE_SECRET
      || process.env.LIBRECHAT_BRIDGE_SECRET
      || process.env.AIMS_BRIDGE_SHARED_SECRET
      || process.env.II_AGENT_BRIDGE_KEY
    ),
  };
}

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const user = await prisma.user.findUnique({
    where: { email: auth.user.email },
    select: { metadata: true },
  });

  const metadata = parseMetadata(user?.metadata ?? null);
  const storedConfig = sanitizeConfig(metadata[METADATA_KEY]);

  return NextResponse.json({
    config: storedConfig,
    keyStatus: buildKeyStatus(),
  });
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const nextConfig = sanitizeConfig(body);

  const existingUser = await prisma.user.findUnique({
    where: { email: auth.user.email },
    select: { metadata: true },
  });

  if (!existingUser) {
    return NextResponse.json({ error: 'Authenticated user not found' }, { status: 404 });
  }

  const metadata = parseMetadata(existingUser.metadata);
  metadata[METADATA_KEY] = nextConfig;

  await prisma.user.update({
    where: { email: auth.user.email },
    data: { metadata: JSON.stringify(metadata) },
  });

  return NextResponse.json({
    success: true,
    config: nextConfig,
    keyStatus: buildKeyStatus(),
  });
}