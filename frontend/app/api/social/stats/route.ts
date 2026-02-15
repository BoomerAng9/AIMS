// frontend/app/api/social/stats/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/** GET /api/social/stats — Aggregated stats across all connected platforms */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Sample stats — replaced with real aggregation when accounts are connected
  return NextResponse.json({
    overview: {
      totalPosts: 18,
      totalEngagements: 2400,
      totalCommits: 34,
      totalReach: 8700,
    },
    weeklyChange: {
      posts: 5,
      engagements: 320,
      commits: 12,
      reach: 1200,
    },
    platformBreakdown: [
      { platform: "github", posts: 6, engagements: 45, connected: false },
      { platform: "x", posts: 4, engagements: 1250, connected: false },
      { platform: "reddit", posts: 3, engagements: 450, connected: false },
      { platform: "discord", posts: 2, engagements: 120, connected: false },
      { platform: "youtube", posts: 3, engagements: 535, connected: false },
    ],
    trending: {
      bestPlatform: "x",
      bestPost: "Excited to share our latest A.I.M.S. update...",
      bestEngagement: 1250,
    },
  });
}
