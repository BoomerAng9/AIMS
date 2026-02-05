import { NextResponse } from "next/server";
import { findPlugById, PLUG_REGISTRY } from "@/lib/plugs/registry";

// ─── GET /api/plugs/:plugId ─────────────────────────────────
// Returns the plug definition + mock data for the plug UI.
// When plugId is "catalog", returns all plugs.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ plugId: string }> }
) {
  const { plugId } = await params;

  // Catalog endpoint: return all plugs
  if (plugId === "catalog") {
    return NextResponse.json({ plugs: PLUG_REGISTRY });
  }

  const plug = findPlugById(plugId);
  if (!plug) {
    return NextResponse.json(
      { error: `Plug "${plugId}" not found in registry.` },
      { status: 404 }
    );
  }

  // For the Perform plug, return mock athlete data
  if (plugId === "perform") {
    return NextResponse.json({
      plug,
      data: {
        athletes: MOCK_ATHLETES,
        pipelineStats: {
          identified: 12,
          scouted: 8,
          shortlisted: 5,
          offerPending: 2,
          committed: 1,
        },
        recentReports: MOCK_REPORTS,
      },
    });
  }

  // Generic plug response
  return NextResponse.json({ plug, data: null });
}

// ─── POST /api/plugs/:plugId ────────────────────────────────
// Handles plug-specific actions (e.g., generate scouting report, run analysis).
export async function POST(
  request: Request,
  { params }: { params: Promise<{ plugId: string }> }
) {
  const { plugId } = await params;
  const plug = findPlugById(plugId);

  if (!plug) {
    return NextResponse.json(
      { error: `Plug "${plugId}" not found in registry.` },
      { status: 404 }
    );
  }

  if (plug.status !== "active") {
    return NextResponse.json(
      {
        error: `Plug "${plug.name}" is not yet active (status: ${plug.status}).`,
        message: "This plug is coming soon. Join the waitlist for early access.",
      },
      { status: 403 }
    );
  }

  const body = await request.json();

  // ── Perform-specific actions ──
  if (plugId === "perform") {
    const { action } = body;

    if (action === "generate-report") {
      const { athleteId } = body;
      const athlete = MOCK_ATHLETES.find((a) => a.id === athleteId);
      if (!athlete) {
        return NextResponse.json({ error: "Athlete not found" }, { status: 404 });
      }

      // Stub: In production this calls Vertex AI with the prompt chain from perform_plug.md
      const report = {
        id: `rpt_${Date.now()}`,
        athleteId,
        scoutId: "scout_acheevy",
        date: new Date().toISOString().split("T")[0],
        event: "film-review",
        grades: {
          overall: Math.round(athlete.scoutingGrade),
          athleticism: Math.round(70 + Math.random() * 25),
          technique: Math.round(65 + Math.random() * 25),
          gameIQ: Math.round(60 + Math.random() * 30),
          coachability: Math.round(70 + Math.random() * 20),
          intangibles: Math.round(65 + Math.random() * 25),
        },
        strengths: ["Explosive first step", "Strong lateral movement", "High motor"],
        weaknesses: ["Needs to improve ball security", "Footwork inconsistencies"],
        projection: athlete.scoutingGrade >= 80 ? "elite" : athlete.scoutingGrade >= 65 ? "starter" : "rotational",
        comparison: "Reminiscent of a young prospect with similar measurables",
        narrative: `${athlete.firstName} ${athlete.lastName} demonstrates ${athlete.scoutingGrade >= 75 ? "elite-level" : "solid"} tools at the ${athlete.position} position. Film review shows consistent ${athlete.scoutingGrade >= 75 ? "high-impact" : "reliable"} play with room for development in technique refinement. Projects as a ${athlete.scoutingGrade >= 80 ? "Day 1 starter" : "developmental contributor"} at the next level.`,
      };

      return NextResponse.json({
        message: `Scouting report generated for ${athlete.firstName} ${athlete.lastName}.`,
        report,
      });
    }

    if (action === "analyze-pipeline") {
      return NextResponse.json({
        message: "Pipeline analysis complete.",
        recommendations: [
          { priority: "high", action: "Schedule combine evaluation for Marcus Johnson" },
          { priority: "high", action: "Extend offer to Aisha Patel before competing programs" },
          { priority: "medium", action: "Request updated film from 3 shortlisted prospects" },
          { priority: "low", action: "Expand scouting radius to include Southeast region" },
        ],
      });
    }
  }

  return NextResponse.json({
    message: `Action received for plug "${plug.name}". Processing...`,
    plugId,
    body,
  });
}

// ─── Mock Data ───────────────────────────────────────────────

const MOCK_ATHLETES = [
  {
    id: "ath_001",
    firstName: "Marcus",
    lastName: "Johnson",
    sport: "football",
    position: "Wide Receiver",
    age: 18,
    height: "6'2\"",
    weight: 195,
    school: "Lincoln High",
    graduationYear: 2026,
    gpa: 3.4,
    location: { city: "Houston", state: "TX" },
    scoutingGrade: 87,
    recruitmentStatus: "evaluating" as const,
    tags: ["speed", "route-running", "big-play"],
  },
  {
    id: "ath_002",
    firstName: "Aisha",
    lastName: "Patel",
    sport: "basketball",
    position: "Point Guard",
    age: 17,
    height: "5'8\"",
    weight: 145,
    school: "Westview Academy",
    graduationYear: 2027,
    gpa: 3.9,
    location: { city: "Atlanta", state: "GA" },
    scoutingGrade: 92,
    recruitmentStatus: "shortlisted" as const,
    tags: ["court-vision", "leadership", "defensive-intensity"],
  },
  {
    id: "ath_003",
    firstName: "Dante",
    lastName: "Rivers",
    sport: "football",
    position: "Cornerback",
    age: 18,
    height: "5'11\"",
    weight: 180,
    school: "Oakridge Prep",
    graduationYear: 2026,
    gpa: 3.1,
    location: { city: "Miami", state: "FL" },
    scoutingGrade: 78,
    recruitmentStatus: "prospect" as const,
    tags: ["ball-hawk", "man-coverage", "physicality"],
  },
  {
    id: "ath_004",
    firstName: "Sofia",
    lastName: "Chen",
    sport: "soccer",
    position: "Midfielder",
    age: 17,
    height: "5'6\"",
    weight: 135,
    school: "Bay Area Soccer Academy",
    graduationYear: 2027,
    gpa: 3.7,
    location: { city: "San Jose", state: "CA" },
    scoutingGrade: 84,
    recruitmentStatus: "contacted" as const,
    tags: ["passing-range", "work-rate", "set-pieces"],
  },
  {
    id: "ath_005",
    firstName: "Jordan",
    lastName: "Williams",
    sport: "basketball",
    position: "Power Forward",
    age: 18,
    height: "6'7\"",
    weight: 225,
    school: "Central Academy",
    graduationYear: 2026,
    gpa: 3.2,
    location: { city: "Chicago", state: "IL" },
    scoutingGrade: 81,
    recruitmentStatus: "evaluating" as const,
    tags: ["rim-protection", "rebounding", "mid-range"],
  },
  {
    id: "ath_006",
    firstName: "Kai",
    lastName: "Nakamura",
    sport: "baseball",
    position: "Pitcher",
    age: 17,
    height: "6'3\"",
    weight: 200,
    school: "Pacific Prep",
    graduationYear: 2027,
    gpa: 3.6,
    location: { city: "Seattle", state: "WA" },
    scoutingGrade: 89,
    recruitmentStatus: "shortlisted" as const,
    tags: ["fastball-velocity", "breaking-ball", "composure"],
  },
];

const MOCK_REPORTS = [
  {
    id: "rpt_001",
    athleteId: "ath_001",
    athleteName: "Marcus Johnson",
    date: "2026-01-28",
    event: "game",
    overallGrade: 87,
  },
  {
    id: "rpt_002",
    athleteId: "ath_002",
    athleteName: "Aisha Patel",
    date: "2026-01-25",
    event: "combine",
    overallGrade: 92,
  },
  {
    id: "rpt_003",
    athleteId: "ath_006",
    athleteName: "Kai Nakamura",
    date: "2026-01-20",
    event: "game",
    overallGrade: 89,
  },
];
