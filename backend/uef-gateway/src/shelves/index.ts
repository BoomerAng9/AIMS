/**
 * Shelving System — Public API
 */

export { shelfClient, ShelfClient } from './firestore-client';
export type { ShelfQuery, ShelfListOptions } from './firestore-client';
export { shelfRouter } from './shelf-router';
export { shelfMCPTools, allShelfTools } from './mcp-tools';
export type {
  AimsProject,
  LucProject,
  AimsPlug,
  BoomerAngRecord,
  AimsWorkflow,
  AimsRun,
  AimsLog,
  AimsAsset,
  ShelfName,
  ShelfInfo,
  SHELF_REGISTRY,
} from './types';
