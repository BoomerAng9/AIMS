import { NextRequest, NextResponse } from "next/server";
import { klingVideo } from "@/lib/kling-video";

/**
 * POST /api/video/analyze
 * Analyze a video prompt and get optimization suggestions
 */
export async function POST(request: NextRequest) {
  try {
    const { prompt, model = "kling-2.6-motion" } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const analysis = klingVideo.analyzePrompt(prompt, model);
    const optimized = klingVideo.optimizePrompt(prompt, model);

    return NextResponse.json({
      original: prompt,
      optimized,
      analysis,
      success: true,
    });
  } catch (error: any) {
    console.error("Prompt analysis error:", error);
    return NextResponse.json(
      { error: error.message || "Analysis failed" },
      { status: 500 }
    );
  }
}
