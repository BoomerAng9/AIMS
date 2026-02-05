import { NextRequest, NextResponse } from "next/server";
import { groqService } from "@/lib/services/groq";

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const response = await groqService.quickResponse(prompt);

    return NextResponse.json({
      success: true,
      response,
    });
  } catch (error: any) {
    console.error("Groq test error:", error);
    return NextResponse.json(
      { error: error.message || "Groq test failed" },
      { status: 500 }
    );
  }
}
