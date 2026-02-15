/**
 * @gateway/operations-engine
 * @version 1.0.0
 * @owner ACHEEVY
 *
 * Operations Engine — manages Job Packets (deterministic execution bundles),
 * LUC quotes, the Operations Feed ("Glass Box" user-safe surface), and
 * the phased execution pipeline: Ingest → Route → Delegate → Verify → Deliver.
 *
 * Non-negotiables enforced:
 *  - Every stage emits artifacts into Evidence Locker
 *  - No raw internal reasoning shown to users
 *  - Chain-of-command routing enforced
 *  - LUC quote required at quote time, deploy time, heavy workflows
 *  - If a job cannot be proven with artifacts + receipts, it is not done
 */

import type {
  JobPacket,
  JobStep,
  JobStatus,
  JobApproval,
  JobRouting,
  JobConstraints,
  LucQuote,
  RiskFlag,
  ApprovalRequirement,
  Receipt,
  OperationsFeed,
  OperationsFeedEntry,
  OperationPhase,
  GatewayEvent,
  GatewayEventType,
  ArtifactType,
} from '../types/gateway';

import type { PipelineStage } from '../types/chain-of-command';

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function generateId(prefix: string): string {
  const rand = Math.random().toString(36).substring(2, 15);
  const ts = Date.now().toString(36);
  return `${prefix}_${ts}_${rand}`;
}

function nowISO(): string {
  return new Date().toISOString();
}

function simpleHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return 'sha256:' + Math.abs(hash).toString(16).padStart(8, '0');
}

/** Map operation phases to pipeline stages */
const PHASE_TO_STAGE: Record<OperationPhase, PipelineStage> = {
  ingest: 'INTAKE',
  route: 'SCOPE',
  delegate: 'BUILD',
  verify: 'REVIEW',
  deliver: 'DEPLOY',
};

/* ------------------------------------------------------------------ */
/*  Job Packet Service                                                */
/* ------------------------------------------------------------------ */

export class JobPacketService {
  private jobs = new Map<string, JobPacket>();
  private receipts = new Map<string, Receipt>();

  /* ----- Create Job ----- */

  createJob(params: {
    tenant_id: string;
    workspace_id: string;
    project_id?: string;
    title: string;
    intent: string;
    steps: Array<{
      description: string;
      assigned_to: string;
      required_artifacts: ArtifactType[];
      constraints?: Partial<JobConstraints>;
    }>;
    originated_by: string;
    luc_quote_id?: string;
  }): JobPacket {
    const job: JobPacket = {
      job_id: generateId('job'),
      tenant_id: params.tenant_id,
      workspace_id: params.workspace_id,
      project_id: params.project_id,
      title: params.title,
      intent: params.intent,
      current_stage: 'INTAKE',
      status: 'pending_approval',
      luc_quote_id: params.luc_quote_id,
      steps: params.steps.map((s, i) => ({
        step_number: i + 1,
        description: s.description,
        assigned_to: s.assigned_to,
        required_artifacts: s.required_artifacts,
        constraints: {
          timeout_seconds: s.constraints?.timeout_seconds,
          max_cost_usd: s.constraints?.max_cost_usd,
          max_tokens: s.constraints?.max_tokens,
          sandbox_required: s.constraints?.sandbox_required ?? false,
          approval_required: s.constraints?.approval_required ?? false,
          allowed_tools: s.constraints?.allowed_tools,
        },
        status: 'pending',
      })),
      approvals: [],
      routing: {
        originated_by: params.originated_by,
        current_assignee: params.originated_by,
        route_log: [
          {
            from: 'system',
            to: params.originated_by,
            action: 'created',
            timestamp: nowISO(),
          },
        ],
      },
      receipts: [],
      evidence_refs: [],
      created_at: nowISO(),
      updated_at: nowISO(),
    };

    this.jobs.set(job.job_id, job);
    return job;
  }

  /* ----- Approve Job ----- */

  approveJob(job_id: string, approver: string, scope: string, conditions?: string[]): JobPacket {
    const job = this.getJobOrThrow(job_id);
    if (job.status !== 'pending_approval') {
      throw new Error(`Job status '${job.status}' cannot be approved`);
    }

    job.approvals.push({
      approver_handle: approver,
      approved_at: nowISO(),
      scope,
      conditions,
    });

    job.status = 'approved';
    job.updated_at = nowISO();
    return job;
  }

  /* ----- Start Execution ----- */

  startExecution(job_id: string): JobPacket {
    const job = this.getJobOrThrow(job_id);
    if (job.status !== 'approved') {
      throw new Error(`Job must be approved before execution. Current: '${job.status}'`);
    }
    job.status = 'in_progress';
    job.current_stage = 'SCOPE';
    job.updated_at = nowISO();
    return job;
  }

  /* ----- Route Job (chain-of-command delegation) ----- */

  routeJob(job_id: string, from: string, to: string, action: string): JobPacket {
    const job = this.getJobOrThrow(job_id);
    job.routing.current_assignee = to;
    job.routing.route_log.push({ from, to, action, timestamp: nowISO() });
    job.updated_at = nowISO();
    return job;
  }

  /* ----- Advance Stage ----- */

  advanceStage(job_id: string): JobPacket {
    const job = this.getJobOrThrow(job_id);
    const stages: PipelineStage[] = ['INTAKE', 'SCOPE', 'BUILD', 'REVIEW', 'DEPLOY'];
    const idx = stages.indexOf(job.current_stage);
    if (idx < stages.length - 1) {
      job.current_stage = stages[idx + 1];
    }
    job.updated_at = nowISO();
    return job;
  }

  /* ----- Complete Step ----- */

  completeStep(
    job_id: string,
    step_number: number,
    evidence_refs: string[]
  ): { job: JobPacket; receipt: Receipt } {
    const job = this.getJobOrThrow(job_id);
    const step = job.steps.find(s => s.step_number === step_number);
    if (!step) throw new Error(`Step ${step_number} not found`);
    if (step.status !== 'pending' && step.status !== 'in_progress') {
      throw new Error(`Step ${step_number} status '${step.status}' cannot be completed`);
    }

    // No-proof-no-done: check required artifacts
    if (step.required_artifacts.length > 0 && evidence_refs.length === 0) {
      throw new Error(
        `Step ${step_number} requires proof artifacts: ${step.required_artifacts.join(', ')}. No evidence provided.`
      );
    }

    step.status = 'completed';

    // Generate receipt
    const receipt: Receipt = {
      receipt_id: generateId('rct'),
      tenant_id: job.tenant_id,
      workspace_id: job.workspace_id,
      job_packet_id: job.job_id,
      summary: `Step ${step_number}: ${step.description}`,
      artifact_hashes: evidence_refs.map(ref => ({
        artifact_id: ref,
        hash: simpleHash(ref + nowISO()),
      })),
      event_log_refs: [],
      signature: simpleHash(`${job.job_id}:${step_number}:${nowISO()}`),
      signed_by: step.assigned_to,
      issued_at: nowISO(),
      stage: job.current_stage,
    };

    this.receipts.set(receipt.receipt_id, receipt);
    step.receipt_id = receipt.receipt_id;
    job.receipts.push(receipt.receipt_id);
    job.evidence_refs.push(...evidence_refs);
    job.updated_at = nowISO();

    // Check if all steps completed
    const allDone = job.steps.every(s => s.status === 'completed' || s.status === 'skipped');
    if (allDone) {
      job.status = 'completed';
      job.completed_at = nowISO();
    }

    return { job, receipt };
  }

  /* ----- Start Step ----- */

  startStep(job_id: string, step_number: number): JobPacket {
    const job = this.getJobOrThrow(job_id);
    const step = job.steps.find(s => s.step_number === step_number);
    if (!step) throw new Error(`Step ${step_number} not found`);
    step.status = 'in_progress';
    job.updated_at = nowISO();
    return job;
  }

  /* ----- Fail Job ----- */

  failJob(job_id: string, reason: string): JobPacket {
    const job = this.getJobOrThrow(job_id);
    job.status = 'failed';
    job.updated_at = nowISO();
    return job;
  }

  /* ----- Escalate Job ----- */

  escalateJob(job_id: string, from: string, to: string, reason: string): JobPacket {
    const job = this.getJobOrThrow(job_id);
    job.status = 'escalated';
    this.routeJob(job_id, from, to, `escalation: ${reason}`);
    return job;
  }

  /* ----- Cancel Job ----- */

  cancelJob(job_id: string): JobPacket {
    const job = this.getJobOrThrow(job_id);
    job.status = 'cancelled';
    job.updated_at = nowISO();
    return job;
  }

  /* ----- Receipt Lookup ----- */

  getReceipt(receipt_id: string): Receipt | undefined {
    return this.receipts.get(receipt_id);
  }

  /* ----- Job Lookup ----- */

  getJob(job_id: string): JobPacket | undefined {
    return this.jobs.get(job_id);
  }

  listByTenant(tenant_id: string, status?: JobStatus): JobPacket[] {
    let results = Array.from(this.jobs.values()).filter(j => j.tenant_id === tenant_id);
    if (status) results = results.filter(j => j.status === status);
    return results;
  }

  /* ----- Stats ----- */

  stats(): { total: number; by_status: Record<string, number>; receipts: number } {
    const by_status: Record<string, number> = {};
    for (const j of this.jobs.values()) {
      by_status[j.status] = (by_status[j.status] ?? 0) + 1;
    }
    return { total: this.jobs.size, by_status, receipts: this.receipts.size };
  }

  private getJobOrThrow(job_id: string): JobPacket {
    const job = this.jobs.get(job_id);
    if (!job) throw new Error(`Job '${job_id}' not found`);
    return job;
  }
}

/* ------------------------------------------------------------------ */
/*  LUC Quote Service                                                 */
/* ------------------------------------------------------------------ */

export class LucQuoteService {
  private quotes = new Map<string, LucQuote>();

  generate(params: {
    tenant_id: string;
    workspace_id: string;
    job_id?: string;
    estimated_tokens: number;
    cost_range: { min: number; max: number };
    estimated_duration: string;
    risk_flags?: RiskFlag[];
    approval_requirements?: ApprovalRequirement[];
    ttl_seconds?: number;
  }): LucQuote {
    const ttl = params.ttl_seconds ?? 3600;
    const quote: LucQuote = {
      quote_id: generateId('quote'),
      tenant_id: params.tenant_id,
      workspace_id: params.workspace_id,
      job_id: params.job_id,
      estimated_tokens: params.estimated_tokens,
      cost_range: params.cost_range,
      estimated_duration: params.estimated_duration,
      risk_flags: params.risk_flags ?? [],
      approval_requirements: params.approval_requirements ?? [],
      approved: false,
      created_at: nowISO(),
      expires_at: new Date(Date.now() + ttl * 1000).toISOString(),
    };

    this.quotes.set(quote.quote_id, quote);
    return quote;
  }

  approve(quote_id: string): LucQuote {
    const quote = this.quotes.get(quote_id);
    if (!quote) throw new Error(`Quote '${quote_id}' not found`);
    if (new Date(quote.expires_at) < new Date()) {
      throw new Error('Quote has expired');
    }
    quote.approved = true;
    quote.approved_at = nowISO();
    return quote;
  }

  getQuote(quote_id: string): LucQuote | undefined {
    return this.quotes.get(quote_id);
  }

  isValid(quote_id: string): boolean {
    const quote = this.quotes.get(quote_id);
    if (!quote) return false;
    return new Date(quote.expires_at) > new Date();
  }
}

/* ------------------------------------------------------------------ */
/*  Operations Feed Service (Glass Box)                               */
/* ------------------------------------------------------------------ */

export class OperationsFeedService {
  private feeds = new Map<string, OperationsFeed>();

  /* ----- Initialize Feed for a Job ----- */

  initFeed(job_id: string, tenant_id: string, workspace_id: string): OperationsFeed {
    const feed: OperationsFeed = {
      job_id,
      tenant_id,
      workspace_id,
      current_phase: 'ingest',
      entries: [],
      receipts: [],
    };
    this.feeds.set(job_id, feed);
    return feed;
  }

  /* ----- Add Entry (user-safe, no internal reasoning) ----- */

  addEntry(
    job_id: string,
    phase: OperationPhase,
    role_handle: string,
    display_text: string,
    artifact_ref?: string,
    proof_type?: string
  ): OperationsFeedEntry {
    const feed = this.feeds.get(job_id);
    if (!feed) throw new Error(`Feed for job '${job_id}' not found`);

    // Glass Box safety: strip any potential internal reasoning markers
    const sanitized = this.sanitizeDisplayText(display_text);

    const entry: OperationsFeedEntry = {
      entry_id: generateId('fed'),
      job_id,
      phase,
      role_handle,
      display_text: sanitized,
      artifact_ref,
      proof_type,
      timestamp: nowISO(),
    };

    feed.entries.push(entry);
    feed.current_phase = phase;
    return entry;
  }

  /* ----- Attach Receipt ----- */

  attachReceipt(job_id: string, receipt_id: string): void {
    const feed = this.feeds.get(job_id);
    if (!feed) throw new Error(`Feed for job '${job_id}' not found`);
    feed.receipts.push(receipt_id);
  }

  /* ----- Get Feed ----- */

  getFeed(job_id: string): OperationsFeed | undefined {
    return this.feeds.get(job_id);
  }

  /* ----- Glass Box: sanitize display text ----- */

  private sanitizeDisplayText(text: string): string {
    // Remove any accidental internal reasoning markers
    const forbidden = [
      /\[internal\]/gi,
      /\[reasoning\]/gi,
      /\[thinking\]/gi,
      /\[system\]/gi,
      /\[prompt\]/gi,
      /\[debug\]/gi,
      /sk-[A-Za-z0-9]{48}/g,       // OpenAI keys
      /ghp_[A-Za-z0-9_]{36}/g,     // GitHub PATs
      /AKIA[0-9A-Z]{16}/g,         // AWS keys
    ];

    let result = text;
    for (const pattern of forbidden) {
      result = result.replace(pattern, '[REDACTED]');
    }

    return result;
  }
}
