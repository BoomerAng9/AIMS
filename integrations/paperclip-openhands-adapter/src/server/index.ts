import type { ServerAdapterModule } from '@paperclipai/adapter-utils';
import { agentConfigurationDoc, models, type } from '../index.js';
import { execute } from './execute.js';
import { testEnvironment } from './test.js';

export function createServerAdapter(): ServerAdapterModule {
  return {
    type,
    execute,
    testEnvironment,
    models,
    agentConfigurationDoc,
  };
}
