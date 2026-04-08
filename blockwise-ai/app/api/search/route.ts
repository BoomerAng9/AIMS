import { NextRequest, NextResponse } from 'next/server';
import { geocodeAddress } from '@/lib/google-maps';
import { searchPropertyRecords, searchComps } from '@/lib/brave-search';

export async function POST(req: NextRequest) {
  const { location, filters } = await req.json();

  const geo = await geocodeAddress(location);
  if (!geo) {
    return NextResponse.json({ error: 'Could not geocode location' }, { status: 400 });
  }

  // Tier 2: Brave Search for property intel
  const [records, comps] = await Promise.allSettled([
    searchPropertyRecords(location),
    searchComps(location),
  ]);

  return NextResponse.json({
    properties: [],
    total: 0,
    center: geo,
    radius: filters?.radius || 5,
    rawRecords: records.status === 'fulfilled' ? records.value : [],
    rawComps: comps.status === 'fulfilled' ? comps.value : [],
  });
}
