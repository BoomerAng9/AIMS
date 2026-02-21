/**
 * Plug Catalog API Routes
 *
 * GET  /api/plug-catalog              → List/search catalog
 * GET  /api/plug-catalog?id=xxx       → Get single plug
 * GET  /api/plug-catalog?featured=1   → Featured plugs
 * POST /api/plug-catalog              → Spin up a plug instance
 */

import { NextRequest, NextResponse } from 'next/server';

// In-memory catalog for frontend-side rendering (mirrors backend)
// In production, these would call UEF Gateway

const PLUG_CATALOG = [
  {
    id: 'openclaw',
    name: 'OpenClaw',
    tagline: 'Computer-use agent orchestrator with sub-agent spawning',
    category: 'computer-use',
    tags: ['computer-use', 'rpa', 'sub-agents', 'automation', 'orchestrator'],
    tier: 'pro',
    icon: 'Bot',
    accentColor: '#6366f1',
    featured: true,
    comingSoon: false,
    resources: { cpu: '2', memory: '4G', gpu: false },
    delivery: ['hosted', 'exported'],
  },
  {
    id: 'agent-zero',
    name: 'Agent Zero',
    tagline: 'Autonomous AI agent with computer-as-tool capability',
    category: 'agent-framework',
    tags: ['autonomous', 'computer-use', 'code', 'sandbox'],
    tier: 'starter',
    icon: 'Cpu',
    accentColor: '#10b981',
    featured: true,
    comingSoon: false,
    resources: { cpu: '2', memory: '2G', gpu: false },
    delivery: ['hosted', 'exported'],
  },
  {
    id: 'ii-agent',
    name: 'II-Agent',
    tagline: 'Full-stack autonomous code execution with Socket.IO streaming',
    category: 'code-execution',
    tags: ['code', 'autonomous', 'full-stack', 'sandbox'],
    tier: 'starter',
    icon: 'Terminal',
    accentColor: '#f59e0b',
    featured: true,
    comingSoon: false,
    resources: { cpu: '2', memory: '2G', gpu: false },
    delivery: ['hosted'],
  },
  {
    id: 'deerflow',
    name: 'DeerFlow',
    tagline: 'Deep research agent with multi-step investigation',
    category: 'research-agent',
    tags: ['research', 'deep-search', 'reports', 'analysis'],
    tier: 'starter',
    icon: 'Search',
    accentColor: '#3b82f6',
    featured: true,
    comingSoon: false,
    resources: { cpu: '1', memory: '1G', gpu: false },
    delivery: ['hosted', 'exported'],
  },
  {
    id: 'n8n',
    name: 'n8n',
    tagline: 'Visual workflow automation with 400+ integrations',
    category: 'workflow-automation',
    tags: ['workflow', 'automation', 'integrations', 'no-code'],
    tier: 'starter',
    icon: 'Workflow',
    accentColor: '#ff6d5a',
    featured: true,
    comingSoon: false,
    resources: { cpu: '1', memory: '1G', gpu: false },
    delivery: ['hosted', 'exported'],
  },
  {
    id: 'trey-ai',
    name: 'Trey AI',
    tagline: 'Browser-native computer use agent for web automation',
    category: 'computer-use',
    tags: ['browser', 'computer-use', 'web-automation', 'rpa'],
    tier: 'pro',
    icon: 'Monitor',
    accentColor: '#8b5cf6',
    featured: false,
    comingSoon: false,
    resources: { cpu: '2', memory: '4G', gpu: false },
    delivery: ['hosted', 'exported'],
  },
  {
    id: 'personaplex',
    name: 'PersonaPlex',
    tagline: 'Full-duplex AI voice agent powered by NVIDIA Nemotron',
    category: 'voice-agent',
    tags: ['voice', 'full-duplex', 'avatar', 'nvidia'],
    tier: 'pro',
    icon: 'Mic',
    accentColor: '#76b900',
    featured: true,
    comingSoon: false,
    resources: { cpu: '2', memory: '4G', gpu: true },
    delivery: ['hosted'],
  },
  {
    id: 'perform-platform',
    name: 'Per|Form',
    tagline: 'AI-powered sports scouting and intelligence platform',
    category: 'custom-vertical',
    tags: ['sports', 'nfl', 'scouting', 'analytics'],
    tier: 'enterprise',
    icon: 'Trophy',
    accentColor: '#d4af37',
    featured: true,
    comingSoon: false,
    resources: { cpu: '2', memory: '2G', gpu: false },
    delivery: ['hosted'],
  },
  {
    id: 'browser-use',
    name: 'Browser Use',
    tagline: 'Headless browser agent for data extraction and web tasks',
    category: 'data-pipeline',
    tags: ['browser', 'scraping', 'data-extraction', 'headless'],
    tier: 'starter',
    icon: 'Globe',
    accentColor: '#ec4899',
    featured: false,
    comingSoon: false,
    resources: { cpu: '1', memory: '2G', gpu: false },
    delivery: ['hosted', 'exported'],
  },
  {
    id: 'windmill',
    name: 'Windmill',
    tagline: 'Developer-first workflow engine with script-based automation',
    category: 'workflow-automation',
    tags: ['workflow', 'developer', 'python', 'typescript'],
    tier: 'starter',
    icon: 'Wind',
    accentColor: '#3b82f6',
    featured: false,
    comingSoon: false,
    resources: { cpu: '2', memory: '2G', gpu: false },
    delivery: ['hosted', 'exported'],
  },
  {
    id: 'content-engine',
    name: 'Content Engine',
    tagline: 'Automated content creation and social media management',
    category: 'content-engine',
    tags: ['content', 'social-media', 'marketing'],
    tier: 'starter',
    icon: 'PenTool',
    accentColor: '#f97316',
    featured: false,
    comingSoon: true,
    resources: { cpu: '1', memory: '1G', gpu: false },
    delivery: ['hosted'],
  },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const id = searchParams.get('id');
  const category = searchParams.get('category');
  const featured = searchParams.get('featured');
  const q = searchParams.get('q');
  const tier = searchParams.get('tier');

  // Single plug lookup
  if (id) {
    const plug = PLUG_CATALOG.find(p => p.id === id);
    if (!plug) {
      return NextResponse.json({ error: 'Plug not found' }, { status: 404 });
    }
    return NextResponse.json(plug);
  }

  let results = [...PLUG_CATALOG];

  // Filter
  if (category) {
    results = results.filter(p => p.category === category);
  }
  if (tier) {
    results = results.filter(p => p.tier === tier);
  }
  if (featured === '1') {
    results = results.filter(p => p.featured && !p.comingSoon);
  }
  if (q) {
    const lower = q.toLowerCase();
    results = results.filter(p =>
      p.name.toLowerCase().includes(lower) ||
      p.tagline.toLowerCase().includes(lower) ||
      p.tags.some(t => t.includes(lower)),
    );
  }

  // Build category counts
  const categories: Record<string, number> = {};
  for (const p of PLUG_CATALOG.filter(p => !p.comingSoon)) {
    categories[p.category] = (categories[p.category] || 0) + 1;
  }

  return NextResponse.json({
    plugs: results,
    total: results.length,
    categories,
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const { plugId, instanceName, deliveryMode } = body;

  if (!plugId || !instanceName) {
    return NextResponse.json(
      { error: 'plugId and instanceName are required' },
      { status: 400 },
    );
  }

  const plug = PLUG_CATALOG.find(p => p.id === plugId);
  if (!plug) {
    return NextResponse.json({ error: 'Plug not found' }, { status: 404 });
  }

  // In production, this would call UEF Gateway's plug-deploy-engine
  const instanceId = crypto.randomUUID();

  return NextResponse.json({
    instanceId,
    plugId,
    name: instanceName,
    status: 'configuring',
    deliveryMode: deliveryMode || 'hosted',
    message: `Spinning up ${plug.name}...`,
    events: [
      { timestamp: new Date().toISOString(), stage: 'validate', message: `Validated plug "${plug.name}"` },
      { timestamp: new Date().toISOString(), stage: 'configure', message: 'Preparing configuration...' },
    ],
  });
}
