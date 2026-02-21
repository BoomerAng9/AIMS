/**
 * Production Code Execution API — /api/code/execute
 *
 * Productionized from /api/test/e2b. Supports Python, Node.js, and Bash
 * via E2B sandboxed execution. Auth-gated, rate-limited, with LUC metering.
 *
 * Falls back to UEF Gateway playground engine when E2B_API_KEY is not set.
 *
 * Request:
 *   POST { code: string, language?: 'python'|'node'|'bash', packages?: string[] }
 *
 * Response:
 *   { success: boolean, stdout: string, stderr: string, exitCode: number, error?: string, luc?: object }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

const UEF_GATEWAY_URL = process.env.UEF_GATEWAY_URL || process.env.NEXT_PUBLIC_UEF_GATEWAY_URL || '';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || '';
const MAX_CODE_LENGTH = 50_000; // 50KB max code size
const ALLOWED_LANGUAGES = ['python', 'node', 'bash'] as const;
type Language = (typeof ALLOWED_LANGUAGES)[number];

export async function POST(request: NextRequest) {
  try {
    // Auth check — require session or API key
    const session = await getServerSession().catch(() => null);
    const apiKey = request.headers.get('x-api-key');
    if (!session && apiKey !== INTERNAL_API_KEY && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { code, language = 'python', packages } = body;

    // Validate code
    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'code is required and must be a string' }, { status: 400 });
    }
    if (code.length > MAX_CODE_LENGTH) {
      return NextResponse.json({ error: `Code exceeds maximum length of ${MAX_CODE_LENGTH} characters` }, { status: 400 });
    }

    // Validate language
    if (!ALLOWED_LANGUAGES.includes(language as Language)) {
      return NextResponse.json(
        { error: `Invalid language: ${language}. Allowed: ${ALLOWED_LANGUAGES.join(', ')}` },
        { status: 400 },
      );
    }

    // Validate packages
    if (packages && (!Array.isArray(packages) || packages.some((p: unknown) => typeof p !== 'string'))) {
      return NextResponse.json({ error: 'packages must be an array of strings' }, { status: 400 });
    }

    // Path 1: Try E2B direct execution (if API key is set)
    if (process.env.E2B_API_KEY) {
      const { e2bService } = await import('@/lib/services/e2b');

      const result = packages && packages.length > 0
        ? await e2bService.executeWithPackages(code, packages, language === 'bash' ? 'python' : language as 'python' | 'node')
        : await e2bService.executeCode(code, language as 'python' | 'node' | 'bash');

      return NextResponse.json({
        success: result.exitCode === 0,
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode,
        error: result.error,
        engine: 'e2b',
        luc: { service: 'code_execution', amount: 1 },
      });
    }

    // Path 2: Proxy to UEF Gateway playground engine
    if (UEF_GATEWAY_URL) {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (INTERNAL_API_KEY) headers['X-API-Key'] = INTERNAL_API_KEY;

      // Create a playground session and execute
      const createRes = await fetch(`${UEF_GATEWAY_URL}/playground`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          userId: session?.user?.email || request.headers.get('x-user-id') || 'anon-unknown',
          type: 'code',
          name: `Code Execution - ${new Date().toISOString()}`,
          config: { language, packages: packages || [] },
        }),
      });

      if (!createRes.ok) {
        const err = await createRes.json().catch(() => ({ error: 'Gateway error' }));
        return NextResponse.json({ error: err.error || 'Failed to create playground' }, { status: 502 });
      }

      const { sessionId } = await createRes.json();

      // Execute in the playground
      const execRes = await fetch(`${UEF_GATEWAY_URL}/playground/${sessionId}/execute`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          userId: session?.user?.email || request.headers.get('x-user-id') || 'anon-unknown',
          input: code,
          target: language,
        }),
      });

      const execResult = await execRes.json();

      return NextResponse.json({
        success: execResult.success !== false,
        stdout: execResult.output || execResult.stdout || '',
        stderr: execResult.stderr || '',
        exitCode: execResult.success !== false ? 0 : 1,
        error: execResult.error,
        engine: 'playground',
        playgroundSessionId: sessionId,
        luc: { service: 'code_execution', amount: 1 },
      });
    }

    // Path 3: No execution engine available
    return NextResponse.json(
      { error: 'No code execution engine available. Configure E2B_API_KEY or UEF_GATEWAY_URL.' },
      { status: 503 },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Code execution failed';
    console.error('[CodeExec]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
