/**
 * Boost|Bridge — Human Companion Platform
 *
 * "Productively Fun." High-IQ, High-Fly. "The Lab" meets "The Cypher."
 * We don't just research. We SIMULATE, TRAIN, CERTIFY, and VERIFY.
 *
 * Six Sigma DMAIC Remix:
 *   Define  → THE VISION     (Consulting Launch Pad — what are we building?)
 *   Measure → THE CROWD      (Synthetic Personas stress-testing reality)
 *   Analyze → THE ROAST      (AI Critics tearing it down — find every flaw)
 *   Improve → THE REMIX      (Iterate based on real feedback)
 *   Control → THE STANDARD   (P2P Training Dojo — certification/accreditation)
 *   Verify  → THE GATE       (Identity Verification — OCR, Facial, Credentials, ML)
 *
 * Engines:
 *   A. Synthetic Persona Engine ("The Crowd")       — Market simulation via AI personas
 *   B. Trial Run Orchestrator ("The Proving Ground") — Real user trial management
 *   C. P2P Training Dojo ("The Standard")            — Peer training with accreditation
 *   D. Identity Verification Engine ("The Gate")     — OCR/DeepSeek, Facial/GCP Vision, Credentials, ML/Vertex AI
 *
 * Integrations:
 *   - Companion: Claude via OpenRouter — Strategy, synthesis, evaluation
 *   - Search: Brave — Grounded data
 *   - OCR: DeepSeek Vision (primary) + GCP Vision API (fallback)
 *   - Facial: GCP Cloud Vision face detection
 *   - ML: Vertex AI custom models + Gemini multimodal
 *   - Batch: Cloud Run Jobs for batch verification
 *   - Storage: Firebase Firestore for verification records
 *   - Multi-Agent: CrewAI bridge for complex verification pipelines
 *   - Discord: Webhooks for The Crowd, The Dojo, The Gate
 *
 * Port: 7001
 */

const PORT = Number(process.env.PORT) || 7001;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
const BRAVE_API_KEY = process.env.BRAVE_API_KEY || '';
const COMPANION_MODEL = process.env.BB_COMPANION_MODEL || 'anthropic/claude-sonnet-4-20250514';
const DISCORD_WEBHOOK_SYNTHETIC = process.env.DISCORD_WEBHOOK_SYNTHETIC || '';
const DISCORD_WEBHOOK_ACCREDITATION = process.env.DISCORD_WEBHOOK_ACCREDITATION || '';

// ─── Shared LLM Helper (exported for engines) ────────────────────────────

export async function callLLM(systemPrompt: string, userPrompt: string): Promise<string> {
  if (!OPENROUTER_API_KEY) return '{"error": "OPENROUTER_API_KEY not configured"}';

  const res = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify({
      model: COMPANION_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 4096,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Companion LLM call failed: ${res.status} ${err}`);
  }

  const data = await res.json() as { choices: Array<{ message: { content: string } }> };
  return data.choices?.[0]?.message?.content || '';
}

// ─── Search Helper (Brave, no Perplexity) ─────────────────────────────────

export async function searchBrave(query: string): Promise<Array<{ title: string; url: string; snippet: string }>> {
  if (!BRAVE_API_KEY) return [];

  try {
    const res = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5`,
      { headers: { 'X-Subscription-Token': BRAVE_API_KEY, 'Accept': 'application/json' } },
    );

    if (res.ok) {
      const data = await res.json() as { web?: { results?: Array<{ title: string; url: string; description: string }> } };
      return (data.web?.results || []).map(r => ({ title: r.title, url: r.url, snippet: r.description }));
    }
  } catch {
    console.warn('[Boost|Bridge] Brave search failed');
  }

  return [];
}

// ─── Discord Webhook Helper ───────────────────────────────────────────────

async function postToDiscord(webhookUrl: string, payload: Record<string, unknown>): Promise<boolean> {
  if (!webhookUrl) return false;

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    console.warn('[Boost|Bridge] Discord webhook failed');
    return false;
  }
}

// ─── State ────────────────────────────────────────────────────────────────

import {
  generatePersonas,
  simulateReactions,
  generateCrowdReport,
  type CrowdReport,
} from './engines/synthetic-persona.js';

import {
  createTrialRun,
  generateFieldReport,
  type TrialRun,
  type TrialConfig,
  type TrialParticipant,
  type TrialFeedback,
} from './engines/trial-run.js';

import {
  evaluateCurriculum,
  issueBadge,
  gradeAssessment,
  type Curriculum,
  type BoostBadge,
  type LearnerProgress,
} from './engines/p2p-dojo.js';

import {
  createVerificationRequest,
  runVerificationPipeline,
  type VerificationRequest,
} from './engines/identity-verify.js';

import {
  healthCheck as crewaiHealth,
  runVerificationCrew,
  runResearchCrew,
} from './integrations/crewai-bridge.js';

import {
  geminiAnalyze,
  launchBatchVerificationJob,
  storeVerificationResult,
} from './gcp/vertex-ai.js';

interface SimulationJob {
  id: string;
  productName: string;
  productDescription: string;
  targetDemo: string;
  personaCount: number;
  status: 'pending' | 'generating_personas' | 'simulating' | 'analyzing' | 'complete' | 'failed';
  progress: number;
  statusMessage: string;
  report: CrowdReport | null;
  createdAt: string;
  events: Array<{ timestamp: string; event: string; detail: string }>;
}

const simulationJobs = new Map<string, SimulationJob>();
const crowdReports: CrowdReport[] = [];
const trialRuns = new Map<string, TrialRun>();
const curricula = new Map<string, Curriculum>();
const badges: BoostBadge[] = [];
const learnerProgress = new Map<string, LearnerProgress>();
const verificationRequests = new Map<string, VerificationRequest>();

// ─── Simulation Pipeline ──────────────────────────────────────────────────

function addEvent(job: SimulationJob, event: string, detail: string) {
  job.events.push({ timestamp: new Date().toISOString(), event, detail });
  console.log(`[Boost|Bridge][${job.id}] ${event}: ${detail}`);
}

async function runSimulationPipeline(jobId: string): Promise<void> {
  const job = simulationJobs.get(jobId);
  if (!job) return;

  try {
    // Phase 1: Generate synthetic personas
    job.status = 'generating_personas';
    job.progress = 10;
    job.statusMessage = `Spinning up ${job.personaCount} synthetic personas...`;
    addEvent(job, 'CROWD_ASSEMBLING', `Generating ${job.personaCount} diverse personas for "${job.targetDemo}"`);

    const personas = await generatePersonas(job.targetDemo, job.personaCount);
    addEvent(job, 'CROWD_READY', `${personas.length} personas assembled`);
    job.progress = 30;

    // Phase 2: Simulate reactions
    job.status = 'simulating';
    job.statusMessage = 'The Crowd is experiencing your product...';
    addEvent(job, 'SIMULATION_START', `${personas.length} personas interacting with "${job.productName}"`);

    const reactions = await simulateReactions(job.productDescription, personas);
    addEvent(job, 'SIMULATION_COMPLETE', `${reactions.length} reactions collected`);
    job.progress = 70;

    // Phase 3: Analyze and report
    job.status = 'analyzing';
    job.statusMessage = 'Crunching the data — building your field report...';
    addEvent(job, 'ANALYSIS_START', 'Aggregating sentiment, pricing, friction data');

    const report = await generateCrowdReport(job.productName, job.productDescription, personas, reactions);
    job.report = report;
    crowdReports.push(report);
    job.status = 'complete';
    job.progress = 100;
    job.statusMessage = `Simulation complete. NPS: ${report.avgNPS}/10, ${report.wouldUsePercent}% would use.`;
    addEvent(job, 'PIPELINE_COMPLETE', `Report ${report.reportId} generated`);

    // Post to Discord if configured
    if (DISCORD_WEBHOOK_SYNTHETIC) {
      await postToDiscord(DISCORD_WEBHOOK_SYNTHETIC, {
        embeds: [{
          title: `Simulation Complete: ${job.productName}`,
          description: report.executiveSummary.slice(0, 300) + '...',
          color: report.avgNPS >= 7 ? 0x22c55e : report.avgNPS >= 5 ? 0xf59e0b : 0xef4444,
          fields: [
            { name: 'NPS', value: `${report.avgNPS}/10`, inline: true },
            { name: 'Would Use', value: `${report.wouldUsePercent}%`, inline: true },
            { name: 'Would Pay', value: `${report.wouldPayPercent}%`, inline: true },
            { name: 'Sample Size', value: `${report.totalPersonas} personas`, inline: true },
          ],
          footer: { text: `Report ID: ${report.reportId}` },
        }],
      });
    }

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    job.status = 'failed';
    job.statusMessage = `Pipeline failed: ${message}`;
    addEvent(job, 'PIPELINE_ERROR', message);
  }
}

// ─── HTTP Server ──────────────────────────────────────────────────────────

const server = Bun.serve({
  port: PORT,
  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }

    // ─── Health ─────────────────────────────────────────────────────

    if (url.pathname === '/health') {
      return new Response(JSON.stringify({
        status: 'ok',
        service: 'boost-bridge',
        philosophy: 'Productively Fun — High-IQ, High-Fly',
        dmaic: { define: 'Vision', measure: 'Crowd', analyze: 'Roast', improve: 'Remix', control: 'Standard' },
        engines: {
          crowd: 'Synthetic Persona Engine (The Crowd)',
          provingGround: 'Trial Run Orchestrator (The Proving Ground)',
          dojo: 'P2P Training Dojo (The Standard)',
          gate: 'Identity Verification Engine (The Gate)',
          crewai: 'CrewAI Multi-Agent Orchestration',
          gemini: 'Vertex AI / Gemini Multimodal',
        },
        stats: {
          simulations: crowdReports.length,
          trials: trialRuns.size,
          curricula: curricula.size,
          badges: badges.length,
          verifications: verificationRequests.size,
        },
        integrations: {
          openrouter: !!OPENROUTER_API_KEY,
          brave: !!BRAVE_API_KEY,
          deepseek: !!process.env.DEEPSEEK_API_KEY,
          gcp_vision: !!process.env.GCP_VISION_API_KEY,
          vertex_ai: !!process.env.GCP_ACCESS_TOKEN,
          crewai: !!process.env.CREWAI_BASE_URL,
          discord_synthetic: !!DISCORD_WEBHOOK_SYNTHETIC,
          discord_accreditation: !!DISCORD_WEBHOOK_ACCREDITATION,
        },
        companionModel: COMPANION_MODEL,
        uptime: process.uptime(),
      }), { headers });
    }

    // ─── THE CROWD: Synthetic Persona Simulation ────────────────────

    // Start simulation
    if (url.pathname === '/api/crowd/simulate' && req.method === 'POST') {
      const body = await req.json() as {
        productName?: string;
        productDescription: string;
        targetDemo?: string;
        personaCount?: number;
      };

      if (!body.productDescription) {
        return new Response(JSON.stringify({ error: 'productDescription is required' }), { status: 400, headers });
      }

      const jobId = `SIM-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const job: SimulationJob = {
        id: jobId,
        productName: body.productName || 'Untitled Product',
        productDescription: body.productDescription,
        targetDemo: body.targetDemo || 'General consumers, ages 18-55, US-based',
        personaCount: Math.min(Math.max(body.personaCount || 20, 5), 1000),
        status: 'pending',
        progress: 0,
        statusMessage: 'Simulation queued. Assembling The Crowd...',
        report: null,
        createdAt: new Date().toISOString(),
        events: [],
      };

      simulationJobs.set(jobId, job);
      runSimulationPipeline(jobId);

      return new Response(JSON.stringify({
        jobId,
        status: 'pending',
        message: `Simulation started with ${job.personaCount} personas. Poll /api/crowd/job/${jobId} for progress.`,
      }), { status: 202, headers });
    }

    // Poll simulation job
    if (url.pathname.startsWith('/api/crowd/job/') && req.method === 'GET') {
      const jobId = url.pathname.split('/api/crowd/job/')[1];
      const job = simulationJobs.get(jobId);
      if (!job) {
        return new Response(JSON.stringify({ error: 'Job not found' }), { status: 404, headers });
      }

      return new Response(JSON.stringify({
        id: job.id,
        status: job.status,
        progress: job.progress,
        statusMessage: job.statusMessage,
        productName: job.productName,
        personaCount: job.personaCount,
        createdAt: job.createdAt,
        events: job.events.slice(-20),
        report: job.report,
      }), { headers });
    }

    // SSE stream for simulation
    if (url.pathname.startsWith('/api/crowd/stream/') && req.method === 'GET') {
      const jobId = url.pathname.split('/api/crowd/stream/')[1];
      const job = simulationJobs.get(jobId);
      if (!job) return new Response('Job not found', { status: 404 });

      const stream = new ReadableStream({
        start(controller) {
          let lastEventCount = 0;
          const interval = setInterval(() => {
            const currentJob = simulationJobs.get(jobId);
            if (!currentJob) { controller.close(); clearInterval(interval); return; }

            const newEvents = currentJob.events.slice(lastEventCount);
            for (const event of newEvents) {
              const data = JSON.stringify({
                status: currentJob.status,
                progress: currentJob.progress,
                statusMessage: currentJob.statusMessage,
                event: event.event,
                detail: event.detail,
                timestamp: event.timestamp,
              });
              controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));
            }
            lastEventCount = currentJob.events.length;

            if (currentJob.status === 'complete' || currentJob.status === 'failed') {
              const finalData = JSON.stringify({
                status: currentJob.status,
                progress: currentJob.progress,
                reportId: currentJob.report?.reportId,
              });
              controller.enqueue(new TextEncoder().encode(`data: ${finalData}\n\n`));
              controller.close();
              clearInterval(interval);
            }
          }, 500);
        },
      });

      return new Response(stream, {
        headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
      });
    }

    // List crowd reports
    if (url.pathname === '/api/crowd/reports' && req.method === 'GET') {
      const limit = Number(url.searchParams.get('limit')) || 20;
      return new Response(JSON.stringify({
        total: crowdReports.length,
        reports: crowdReports.slice(-limit).reverse().map(r => ({
          reportId: r.reportId,
          productName: r.productName,
          totalPersonas: r.totalPersonas,
          avgNPS: r.avgNPS,
          wouldUsePercent: r.wouldUsePercent,
          wouldPayPercent: r.wouldPayPercent,
          completedAt: r.completedAt,
        })),
      }), { headers });
    }

    // Get specific crowd report
    if (url.pathname.startsWith('/api/crowd/report/') && req.method === 'GET') {
      const reportId = url.pathname.split('/api/crowd/report/')[1];
      const report = crowdReports.find(r => r.reportId === reportId);
      if (!report) return new Response(JSON.stringify({ error: 'Report not found' }), { status: 404, headers });
      return new Response(JSON.stringify(report), { headers });
    }

    // ─── THE PROVING GROUND: Trial Runs ─────────────────────────────

    // Create trial
    if (url.pathname === '/api/trial/create' && req.method === 'POST') {
      const config = await req.json() as TrialConfig;
      if (!config.productName) {
        return new Response(JSON.stringify({ error: 'productName is required' }), { status: 400, headers });
      }

      const trial = await createTrialRun(config);
      trialRuns.set(trial.id, trial);

      return new Response(JSON.stringify(trial), { status: 201, headers });
    }

    // Get trial
    if (url.pathname.startsWith('/api/trial/') && !url.pathname.includes('/enroll') && !url.pathname.includes('/feedback') && !url.pathname.includes('/report') && req.method === 'GET') {
      const trialId = url.pathname.split('/api/trial/')[1];
      const trial = trialRuns.get(trialId);
      if (!trial) return new Response(JSON.stringify({ error: 'Trial not found' }), { status: 404, headers });
      return new Response(JSON.stringify(trial), { headers });
    }

    // Enroll participant
    if (url.pathname.match(/\/api\/trial\/[^/]+\/enroll/) && req.method === 'POST') {
      const trialId = url.pathname.split('/api/trial/')[1].split('/enroll')[0];
      const trial = trialRuns.get(trialId);
      if (!trial) return new Response(JSON.stringify({ error: 'Trial not found' }), { status: 404, headers });

      const body = await req.json() as { name: string; email: string };
      const participant: TrialParticipant = {
        id: `P-${Date.now()}-${Math.random().toString(36).slice(2, 4)}`,
        name: body.name,
        email: body.email,
        enrolledAt: new Date().toISOString(),
        status: 'onboarding',
        checkpoints: (trial.onboardingFlow?.steps || []).map(s => ({
          step: s.order,
          label: s.title,
          completedAt: null,
          frictionNotes: null,
        })),
      };

      trial.participants.push(participant);
      if (trial.status === 'draft') trial.status = 'recruiting';

      return new Response(JSON.stringify(participant), { status: 201, headers });
    }

    // Submit participant feedback
    if (url.pathname.match(/\/api\/trial\/[^/]+\/feedback/) && req.method === 'POST') {
      const trialId = url.pathname.split('/api/trial/')[1].split('/feedback')[0];
      const trial = trialRuns.get(trialId);
      if (!trial) return new Response(JSON.stringify({ error: 'Trial not found' }), { status: 404, headers });

      const body = await req.json() as { participantId: string; feedback: TrialFeedback };
      const participant = trial.participants.find(p => p.id === body.participantId);
      if (!participant) return new Response(JSON.stringify({ error: 'Participant not found' }), { status: 404, headers });

      participant.feedback = body.feedback;
      participant.status = 'completed';

      return new Response(JSON.stringify({ ok: true }), { headers });
    }

    // Generate field report
    if (url.pathname.match(/\/api\/trial\/[^/]+\/report/) && req.method === 'POST') {
      const trialId = url.pathname.split('/api/trial/')[1].split('/report')[0];
      const trial = trialRuns.get(trialId);
      if (!trial) return new Response(JSON.stringify({ error: 'Trial not found' }), { status: 404, headers });

      const report = await generateFieldReport(trial);
      trial.fieldReport = report;
      trial.status = 'complete';

      return new Response(JSON.stringify(report), { headers });
    }

    // ─── THE DOJO: P2P Training ─────────────────────────────────────

    // Submit curriculum
    if (url.pathname === '/api/dojo/curriculum' && req.method === 'POST') {
      const body = await req.json() as Omit<Curriculum, 'id' | 'status' | 'certificationScore' | 'evaluationNotes' | 'createdAt' | 'certifiedAt'>;
      const curriculum: Curriculum = {
        ...body,
        id: `CUR-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        status: 'draft',
        certificationScore: null,
        evaluationNotes: null,
        createdAt: new Date().toISOString(),
        certifiedAt: null,
      };

      curricula.set(curriculum.id, curriculum);
      return new Response(JSON.stringify(curriculum), { status: 201, headers });
    }

    // Evaluate curriculum (trigger Black Belt review)
    if (url.pathname.match(/\/api\/dojo\/curriculum\/[^/]+\/evaluate/) && req.method === 'POST') {
      const curId = url.pathname.split('/api/dojo/curriculum/')[1].split('/evaluate')[0];
      const curriculum = curricula.get(curId);
      if (!curriculum) return new Response(JSON.stringify({ error: 'Curriculum not found' }), { status: 404, headers });

      curriculum.status = 'under_review';
      const evaluation = await evaluateCurriculum(curriculum);

      curriculum.certificationScore = evaluation.overallScore;
      curriculum.evaluationNotes = evaluation.recommendation;
      curriculum.status = evaluation.passes ? 'certified' : 'rejected';
      if (evaluation.passes) curriculum.certifiedAt = new Date().toISOString();

      return new Response(JSON.stringify({ curriculum, evaluation }), { headers });
    }

    // Grade assessment
    if (url.pathname.match(/\/api\/dojo\/curriculum\/[^/]+\/grade/) && req.method === 'POST') {
      const curId = url.pathname.split('/api/dojo/curriculum/')[1].split('/grade')[0];
      const curriculum = curricula.get(curId);
      if (!curriculum) return new Response(JSON.stringify({ error: 'Curriculum not found' }), { status: 404, headers });

      const body = await req.json() as {
        learnerId: string;
        learnerName: string;
        answers: Array<{ questionId: string; answer: string }>;
      };

      const result = await gradeAssessment(curriculum, body.answers);

      // Issue badge if passed
      let badge: BoostBadge | null = null;
      if (result.passed) {
        const tier = result.percent >= 95 ? 'black' as const : result.percent >= 80 ? 'blue' as const : 'white' as const;
        badge = await issueBadge(
          body.learnerId,
          body.learnerName,
          tier,
          curriculum.domain,
          curriculum.id,
          curriculum.title,
          result.percent,
        );
        badges.push(badge);

        // Post to Discord accreditation log
        if (DISCORD_WEBHOOK_ACCREDITATION) {
          const tierEmoji = tier === 'black' ? '🥋' : tier === 'blue' ? '🔵' : '⚪';
          await postToDiscord(DISCORD_WEBHOOK_ACCREDITATION, {
            embeds: [{
              title: `${tierEmoji} Boost Badge Earned!`,
              description: `**${body.learnerName}** earned a **${tier.toUpperCase()} BELT** in ${curriculum.domain}`,
              color: tier === 'black' ? 0x1a1a2e : tier === 'blue' ? 0x3b82f6 : 0xf5f5f5,
              fields: [
                { name: 'Course', value: curriculum.title, inline: true },
                { name: 'Score', value: `${result.percent}%`, inline: true },
                { name: 'Badge ID', value: badge.badgeId, inline: false },
              ],
              footer: { text: `Hash: ${badge.hash.slice(0, 16)}...` },
            }],
          });
        }
      }

      return new Response(JSON.stringify({ result, badge }), { headers });
    }

    // Verify badge
    if (url.pathname.startsWith('/api/badge/verify/') && req.method === 'GET') {
      const badgeId = url.pathname.split('/api/badge/verify/')[1];
      const badge = badges.find(b => b.badgeId === badgeId);
      if (!badge) return new Response(JSON.stringify({ error: 'Badge not found', valid: false }), { status: 404, headers });
      return new Response(JSON.stringify({ valid: true, badge }), { headers });
    }

    // List badges
    if (url.pathname === '/api/dojo/badges' && req.method === 'GET') {
      return new Response(JSON.stringify({
        total: badges.length,
        badges: badges.slice(-50).reverse(),
      }), { headers });
    }

    // List curricula
    if (url.pathname === '/api/dojo/curricula' && req.method === 'GET') {
      return new Response(JSON.stringify({
        total: curricula.size,
        curricula: [...curricula.values()].map(c => ({
          id: c.id,
          title: c.title,
          domain: c.domain,
          instructorName: c.instructorName,
          status: c.status,
          certificationScore: c.certificationScore,
          createdAt: c.createdAt,
        })),
      }), { headers });
    }

    // ─── THE GATE: Identity Verification ────────────────────────────

    // Start verification
    if (url.pathname === '/api/gate/verify' && req.method === 'POST') {
      const body = await req.json() as {
        userId: string;
        userName: string;
        email: string;
        documentType: string;
        documentImageBase64: string;
        selfieImageBase64?: string;
        professionalClaims?: Array<{ type: string; title: string; issuer: string; year: number; verificationUrl?: string }>;
      };

      if (!body.userId || !body.documentImageBase64) {
        return new Response(JSON.stringify({ error: 'userId and documentImageBase64 are required' }), { status: 400, headers });
      }

      const request = createVerificationRequest({
        userId: body.userId,
        userName: body.userName || 'Unknown',
        email: body.email || '',
        documentType: (body.documentType || 'state_id') as any,
        documentImageBase64: body.documentImageBase64,
        selfieImageBase64: body.selfieImageBase64,
        professionalClaims: body.professionalClaims as any,
      });

      verificationRequests.set(request.id, request);

      // Run pipeline async
      runVerificationPipeline(request).then(async (completed) => {
        verificationRequests.set(completed.id, completed);
        // Store in Firestore
        try {
          await storeVerificationResult(completed.id, {
            userId: completed.userId,
            status: completed.status,
            confidenceScore: completed.finalVerdict?.confidenceScore || 0,
            verdict: completed.finalVerdict?.status || 'pending',
            completedAt: completed.completedAt || '',
          });
        } catch (e) {
          console.warn('[Gate] Firestore store failed:', e);
        }
      });

      return new Response(JSON.stringify({
        verificationId: request.id,
        status: 'pending',
        message: `Identity verification started. Poll /api/gate/status/${request.id} for progress.`,
      }), { status: 202, headers });
    }

    // Poll verification status
    if (url.pathname.startsWith('/api/gate/status/') && req.method === 'GET') {
      const vId = url.pathname.split('/api/gate/status/')[1];
      const request = verificationRequests.get(vId);
      if (!request) return new Response(JSON.stringify({ error: 'Verification not found' }), { status: 404, headers });

      return new Response(JSON.stringify({
        id: request.id,
        userId: request.userId,
        status: request.status,
        events: request.events.slice(-20),
        ocrResult: request.ocrResult ? {
          confidence: request.ocrResult.confidence,
          documentAuthenticity: request.ocrResult.documentAuthenticity,
          extractedName: request.ocrResult.extractedFields.fullName,
          flags: request.ocrResult.flags,
        } : null,
        faceMatchResult: request.faceMatchResult ? {
          matchVerdict: request.faceMatchResult.matchVerdict,
          matchConfidence: request.faceMatchResult.matchConfidence,
          livenessScore: request.faceMatchResult.livenessScore,
        } : null,
        credentialResult: request.credentialResult ? {
          overallCredibility: request.credentialResult.overallCredibility,
          claims: request.credentialResult.claims.map(c => ({
            title: c.claim.title,
            status: c.status,
          })),
        } : null,
        mlRiskScore: request.mlRiskScore,
        finalVerdict: request.finalVerdict,
        completedAt: request.completedAt,
      }), { headers });
    }

    // Batch verification via Cloud Run Jobs
    if (url.pathname === '/api/gate/batch' && req.method === 'POST') {
      const body = await req.json() as { verificationIds: string[] };
      if (!body.verificationIds?.length) {
        return new Response(JSON.stringify({ error: 'verificationIds array required' }), { status: 400, headers });
      }

      try {
        const job = await launchBatchVerificationJob(body.verificationIds);
        return new Response(JSON.stringify(job), { status: 202, headers });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Batch job failed';
        return new Response(JSON.stringify({ error: msg }), { status: 500, headers });
      }
    }

    // ─── CREWAI: Multi-Agent Orchestration ───────────────────────────

    // CrewAI health
    if (url.pathname === '/api/crew/health' && req.method === 'GET') {
      const status = await crewaiHealth();
      return new Response(JSON.stringify(status), { headers });
    }

    // Run verification crew
    if (url.pathname === '/api/crew/verify' && req.method === 'POST') {
      const body = await req.json() as {
        documentImageBase64: string;
        selfieImageBase64?: string;
        professionalClaims?: Array<{ title: string; issuer: string; year: number }>;
      };

      try {
        const execution = await runVerificationCrew(body);
        return new Response(JSON.stringify(execution), { status: 202, headers });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'CrewAI verification failed';
        return new Response(JSON.stringify({ error: msg }), { status: 500, headers });
      }
    }

    // Run research crew
    if (url.pathname === '/api/crew/research' && req.method === 'POST') {
      const body = await req.json() as {
        industry: string;
        productDescription: string;
        competitors?: string[];
      };

      try {
        const execution = await runResearchCrew(body);
        return new Response(JSON.stringify(execution), { status: 202, headers });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'CrewAI research failed';
        return new Response(JSON.stringify({ error: msg }), { status: 500, headers });
      }
    }

    // ─── GEMINI: Multimodal Analysis ─────────────────────────────────

    if (url.pathname === '/api/gemini/analyze' && req.method === 'POST') {
      const body = await req.json() as { prompt: string; imageBase64?: string; model?: string };
      if (!body.prompt) {
        return new Response(JSON.stringify({ error: 'prompt is required' }), { status: 400, headers });
      }

      try {
        const result = await geminiAnalyze(body.prompt, body.imageBase64, body.model);
        return new Response(JSON.stringify(result), { headers });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Gemini analysis failed';
        return new Response(JSON.stringify({ error: msg }), { status: 500, headers });
      }
    }

    // ─── DMAIC FRAMEWORK (Six Sigma Remix) ───────────────────────────

    if (url.pathname === '/api/dmaic' && req.method === 'GET') {
      return new Response(JSON.stringify({
        framework: 'Boost|Bridge Six Sigma Remix',
        phases: {
          define: { name: 'The Vision', engine: 'Consulting Launch Pad', description: 'What are we building? Scope, stakeholders, success criteria.' },
          measure: { name: 'The Crowd', engine: 'Synthetic Persona Engine', description: 'Synthetic Personas stress-test the idea. Data, not opinions.' },
          analyze: { name: 'The Roast', engine: 'Agent Roast / AI Critics', description: 'AI Critics tear it down. Find every flaw before the market does.' },
          improve: { name: 'The Remix', engine: 'Trial Run Orchestrator', description: 'Iterate based on real feedback. Ship the fix, measure again.' },
          control: { name: 'The Standard', engine: 'P2P Training Dojo', description: 'Certification and accreditation. Maintain the bar.' },
        },
        verification: { name: 'The Gate', engine: 'Identity Verification', description: 'OCR + Facial + Credentials + ML Risk. Trust but verify.' },
      }), { headers });
    }

    // ─── 404 ────────────────────────────────────────────────────────

    return new Response(JSON.stringify({
      error: 'Not found',
      service: 'boost-bridge',
      philosophy: 'Productively Fun — High-IQ, High-Fly',
      dmaic: {
        define: 'The Vision',
        measure: 'The Crowd',
        analyze: 'The Roast',
        improve: 'The Remix',
        control: 'The Standard',
        verify: 'The Gate',
      },
      endpoints: {
        crowd: ['POST /api/crowd/simulate', 'GET /api/crowd/job/:id', 'GET /api/crowd/stream/:id', 'GET /api/crowd/reports', 'GET /api/crowd/report/:id'],
        trial: ['POST /api/trial/create', 'GET /api/trial/:id', 'POST /api/trial/:id/enroll', 'POST /api/trial/:id/feedback', 'POST /api/trial/:id/report'],
        dojo: ['POST /api/dojo/curriculum', 'POST /api/dojo/curriculum/:id/evaluate', 'POST /api/dojo/curriculum/:id/grade', 'GET /api/dojo/badges', 'GET /api/dojo/curricula', 'GET /api/badge/verify/:id'],
        gate: ['POST /api/gate/verify', 'GET /api/gate/status/:id', 'POST /api/gate/batch'],
        crew: ['GET /api/crew/health', 'POST /api/crew/verify', 'POST /api/crew/research'],
        gemini: ['POST /api/gemini/analyze'],
        dmaic: ['GET /api/dmaic'],
      },
    }), { status: 404, headers });
  },
});

console.log(`[Boost|Bridge] Platform running on port ${PORT}`);
console.log(`[Boost|Bridge] Companion Model: ${COMPANION_MODEL}`);
console.log(`[Boost|Bridge] Philosophy: "Productively Fun — High-IQ, High-Fly"`);
console.log(`[Boost|Bridge] DMAIC Remix: Vision → Crowd → Roast → Remix → Standard`);
console.log(`[Boost|Bridge] Engines: The Crowd | The Proving Ground | The Dojo | The Gate`);
console.log(`[Boost|Bridge] Integrations: CrewAI | Vertex AI | Gemini | GCP Vision | DeepSeek`);
console.log(`[Boost|Bridge] OpenRouter: ${OPENROUTER_API_KEY ? '✓' : '✗'} | Brave: ${BRAVE_API_KEY ? '✓' : '✗'} | DeepSeek: ${process.env.DEEPSEEK_API_KEY ? '✓' : '✗'}`);
console.log(`[Boost|Bridge] GCP Vision: ${process.env.GCP_VISION_API_KEY ? '✓' : '✗'} | Vertex AI: ${process.env.GCP_ACCESS_TOKEN ? '✓' : '✗'} | CrewAI: ${process.env.CREWAI_BASE_URL ? '✓' : '✗'}`);
console.log(`[Boost|Bridge] Discord Synthetic: ${DISCORD_WEBHOOK_SYNTHETIC ? '✓' : '✗'} | Accreditation: ${DISCORD_WEBHOOK_ACCREDITATION ? '✓' : '✗'}`);
