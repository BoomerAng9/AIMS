/**
 * Custom Lil_Hawks — Public API
 *
 * User-created bots with unlimited naming and domain possibilities.
 * "Lil_Increase_My_Money_Hawk", "Lil_Grade_My_Essay_Hawk", etc.
 */

export {
  createCustomHawk,
  listUserHawks,
  getHawk,
  updateHawkStatus,
  deleteHawk,
  executeHawk,
  getAvailableDomains,
  getAvailableTools,
  getHawkExecutionHistory,
  getGlobalStats,
} from './engine';

export type {
  CustomHawkSpec,
  CustomHawkRecord,
  CustomHawkDomain,
  CustomHawkTool,
  HawkExecutionRequest,
  HawkExecutionResult,
  CreateHawkResponse,
  ListHawksResponse,
  HawkSchedule,
} from './types';
