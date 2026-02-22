import { NextRequest, NextResponse } from "next/server";
import { klingVideo } from "@/lib/kling-video";

const UEF_GATEWAY = process.env.UEF_GATEWAY_URL || process.env.NEXT_PUBLIC_UEF_GATEWAY_URL || 'http://localhost:3001';
const API_KEY = process.env.INTERNAL_API_KEY || '';

/**
 * POST /api/video/generate
 *
 * Routes through UEF Gateway → KIE.ai for unified video generation
 * across 17+ models (Seedance 2.0, Kling 3.0, Veo 3, Sora 2, etc.)
 * Falls back to direct Kling API if gateway unreachable.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, model = "seedance-2.0", ...options } = body;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // Try UEF Gateway (KIE.ai unified API) first
    try {
      const gwRes = await fetch(`${UEF_GATEWAY}/api/video/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(API_KEY ? { 'x-api-key': API_KEY } : {}),
        },
        body: JSON.stringify({ prompt, model, ...options }),
      });

      if (gwRes.ok) {
        const data = await gwRes.json();
        return NextResponse.json({ ...data, success: true, provider: 'kie.ai' });
      }
    } catch {
      // Gateway unreachable — fall back to direct Kling API
    }

    // Fallback: Direct Kling API (legacy)
    const result = await klingVideo.generateVideo({
      prompt,
      model: model.startsWith('kling-') ? model : 'kling-2.6-motion',
      ...options,
    });

    return NextResponse.json({
      ...result,
      success: true,
      provider: 'kling-direct',
    });
  } catch (error: any) {
    console.error("Video generation error:", error);
    return NextResponse.json(
      { error: error.message || "Generation failed" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/video/generate?jobId=xxx
 *
 * Check status — routes through gateway or direct Kling API
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const jobId = url.searchParams.get("jobId");

    if (!jobId) {
      return NextResponse.json({ error: "Job ID is required" }, { status: 400 });
    }

    // Try UEF Gateway first
    try {
      const gwRes = await fetch(`${UEF_GATEWAY}/api/video/status/${jobId}`, {
        headers: {
          ...(API_KEY ? { 'x-api-key': API_KEY } : {}),
        },
      });

      if (gwRes.ok) {
        const data = await gwRes.json();
        return NextResponse.json({ ...data, success: true });
      }
    } catch {
      // Gateway unreachable
    }

    // Fallback: Direct Kling API
    const status = await klingVideo.checkStatus(jobId);

    return NextResponse.json({
      ...status,
      success: true,
    });
  } catch (error: any) {
    console.error("Status check error:", error);
    return NextResponse.json(
      { error: error.message || "Status check failed" },
      { status: 500 }
    );
  }
}
