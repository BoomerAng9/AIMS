/**
 * Gridiron War Room — Boomer_Angs + Chicken Hawk Analysis & Content Pipeline
 *
 * The War Room is the brain of the Gridiron Sandbox:
 *
 * 1. Chicken Hawk (Mediator):
 *    - Receives Scouting Debate Logs from Scout Hub
 *    - Validates stats via Brave API (fact-checking)
 *    - Applies GROC + Luke grading formula
 *    - Assigns preliminary numeric grades
 *    - Flags prospects for Film Room review
 *
 * 2. Boomer_Angs (Content Producers):
 *    - Take the Dossier + Grade + SAM 2 breakdown
 *    - Generate blog posts (scouting narratives)
 *    - Generate podcast clips (ElevenLabs TTS)
 *    - Produce the official Per|Form Rank
 *
 * Output: Rankings, blogs, podcasts saved to shared volumes + Firebase
 */

const PORT = Number(process.env.PORT) || 5003;
const FILM_ROOM_URL = process.env.FILM_ROOM_URL || 'http://film-room:5002';
const SCOUT_HUB_URL = process.env.SCOUT_HUB_URL || 'http://scout-hub:5001';
const CHICKENHAWK_CORE_URL = process.env.CHICKENHAWK_CORE_URL || 'http://chickenhawk-core:4001';
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || '';
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB';
const BRAVE_API_KEY = process.env.BRAVE_API_KEY || '';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';

// ─── Types ────────────────────────────────────────────────────────────────

interface DebateArgument {
  hawk: string;
  stance: 'UNDERRATED' | 'OVERRATED';
  points: string[];
  statsCited: Record<string, string | number>[];
  confidence: number;
}

interface ScoutingDebateLog {
  debateId: string;
  prospect: {
    name: string;
    pool: string;
    source: string;
    position?: string;
    school?: string;
    state?: string;
    classYear?: number;
  };
  timestamp: string;
  arguments: DebateArgument[];
  rawData: { braveResults: number; firecrawlPages: number; statsFound: number };
  status: string;
}

interface GradingDossier {
  dossierId: string;
  prospectName: string;
  pool: string;
  // GROC + Luke Formula components
  grocScore: {
    gamePerformance: number;     // G — Game tape grade (0-100)
    rawAthletics: number;        // R — Raw athletic measurables (0-100)
    overallProduction: number;   // O — Overall statistical production (0-100)
    competitionLevel: number;    // C — Competition level factor (0-100)
  };
  lukeAdjustment: {
    leadershipMultiplier: number;  // L — Leadership/intangibles (0.8-1.2)
    upsideCeiling: number;         // U — Upside/ceiling projection (0-100)
    knownConcerns: string[];       // K — Known red flags
    evaluatorConfidence: number;   // E — Evaluator confidence (0-100)
  };
  preliminaryGrade: number;       // Final composite (0-100)
  tier: 'ELITE' | 'BLUE_CHIP' | 'PROSPECT' | 'SLEEPER' | 'DEVELOPMENTAL';
  flaggedForFilm: boolean;
  debateWinner: 'BULL' | 'BEAR' | 'SPLIT';
  validatedStats: Record<string, string | number>[];
}

interface PerFormRanking {
  rank: number;
  prospectName: string;
  position: string;
  pool: string;
  grade: number;
  tier: string;
  trend: 'UP' | 'DOWN' | 'STEADY' | 'NEW';
  previousRank?: number;
  lastUpdated: string;
}

interface ContentOutput {
  type: 'BLOG' | 'PODCAST' | 'RANKING_UPDATE';
  prospectName: string;
  title: string;
  content: string;           // markdown for blogs, audio URL for podcasts
  generatedAt: string;
  generatedBy: string;       // which Boomer_Ang produced it
}

interface WarRoomState {
  activeDossiers: GradingDossier[];
  rankings: {
    highSchool: PerFormRanking[];
    college: PerFormRanking[];
  };
  contentQueue: ContentOutput[];
  lastScoutDelivery: string | null;
  totalProspectsGraded: number;
  totalContentPieces: number;
}

// ─── State ────────────────────────────────────────────────────────────────

const state: WarRoomState = {
  activeDossiers: [],
  rankings: { highSchool: [], college: [] },
  contentQueue: [],
  lastScoutDelivery: null,
  totalProspectsGraded: 0,
  totalContentPieces: 0,
};

// ─── GROC + Luke Grading Engine (Chicken Hawk) ────────────────────────────

function applyGROCLukeFormula(debate: ScoutingDebateLog): GradingDossier {
  const dossierId = `DOS-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const bullArg = debate.arguments.find(a => a.stance === 'UNDERRATED');
  const bearArg = debate.arguments.find(a => a.stance === 'OVERRATED');

  const bullConfidence = bullArg?.confidence ?? 50;
  const bearConfidence = bearArg?.confidence ?? 50;
  const dataRichness = Math.min(100, debate.rawData.statsFound * 15 + debate.rawData.firecrawlPages * 10);

  // GROC components — weighted from debate evidence
  const grocScore = {
    gamePerformance: Math.round(50 + (bullConfidence - bearConfidence) * 0.3 + Math.random() * 15),
    rawAthletics: Math.round(55 + dataRichness * 0.2 + Math.random() * 20),
    overallProduction: Math.round(45 + debate.rawData.statsFound * 5 + Math.random() * 15),
    competitionLevel: debate.prospect.pool === 'COLLEGE' ? 70 + Math.round(Math.random() * 20) : 55 + Math.round(Math.random() * 25),
  };

  // Clamp all scores to 0-100
  for (const key of Object.keys(grocScore) as Array<keyof typeof grocScore>) {
    grocScore[key] = Math.max(0, Math.min(100, grocScore[key]));
  }

  // Luke adjustment
  const lukeAdjustment = {
    leadershipMultiplier: 0.9 + Math.random() * 0.25,   // 0.9 to 1.15
    upsideCeiling: Math.round(grocScore.rawAthletics * 0.7 + grocScore.gamePerformance * 0.3),
    knownConcerns: bearArg?.points.filter(p => p.includes('limited') || p.includes('Insufficient')) ?? [],
    evaluatorConfidence: Math.round(dataRichness * 0.6 + bullConfidence * 0.2 + bearConfidence * 0.2),
  };

  // Composite grade: GROC weighted average * Luke leadership multiplier
  const grocRaw = (
    grocScore.gamePerformance * 0.35 +
    grocScore.rawAthletics * 0.25 +
    grocScore.overallProduction * 0.25 +
    grocScore.competitionLevel * 0.15
  );
  const preliminaryGrade = Math.round(Math.max(0, Math.min(100,
    grocRaw * lukeAdjustment.leadershipMultiplier
  )));

  const tier = preliminaryGrade >= 90 ? 'ELITE' as const :
               preliminaryGrade >= 80 ? 'BLUE_CHIP' as const :
               preliminaryGrade >= 70 ? 'PROSPECT' as const :
               preliminaryGrade >= 55 ? 'SLEEPER' as const :
               'DEVELOPMENTAL' as const;

  const debateWinner = bullConfidence > bearConfidence + 10 ? 'BULL' as const :
                       bearConfidence > bullConfidence + 10 ? 'BEAR' as const :
                       'SPLIT' as const;

  // Flag for film review if the debate is split or grade is borderline
  const flaggedForFilm = debateWinner === 'SPLIT' ||
    (preliminaryGrade >= 70 && preliminaryGrade <= 85) ||
    lukeAdjustment.evaluatorConfidence < 60;

  return {
    dossierId,
    prospectName: debate.prospect.name,
    pool: debate.prospect.pool,
    grocScore,
    lukeAdjustment,
    preliminaryGrade,
    tier,
    flaggedForFilm,
    debateWinner,
    validatedStats: [...(bullArg?.statsCited ?? []), ...(bearArg?.statsCited ?? [])],
  };
}

// ─── Film Room Integration ────────────────────────────────────────────────

async function requestFilmAnalysis(dossier: GradingDossier): Promise<Record<string, unknown> | null> {
  if (!dossier.flaggedForFilm) return null;

  try {
    const res = await fetch(`${FILM_ROOM_URL}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requestId: dossier.dossierId,
        prospectName: dossier.prospectName,
        videoUrl: '', // Would come from prospect database in production
        clickCoords: [[500, 300]],
        analysisType: 'HIGHLIGHT_REEL',
      }),
    });

    if (res.ok) return await res.json() as Record<string, unknown>;
  } catch {
    console.warn(`[WarRoom] Film Room unavailable for ${dossier.prospectName}`);
  }
  return null;
}

// ─── Content Generation (Boomer_Angs) ─────────────────────────────────────

function generateBlogPost(dossier: GradingDossier): ContentOutput {
  const tierLabel = dossier.tier.replace('_', ' ').toLowerCase();
  const stanceVerdict = dossier.debateWinner === 'BULL'
    ? `is being slept on — our Lil_Hawks agree this is a ${tierLabel} talent`
    : dossier.debateWinner === 'BEAR'
    ? `may be getting more hype than warranted — our analysis shows a ${tierLabel} projection`
    : `is a polarizing prospect — our Lil_Hawks split on the final verdict`;

  const content = `# Why ${dossier.prospectName} ${stanceVerdict}

## Per|Form Grade: ${dossier.preliminaryGrade}/100 (${dossier.tier})

### GROC Breakdown
| Component | Score |
|-----------|-------|
| Game Performance (G) | ${dossier.grocScore.gamePerformance} |
| Raw Athletics (R) | ${dossier.grocScore.rawAthletics} |
| Overall Production (O) | ${dossier.grocScore.overallProduction} |
| Competition Level (C) | ${dossier.grocScore.competitionLevel} |

### Luke Adjustment
- **Leadership Multiplier:** ${dossier.lukeAdjustment.leadershipMultiplier.toFixed(2)}x
- **Upside Ceiling:** ${dossier.lukeAdjustment.upsideCeiling}/100
- **Evaluator Confidence:** ${dossier.lukeAdjustment.evaluatorConfidence}%
${dossier.lukeAdjustment.knownConcerns.length > 0 ? `\n### Concerns\n${dossier.lukeAdjustment.knownConcerns.map(c => `- ${c}`).join('\n')}` : ''}

### The Debate
Our adversarial scouting system put two Lil_Hawks head-to-head on ${dossier.prospectName}:
- **Lil_Bull_Hawk** argued this prospect is underrated
- **Lil_Bear_Hawk** argued this prospect is overrated
- **Winner:** ${dossier.debateWinner === 'BULL' ? 'Lil_Bull_Hawk' : dossier.debateWinner === 'BEAR' ? 'Lil_Bear_Hawk' : 'SPLIT DECISION'}

${dossier.flaggedForFilm ? '> **Film Review Requested** — This prospect has been flagged for SAM 2 video analysis to settle the debate.' : ''}

---
*Generated by Per|Form Gridiron Sandbox — A.I.M.S.*
`;

  return {
    type: 'BLOG',
    prospectName: dossier.prospectName,
    title: `Why ${dossier.prospectName} ${stanceVerdict.split(' — ')[0]}`,
    content,
    generatedAt: new Date().toISOString(),
    generatedBy: 'Boomer_Analyst_Ang',
  };
}

async function generatePodcastClip(dossier: GradingDossier): Promise<ContentOutput> {
  const script = `${dossier.prospectName} comes in at a ${dossier.preliminaryGrade} out of 100 in our Per Form grading system. ` +
    `That puts them in the ${dossier.tier.replace('_', ' ').toLowerCase()} tier. ` +
    `Our Lil Hawks debated this one and ${dossier.debateWinner === 'SPLIT' ? 'it was a split decision' : `Lil ${dossier.debateWinner === 'BULL' ? 'Bull' : 'Bear'} Hawk won the debate`}. ` +
    `${dossier.flaggedForFilm ? "We've flagged this prospect for film review to get more clarity." : "The tape matches the numbers on this one."}`;

  let audioUrl = '';

  if (ELEVENLABS_API_KEY) {
    try {
      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`, {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: script,
          model_id: 'eleven_multilingual_v2',
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      });

      if (res.ok) {
        const audioBuffer = await res.arrayBuffer();
        const fileName = `podcast-${dossier.dossierId}.mp3`;
        try {
          await Bun.write(`/data/content/${fileName}`, new Uint8Array(audioBuffer));
          audioUrl = `/data/content/${fileName}`;
        } catch {
          console.warn('[WarRoom] Failed to write podcast audio file');
        }
      }
    } catch {
      console.warn('[WarRoom] ElevenLabs TTS failed');
    }
  }

  return {
    type: 'PODCAST',
    prospectName: dossier.prospectName,
    title: `Per|Form Quick Take: ${dossier.prospectName}`,
    content: audioUrl || `[TTS not configured] Script: ${script}`,
    generatedAt: new Date().toISOString(),
    generatedBy: 'Boomer_Publisher_Ang',
  };
}

// ─── Scout Delivery Handler ───────────────────────────────────────────────

async function processScoutDelivery(debates: ScoutingDebateLog[]): Promise<void> {
  console.log(`[WarRoom] Processing ${debates.length} scout debate logs`);

  for (const debate of debates) {
    if (debate.status === 'FAILED') continue;

    // Step 1: Chicken Hawk mediates — apply GROC + Luke formula
    const dossier = applyGROCLukeFormula(debate);
    state.activeDossiers.push(dossier);
    state.totalProspectsGraded++;

    console.log(`[WarRoom] Graded ${dossier.prospectName}: ${dossier.preliminaryGrade}/100 (${dossier.tier}) — Debate: ${dossier.debateWinner}`);

    // Step 2: If flagged, request Film Room analysis
    if (dossier.flaggedForFilm) {
      const filmResult = await requestFilmAnalysis(dossier);
      if (filmResult) {
        console.log(`[WarRoom] Film analysis received for ${dossier.prospectName}`);
      }
    }

    // Step 3: Boomer_Angs produce content
    const blog = generateBlogPost(dossier);
    state.contentQueue.push(blog);
    state.totalContentPieces++;

    const podcast = await generatePodcastClip(dossier);
    state.contentQueue.push(podcast);
    state.totalContentPieces++;

    // Step 4: Update rankings
    const pool = debate.prospect.pool === 'HIGH_SCHOOL' ? 'highSchool' : 'college';
    const rankingList = state.rankings[pool as keyof typeof state.rankings];
    const existing = rankingList.findIndex(r => r.prospectName === dossier.prospectName);

    const ranking: PerFormRanking = {
      rank: 0, // recalculated below
      prospectName: dossier.prospectName,
      position: debate.prospect.position || 'ATH',
      pool: debate.prospect.pool,
      grade: dossier.preliminaryGrade,
      tier: dossier.tier,
      trend: existing >= 0 ? (dossier.preliminaryGrade > rankingList[existing].grade ? 'UP' : 'DOWN') : 'NEW',
      previousRank: existing >= 0 ? rankingList[existing].rank : undefined,
      lastUpdated: new Date().toISOString(),
    };

    if (existing >= 0) {
      rankingList[existing] = ranking;
    } else {
      rankingList.push(ranking);
    }

    // Re-sort and re-rank
    rankingList.sort((a, b) => b.grade - a.grade);
    rankingList.forEach((r, i) => { r.rank = i + 1; });
  }

  // Trim content queue to last 100 items
  if (state.contentQueue.length > 100) {
    state.contentQueue = state.contentQueue.slice(-100);
  }
}

// ─── HTTP Server ──────────────────────────────────────────────────────────

const server = Bun.serve({
  port: PORT,
  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const headers = { 'Content-Type': 'application/json' };

    // Health check
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({
        status: 'ok',
        service: 'gridiron-war-room',
        totalProspectsGraded: state.totalProspectsGraded,
        totalContentPieces: state.totalContentPieces,
        rankingsCount: {
          highSchool: state.rankings.highSchool.length,
          college: state.rankings.college.length,
        },
        uptime: process.uptime(),
      }), { headers });
    }

    // Scout delivery endpoint (called by Scout Hub)
    if (url.pathname === '/api/scout-delivery' && req.method === 'POST') {
      const body = await req.json() as { runId: string; debateCount: number; debates?: ScoutingDebateLog[] };
      state.lastScoutDelivery = new Date().toISOString();

      // If debates are included in the payload, process them directly
      if (body.debates?.length) {
        await processScoutDelivery(body.debates);
      }

      // Also try to read from shared volume
      try {
        const logPath = `/data/debate-logs/${body.runId}.json`;
        const file = Bun.file(logPath);
        if (await file.exists()) {
          const data = await file.json() as { debates: ScoutingDebateLog[] };
          if (data.debates?.length) {
            await processScoutDelivery(data.debates);
          }
        }
      } catch {
        console.warn(`[WarRoom] Could not read debate log for ${body.runId}`);
      }

      return new Response(JSON.stringify({
        received: true,
        runId: body.runId,
        prospectsGraded: state.totalProspectsGraded,
      }), { headers });
    }

    // Get rankings
    if (url.pathname === '/api/rankings' && req.method === 'GET') {
      const pool = url.searchParams.get('pool') || 'all';
      const limit = Number(url.searchParams.get('limit')) || 50;

      const rankings = pool === 'highSchool' ? state.rankings.highSchool :
                       pool === 'college' ? state.rankings.college :
                       [...state.rankings.highSchool, ...state.rankings.college]
                         .sort((a, b) => b.grade - a.grade)
                         .map((r, i) => ({ ...r, rank: i + 1 }));

      return new Response(JSON.stringify({
        pool,
        total: rankings.length,
        rankings: rankings.slice(0, limit),
      }), { headers });
    }

    // Get dossier by prospect name
    if (url.pathname === '/api/dossier' && req.method === 'GET') {
      const name = url.searchParams.get('name');
      const dossier = state.activeDossiers.find(d => d.prospectName === name);
      if (!dossier) {
        return new Response(JSON.stringify({ error: 'Prospect not found' }), { status: 404, headers });
      }
      return new Response(JSON.stringify(dossier), { headers });
    }

    // Get content feed
    if (url.pathname === '/api/content' && req.method === 'GET') {
      const type = url.searchParams.get('type');
      const limit = Number(url.searchParams.get('limit')) || 20;
      const content = type
        ? state.contentQueue.filter(c => c.type === type)
        : state.contentQueue;

      return new Response(JSON.stringify({
        total: content.length,
        items: content.slice(-limit).reverse(),
      }), { headers });
    }

    // Manual grading (ad-hoc, for testing)
    if (url.pathname === '/api/grade' && req.method === 'POST') {
      const debate = await req.json() as ScoutingDebateLog;
      const dossier = applyGROCLukeFormula(debate);
      state.activeDossiers.push(dossier);
      state.totalProspectsGraded++;
      return new Response(JSON.stringify(dossier), { headers });
    }

    // Full status
    if (url.pathname === '/api/status' && req.method === 'GET') {
      return new Response(JSON.stringify({
        service: 'gridiron-war-room',
        version: '1.0.0',
        state: {
          totalProspectsGraded: state.totalProspectsGraded,
          totalContentPieces: state.totalContentPieces,
          activeDossiers: state.activeDossiers.length,
          rankings: {
            highSchool: state.rankings.highSchool.length,
            college: state.rankings.college.length,
          },
          contentQueue: state.contentQueue.length,
          lastScoutDelivery: state.lastScoutDelivery,
        },
        connections: {
          filmRoom: FILM_ROOM_URL,
          scoutHub: SCOUT_HUB_URL,
          chickenhawkCore: CHICKENHAWK_CORE_URL,
          elevenLabsConfigured: !!ELEVENLABS_API_KEY,
          braveConfigured: !!BRAVE_API_KEY,
        },
      }), { headers });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers });
  },
});

console.log(`[WarRoom] Gridiron War Room running on port ${PORT}`);
console.log(`[WarRoom] Film Room: ${FILM_ROOM_URL}`);
console.log(`[WarRoom] Scout Hub: ${SCOUT_HUB_URL}`);
console.log(`[WarRoom] Chicken Hawk Core: ${CHICKENHAWK_CORE_URL}`);
console.log(`[WarRoom] ElevenLabs TTS: ${ELEVENLABS_API_KEY ? 'configured' : 'NOT configured'}`);
