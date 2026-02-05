import { NextRequest, NextResponse } from "next/server";
import { klingVideo } from "@/lib/kling-video";

/**
 * POST /api/video/generate
 * Generate a video using Kling.ai
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, model = "kling-2.6-motion", ...options } = body;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // Submit generation request
    const result = await klingVideo.generateVideo({
      prompt,
      model,
      ...options,
    });

    return NextResponse.json({
      ...result,
      success: true,
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
 * GET /api/video/generate/:jobId
 * Check status of video generation job
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const jobId = url.searchParams.get("jobId");

    if (!jobId) {
      return NextResponse.json({ error: "Job ID is required" }, { status: 400 });
    }

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
