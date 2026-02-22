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
 * Honest fallback when both ACHEEVY and UEF Gateway are offline.
 * Does NOT fake intent analysis or action plans.
 */
function processLocally(message: string, _mode?: string): {
  reply: string;
  intent: { name: string; confidence: number; capabilities: string[] };
} {
  return {
    reply:
      `Both ACHEEVY and the UEF Gateway are currently offline. ` +
      `Your message has been received but cannot be processed until services are restored.\n\n` +
      `**What you can do:**\n` +
      `- Check service health on the Environments page\n` +
      `- Try again in a few minutes\n\n` +
      `Your message: "${message.slice(0, 120)}${message.length > 120 ? '...' : ''}"`,
    intent: { name: "offline", confidence: 0, capabilities: [] },
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
