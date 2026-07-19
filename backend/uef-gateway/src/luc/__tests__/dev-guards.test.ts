/**
 * LUC allocator — dev-script guard rails, proven structurally.
 *
 * The dev scripts (dev-serve.ts, dev-wallet.ts) exist to exercise the REAL
 * router against a THROWAWAY database. This suite proves their refusals are
 * structural, not comments:
 *   - importing either module is side-effect free (no server boot, no
 *     process.exit) — the boot is gated on `require.main === module`;
 *   - NODE_ENV=production is refused;
 *   - a missing LUC_DEV_DB is refused;
 *   - any path whose basename is aims.db — in ANY case, at any depth — is
 *     refused (Windows filesystems are case-insensitive; AIMS.DB IS the real
 *     gateway store there);
 *   - any db FILENAME that does not contain "devtest" is refused — the
 *     throwaway must positively name itself one (denylist AND allowlist);
 *   - dev-serve additionally refuses to start without an explicit auth key
 *     (no default-open credential).
 *
 * PROPRIETARY — A.I.M.S.
 */

// These imports are themselves the import-safety proof: before the
// require.main gate existed, loading either module executed main(), which —
// under jest's env (no LUC_DEV_DB) — called process.exit(1) and killed the
// worker before a single test ran.
import { guardDevServe } from '../scripts/dev-serve';
import { guardDevWallet } from '../scripts/dev-wallet';

const SERVE_OK = {
  NODE_ENV: 'test',
  LUC_DEV_DB: '/tmp/luc-devtest-throwaway.sqlite',
  LUC_INTERNAL_API_KEY: 'devtest-internal',
} as NodeJS.ProcessEnv;

const WALLET_OK = {
  NODE_ENV: 'test',
  LUC_DEV_DB: '/tmp/luc-devtest-throwaway.sqlite',
} as NodeJS.ProcessEnv;

describe('dev-serve guard rails (structural)', () => {
  it('accepts a well-formed throwaway environment', () => {
    const v = guardDevServe(SERVE_OK);
    expect(v).toEqual({
      ok: true,
      dbPath: '/tmp/luc-devtest-throwaway.sqlite',
      internalApiKey: 'devtest-internal',
    });
  });

  it('refuses NODE_ENV=production even when everything else is set', () => {
    const v = guardDevServe({ ...SERVE_OK, NODE_ENV: 'production' });
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.reason).toMatch(/NODE_ENV=production/);
  });

  it('refuses a missing LUC_DEV_DB', () => {
    const v = guardDevServe({ ...SERVE_OK, LUC_DEV_DB: undefined });
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.reason).toMatch(/LUC_DEV_DB/);
  });

  it.each(['aims.db', '/opt/gateway/data/aims.db', 'C:\\data\\AIMS.DB', 'Aims.Db'])(
    'refuses the real gateway store in any case/depth: %s',
    (dbPath) => {
      const v = guardDevServe({ ...SERVE_OK, LUC_DEV_DB: dbPath });
      expect(v.ok).toBe(false);
      if (!v.ok) expect(v.reason).toMatch(/aims\.db/);
    }
  );

  it.each(['/tmp/luc-dev.sqlite', 'C:\\tmp\\scratch.sqlite', '/var/data/production.db', '/tmp/devtest/other.sqlite'])(
    'refuses any db filename without "devtest" in it: %s',
    (dbPath) => {
      const v = guardDevServe({ ...SERVE_OK, LUC_DEV_DB: dbPath });
      expect(v.ok).toBe(false);
      if (!v.ok) expect(v.reason).toMatch(/devtest/);
    }
  );

  it('accepts "devtest" in the filename regardless of case', () => {
    const v = guardDevServe({ ...SERVE_OK, LUC_DEV_DB: '/tmp/LUC-DEVTEST.sqlite' });
    expect(v.ok).toBe(true);
  });

  it('refuses to start without an explicit auth key (no default-open)', () => {
    const v = guardDevServe({ ...SERVE_OK, LUC_INTERNAL_API_KEY: undefined });
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.reason).toMatch(/LUC_INTERNAL_API_KEY/);
  });

  it('treats an empty-string auth key as unconfigured, never as a valid key', () => {
    const v = guardDevServe({ ...SERVE_OK, LUC_INTERNAL_API_KEY: '' });
    expect(v.ok).toBe(false);
  });
});

describe('dev-wallet guard rails (structural)', () => {
  it('accepts a well-formed throwaway environment', () => {
    expect(guardDevWallet(WALLET_OK)).toEqual({
      ok: true,
      dbPath: '/tmp/luc-devtest-throwaway.sqlite',
    });
  });

  it('refuses NODE_ENV=production', () => {
    const v = guardDevWallet({ ...WALLET_OK, NODE_ENV: 'production' });
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.reason).toMatch(/NODE_ENV=production/);
  });

  it('refuses a missing LUC_DEV_DB', () => {
    const v = guardDevWallet({ ...WALLET_OK, LUC_DEV_DB: undefined });
    expect(v.ok).toBe(false);
  });

  it.each(['aims.db', './data/aims.db', 'D:\\store\\AIMS.db'])(
    'refuses the real gateway store in any case/depth: %s',
    (dbPath) => {
      const v = guardDevWallet({ ...WALLET_OK, LUC_DEV_DB: dbPath });
      expect(v.ok).toBe(false);
    }
  );

  it.each(['/tmp/luc-dev.sqlite', './data/ledger.sqlite', 'D:\\store\\backup.db'])(
    'refuses any db filename without "devtest" in it: %s',
    (dbPath) => {
      const v = guardDevWallet({ ...WALLET_OK, LUC_DEV_DB: dbPath });
      expect(v.ok).toBe(false);
      if (!v.ok) expect(v.reason).toMatch(/devtest/);
    }
  );
});
