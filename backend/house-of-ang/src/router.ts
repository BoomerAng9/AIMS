/**
 * House of Ang — Skill-to-BoomerAng Router
 * Maps high-level intent/skill requests to the correct BoomerAng(s).
 */

import { BoomerAngDefinition, BoomerAngExecutionResult } from './types';
import { resolveCapabilities, getBoomerAng } from './registry';

/**
 * Capability keywords extracted from natural language intents.
 * Maps common task descriptors to registry capabilities.
 */
const INTENT_CAPABILITY_MAP: Record<string, string[]> = {
  // Research intents
  research:       ['brave_web_search', 'academic_research', 'fact_verification'],
  investigate:    ['brave_web_search', 'fact_verification', 'source_citation'],
  analyze:        ['data_extraction', 'data_transformation', 'report_generation'],

  // Build intents
  build_website:  ['page_creation', 'template_deployment', 'visual_editing'],
  build_app:      ['code_generation', 'sandbox_execution', 'debugging'],
  code:           ['code_generation', 'sandbox_execution', 'refactoring'],
  debug:          ['debugging', 'code_review'],

  // Content intents
  write_content:  ['copy_generation', 'seo_audit'],
  marketing:      ['seo_audit', 'copy_generation', 'campaign_flows', 'social_scheduling'],
  seo:            ['seo_audit', 'copy_generation'],

  // Media intents
  voice:          ['text_to_speech', 'audio_transcription'],
  video:          ['video_transcoding', 'scene_detection'],
  image:          ['image_analysis', 'ocr_extraction'],

  // Automation intents
  automate:       ['workflow_creation', 'webhook_triggers', 'scheduled_tasks'],
  integrate:      ['api_integration', 'workflow_creation'],

  // Data intents
  data_pipeline:  ['data_extraction', 'data_transformation'],
  report:         ['report_generation', 'visualization'],
  visualize:      ['visualization', 'data_transformation'],

  // Quality intents
  verify:         ['gate_verification', 'compliance_check'],
  audit:          ['security_audit', 'code_review', 'compliance_check'],

  // Complex / multi-agent
  orchestrate:    ['task_decomposition', 'agent_spawning', 'parallel_execution'],
};

/**
 * Given a list of required capabilities, resolve which BoomerAngs to invoke.
 */
export function routeByCapabilities(capabilities: string[]): {
  agents: BoomerAngDefinition[];
  gaps: string[];
} {
  const { matched, unmatched } = resolveCapabilities(capabilities);
  return { agents: matched, gaps: unmatched };
}

/**
 * Given a natural-language intent keyword, resolve BoomerAngs.
 */
export function routeByIntent(intentKeyword: string): {
  agents: BoomerAngDefinition[];
  capabilities_used: string[];
  gaps: string[];
} {
  const key = intentKeyword.toLowerCase().replace(/\s+/g, '_');
  const capabilities = INTENT_CAPABILITY_MAP[key] || [];

  if (capabilities.length === 0) {
    return { agents: [], capabilities_used: [], gaps: [key] };
  }

  const { matched, unmatched } = resolveCapabilities(capabilities);
  return { agents: matched, capabilities_used: capabilities, gaps: unmatched };
}

/**
 * Invoke a BoomerAng via its registered endpoint.
 * Returns the execution result with timing.
 */
export async function invokeBoomerAng(
  boomerangId: string,
  userId: string,
  intent: string,
  payload: Record<string, any>
): Promise<BoomerAngExecutionResult> {
  const boomerang = getBoomerAng(boomerangId);
  if (!boomerang) {
    return {
      boomerang_id: boomerangId,
      status: 'error',
      error: `Boomer_Ang "${boomerangId}" not found in registry`,
      duration_ms: 0,
    };
  }

  const start = Date.now();
  try {
    const res = await fetch(boomerang.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, intent, ...payload }),
      signal: AbortSignal.timeout(30000),
    });

    const data: any = await res.json();
    return {
      boomerang_id: boomerangId,
      status: res.ok ? 'success' : 'error',
      data: res.ok ? data : undefined,
      error: res.ok ? undefined : data.message || res.statusText,
      duration_ms: Date.now() - start,
    };
  } catch (err: any) {
    return {
      boomerang_id: boomerangId,
      status: err.name === 'TimeoutError' ? 'timeout' : 'error',
      error: err.message,
      duration_ms: Date.now() - start,
    };
  }
}

/**
 * Check health of a single BoomerAng.
 */
export async function checkHealth(boomerangId: string): Promise<{
  id: string;
  healthy: boolean;
  latencyMs: number | null;
}> {
  const boomerang = getBoomerAng(boomerangId);
  if (!boomerang) {
    return { id: boomerangId, healthy: false, latencyMs: null };
  }

  const start = Date.now();
  try {
    const res = await fetch(boomerang.health_check, {
      signal: AbortSignal.timeout(5000),
    });
    return {
      id: boomerangId,
      healthy: res.ok,
      latencyMs: Date.now() - start,
    };
  } catch {
    return {
      id: boomerangId,
      healthy: false,
      latencyMs: Date.now() - start,
    };
  }
}
