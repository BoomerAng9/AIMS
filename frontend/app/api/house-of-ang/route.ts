// frontend/app/api/house-of-ang/route.ts

/**
 * House of Ang API Proxy
 *
 * Proxies requests to the House of Ang agent registry service (port 3002)
 * Provides agent discovery, routing, and invocation capabilities.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const HOUSE_OF_ANG_URL = process.env.HOUSE_OF_ANG_URL || "http://house-of-ang:3002";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") || "list";
    const agentId = searchParams.get("id");
    const capability = searchParams.get("capability");

    let endpoint: string;

    switch (action) {
      case "list":
        endpoint = "/boomerangs";
        break;
      case "get":
        if (!agentId) {
          return NextResponse.json({ error: "Agent ID required" }, { status: 400 });
        }
        endpoint = `/boomerangs/${agentId}`;
        break;
      case "capability":
        if (!capability) {
          return NextResponse.json({ error: "Capability required" }, { status: 400 });
        }
        endpoint = `/capabilities/${capability}`;
        break;
      case "capabilities":
        endpoint = "/capabilities";
        break;
      case "health":
        endpoint = agentId ? `/boomerangs/${agentId}/health` : "/health/all";
        break;
      default:
        endpoint = "/boomerangs";
    }

    const response = await fetch(`${HOUSE_OF_ANG_URL}${endpoint}`, {
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: `Backend error: ${response.status}`, details: error },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[House of Ang Proxy] GET error:", error);
    return NextResponse.json(
      { error: error.message || "Service unavailable" },
      { status: 503 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, agentId, capabilities, intent, payload } = body;

    let endpoint: string;
    let requestBody: Record<string, unknown> = {};

    switch (action) {
      case "route":
        endpoint = "/route";
        requestBody = capabilities ? { capabilities } : { intent };
        break;
      case "invoke":
        if (!agentId) {
          return NextResponse.json({ error: "Agent ID required for invoke" }, { status: 400 });
        }
        endpoint = `/invoke/${agentId}`;
        requestBody = payload || {};
        break;
      case "reload":
        endpoint = "/admin/reload";
        requestBody = {};
        break;
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    const response = await fetch(`${HOUSE_OF_ANG_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: `Backend error: ${response.status}`, details: error },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[House of Ang Proxy] POST error:", error);
    return NextResponse.json(
      { error: error.message || "Service unavailable" },
      { status: 503 }
    );
  }
}
