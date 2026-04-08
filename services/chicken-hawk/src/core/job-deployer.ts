// =============================================================================
// Chicken Hawk — Lil_Hawk Job Deployer
// Deploys Lil_Hawks as real workers — in-process (local), Docker containers
// on VPS, or Cloud Run Jobs on GCP. Each Lil_Hawk gets its own isolated
// execution environment with workspace, tools, and memory access.
//
// Deployment targets by badge level:
//   green  → local (in-process, fast)
//   amber  → docker (sandboxed container)
//   red    → cloud_run (fully isolated GCP job)
// =============================================================================

import type { LilHawk, LilHawkDeployment, DeployTarget, ManifestTask } from "../types";
import { memory } from "../lib/memory";

const AGENT_BRIDGE_URL = process.env.AGENT_BRIDGE_URL || "http://agent-bridge:3010";
const DEPLOY_TARGET: DeployTarget = (process.env.LILHAWK_DEPLOY_TARGET as DeployTarget) || "local";

export class JobDeployer {
  /**
   * Deploy a Lil_Hawk for a specific task.
   */
  async deploy(hawk: LilHawk, task: ManifestTask): Promise<LilHawkDeployment> {
    const target = this.resolveTarget(task);
    console.log(`[job-deployer] Deploying ${hawk.moniker} via ${target} for task ${task.task_id}`);

    switch (target) {
      case "docker":
        return this.deployDocker(hawk, task);
      case "cloud_run":
        return this.deployCloudRun(hawk, task);
      case "local":
      default:
        return this.deployLocal(hawk);
    }
  }

  /**
   * Terminate a deployed Lil_Hawk.
   */
  async terminate(hawk: LilHawk): Promise<void> {
    if (!hawk.deployment) return;

    console.log(`[job-deployer] Terminating ${hawk.moniker} (${hawk.deployment.target})`);

    if (hawk.deployment.target === "docker" && hawk.deployment.container_id) {
      try {
        await fetch(`${AGENT_BRIDGE_URL}/api/docker/stop`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ container_id: hawk.deployment.container_id }),
        });
      } catch (err) {
        console.warn(`[job-deployer] Failed to stop container: ${err}`);
      }
    }

    hawk.deployment.terminated_at = new Date().toISOString();

    // Persist Lil_Hawk memory before termination
    memory.save(memory.get(hawk.id));
  }

  /**
   * Choose deployment target based on task requirements.
   */
  private resolveTarget(task: ManifestTask): DeployTarget {
    // Global override from env
    if (DEPLOY_TARGET !== "local") return DEPLOY_TARGET;

    // Red badge or high cost → Cloud Run for isolation
    if (task.badge_level === "red" || task.estimated_cost_usd > 1.0) {
      return process.env.GCP_PROJECT_ID ? "cloud_run" : "docker";
    }

    // Amber badge → Docker for sandboxing
    if (task.badge_level === "amber") return "docker";

    // Green badge → local for speed
    return "local";
  }

  private async deployLocal(hawk: LilHawk): Promise<LilHawkDeployment> {
    return {
      target: "local",
      deployed_at: new Date().toISOString(),
    };
  }

  private async deployDocker(hawk: LilHawk, task: ManifestTask): Promise<LilHawkDeployment> {
    const res = await fetch(`${AGENT_BRIDGE_URL}/api/docker/deploy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image: "aims/lil-hawk-worker:latest",
        service_name: `lil-hawk-${hawk.kyb.identity}`,
        env: {
          HAWK_ID: hawk.id,
          SHIFT_ID: hawk.kyb.shift_id,
          TASK_ID: task.task_id,
          TASK_FUNCTION: task.function,
          CHICKENHAWK_CORE_URL: "http://chickenhawk-core:4001",
          AUDIT_URL: process.env.AUDIT_URL || "http://chickenhawk-audit:4003",
        },
        labels: {
          "aims.role": "lil-hawk",
          "aims.shift": hawk.kyb.shift_id,
          "aims.squad": hawk.kyb.squad_id,
        },
        network: "sandbox-network",
        read_only: true,
        cap_drop: ["ALL"],
        memory_limit: "256m",
        cpu_limit: "0.5",
      }),
    });

    if (!res.ok) throw new Error(`Docker deploy failed: ${res.status} ${await res.text()}`);
    const data = (await res.json()) as { container_id: string };

    return {
      target: "docker",
      container_id: data.container_id,
      deployed_at: new Date().toISOString(),
    };
  }

  private async deployCloudRun(hawk: LilHawk, task: ManifestTask): Promise<LilHawkDeployment> {
    const gcpProjectId = process.env.GCP_PROJECT_ID || "ai-managed-services";
    const region = process.env.GCP_REGION || "us-central1";

    const res = await fetch(
      `https://${region}-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/${gcpProjectId}/jobs/lil-hawk-worker:run`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await this.getGCPToken()}`,
        },
        body: JSON.stringify({
          overrides: {
            containerOverrides: [
              {
                env: [
                  { name: "HAWK_ID", value: hawk.id },
                  { name: "SHIFT_ID", value: hawk.kyb.shift_id },
                  { name: "TASK_ID", value: task.task_id },
                  { name: "TASK_FUNCTION", value: task.function },
                  { name: "TASK_PARAMS", value: JSON.stringify(task.params) },
                ],
              },
            ],
          },
        }),
      },
    );

    if (!res.ok) throw new Error(`Cloud Run job dispatch failed: ${res.status}`);
    const data = (await res.json()) as { metadata: { name: string } };

    return {
      target: "cloud_run",
      cloud_run_job_id: data.metadata.name,
      deployed_at: new Date().toISOString(),
    };
  }

  private async getGCPToken(): Promise<string> {
    // Try metadata server (when running on GCP)
    try {
      const res = await fetch(
        "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token",
        { headers: { "Metadata-Flavor": "Google" }, signal: AbortSignal.timeout(2000) },
      );
      if (res.ok) {
        const data = (await res.json()) as { access_token: string };
        return data.access_token;
      }
    } catch {
      // Not on GCP
    }
    return process.env.GCP_ACCESS_TOKEN || "";
  }
}

export const jobDeployer = new JobDeployer();
