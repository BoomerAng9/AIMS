import { NextRequest, NextResponse } from 'next/server';
import { dispatchExport, buildReportHtml } from '@/lib/export';
import type { ExportOptions } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { format, title, data, recipientEmail, accessToken } = body as ExportOptions & {
      accessToken?: string;
    };

    if (!format || !title || !data) {
      return NextResponse.json(
        { error: 'Missing required fields: format, title, data' },
        { status: 400 }
      );
    }

    // For PDF, return the generated HTML for client-side rendering
    if (format === 'pdf') {
      const html = buildReportHtml({ format, title, data });
      return NextResponse.json({ html, format: 'pdf' });
    }

    const result = await dispatchExport(
      { format, title, data, recipientEmail },
      accessToken
    );

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Export failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
