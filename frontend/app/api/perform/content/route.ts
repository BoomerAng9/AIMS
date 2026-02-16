/**
 * Per|Form Content API
 *
 * GET /api/perform/content — Returns content feed (articles, podcasts, debates)
 *
 * Data source: War Room content pipeline (port 5003)
 * Falls back to curated editorial database when pipeline is offline.
 */

import { NextResponse } from 'next/server';

const WAR_ROOM_URL = process.env.WAR_ROOM_URL || 'http://localhost:5003';

const CONTENT = [
  {
    id: 'art-001',
    type: 'RANKING_UPDATE',
    title: 'February Big Board Shake-Up: 3 Risers, 2 Fallers',
    excerpt: 'Trevor Mitchell jumps 35 spots after dominant state semifinal performance. Meanwhile, two Blue Chip prospects see their stock slide after underwhelming combine numbers.',
    generatedBy: 'War Room Pipeline',
    generatedAt: '2026-02-15T08:00:00Z',
    readTimeMin: 4,
    tags: ['rankings', 'big-board', 'risers-fallers'],
  },
  {
    id: 'art-002',
    type: 'SCOUTING_REPORT',
    title: "Cameron Price: Inside the #1 Prospect's Film",
    excerpt: "Our SAM 2 video analysis breaks down 47 plays from Price's championship run. The data confirms what scouts already know — but reveals two areas of concern that nobody is talking about.",
    prospectName: 'Cameron Price',
    prospectId: 'ath-009',
    generatedBy: 'Lil_Bull_Hawk + Film Room',
    generatedAt: '2026-02-14T14:30:00Z',
    readTimeMin: 8,
    tags: ['scouting-report', 'film-analysis', 'QB'],
  },
  {
    id: 'art-003',
    type: 'DEBATE_RECAP',
    title: 'Bull vs Bear: Is Marcus Johnson Overrated?',
    excerpt: "Lil_Bull_Hawk argues Johnson's arm talent is generational. Lil_Bear_Hawk counters with schedule strength data. Chicken Hawk delivers the verdict — and adjusts the P.A.I. score.",
    prospectName: 'Marcus Johnson',
    prospectId: 'ath-001',
    generatedBy: 'Adversarial Pipeline',
    generatedAt: '2026-02-13T10:15:00Z',
    readTimeMin: 6,
    tags: ['debate', 'bull-vs-bear', 'QB'],
  },
  {
    id: 'art-004',
    type: 'BLOG',
    title: 'NIL in 2026: How P.A.I. Scores Drive Valuation',
    excerpt: "An athlete's P.A.I. score is now the #1 predictor of NIL earning potential. We break down the correlation between our grading system and real-world deal flow across 200+ athletes.",
    generatedBy: 'War Room Editorial',
    generatedAt: '2026-02-12T16:00:00Z',
    readTimeMin: 10,
    tags: ['nil', 'valuation', 'analysis'],
  },
  {
    id: 'art-005',
    type: 'SCOUTING_REPORT',
    title: 'Damien Brooks: The Edge Rusher Nobody Can Block',
    excerpt: "18 sacks. 32 QB hurries. 6 forced fumbles. Our adversarial analysis gives Brooks the highest pass-rush grade in Per|Form history. Here's the full breakdown.",
    prospectName: 'Damien Brooks',
    prospectId: 'ath-006',
    generatedBy: 'Lil_Bear_Hawk + Film Room',
    generatedAt: '2026-02-11T09:45:00Z',
    readTimeMin: 7,
    tags: ['scouting-report', 'edge-rusher', 'DE'],
  },
  {
    id: 'art-006',
    type: 'PODCAST',
    title: "The Per|Form Pod: Class of '26 QB Rankings Deep Dive",
    excerpt: 'We break down the top 5 QBs in the 2026 class. Where does Price separate from Johnson? Is there a sleeper QB climbing the board? Full adversarial analysis inside.',
    generatedBy: 'War Room + ElevenLabs',
    generatedAt: '2026-02-10T12:00:00Z',
    readTimeMin: 25,
    tags: ['podcast', 'QB-rankings', 'class-of-26'],
  },
  {
    id: 'art-007',
    type: 'RANKING_UPDATE',
    title: 'Position Rankings Drop: Top 10 Edge Rushers',
    excerpt: "Damien Brooks holds the #1 spot but a new contender from Georgia is making noise. Full positional breakdown with P.A.I. comparisons and NIL estimates.",
    generatedBy: 'War Room Pipeline',
    generatedAt: '2026-02-09T08:00:00Z',
    readTimeMin: 5,
    tags: ['rankings', 'position-rankings', 'DE'],
  },
  {
    id: 'art-008',
    type: 'DEBATE_RECAP',
    title: 'The Xavier Coleman Debate: Boom or Bust?',
    excerpt: 'Our most contentious debate yet. Lil_Bull_Hawk sees a future All-American. Lil_Bear_Hawk sees a transfer with 18 catches. The verdict surprised everyone.',
    prospectName: 'Xavier Coleman',
    prospectId: 'ath-010',
    generatedBy: 'Adversarial Pipeline',
    generatedAt: '2026-02-08T11:30:00Z',
    readTimeMin: 6,
    tags: ['debate', 'bull-vs-bear', 'WR', 'developmental'],
  },
];

export async function GET() {
  // Try live War Room first
  try {
    const res = await fetch(`${WAR_ROOM_URL}/content`, {
      signal: AbortSignal.timeout(2000)
    });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch {
    // War Room offline — fall through
  }

  return NextResponse.json(CONTENT);
}
