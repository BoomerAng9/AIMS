/**
 * LUC Usage API — Free-Tier Defaults
 *
 * Returns current tier quotas and usage for the dashboard widgets.
 * Session-based tier detection can be layered in later;
 * for now returns Explorer (free) defaults.
 */

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    tier: "free",
    name: "Explorer",
    quotas: {
      api_calls: 50,
      brave_searches: 10,
      container_hours: 0.5,
      storage_gb: 1,
      elevenlabs_chars: 5000,
      n8n_executions: 5,
    },
    used: {
      api_calls: 0,
      brave_searches: 0,
      container_hours: 0,
      storage_gb: 0,
      elevenlabs_chars: 0,
      n8n_executions: 0,
    },
    balance: "$0.00",
  });
}
