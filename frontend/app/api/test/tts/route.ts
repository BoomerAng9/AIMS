import { NextRequest, NextResponse } from "next/server";
import { elevenLabsService } from "@/lib/services/elevenlabs";

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const audioDataUrl = await elevenLabsService.textToSpeechDataUrl(text);

    return NextResponse.json({
      success: true,
      audioUrl: audioDataUrl,
    });
  } catch (error: any) {
    console.error("TTS test error:", error);
    return NextResponse.json(
      { error: error.message || "TTS test failed" },
      { status: 500 }
    );
  }
}
