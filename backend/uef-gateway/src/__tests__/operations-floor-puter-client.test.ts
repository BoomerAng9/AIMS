import {
  uploadComposedClip,
  puterHealth,
  type UploadComposedClipRequest,
} from '../operations-floor/puter-client';

function fixtureReq(
  overrides: Partial<UploadComposedClipRequest> = {}
): UploadComposedClipRequest {
  return {
    sourceUrl: 'https://storage.googleapis.com/bucket/composed.mp4',
    puterPath: '/operations-floor/night-port-v1.mp4',
    sourceEventId: 'evt-planner-001',
    makePublic: true,
    ...overrides,
  };
}

interface MockCall {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
}

function makeFetchMock(
  steps: Array<(url: string, init: RequestInit) => Response>
): { fetch: typeof fetch; calls: MockCall[] } {
  const calls: MockCall[] = [];
  let i = 0;
  const mock = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    const headers = (init?.headers ?? {}) as Record<string, string>;
    calls.push({
      url,
      method: (init?.method ?? 'GET') as string,
      headers,
      body: init?.body ? String(init.body) : undefined,
    });
    const step = steps[i++] ?? steps[steps.length - 1];
    return step(url, init ?? {});
  }) as typeof fetch;
  return { fetch: mock, calls };
}

const CFG = { apiToken: 'test-token', apiBase: 'https://api.puter.com' };

describe('Operations Floor -- Puter.fs client', () => {
  describe('uploadComposedClip', () => {
    it('pulls source MP4, writes to Puter.fs, returns a public link', async () => {
      const body = new TextEncoder().encode('mp4-bytes').buffer;
      const { fetch: fm, calls } = makeFetchMock([
        // Step 1: source download
        () => new Response(body, { status: 200 }),
        // Step 2: puter-fs write
        () =>
          new Response(
            JSON.stringify({
              result: { puter_url: 'puter:///operations-floor/night-port-v1.mp4' },
            }),
            { status: 200 }
          ),
        // Step 3: puter-fs link (public)
        () =>
          new Response(
            JSON.stringify({
              result: { url: 'https://puter.com/public/abc123.mp4' },
            }),
            { status: 200 }
          ),
      ]);

      const out = await uploadComposedClip(fixtureReq(), CFG, fm);

      expect(out.puterPath).toBe('/operations-floor/night-port-v1.mp4');
      expect(out.puterUrl).toBe(
        'puter:///operations-floor/night-port-v1.mp4'
      );
      expect(out.publicPlaybackUrl).toBe(
        'https://puter.com/public/abc123.mp4'
      );
      expect(out.sizeBytes).toBe(body.byteLength);

      // Order matters: GET source, POST write, POST link
      expect(calls[0].method).toBe('GET');
      expect(calls[0].url).toBe(
        'https://storage.googleapis.com/bucket/composed.mp4'
      );
      expect(calls[1].method).toBe('POST');
      expect(calls[1].url).toBe('https://api.puter.com/drivers/call');
      expect(calls[2].method).toBe('POST');
      expect(calls[2].url).toBe('https://api.puter.com/drivers/call');
    });

    it('attaches bearer token on Puter calls', async () => {
      const { fetch: fm, calls } = makeFetchMock([
        () =>
          new Response(new TextEncoder().encode('x').buffer, { status: 200 }),
        () =>
          new Response(JSON.stringify({ result: { puter_url: 'puter:///x' } }), {
            status: 200,
          }),
        () =>
          new Response(
            JSON.stringify({ result: { url: 'https://p.com/1.mp4' } }),
            { status: 200 }
          ),
      ]);

      await uploadComposedClip(fixtureReq(), CFG, fm);

      // Puter calls (indices 1 and 2) carry the bearer; source GET
      // (index 0) does NOT -- that URL is often signed independently.
      const puterCallAuth = calls[1].headers['Authorization'] ??
        calls[1].headers['authorization'];
      expect(puterCallAuth).toBe('Bearer test-token');
    });

    it('sends write payload as base64 + content_type=video/mp4', async () => {
      const body = new TextEncoder().encode('some-bytes').buffer;
      const { fetch: fm, calls } = makeFetchMock([
        () => new Response(body, { status: 200 }),
        () =>
          new Response(JSON.stringify({ result: { puter_url: 'puter:///x' } }), {
            status: 200,
          }),
        () =>
          new Response(
            JSON.stringify({ result: { url: 'https://p.com/1.mp4' } }),
            { status: 200 }
          ),
      ]);

      await uploadComposedClip(fixtureReq(), CFG, fm);

      const writeBody = JSON.parse(calls[1].body ?? '{}');
      expect(writeBody.interface).toBe('puter-fs');
      expect(writeBody.method).toBe('write');
      expect(writeBody.args.path).toBe('/operations-floor/night-port-v1.mp4');
      expect(writeBody.args.content_type).toBe('video/mp4');
      expect(writeBody.args.data_base64).toBe(
        Buffer.from(body).toString('base64')
      );
      expect(writeBody.args.overwrite).toBe(true);
    });

    it('skips the link call when makePublic=false', async () => {
      const { fetch: fm, calls } = makeFetchMock([
        () =>
          new Response(new TextEncoder().encode('x').buffer, { status: 200 }),
        () =>
          new Response(
            JSON.stringify({ result: { puter_url: 'puter:///y' } }),
            { status: 200 }
          ),
      ]);

      const out = await uploadComposedClip(
        fixtureReq({ makePublic: false }),
        CFG,
        fm
      );

      expect(calls).toHaveLength(2); // only source + write, NO link
      expect(out.publicPlaybackUrl).toBe(out.puterUrl);
    });

    it('rejects when puterPath does not start with /', async () => {
      const { fetch: fm } = makeFetchMock([
        () => new Response('', { status: 200 }),
      ]);
      await expect(
        uploadComposedClip(
          fixtureReq({ puterPath: 'no-leading-slash.mp4' }),
          CFG,
          fm
        )
      ).rejects.toThrow(/must start with/);
    });

    it('rejects when sourceUrl is empty', async () => {
      const { fetch: fm } = makeFetchMock([
        () => new Response('', { status: 200 }),
      ]);
      await expect(
        uploadComposedClip(fixtureReq({ sourceUrl: '' }), CFG, fm)
      ).rejects.toThrow(/sourceUrl is required/);
    });

    it('rejects when apiToken is missing', async () => {
      const { fetch: fm } = makeFetchMock([
        () => new Response('', { status: 200 }),
      ]);
      const prev = process.env.PUTER_API_TOKEN;
      delete process.env.PUTER_API_TOKEN;
      try {
        await expect(
          uploadComposedClip(fixtureReq(), { apiBase: 'https://x' }, fm)
        ).rejects.toThrow(/PUTER_API_TOKEN missing/);
      } finally {
        if (prev !== undefined) process.env.PUTER_API_TOKEN = prev;
      }
    });

    it('surfaces source fetch errors distinctly', async () => {
      const { fetch: fm } = makeFetchMock([
        () => new Response('gone', { status: 404 }),
      ]);
      await expect(
        uploadComposedClip(fixtureReq(), CFG, fm)
      ).rejects.toThrow(/source fetch HTTP 404/);
    });

    it('surfaces Puter write errors distinctly', async () => {
      const { fetch: fm } = makeFetchMock([
        () =>
          new Response(new TextEncoder().encode('x').buffer, { status: 200 }),
        () => new Response('quota exceeded', { status: 402 }),
      ]);
      await expect(
        uploadComposedClip(fixtureReq(), CFG, fm)
      ).rejects.toThrow(/write HTTP 402/);
    });

    it('echoes sourceEventId', async () => {
      const { fetch: fm } = makeFetchMock([
        () =>
          new Response(new TextEncoder().encode('x').buffer, { status: 200 }),
        () =>
          new Response(
            JSON.stringify({ result: { puter_url: 'puter:///y' } }),
            { status: 200 }
          ),
        () =>
          new Response(JSON.stringify({ result: { url: 'https://p/1' } }), {
            status: 200,
          }),
      ]);
      const out = await uploadComposedClip(
        fixtureReq({ sourceEventId: 'evt-trace-42' }),
        CFG,
        fm
      );
      expect(out.sourceEventId).toBe('evt-trace-42');
    });
  });

  describe('puterHealth', () => {
    it('returns ok with whoami on 200', async () => {
      const { fetch: fm } = makeFetchMock([
        () =>
          new Response(JSON.stringify({ username: 'acheevy' }), { status: 200 }),
      ]);
      const h = await puterHealth(CFG, fm);
      expect(h.status).toBe('ok');
      expect(h.reachable).toBe(true);
      expect(h.whoami).toBe('acheevy');
    });

    it('returns degraded on non-2xx', async () => {
      const { fetch: fm } = makeFetchMock([
        () => new Response('', { status: 401 }),
      ]);
      const h = await puterHealth(CFG, fm);
      expect(h.status).toBe('degraded');
    });

    it('returns error on thrown fetch', async () => {
      const fm = (async () => {
        throw new Error('network kaput');
      }) as typeof fetch;
      const h = await puterHealth(CFG, fm);
      expect(h.status).toBe('error');
      expect(h.reachable).toBe(false);
    });
  });
});
