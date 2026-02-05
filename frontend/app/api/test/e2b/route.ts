import { NextRequest, NextResponse } from "next/server";
import { e2bService } from "@/lib/services/e2b";

export async function POST(request: NextRequest) {
  try {
    const { code, language = "python" } = await request.json();

    if (!code) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    const result = await e2bService.executeCode(code, language);

    return NextResponse.json({
      success: result.exitCode === 0,
      ...result,
    });
  } catch (error: any) {
    console.error("E2B test error:", error);
    return NextResponse.json(
      { error: error.message || "E2B test failed" },
      { status: 500 }
    );
  }
}
