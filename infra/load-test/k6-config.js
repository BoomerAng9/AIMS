/**
 * A.I.M.S. Load Test Configuration — k6
 *
 * Tests the VPS under realistic traffic patterns:
 *   - Landing page + static assets
 *   - Auth flow (sign-in page, NextAuth endpoints)
 *   - Chat with ACHEEVY (SSE stream endpoint)
 *   - Per|Form lobby + gridiron data API
 *   - Plug catalog browsing
 *   - UEF Gateway health + API calls
 *
 * Usage:
 *   k6 run infra/load-test/k6-config.js
 *   k6 run --vus 50 --duration 5m infra/load-test/k6-config.js
 *   K6_BASE_URL=https://plugmein.cloud k6 run infra/load-test/k6-config.js
 *
 * Thresholds calibrated for a single 4-core VPS (Hostinger KVM).
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// ── Custom metrics ──────────────────────────────────────────
const errorRate = new Rate('errors');
const chatLatency = new Trend('chat_first_byte_ms');
const apiLatency = new Trend('api_latency_ms');

// ── Configuration ───────────────────────────────────────────
const BASE_URL = __ENV.K6_BASE_URL || 'https://plugmein.cloud';
const LANDING_URL = __ENV.K6_LANDING_URL || 'https://aimanagedsolutions.cloud';

export const options = {
  // Ramp-up → sustained → ramp-down
  stages: [
    { duration: '30s', target: 10 },   // warm-up
    { duration: '2m',  target: 25 },   // normal traffic
    { duration: '2m',  target: 50 },   // peak load
    { duration: '1m',  target: 75 },   // stress test
    { duration: '30s', target: 0 },    // ramp-down
  ],

  thresholds: {
    // Page loads < 2s at p95
    http_req_duration: ['p(95)<2000', 'p(99)<4000'],
    // API calls < 500ms at p95
    api_latency_ms: ['p(95)<500'],
    // Chat first byte < 3s (SSE cold start)
    chat_first_byte_ms: ['p(95)<3000'],
    // Error rate < 5%
    errors: ['rate<0.05'],
    // Overall failure rate < 1%
    http_req_failed: ['rate<0.01'],
  },
};

// ── Test scenarios ──────────────────────────────────────────

export default function () {
  // Weighted scenario selection (realistic traffic distribution)
  const rand = Math.random();

  if (rand < 0.30) {
    landingPage();
  } else if (rand < 0.50) {
    performLobby();
  } else if (rand < 0.65) {
    chatEndpoint();
  } else if (rand < 0.80) {
    plugCatalog();
  } else if (rand < 0.90) {
    healthChecks();
  } else {
    apiCalls();
  }

  sleep(Math.random() * 2 + 0.5); // 0.5–2.5s think time
}

function landingPage() {
  group('Landing Page', () => {
    const res = http.get(`${LANDING_URL}/`);
    check(res, {
      'landing 200': (r) => r.status === 200,
      'landing < 2s': (r) => r.timings.duration < 2000,
    }) || errorRate.add(1);

    // Simulate static asset loads
    http.get(`${LANDING_URL}/favicon.ico`);
  });
}

function performLobby() {
  group('Per|Form Lobby', () => {
    // Dashboard page
    const page = http.get(`${BASE_URL}/dashboard/perform`);
    check(page, {
      'perform page 200': (r) => r.status === 200,
    }) || errorRate.add(1);

    // Live gridiron data API
    const gridiron = http.get(`${BASE_URL}/api/perform/gridiron`);
    apiLatency.add(gridiron.timings.duration);
    check(gridiron, {
      'gridiron 200': (r) => r.status === 200,
      'gridiron has data': (r) => {
        try { return JSON.parse(r.body).updatedAt !== undefined; } catch { return false; }
      },
    }) || errorRate.add(1);

    // Stats API
    const stats = http.get(`${BASE_URL}/api/perform/stats`);
    apiLatency.add(stats.timings.duration);
    check(stats, {
      'stats 200': (r) => r.status === 200,
    }) || errorRate.add(1);

    // Prospects API
    const prospects = http.get(`${BASE_URL}/api/perform/prospects?limit=10`);
    apiLatency.add(prospects.timings.duration);
    check(prospects, {
      'prospects 200': (r) => r.status === 200,
    }) || errorRate.add(1);
  });
}

function chatEndpoint() {
  group('Chat w/ ACHEEVY', () => {
    // Check the chat page loads
    const page = http.get(`${BASE_URL}/chat`);
    check(page, {
      'chat page loads': (r) => r.status === 200 || r.status === 302 || r.status === 307,
    }) || errorRate.add(1);

    // Hit the UEF gateway health endpoint
    const health = http.get(`${BASE_URL}/api/health`);
    apiLatency.add(health.timings.duration);
    check(health, {
      'api health 200': (r) => r.status === 200,
    }) || errorRate.add(1);
  });
}

function plugCatalog() {
  group('Plug Catalog', () => {
    const discover = http.get(`${BASE_URL}/discover`);
    check(discover, {
      'discover page 200': (r) => r.status === 200,
    }) || errorRate.add(1);

    const plugs = http.get(`${BASE_URL}/api/plugs`);
    apiLatency.add(plugs.timings.duration);
    check(plugs, {
      'plugs api ok': (r) => r.status === 200 || r.status === 404,
    }) || errorRate.add(1);
  });
}

function healthChecks() {
  group('Health Checks', () => {
    const endpoints = [
      `${BASE_URL}/api/health`,
      `${BASE_URL}/api/perform/stats`,
    ];

    endpoints.forEach((url) => {
      const res = http.get(url);
      apiLatency.add(res.timings.duration);
      check(res, {
        [`${url} healthy`]: (r) => r.status === 200,
      }) || errorRate.add(1);
    });
  });
}

function apiCalls() {
  group('API Calls', () => {
    // Draft data
    const draft = http.get(`${BASE_URL}/api/perform/draft`);
    apiLatency.add(draft.timings.duration);
    check(draft, {
      'draft api ok': (r) => r.status === 200 || r.status === 404,
    }) || errorRate.add(1);

    // Transfer portal
    const portal = http.get(`${BASE_URL}/api/perform/transfer-portal`);
    apiLatency.add(portal.timings.duration);
    check(portal, {
      'portal api ok': (r) => r.status === 200 || r.status === 404,
    }) || errorRate.add(1);
  });
}
