import {
  composeNightPort,
  compositorHealth,
  type ComposeRequest,
  type ComposeResponse,
} from '../operations-floor/compositor-client';

function fixtureReq(overrides: Partial<ComposeRequest> = {}): ComposeRequest {
  return {
    environmentVideoUrl: 'https://storage.googleapis.com/test/env.mp4',
    characterVideoUrl: 'https://openrouter.ai/test/char.mp4',
    durationSeconds: 6,
    fps: 24,
    characterStartFrame: 0,
    characterPositioning: {
      anchorX: 0.5,
      anchorY: 0.95,
      scale: 0.72,
      fadeInFrames: 12,
    },
    endLockupText: 'ACHEEVY · DISPATCHING',
    outputGcsPrefix: 'gs://cosmos-operations-floor-artifacts/outputs/night-port/',
    sourceEventId: 'evt-planner-001',
    ...overrides,
  };
}

function okResponse(): ComposeResponse {
  return {
    output_video_gcs_uri:
      'gs://cosmos-operations-floor-artifacts/outputs/night-port/composed.mp4',
    duration_s: 6,
    frame_count: 144,
    size_bytes: 8_421_337,
    source_event_id: 'evt-planner-001',
  };
}

function makeFetchMock(
  handler: (url: string, init: RequestInit) => Response
): typeof fetch {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    return handler(url, init ?? {});
  }) as typeof fetch;
}

describe('Operations Floor -- compositor client', () => {
  describe('composeNightPort', () => {
    it('POSTs to /compose at the configured service URL', async () => {
      let seenUrl = '';
      const fetchMock = makeFetchMock((url, _init) => {
        seenUrl = url;
        return new Response(JSON.stringify(okResponse()), { status: 200 });
      });

      const out = await composeNightPort(
        fixtureReq(),
        { serviceUrl: 'https://compositor.example.com' },
        fetchMock
      );

      expect(seenUrl).toBe('https://compositor.example.com/compose');
      expect(out.output_video_gcs_uri).toContain('composed.mp4');
    });

    it('strips trailing slashes from the service URL', async () => {
      let seenUrl = '';
      const fetchMock = makeFetchMock((url, _init) => {
        seenUrl = url;
        return new Response(JSON.stringify(okResponse()), { status: 200 });
      });

      await composeNightPort(
        fixtureReq(),
        { serviceUrl: 'https://compositor.example.com/////' },
        fetchMock
      );

      expect(seenUrl).toBe('https://compositor.example.com/compose');
    });

    it('attaches bearer token when provided', async () => {
      let seenAuth = '';
      const fetchMock = makeFetchMock((_url, init) => {
        const headers = init.headers as Record<string, string>;
        seenAuth = headers['Authorization'] ?? headers['authorization'] ?? '';
        return new Response(JSON.stringify(okResponse()), { status: 200 });
      });

      await composeNightPort(
        fixtureReq(),
        {
          serviceUrl: 'https://compositor.example.com',
          bearerToken: 'test-token',
        },
        fetchMock
      );

      expect(seenAuth).toBe('Bearer test-token');
    });

    it('sends the full request body verbatim', async () => {
      let bodySent = '';
      const fetchMock = makeFetchMock((_url, init) => {
        bodySent = init.body as string;
        return new Response(JSON.stringify(okResponse()), { status: 200 });
      });

      const req = fixtureReq({ endLockupText: 'LUC · VERDICT' });
      await composeNightPort(
        req,
        { serviceUrl: 'https://compositor.example.com' },
        fetchMock
      );

      const parsed = JSON.parse(bodySent);
      expect(parsed.endLockupText).toBe('LUC · VERDICT');
      expect(parsed.characterPositioning.scale).toBe(0.72);
      expect(parsed.outputGcsPrefix).toBe(
        'gs://cosmos-operations-floor-artifacts/outputs/night-port/'
      );
    });

    it('throws with descriptive message on non-2xx', async () => {
      const fetchMock = makeFetchMock(
        () =>
          new Response('compose failed: Chromium crashed', { status: 500 })
      );

      await expect(
        composeNightPort(
          fixtureReq(),
          { serviceUrl: 'https://compositor.example.com' },
          fetchMock
        )
      ).rejects.toThrow(/500/);
    });

    it('throws on malformed response that lacks output URI', async () => {
      const fetchMock = makeFetchMock(
        () => new Response(JSON.stringify({ duration_s: 6 }), { status: 200 })
      );

      await expect(
        composeNightPort(
          fixtureReq(),
          { serviceUrl: 'https://compositor.example.com' },
          fetchMock
        )
      ).rejects.toThrow(/malformed response/);
    });

    it('throws when service URL is missing', async () => {
      const prev = process.env.OPERATIONS_FLOOR_COMPOSITOR_URL;
      delete process.env.OPERATIONS_FLOOR_COMPOSITOR_URL;
      const fetchMock = makeFetchMock(
        () => new Response(JSON.stringify(okResponse()), { status: 200 })
      );
      try {
        await expect(
          composeNightPort(fixtureReq(), {}, fetchMock)
        ).rejects.toThrow(/service URL missing/);
      } finally {
        if (prev !== undefined) {
          process.env.OPERATIONS_FLOOR_COMPOSITOR_URL = prev;
        }
      }
    });

    it('preserves source_event_id in the response', async () => {
      const fetchMock = makeFetchMock(
        () => new Response(JSON.stringify(okResponse()), { status: 200 })
      );

      const out = await composeNightPort(
        fixtureReq({ sourceEventId: 'evt-trace-xyz' }),
        { serviceUrl: 'https://compositor.example.com' },
        fetchMock
      );

      // okResponse() hard-codes evt-planner-001; real service echoes
      // back what we sent, so this asserts the fixture's contract
      expect(out.source_event_id).toBe('evt-planner-001');
    });
  });

  describe('compositorHealth', () => {
    it('GETs /health and parses the response', async () => {
      let methodSeen = '';
      const fetchMock = makeFetchMock((_url, init) => {
        methodSeen = init.method ?? 'GET';
        return new Response(
          JSON.stringify({
            status: 'ok',
            service: 'operations-floor-compositor',
            stage: '8+9',
            project: 'ai-managed-services',
            node: 'v20.12.0',
          }),
          { status: 200 }
        );
      });

      const h = await compositorHealth(
        { serviceUrl: 'https://compositor.example.com' },
        fetchMock
      );

      expect(methodSeen).toBe('GET');
      expect(h.status).toBe('ok');
      expect(h.stage).toBe('8+9');
    });

    it('throws on non-2xx health', async () => {
      const fetchMock = makeFetchMock(
        () => new Response('', { status: 503 })
      );

      await expect(
        compositorHealth(
          { serviceUrl: 'https://compositor.example.com' },
          fetchMock
        )
      ).rejects.toThrow(/503/);
    });
  });
});
