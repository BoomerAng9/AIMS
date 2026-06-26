import {
  generateCharacterClip,
  pollCharacterClip,
  awaitCharacterClip,
  buildPrompt,
  VERB_PROMPTS,
  type CharacterClipRequest,
} from '../operations-floor/seedance-client';

function fixtureReq(
  overrides: Partial<CharacterClipRequest> = {}
): CharacterClipRequest {
  return {
    characterRefUrl:
      'https://cti.foai.cloud/agents/port-ang.png',
    verb: 'dispatching',
    cameraIntent: {
      orbit: false,
      dolly_in: true,
      follow: false,
      over_shoulder: false,
      close_up: false,
    },
    durationS: 6,
    aspectRatio: '9:16',
    sourceEventId: 'evt-test-001',
    quality: 'standard',
    ...overrides,
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

describe('Operations Floor — Seedance 2.0 i2v character motion client', () => {
  describe('verb prompt library', () => {
    it('defines exactly the five canonical verbs', () => {
      expect(Object.keys(VERB_PROMPTS).sort()).toEqual([
        'consulting',
        'dispatching',
        'typing',
        'verdict',
        'walking',
      ]);
    });

    it('every verb prompt mentions "the subject"', () => {
      for (const [verb, prompt] of Object.entries(VERB_PROMPTS)) {
        expect(prompt).toMatch(/the subject/i);
      }
    });
  });

  describe('buildPrompt', () => {
    it('includes the verb-specific motion for dispatching', () => {
      const p = buildPrompt('dispatching');
      expect(p).toContain('mission brief');
      expect(p).toContain('Cinematic night port');
    });

    it('appends dolly-in camera language when requested', () => {
      const p = buildPrompt('walking', {
        orbit: false,
        dolly_in: true,
        follow: false,
        over_shoulder: false,
        close_up: false,
      });
      expect(p.toLowerCase()).toContain('dolly-in');
    });

    it('appends close-up language when requested', () => {
      const p = buildPrompt('verdict', {
        orbit: false,
        dolly_in: false,
        follow: false,
        over_shoulder: false,
        close_up: true,
      });
      expect(p.toLowerCase()).toContain('close-up');
    });

    it('always instructs identity preservation of the reference subject', () => {
      const p = buildPrompt('typing');
      expect(p).toContain('preserve the reference');
      expect(p).toContain('do not alter features');
    });
  });

  describe('generateCharacterClip', () => {
    it('POSTs to the OpenRouter videos endpoint with bearer auth', async () => {
      let seenUrl = '';
      let seenInit: RequestInit = {};
      const fetchMock = makeFetchMock((url, init) => {
        seenUrl = url;
        seenInit = init;
        return new Response(
          JSON.stringify({ id: 'task-abc', status: 'pending' }),
          { status: 200 }
        );
      });

      const out = await generateCharacterClip(
        fixtureReq(),
        { apiKey: 'test-key' },
        fetchMock
      );

      expect(out.taskId).toBe('task-abc');
      expect(out.status).toBe('pending');
      expect(seenUrl).toBe('https://openrouter.ai/api/v1/videos');
      const auth =
        (seenInit.headers as Record<string, string>)['Authorization'] ??
        (seenInit.headers as Record<string, string>)['authorization'];
      expect(auth).toBe('Bearer test-key');
    });

    it('selects standard Seedance by default', async () => {
      let sentBody = '';
      const fetchMock = makeFetchMock((_url, init) => {
        sentBody = init.body as string;
        return new Response(JSON.stringify({ id: 't1' }), { status: 200 });
      });

      await generateCharacterClip(
        fixtureReq({ quality: 'standard' }),
        { apiKey: 'k' },
        fetchMock
      );
      expect(JSON.parse(sentBody).model).toBe('bytedance/seedance-2.0');
    });

    it('selects fast Seedance variant when quality=fast', async () => {
      let sentBody = '';
      const fetchMock = makeFetchMock((_url, init) => {
        sentBody = init.body as string;
        return new Response(JSON.stringify({ id: 't1' }), { status: 200 });
      });

      await generateCharacterClip(
        fixtureReq({ quality: 'fast' }),
        { apiKey: 'k' },
        fetchMock
      );
      expect(JSON.parse(sentBody).model).toBe('bytedance/seedance-2.0-fast');
    });

    it('passes the character ref URL as reference_image_urls', async () => {
      let sentBody = '';
      const fetchMock = makeFetchMock((_url, init) => {
        sentBody = init.body as string;
        return new Response(JSON.stringify({ id: 't1' }), { status: 200 });
      });

      await generateCharacterClip(
        fixtureReq({ characterRefUrl: 'https://x.com/luc.png' }),
        { apiKey: 'k' },
        fetchMock
      );
      const body = JSON.parse(sentBody);
      expect(body.reference_image_urls).toEqual(['https://x.com/luc.png']);
    });

    it('defaults duration to 6s and aspect to 9:16', async () => {
      let sentBody = '';
      const fetchMock = makeFetchMock((_url, init) => {
        sentBody = init.body as string;
        return new Response(JSON.stringify({ id: 't1' }), { status: 200 });
      });

      await generateCharacterClip(
        { ...fixtureReq(), durationS: undefined, aspectRatio: undefined },
        { apiKey: 'k' },
        fetchMock
      );
      const body = JSON.parse(sentBody);
      expect(body.duration).toBe(6);
      expect(body.aspect_ratio).toBe('9:16');
    });

    it('suppresses audio (generate_audio=false)', async () => {
      let sentBody = '';
      const fetchMock = makeFetchMock((_url, init) => {
        sentBody = init.body as string;
        return new Response(JSON.stringify({ id: 't1' }), { status: 200 });
      });

      await generateCharacterClip(fixtureReq(), { apiKey: 'k' }, fetchMock);
      expect(JSON.parse(sentBody).generate_audio).toBe(false);
    });

    it('propagates sourceEventId into the task handle', async () => {
      const fetchMock = makeFetchMock(() =>
        new Response(JSON.stringify({ id: 't1' }), { status: 200 })
      );
      const out = await generateCharacterClip(
        fixtureReq({ sourceEventId: 'evt-xyz' }),
        { apiKey: 'k' },
        fetchMock
      );
      expect(out.sourceEventId).toBe('evt-xyz');
    });

    it('returns an error task handle on non-2xx', async () => {
      const fetchMock = makeFetchMock(
        () =>
          new Response(
            JSON.stringify({ error: { message: 'rate limited' } }),
            { status: 429 }
          )
      );
      const out = await generateCharacterClip(
        fixtureReq(),
        { apiKey: 'k' },
        fetchMock
      );
      expect(out.taskId).toBe('');
      expect(out.status).toBe('error');
      expect(out.error).toContain('rate limited');
    });

    it('throws when apiKey is missing', async () => {
      const fetchMock = makeFetchMock(() => new Response('x', { status: 200 }));
      // No apiKey and no env -> throws
      const prev = process.env.OPENROUTER_API_KEY;
      delete process.env.OPENROUTER_API_KEY;
      try {
        await expect(
          generateCharacterClip(fixtureReq(), {}, fetchMock)
        ).rejects.toThrow(/OPENROUTER_API_KEY missing/);
      } finally {
        if (prev !== undefined) process.env.OPENROUTER_API_KEY = prev;
      }
    });
  });

  describe('pollCharacterClip', () => {
    it('normalizes completed → completed and surfaces the videoUrl', async () => {
      const fetchMock = makeFetchMock(
        () =>
          new Response(
            JSON.stringify({
              status: 'completed',
              unsigned_urls: ['https://cdn.openrouter/x.mp4'],
            }),
            { status: 200 }
          )
      );
      const s = await pollCharacterClip(
        'task-done',
        { apiKey: 'k' },
        fetchMock
      );
      expect(s.status).toBe('completed');
      expect(s.videoUrl).toBe('https://cdn.openrouter/x.mp4');
    });

    it('normalizes pending → processing', async () => {
      const fetchMock = makeFetchMock(
        () =>
          new Response(
            JSON.stringify({ status: 'pending', progress: 0.3 }),
            { status: 200 }
          )
      );
      const s = await pollCharacterClip(
        'task-pending',
        { apiKey: 'k' },
        fetchMock
      );
      expect(s.status).toBe('processing');
      expect(s.progress).toBe(0.3);
    });

    it('normalizes failed → failed', async () => {
      const fetchMock = makeFetchMock(
        () =>
          new Response(JSON.stringify({ status: 'failed' }), { status: 200 })
      );
      const s = await pollCharacterClip(
        'task-bad',
        { apiKey: 'k' },
        fetchMock
      );
      expect(s.status).toBe('failed');
    });
  });

  describe('awaitCharacterClip', () => {
    it('resolves on first completed poll', async () => {
      const fetchMock = makeFetchMock(
        () =>
          new Response(
            JSON.stringify({
              status: 'completed',
              unsigned_urls: ['https://cdn.openrouter/y.mp4'],
            }),
            { status: 200 }
          )
      );
      const s = await awaitCharacterClip(
        'done-fast',
        { apiKey: 'k', intervalMs: 10, maxWaitMs: 1_000 },
        fetchMock
      );
      expect(s.status).toBe('completed');
    });

    it('throws on failed status', async () => {
      const fetchMock = makeFetchMock(
        () =>
          new Response(
            JSON.stringify({ status: 'failed', error: 'upstream crash' }),
            { status: 200 }
          )
      );
      await expect(
        awaitCharacterClip(
          'bad',
          { apiKey: 'k', intervalMs: 10, maxWaitMs: 1_000 },
          fetchMock
        )
      ).rejects.toThrow(/failed/);
    });
  });
});
