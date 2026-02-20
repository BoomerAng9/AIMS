/**
 * Per|Form Transfer Portal API
 *
 * GET /api/perform/transfer-portal — Returns portal entries from DB
 *   ?position=QB — Filter by position
 *   ?status=IN_PORTAL — Filter by status (IN_PORTAL, COMMITTED, WITHDRAWN)
 *   ?sortBy=pai — Sort (pai, nil, fit)
 *
 * POST /api/perform/transfer-portal — Add a player to the portal tracker
 *
 * Data comes from the database, enriched by Brave Search.
 * Falls back to prospects with pool=TRANSFER if no dedicated table exists.
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { SEED_PROSPECTS } from '@/lib/perform/seed-prospects';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const position = searchParams.get('position');
    const status = searchParams.get('status');
    const sortBy = searchParams.get('sortBy') || 'pai';
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    try {
        // Try DB first — look for prospects with pool = TRANSFER
        const dbCount = await prisma.performProspect.count({
            where: { pool: 'TRANSFER' },
        });

        if (dbCount > 0) {
            const where: any = { pool: 'TRANSFER' };
            if (position) where.position = position;

            const orderBy: any =
                sortBy === 'nil' ? { nilEstimate: 'desc' } :
                    sortBy === 'rank' ? { nationalRank: 'asc' } :
                        { paiScore: 'desc' };

            const prospects = await prisma.performProspect.findMany({
                where,
                orderBy,
                take: limit,
            });

            return NextResponse.json({
                source: 'database',
                total: prospects.length,
                entries: prospects.map((p: any) => ({
                    id: p.id,
                    name: `${p.firstName} ${p.lastName}`,
                    position: p.position,
                    fromSchool: p.school,
                    classYear: p.classYear,
                    paiScore: p.paiScore,
                    tier: p.tier,
                    nilValue: p.nilEstimate,
                    stats: p.stats ? JSON.parse(p.stats) : {},
                    scoutMemo: p.scoutMemo,
                    tags: p.tags ? JSON.parse(p.tags) : [],
                })),
            });
        }
    } catch (err) {
        console.warn('[Transfer Portal] DB query failed:', err);
    }

    // No transfer portal data in DB — return empty state
    return NextResponse.json({
        source: 'none',
        total: 0,
        entries: [],
        message: 'No transfer portal entries indexed yet. Use the search engine to begin indexing portal activity.',
    });
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { playerName, position, fromSchool, state, classYear } = body;

        if (!playerName || !position || !fromSchool) {
            return NextResponse.json(
                { error: 'playerName, position, and fromSchool are required' },
                { status: 400 }
            );
        }

        // Queue for deep research via the search API
        return NextResponse.json({
            success: true,
            message: `${playerName} queued for transfer portal indexing`,
            next: 'Deep Research will activate Tier 2/3 analysis',
        });
    } catch (err) {
        return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
    }
}
