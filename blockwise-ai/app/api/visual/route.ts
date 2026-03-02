import { NextRequest, NextResponse } from 'next/server';
import { generatePropertyCard, generateNeighborhoodInfographic } from '@/lib/nano-banana';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, data } = body as {
      type: 'property_card' | 'neighborhood_infographic';
      data: Record<string, unknown>;
    };

    if (!type || !data) {
      return NextResponse.json(
        { error: 'Missing required fields: type, data' },
        { status: 400 }
      );
    }

    let result: { imageBase64: string; mimeType: string };

    if (type === 'property_card') {
      result = await generatePropertyCard(data as unknown as Parameters<typeof generatePropertyCard>[0]);
    } else if (type === 'neighborhood_infographic') {
      result = await generateNeighborhoodInfographic(
        data as unknown as Parameters<typeof generateNeighborhoodInfographic>[0]
      );
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json({
      image: `data:${result.mimeType};base64,${result.imageBase64}`,
      mimeType: result.mimeType,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Visual generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
