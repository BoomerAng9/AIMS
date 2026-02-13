// frontend/app/api/acheevy/chat/route.ts

/**
 * ACHEEVY Chat API - Real Backend Integration
 *
 * Proxies chat requests to the ACHEEVY orchestrator service.
 * Falls back to UEF Gateway if direct ACHEEVY is unavailable.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const ACHEEVY_URL = process.env.ACHEEVY_URL || "http://acheevy:3003";
const UEF_URL = process.env.UEF_ENDPOINT || "http://uef-gateway:3001";

interface ChatRequest {
  message: string;
  sessionId?: string;
  context?: {
    deploymentId?: string;
    mode?: "recommend" | "explain" | "execute" | "prove";
    image?: string;
  };
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.email || `guest-${Date.now()}`;

    const body: ChatRequest = await req.json();
    const { message, sessionId, context } = body;

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Try direct ACHEEVY service first
    try {
      const acheevyResponse = await fetch(`${ACHEEVY_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          sessionId,
          userId,
          context,
        }),
        signal: AbortSignal.timeout(30000), // 30s timeout
      });

      if (acheevyResponse.ok) {
        const data = await acheevyResponse.json();
        return NextResponse.json({
          sessionId: data.sessionId || sessionId || `session-${Date.now()}`,
          reply: data.reply,
          intent: data.intent,
          boomerangsDispatched: data.boomerangs_dispatched,
          lucDebit: data.luc_debit,
          actionPlan: data.action_plan,
          source: "acheevy-direct",
        });
      }
    } catch (directError) {
      console.log("[ACHEEVY Chat] Direct service unavailable, trying UEF Gateway");
    }

    // Fallback to UEF Gateway /acheevy/execute
    try {
      const uefResponse = await fetch(`${UEF_URL}/acheevy/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          intent: context?.mode || "general",
          userId,
          sessionId,
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (uefResponse.ok) {
        const data = await uefResponse.json();
        return NextResponse.json({
          sessionId: sessionId || `session-${Date.now()}`,
          reply: data.reply || data.data?.response || "I received your request but need more context.",
          intent: {
            name: data.intent || "general",
            confidence: 0.7,
            capabilities: [],
          },
          lucDebit: data.lucUsage?.cost,
          source: "uef-gateway",
        });
      }
    } catch (uefError) {
      console.log("[ACHEEVY Chat] UEF Gateway unavailable");
    }

    // Final fallback - local processing
    const localResponse = processLocally(message, context?.mode);
    return NextResponse.json({
      sessionId: sessionId || `session-${Date.now()}`,
      ...localResponse,
      source: "local-fallback",
    });

  } catch (error: any) {
    console.error("[ACHEEVY Chat] Error:", error);
    return NextResponse.json(
      { error: error.message || "Chat processing failed" },
      { status: 500 }
    );
  }
}

/**
 * Local fallback processing when backends are unavailable
 */
function processLocally(message: string, mode?: string): {
  reply: string;
  intent: { name: string; confidence: number; capabilities: string[] };
  actionPlan?: Array<{ step: number; action: string; status: string }>;
} {
  const lower = message.toLowerCase();

  // Intent detection
  let intent = { name: "general", confidence: 0.5, capabilities: [] as string[] };

  if (/deploy|launch|release|ship/.test(lower)) {
    intent = { name: "deploy", confidence: 0.8, capabilities: ["deploy", "container"] };
  } else if (/build|create|make|generate/.test(lower)) {
    intent = { name: "build", confidence: 0.8, capabilities: ["code-gen", "build"] };
  } else if (/test|validate|verify|check/.test(lower)) {
    intent = { name: "test", confidence: 0.8, capabilities: ["test", "qa"] };
  } else if (/research|find|search|investigate/.test(lower)) {
    intent = { name: "research", confidence: 0.8, capabilities: ["research", "analysis"] };
  }

  // Mode-specific responses
  const responses: Record<string, string> = {
    recommend: `Based on your request "${message.slice(0, 50)}...", I recommend:\n\n` +
      `1. **Hatch** - Assemble the appropriate agent squad\n` +
      `2. **Assign** - Bind to the relevant n8n workflow\n` +
      `3. **Launch** - Execute with verification gates\n\n` +
      `Would you like me to proceed with this plan?`,

    explain: `Let me explain how this works:\n\n` +
      `• **ACHEEVY** (me) handles all user communication\n` +
      `• **Boomer_Angs** supervise specialized domains\n` +
      `• **Chicken Hawk** converts plans to job packets\n` +
      `• **Lil_Hawks** execute bounded tasks with proofs\n\n` +
      `Each step produces verifiable artifacts in the Evidence Locker.`,

    execute: `I'm preparing to execute your request.\n\n` +
      `✓ Intent analyzed: ${intent.name}\n` +
      `✓ Capabilities required: ${intent.capabilities.join(", ") || "general"}\n` +
      `○ Awaiting agent roster assembly\n` +
      `○ Awaiting workflow binding\n\n` +
      `Please confirm to proceed to the Hatch stage.`,

    prove: `Evidence requirements for this operation:\n\n` +
      `• **Plan Manifest** - Cryptographic hash of execution plan\n` +
      `• **Gate Results** - Automated check results with timestamps\n` +
      `• **Execution Logs** - Signed agent activity records\n` +
      `• **Attestation Bundle** - Final proof package\n\n` +
      `All artifacts will be stored in the Evidence Locker.`,
  };

  return {
    reply: responses[mode || "recommend"] || responses.recommend,
    intent,
    actionPlan: [
      { step: 1, action: "Analyze intent", status: "complete" },
      { step: 2, action: "Select agents", status: "pending" },
      { step: 3, action: "Configure workflow", status: "pending" },
      { step: 4, action: "Execute and verify", status: "pending" },
    ],
  };
}

export async function GET() {
  // Health check
  try {
    const [acheevyHealth, uefHealth] = await Promise.allSettled([
      fetch(`${ACHEEVY_URL}/health`, { signal: AbortSignal.timeout(5000) }),
      fetch(`${UEF_URL}/health`, { signal: AbortSignal.timeout(5000) }),
    ]);

    return NextResponse.json({
      acheevy: acheevyHealth.status === "fulfilled" && acheevyHealth.value.ok ? "online" : "offline",
      uefGateway: uefHealth.status === "fulfilled" && uefHealth.value.ok ? "online" : "offline",
      fallback: "available",
    });
  } catch (error) {
    return NextResponse.json({ acheevy: "offline", uefGateway: "offline", fallback: "available" });
  }
}
