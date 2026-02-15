/**
 * Hangar Event Schema — Event types for the orchestration stream
 */

export const HANGAR_EVENT_TYPES = {
  PROMPT_RECEIVED: 'PROMPT_RECEIVED',
  ROUTED_TO_PMO: 'ROUTED_TO_PMO',
  BOOMER_ANG_ASSIGNED: 'BOOMER_ANG_ASSIGNED',
  CHICKEN_HAWK_DISPATCH: 'CHICKEN_HAWK_DISPATCH',
  LIL_HAWK_EXECUTE: 'LIL_HAWK_EXECUTE',
  BUILD_PROGRESS: 'BUILD_PROGRESS',
  PROOF_ATTACHED: 'PROOF_ATTACHED',
  DEPLOY_COMPLETE: 'DEPLOY_COMPLETE',
} as const;

export type HangarEventType = (typeof HANGAR_EVENT_TYPES)[keyof typeof HANGAR_EVENT_TYPES];

export interface PromptReceivedMeta {
  prompt_text: string;
  session_id: string;
}

export interface RoutedToPmoMeta {
  pmo_office: string;
  director: string;
  confidence: number;
}

export interface BoomerAngAssignedMeta {
  boomer_ang_id: string;
  boomer_ang_name: string;
  capability: string;
}

export interface ChickenHawkDispatchMeta {
  task_packets: number;
  priority: 'low' | 'normal' | 'high';
}

export interface LilHawkExecuteMeta {
  hawk_id: string;
  task_id: string;
  plug_id?: string;
  build_node: number;
}

export interface BuildProgressMeta {
  task_id: string;
  progress: number; // 0-1
  stage: string;
}

export interface ProofAttachedMeta {
  task_id: string;
  proof_type: 'log' | 'artifact' | 'test_result';
  proof_url?: string;
}

export interface DeployCompleteMeta {
  plug_id: string;
  deploy_url?: string;
  duration_ms: number;
}

export type HangarEventMeta =
  | PromptReceivedMeta
  | RoutedToPmoMeta
  | BoomerAngAssignedMeta
  | ChickenHawkDispatchMeta
  | LilHawkExecuteMeta
  | BuildProgressMeta
  | ProofAttachedMeta
  | DeployCompleteMeta;

export interface HangarEvent {
  event_id: string;
  tenant_id: string;
  event_type: HangarEventType;
  actor: string;
  metadata: HangarEventMeta;
  timestamp: number;
}

/** Phase sequence for the orchestration flow */
export const PHASE_ORDER: HangarEventType[] = [
  'PROMPT_RECEIVED',
  'ROUTED_TO_PMO',
  'BOOMER_ANG_ASSIGNED',
  'CHICKEN_HAWK_DISPATCH',
  'LIL_HAWK_EXECUTE',
  'BUILD_PROGRESS',
  'PROOF_ATTACHED',
  'DEPLOY_COMPLETE',
];

export function getPhaseLabel(type: HangarEventType): string {
  const labels: Record<HangarEventType, string> = {
    PROMPT_RECEIVED: 'Prompt Received',
    ROUTED_TO_PMO: 'Routing to PMO',
    BOOMER_ANG_ASSIGNED: 'Boomer_Ang Assigned',
    CHICKEN_HAWK_DISPATCH: 'Dispatching Tasks',
    LIL_HAWK_EXECUTE: 'Executing',
    BUILD_PROGRESS: 'Building',
    PROOF_ATTACHED: 'Proof Attached',
    DEPLOY_COMPLETE: 'Deployed',
  };
  return labels[type];
}
