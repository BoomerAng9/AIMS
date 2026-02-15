// frontend/app/api/luc/record/route.ts

/**
 * LUC Record Usage API
 *
 * Record actual usage after capability execution.
 * This creates an immutable event and updates quota aggregates.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { LucAdapter } from "@/aims-tools/luc/luc.adapters";
import { RecordUsageRequestSchema } from "@/aims-tools/luc/luc.schemas";
import { getLucStorage, getLucPolicy } from "@/lib/db/luc-storage";
import { ZodError } from "zod";

// Rate limiting
const rateLimiter = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 1000;
const RATE_WINDOW = 60000;

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateLimiter.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimiter.set(key, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }

  if (entry.count >= RATE_LIMIT) {
    return false;
  }

  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit
    if (!checkRateLimit(session.user.email)) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    // Parse and validate request
    const body = await req.json();
    const request = RecordUsageRequestSchema.parse({
      ...body,
      userId: body.userId || session.user.email,
    });

    // Create adapter
    const storage = getLucStorage();
    const policy = getLucPolicy();
    const luc = new LucAdapter(storage, policy);

    // Ensure account exists
    await storage.ensureAccount(request.workspaceId);

    // Record usage
    const result = await luc.recordUsage(request);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("[LUC record] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
