// Blockwise AI — Google Maps Client Utilities

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || '';
const SERVER_KEY = process.env.GOOGLE_MAPS_SERVER_KEY || '';

/** Geocode an address to lat/lng (server-side) */
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  const res = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${SERVER_KEY}`
  );
  const data = await res.json();
  if (data.status === 'OK' && data.results[0]) {
    const { lat, lng } = data.results[0].geometry.location;
    return { lat, lng };
  }
  return null;
}

/** Get Street View thumbnail URL */
export function getStreetViewUrl(lat: number, lng: number, width = 400, height = 250): string {
  return `https://maps.googleapis.com/maps/api/streetview?size=${width}x${height}&location=${lat},${lng}&key=${MAPS_KEY}`;
}

/** Get elevation for flood risk assessment (server-side) */
export async function getElevation(lat: number, lng: number): Promise<number | null> {
  const res = await fetch(
    `https://maps.googleapis.com/maps/api/elevation/json?locations=${lat},${lng}&key=${SERVER_KEY}`
  );
  const data = await res.json();
  if (data.status === 'OK' && data.results[0]) {
    return data.results[0].elevation;
  }
  return null;
}

/** Calculate distance between two points in miles (Haversine formula) */
export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
