/**
 * Playground/Sandbox — Public API
 *
 * Isolated execution environments for code, prompts, agents,
 * training data, and education.
 */

export {
  createPlayground,
  executeInPlayground,
  getPlayground,
  listPlaygrounds,
  pausePlayground,
  resumePlayground,
  completePlayground,
  addFile,
  getPlaygroundStats,
} from './engine';

export type {
  PlaygroundType,
  PlaygroundStatus,
  PlaygroundLanguage,
  PlaygroundSession,
  PlaygroundConfig,
  CodePlaygroundConfig,
  PromptPlaygroundConfig,
  AgentPlaygroundConfig,
  TrainingPlaygroundConfig,
  EducationPlaygroundConfig,
  PlaygroundExecution,
  PlaygroundFile,
  CreatePlaygroundRequest,
  ExecuteInPlaygroundRequest,
  PlaygroundResponse,
} from './types';
