/**
 * Collaboration Feed Engine
 *
 * Generates a rich, persona-voiced collaboration transcript as tasks
 * flow through the AIMS chain of command. Each agent speaks in character
 * using their Role Card voice, sidebar nuggets, and communication style.
 *
 * Chain:
 *   User → ACHEEVY → Boomer_Ang → Chicken_Hawk → Squad → Lil_Hawks → Verification → Receipt → ACHEEVY → User
 *
 * "Activity breeds Activity — shipped beats perfect."
 */

import { v4 as uuidv4 } from 'uuid';
import { ALL_ROLE_CARDS, getRoleCard } from '../pmo/role-cards';
import { getPersonaForAng } from '../pmo/persona-catalog';
import type { RoleCard } from '../pmo/persona-types';
import type { AngPersona } from '../pmo/persona-types';
import type {
  PmoPipelinePacket,
  PmoClassification,
  BoomerDirective,
  SquadRecord,
  ExecutionRecord,
  VerificationResult,
  ShiftReceipt,
  N8nPipelineResponse,
} from '../n8n/types';
import type {
  FeedEntry,
  FeedEntryType,
  AgentIdentity,
  AgentRole,
  CollaborationSession,
  SessionStats,
  FeedConfig,
} from './types';
import { DEFAULT_FEED_CONFIG } from './types';

// ---------------------------------------------------------------------------
// Agent Identity Builders
// ---------------------------------------------------------------------------

const SYSTEM_AGENT: AgentIdentity = {
  displayName: 'A.I.M.S.',
  role: 'system',
  avatar: 'system',
};

const ACHEEVY_AGENT: AgentIdentity = {
  displayName: 'ACHEEVY',
  kunya: 'Orchestrator',
  role: 'acheevy',
  avatar: 'brain',
};

const CHICKEN_HAWK_AGENT: AgentIdentity = {
  displayName: 'Chicken_Hawk',
  kunya: 'Shift Commander',
  role: 'chicken_hawk',
  avatar: 'hawk',
};

function buildBoomerIdentity(
  classification: PmoClassification,
  roleCard?: RoleCard,
  persona?: AngPersona,
): AgentIdentity {
  if (roleCard) {
    return {
      displayName: roleCard.identity.displayName,
      kunya: roleCard.identity.kunya,
      systemHandle: roleCard.identity.systemHandle,
      benchLevel: roleCard.identity.benchLevel,
      role: 'boomer_ang',
      pmoOffice: roleCard.identity.pmoOffice,
      avatar: persona?.avatar,
    };
  }
  return {
    displayName: classification.director as string,
    role: 'boomer_ang',
    pmoOffice: classification.pmoOffice,
  };
}

function buildLilHawkIdentity(handle: string, designation?: string): AgentIdentity {
  return {
    displayName: handle,
    role: 'lil_hawk',
    kunya: designation,
    avatar: 'hawk-small',
  };
}

function buildVerifierIdentity(): AgentIdentity {
  return {
    displayName: 'Proof_Ang',
    kunya: 'Final Word',
    systemHandle: 'dtpmo-proof',
    benchLevel: 'EXPERT',
    role: 'verifier',
    pmoOffice: 'DT-PMO — Quality & Verification',
    avatar: 'checkmark',
  };
}

function buildReceiptIdentity(): AgentIdentity {
  return {
    displayName: 'Sentinel_Ang',
    kunya: 'Red Rope',
    systemHandle: 'dtpmo-sentinel',
    benchLevel: 'EXPERT',
    role: 'receipt',
    pmoOffice: 'DT-PMO — Governance, Risk & KYB',
    avatar: 'lock',
  };
}

// ---------------------------------------------------------------------------
// Feed Entry Factory
// ---------------------------------------------------------------------------

function entry(
  speaker: AgentIdentity,
  type: FeedEntryType,
  message: string,
  depth: number = 0,
  metadata?: Record<string, unknown>,
  group?: string,
): FeedEntry {
  return {
    id: uuidv4().slice(0, 12),
    timestamp: new Date().toISOString(),
    speaker,
    type,
    message,
    depth,
    metadata,
    group,
  };
}

// ---------------------------------------------------------------------------
// Persona Voice Helpers — pick contextual nuggets
// ---------------------------------------------------------------------------

function pickNugget(roleCard: RoleCard): string {
  const nuggets = roleCard.communication.sidebarNuggets;
  return nuggets[Math.floor(Math.random() * nuggets.length)];
}

function pickCatchphrase(persona: AngPersona): string {
  return persona.backstory.catchphrase;
}

// ---------------------------------------------------------------------------
// Director → Role Card / Persona Resolution
// ---------------------------------------------------------------------------

/** Resolve director ID to a role card + persona. */
function resolveDirector(directorId: string): { roleCard?: RoleCard; persona?: AngPersona } {
  // Map director IDs to system handles
  const directorHandleMap: Record<string, string> = {
    'Betty-Ann_Ang': 'hr-betty-ann',
    'Astra_Ang': 'dtpmo-astra',
    'Boomer_CTO': 'dtpmo-blueprint',   // fallback
    'Boomer_CFO': 'dtpmo-ledger',      // fallback
    'Boomer_COO': 'dtpmo-atlas',       // fallback
    'Boomer_CMO': 'dtpmo-astra',       // fallback
    'Boomer_CDO': 'dtpmo-astra',       // fallback
    'Boomer_CPO': 'dtpmo-astra',       // fallback
  };

  const handle = directorHandleMap[directorId];
  const roleCard = handle ? getRoleCard(handle) : undefined;

  // Persona lookup by registry ID
  const registryIdMap: Record<string, string> = {
    'Betty-Ann_Ang': 'betty_ann_ang',
    'Astra_Ang': 'astra_ang',
  };
  const registryId = registryIdMap[directorId];
  const persona = registryId ? getPersonaForAng(registryId) : undefined;

  return { roleCard, persona };
}

// ---------------------------------------------------------------------------
// Feed Generator — produces the collaboration transcript
// ---------------------------------------------------------------------------

export class CollaborationFeedGenerator {
  private config: FeedConfig;
  private nuggetCount = 0;

  constructor(config?: Partial<FeedConfig>) {
    this.config = { ...DEFAULT_FEED_CONFIG, ...config };
  }

  /**
   * Generate a full collaboration feed from a completed pipeline packet.
   * This is the primary public API — give it the packet, get the transcript.
   */
  generateFromPacket(packet: PmoPipelinePacket): CollaborationSession {
    const feed: FeedEntry[] = [];
    const sessionId = `collab-${packet.requestId.slice(0, 8)}`;
    this.nuggetCount = 0;

    // Resolve director persona
    const director = packet.boomerDirective?.director as string;
    const { roleCard: directorCard, persona: directorPersona } = resolveDirector(director);
    const directorIdentity = buildBoomerIdentity(packet.classification, directorCard, directorPersona);

    // ── Phase 1: Intake ──────────────────────────────────────
    feed.push(...this.generateIntake(packet));

    // ── Phase 2: Classification ──────────────────────────────
    feed.push(...this.generateClassification(packet.classification));

    // ── Phase 3: Boomer_Ang Directive ────────────────────────
    if (packet.boomerDirective) {
      feed.push(...this.generateDirective(
        directorIdentity, directorCard, directorPersona,
        packet.boomerDirective, packet.classification,
      ));
    }

    // ── Phase 4: Chicken_Hawk — Shift + Squad Assembly ───────
    if (packet.shift && packet.squad) {
      feed.push(...this.generateSquadAssembly(packet.shift.shiftId, packet.squad));
    }

    // ── Phase 5: Wave Execution ──────────────────────────────
    if (packet.execution) {
      feed.push(...this.generateExecution(packet.execution, packet.squad!));
    }

    // ── Phase 6: Verification ────────────────────────────────
    if (packet.verification) {
      feed.push(...this.generateVerification(packet.verification));
    }

    // ── Phase 7: Receipt ─────────────────────────────────────
    if (packet.receipt) {
      feed.push(...this.generateReceipt(packet.receipt));
    }

    // ── Phase 8: Debrief to User ─────────────────────────────
    feed.push(...this.generateDebrief(packet));

    // Build session
    const stats = this.computeStats(feed, packet);

    return {
      sessionId,
      userName: this.config.userName,
      projectLabel: this.config.projectLabel,
      startedAt: packet.timestamp,
      completedAt: packet.chainOfCommand.completedAt,
      feed,
      chainPosition: {
        step: packet.chainOfCommand.step,
        current: packet.chainOfCommand.current,
        next: packet.chainOfCommand.next,
      },
      status: packet.receipt?.shiftStatus === 'failed' ? 'failed' : 'completed',
      stats,
    };
  }

  // ─── Phase Generators ────────────────────────────────────────────────────

  private generateIntake(packet: PmoPipelinePacket): FeedEntry[] {
    const entries: FeedEntry[] = [];
    const { userName, projectLabel } = this.config;

    entries.push(entry(
      SYSTEM_AGENT,
      'intake',
      `New request received from ${userName} for ${projectLabel}.`,
      0,
      { requestId: packet.requestId, userId: packet.userId },
    ));

    entries.push(entry(
      ACHEEVY_AGENT,
      'intake',
      `Got it, ${userName}. "${packet.message}" — let me route this through the right team.`,
      0,
    ));

    if (this.config.showThinking) {
      entries.push(entry(
        ACHEEVY_AGENT,
        'thinking',
        `Analyzing intent... classifying PMO office, execution lane, and complexity band.`,
        1,
        { group: 'classification' },
      ));
    }

    return entries;
  }

  private generateClassification(classification: PmoClassification): FeedEntry[] {
    const entries: FeedEntry[] = [];

    entries.push(entry(
      ACHEEVY_AGENT,
      'classification',
      `Routed to **${classification.pmoOffice}** (${classification.executionLane} lane). Director: **${classification.director}**. Confidence: ${(classification.confidence * 100).toFixed(0)}%.`,
      0,
      {
        pmoOffice: classification.pmoOffice,
        director: classification.director,
        lane: classification.executionLane,
        confidence: classification.confidence,
        keywords: classification.matchedKeywords,
      },
      'classification',
    ));

    entries.push(entry(
      ACHEEVY_AGENT,
      'handoff',
      `Handing off to ${classification.director}...`,
      0,
    ));

    return entries;
  }

  private generateDirective(
    directorIdentity: AgentIdentity,
    roleCard: RoleCard | undefined,
    persona: AngPersona | undefined,
    directive: BoomerDirective,
    classification: PmoClassification,
  ): FeedEntry[] {
    const entries: FeedEntry[] = [];
    const groupId = 'directive';

    // Director receives the task
    entries.push(entry(
      directorIdentity,
      'directive',
      `Received. This falls under my jurisdiction — ${directorIdentity.pmoOffice || classification.pmoOffice}.`,
      0,
      { group: groupId },
    ));

    // Thinking about scope
    if (this.config.showThinking) {
      entries.push(entry(
        directorIdentity,
        'thinking',
        `Scope check: ${directive.inScope ? 'In scope' : 'Out of scope'}. Authority level: ${directive.authority}. Requires ${directive.squadSize} Lil_Hawks across ${directive.crewSpecialties.length} specialties.`,
        1,
        { group: groupId },
      ));
    }

    // Execution plan
    entries.push(entry(
      directorIdentity,
      'directive',
      `Execution plan (${directive.executionSteps.length} steps):`,
      0,
      { steps: directive.executionSteps, group: groupId },
    ));

    for (let i = 0; i < directive.executionSteps.length; i++) {
      entries.push(entry(
        directorIdentity,
        'directive',
        `${i + 1}. ${directive.executionSteps[i]}`,
        1,
        { stepIndex: i, group: groupId },
      ));
    }

    // Crew specialties needed
    entries.push(entry(
      directorIdentity,
      'directive',
      `Crew specialties needed: ${directive.crewSpecialties.join(', ')}. Deploying squad of ${directive.squadSize}.`,
      0,
    ));

    // Persona nugget (overlay-safe snippet)
    if (this.config.showNuggets && roleCard && this.nuggetCount < this.config.maxNuggets) {
      const nugget = pickNugget(roleCard);
      entries.push(entry(
        directorIdentity,
        'nugget',
        nugget,
        0,
      ));
      this.nuggetCount++;
    }

    // Handoff to Chicken_Hawk
    entries.push(entry(
      directorIdentity,
      'handoff',
      `Chicken_Hawk — spawn shift. Here's the work order.`,
      0,
    ));

    return entries;
  }

  private generateSquadAssembly(shiftId: string, squad: SquadRecord): FeedEntry[] {
    const entries: FeedEntry[] = [];
    const groupId = `squad-${shiftId}`;

    entries.push(entry(
      CHICKEN_HAWK_AGENT,
      'squad_assembly',
      `Shift **${shiftId}** spawned. Assembling Squad **${squad.squadId}** — ${squad.size} Lil_Hawks.`,
      0,
      { shiftId, squadId: squad.squadId, squadSize: squad.size, group: groupId },
    ));

    if (this.config.showThinking) {
      entries.push(entry(
        CHICKEN_HAWK_AGENT,
        'thinking',
        `Matching crew specialties to available Lil_Hawks... optimizing for parallel wave execution.`,
        1,
        { group: groupId },
      ));
    }

    for (const member of squad.members) {
      entries.push(entry(
        CHICKEN_HAWK_AGENT,
        'squad_assembly',
        `Assigned **${member.personaHandle}** (${member.designation}, ${member.careerLevel}) — ${member.assignedCapability}`,
        1,
        {
          lilHawk: member.personaHandle,
          designation: member.designation,
          careerLevel: member.careerLevel,
          group: groupId,
        },
      ));
    }

    entries.push(entry(
      CHICKEN_HAWK_AGENT,
      'handoff',
      `Squad assembled. All Lil_Hawks briefed. Executing in waves.`,
      0,
    ));

    return entries;
  }

  private generateExecution(execution: ExecutionRecord, squad: SquadRecord): FeedEntry[] {
    const entries: FeedEntry[] = [];

    for (const wave of execution.waveResults) {
      const groupId = `wave-${wave.waveNumber}`;

      entries.push(entry(
        CHICKEN_HAWK_AGENT,
        'execution',
        `Wave ${wave.waveNumber}/${execution.estimatedWaves} starting...`,
        0,
        { waveNumber: wave.waveNumber, group: groupId },
      ));

      if (this.config.showWaveDetail) {
        for (const step of wave.stepResults) {
          const lilHawkId = buildLilHawkIdentity(step.lilHawk, step.description);
          const statusIcon = step.status === 'completed' ? 'DONE' : 'FAIL';

          entries.push(entry(
            lilHawkId,
            'execution',
            `[${statusIcon}] ${step.description} (${step.durationMs}ms)`,
            1,
            {
              stepIndex: step.stepIndex,
              status: step.status,
              durationMs: step.durationMs,
              group: groupId,
            },
          ));
        }
      }

      // Wave summary
      const waveStatus = wave.result === 'success' ? 'All steps completed' :
        wave.result === 'partial' ? `${wave.stepsCompleted} completed, ${wave.stepsFailed} failed` :
        'Wave failed';

      entries.push(entry(
        CHICKEN_HAWK_AGENT,
        'wave_summary',
        `Wave ${wave.waveNumber} result: ${waveStatus}. (${wave.durationMs}ms)`,
        0,
        {
          waveNumber: wave.waveNumber,
          result: wave.result,
          completed: wave.stepsCompleted,
          failed: wave.stepsFailed,
          durationMs: wave.durationMs,
          group: groupId,
        },
      ));
    }

    // Overall execution summary
    entries.push(entry(
      CHICKEN_HAWK_AGENT,
      'handoff',
      `Execution complete. ${execution.completedSteps}/${execution.totalSteps} steps done across ${execution.waveResults.length} waves. Total: ${execution.totalDurationMs}ms. Sending to verification.`,
      0,
      {
        completedSteps: execution.completedSteps,
        failedSteps: execution.failedSteps,
        totalDurationMs: execution.totalDurationMs,
      },
    ));

    return entries;
  }

  private generateVerification(verification: VerificationResult): FeedEntry[] {
    const entries: FeedEntry[] = [];
    const verifier = buildVerifierIdentity();
    const groupId = 'verification';

    entries.push(entry(
      verifier,
      'verification',
      `Verification gate running. ${verification.checksRun} checks to evaluate.`,
      0,
      { group: groupId },
    ));

    if (this.config.showVerificationDetail) {
      for (const check of verification.checks) {
        const icon = check.passed ? 'PASS' : 'FAIL';
        entries.push(entry(
          verifier,
          'verification',
          `[${icon}] ${check.gate}: ${check.detail}`,
          1,
          { gate: check.gate, passed: check.passed, group: groupId },
        ));
      }
    }

    const verdict = verification.passed
      ? `Verification PASSED. ${verification.checksPassed}/${verification.checksRun} gates green.`
      : `Verification REVIEW REQUIRED. ${verification.checksPassed}/${verification.checksRun} gates passed.`;

    entries.push(entry(
      verifier,
      'verification',
      verdict,
      0,
      { passed: verification.passed, group: groupId },
    ));

    // Nugget from Proof_Ang
    if (this.config.showNuggets && this.nuggetCount < this.config.maxNuggets) {
      const proofCard = getRoleCard('dtpmo-proof');
      if (proofCard) {
        entries.push(entry(
          verifier,
          'nugget',
          pickNugget(proofCard),
          0,
        ));
        this.nuggetCount++;
      }
    }

    entries.push(entry(
      verifier,
      'handoff',
      `Sealing receipt...`,
      0,
    ));

    return entries;
  }

  private generateReceipt(receipt: ShiftReceipt): FeedEntry[] {
    const entries: FeedEntry[] = [];
    const sealer = buildReceiptIdentity();

    entries.push(entry(
      sealer,
      'receipt',
      `Receipt **${receipt.receiptId}** sealed for shift ${receipt.shiftId}. Status: **${receipt.shiftStatus.toUpperCase()}**.`,
      0,
      {
        receiptId: receipt.receiptId,
        hash: receipt.receiptHash,
        shiftId: receipt.shiftId,
        status: receipt.shiftStatus,
      },
    ));

    entries.push(entry(
      sealer,
      'receipt',
      `Hash: ${receipt.receiptHash}. Audit trail locked.`,
      1,
    ));

    // Nugget from Sentinel_Ang
    if (this.config.showNuggets && this.nuggetCount < this.config.maxNuggets) {
      const sentinelCard = getRoleCard('dtpmo-sentinel');
      if (sentinelCard) {
        entries.push(entry(
          sealer,
          'nugget',
          pickNugget(sentinelCard),
          0,
        ));
        this.nuggetCount++;
      }
    }

    return entries;
  }

  private generateDebrief(packet: PmoPipelinePacket): FeedEntry[] {
    const entries: FeedEntry[] = [];
    const { userName, projectLabel } = this.config;

    const receipt = packet.receipt;
    const exec = packet.execution;
    const status = receipt?.shiftStatus || 'completed';

    entries.push(entry(
      ACHEEVY_AGENT,
      'handoff',
      `Pipeline complete. Preparing debrief for ${userName}.`,
      0,
    ));

    // Build a natural-language summary
    const summary = status === 'failed'
      ? `${userName}, the team ran into issues on ${projectLabel}. ${exec?.failedSteps || 0} steps failed — I've flagged them for review.`
      : status === 'completed_with_warnings'
      ? `${userName}, ${projectLabel} is done with some notes. ${exec?.completedSteps}/${exec?.totalSteps} steps completed, but verification flagged areas to review.`
      : `${userName}, ${projectLabel} is complete. ${exec?.completedSteps}/${exec?.totalSteps} steps shipped across ${exec?.waveResults.length} waves. All verification gates passed.`;

    entries.push(entry(
      ACHEEVY_AGENT,
      'debrief',
      summary,
      0,
      {
        status,
        stepsCompleted: exec?.completedSteps,
        totalSteps: exec?.totalSteps,
        waves: exec?.waveResults.length,
        receiptId: receipt?.receiptId,
      },
    ));

    if (receipt) {
      entries.push(entry(
        ACHEEVY_AGENT,
        'debrief',
        `Receipt: ${receipt.receiptId} | Duration: ${receipt.finalMetrics.totalDurationMs}ms | Squad: ${receipt.finalMetrics.lilHawksUsed} Lil_Hawks`,
        1,
      ));
    }

    return entries;
  }

  // ─── Stats ───────────────────────────────────────────────────────────────

  private computeStats(feed: FeedEntry[], packet: PmoPipelinePacket): SessionStats {
    const agentsSeen = [...new Set(feed.map(e => e.speaker.displayName))];
    const nuggetsDelivered = feed.filter(e => e.type === 'nugget').length;
    const exec = packet.execution;

    return {
      totalEntries: feed.length,
      agentsSeen,
      nuggetsDelivered,
      stepsCompleted: exec?.completedSteps || 0,
      stepsFailed: exec?.failedSteps || 0,
      totalDurationMs: exec?.totalDurationMs || 0,
      pmoOffice: packet.classification.pmoOffice,
      director: packet.boomerDirective?.director,
      executionLane: packet.classification.executionLane,
      shiftStatus: packet.receipt?.shiftStatus,
    };
  }
}
