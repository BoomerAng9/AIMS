import { NextResponse } from 'next/server';
import { findPlugByKeywords, type PlugDefinition } from '@/lib/plugs/registry';
import { findSkillByKeywords, type SkillDefinition } from '@/lib/skills/registry';

interface AcheevyRequest {
  userId: string;
  message: string;
  quickIntent?: string;
}

interface AcheevyResponse {
  reply: string;
  routedTo: string;
  taskId?: string;
  status: 'ok' | 'queued' | 'error';
  plug?: { id: string; name: string; slug: string };
  skill?: { id: string; name: string; type: string; route?: string };
  execution?: {
    requestId: string;
    status: string;
    reply: string;
    data?: Record<string, unknown>;
    lucUsage?: { service: string; amount: number; remaining?: number };
  };
}

// ─── THE PLUG PROTOCOL (Hook) ────────────────────────────────
// WHEN the user requests to "build," "spin up," "create," or "deploy" a feature:
//   1. STOP — do not generate generic code.
//   2. SEARCH the plug registry for a matching Plug definition.
//   3. RETRIEVE the Plug's context, data models, and prompt chains.
//   4. EXECUTE the Plug Fabrication skill.

const BUILD_TRIGGERS = ['build', 'spin up', 'create', 'deploy', 'launch', 'start', 'fabricate', 'scaffold'];

function matchesPlugProtocol(message: string): PlugDefinition | null {
  const lower = message.toLowerCase();
  const isBuildRequest = BUILD_TRIGGERS.some((trigger) => lower.includes(trigger));
  if (!isBuildRequest) return null;
  return findPlugByKeywords(lower) || null;
}

// ─── SKILL TRIGGER ENGINE ────────────────────────────────────
// Scans the Skills Registry (hooks, tasks, skills) for keyword matches.
// Sits between the Plug Protocol and legacy keyword routing in priority.

function matchesSkillTrigger(message: string): SkillDefinition | null {
  return findSkillByKeywords(message);
}

// ─── Intent Classification ───────────────────────────────────
// Priority: Plug Protocol > Perform Direct > Skills Registry > Legacy Keywords > Default

interface ClassifyResult {
  routedTo: string;
  reply: string;
  status: 'ok' | 'queued';
  plug?: PlugDefinition;
  skill?: SkillDefinition;
}

function classifyIntent(message: string): ClassifyResult {
  const lower = message.toLowerCase();

  // ── 1. PLUG PROTOCOL CHECK (highest priority) ──
  const matchedPlug = matchesPlugProtocol(message);
  if (matchedPlug) {
    return {
      routedTo: `plug-factory:${matchedPlug.id}`,
      reply: `Plug "${matchedPlug.name}" found in ai_plugs. Initializing fabrication sequence... This plug provides: ${matchedPlug.description}. Routing to /plugs/${matchedPlug.slug} for the full interface.`,
      status: 'ok',
      plug: matchedPlug,
    };
  }

  // ── 2. Direct Perform / sports / scouting keywords ──
  if (lower.includes('perform') || lower.includes('per form') || lower.includes('scout') || lower.includes('athlete') || lower.includes('recruit') || lower.includes('scouting')) {
    const performPlug = findPlugByKeywords('perform');
    return {
      routedTo: 'perform-stack',
      reply: 'Routing to Perform — the sports analytics and scouting platform. Opening athlete database, scouting reports, and recruitment pipeline.',
      status: 'ok',
      plug: performPlug || undefined,
    };
  }

  // ── 3. SKILLS REGISTRY CHECK ──
  const matchedSkill = matchesSkillTrigger(message);
  if (matchedSkill) {
    const route = matchedSkill.execution.route || `/api/skills/${matchedSkill.id}`;
    return {
      routedTo: `skill:${matchedSkill.id}`,
      reply: `${matchedSkill.type === 'hook' ? 'Hook' : matchedSkill.type === 'task' ? 'Task' : 'Skill'} "${matchedSkill.name}" activated. ${matchedSkill.description}`,
      status: 'ok',
      skill: matchedSkill,
    };
  }

  // ── 4. LEGACY KEYWORD ROUTING ──

  if (lower.includes('clone') || lower.includes('make it mine') || lower.includes('replicate')) {
    return {
      routedTo: 'openclaw',
      reply: 'I will use OpenClaw to scaffold a clone of the target platform. Provide the URL or name of the platform you want to replicate.',
      status: 'ok',
    };
  }

  // ── Plug catalog browsing ──
  if (lower.includes('plug') || lower.includes('catalog') || lower.includes('marketplace')) {
    return {
      routedTo: 'plug-catalog',
      reply: 'Opening the Plug Catalog. Browse all available AI micro-products at /plugs.',
      status: 'ok',
    };
  }

  // ── Skills catalog browsing ──
  if (lower.includes('skill') || lower.includes('hook') || lower.includes('task')) {
    return {
      routedTo: 'skill-catalog',
      reply: 'Opening the Skills Catalog. Browse all available hooks, tasks, and skills at /api/skills/catalog.',
      status: 'ok',
    };
  }

  // ── 5. DEFAULT ──
  return {
    routedTo: 'internal-llm',
    reply: `Understood. I am analyzing your request: "${message}". Let me determine the best tools and approach for this task.`,
    status: 'ok',
  };
}

// UEF Gateway URL (docker internal or localhost fallback)
const UEF_URL = process.env.UEF_ENDPOINT || 'http://uef-gateway:3001';

async function forwardToGateway(
  body: AcheevyRequest,
  intent: string
): Promise<AcheevyResponse['execution'] | null> {
  try {
    const res = await fetch(`${UEF_URL}/acheevy/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: body.userId || 'anon',
        message: body.message,
        intent,
        conversationId: body.quickIntent ? undefined : `conv_${Date.now()}`,
      }),
    });

    if (!res.ok) return null;
    return await res.json();
  } catch {
    // UEF Gateway not reachable — classification-only mode
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const body: AcheevyRequest = await request.json();
    const { message, quickIntent } = body;

    if (!message) {
      return NextResponse.json(
        { reply: 'Please provide a message.', routedTo: 'error', status: 'error' },
        { status: 400 }
      );
    }

    // 1. Classify intent locally (instant response)
    const result = classifyIntent(quickIntent || message);

    // 2. Forward to UEF Gateway for execution (non-blocking graceful degradation)
    const execution = await forwardToGateway(body, result.routedTo);

    const response: AcheevyResponse = {
      reply: execution?.reply || result.reply,
      routedTo: result.routedTo,
      taskId: execution?.requestId || (result.status === 'queued' ? `task_${Date.now()}` : undefined),
      status: execution ? (execution.status === 'error' ? 'error' : execution.status === 'queued' ? 'queued' : 'ok') : result.status,
      plug: result.plug ? { id: result.plug.id, name: result.plug.name, slug: result.plug.slug } : undefined,
      skill: result.skill ? { id: result.skill.id, name: result.skill.name, type: result.skill.type, route: result.skill.execution.route } : undefined,
      execution: execution || undefined,
    };

    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      { reply: 'An internal error occurred. Please try again.', routedTo: 'error', status: 'error' },
      { status: 500 }
    );
  }
}
