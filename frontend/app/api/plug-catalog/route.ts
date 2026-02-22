/**
 * Plug Catalog API Routes
 *
 * Proxies to UEF Gateway's real plug catalog and deploy engine.
 * Falls back to local catalog data if gateway is unreachable.
 *
 * GET  /api/plug-catalog              → List/search catalog
 * GET  /api/plug-catalog?id=xxx       → Get single plug
 * GET  /api/plug-catalog?featured=1   → Featured plugs
 * POST /api/plug-catalog              → Spin up a plug instance
 */

import { NextRequest, NextResponse } from 'next/server';

const UEF_GATEWAY = process.env.UEF_GATEWAY_URL || process.env.NEXT_PUBLIC_UEF_GATEWAY_URL || 'http://localhost:3001';
const API_KEY = process.env.INTERNAL_API_KEY || '';

async function gatewayFetch(path: string, options?: RequestInit): Promise<Response | null> {
  try {
    const url = `${UEF_GATEWAY}${path}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(API_KEY ? { 'x-api-key': API_KEY } : {}),
        ...(options?.headers || {}),
      },
    });
    return res;
  } catch {
    return null;
  }
}

// Fallback local catalog (used when gateway is unreachable)
const PLUG_CATALOG = [
  { id: 'openclaw', name: 'OpenClaw', tagline: 'Computer-use agent orchestrator with sub-agent spawning', category: 'computer-use', tags: ['computer-use', 'rpa', 'sub-agents', 'automation', 'orchestrator'], tier: 'pro', icon: 'Bot', accentColor: '#6366f1', featured: true, comingSoon: false, resources: { cpu: '2', memory: '4G', gpu: false }, delivery: ['hosted', 'exported'] },
  { id: 'agent-zero', name: 'Agent Zero', tagline: 'Autonomous AI agent with computer-as-tool capability', category: 'agent-framework', tags: ['autonomous', 'computer-use', 'code', 'sandbox'], tier: 'starter', icon: 'Cpu', accentColor: '#10b981', featured: true, comingSoon: false, resources: { cpu: '2', memory: '2G', gpu: false }, delivery: ['hosted', 'exported'] },
  { id: 'ii-agent', name: 'II-Agent', tagline: 'Full-stack autonomous code execution with Socket.IO streaming', category: 'code-execution', tags: ['code', 'autonomous', 'full-stack', 'sandbox'], tier: 'starter', icon: 'Terminal', accentColor: '#f59e0b', featured: true, comingSoon: false, resources: { cpu: '2', memory: '2G', gpu: false }, delivery: ['hosted'] },
  { id: 'deerflow', name: 'DeerFlow', tagline: 'Deep research agent with multi-step investigation', category: 'research-agent', tags: ['research', 'deep-search', 'reports', 'analysis'], tier: 'starter', icon: 'Search', accentColor: '#3b82f6', featured: true, comingSoon: false, resources: { cpu: '1', memory: '1G', gpu: false }, delivery: ['hosted', 'exported'] },
  { id: 'n8n', name: 'n8n', tagline: 'Visual workflow automation with 400+ integrations', category: 'workflow-automation', tags: ['workflow', 'automation', 'integrations', 'no-code'], tier: 'starter', icon: 'Workflow', accentColor: '#ff6d5a', featured: true, comingSoon: false, resources: { cpu: '1', memory: '1G', gpu: false }, delivery: ['hosted', 'exported'] },
  { id: 'trey-ai', name: 'Trey AI', tagline: 'Browser-native computer use agent for web automation', category: 'computer-use', tags: ['browser', 'computer-use', 'web-automation', 'rpa'], tier: 'pro', icon: 'Monitor', accentColor: '#8b5cf6', featured: false, comingSoon: false, resources: { cpu: '2', memory: '4G', gpu: false }, delivery: ['hosted', 'exported'] },
  { id: 'personaplex', name: 'PersonaPlex', tagline: 'Full-duplex AI voice agent powered by NVIDIA Nemotron', category: 'voice-agent', tags: ['voice', 'full-duplex', 'avatar', 'nvidia'], tier: 'pro', icon: 'Mic', accentColor: '#76b900', featured: true, comingSoon: false, resources: { cpu: '2', memory: '4G', gpu: true }, delivery: ['hosted'] },
  { id: 'perform-platform', name: 'Per|Form', tagline: 'AI-powered sports scouting and intelligence platform', category: 'custom-vertical', tags: ['sports', 'nfl', 'scouting', 'analytics'], tier: 'enterprise', icon: 'Trophy', accentColor: '#d4af37', featured: true, comingSoon: false, resources: { cpu: '2', memory: '2G', gpu: false }, delivery: ['hosted'] },
  { id: 'browser-use', name: 'Browser Use', tagline: 'Headless browser agent for data extraction and web tasks', category: 'data-pipeline', tags: ['browser', 'scraping', 'data-extraction', 'headless'], tier: 'starter', icon: 'Globe', accentColor: '#ec4899', featured: false, comingSoon: false, resources: { cpu: '1', memory: '2G', gpu: false }, delivery: ['hosted', 'exported'] },
  { id: 'windmill', name: 'Windmill', tagline: 'Developer-first workflow engine with script-based automation', category: 'workflow-automation', tags: ['workflow', 'developer', 'python', 'typescript'], tier: 'starter', icon: 'Wind', accentColor: '#3b82f6', featured: false, comingSoon: false, resources: { cpu: '2', memory: '2G', gpu: false }, delivery: ['hosted', 'exported'] },
  { id: 'content-engine', name: 'Content Engine', tagline: 'Automated content creation and social media management', category: 'content-engine', tags: ['content', 'social-media', 'marketing'], tier: 'starter', icon: 'PenTool', accentColor: '#f97316', featured: false, comingSoon: true, resources: { cpu: '1', memory: '1G', gpu: false }, delivery: ['hosted'] },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const id = searchParams.get('id');
  const category = searchParams.get('category');
  const featured = searchParams.get('featured');
  const q = searchParams.get('q');
  const tier = searchParams.get('tier');

  // Try UEF Gateway first
  if (id) {
    const res = await gatewayFetch(`/api/plug-catalog/${id}`);
    if (res?.ok) {
      const data = await res.json();
      return NextResponse.json(data.plug || data);
    }
    // Fallback to local
    const plug = PLUG_CATALOG.find(p => p.id === id);
    if (!plug) return NextResponse.json({ error: 'Plug not found' }, { status: 404 });
    return NextResponse.json(plug);
  }

  // Build query string for gateway
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (category) params.set('category', category);
  if (tier) params.set('tier', tier);
  if (featured === '1') params.set('featured', 'true');

  const res = await gatewayFetch(`/api/plug-catalog?${params.toString()}`);
  if (res?.ok) {
    const data = await res.json();
    return NextResponse.json(data);
  }

  // Fallback to local catalog
  let results = [...PLUG_CATALOG];
  if (category) results = results.filter(p => p.category === category);
  if (tier) results = results.filter(p => p.tier === tier);
  if (featured === '1') results = results.filter(p => p.featured && !p.comingSoon);
  if (q) {
    const lower = q.toLowerCase();
    results = results.filter(p =>
      p.name.toLowerCase().includes(lower) ||
      p.tagline.toLowerCase().includes(lower) ||
      p.tags.some(t => t.includes(lower)),
    );
  }

  const categories: Record<string, number> = {};
  for (const p of PLUG_CATALOG.filter(p => !p.comingSoon)) {
    categories[p.category] = (categories[p.category] || 0) + 1;
  }

  return NextResponse.json({ plugs: results, total: results.length, categories });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { plugId, instanceName, deliveryMode, customizations, envOverrides, domain } = body;

  if (!plugId || !instanceName) {
    return NextResponse.json({ error: 'plugId and instanceName are required' }, { status: 400 });
  }

  // Proxy to UEF Gateway's real spin-up endpoint
  const res = await gatewayFetch('/api/plug-instances/spin-up', {
    method: 'POST',
    body: JSON.stringify({
      plugId,
      userId: 'web-user', // TODO: get from session
      instanceName,
      deliveryMode: deliveryMode || 'hosted',
      customizations: customizations || {},
      envOverrides: envOverrides || {},
      domain,
    }),
  });

  if (res?.ok) {
    const data = await res.json();
    return NextResponse.json(data);
  }

  // Gateway unreachable — return queued status
  const plug = PLUG_CATALOG.find(p => p.id === plugId);
  if (!plug) {
    return NextResponse.json({ error: 'Plug not found' }, { status: 404 });
  }

  return NextResponse.json({
    instance: {
      instanceId: crypto.randomUUID(),
      plugId,
      name: instanceName,
      status: 'provisioning',
      deliveryMode: deliveryMode || 'hosted',
      healthStatus: 'unknown',
    },
    deploymentId: crypto.randomUUID(),
    estimatedReadyTime: 'Queued — gateway unreachable',
    events: [
      { timestamp: new Date().toISOString(), stage: 'validate', message: `Validated plug "${plug.name}"` },
      { timestamp: new Date().toISOString(), stage: 'warn', message: 'UEF Gateway unreachable — deployment queued' },
    ],
  });
}
