/**
 * Hangar Actor State Machine — Event-triggered transitions only
 */

export const ACTOR_STATES = {
  IDLE: 'IDLE',
  LISTENING: 'LISTENING',
  ASSIGNED: 'ASSIGNED',
  EXECUTING: 'EXECUTING',
  RETURNING: 'RETURNING',
  COMPLETE: 'COMPLETE',
} as const;

export type ActorStateType = (typeof ACTOR_STATES)[keyof typeof ACTOR_STATES];

export interface ActorState {
  current: ActorStateType;
  previous: ActorStateType | null;
  enteredAt: number;
  taskId: string | null;
}

type TransitionMap = Partial<Record<string, ActorStateType>>;

/** Valid transitions per state. Key = event_type that triggers the transition */
const TRANSITIONS: Record<ActorStateType, TransitionMap> = {
  IDLE: {
    PROMPT_RECEIVED: 'LISTENING',
    BOOMER_ANG_ASSIGNED: 'ASSIGNED',
    CHICKEN_HAWK_DISPATCH: 'ASSIGNED',
    LIL_HAWK_EXECUTE: 'EXECUTING',
  },
  LISTENING: {
    ROUTED_TO_PMO: 'ASSIGNED',
    RESET: 'IDLE',
  },
  ASSIGNED: {
    CHICKEN_HAWK_DISPATCH: 'EXECUTING',
    LIL_HAWK_EXECUTE: 'EXECUTING',
    RESET: 'IDLE',
  },
  EXECUTING: {
    BUILD_PROGRESS: 'EXECUTING', // stays in executing
    PROOF_ATTACHED: 'RETURNING',
    DEPLOY_COMPLETE: 'COMPLETE',
    RESET: 'IDLE',
  },
  RETURNING: {
    DEPLOY_COMPLETE: 'COMPLETE',
    RESET: 'IDLE',
  },
  COMPLETE: {
    RESET: 'IDLE',
    PROMPT_RECEIVED: 'LISTENING', // new cycle
  },
};

export function createActorState(taskId?: string): ActorState {
  return {
    current: 'IDLE',
    previous: null,
    enteredAt: Date.now(),
    taskId: taskId ?? null,
  };
}

export function transitionActor(state: ActorState, eventType: string): ActorState {
  const validTransitions = TRANSITIONS[state.current];
  const nextState = validTransitions?.[eventType];

  if (!nextState) return state; // No valid transition — stay put

  return {
    current: nextState,
    previous: state.current,
    enteredAt: Date.now(),
    taskId: state.taskId,
  };
}

export function canTransition(state: ActorState, eventType: string): boolean {
  return Boolean(TRANSITIONS[state.current]?.[eventType]);
}

export function getStateDuration(state: ActorState): number {
  return Date.now() - state.enteredAt;
}
