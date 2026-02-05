import { NextRequest, NextResponse } from "next/server";
import { unifiedSearch } from "@/lib/services/search";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");

    if (!query) {
      return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 });
    }

    const results = await unifiedSearch(query, { count: 5 });

    return NextResponse.json({
      success: true,
      results,
      query,
    });
  } catch (error: any) {
    console.error("Search test error:", error);
    return NextResponse.json(
      { error: error.message || "Search test failed" },
      { status: 500 }
    );
  }
}
