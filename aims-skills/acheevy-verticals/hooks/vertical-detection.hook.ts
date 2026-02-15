/**
 * Vertical Detection Hook — Lifecycle Manager
 *
 * Priority: 95 (runs after identity guard, before conversation state)
 *
 * Lifecycle points:
 *   before_acheevy_response — Inject vertical mode, persona, digital twin into prompt
 *   after_user_message — Detect verticals, advance chains, trigger execution
 *
 * Flow:
 *   User message → detect business intent → match vertical → create session
 *   → advance chain steps → collect data → confirm execution → dispatch pipeline
 *
 * Integrates:
 *   - Personality selector (buildSystemPrompt with verticalMode + personaId)
 *   - Digital Twin Rolodex (auto-match + explicit request handling)
 *   - Execution Engine (executeVertical for Phase B)
 *   - A2A Task Manager (SSE streaming for execution results)
 *
 * "Activity breeds Activity — shipped beats perfect."
 */

import type { VerticalSession, VerticalPhase } from '../types';
import { matchVertical, detectBusinessIntent, getVertical } from '../vertical-definitions';
import { findBestTwin, findTwinById, buildTwinPrompt } from '../digital-twin-rolodex';
import { executeVertical } from '../execution-engine';
import { BUSINESS_BUILDER_INSTRUCTIONS } from '../instructions/business-builder.instructions';
import { GROWTH_MODE_INSTRUCTIONS } from '../instructions/growth-mode.instructions';

// ---------------------------------------------------------------------------
// Session Store (in-memory, keyed by userId)
// ---------------------------------------------------------------------------

const sessions = new Map<string, VerticalSession>();

/**
 * Get the active vertical session for a user.
 */
export function getSession(userId: string): VerticalSession | undefined {
  return sessions.get(userId);
}

/**
 * Clear a user's vertical session.
 */
export function clearSession(userId: string): void {
  sessions.delete(userId);
}

// ---------------------------------------------------------------------------
// Execution Confirmation Patterns
// ---------------------------------------------------------------------------

const CONFIRM_PATTERNS = [
  /^(yes|yeah|yep|yea|y|sure|ok|okay|go|do it|let'?s? go|build it|make it|execute|run it|ship it)/i,
  /ready/i,
  /let'?s? (do|build|make|go|start|execute|ship)/i,
  /build (it|this|that)/i,
  /make (it|this) (real|happen)/i,
];

function isExecutionConfirmation(message: string): boolean {
  return CONFIRM_PATTERNS.some(p => p.test(message.trim()));
}

// ---------------------------------------------------------------------------
// Digital Twin Request Detection
// ---------------------------------------------------------------------------

const TWIN_REQUEST_PATTERNS = [
  /what\s*would\s*(\w+)\s*say/i,
  /ask\s*(\w+)/i,
  /channel\s*(\w+)/i,
  /(\w+)\s*mode/i,
  /like\s*(\w+)\s*would/i,
];

function detectTwinRequest(message: string): string | null {
  for (const pattern of TWIN_REQUEST_PATTERNS) {
    const match = message.match(pattern);
    if (match && match[1]) {
      return match[1].toLowerCase();
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Persona Detection
// ---------------------------------------------------------------------------

const PERSONA_PATTERNS: Record<string, RegExp[]> = {
  'deion': [/coach\s*prime/i, /deion/i, /prime\s*time/i],
  'mcconaughey': [/mcconaughey/i, /alright\s*alright/i, /matthew/i],
  'acheevy': [/acheevy/i, /default/i, /normal/i],
};

function detectPersonaPreference(message: string): string | null {
  for (const [personaId, patterns] of Object.entries(PERSONA_PATTERNS)) {
    if (patterns.some(p => p.test(message))) {
      return personaId;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// HOOK: before_acheevy_response
// ---------------------------------------------------------------------------

/**
 * Called before ACHEEVY generates a response.
 * Injects vertical mode, persona, and digital twin context into the prompt.
 *
 * Returns additional context to merge into buildSystemPrompt().
 */
export function beforeAcheevyResponse(context: {
  userId: string;
  currentPrompt: string;
}): {
  verticalMode?: 'business-builder' | 'growth-mode';
  personaId?: string;
  additionalContext?: string;
} {
  const session = sessions.get(context.userId);
  if (!session) return {};

  const vertical = getVertical(session.verticalId);
  if (!vertical) return {};

  const result: {
    verticalMode?: 'business-builder' | 'growth-mode';
    personaId?: string;
    additionalContext?: string;
  } = {
    verticalMode: vertical.acheevy_mode,
    personaId: session.activePersonaId || 'acheevy',
  };

  // Build additional context based on current phase
  const contextParts: string[] = [];

  // Inject vertical mode instructions
  if (vertical.acheevy_mode === 'business-builder') {
    contextParts.push(BUSINESS_BUILDER_INSTRUCTIONS);
  } else {
    contextParts.push(GROWTH_MODE_INSTRUCTIONS);
  }

  // Inject current step instructions
  if (session.phase === 'conversation') {
    const currentStep = vertical.chain_steps[session.currentStep - 1];
    if (currentStep) {
      contextParts.push(`\n[CURRENT STEP: ${currentStep.step}/${vertical.chain_steps.length} — ${currentStep.name}]`);
      contextParts.push(`Purpose: ${currentStep.purpose}`);
      contextParts.push(`Behavior: ${currentStep.acheevy_behavior}`);

      // If on expert step (typically step 4), inject digital twin
      if (currentStep.name.toLowerCase().includes('expert') && session.activeTwinId) {
        const twin = findTwinById(session.activeTwinId);
        if (twin) {
          const scenario = JSON.stringify(session.collectedData).slice(0, 300);
          contextParts.push(buildTwinPrompt(twin, scenario));
        }
      }
    }
  }

  // If in ready_to_execute phase, inject transition prompt
  if (session.phase === 'ready_to_execute') {
    contextParts.push(`\n[PHASE: READY TO EXECUTE]`);
    contextParts.push(`The user has completed all chain steps. Present the execution confirmation.`);
    contextParts.push(`Transition: "${vertical.revenue_signal.transition_prompt}"`);
    contextParts.push(`If they confirm, I will execute the pipeline immediately.`);
  }

  // Collected data context
  if (Object.keys(session.collectedData).length > 0) {
    contextParts.push(`\n[COLLECTED DATA SO FAR]`);
    for (const [key, value] of Object.entries(session.collectedData)) {
      const displayValue = Array.isArray(value) ? value.join(', ') : String(value || '');
      contextParts.push(`${key}: ${displayValue}`);
    }
  }

  result.additionalContext = contextParts.join('\n');
  return result;
}

// ---------------------------------------------------------------------------
// HOOK: after_user_message
// ---------------------------------------------------------------------------

/**
 * Called after the user sends a message.
 * Handles: vertical detection, session creation, chain advancement,
 * persona/twin switching, and execution triggering.
 *
 * Returns an action for the caller to take.
 */
export async function afterUserMessage(context: {
  userId: string;
  sessionId: string;
  message: string;
}): Promise<{
  action: 'none' | 'session_created' | 'step_advanced' | 'ready_to_execute' | 'executing' | 'completed' | 'failed';
  session?: VerticalSession;
  executionResult?: { taskId: string; status: string };
  message?: string;
}> {
  const { userId, sessionId, message } = context;
  const existingSession = sessions.get(userId);

  // ── No active session: try to detect a vertical ─────────────────────────
  if (!existingSession) {
    const vertical = matchVertical(message);
    if (!vertical && !detectBusinessIntent(message)) {
      return { action: 'none' };
    }

    // If business intent but no specific vertical match, default to idea-generator
    const matchedVertical = vertical || getVertical('idea-generator')!;

    // Detect persona preference
    const personaId = detectPersonaPreference(message) || 'acheevy';

    // Auto-match digital twin for expert step
    const bestTwin = findBestTwin(matchedVertical.expert_domain);

    // Create session
    const newSession: VerticalSession = {
      verticalId: matchedVertical.id,
      userId,
      sessionId,
      phase: 'conversation',
      currentStep: 1,
      collectedData: {},
      activePersonaId: personaId,
      activeTwinId: bestTwin?.id,
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    sessions.set(userId, newSession);
    return {
      action: 'session_created',
      session: newSession,
      message: `Vertical activated: ${matchedVertical.name}`,
    };
  }

  // ── Active session: handle based on phase ───────────────────────────────

  // Check for persona switch request
  const personaPref = detectPersonaPreference(message);
  if (personaPref) {
    existingSession.activePersonaId = personaPref;
  }

  // Check for explicit digital twin request
  const twinRequest = detectTwinRequest(message);
  if (twinRequest) {
    const requestedTwin = findTwinById(twinRequest);
    if (requestedTwin) {
      existingSession.activeTwinId = requestedTwin.id;
    }
  }

  // ── CONVERSATION PHASE: Advance chain steps ─────────────────────────────
  if (existingSession.phase === 'conversation') {
    const vertical = getVertical(existingSession.verticalId);
    if (!vertical) return { action: 'none' };

    const currentStep = vertical.chain_steps[existingSession.currentStep - 1];
    if (!currentStep) return { action: 'none' };

    // Extract data from user response based on output_schema
    // The actual extraction is done by ACHEEVY's LLM — we store the raw message
    // and let the conversational AI parse it.
    const stepKey = `step_${existingSession.currentStep}_response`;
    existingSession.collectedData[stepKey] = message;

    // Also try to extract named fields from the output_schema
    for (const key of Object.keys(currentStep.output_schema)) {
      if (!existingSession.collectedData[key]) {
        // Store the user's response under the schema key if not yet filled
        // ACHEEVY's LLM will refine this during conversation
        existingSession.collectedData[key] = message;
      }
    }

    // Advance to next step
    existingSession.currentStep += 1;
    existingSession.updatedAt = new Date().toISOString();

    // Check if all chain steps are complete
    if (existingSession.currentStep > vertical.chain_steps.length) {
      existingSession.phase = 'ready_to_execute';
      return {
        action: 'ready_to_execute',
        session: existingSession,
        message: `All ${vertical.chain_steps.length} steps complete. Awaiting execution confirmation.`,
      };
    }

    // If next step is expert step, auto-match digital twin
    const nextStep = vertical.chain_steps[existingSession.currentStep - 1];
    if (nextStep?.name.toLowerCase().includes('expert')) {
      const twin = findBestTwin(
        vertical.expert_domain,
        existingSession.collectedData.industry as string,
      );
      if (twin) {
        existingSession.activeTwinId = twin.id;
      }
    }

    return {
      action: 'step_advanced',
      session: existingSession,
      message: `Advanced to step ${existingSession.currentStep}/${vertical.chain_steps.length}`,
    };
  }

  // ── READY TO EXECUTE: Check for confirmation ────────────────────────────
  if (existingSession.phase === 'ready_to_execute') {
    if (!isExecutionConfirmation(message)) {
      // User didn't confirm — keep waiting or let them add more context
      return {
        action: 'none',
        session: existingSession,
      };
    }

    const vertical = getVertical(existingSession.verticalId);
    if (!vertical) return { action: 'failed', message: 'Vertical not found' };

    // Trigger Phase B execution
    existingSession.phase = 'executing';
    existingSession.updatedAt = new Date().toISOString();

    try {
      const result = await executeVertical(
        vertical,
        existingSession.collectedData,
        userId,
        sessionId,
      );

      existingSession.executionTaskId = result.taskId;

      if (result.status === 'failed') {
        existingSession.phase = 'ready_to_execute'; // Allow retry
        return {
          action: 'failed',
          session: existingSession,
          message: result.error || 'Execution failed',
        };
      }

      return {
        action: 'executing',
        session: existingSession,
        executionResult: { taskId: result.taskId, status: result.status },
        message: `Pipeline dispatched. Task ID: ${result.taskId}`,
      };
    } catch (err) {
      existingSession.phase = 'ready_to_execute'; // Allow retry
      return {
        action: 'failed',
        session: existingSession,
        message: err instanceof Error ? err.message : 'Execution failed',
      };
    }
  }

  // ── EXECUTING PHASE: Check task status ──────────────────────────────────
  if (existingSession.phase === 'executing') {
    // Task status is checked via A2A SSE stream, not polling here.
    // The hook just reports the current state.
    return {
      action: 'executing',
      session: existingSession,
      message: `Pipeline still executing. Task: ${existingSession.executionTaskId}`,
    };
  }

  return { action: 'none' };
}

// ---------------------------------------------------------------------------
// Utility: Update collected data from ACHEEVY's extracted fields
// ---------------------------------------------------------------------------

/**
 * Called by ACHEEVY's orchestrator to update session data
 * with properly extracted fields (LLM-parsed from user messages).
 */
export function updateCollectedData(
  userId: string,
  data: Record<string, unknown>,
): void {
  const session = sessions.get(userId);
  if (session) {
    Object.assign(session.collectedData, data);
    session.updatedAt = new Date().toISOString();
  }
}

/**
 * Mark a session as completed (called when task finishes).
 */
export function completeSession(userId: string): void {
  const session = sessions.get(userId);
  if (session) {
    session.phase = 'completed';
    session.updatedAt = new Date().toISOString();
  }
}

// ---------------------------------------------------------------------------
// Hook Registration Object
// ---------------------------------------------------------------------------

export const verticalDetectionHook = {
  name: 'vertical-detection',
  priority: 95,
  events: ['before_acheevy_response', 'after_user_message'],
  beforeAcheevyResponse,
  afterUserMessage,
  getSession,
  clearSession,
  updateCollectedData,
  completeSession,
};

export default verticalDetectionHook;
