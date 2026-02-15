// frontend/app/api/luc/estimate/route.ts

/**
 * LUC Estimate API
 *
 * Estimate the impact of operations without mutating state.
 * Use this for cost previews and quota impact analysis.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { LucAdapter } from "@/aims-tools/luc/luc.adapters";
import { EstimateRequestSchema } from "@/aims-tools/luc/luc.schemas";
import { getLucStorage, getLucPolicy } from "@/lib/db/luc-storage";
import { ZodError } from "zod";

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate request
    const body = await req.json();
    const request = EstimateRequestSchema.parse(body);

    // Create adapter
    const storage = getLucStorage();
    const policy = getLucPolicy();
    const luc = new LucAdapter(storage, policy);

    // Ensure account exists
    await storage.ensureAccount(request.workspaceId);

    // Get estimate
    const result = await luc.estimate(request);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("[LUC estimate] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
