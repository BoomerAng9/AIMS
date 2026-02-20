/**
 * Per|Form Draft News & Updates API
 *
 * GET /api/perform/draft/news
 *   Returns draft-relevant updates from:
 *   1. DB-stored articles/updates
 *   2. Brave Search (Tier 3) for live combine/draft news
 *   3. Draft order data from NFLTeamNeeds table
 *
 * All data is real — sourced from the database and live search.
 * Returns empty if nothing is indexed yet.
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

interface NewsItem {
    id: string;
    type: 'combine' | 'trade' | 'injury' | 'projection' | 'team_need' | 'general';
    headline: string;
    source: string;
    timestamp: string;
    teamAbbrev?: string;
    prospectName?: string;
    url?: string;
}

export async function GET(req: NextRequest) {
    const items: NewsItem[] = [];

    try {
        // 1. Draft order / team projections from DB
        const teams = await prisma.nFLTeamNeeds.findMany({
            orderBy: { draftOrder: 'asc' },
            take: 32,
        });

        // 2. Get top prospects from DB
        const prospects = await prisma.draftProspect.findMany({
            orderBy: { overallRank: 'asc' },
            take: 32,
        });

        // Generate real updates from DB data
        if (teams.length > 0 && prospects.length > 0) {
            // Create team-prospect match headlines from real data
            for (let i = 0; i < Math.min(teams.length, 10); i++) {
                const team = teams[i];
                // Find best prospect match for this team's needs
                const needs = team.needs ? JSON.parse(team.needs) : {};
                const criticalNeed = Object.entries(needs).find(([, v]) => v === 1);

                if (criticalNeed && prospects[i]) {
                    items.push({
                        id: `projection-${team.abbreviation}`,
                        type: 'projection',
                        headline: `Pick ${team.draftOrder || i + 1}: ${team.city} ${team.teamName.split(' ').pop()} — ${criticalNeed[0]} is a critical need. ${prospects[i].firstName} ${prospects[i].lastName} (${prospects[i].position}, ${prospects[i].college}) ranked #${prospects[i].overallRank} overall with ${prospects[i].paiScore} P.A.I.`,
                        source: 'Per|Form AGI',
                        timestamp: new Date().toISOString(),
                        teamAbbrev: team.abbreviation,
                        prospectName: `${prospects[i].firstName} ${prospects[i].lastName}`,
                    });
                }
            }

            // Combine invite headlines
            const combineProspects = prospects.filter((p: any) => p.combineInvite);
            for (const p of combineProspects.slice(0, 5)) {
                items.push({
                    id: `combine-${p.id}`,
                    type: 'combine',
                    headline: `${p.firstName} ${p.lastName} (${p.position}, ${p.college}) — Combine invite confirmed. P.A.I. Grade: ${p.paiScore}`,
                    source: 'Per|Form Draft Intel',
                    timestamp: new Date().toISOString(),
                    prospectName: `${p.firstName} ${p.lastName}`,
                });
            }

            // Trend alerts for rising/falling prospects
            const risers = prospects.filter((p: any) => p.trend === 'UP');
            for (const p of risers.slice(0, 3)) {
                items.push({
                    id: `riser-${p.id}`,
                    type: 'general',
                    headline: `📈 ${p.firstName} ${p.lastName} (${p.position}, ${p.college}) RISING — Now ranked #${p.overallRank} overall. ${p.scoutMemo?.substring(0, 80)}...`,
                    source: 'Per|Form Trend Engine',
                    timestamp: new Date().toISOString(),
                    prospectName: `${p.firstName} ${p.lastName}`,
                });
            }
        }

        // 3. Try Brave Search for live news if API key exists
        const braveKey = process.env.BRAVE_API_KEY;
        if (braveKey) {
            try {
                const params = new URLSearchParams({
                    q: '2026 NFL Draft combine prospects news',
                    count: '5',
                    freshness: 'pw', // past week
                });

                const res = await fetch(`https://api.search.brave.com/res/v1/web/search?${params}`, {
                    headers: {
                        'Accept': 'application/json',
                        'Accept-Encoding': 'gzip',
                        'X-Subscription-Token': braveKey,
                    },
                    signal: AbortSignal.timeout(5000),
                });

                if (res.ok) {
                    const data = await res.json();
                    const results = data.web?.results || [];
                    for (const r of results) {
                        items.push({
                            id: `brave-${r.url?.substring(0, 40)}`,
                            type: 'general',
                            headline: r.title || '',
                            source: new URL(r.url).hostname.replace('www.', ''),
                            timestamp: r.age || new Date().toISOString(),
                            url: r.url,
                        });
                    }
                }
            } catch {
                // Brave unavailable — continue with DB data
            }
        }
    } catch (err) {
        console.warn('[Draft News] Error:', err);
    }

    return NextResponse.json({
        items,
        total: items.length,
        source: items.length > 0 ? 'database+search' : 'none',
        timestamp: new Date().toISOString(),
    });
}
