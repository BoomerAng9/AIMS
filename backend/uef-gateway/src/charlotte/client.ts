/**
 * AIMS-side bridge to Charlotte (the ecosystem orchestrator).
 *
 * The AIMS engine routes governed work THROUGH Charlotte: it POSTs a Plug
 * Blueprint deploy request to her API and consumes the DeployResponse
 * (status on the six-status canon, a signed receipt, and an SSE
 * event_channel). Charlotte is external and untouched — this client lives
 * entirely on the AIMS side and speaks her wire contract.
 *
 * Contract (charlotte/schemas.py):
 *   POST /deploy   { blueprint_id, prompt, mode?, parameters }
 *               -> { deployment_id, blueprint_id, status, receipt,
 *                    result, event_channel, ... }
 *   GET  /events/{deployment_id}   (SSE)
 */

export interface CharlotteDeployRequest {
  blueprintId: string;
  prompt: string;
  mode?: string;
  parameters?: Record<string, unknown>;
}

export interface CharlotteDeployResult {
  deploymentId: string;
  blueprintId: string;
  /** Normalized to upper case (six-status canon: PASS/FAIL/.../BLOCKED). */
  status: string;
  receipt: unknown | null;
  result: Record<string, unknown>;
  eventChannel: string | null;
  /** The full, unmapped response body for callers that need more. */
  raw: unknown;
}

export class CharlotteError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
  ) {
    super(message);
    this.name = 'CharlotteError';
  }
}

export interface CharlotteClientOptions {
  baseUrl: string;
  apiKey?: string;
  /** Injectable for tests; defaults to the global fetch. */
  fetchImpl?: typeof fetch;
}

export class CharlotteClient {
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly fetchImpl: typeof fetch;

  constructor(opts: CharlotteClientOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/+$/, '');
    this.apiKey = opts.apiKey;
    this.fetchImpl = opts.fetchImpl ?? fetch;
  }

  async deploy(req: CharlotteDeployRequest): Promise<CharlotteDeployResult> {
    const headers: Record<string, string> = {
      'content-type': 'application/json',
    };
    if (this.apiKey) headers.authorization = `Bearer ${this.apiKey}`;

    const res = await this.fetchImpl(`${this.baseUrl}/deploy`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        blueprint_id: req.blueprintId,
        prompt: req.prompt,
        ...(req.mode ? { mode: req.mode } : {}),
        parameters: req.parameters ?? {},
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new CharlotteError(
        `Charlotte /deploy failed: HTTP ${res.status}${detail ? ` — ${detail}` : ''}`,
        res.status,
      );
    }

    const data = (await res.json()) as Record<string, unknown>;
    return {
      deploymentId: String(data.deployment_id ?? ''),
      blueprintId: String(data.blueprint_id ?? req.blueprintId),
      status: String(data.status ?? '').toUpperCase(),
      receipt: data.receipt ?? null,
      result: (data.result as Record<string, unknown>) ?? {},
      eventChannel: (data.event_channel as string | null) ?? null,
      raw: data,
    };
  }

  /** URL of Charlotte's SSE event stream for a deployment. */
  eventsUrl(deploymentId: string): string {
    return `${this.baseUrl}/events/${deploymentId}`;
  }
}

/** Only PASS ships (six-status canon). */
export function isPass(result: { status: string }): boolean {
  return result.status.toUpperCase() === 'PASS';
}
