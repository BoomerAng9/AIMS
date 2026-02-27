/**
 * Report by ID API — GET /api/reports/[id]
 * Returns the full research report data for a given report ID.
 */

import { NextRequest, NextResponse } from 'next/server';

// NOTE: This references the same in-memory store from the parent route.
// In production this will be replaced with Firestore queries.
// For now, we re-export a placeholder that returns 404 — the actual
// store lives in the POST handler at /api/reports/route.ts.
// Once migrated to Firestore, this will query by document ID.

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;

  // Placeholder: in-memory store isn't shared across route segments
  // in Next.js route handlers. Return a not-found so the frontend
  // can fall back to passing data via query params or sessionStorage.
  return NextResponse.json(
    { error: `Report ${id} not found. Reports are session-scoped until Firestore migration.` },
    { status: 404 },
  );
}
