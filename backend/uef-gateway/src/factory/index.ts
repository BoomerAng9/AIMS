/**
 * Factory Controller — Always-On Orchestration Engine
 *
 * Promotes ACHEEVY from reactive orchestrator to persistent factory controller.
 * Watches event sources, auto-kicks FDH (Foster→Develop→Hone) runs,
 * drives every task to completion with oversight.
 *
 * The user shifts from "commanding tools" to approver of plans and releases.
 * ACHEEVY + Boomer_Angs become the default, always-on factory loop.
 */

export { FactoryController, getFactoryController } from './controller';
export { FDHPipeline } from './fdh-pipeline';
export { factoryRouter } from './router';
export type {
  FactoryEvent,
  FactoryEventSource,
  FactoryPolicy,
  FDHManifest,
  FDHPhase,
  FDHRunStatus,
  FDHRun,
  ChamberState,
  FactoryStatusReport,
  OracleGateResult,
  BAMARAMReceipt,
} from './types';
