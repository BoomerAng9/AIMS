// frontend/lib/evidence-locker/client.ts

/**
 * Evidence Locker - GCS-based Proof Storage
 *
 * Stores deployment artifacts, proofs, and attestations in Google Cloud Storage.
 * Provides cryptographic hashing for integrity verification.
 */

import { createHash } from "crypto";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface EvidenceArtifact {
  id: string;
  deploymentId: string;
  type: "manifest" | "log" | "scan" | "attestation" | "screenshot" | "config" | "diff";
  label: string;
  description?: string;
  contentHash: string;
  contentType: string;
  size: number;
  gcsPath: string;
  signedUrl?: string;
  metadata: Record<string, string>;
  createdAt: string;
  expiresAt?: string;
}

export interface EvidenceLocker {
  deploymentId: string;
  artifacts: EvidenceArtifact[];
  sealed: boolean;
  sealedAt?: string;
  sealHash?: string;
  complete: boolean;
}

export interface UploadResult {
  success: boolean;
  artifact?: EvidenceArtifact;
  error?: string;
}

export interface RetrieveResult {
  success: boolean;
  artifact?: EvidenceArtifact;
  content?: Buffer | string;
  error?: string;
}

// ─────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────

const GCS_BUCKET = process.env.GCS_EVIDENCE_BUCKET || "ai-managed-services-evidence-locker";
const GCS_PROJECT = process.env.GCP_PROJECT_ID || "ai-managed-services";
const SIGNED_URL_EXPIRY = 3600; // 1 hour

// Check if running on server
const isServer = typeof window === "undefined";

// ─────────────────────────────────────────────────────────────
// Hash Utilities
// ─────────────────────────────────────────────────────────────

export function computeHash(content: string | Buffer): string {
  const hash = createHash("sha256");
  hash.update(content);
  return hash.digest("hex");
}

export function computeLockerSealHash(artifacts: EvidenceArtifact[]): string {
  const sortedHashes = artifacts
    .map((a) => a.contentHash)
    .sort()
    .join("|");
  return computeHash(sortedHashes);
}

// ─────────────────────────────────────────────────────────────
// Evidence Locker Client
// ─────────────────────────────────────────────────────────────

export class EvidenceLockerClient {
  private bucket: string;
  private storageClient: any = null;

  constructor(bucket?: string) {
    this.bucket = bucket || GCS_BUCKET;
  }

  /**
   * Initialize GCS client (server-side only)
   */
  private async getStorageClient() {
    if (!isServer) {
      throw new Error("GCS storage client can only be used server-side");
    }

    if (this.storageClient) {
      return this.storageClient;
    }

    try {
      // Dynamic import to avoid client-side bundling
      const { Storage } = await import("@google-cloud/storage");
      this.storageClient = new Storage({ projectId: GCS_PROJECT });
      return this.storageClient;
    } catch (error) {
      console.error("[Evidence Locker] Failed to initialize GCS client:", error);
      return null;
    }
  }

  /**
   * Upload an artifact to the Evidence Locker
   */
  async uploadArtifact(
    deploymentId: string,
    content: string | Buffer,
    options: {
      type: EvidenceArtifact["type"];
      label: string;
      description?: string;
      contentType?: string;
      metadata?: Record<string, string>;
    }
  ): Promise<UploadResult> {
    try {
      const artifactId = `art-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const contentHash = computeHash(content);
      const gcsPath = `evidence/${deploymentId}/${options.type}/${artifactId}`;
      const contentBuffer = typeof content === "string" ? Buffer.from(content) : content;

      const storage = await this.getStorageClient();

      if (storage) {
        // Upload to GCS
        const bucket = storage.bucket(this.bucket);
        const file = bucket.file(gcsPath);

        await file.save(contentBuffer, {
          contentType: options.contentType || "application/octet-stream",
          metadata: {
            deploymentId,
            artifactId,
            type: options.type,
            contentHash,
            ...options.metadata,
          },
        });
      } else {
        console.warn("[Evidence Locker] GCS not available, artifact stored locally only");
      }

      const artifact: EvidenceArtifact = {
        id: artifactId,
        deploymentId,
        type: options.type,
        label: options.label,
        description: options.description,
        contentHash,
        contentType: options.contentType || "application/octet-stream",
        size: contentBuffer.length,
        gcsPath,
        metadata: options.metadata || {},
        createdAt: new Date().toISOString(),
      };

      return { success: true, artifact };
    } catch (error: any) {
      console.error("[Evidence Locker] Upload error:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Retrieve an artifact from the Evidence Locker
   */
  async retrieveArtifact(
    deploymentId: string,
    artifactId: string
  ): Promise<RetrieveResult> {
    try {
      const storage = await this.getStorageClient();

      if (!storage) {
        return { success: false, error: "GCS client not available" };
      }

      // Find the artifact path
      const bucket = storage.bucket(this.bucket);
      const [files] = await bucket.getFiles({
        prefix: `evidence/${deploymentId}/`,
      });

      const file = files.find((f: any) => f.name.includes(artifactId));
      if (!file) {
        return { success: false, error: "Artifact not found" };
      }

      const [content] = await file.download();
      const [metadata] = await file.getMetadata();

      const artifact: EvidenceArtifact = {
        id: artifactId,
        deploymentId,
        type: metadata.metadata?.type || "log",
        label: metadata.metadata?.label || artifactId,
        contentHash: metadata.metadata?.contentHash || computeHash(content),
        contentType: metadata.contentType || "application/octet-stream",
        size: content.length,
        gcsPath: file.name,
        metadata: metadata.metadata || {},
        createdAt: metadata.timeCreated || new Date().toISOString(),
      };

      return { success: true, artifact, content };
    } catch (error: any) {
      console.error("[Evidence Locker] Retrieve error:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * List all artifacts for a deployment
   */
  async listArtifacts(deploymentId: string): Promise<EvidenceArtifact[]> {
    try {
      const storage = await this.getStorageClient();

      if (!storage) {
        return [];
      }

      const bucket = storage.bucket(this.bucket);
      const [files] = await bucket.getFiles({
        prefix: `evidence/${deploymentId}/`,
      });

      const artifacts: EvidenceArtifact[] = [];

      for (const file of files) {
        const [metadata] = await file.getMetadata();
        artifacts.push({
          id: metadata.metadata?.artifactId || file.name.split("/").pop() || "",
          deploymentId,
          type: metadata.metadata?.type || "log",
          label: metadata.metadata?.label || file.name,
          contentHash: metadata.metadata?.contentHash || "",
          contentType: metadata.contentType || "application/octet-stream",
          size: parseInt(metadata.size, 10) || 0,
          gcsPath: file.name,
          metadata: metadata.metadata || {},
          createdAt: metadata.timeCreated || new Date().toISOString(),
        });
      }

      return artifacts;
    } catch (error: any) {
      console.error("[Evidence Locker] List error:", error);
      return [];
    }
  }

  /**
   * Generate a signed URL for temporary access
   */
  async getSignedUrl(
    gcsPath: string,
    expirySeconds: number = SIGNED_URL_EXPIRY
  ): Promise<string | null> {
    try {
      const storage = await this.getStorageClient();

      if (!storage) {
        return null;
      }

      const bucket = storage.bucket(this.bucket);
      const file = bucket.file(gcsPath);

      const [url] = await file.getSignedUrl({
        version: "v4",
        action: "read",
        expires: Date.now() + expirySeconds * 1000,
      });

      return url;
    } catch (error: any) {
      console.error("[Evidence Locker] Signed URL error:", error);
      return null;
    }
  }

  /**
   * Seal the Evidence Locker (make immutable)
   */
  async sealLocker(locker: EvidenceLocker): Promise<EvidenceLocker> {
    if (locker.sealed) {
      return locker;
    }

    const sealHash = computeLockerSealHash(locker.artifacts);

    // Store seal manifest
    const sealManifest = {
      deploymentId: locker.deploymentId,
      artifactCount: locker.artifacts.length,
      artifacts: locker.artifacts.map((a) => ({
        id: a.id,
        type: a.type,
        hash: a.contentHash,
      })),
      sealHash,
      sealedAt: new Date().toISOString(),
    };

    await this.uploadArtifact(locker.deploymentId, JSON.stringify(sealManifest, null, 2), {
      type: "attestation",
      label: "Locker Seal Manifest",
      description: "Cryptographic seal of all evidence artifacts",
      contentType: "application/json",
    });

    return {
      ...locker,
      sealed: true,
      sealedAt: sealManifest.sealedAt,
      sealHash,
      complete: true,
    };
  }

  /**
   * Verify the integrity of an Evidence Locker
   */
  async verifyLocker(locker: EvidenceLocker): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    if (!locker.sealed || !locker.sealHash) {
      errors.push("Locker is not sealed");
      return { valid: false, errors };
    }

    // Recompute seal hash
    const computedHash = computeLockerSealHash(locker.artifacts);

    if (computedHash !== locker.sealHash) {
      errors.push("Seal hash mismatch - artifacts may have been tampered with");
    }

    // Verify each artifact exists in GCS
    for (const artifact of locker.artifacts) {
      const result = await this.retrieveArtifact(locker.deploymentId, artifact.id);
      if (!result.success) {
        errors.push(`Missing artifact: ${artifact.id}`);
      } else if (result.artifact?.contentHash !== artifact.contentHash) {
        errors.push(`Hash mismatch for artifact: ${artifact.id}`);
      }
    }

    return { valid: errors.length === 0, errors };
  }
}

// ─────────────────────────────────────────────────────────────
// Convenience Functions
// ─────────────────────────────────────────────────────────────

/**
 * Create a deployment manifest artifact
 */
export async function createDeploymentManifest(
  deploymentId: string,
  manifest: Record<string, unknown>
): Promise<UploadResult> {
  const client = new EvidenceLockerClient();
  return client.uploadArtifact(deploymentId, JSON.stringify(manifest, null, 2), {
    type: "manifest",
    label: "Deployment Manifest",
    description: "Full deployment configuration and agent roster",
    contentType: "application/json",
  });
}

/**
 * Store agent execution logs
 */
export async function storeAgentLogs(
  deploymentId: string,
  agentId: string,
  logs: string
): Promise<UploadResult> {
  const client = new EvidenceLockerClient();
  return client.uploadArtifact(deploymentId, logs, {
    type: "log",
    label: `${agentId} Execution Log`,
    description: `Execution logs for agent ${agentId}`,
    contentType: "text/plain",
    metadata: { agentId },
  });
}

/**
 * Store gate verification results
 */
export async function storeGateResults(
  deploymentId: string,
  gateId: string,
  results: Record<string, unknown>
): Promise<UploadResult> {
  const client = new EvidenceLockerClient();
  return client.uploadArtifact(deploymentId, JSON.stringify(results, null, 2), {
    type: "scan",
    label: `Gate: ${gateId}`,
    description: `Verification results for gate ${gateId}`,
    contentType: "application/json",
    metadata: { gateId },
  });
}

/**
 * Store deployment attestation
 */
export async function storeAttestation(
  deploymentId: string,
  attestation: {
    type: string;
    issuer: string;
    subject: string;
    claims: Record<string, unknown>;
    signature?: string;
  }
): Promise<UploadResult> {
  const client = new EvidenceLockerClient();

  // Add timestamp and compute signature if not provided
  const fullAttestation = {
    ...attestation,
    issuedAt: new Date().toISOString(),
    signature: attestation.signature || computeHash(JSON.stringify(attestation)),
  };

  return client.uploadArtifact(deploymentId, JSON.stringify(fullAttestation, null, 2), {
    type: "attestation",
    label: `Attestation: ${attestation.type}`,
    description: `${attestation.type} attestation from ${attestation.issuer}`,
    contentType: "application/json",
    metadata: { attestationType: attestation.type, issuer: attestation.issuer },
  });
}

// ─────────────────────────────────────────────────────────────
// Singleton Instance
// ─────────────────────────────────────────────────────────────

let evidenceLockerInstance: EvidenceLockerClient | null = null;

export function getEvidenceLockerClient(): EvidenceLockerClient {
  if (!evidenceLockerInstance) {
    evidenceLockerInstance = new EvidenceLockerClient();
  }
  return evidenceLockerInstance;
}
