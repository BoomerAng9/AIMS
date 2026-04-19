import {
  cosmosPredict,
  cosmosHealth,
  buildPredictUrl,
  buildHealthUrl,
  normalizeEndpoint,
  type CosmosClientConfig,
  type CosmosPredictInstance,
  type CosmosPredictResponse,
} from '../operations-floor/cosmos-client';

function fixtureInstance(
  overrides: Partial<CosmosPredictInstance> = {}
): CosmosPredictInstance {
  return {
    video_gcs_uri: 'gs://cosmos-artifacts/inputs/proxy-video.mp4',
    prompt: 'Cinematic wide shot of a futuristic night port',
    negative_prompt: 'humans, text, logos',
    multicontrol_spec: {
      depth: {
        enabled: true,
        strength: 0.85,
        source_gcs_uri: 'gs://cosmos-artifacts/inputs/depth.exr',
      },
      edge: {
        enabled: true,
        strength: 0.7,
        source_gcs_uri: 'gs://cosmos-artifacts/inputs/canny/',
      },
    },
    inference: { guidance: 3.0, steps: 30, seed: 2604180001 },
    output_gcs_prefix: 'gs://cosmos-artifacts/outputs/night-port-v1/',
    ...overrides,
  };
}

function baseConfig(
  overrides: Partial<CosmosClientConfig> = {}
): CosmosClientConfig {
  return {
    endpointId: '123456789',
    projectId: 'ai-managed-services',
    region: 'us-central1',
    accessToken: 'test-token',
    ...overrides,
  };
}

function successResponse(): CosmosPredictResponse {
  return {
    predictions: [
      {
        output_video_gcs_uri:
          'gs://cosmos-artifacts/outputs/night-port-v1/render.mp4',
        frame_count: 144,
        duration_s: 6.0,
        inference_latency_s: 42.7,
        gpu_seconds_used: 42.7,
        seed: 2604180001,
        model: 'transfer2.5',
      },
    ],
    deployedModelId: 'deployed-123',
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

describe('Operations Floor — Cosmos-Transfer2.5 Vertex AI client', () => {
  describe('normalizeEndpoint', () => {
    it('passes a fully-qualified resource name through unchanged', () => {
      const full =
        'projects/ai-managed-services/locations/us-central1/endpoints/987';
      expect(
        normalizeEndpoint({
          endpointId: full,
          projectId: 'ai-managed-services',
          region: 'us-central1',
          accessToken: 'x',
          timeoutMs: 1000,
        })
      ).toBe(full);
    });

    it('expands a bare endpoint id to a resource name', () => {
      expect(
        normalizeEndpoint({
          endpointId: '123',
          projectId: 'p',
          region: 'us-central1',
          accessToken: 'x',
          timeoutMs: 1000,
        })
      ).toBe('projects/p/locations/us-central1/endpoints/123');
    });
  });

  describe('URL builders', () => {
    it('buildPredictUrl targets the regional aiplatform:predict path', () => {
      const url = buildPredictUrl({
        endpointId: '123',
        projectId: 'p',
        region: 'us-central1',
        accessToken: 'x',
        timeoutMs: 1000,
      });
      expect(url).toBe(
        'https://us-central1-aiplatform.googleapis.com/v1/projects/p/locations/us-central1/endpoints/123:predict'
      );
    });

    it('buildHealthUrl targets :rawPredict on the same endpoint', () => {
      const url = buildHealthUrl({
        endpointId: '123',
        projectId: 'p',
        region: 'us-central1',
        accessToken: 'x',
        timeoutMs: 1000,
      });
      expect(url).toContain(':rawPredict');
    });
  });

  describe('cosmosPredict', () => {
    it('sends instances to the correct Vertex URL with bearer auth', async () => {
      let capturedUrl = '';
      let capturedInit: RequestInit = {};
      const fetchMock = makeFetchMock((url, init) => {
        capturedUrl = url;
        capturedInit = init;
        return new Response(JSON.stringify(successResponse()), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      });

      const result = await cosmosPredict(
        [fixtureInstance()],
        baseConfig(),
        fetchMock
      );

      expect(result.predictions).toHaveLength(1);
      expect(capturedUrl).toContain(
        'us-central1-aiplatform.googleapis.com'
      );
      expect(capturedUrl).toContain(':predict');

      const authHeader =
        (capturedInit.headers as Record<string, string>)['Authorization'] ??
        (capturedInit.headers as Record<string, string>)['authorization'];
      expect(authHeader).toBe('Bearer test-token');
    });

    it('wraps instances in the Vertex {"instances": [...]} envelope', async () => {
      let bodySent = '';
      const fetchMock = makeFetchMock((_url, init) => {
        bodySent = init.body as string;
        return new Response(JSON.stringify(successResponse()), {
          status: 200,
        });
      });

      await cosmosPredict(
        [fixtureInstance(), fixtureInstance({ prompt: 'second' })],
        baseConfig(),
        fetchMock
      );

      const parsed = JSON.parse(bodySent);
      expect(parsed).toHaveProperty('instances');
      expect(parsed.instances).toHaveLength(2);
      expect(parsed.instances[1].prompt).toBe('second');
    });

    it('returns the parsed prediction payload on 200', async () => {
      const fetchMock = makeFetchMock(
        () =>
          new Response(JSON.stringify(successResponse()), { status: 200 })
      );

      const result = await cosmosPredict(
        [fixtureInstance()],
        baseConfig(),
        fetchMock
      );

      expect(result.predictions[0].output_video_gcs_uri).toBe(
        'gs://cosmos-artifacts/outputs/night-port-v1/render.mp4'
      );
      expect(result.predictions[0].seed).toBe(2604180001);
    });

    it('throws a descriptive error on non-2xx response', async () => {
      const fetchMock = makeFetchMock(
        () =>
          new Response('endpoint not ready', {
            status: 503,
            statusText: 'Service Unavailable',
          })
      );

      await expect(
        cosmosPredict([fixtureInstance()], baseConfig(), fetchMock)
      ).rejects.toThrow(/503/);
    });

    it('rejects when instances is empty', async () => {
      const fetchMock = makeFetchMock(() => new Response('x', { status: 200 }));
      await expect(
        cosmosPredict([], baseConfig(), fetchMock)
      ).rejects.toThrow(/must not be empty/);
    });

    it('rejects when access token is missing', async () => {
      const fetchMock = makeFetchMock(() => new Response('x', { status: 200 }));
      await expect(
        cosmosPredict(
          [fixtureInstance()],
          baseConfig({ accessToken: '' }),
          fetchMock
        )
      ).rejects.toThrow(/access token missing/);
    });

    it('rejects malformed response that lacks predictions[]', async () => {
      const fetchMock = makeFetchMock(
        () =>
          new Response(JSON.stringify({ hello: 'world' }), { status: 200 })
      );
      await expect(
        cosmosPredict([fixtureInstance()], baseConfig(), fetchMock)
      ).rejects.toThrow(/malformed response/);
    });
  });

  describe('cosmosHealth', () => {
    it('GETs the rawPredict URL with bearer auth and parses JSON', async () => {
      let methodSeen = '';
      const fetchMock = makeFetchMock((_url, init) => {
        methodSeen = init.method ?? 'GET';
        return new Response(
          JSON.stringify({
            status: 'ok',
            gpu_available: true,
            cuda_version: '12.1',
            cosmos_version: 'transfer2.5',
            model_loaded: true,
          }),
          { status: 200 }
        );
      });

      const h = await cosmosHealth(baseConfig(), fetchMock);
      expect(methodSeen).toBe('GET');
      expect(h.gpu_available).toBe(true);
      expect(h.cosmos_version).toBe('transfer2.5');
    });
  });
});
