// frontend/app/api/social/feed/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface FeedItem {
  id: string;
  platform: string;
  type: string;
  title: string;
  preview: string;
  timestamp: string;
  url?: string;
  metrics: { label: string; value: string }[];
}

/** GET /api/social/feed — Unified activity feed across all connected platforms */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const platform = searchParams.get("platform") || "all";
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

  // Sample feed data — replaced with real API calls when accounts are connected
  const sampleFeed: FeedItem[] = [
    {
      id: "gh-1",
      platform: "github",
      type: "commit",
      title: "feat: wire LUC calculator with seed data",
      preview: "Pushed to main — A.I.M.S. repository",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      metrics: [
        { label: "Files", value: "8" },
        { label: "Additions", value: "+342" },
      ],
    },
    {
      id: "x-1",
      platform: "x",
      type: "post",
      title: "Excited to share our latest A.I.M.S. update...",
      preview: "The agentic web is here. Our R&D hub now tracks protocols, revenue models, and codebase sync.",
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      metrics: [
        { label: "Likes", value: "47" },
        { label: "Replies", value: "12" },
        { label: "Views", value: "1.2K" },
      ],
    },
    {
      id: "reddit-1",
      platform: "reddit",
      type: "post",
      title: "Building an AI-first platform in 2026 — lessons learned",
      preview: "Posted in r/artificial — A deep-dive into agentic protocols.",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      metrics: [
        { label: "Upvotes", value: "89" },
        { label: "Comments", value: "23" },
      ],
    },
    {
      id: "yt-1",
      platform: "youtube",
      type: "upload",
      title: "A.I.M.S. Platform Demo — Agentic Web Overview",
      preview: "New video uploaded showcasing R&D Hub features.",
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      metrics: [
        { label: "Views", value: "324" },
        { label: "Likes", value: "28" },
      ],
    },
    {
      id: "discord-1",
      platform: "discord",
      type: "message",
      title: "Shared update in #announcements",
      preview: "A.I.M.S. Community Server — New research hub feature is live!",
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      metrics: [
        { label: "Reactions", value: "15" },
        { label: "Replies", value: "8" },
      ],
    },
    {
      id: "gh-2",
      platform: "github",
      type: "pr",
      title: "fix: comprehensive UI review — branding, RBAC nav",
      preview: "Pull request merged — 12 files changed.",
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      metrics: [
        { label: "Reviews", value: "2" },
        { label: "Files", value: "12" },
      ],
    },
  ];

  // Filter by platform if specified
  const filtered = platform === "all"
    ? sampleFeed
    : sampleFeed.filter((item) => item.platform === platform);

  return NextResponse.json({
    feed: filtered.slice(0, limit),
    total: filtered.length,
    platforms: ["github", "x", "reddit", "discord", "youtube"],
    connectedPlatforms: [], // Populated when real OAuth is wired
  });
}
