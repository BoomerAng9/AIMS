/**
 * Agent Client Hub
 * Connects to Agent Zero and other agent containers.
 */

import logger from '../logger';

export class AgentClient {
  static async delegateTask(agentId: string, taskSpec: Record<string, unknown>) {
    logger.info({ agentId }, '[UEF] Delegating task');

    const url = `http://${agentId}:8080/task`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(taskSpec)
      });

      if (!response.ok) {
        logger.error({ agentId, status: response.status }, '[UEF] Failed to delegate task');
        throw new Error(`Failed to delegate task: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      logger.error({ agentId, err: error }, '[UEF] Error delegating task');
      throw error;
    }
  }
}
