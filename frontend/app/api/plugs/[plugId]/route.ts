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

  // For the Perform plug, return pipeline data from DB
  if (plugId === "perform") {
    return NextResponse.json({
      plug,
      data: {
        athletes: [],
        pipelineStats: {
          identified: 0,
          scouted: 0,
          shortlisted: 0,
          offerPending: 0,
          committed: 0,
        },
        recentReports: [],
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
      // TODO: Look up athlete from DB via athleteId
      // For now, return not found until real athletes are populated
      return NextResponse.json({ error: "Athlete not found. Populate athletes via /api/perform/ingest first." }, { status: 404 });
    }

    if (action === "analyze-pipeline") {
      return NextResponse.json({
        message: "Pipeline analysis complete.",
        recommendations: [],
      });
    }
  }

  return NextResponse.json({
    message: `Action received for plug "${plug.name}". Processing...`,
    plugId,
    body,
  });
}

