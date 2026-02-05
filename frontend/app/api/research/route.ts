import { NextRequest, NextResponse } from "next/server";
import { geminiResearch } from "@/lib/gemini-research";

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // Run deep research
    const research = await geminiResearch.research(prompt);

    // Generate video script
    const script = await geminiResearch.generateVideoScript(research);

    return NextResponse.json({
      research,
      script,
      success: true,
    });
  } catch (error: any) {
    console.error("Research API error:", error);
    return NextResponse.json(
      { error: error.message || "Research failed" },
      { status: 500 }
    );
  }
}
