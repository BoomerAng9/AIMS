// frontend/app/api/auth/demo-session/route.ts
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/auth/demo-session
 *
 * When DEMO_MODE=true, auto-creates a guest session and redirects to /dashboard.
 * Uses the request's host header to build absolute URLs (avoids localhost fallback).
 */
export async function GET(request: NextRequest) {
  const isDemo = process.env.DEMO_MODE === "true";
  const proto = request.headers.get("x-forwarded-proto") || "https";
  const host = request.headers.get("host") || "demo.plugmein.cloud";
  const baseUrl = `${proto}://${host}`;

  if (!isDemo) {
    return NextResponse.redirect(new URL("/sign-in", baseUrl));
  }

  // Redirect to sign-in with demo flag — credentials provider in auth.ts
  // handles DEMO_USER role assignment
  const redirectUrl = new URL("/sign-in", baseUrl);
  redirectUrl.searchParams.set("demo", "true");
  redirectUrl.searchParams.set("callbackUrl", "/dashboard");

  return NextResponse.redirect(redirectUrl);
}
