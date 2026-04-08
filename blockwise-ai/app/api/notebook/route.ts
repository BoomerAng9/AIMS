import { NextRequest, NextResponse } from 'next/server';
import { createPropertyNotebook } from '@/lib/notebooklm';
import type { NotebookRequest } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body: NotebookRequest = await req.json();

    if (!body.propertyAddress || !body.sources?.length) {
      return NextResponse.json(
        { error: 'Missing required fields: propertyAddress, sources' },
        { status: 400 }
      );
    }

    const result = await createPropertyNotebook(body);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Notebook creation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
