// frontend/app/api/evidence-locker/route.ts

/**
 * Evidence Locker API — Proof Storage
 *
 * Manages deployment artifacts and proofs in GCS.
 * Provides upload, retrieval, and verification endpoints.
 *
 * tool_id: evidence_locker
 * service_key: STORAGE
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getEvidenceLockerClient,
  createDeploymentManifest,
  storeAgentLogs,
  storeGateResults,
  storeAttestation,
  computeHash,
  type EvidenceLocker,
  type EvidenceArtifact,
} from "@/lib/evidence-locker/client";

// In-memory locker registry (replace with Redis/Postgres in production)
const lockers = new Map<string, EvidenceLocker>();

// ─────────────────────────────────────────────────────────────
// GET: List artifacts or get locker status
// ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const deploymentId = searchParams.get("deploymentId");
    const artifactId = searchParams.get("artifactId");
    const action = searchParams.get("action") || "list";

    if (!deploymentId) {
      return NextResponse.json({ error: "deploymentId required" }, { status: 400 });
    }

    const client = getEvidenceLockerClient();

    switch (action) {
      case "list": {
        const artifacts = await client.listArtifacts(deploymentId);
        const locker = lockers.get(deploymentId) || {
          deploymentId,
          artifacts,
          sealed: false,
          complete: false,
        };
        return NextResponse.json({ locker, artifacts });
      }

      case "get": {
        if (!artifactId) {
          return NextResponse.json({ error: "artifactId required" }, { status: 400 });
        }
        const result = await client.retrieveArtifact(deploymentId, artifactId);
        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: 404 });
        }
        return NextResponse.json({
          artifact: result.artifact,
          content: result.content?.toString("base64"),
        });
      }

      case "signed-url": {
        if (!artifactId) {
          return NextResponse.json({ error: "artifactId required" }, { status: 400 });
        }
        const locker = lockers.get(deploymentId);
        const artifact = locker?.artifacts.find((a) => a.id === artifactId);
        if (!artifact) {
          return NextResponse.json({ error: "Artifact not found" }, { status: 404 });
        }
        const signedUrl = await client.getSignedUrl(artifact.gcsPath);
        return NextResponse.json({ signedUrl, artifact });
      }

      case "verify": {
        const locker = lockers.get(deploymentId);
        if (!locker) {
          return NextResponse.json({ error: "Locker not found" }, { status: 404 });
        }
        const verification = await client.verifyLocker(locker);
        return NextResponse.json({ verification, locker });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("[Evidence Locker] GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────
// POST: Upload artifacts or seal locker
// ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, deploymentId } = body;

    if (!deploymentId) {
      return NextResponse.json({ error: "deploymentId required" }, { status: 400 });
    }

    const client = getEvidenceLockerClient();

    // Initialize locker if needed
    if (!lockers.has(deploymentId)) {
      lockers.set(deploymentId, {
        deploymentId,
        artifacts: [],
        sealed: false,
        complete: false,
      });
    }

    const locker = lockers.get(deploymentId)!;

    switch (action) {
      case "upload": {
        const { type, label, description, content, contentType, metadata } = body;

        if (!type || !label || !content) {
          return NextResponse.json(
            { error: "type, label, and content required" },
            { status: 400 }
          );
        }

        if (locker.sealed) {
          return NextResponse.json(
            { error: "Locker is sealed, cannot add artifacts" },
            { status: 400 }
          );
        }

        const result = await client.uploadArtifact(deploymentId, content, {
          type,
          label,
          description,
          contentType,
          metadata,
        });

        if (result.success && result.artifact) {
          locker.artifacts.push(result.artifact);
        }

        return NextResponse.json(result);
      }

      case "manifest": {
        const { manifest } = body;
        if (!manifest) {
          return NextResponse.json({ error: "manifest required" }, { status: 400 });
        }
        const result = await createDeploymentManifest(deploymentId, manifest);
        if (result.success && result.artifact) {
          locker.artifacts.push(result.artifact);
        }
        return NextResponse.json(result);
      }

      case "log": {
        const { agentId, logs } = body;
        if (!agentId || !logs) {
          return NextResponse.json({ error: "agentId and logs required" }, { status: 400 });
        }
        const result = await storeAgentLogs(deploymentId, agentId, logs);
        if (result.success && result.artifact) {
          locker.artifacts.push(result.artifact);
        }
        return NextResponse.json(result);
      }

      case "gate": {
        const { gateId, results } = body;
        if (!gateId || !results) {
          return NextResponse.json({ error: "gateId and results required" }, { status: 400 });
        }
        const result = await storeGateResults(deploymentId, gateId, results);
        if (result.success && result.artifact) {
          locker.artifacts.push(result.artifact);
        }
        return NextResponse.json(result);
      }

      case "attestation": {
        const { attestation } = body;
        if (!attestation) {
          return NextResponse.json({ error: "attestation required" }, { status: 400 });
        }
        const result = await storeAttestation(deploymentId, attestation);
        if (result.success && result.artifact) {
          locker.artifacts.push(result.artifact);
        }
        return NextResponse.json(result);
      }

      case "seal": {
        if (locker.sealed) {
          return NextResponse.json({ error: "Locker already sealed" }, { status: 400 });
        }
        const sealedLocker = await client.sealLocker(locker);
        lockers.set(deploymentId, sealedLocker);
        return NextResponse.json({ success: true, locker: sealedLocker });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("[Evidence Locker] POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
