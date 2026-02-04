/**
 * Agent Client Hub
 * Connects to Agent Zero, OpenClaw, Chicken Hawk containers.
 */

export class AgentClient {
  static async delegateTask(agentId: string, taskSpec: any) {
    console.log(`[UEF] Delegating task to ${agentId}...`);
    
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
        console.error(`[UEF] Failed to delegate task to ${agentId}. Status: ${response.status}`);
        throw new Error(`Failed to delegate task: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`[UEF] Error delegating task to ${agentId}:`, error);
      throw error;
    }
  }
}
