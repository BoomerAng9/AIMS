/**
 * AIMS-side bridge to Charlotte (the orchestrator). The engine calls
 * Charlotte's governed API — POST /deploy with a Plug Blueprint, then
 * consumes her DeployResponse (status on the six-status canon, signed
 * receipt, event_channel) and the SSE channel. Charlotte is untouched;
 * this client lives on the AIMS side.
 */
import { CharlotteClient, CharlotteError, isPass } from '../client';

type FetchLike = typeof fetch;

function mockFetch(resp: {
  ok: boolean;
  status: number;
  json?: unknown;
  text?: string;
}): jest.Mock {
  return jest.fn(async () => ({
    ok: resp.ok,
    status: resp.status,
    json: async () => resp.json,
    text: async () => resp.text ?? '',
  }));
}

describe('CharlotteClient.deploy', () => {
  it('POSTs the governed request (Charlotte field names) and maps the response', async () => {
    const fetchImpl = mockFetch({
      ok: true,
      status: 200,
      json: {
        deployment_id: 'd-1',
        blueprint_id: 'bp-1',
        status: 'pass',
        receipt: { id: 'r-1' },
        result: { ok: true },
        event_channel: 'evt-1',
      },
    });
    const client = new CharlotteClient({
      baseUrl: 'http://charlotte.test/',
      apiKey: 'k',
      fetchImpl: fetchImpl as unknown as FetchLike,
    });

    const res = await client.deploy({
      blueprintId: 'bp-1',
      prompt: 'build me an app',
      parameters: { connector_id: 'http_api' },
    });

    // Request shape
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://charlotte.test/deploy');
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>).authorization).toBe('Bearer k');
    const body = JSON.parse(init.body as string);
    expect(body.blueprint_id).toBe('bp-1');
    expect(body.prompt).toBe('build me an app');
    expect(body.parameters).toEqual({ connector_id: 'http_api' });

    // Response mapping (camelCase + normalized status)
    expect(res.deploymentId).toBe('d-1');
    expect(res.blueprintId).toBe('bp-1');
    expect(res.status).toBe('PASS');
    expect(res.eventChannel).toBe('evt-1');
    expect(res.receipt).toEqual({ id: 'r-1' });
    expect(res.result).toEqual({ ok: true });
  });

  it('throws CharlotteError on a non-2xx response', async () => {
    const fetchImpl = mockFetch({ ok: false, status: 502, text: 'bad gateway' });
    const client = new CharlotteClient({
      baseUrl: 'http://charlotte.test',
      fetchImpl: fetchImpl as unknown as FetchLike,
    });
    await expect(
      client.deploy({ blueprintId: 'bp', prompt: 'x' }),
    ).rejects.toBeInstanceOf(CharlotteError);
  });

  it('builds the SSE events url for a deployment', () => {
    const client = new CharlotteClient({
      baseUrl: 'http://charlotte.test/',
      fetchImpl: mockFetch({ ok: true, status: 200, json: {} }) as unknown as FetchLike,
    });
    expect(client.eventsUrl('d-9')).toBe('http://charlotte.test/events/d-9');
  });
});

describe('isPass', () => {
  it('reflects the six-status canon (only PASS ships)', () => {
    expect(isPass({ status: 'PASS' })).toBe(true);
    expect(isPass({ status: 'pass' })).toBe(true);
    expect(isPass({ status: 'BLOCKED' })).toBe(false);
    expect(isPass({ status: 'NEEDS_HUMAN_REVIEW' })).toBe(false);
  });
});
