/**
 * useVerticalFlow — Phase A Step-Progression State Machine
 *
 * Manages the guided vertical conversation flow:
 *   1. Detects when a vertical is matched (via /acheevy/classify)
 *   2. Tracks the current step in the chain (1..4)
 *   3. Collects structured data at each step
 *   4. Signals when Phase A is complete and Phase B is ready
 *
 * The hook enriches outgoing chat messages with vertical context
 * so the backend LLM generates step-appropriate responses.
 */

import { useState, useCallback, useRef } from 'react';

// ---------------------------------------------------------------------------
// Types (lightweight — no dependency on aims-skills)
// ---------------------------------------------------------------------------

export interface ChainStep {
  step: number;
  name: string;
  purpose: string;
  acheevy_behavior: string;
  output_schema: Record<string, string>;
}

export interface VerticalInfo {
  id: string;
  name: string;
  category: string;
  chain_steps: ChainStep[];
  revenue_signal?: {
    service: string;
    transition_prompt: string;
  };
}

export type VerticalPhase = 'idle' | 'conversation' | 'ready_to_execute' | 'executing';

export interface VerticalFlowState {
  phase: VerticalPhase;
  vertical: VerticalInfo | null;
  currentStep: number;        // 0-indexed into chain_steps
  totalSteps: number;
  collectedData: Record<string, unknown>;
  stepHistory: Array<{ step: number; userInput: string; timestamp: string }>;
}

const INITIAL_STATE: VerticalFlowState = {
  phase: 'idle',
  vertical: null,
  currentStep: 0,
  totalSteps: 0,
  collectedData: {},
  stepHistory: [],
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

interface UseVerticalFlowOptions {
  userId: string;
  onPhaseAComplete?: (verticalId: string, collectedData: Record<string, unknown>) => void;
  onExecuteRequested?: (verticalId: string, collectedData: Record<string, unknown>) => void;
}

export function useVerticalFlow({ userId, onPhaseAComplete, onExecuteRequested }: UseVerticalFlowOptions) {
  const [state, setState] = useState<VerticalFlowState>(INITIAL_STATE);
  const cachedVerticals = useRef<Record<string, VerticalInfo>>({});

  /**
   * Fetch vertical definition from the gateway.
   */
  const fetchVertical = useCallback(async (verticalId: string): Promise<VerticalInfo | null> => {
    if (cachedVerticals.current[verticalId]) return cachedVerticals.current[verticalId];

    try {
      const res = await fetch(`/api/verticals?id=${encodeURIComponent(verticalId)}`);
      if (!res.ok) return null;
      const data = await res.json();
      const vertical = data.vertical || data;
      if (vertical?.id && vertical?.chain_steps) {
        cachedVerticals.current[verticalId] = vertical;
        return vertical;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  /**
   * Start a vertical flow when classify detects a match.
   */
  const startVertical = useCallback(async (verticalId: string, verticalData?: VerticalInfo) => {
    const vertical = verticalData || await fetchVertical(verticalId);
    if (!vertical) return;

    setState({
      phase: 'conversation',
      vertical,
      currentStep: 0,
      totalSteps: vertical.chain_steps.length,
      collectedData: {},
      stepHistory: [],
    });
  }, [fetchVertical]);

  /**
   * Record a user answer for the current step and advance.
   */
  const advanceStep = useCallback((userInput: string) => {
    setState(prev => {
      if (prev.phase !== 'conversation' || !prev.vertical) return prev;

      const currentChainStep = prev.vertical.chain_steps[prev.currentStep];
      if (!currentChainStep) return prev;

      // Store the user's input keyed by the output_schema fields
      const newData = { ...prev.collectedData };
      const schemaKeys = Object.keys(currentChainStep.output_schema);
      if (schemaKeys.length === 1) {
        newData[schemaKeys[0]] = userInput;
      } else {
        // For multi-field schemas, store as raw input under step name
        newData[`step_${currentChainStep.step}_input`] = userInput;
        // Also store under the first key for simplicity
        if (schemaKeys[0]) newData[schemaKeys[0]] = userInput;
      }

      const newHistory = [...prev.stepHistory, {
        step: prev.currentStep,
        userInput,
        timestamp: new Date().toISOString(),
      }];

      const nextStep = prev.currentStep + 1;
      const isComplete = nextStep >= prev.totalSteps;

      if (isComplete) {
        onPhaseAComplete?.(prev.vertical.id, newData);
      }

      return {
        ...prev,
        currentStep: isComplete ? prev.currentStep : nextStep,
        phase: isComplete ? 'ready_to_execute' : 'conversation',
        collectedData: newData,
        stepHistory: newHistory,
      };
    });
  }, [onPhaseAComplete]);

  /**
   * User confirms Phase B execution.
   */
  const confirmExecution = useCallback(() => {
    setState(prev => {
      if (prev.phase !== 'ready_to_execute' || !prev.vertical) return prev;
      onExecuteRequested?.(prev.vertical.id, prev.collectedData);
      return { ...prev, phase: 'executing' };
    });
  }, [onExecuteRequested]);

  /**
   * Reset flow back to idle.
   */
  const reset = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  /**
   * Get the current step's ACHEEVY behavior instruction.
   * This is injected into the system prompt for the LLM.
   */
  const getCurrentStepContext = useCallback((): string | null => {
    if (state.phase !== 'conversation' || !state.vertical) return null;
    const step = state.vertical.chain_steps[state.currentStep];
    if (!step) return null;

    return [
      `[VERTICAL: ${state.vertical.name}]`,
      `[STEP ${step.step}/${state.totalSteps}: ${step.name}]`,
      `[PURPOSE: ${step.purpose}]`,
      `[INSTRUCTION: ${step.acheevy_behavior}]`,
      state.currentStep > 0
        ? `[COLLECTED SO FAR: ${JSON.stringify(state.collectedData)}]`
        : '',
    ].filter(Boolean).join('\n');
  }, [state]);

  /**
   * Get the transition prompt for Phase B.
   */
  const getTransitionPrompt = useCallback((): string | null => {
    if (state.phase !== 'ready_to_execute' || !state.vertical) return null;
    return state.vertical.revenue_signal?.transition_prompt || null;
  }, [state]);

  return {
    state,
    startVertical,
    advanceStep,
    confirmExecution,
    reset,
    getCurrentStepContext,
    getTransitionPrompt,
    isActive: state.phase !== 'idle',
    isPhaseA: state.phase === 'conversation',
    isReadyToExecute: state.phase === 'ready_to_execute',
    isExecuting: state.phase === 'executing',
  };
}
