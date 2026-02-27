/**
 * Scrollytelling Report API — Retrieve research reports by ID
 *
 * GET /api/reports/[id]
 * Returns: the stored research report data
 *
 * POST /api/reports
 * Body: { idea, research, clonePlan, adaptationPlan, evidence }
 * Returns: { id } — saves and returns report ID
 *
 * Reports are stored in-memory for now (upgrade to Firebase later).
 */

import { NextRequest, NextResponse } from 'next/server';

// ── In-memory store (will be replaced with Firestore) ──
// Using a module-level Map — persists across requests in the same process
const reportStore = new Map<string, ReportData>();

interface ReportData {
  id: string;
  createdAt: string;
  idea: string;
  industry?: string;
  research: {
    facts: {
      productName: string;
      description: string;
      targetAudience: string;
      keyFeatures: string[];
      monetization: string[];
      techStack: string[];
      competitors: string[];
      differentiators: string[];
      sourceUrls: string[];
    };
    searchQueries: string[];
    totalSources: number;
  };
  clonePlan: {
    projectName: string;
    description: string;
    phases: Array<{
      name: string;
      tasks: string[];
      estimatedComplexity: string;
    }>;
    requiredServices: string[];
    recommendedStack: string[];
  };
  adaptationPlan: {
    uniqueAngle: string;
    differentiators: string[];
    targetNiche: string;
    brandSuggestions: string[];
    pricingStrategy: string;
    launchSteps: string[];
  };
  evidence: Array<{
    id: string;
    query: string;
    resultCount: number;
    sources: Array<{ title: string; url: string }>;
    timestamp: string;
  }>;
  validationSteps?: Array<{
    step: number;
    title: string;
    content: string;
  }>;
}

function generateId(): string {
  return `rpt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// POST — Save a new report
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.idea) {
      return NextResponse.json({ error: 'idea is required' }, { status: 400 });
    }

    const id = generateId();
    const report: ReportData = {
      id,
      createdAt: new Date().toISOString(),
      idea: body.idea,
      industry: body.industry,
      research: body.research,
      clonePlan: body.clonePlan,
      adaptationPlan: body.adaptationPlan,
      evidence: body.evidence || [],
      validationSteps: body.validationSteps,
    };

    reportStore.set(id, report);
    return NextResponse.json({ id, createdAt: report.createdAt });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to save report';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// GET — List recent reports (no ID param on this route)
export async function GET() {
  const reports = Array.from(reportStore.values())
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 20)
    .map(r => ({
      id: r.id,
      idea: r.idea,
      productName: r.research?.facts?.productName || r.idea,
      industry: r.industry,
      createdAt: r.createdAt,
      totalSources: r.research?.totalSources || 0,
    }));

  return NextResponse.json({ reports });
}
