import type { AdapterEnvironmentTestContext, AdapterEnvironmentTestResult } from '@paperclipai/adapter-utils';
import { resolveBrokerEndpoint, resolveTimeoutMs } from './endpoint.js';

export async function testEnvironment(_ctx: AdapterEnvironmentTestContext): Promise<AdapterEnvironmentTestResult> {
  const checks: AdapterEnvironmentTestResult['checks'] = [];
  const testedAt = new Date().toISOString();
  let endpoint: URL;

  try {
    endpoint = resolveBrokerEndpoint();
    checks.push({ code: 'broker_url_configured', level: 'info', message: 'A.I.M.S. broker URL is valid.' });
  } catch (error) {
    checks.push({
      code: 'broker_url_missing_or_invalid', level: 'error',
      message: error instanceof Error ? error.message : 'A.I.M.S. broker URL is invalid.',
      hint: 'Set AIMS_OPENHANDS_BROKER_URL on the Paperclip server; use a private HTTPS route.',
    });
    return { adapterType: 'aims_openhands', status: 'fail', checks, testedAt };
  }

  let timeoutMs: number;
  try {
    timeoutMs = resolveTimeoutMs();
    checks.push({ code: 'timeout_valid', level: 'info', message: 'Broker timeout is within the supported range.' });
  } catch (error) {
    checks.push({ code: 'timeout_invalid', level: 'error', message: error instanceof Error ? error.message : 'Broker timeout is invalid.' });
    return { adapterType: 'aims_openhands', status: 'fail', checks, testedAt };
  }

  try {
    const response = await fetch(new URL('/healthz/integrations/paperclip/openhands', endpoint), {
      method: 'GET', headers: { Accept: 'application/json' }, redirect: 'error', cache: 'no-store',
      signal: AbortSignal.timeout(Math.min(timeoutMs, 10_000)),
    });
    if (!response.ok) {
      checks.push({
        code: 'broker_health_failed', level: 'error',
        message: `A.I.M.S. broker readiness probe returned HTTP ${response.status}.`,
        hint: 'This check does not create a task; do not assign agents until the broker and Canvas bindings pass readiness.',
      });
      return { adapterType: 'aims_openhands', status: 'fail', checks, testedAt };
    }
    checks.push({ code: 'broker_reachable', level: 'info', message: 'A.I.M.S. broker readiness endpoint responded.' });
    return { adapterType: 'aims_openhands', status: 'pass', checks, testedAt };
  } catch {
    checks.push({
      code: 'broker_unreachable', level: 'error',
      message: 'A.I.M.S. broker readiness probe failed; no task or Canvas conversation was created.',
      hint: 'Verify private DNS, TLS, ingress policy, and the broker health route from the Paperclip host.',
    });
    return { adapterType: 'aims_openhands', status: 'fail', checks, testedAt };
  }
}
