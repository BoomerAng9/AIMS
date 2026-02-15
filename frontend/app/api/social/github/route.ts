// frontend/app/api/social/github/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/** GET /api/social/github — Fetch user's GitHub repos and recent activity */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check for stored GitHub access token (placeholder until OAuth is fully wired)
  const githubToken = req.headers.get("x-github-token");

  if (!githubToken) {
    // Return sample data when no token is provided
    return NextResponse.json({
      connected: false,
      message: "GitHub account not connected. Connect via Connected Accounts to see live data.",
      sampleData: {
        repos: [
          { name: "A.I.M.S", language: "TypeScript", stars: 0, updatedAt: new Date().toISOString() },
        ],
        recentCommits: [
          {
            sha: "0ecab3c",
            message: "feat: wire LUC calculator with seed data and persistent storage",
            date: new Date().toISOString(),
            repo: "A.I.M.S",
          },
        ],
        stats: {
          totalRepos: 1,
          totalCommits: 34,
          totalStars: 0,
          languages: ["TypeScript", "Python", "CSS"],
        },
      },
    });
  }

  try {
    // Fetch repos from GitHub API
    const reposRes = await fetch("https://api.github.com/user/repos?sort=updated&per_page=10", {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!reposRes.ok) {
      return NextResponse.json({ error: "Failed to fetch GitHub repos" }, { status: reposRes.status });
    }

    const repos = await reposRes.json();

    // Fetch recent events
    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });
    const user = userRes.ok ? await userRes.json() : null;

    const eventsRes = user
      ? await fetch(`https://api.github.com/users/${user.login}/events?per_page=10`, {
          headers: {
            Authorization: `Bearer ${githubToken}`,
            Accept: "application/vnd.github.v3+json",
          },
        })
      : null;
    const events = eventsRes?.ok ? await eventsRes.json() : [];

    return NextResponse.json({
      connected: true,
      user: user ? { login: user.login, avatarUrl: user.avatar_url, publicRepos: user.public_repos } : null,
      repos: repos.map((r: Record<string, unknown>) => ({
        name: r.name,
        fullName: r.full_name,
        language: r.language,
        stars: r.stargazers_count,
        forks: r.forks_count,
        updatedAt: r.updated_at,
        url: r.html_url,
      })),
      recentEvents: events.slice(0, 10).map((e: Record<string, unknown>) => ({
        type: e.type,
        repo: (e.repo as Record<string, unknown>)?.name,
        createdAt: e.created_at,
      })),
    });
  } catch (err) {
    console.error("[Social/GitHub] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** POST /api/social/github — Connect/disconnect GitHub account */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { action } = body;

  if (action === "connect") {
    // In production, redirect to GitHub OAuth flow
    // For now, return the OAuth URL
    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json({ error: "GitHub OAuth not configured" }, { status: 503 });
    }
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/callback/github`;
    const oauthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=read:user,repo`;
    return NextResponse.json({ oauthUrl });
  }

  if (action === "disconnect") {
    // Clear stored GitHub token (placeholder)
    return NextResponse.json({ success: true, message: "GitHub account disconnected" });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
