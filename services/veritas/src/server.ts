/**
 * Veritas — Research Verification Boomer_Ang
 *
 * The "red team" for business data. Replicates a $500/hr consultant's
 * fact-checking workflow:
 *
 *   1. INGEST — Accept PDF/CSV/text with business claims
 *   2. EXTRACT — The Boss (Claude) identifies high-stakes numerical claims
 *   3. VERIFY — The Grunts (Perplexity/Brave) search for actual data
 *   4. ASSESS — Compare claims vs verified facts (>10% variance = Critical)
 *   5. REPORT — Generate consultant-grade Risk Assessment
 *
 * Architecture: "Boss-Grunt" (Hierarchical Mixture of Agents)
 *   - Boss: Claude Opus/Sonnet — Strategy, claim extraction, report synthesis
 *   - Grunts: Perplexity Sonar / Brave Search — Data retrieval
 *   - Guardrails: Variance checking, citation tracking
 *
 * Port: 7001
 */

const PORT = Number(process.env.PORT) || 7001;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
const BRAVE_API_KEY = process.env.BRAVE_API_KEY || '';
const BOSS_MODEL = process.env.VERITAS_BOSS_MODEL || 'anthropic/claude-sonnet-4-20250514';
const GRUNT_MODEL = process.env.VERITAS_GRUNT_MODEL || 'perplexity/sonar-pro';

// ─── Types ────────────────────────────────────────────────────────────────

interface Claim {
  claimId: string;
  originalText: string;
  numericalValue: number | null;
  metricUnit: string;
  category: 'revenue' | 'market_size' | 'customer' | 'growth' | 'cost' | 'demographic' | 'other';
  confidence: 'high_stakes' | 'medium' | 'low';
  sourceLocation: string;  // e.g., "Page 3, Paragraph 2"
}

interface VerifiedFact {
  claimId: string;
  verifiedValue: number | null;
  verifiedText: string;
  sources: Array<{ title: string; url: string; snippet: string }>;
  variancePercent: number | null;
  riskLevel: 'critical' | 'warning' | 'verified' | 'unverified';
  explanation: string;
}

interface VeritasReport {
  reportId: string;
  projectName: string;
  documentName: string;
  submittedAt: string;
  completedAt: string;
  overallRisk: 'critical' | 'warning' | 'clean';
  confidenceScore: number;  // 0-100
  summary: string;
  claims: Claim[];
  findings: VerifiedFact[];
  recommendations: string[];
  totalClaimsAnalyzed: number;
  criticalErrors: number;
  warnings: number;
  verified: number;
  unverified: number;
  dataSources: number;
  processingTimeMs: number;
}

type ReportStatus = 'pending' | 'extracting' | 'verifying' | 'synthesizing' | 'complete' | 'failed';

interface Job {
  id: string;
  projectName: string;
  documentName: string;
  documentText: string;
  status: ReportStatus;
  progress: number;
  statusMessage: string;
  report: VeritasReport | null;
  createdAt: string;
  events: Array<{ timestamp: string; event: string; detail: string }>;
}

// ─── State ────────────────────────────────────────────────────────────────

const jobs = new Map<string, Job>();
const reports: VeritasReport[] = [];
let totalJobs = 0;

// ─── LLM Helpers ─────────────────────────────────────────────────────────

async function callBoss(systemPrompt: string, userPrompt: string): Promise<string> {
  if (!OPENROUTER_API_KEY) return '{"error": "OPENROUTER_API_KEY not configured"}';

  const res = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify({
      model: BOSS_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.1,
      max_tokens: 4096,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Boss LLM call failed: ${res.status} ${err}`);
  }

  const data = await res.json() as { choices: Array<{ message: { content: string } }> };
  return data.choices?.[0]?.message?.content || '';
}

async function callGrunt(query: string): Promise<{ answer: string; sources: Array<{ title: string; url: string; snippet: string }> }> {
  // Strategy 1: Use Perplexity Sonar via OpenRouter (best for fact-checking)
  if (OPENROUTER_API_KEY) {
    try {
      const res = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        },
        body: JSON.stringify({
          model: GRUNT_MODEL,
          messages: [
            {
              role: 'system',
              content: 'You are a precise research analyst. Find the ACTUAL verified value for the metric being asked about. Cite specific sources with URLs. If you cannot find verified data, say "UNVERIFIED" — never guess or hallucinate a number.',
            },
            { role: 'user', content: query },
          ],
          temperature: 0,
          max_tokens: 2048,
        }),
      });

      if (res.ok) {
        const data = await res.json() as { choices: Array<{ message: { content: string } }> };
        const answer = data.choices?.[0]?.message?.content || '';

        // Extract inline citations if present
        const urlRegex = /https?:\/\/[^\s\)]+/g;
        const urls = answer.match(urlRegex) || [];
        const sources = urls.slice(0, 5).map(url => ({
          title: url.replace(/https?:\/\//, '').split('/')[0],
          url,
          snippet: '',
        }));

        return { answer, sources };
      }
    } catch (e) {
      console.warn(`[Veritas] Grunt LLM call failed: ${e}`);
    }
  }

  // Strategy 2: Brave Search fallback
  if (BRAVE_API_KEY) {
    try {
      const res = await fetch(
        `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5`,
        { headers: { 'X-Subscription-Token': BRAVE_API_KEY, 'Accept': 'application/json' } },
      );

      if (res.ok) {
        const data = await res.json() as { web?: { results?: Array<{ title: string; url: string; description: string }> } };
        const results = data.web?.results || [];
        return {
          answer: results.map(r => `${r.title}: ${r.description}`).join('\n'),
          sources: results.map(r => ({ title: r.title, url: r.url, snippet: r.description })),
        };
      }
    } catch {
      console.warn('[Veritas] Brave search fallback failed');
    }
  }

  return { answer: 'UNVERIFIED — no search APIs configured', sources: [] };
}

// ─── Core Pipeline ───────────────────────────────────────────────────────

function addEvent(job: Job, event: string, detail: string) {
  job.events.push({ timestamp: new Date().toISOString(), event, detail });
  console.log(`[Veritas][${job.id}] ${event}: ${detail}`);
}

async function extractClaims(job: Job): Promise<Claim[]> {
  job.status = 'extracting';
  job.statusMessage = 'Boss is identifying high-stakes claims...';
  addEvent(job, 'EXTRACT_START', 'Boss analyzing document for numerical claims');

  const text = job.documentText.slice(0, 15000); // Limit context

  const response = await callBoss(
    `You are a senior business analyst performing due diligence. Your job is to extract ALL significant numerical claims from a business document. Focus on high-stakes metrics: revenue, market size, customer counts, growth rates, CLV, demographics, cost projections.

Output ONLY valid JSON array. Each item must have:
- claimId: string (C1, C2, etc.)
- originalText: string (exact text from document)
- numericalValue: number or null
- metricUnit: string (e.g., "USD", "percent", "customers", "years")
- category: "revenue" | "market_size" | "customer" | "growth" | "cost" | "demographic" | "other"
- confidence: "high_stakes" | "medium" | "low"
- sourceLocation: string (approximate location in document)

Extract at minimum 5 claims, up to 15. Prioritize high-stakes financial claims.`,
    `Analyze this document and extract all significant numerical claims:\n\n${text}`,
  );

  try {
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const claims = JSON.parse(jsonMatch[0]) as Claim[];
      addEvent(job, 'EXTRACT_COMPLETE', `Found ${claims.length} claims`);
      return claims;
    }
  } catch (e) {
    addEvent(job, 'EXTRACT_ERROR', `Failed to parse claims: ${e}`);
  }

  return [];
}

async function verifyClaims(job: Job, claims: Claim[]): Promise<VerifiedFact[]> {
  job.status = 'verifying';
  job.statusMessage = 'Grunts are verifying claims against live data...';
  addEvent(job, 'VERIFY_START', `Verifying ${claims.length} claims`);

  const findings: VerifiedFact[] = [];

  for (let i = 0; i < claims.length; i++) {
    const claim = claims[i];
    job.progress = Math.round(((i + 1) / claims.length) * 60) + 20; // 20-80%
    job.statusMessage = `Verifying claim ${i + 1}/${claims.length}: ${claim.originalText.slice(0, 50)}...`;
    addEvent(job, 'VERIFY_CLAIM', `Grunt searching for: ${claim.originalText.slice(0, 80)}`);

    // Build search query for the grunt
    const searchQuery = `Verify: "${claim.originalText}" — Find the actual verified ${claim.metricUnit} value for this metric. Cite annual reports, SEC filings, or reputable news sources.`;

    const { answer, sources } = await callGrunt(searchQuery);

    // Ask Boss to assess the variance
    const assessment = await callBoss(
      `You are a risk assessor. Compare the ORIGINAL CLAIM to the VERIFIED DATA.
Calculate the variance percentage. Output ONLY valid JSON:
{
  "verifiedValue": number or null,
  "verifiedText": "what the data actually shows",
  "variancePercent": number or null (positive = overestimate, negative = underestimate),
  "riskLevel": "critical" | "warning" | "verified" | "unverified",
  "explanation": "brief explanation of the discrepancy or confirmation"
}

Rules:
- If variance > 10%: "critical"
- If variance 5-10%: "warning"
- If variance < 5%: "verified"
- If no data found: "unverified"
- NEVER guess. If unsure, mark "unverified".`,
      `ORIGINAL CLAIM: "${claim.originalText}" (Value: ${claim.numericalValue} ${claim.metricUnit})

RESEARCH FINDINGS:
${answer}`,
    );

    try {
      const jsonMatch = assessment.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        findings.push({
          claimId: claim.claimId,
          verifiedValue: parsed.verifiedValue,
          verifiedText: parsed.verifiedText || 'See sources',
          sources: sources.slice(0, 3),
          variancePercent: parsed.variancePercent,
          riskLevel: parsed.riskLevel || 'unverified',
          explanation: parsed.explanation || 'Assessment inconclusive',
        });
        addEvent(job, 'VERIFY_RESULT', `${claim.claimId}: ${parsed.riskLevel} (${parsed.variancePercent ?? 'N/A'}% variance)`);
        continue;
      }
    } catch {
      // Parse failed
    }

    // Fallback: unverified
    findings.push({
      claimId: claim.claimId,
      verifiedValue: null,
      verifiedText: answer.slice(0, 200),
      sources,
      variancePercent: null,
      riskLevel: 'unverified',
      explanation: 'Could not assess variance — manual review recommended',
    });
    addEvent(job, 'VERIFY_FALLBACK', `${claim.claimId}: marked unverified`);
  }

  addEvent(job, 'VERIFY_COMPLETE', `${findings.length} claims verified`);
  return findings;
}

async function synthesizeReport(job: Job, claims: Claim[], findings: VerifiedFact[]): Promise<VeritasReport> {
  job.status = 'synthesizing';
  job.progress = 85;
  job.statusMessage = 'Boss is synthesizing the consultant-grade report...';
  addEvent(job, 'SYNTHESIZE_START', 'Generating final report');

  const criticalErrors = findings.filter(f => f.riskLevel === 'critical').length;
  const warnings = findings.filter(f => f.riskLevel === 'warning').length;
  const verified = findings.filter(f => f.riskLevel === 'verified').length;
  const unverified = findings.filter(f => f.riskLevel === 'unverified').length;
  const totalSources = new Set(findings.flatMap(f => f.sources.map(s => s.url))).size;

  const overallRisk: 'critical' | 'warning' | 'clean' =
    criticalErrors > 0 ? 'critical' : warnings > 0 ? 'warning' : 'clean';

  const confidenceScore = Math.round(
    ((verified + warnings * 0.5) / Math.max(1, findings.length)) * 100
  );

  // Generate executive summary
  const summaryResponse = await callBoss(
    `You are a senior consulting partner writing an executive summary. Be direct, professional, and precise. Maximum 3 paragraphs.`,
    `Write an executive summary for this research verification report:

Document: ${job.documentName}
Total Claims Analyzed: ${claims.length}
Critical Errors: ${criticalErrors}
Warnings: ${warnings}
Verified Accurate: ${verified}
Unverified: ${unverified}

Key findings:
${findings
  .filter(f => f.riskLevel === 'critical' || f.riskLevel === 'warning')
  .map(f => {
    const claim = claims.find(c => c.claimId === f.claimId);
    return `- ${f.riskLevel.toUpperCase()}: "${claim?.originalText}" — Variance: ${f.variancePercent ?? 'N/A'}%. ${f.explanation}`;
  })
  .join('\n')}`,
  );

  // Generate recommendations
  const recsResponse = await callBoss(
    'You are a strategic advisor. Output a JSON array of 3-5 actionable recommendations based on the verification findings. Each recommendation should be a concise string (1-2 sentences).',
    `Based on ${criticalErrors} critical errors and ${warnings} warnings found in "${job.documentName}", what are the top recommendations? Key issues: ${findings.filter(f => f.riskLevel !== 'verified').map(f => f.explanation).join('; ')}`,
  );

  let recommendations: string[] = [];
  try {
    const jsonMatch = recsResponse.match(/\[[\s\S]*\]/);
    if (jsonMatch) recommendations = JSON.parse(jsonMatch[0]);
  } catch {
    recommendations = [
      'Review all flagged claims before proceeding with investment decisions.',
      'Verify critical financial projections with independent third-party data.',
      'Request updated source data for any claims marked as unverified.',
    ];
  }

  const report: VeritasReport = {
    reportId: `VER-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    projectName: job.projectName,
    documentName: job.documentName,
    submittedAt: job.createdAt,
    completedAt: new Date().toISOString(),
    overallRisk,
    confidenceScore,
    summary: summaryResponse,
    claims,
    findings,
    recommendations,
    totalClaimsAnalyzed: claims.length,
    criticalErrors,
    warnings,
    verified,
    unverified,
    dataSources: totalSources,
    processingTimeMs: Date.now() - new Date(job.createdAt).getTime(),
  };

  addEvent(job, 'SYNTHESIZE_COMPLETE', `Report ${report.reportId} generated`);
  return report;
}

async function runPipeline(jobId: string): Promise<void> {
  const job = jobs.get(jobId);
  if (!job) return;

  const startTime = Date.now();

  try {
    // Phase 1: Extract claims
    job.progress = 10;
    const claims = await extractClaims(job);
    if (claims.length === 0) {
      job.status = 'failed';
      job.statusMessage = 'No claims could be extracted from the document.';
      addEvent(job, 'PIPELINE_FAILED', 'No claims extracted');
      return;
    }
    job.progress = 20;

    // Phase 2: Verify claims
    const findings = await verifyClaims(job, claims);
    job.progress = 80;

    // Phase 3: Synthesize report
    const report = await synthesizeReport(job, claims, findings);
    job.report = report;
    reports.push(report);
    job.status = 'complete';
    job.progress = 100;
    job.statusMessage = `Report complete. ${report.criticalErrors} critical, ${report.warnings} warnings, ${report.verified} verified.`;
    addEvent(job, 'PIPELINE_COMPLETE', `Finished in ${Date.now() - startTime}ms`);

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    job.status = 'failed';
    job.statusMessage = `Pipeline failed: ${message}`;
    addEvent(job, 'PIPELINE_ERROR', message);
  }
}

// ─── HTTP Server ────────────────────────────────────────────────────────

const server = Bun.serve({
  port: PORT,
  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const headers = { 'Content-Type': 'application/json' };

    // Health check
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({
        status: 'ok',
        service: 'veritas',
        totalJobs,
        activeJobs: [...jobs.values()].filter(j => j.status !== 'complete' && j.status !== 'failed').length,
        totalReports: reports.length,
        bossModel: BOSS_MODEL,
        gruntModel: GRUNT_MODEL,
        integrations: {
          openrouter: !!OPENROUTER_API_KEY,
          brave: !!BRAVE_API_KEY,
        },
        uptime: process.uptime(),
      }), { headers });
    }

    // Submit document for verification
    if (url.pathname === '/api/ingest' && req.method === 'POST') {
      const body = await req.json() as {
        projectName?: string;
        documentName?: string;
        documentText: string;
      };

      if (!body.documentText) {
        return new Response(JSON.stringify({ error: 'documentText is required' }), { status: 400, headers });
      }

      const jobId = `JOB-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      totalJobs++;

      const job: Job = {
        id: jobId,
        projectName: body.projectName || 'Untitled Project',
        documentName: body.documentName || 'document.txt',
        documentText: body.documentText,
        status: 'pending',
        progress: 0,
        statusMessage: 'Job queued. Starting analysis...',
        report: null,
        createdAt: new Date().toISOString(),
        events: [],
      };

      jobs.set(jobId, job);

      // Start pipeline async
      runPipeline(jobId);

      return new Response(JSON.stringify({
        jobId,
        status: 'pending',
        message: 'Verification pipeline started. Poll /api/job/{id} for progress.',
      }), { status: 202, headers });
    }

    // Check job status
    if (url.pathname.startsWith('/api/job/') && req.method === 'GET') {
      const jobId = url.pathname.split('/api/job/')[1];
      const job = jobs.get(jobId);
      if (!job) {
        return new Response(JSON.stringify({ error: 'Job not found' }), { status: 404, headers });
      }

      return new Response(JSON.stringify({
        id: job.id,
        status: job.status,
        progress: job.progress,
        statusMessage: job.statusMessage,
        projectName: job.projectName,
        documentName: job.documentName,
        createdAt: job.createdAt,
        events: job.events.slice(-20),
        report: job.report,
      }), { headers });
    }

    // Stream job events (SSE)
    if (url.pathname.startsWith('/api/stream/') && req.method === 'GET') {
      const jobId = url.pathname.split('/api/stream/')[1];
      const job = jobs.get(jobId);
      if (!job) {
        return new Response('Job not found', { status: 404 });
      }

      const stream = new ReadableStream({
        start(controller) {
          let lastEventCount = 0;

          const interval = setInterval(() => {
            const currentJob = jobs.get(jobId);
            if (!currentJob) {
              controller.close();
              clearInterval(interval);
              return;
            }

            // Send new events
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

            // Close when done
            if (currentJob.status === 'complete' || currentJob.status === 'failed') {
              const finalData = JSON.stringify({
                status: currentJob.status,
                progress: currentJob.progress,
                statusMessage: currentJob.statusMessage,
                event: 'PIPELINE_DONE',
                detail: currentJob.status === 'complete' ? 'Report ready' : 'Pipeline failed',
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
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Get report by ID
    if (url.pathname.startsWith('/api/report/') && req.method === 'GET') {
      const reportId = url.pathname.split('/api/report/')[1];
      const report = reports.find(r => r.reportId === reportId);
      if (!report) {
        return new Response(JSON.stringify({ error: 'Report not found' }), { status: 404, headers });
      }
      return new Response(JSON.stringify(report), { headers });
    }

    // List all reports
    if (url.pathname === '/api/reports' && req.method === 'GET') {
      const limit = Number(url.searchParams.get('limit')) || 20;
      return new Response(JSON.stringify({
        total: reports.length,
        reports: reports.slice(-limit).reverse().map(r => ({
          reportId: r.reportId,
          projectName: r.projectName,
          documentName: r.documentName,
          overallRisk: r.overallRisk,
          confidenceScore: r.confidenceScore,
          criticalErrors: r.criticalErrors,
          warnings: r.warnings,
          verified: r.verified,
          completedAt: r.completedAt,
        })),
      }), { headers });
    }

    // Status
    if (url.pathname === '/api/status') {
      return new Response(JSON.stringify({
        service: 'veritas',
        version: '1.0.0',
        architecture: 'Boss-Grunt (Hierarchical Mixture of Agents)',
        bossModel: BOSS_MODEL,
        gruntModel: GRUNT_MODEL,
        totalJobs,
        totalReports: reports.length,
        recentReports: reports.slice(-5).reverse().map(r => ({
          reportId: r.reportId,
          projectName: r.projectName,
          overallRisk: r.overallRisk,
          criticalErrors: r.criticalErrors,
        })),
      }), { headers });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers });
  },
});

console.log(`[Veritas] Research Verification Engine running on port ${PORT}`);
console.log(`[Veritas] Boss Model: ${BOSS_MODEL}`);
console.log(`[Veritas] Grunt Model: ${GRUNT_MODEL}`);
console.log(`[Veritas] OpenRouter: ${OPENROUTER_API_KEY ? 'configured' : 'NOT configured'}`);
console.log(`[Veritas] Brave Search: ${BRAVE_API_KEY ? 'configured' : 'NOT configured'}`);
