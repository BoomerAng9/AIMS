/**
 * ScoutVerify Engine
 *
 * Automated verification of prospect evaluations against evidence.
 * Uses Twelve Labs Pegasus for video analysis and claim extraction,
 * then cross-references against available stats data.
 *
 * Pipeline:
 *   1. Index video via Twelve Labs (if not already indexed)
 *   2. Extract claims from highlight reel via Pegasus
 *   3. Detect highlight bias (cherry-picking, editing tricks)
 *   4. Cross-reference claims against stats (stub for now)
 *   5. Generate ScoutVerify report with confidence scoring
 */

import { v4 as uuidv4 } from 'uuid';
import logger from '../../logger';
import { getTwelveLabsClient } from '../../twelve-labs';
import type {
  ScoutVerifyInput,
  ScoutVerifyReport,
  ExtractedClaim,
  HighlightBiasReport,
  HypeAnalysis,
} from './types';

// ---------------------------------------------------------------------------
// Prompts for Pegasus
// ---------------------------------------------------------------------------

const CLAIM_EXTRACTION_PROMPT = `Analyze this sports highlight reel or game film. List all performance claims — both explicit (stated in commentary/overlay text) and implied (shown through selective play inclusion).

For each claim, provide:
1. The claim itself (e.g., "fastest player in the conference")
2. The category: stat, skill, comparison, ranking, or physical
3. The timestamp where the claim appears or is demonstrated

Also note any plays that seem specifically chosen to exaggerate ability. Be objective and analytical.

Format as a structured list.`;

const BIAS_DETECTION_PROMPT = `Analyze this highlight reel for selection bias and editing manipulation.

Evaluate:
1. Approximate number of unique plays shown
2. Are only successful/positive plays included? Any drops, misreads, or negative plays?
3. Any editing that exaggerates speed or athleticism (slow-mo on highlights but normal speed on others)?
4. Any selective camera angles that hide weaknesses?
5. Does the reel represent a fair sample of the player's performance?

Provide your assessment with specific examples and timestamps.`;

const SCOUTING_REPORT_PROMPT = `Generate a professional scouting report from this game film/highlight reel.

Structure the report as:
1. OVERVIEW: One paragraph summary of the player
2. STRENGTHS: 3-5 key strengths with specific play examples
3. AREAS FOR IMPROVEMENT: 2-3 areas needing development
4. BULL CASE: Best-case projection (what this player could become)
5. BEAR CASE: Risk factors and downside scenarios
6. VERDICT: Overall assessment and confidence level

Use specific timestamps and plays as evidence. Be balanced — avoid pure hype.`;

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export async function runScoutVerify(input: ScoutVerifyInput): Promise<ScoutVerifyReport> {
  const startTime = Date.now();
  const reportId = `sv-${uuidv4().slice(0, 8)}`;

  logger.info({ input, reportId }, '[ScoutVerify] Starting verification pipeline');

  const client = getTwelveLabsClient();

  // If Twelve Labs is available and we have a video, run the full pipeline
  if (client && (input.videoId || input.videoUrl)) {
    return runFullPipeline(client, input, reportId, startTime);
  }

  // Otherwise, return a scaffold report indicating what's needed
  logger.info('[ScoutVerify] Running in offline mode (no Twelve Labs client or video)');
  return buildOfflineReport(input, reportId, startTime);
}

async function runFullPipeline(
  client: ReturnType<typeof getTwelveLabsClient> & object,
  input: ScoutVerifyInput,
  reportId: string,
  startTime: number
): Promise<ScoutVerifyReport> {
  let videoId = input.videoId;

  // Step 1: Index video if only URL provided
  if (!videoId && input.videoUrl) {
    logger.info({ url: input.videoUrl }, '[ScoutVerify] Indexing video via Twelve Labs');
    try {
      const indexes = await client.listIndexes();
      let performIndex = indexes.data.find((i: { name: string }) => i.name === 'perform-game-film');
      if (!performIndex) {
        performIndex = await client.createIndex('perform-game-film');
      }
      const task = await client.indexVideoByUrl(performIndex.id, input.videoUrl, {
        prospect: input.prospectName,
        position: input.position || 'ATH',
      });
      const completed = await client.waitForTask(task.id);
      videoId = completed.videoId;
    } catch (err) {
      logger.error({ err }, '[ScoutVerify] Video indexing failed');
    }
  }

  // Step 2-4: Extract claims, detect bias, generate report
  let claims: ExtractedClaim[] = [];
  let highlightBias = defaultBiasReport();
  let scoutingReport: string | undefined;
  let bullCase: string | undefined;
  let bearCase: string | undefined;

  if (videoId) {
    try {
      // Run Pegasus analysis in parallel
      const [claimResult, biasResult, scoutResult] = await Promise.allSettled([
        client.generate(videoId, CLAIM_EXTRACTION_PROMPT),
        client.generate(videoId, BIAS_DETECTION_PROMPT),
        client.generate(videoId, SCOUTING_REPORT_PROMPT),
      ]);

      if (claimResult.status === 'fulfilled') {
        claims = parseClaims(claimResult.value.text);
      }
      if (biasResult.status === 'fulfilled') {
        highlightBias = parseBiasReport(biasResult.value.text);
      }
      if (scoutResult.status === 'fulfilled') {
        const report = scoutResult.value.text;
        scoutingReport = report;
        bullCase = extractSection(report, 'BULL CASE');
        bearCase = extractSection(report, 'BEAR CASE');
      }
    } catch (err) {
      logger.error({ err }, '[ScoutVerify] Pegasus analysis error');
    }
  }

  // Step 5: Calculate confidence scores
  const verifiedCount = claims.filter(c => c.verified === true).length;
  const totalClaims = claims.length || 1;
  const paiConfidence = Math.round((verifiedCount / totalClaims) * 100);
  const overallVerificationScore = Math.round(
    (paiConfidence * 0.4) + ((100 - highlightBias.biasScore) * 0.3) + (50 * 0.3)
  );

  return {
    reportId,
    prospectName: input.prospectName,
    position: input.position,
    school: input.school,
    generatedAt: new Date().toISOString(),
    claims,
    highlightBias,
    hypeAnalysis: buildHypeAnalysis(claims),
    paiConfidence,
    overallVerificationScore,
    scoutingReport,
    bullCase,
    bearCase,
    videosAnalyzed: videoId ? 1 : 0,
    processingTimeMs: Date.now() - startTime,
  };
}

function buildOfflineReport(
  input: ScoutVerifyInput,
  reportId: string,
  startTime: number
): ScoutVerifyReport {
  return {
    reportId,
    prospectName: input.prospectName,
    position: input.position,
    school: input.school,
    generatedAt: new Date().toISOString(),
    claims: [],
    highlightBias: defaultBiasReport(),
    hypeAnalysis: {
      hypeIndex: 0,
      mediaSourcesAnalyzed: 0,
      inflatedClaims: [],
      supportedClaims: [],
      unknownClaims: [],
    },
    paiConfidence: 0,
    overallVerificationScore: 0,
    scoutingReport: undefined,
    bullCase: undefined,
    bearCase: undefined,
    videosAnalyzed: 0,
    processingTimeMs: Date.now() - startTime,
  };
}

// ---------------------------------------------------------------------------
// Parsing helpers — extract structured data from Pegasus text output
// ---------------------------------------------------------------------------

function parseClaims(text: string): ExtractedClaim[] {
  const claims: ExtractedClaim[] = [];
  const lines = text.split('\n').filter(l => l.trim());

  for (const line of lines) {
    const trimmed = line.replace(/^[-*\d.)\s]+/, '').trim();
    if (!trimmed || trimmed.length < 10) continue;

    // Detect category from keywords
    let category: ExtractedClaim['category'] = 'skill';
    if (/\b(yards?|touchdown|completion|average|percent|stats?)\b/i.test(trimmed)) category = 'stat';
    if (/\b(like|compared|reminds|similar)\b/i.test(trimmed)) category = 'comparison';
    if (/\b(ranked|rank|#\d|top\s+\d|best)\b/i.test(trimmed)) category = 'ranking';
    if (/\b(speed|height|weight|40|vertical|bench|shuttle)\b/i.test(trimmed)) category = 'physical';

    // Extract timestamp if present (e.g., "at 1:23" or "0:45")
    const tsMatch = trimmed.match(/(\d{1,2}):(\d{2})/);
    const timestamp = tsMatch ? parseInt(tsMatch[1]) * 60 + parseInt(tsMatch[2]) : undefined;

    claims.push({
      claim: trimmed,
      timestamp,
      category,
      verified: null,
      confidence: 0,
    });
  }

  return claims;
}

function parseBiasReport(text: string): HighlightBiasReport {
  const report = defaultBiasReport();

  // Try to extract play count
  const playMatch = text.match(/(\d+)\s*(?:unique\s*)?plays?\s*(?:shown|included)/i);
  if (playMatch) report.totalPlaysShown = parseInt(playMatch[1]);

  // Check for bias indicators
  const positiveOnly = /only\s*(?:positive|successful|good|best)\s*plays/i.test(text);
  report.onlyPositivePlays = positiveOnly;

  // Detect editing flags
  const flags: string[] = [];
  if (/slow.?mo/i.test(text)) flags.push('selective slow-motion');
  if (/speed|sped up|fast.?forward/i.test(text)) flags.push('speed manipulation');
  if (/angle|camera/i.test(text) && /selective|hide|hidden/i.test(text)) flags.push('selective angles');
  if (/only\s*(?:best|top|highlight)/i.test(text)) flags.push('cherry-picked plays');
  report.editingFlags = flags;

  // Calculate bias score
  let score = 30; // baseline
  if (positiveOnly) score += 25;
  score += flags.length * 10;
  report.biasScore = Math.min(100, score);

  return report;
}

function extractSection(text: string, sectionName: string): string | undefined {
  const regex = new RegExp(`${sectionName}[:\\s]*\\n([\\s\\S]*?)(?=\\n[A-Z ]{3,}:|$)`, 'i');
  const match = text.match(regex);
  return match ? match[1].trim() : undefined;
}

function buildHypeAnalysis(claims: ExtractedClaim[]): HypeAnalysis {
  const inflated = claims.filter(c => c.verified === false);
  const supported = claims.filter(c => c.verified === true);
  const unknown = claims.filter(c => c.verified === null);

  const hypeIndex = claims.length > 0
    ? Math.round((inflated.length / claims.length) * 100)
    : 0;

  return {
    hypeIndex,
    mediaSourcesAnalyzed: 0,
    inflatedClaims: inflated.map(c => c.claim),
    supportedClaims: supported.map(c => c.claim),
    unknownClaims: unknown.map(c => c.claim),
  };
}

function defaultBiasReport(): HighlightBiasReport {
  return {
    totalPlaysShown: 0,
    estimatedTotalSnaps: null,
    snapCoverage: null,
    onlyPositivePlays: false,
    editingFlags: [],
    biasScore: 0,
  };
}
