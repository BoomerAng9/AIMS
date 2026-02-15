// frontend/app/api/luc/summary/route.ts

/**
 * LUC Summary API
 *
 * Get usage summary with optional breakdown.
 * Used for dashboard displays and reporting.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { LucAdapter } from "@/aims-tools/luc/luc.adapters";
import { SummaryRequestSchema } from "@/aims-tools/luc/luc.schemas";
import { getLucStorage, getLucPolicy } from "@/lib/db/luc-storage";
import { ZodError } from "zod";

export async function GET(req: NextRequest) {
  try {
    // Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse query params
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
    }

    const request = SummaryRequestSchema.parse({
      workspaceId,
      includeBreakdown: searchParams.get("includeBreakdown") === "true",
      includeHistory: searchParams.get("includeHistory") === "true",
      historyDays: parseInt(searchParams.get("historyDays") || "7", 10),
    });

    // Create adapter
    const storage = getLucStorage();
    const policy = getLucPolicy();
    const luc = new LucAdapter(storage, policy);

    // Ensure account exists
    await storage.ensureAccount(request.workspaceId);

    // Get summary
    const result = await luc.getSummary(request);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("[LUC summary] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}

// Also support POST for more complex requests
export async function POST(req: NextRequest) {
  try {
    // Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate request
    const body = await req.json();
    const request = SummaryRequestSchema.parse(body);

    // Create adapter
    const storage = getLucStorage();
    const policy = getLucPolicy();
    const luc = new LucAdapter(storage, policy);

    // Ensure account exists
    await storage.ensureAccount(request.workspaceId);

    // Get summary
    const result = await luc.getSummary(request);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("[LUC summary] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
