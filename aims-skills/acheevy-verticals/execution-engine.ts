/**
 * ACHEEVY Vertical Execution Engine — Re-export Shim
 *
 * The actual execution engine lives at:
 *   backend/uef-gateway/src/acheevy/execution-engine.ts
 *
 * It was moved there because it imports 8+ gateway-internal modules
 * (Oracle, ByteRover, LUC, A2A, LLM Gateway, PREP_SQUAD, bench-scoring).
 * TypeScript's rootDir constraint requires those imports to resolve
 * within the gateway's src/ directory.
 *
 * This file re-exports the types so the barrel export at
 * aims-skills/acheevy-verticals/index.ts still works.
 *
 * "Activity breeds Activity — shipped beats perfect."
 */

// Re-export types that other aims-skills files use
export type {
  VerticalDefinition,
  ExecutionBlueprint,
  DynamicPipeline,
  VerticalExecutionResult,
  StepScoreRecord,
} from './types';

// Placeholder exports for backward compatibility
// Real execution lives in backend/uef-gateway/src/acheevy/execution-engine.ts

export async function generateDynamicSteps(): Promise<never> {
  throw new Error('generateDynamicSteps() must be called from within the UEF Gateway. Import from backend/uef-gateway/src/acheevy/execution-engine.');
}

export async function executeVertical(): Promise<never> {
  throw new Error('executeVertical() must be called from within the UEF Gateway. Import from backend/uef-gateway/src/acheevy/execution-engine.');
}

export async function scoreAndAudit(): Promise<never> {
  throw new Error('scoreAndAudit() must be called from within the UEF Gateway. Import from backend/uef-gateway/src/acheevy/execution-engine.');
}

export async function postExecutionHooks(): Promise<never> {
  throw new Error('postExecutionHooks() must be called from within the UEF Gateway. Import from backend/uef-gateway/src/acheevy/execution-engine.');
}
