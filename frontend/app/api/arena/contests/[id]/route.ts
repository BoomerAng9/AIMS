/**
 * Arena Single Contest API
 *
 * GET /api/arena/contests/[id] — Get contest details
 *
 * Data source: Database (Prisma)
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // TODO: Query from Prisma when Arena DB schema is live
  // For now return 404 — no fabricated data
  return NextResponse.json({ error: 'Contest not found' }, { status: 404 });
}
