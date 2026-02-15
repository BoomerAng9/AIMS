// frontend/app/api/luc/can-execute/route.ts

/**
 * LUC Can Execute API
 *
 * Check if an operation can be executed within quota limits.
 * This is the gating call that must precede all billable operations.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { LucAdapter } from "@/aims-tools/luc/luc.adapters";
import { CanExecuteRequestSchema } from "@/aims-tools/luc/luc.schemas";
import { getLucStorage, getLucPolicy } from "@/lib/db/luc-storage";
import { ZodError } from "zod";

// Rate limiting (simple in-memory for dev)
const rateLimiter = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 1000;
const RATE_WINDOW = 60000; // 1 minute

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
    const request = CanExecuteRequestSchema.parse(body);

    // Create adapter
    const storage = getLucStorage();
    const policy = getLucPolicy();
    const luc = new LucAdapter(storage, policy);

    // Ensure account exists
    await storage.ensureAccount(request.workspaceId);

    // Check if can execute
    const result = await luc.canExecute(request);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("[LUC can-execute] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
