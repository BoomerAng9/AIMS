/**
 * Factory Controller — Persistent Always-On Orchestration
 *
 * Watches event sources, auto-kicks FDH runs, oversees execution,
 * and drives everything to completion. The heart of "AI Managed Solutions."
 *
 * ACHEEVY delegates oversight to this controller for active chambers.
 * The human sets policy in Circuit Box and approves at HITL gates.
 */

import { v4 as uuidv4 } from 'uuid';
import logger from '../logger';
import { FDHPipeline } from './fdh-pipeline';
import type {
  FactoryEvent,
  FactoryEventSource,
  FactoryPolicy,
  FDHRun,
  ChamberState,
  ChamberStatus,
  FactoryStatusReport,
} from './types';

// ── Default Factory Policy ───────────────────────────────────

const DEFAULT_POLICY: FactoryPolicy = {
  enabled: true,
  autoApproveThresholdUsd: 5.0,
  maxConcurrentFdh: 3,
  hours: 'always',
  stallTimeoutMinutes: 15,
  monthlyBudgetCapUsd: 500.0,
  eventSources: 'all',
  autoWireEnabled: true,
  healthRemediation: 'restart_then_scale',
};

// ── Factory Controller ───────────────────────────────────────

export class FactoryController {
  private policy: FactoryPolicy;
  private pipeline: FDHPipeline;
  private chambers: Map<string, ChamberState> = new Map();
  private eventQueue: FactoryEvent[] = [];
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private startedAt: number;
  private totalEventsProcessed = 0;
  private monthlySpend = 0;

  constructor(policy?: Partial<FactoryPolicy>) {
    this.policy = { ...DEFAULT_POLICY, ...policy };
    this.pipeline = new FDHPipeline();
    this.startedAt = Date.now();

    logger.info({ policy: this.policy }, '[FACTORY] Controller initialized');
  }

  // ── Lifecycle ─────────────────────────────────────────────

  /**
   * Start the factory controller polling loop.
   * Watches for events and processes them through FDH.
   */
  start(): void {
    if (!this.policy.enabled) {
      logger.info('[FACTORY] Controller disabled by policy — not starting');
      return;
    }

    if (this.pollTimer) {
      logger.warn('[FACTORY] Already running');
      return;
    }

    logger.info('[FACTORY] Starting always-on factory controller');

    // Poll active chambers for stalls and progress
    this.pollTimer = setInterval(() => {
      this.pollCycle();
    }, 30000); // 30s poll cycle

    // Process any queued events immediately
    this.processEventQueue();
  }

  /**
   * Stop the factory controller.
   */
  stop(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    logger.info('[FACTORY] Controller stopped');
  }

  /**
   * Pause the factory (keeps state, stops processing).
   */
  pause(): void {
    this.policy.enabled = false;
    this.stop();
    logger.info('[FACTORY] Factory paused');
  }

  /**
   * Resume the factory after pause.
   */
  resume(): void {
    this.policy.enabled = true;
    this.start();
    logger.info('[FACTORY] Factory resumed');
  }

  // ── Event Processing ──────────────────────────────────────

  /**
   * Ingest an event from any source.
   * This is the primary entry point — called by webhooks, pipelines, UI actions, etc.
   */
  async ingestEvent(event: FactoryEvent): Promise<{
    accepted: boolean;
    runId?: string;
    awaitingApproval?: boolean;
    reason?: string;
  }> {
    // Policy checks
    if (!this.policy.enabled) {
      return { accepted: false, reason: 'Factory controller is paused' };
    }

    if (!this.isEventSourceAllowed(event.source)) {
      return { accepted: false, reason: `Event source '${event.source}' is disabled in policy` };
    }

    if (!this.isWithinOperatingHours()) {
      // Queue for later processing
      this.eventQueue.push(event);
      return { accepted: true, reason: 'Queued — outside operating hours' };
    }

    if (this.monthlySpend >= this.policy.monthlyBudgetCapUsd) {
      return { accepted: false, reason: `Monthly budget cap ($${this.policy.monthlyBudgetCapUsd}) reached` };
    }

    // Check concurrent FDH limit
    const activeRuns = this.pipeline.getActiveRuns();
    if (activeRuns.length >= this.policy.maxConcurrentFdh) {
      this.eventQueue.push(event);
      return { accepted: true, reason: `Queued — ${activeRuns.length}/${this.policy.maxConcurrentFdh} concurrent FDH runs active` };
    }

    this.totalEventsProcessed++;

    logger.info(
      { eventId: event.id, source: event.source, type: event.type, priority: event.priority },
      '[FACTORY] Event ingested'
    );

    // Create FDH manifest
    const manifest = this.pipeline.createManifest(event, this.policy);

    // Ensure chamber exists
    this.ensureChamber(manifest.chamberId, manifest.userId);

    if (manifest.approvalRequired) {
      // Guide Me lane — needs human approval
      const run = this.pipeline.startRun(manifest);
      run.status = 'awaiting_approval' as any;

      // Add to chamber
      const chamber = this.chambers.get(manifest.chamberId);
      if (chamber) chamber.activeFdhRuns.push(run.id);

      logger.info(
        { runId: run.id, scope: manifest.scope, estimatedUsd: manifest.lucEstimate.totalUsd },
        '[FACTORY] FDH run awaiting human approval (Guide Me lane)'
      );

      return { accepted: true, runId: run.id, awaitingApproval: true };
    }

    // Deploy It lane — auto-approved, execute immediately
    return this.executeFullFdh(manifest);
  }

  /**
   * Execute a full FDH pipeline: Foster → Develop → Hone → Deliver
   */
  async executeFullFdh(manifest: ReturnType<FDHPipeline['createManifest']>): Promise<{
    accepted: boolean;
    runId: string;
    awaitingApproval: false;
  }> {
    const run = this.pipeline.startRun(manifest);

    // Add to chamber
    const chamber = this.chambers.get(manifest.chamberId);
    if (chamber) chamber.activeFdhRuns.push(run.id);

    try {
      // Phase 1: Foster
      await this.pipeline.executeFoster(run.id);

      // Phase 2: Develop
      await this.pipeline.executeDevelop(run.id);

      // Phase 3: Hone
      const honeResult = await this.pipeline.executeHone(run.id);

      if (honeResult.allGatesPassed) {
        // Success — complete and deliver
        this.pipeline.completeRun(run.id);

        // Update chamber stats
        if (chamber) {
          chamber.activeFdhRuns = chamber.activeFdhRuns.filter(id => id !== run.id);
          chamber.completedFdhRuns++;
          chamber.totalLucSpent += run.lucActual.totalUsd;
        }

        // Update monthly spend
        this.monthlySpend += run.lucActual.totalUsd;

        logger.info(
          { runId: run.id, oracleScore: honeResult.oracleScore, lucUsd: run.lucActual.totalUsd },
          '[FACTORY] FDH pipeline completed successfully'
        );
      } else {
        // Hone failed — run may have cycled back to Develop (handled internally)
        logger.warn({ runId: run.id, oracleScore: honeResult.oracleScore }, '[FACTORY] FDH Hone phase incomplete');
      }
    } catch (err) {
      logger.error({ err, runId: run.id }, '[FACTORY] FDH pipeline error');
      run.status = 'failed';
      run.error = err instanceof Error ? err.message : String(err);
    }

    return { accepted: true, runId: run.id, awaitingApproval: false };
  }

  /**
   * Approve a pending FDH run (HITL gate).
   */
  async approveRun(runId: string): Promise<FDHRun> {
    const run = this.pipeline.approveRun(runId);

    // Execute the full pipeline now that it's approved
    try {
      await this.pipeline.executeFoster(runId);
      await this.pipeline.executeDevelop(runId);
      const honeResult = await this.pipeline.executeHone(runId);

      if (honeResult.allGatesPassed) {
        this.pipeline.completeRun(runId);
        this.monthlySpend += run.lucActual.totalUsd;
      }
    } catch (err) {
      logger.error({ err, runId }, '[FACTORY] Approved FDH run failed');
      run.status = 'failed';
      run.error = err instanceof Error ? err.message : String(err);
    }

    return run;
  }

  /**
   * Reject a pending FDH run.
   */
  rejectRun(runId: string, reason: string): FDHRun {
    const run = this.pipeline.getRun(runId);
    run.status = 'failed';
    run.error = `Rejected by human: ${reason}`;
    logger.info({ runId, reason }, '[FACTORY] FDH run rejected');
    return run;
  }

  // ── Chamber Management ────────────────────────────────────

  /**
   * Create or get a chamber.
   */
  ensureChamber(chamberId: string, userId: string): ChamberState {
    let chamber = this.chambers.get(chamberId);
    if (!chamber) {
      chamber = {
        id: chamberId,
        name: `Chamber ${chamberId.slice(0, 8)}`,
        status: 'active',
        userId,
        pollIntervalMs: 30000,
        activeFdhRuns: [],
        completedFdhRuns: 0,
        totalLucSpent: 0,
        createdAt: new Date().toISOString(),
      };
      this.chambers.set(chamberId, chamber);
    }
    return chamber;
  }

  /**
   * Update chamber status.
   */
  setChamberStatus(chamberId: string, status: ChamberStatus): ChamberState {
    const chamber = this.chambers.get(chamberId);
    if (!chamber) throw new Error(`Chamber not found: ${chamberId}`);
    chamber.status = status;
    chamber.pollIntervalMs = status === 'active' ? 30000 : status === 'watching' ? 300000 : 0;
    return chamber;
  }

  getChamber(chamberId: string): ChamberState | undefined {
    return this.chambers.get(chamberId);
  }

  listChambers(): ChamberState[] {
    return Array.from(this.chambers.values());
  }

  // ── Policy Management ─────────────────────────────────────

  updatePolicy(updates: Partial<FactoryPolicy>): FactoryPolicy {
    this.policy = { ...this.policy, ...updates };
    logger.info({ policy: this.policy }, '[FACTORY] Policy updated');
    return this.policy;
  }

  getPolicy(): FactoryPolicy {
    return { ...this.policy };
  }

  // ── Status & Reporting ────────────────────────────────────

  getStatus(): FactoryStatusReport {
    const activeRuns = this.pipeline.getActiveRuns();
    const pendingApprovals = this.pipeline.getPendingApprovals();
    const recentCompletions = this.pipeline.getRecentCompletions(5);

    const activeChambers = Array.from(this.chambers.values()).filter(
      c => c.status === 'active' || c.status === 'watching'
    ).length;

    return {
      factoryEnabled: this.policy.enabled,
      status: !this.policy.enabled ? 'paused' : activeRuns.length > 0 ? 'active' : 'idle',
      activeChambers,
      activeFdhRuns: activeRuns.length,
      pendingApprovals: pendingApprovals.length,
      recentCompletions: recentCompletions.map(r => ({
        runId: r.id,
        scope: r.manifest.scope,
        completedAt: r.completedAt || r.updatedAt,
        oracleScore: r.phaseResults.hone?.oracleScore ?? 0,
      })),
      periodCost: {
        totalUsd: this.monthlySpend,
        budgetCapUsd: this.policy.monthlyBudgetCapUsd,
        utilizationPct: (this.monthlySpend / this.policy.monthlyBudgetCapUsd) * 100,
      },
      uptime: Math.floor((Date.now() - this.startedAt) / 1000),
    };
  }

  /**
   * Get a specific FDH run.
   */
  getRun(runId: string): FDHRun {
    return this.pipeline.getRun(runId);
  }

  /**
   * Get all active FDH runs.
   */
  getActiveRuns(): FDHRun[] {
    return this.pipeline.getActiveRuns();
  }

  // ── Internal ──────────────────────────────────────────────

  /**
   * Poll cycle — check for stalls, process queue, update chambers.
   */
  private pollCycle(): void {
    // 1. Check for stalled runs
    const activeRuns = this.pipeline.getActiveRuns();
    for (const run of activeRuns) {
      const lastUpdate = new Date(run.updatedAt).getTime();
      const stallThreshold = this.policy.stallTimeoutMinutes * 60 * 1000;
      if (Date.now() - lastUpdate > stallThreshold) {
        run.status = 'stalled';
        logger.warn({ runId: run.id, lastUpdate: run.updatedAt }, '[FACTORY] FDH run stalled');
      }
    }

    // 2. Process event queue if capacity available
    if (activeRuns.length < this.policy.maxConcurrentFdh && this.eventQueue.length > 0) {
      this.processEventQueue();
    }

    // 3. Log heartbeat
    if (this.totalEventsProcessed > 0 || activeRuns.length > 0) {
      logger.debug(
        { active: activeRuns.length, queued: this.eventQueue.length, processed: this.totalEventsProcessed },
        '[FACTORY] Poll cycle heartbeat'
      );
    }
  }

  /**
   * Process queued events.
   */
  private async processEventQueue(): Promise<void> {
    while (
      this.eventQueue.length > 0 &&
      this.pipeline.getActiveRuns().length < this.policy.maxConcurrentFdh
    ) {
      const event = this.eventQueue.shift();
      if (event) {
        await this.ingestEvent(event);
      }
    }
  }

  private isEventSourceAllowed(source: FactoryEventSource): boolean {
    if (this.policy.eventSources === 'all') return true;
    return this.policy.eventSources.includes(source);
  }

  private isWithinOperatingHours(): boolean {
    if (this.policy.hours === 'always') return true;
    if (this.policy.hours === 'business') {
      const hour = new Date().getHours();
      return hour >= 8 && hour < 18; // 8 AM to 6 PM
    }
    return true; // Custom hours — assume within for now
  }
}

// ── Singleton ────────────────────────────────────────────────

let factoryController: FactoryController | null = null;

export function getFactoryController(): FactoryController {
  if (!factoryController) {
    factoryController = new FactoryController();
  }
  return factoryController;
}
