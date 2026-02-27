/**
 * Per|Form Content News API
 * 
 * GET /api/perform/content/news    — Return the dynamic news feed for the ticker.
 * POST /api/perform/content/news   — Trigger the news update automation pipeline.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getLatestHeadlines, automateNewsHeadlines } from '@/lib/perform/news-service';

export async function GET() {
    try {
        const headlines = await getLatestHeadlines();

        // Fallback if no news in DB yet
        if (headlines.length === 0) {
            return NextResponse.json({
                headlines: [
                    'Breaking: Anthony Richardson requests trade from Colts',
                    'AGI Intelligence Engine: David Sanders Jr. signs NIL deal with Buckeyes',
                    'NCAA Transfer Portal: 25 new entries in last 12 hours',
                    '2026 Big Board: 5-star QB prospect Trevor Mitchell visits Ohio State',
                    'NFL Draft Sim: PFF data confirms trade rumors in top 5',
                    'NIL Update: Per|Form valuation estimates for Buckeyes 2025 class',
                ],
                type: 'mock'
            });
        }

        return NextResponse.json({
            headlines: headlines.map(h => h.title),
            type: 'live'
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { mode } = await req.json();

        if (mode === 'automate') {
            const results = await automateNewsHeadlines();
            return NextResponse.json({
                ok: true,
                count: results.length,
                message: 'News automation loop completed. Headlines updated.',
                headlines: results.map(h => h.title)
            });
        }

        return NextResponse.json({ error: 'invalid mode' }, { status: 400 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
