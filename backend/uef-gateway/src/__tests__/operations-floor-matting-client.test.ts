import {
  matteCharacterVideo,
  mattingHealth,
  MattingClientError,
  type MatteRequest,
  type MatteResponse,
} from '../operations-floor/matting-client';

function fixtureReq(overrides: Partial<MatteRequest> = {}): MatteRequest {
  return {
    sourceUrl: 'https://storage.googleapis.com/test/char.mp4',
    outputGcsUri: 'gs://cosmos-operations-floor-artifacts/matte/night-port-v1.webm',
    sourceEventId: 'evt-planner-001',
    ...overrides,
  };
}

function okResponse(): MatteResponse {
  return {
    output_gcs_uri:
      'gs://cosmos-operations-floor-artifacts/matte/night-port-v1.webm',
    duration_s: 6.0,
    frame_count: 144,
    size_bytes: 1_234_567,
    backend: 'rembg:isnet-general-use',
    source_event_id: 'evt-planner-001',
    avg_foreground_ratio: 0.187,
  };
}

interface MockCall {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
}

function makeFetchMock(
  handler: (url: string, init: RequestInit) => Response
): { fetch: typeof fetch; calls: MockCall[] } {
  const calls: MockCall[] = [];
  const mock = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    calls.push({
      url,
      method: (init?.method ?? 'GET') as string,
      headers: (init?.headers ?? {}) as Record<string, string>,
      body: init?.body ? String(init.body) : undefined,
    });
    return handler(url, init ?? {});
  }) as typeof fetch;
  return { fetch: mock, calls };
}

const CFG = {
  serviceUrl: 'https://matting.example.com',
  bearerToken: 'test-token',
};

describe('Operations Floor -- matting client', () => {
  describe('matteCharacterVideo', () => {
    it('POSTs to /matte with bearer token and snake_case body', async () => {
      const { fetch: fm, calls } = makeFetchMock(
        () => new Response(JSON.stringify(okResponse()), { status: 200 })
      );

      const out = await matteCharacterVideo(fixtureReq(), CFG, fm);

      expect(out.output_gcs_uri).toBe(okResponse().output_gcs_uri);
      expect(out.backend).toBe('rembg:isnet-general-use');
      expect(calls).toHaveLength(1);
      expect(calls[0].method).toBe('POST');
      expect(calls[0].url).toBe('https://matting.example.com/matte');
      expect(calls[0].headers.Authorization).toBe('Bearer test-token');

      const body = JSON.parse(calls[0].body ?? '{}');
      expect(body.source_url).toBe('https://storage.googleapis.com/test/char.mp4');
      expect(body.output_gcs_uri).toBe(okResponse().output_gcs_uri);
      expect(body.source_event_id).toBe('evt-planner-001');
    });

    it('normalizes trailing slash on service URL', async () => {
      const { fetch: fm, calls } = makeFetchMock(
        () => new Response(JSON.stringify(okResponse()), { status: 200 })
      );
      await matteCharacterVideo(
        fixtureReq(),
        { ...CFG, serviceUrl: 'https://matting.example.com///' },
        fm
      );
      expect(calls[0].url).toBe('https://matting.example.com/matte');
    });

    it('forwards emptyMatteThreshold when set', async () => {
      const { fetch: fm, calls } = makeFetchMock(
        () => new Response(JSON.stringify(okResponse()), { status: 200 })
      );
      await matteCharacterVideo(
        fixtureReq({ emptyMatteThreshold: 0.05 }),
        CFG,
        fm
      );
      const body = JSON.parse(calls[0].body ?? '{}');
      expect(body.empty_matte_threshold).toBe(0.05);
    });

    it('throws MattingClientError with kind=auth on 401', async () => {
      const fm = makeFetchMock(
        () => new Response('bad bearer token', { status: 401 })
      ).fetch;
      await expect(matteCharacterVideo(fixtureReq(), CFG, fm)).rejects.toMatchObject(
        { name: 'MattingClientError', kind: 'auth', status: 401 }
      );
    });

    it('throws MattingClientError with kind=source_too_big on 413', async () => {
      const fm = makeFetchMock(
        () => new Response('source exceeds 200MB', { status: 413 })
      ).fetch;
      await expect(matteCharacterVideo(fixtureReq(), CFG, fm)).rejects.toMatchObject(
        { kind: 'source_too_big', status: 413 }
      );
    });

    it('throws MattingClientError with kind=empty_matte on 422', async () => {
      const fm = makeFetchMock(
        () =>
          new Response('avg_foreground_ratio 0.0001 below threshold', {
            status: 422,
          })
      ).fetch;
      await expect(matteCharacterVideo(fixtureReq(), CFG, fm)).rejects.toMatchObject(
        { kind: 'empty_matte', status: 422 }
      );
    });

    it('throws MattingClientError with kind=source_fetch_failed on 502', async () => {
      const fm = makeFetchMock(
        () => new Response('source fetch HTTP 404', { status: 502 })
      ).fetch;
      await expect(matteCharacterVideo(fixtureReq(), CFG, fm)).rejects.toMatchObject(
        { kind: 'source_fetch_failed', status: 502 }
      );
    });

    it('throws MattingClientError with kind=malformed when 200 but missing uri', async () => {
      const fm = makeFetchMock(
        () =>
          new Response(
            JSON.stringify({ backend: 'rembg:isnet-general-use' }),
            { status: 200 }
          )
      ).fetch;
      await expect(matteCharacterVideo(fixtureReq(), CFG, fm)).rejects.toMatchObject(
        { kind: 'malformed' }
      );
    });

    it('rejects when service URL is missing', async () => {
      const prev = process.env.OPERATIONS_FLOOR_MATTING_URL;
      delete process.env.OPERATIONS_FLOOR_MATTING_URL;
      try {
        await expect(
          matteCharacterVideo(fixtureReq(), { bearerToken: 't' })
        ).rejects.toThrow(/service URL missing/);
      } finally {
        if (prev !== undefined) process.env.OPERATIONS_FLOOR_MATTING_URL = prev;
      }
    });

    it('rejects when bearer token is missing', async () => {
      const prev = process.env.OPERATIONS_FLOOR_MATTING_TOKEN;
      delete process.env.OPERATIONS_FLOOR_MATTING_TOKEN;
      try {
        await expect(
          matteCharacterVideo(fixtureReq(), {
            serviceUrl: 'https://matting.example.com',
          })
        ).rejects.toThrow(/bearer token missing/);
      } finally {
        if (prev !== undefined) process.env.OPERATIONS_FLOOR_MATTING_TOKEN = prev;
      }
    });

    it('surfaces AbortError as kind=network', async () => {
      const fm = (async () => {
        const err = new Error('aborted');
        (err as { name: string }).name = 'AbortError';
        throw err;
      }) as typeof fetch;
      await expect(
        matteCharacterVideo(fixtureReq(), { ...CFG, timeoutMs: 1 }, fm)
      ).rejects.toMatchObject({ kind: 'network' });
    });

    it('echoes source_event_id from the server', async () => {
      const fm = makeFetchMock(
        () =>
          new Response(
            JSON.stringify({ ...okResponse(), source_event_id: 'evt-trace-42' }),
            { status: 200 }
          )
      ).fetch;
      const out = await matteCharacterVideo(
        fixtureReq({ sourceEventId: 'evt-trace-42' }),
        CFG,
        fm
      );
      expect(out.source_event_id).toBe('evt-trace-42');
    });
  });

  describe('mattingHealth', () => {
    it('returns ok with backend name on 200', async () => {
      const fm = makeFetchMock(
        () =>
          new Response(
            JSON.stringify({
              status: 'ok',
              backend: 'rembg:isnet-general-use',
              ready: true,
            }),
            { status: 200 }
          )
      ).fetch;
      const h = await mattingHealth(CFG, fm);
      expect(h.status).toBe('ok');
      expect(h.backend).toBe('rembg:isnet-general-use');
      expect(h.ready).toBe(true);
    });

    it('does NOT send Authorization on /health (public readiness probe)', async () => {
      const { fetch: fm, calls } = makeFetchMock(
        () =>
          new Response(
            JSON.stringify({ status: 'warming', backend: 'unknown', ready: false }),
            { status: 200 }
          )
      );
      await mattingHealth(CFG, fm);
      expect(calls[0].headers.Authorization).toBeUndefined();
    });

    it('throws MattingClientError on non-2xx health', async () => {
      const fm = makeFetchMock(() => new Response('', { status: 503 })).fetch;
      await expect(mattingHealth(CFG, fm)).rejects.toBeInstanceOf(MattingClientError);
    });
  });
});
