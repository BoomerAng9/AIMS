/**
 * Smoke Tests — Pillar 8
 *
 * Validates the application starts, core routes respond, and
 * essential subsystems are functional. These are the "does it
 * even work?" tests that catch catastrophic failures.
 *
 * Smoke tests run FAST (no external deps) and should always pass
 * before any deployment.
 */

import app from '../index';
import http from 'http';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let server: http.Server;
const TEST_PORT = 0; // OS-assigned port

function getPort(): number {
  const addr = server.address();
  if (addr && typeof addr === 'object') return addr.port;
  throw new Error('Server not started');
}

async function request(
  path: string,
  options: { method?: string; body?: object; headers?: Record<string, string> } = {},
): Promise<{ status: number; body: unknown }> {
  const port = getPort();
  const method = options.method || 'GET';

  return new Promise((resolve, reject) => {
    const reqBody = options.body ? JSON.stringify(options.body) : undefined;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };
    if (reqBody) headers['Content-Length'] = Buffer.byteLength(reqBody).toString();

    const req = http.request(
      { hostname: '127.0.0.1', port, path, method, headers },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode || 0, body: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode || 0, body: data });
          }
        });
      },
    );
    req.on('error', reject);
    if (reqBody) req.write(reqBody);
    req.end();
  });
}

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

beforeAll((done) => {
  // The imported app already has a server listening — close it and start fresh
  // on a random port so smoke tests don't collide with dev server
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { server: existingServer } = require('../index');
  existingServer.close(() => {
    server = app.listen(TEST_PORT, () => done());
  });
});

afterAll((done) => {
  server.close(() => done());
});

// ---------------------------------------------------------------------------
// 1. App starts and health check responds
// ---------------------------------------------------------------------------
describe('Smoke: App Lifecycle', () => {
  it('server is listening on assigned port', () => {
    const port = getPort();
    expect(port).toBeGreaterThan(0);
    expect(port).toBeLessThan(65536);
  });

  it('GET /health returns 200 with gateway status', async () => {
    const res = await request('/health');
    expect(res.status).toBe(200);
    const body = res.body as Record<string, unknown>;
    expect(body.status).toBe('UEF Gateway Online');
    expect(body.layer).toBe(2);
    expect(typeof body.uptime).toBe('number');
  });
});

// ---------------------------------------------------------------------------
// 2. Core API routes respond (not 404)
// ---------------------------------------------------------------------------
describe('Smoke: Core Routes Respond', () => {
  const routes = [
    { method: 'GET', path: '/agents' },
    { method: 'GET', path: '/templates' },
    { method: 'GET', path: '/integrations' },
    { method: 'GET', path: '/pipelines' },
    { method: 'GET', path: '/plugs' },
    { method: 'GET', path: '/deployments' },
    { method: 'GET', path: '/pmo' },
    { method: 'GET', path: '/house-of-ang' },
    { method: 'GET', path: '/lil-hawks' },
    { method: 'GET', path: '/admin/models' },
    { method: 'GET', path: '/admin/api-keys' },
    { method: 'GET', path: '/billing/tiers' },
    { method: 'GET', path: '/verticals' },
    { method: 'GET', path: '/perform/styles' },
  ];

  for (const route of routes) {
    it(`${route.method} ${route.path} responds with 200`, async () => {
      const res = await request(route.path, { method: route.method });
      expect(res.status).toBe(200);
      expect(res.body).toBeDefined();
    });
  }
});

// ---------------------------------------------------------------------------
// 3. Agent registry has agents loaded
// ---------------------------------------------------------------------------
describe('Smoke: Agent Registry', () => {
  it('returns at least 4 agents', async () => {
    const res = await request('/agents');
    expect(res.status).toBe(200);
    const body = res.body as { agents: unknown[] };
    expect(body.agents.length).toBeGreaterThanOrEqual(4);
  });
});

// ---------------------------------------------------------------------------
// 4. Template library has templates loaded
// ---------------------------------------------------------------------------
describe('Smoke: Template Library', () => {
  it('returns at least 6 templates', async () => {
    const res = await request('/templates');
    expect(res.status).toBe(200);
    const body = res.body as { templates: unknown[]; count: number };
    expect(body.count).toBeGreaterThanOrEqual(6);
  });
});

// ---------------------------------------------------------------------------
// 5. Integration registry has connectors
// ---------------------------------------------------------------------------
describe('Smoke: Integration Registry', () => {
  it('returns integrations with stats', async () => {
    const res = await request('/integrations');
    expect(res.status).toBe(200);
    const body = res.body as { integrations: unknown[]; stats: object };
    expect(body.integrations.length).toBeGreaterThanOrEqual(10);
    expect(body.stats).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// 6. ACP ingress validates input
// ---------------------------------------------------------------------------
describe('Smoke: ACP Ingress Validation', () => {
  it('rejects empty body with 400', async () => {
    const res = await request('/ingress/acp', {
      method: 'POST',
      body: {},
    });
    expect(res.status).toBe(400);
  });

  it('rejects oversized message with 400', async () => {
    const res = await request('/ingress/acp', {
      method: 'POST',
      body: { message: 'x'.repeat(10001) },
    });
    expect(res.status).toBe(400);
  });

  it('rejects invalid intent with 400', async () => {
    const res = await request('/ingress/acp', {
      method: 'POST',
      body: { message: 'hello', intent: 'INVALID_INTENT' },
    });
    expect(res.status).toBe(400);
  });

  it('accepts valid ACP request', async () => {
    const res = await request('/ingress/acp', {
      method: 'POST',
      body: {
        message: 'Hello ACHEEVY',
        intent: 'CHAT',
        userId: 'smoke-test-user',
      },
    });
    expect(res.status).toBe(200);
    const body = res.body as Record<string, unknown>;
    expect(body.reqId).toBeDefined();
    expect(body.status).toBe('SUCCESS');
    expect(body.quote).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// 7. Intake questionnaire loads
// ---------------------------------------------------------------------------
describe('Smoke: Intake Engine', () => {
  it('returns generic questions', async () => {
    const res = await request('/intake/questions');
    expect(res.status).toBe(200);
    const body = res.body as { questions: unknown[] };
    expect(body.questions.length).toBeGreaterThanOrEqual(5);
  });

  it('analyzes requirements from description', async () => {
    const res = await request('/intake/analyze', {
      method: 'POST',
      body: {
        description: 'I need a SaaS app with payments and user auth',
        responses: [],
      },
    });
    expect(res.status).toBe(200);
    const body = res.body as { analysis: object; spec: object };
    expect(body.analysis).toBeDefined();
    expect(body.spec).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// 8. Project creation end-to-end
// ---------------------------------------------------------------------------
describe('Smoke: Project Lifecycle', () => {
  it('creates project and starts pipeline', async () => {
    const res = await request('/projects', {
      method: 'POST',
      body: {
        userId: 'smoke-test-user',
        name: 'Smoke Test Project',
        description: 'A simple portfolio site for testing',
        responses: [
          { questionId: 'app-type', answer: 'portfolio' },
          { questionId: 'target-users', answer: 'testers' },
          { questionId: 'key-features', answer: ['user-auth'] },
          { questionId: 'expected-scale', answer: 'personal' },
        ],
      },
    });
    expect(res.status).toBe(201);
    const body = res.body as { project: { id: string }; pipeline: object };
    expect(body.project.id).toBeDefined();
    expect(body.pipeline).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// 9. Error handling — bad routes return proper errors
// ---------------------------------------------------------------------------
describe('Smoke: Error Handling', () => {
  it('returns 404 for non-existent project', async () => {
    const res = await request('/projects/non-existent-id');
    expect(res.status).toBe(404);
  });

  it('returns 404 for non-existent template', async () => {
    const res = await request('/templates/non-existent');
    expect(res.status).toBe(404);
  });

  it('returns 400 for invalid project creation', async () => {
    const res = await request('/projects', {
      method: 'POST',
      body: { name: '', description: '' },
    });
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// 10. Security basics
// ---------------------------------------------------------------------------
describe('Smoke: Security Basics', () => {
  it('health endpoint has security headers from Helmet', async () => {
    const port = getPort();
    const headers = await new Promise<http.IncomingHttpHeaders>((resolve, reject) => {
      http.get(`http://127.0.0.1:${port}/health`, (res) => {
        resolve(res.headers);
        res.resume(); // drain the response
      }).on('error', reject);
    });

    // Helmet sets these headers
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBeDefined();
  });

  it('CORS headers present', async () => {
    const port = getPort();
    const headers = await new Promise<http.IncomingHttpHeaders>((resolve, reject) => {
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port,
          path: '/health',
          method: 'OPTIONS',
          headers: { Origin: 'http://localhost:3000' },
        },
        (res) => {
          resolve(res.headers);
          res.resume();
        },
      );
      req.on('error', reject);
      req.end();
    });

    // CORS should allow the configured origin
    expect(
      headers['access-control-allow-origin'] === 'http://localhost:3000' ||
      headers['access-control-allow-origin'] === '*'
    ).toBe(true);
  });
});
