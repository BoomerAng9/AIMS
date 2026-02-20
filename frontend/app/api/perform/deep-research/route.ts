/**
 * Per|Form Deep Research Activation Endpoint
 *
 * POST /api/perform/deep-research
 *
 * Activates Tier 2 (DeepMind) and Tier 3 (Brave) research on a specific
 * player. Used by the State Boards "Submit a Prospect" form and the
 * prospect detail page's "Activate Deep Research" button.
 *
 * Request body:
 *   { playerName, position, school, state, stats?, maxprepsUrl? }
 *
 * Returns job ID and status for polling.
 */

import { NextRequest, NextResponse } from 'next/server';

interface DeepResearchRequest {
    playerName: string;
    position: string;
    school: string;
    state: string;
    stats?: string;
    maxprepsUrl?: string;
    classYear?: string;
}

interface ResearchJob {
    jobId: string;
    status: 'QUEUED' | 'TIER2_ACTIVE' | 'TIER3_ACTIVE' | 'COMPLETE' | 'FAILED';
    playerName: string;
    estimatedSeconds: number;
    tier2: {
        status: string;
        model: string;
        progress: number;
    };
    tier3: {
        status: string;
        sourcesFound: number;
        localResults: number;
    };
    createdAt: string;
}

// In-memory job store (in production: Redis or DB)
const jobStore = new Map<string, ResearchJob>();

function generateJobId(): string {
    return `dr-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

export async function POST(req: NextRequest) {
    try {
        const body: DeepResearchRequest = await req.json();
        const { playerName, position, school, state, stats, maxprepsUrl, classYear } = body;

        if (!playerName || !position || !school || !state) {
            return NextResponse.json(
                { error: 'playerName, position, school, and state are required' },
                { status: 400 }
            );
        }

        const jobId = generateJobId();
        const job: ResearchJob = {
            jobId,
            status: 'QUEUED',
            playerName,
            estimatedSeconds: 45 + Math.floor(Math.random() * 30),
            tier2: {
                status: 'PENDING',
                model: 'gemini-2.5-pro-preview',
                progress: 0,
            },
            tier3: {
                status: 'PENDING',
                sourcesFound: 0,
                localResults: 0,
            },
            createdAt: new Date().toISOString(),
        };

        jobStore.set(jobId, job);

        // Simulate async research activation
        // In production, this triggers a background worker
        simulateResearch(jobId, body);

        return NextResponse.json({
            success: true,
            jobId,
            message: `Deep Research activated for ${playerName} — ${position} at ${school} (${state})`,
            estimatedCompletion: `${job.estimatedSeconds}s`,
            pollingUrl: `/api/perform/deep-research?jobId=${jobId}`,
        });
    } catch (err) {
        console.error('[Deep Research] Error:', err);
        return NextResponse.json({ error: 'Failed to queue research job' }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
        // Return all recent jobs
        const jobs = Array.from(jobStore.values())
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 20);
        return NextResponse.json({ jobs, total: jobStore.size });
    }

    const job = jobStore.get(jobId);
    if (!job) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json(job);
}

// ── Simulation (replaced by real worker in production) ──────
async function simulateResearch(jobId: string, _request: DeepResearchRequest) {
    const job = jobStore.get(jobId);
    if (!job) return;

    // Phase 1: Tier 2 starts
    setTimeout(() => {
        const j = jobStore.get(jobId);
        if (j) {
            j.status = 'TIER2_ACTIVE';
            j.tier2.status = 'PROCESSING';
            j.tier2.progress = 25;
        }
    }, 2000);

    // Phase 2: Tier 2 mid-progress
    setTimeout(() => {
        const j = jobStore.get(jobId);
        if (j) {
            j.tier2.progress = 60;
        }
    }, 5000);

    // Phase 3: Tier 2 complete, Tier 3 starts
    setTimeout(() => {
        const j = jobStore.get(jobId);
        if (j) {
            j.tier2.status = 'COMPLETE';
            j.tier2.progress = 100;
            j.status = 'TIER3_ACTIVE';
            j.tier3.status = 'CRAWLING';
            j.tier3.sourcesFound = 3;
        }
    }, 8000);

    // Phase 4: Tier 3 finding sources
    setTimeout(() => {
        const j = jobStore.get(jobId);
        if (j) {
            j.tier3.sourcesFound = 7;
            j.tier3.localResults = 4;
        }
    }, 12000);

    // Phase 5: Complete
    setTimeout(() => {
        const j = jobStore.get(jobId);
        if (j) {
            j.status = 'COMPLETE';
            j.tier3.status = 'COMPLETE';
            j.tier3.sourcesFound = 12;
            j.tier3.localResults = 8;
        }
    }, 15000);
}
