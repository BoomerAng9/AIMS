import { NextRequest, NextResponse } from 'next/server';
import { geocodeAddress, getElevation } from '@/lib/google-maps';
import { searchCrimeStats, searchBuildingPermits, searchGentrification } from '@/lib/brave-search';
import { calculateBlockScore, getVerdict, getVerdictLabel } from '@/lib/neighborhood';

export async function POST(req: NextRequest) {
  const { address, lat, lng } = await req.json();

  const coords = lat && lng ? { lat, lng } : await geocodeAddress(address);
  if (!coords) {
    return NextResponse.json({ error: 'Could not geocode address' }, { status: 400 });
  }

  const zip = address?.match(/\d{5}/)?.[0] || '';

  // Parallel data fetching — Tier 1 + 2
  const [elevation, crime, permits, gentrification] = await Promise.allSettled([
    getElevation(coords.lat, coords.lng),
    searchCrimeStats(address, zip),
    searchBuildingPermits(zip),
    searchGentrification(address),
  ]);

  // Placeholder scores — enriched by Tier 3/4 in later phases
  const blockScore = calculateBlockScore({
    avgSchoolRating: 7,
    crimeScore: 60,
    yoyCrimeTrend: -2,
    oneYearAppreciation: 5,
    walkScore: 50,
    transitScore: 30,
    bikeScore: 40,
    permits6mo: 8,
    gentrificationSignal: 'stable',
  });

  const verdict = getVerdict(blockScore.overall);

  return NextResponse.json({
    address,
    coords,
    blockScore,
    verdict,
    verdictLabel: getVerdictLabel(verdict),
    elevation: elevation.status === 'fulfilled' ? elevation.value : null,
    rawCrime: crime.status === 'fulfilled' ? crime.value : [],
    rawPermits: permits.status === 'fulfilled' ? permits.value : [],
    rawGentrification: gentrification.status === 'fulfilled' ? gentrification.value : [],
  });
}
