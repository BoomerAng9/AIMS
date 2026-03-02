import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'blockwise-ai',
    timestamp: new Date().toISOString(),
  });
}
