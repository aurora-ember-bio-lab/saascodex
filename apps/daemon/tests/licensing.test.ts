import { createServer, type Server } from 'node:http';
import { generateKeyPairSync, sign } from 'node:crypto';

import Database from 'better-sqlite3';
import express from 'express';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  parseLicenseKey,
  planGrantsPremium,
  verifyActivationToken,
} from '../src/licensing/verifier.js';
import {
  deletePluginLicense,
  getPluginLicense,
  isPremiumSource,
  listPluginLicenses,
  migrateLicensing,
  upsertPluginLicense,
} from '../src/licensing/store.js';
import { registerLicensingRoutes } from '../src/routes/licensing.js';

const NOW_MS = 1_760_000_000_000;
const NOW_SEC = Math.floor(NOW_MS / 1000);

// A format/checksum-valid key (same generator as the license server).
const VALID_KEY = 'SPLT-PRO-HP2RG-KRXWH-TGK1S-X275';

describe('licensing verifier', () => {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  const pubPem = publicKey.export({ type: 'spki', format: 'pem' }).toString();

  function token(overrides: Partial<Record<string, unknown>> = {}): string {
    const payload = {
      licenseId: 'lic-1',
      domain: 'splatstudio.app',
      plan: 'pro',
      workspace: 'ws',
      seats: 3,
      issuedAt: NOW_SEC - 10,
      expiresAt: NOW_SEC + 3600,
      ...overrides,
    };
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const sig = sign(null, Buffer.from(body, 'utf8'), privateKey).toString('base64url');
    return `SCX1.${body}.${sig}`;
  }

  it('validates the key format + checksum', () => {
    expect(parseLicenseKey(VALID_KEY).valid).toBe(true);
    expect(parseLicenseKey(VALID_KEY).prefix).toBe('SPLT');
    expect(parseLicenseKey('SPLT-PRO-AAAAA-AAAAA-AAAAA-AAAA').valid).toBe(false);
    expect(parseLicenseKey('nonsense').valid).toBe(false);
  });

  it('maps plans to premium access', () => {
    expect(planGrantsPremium('free')).toBe(false);
    expect(planGrantsPremium('starter')).toBe(false);
    expect(planGrantsPremium('pro')).toBe(true);
    expect(planGrantsPremium('studio')).toBe(true);
  });

  it('verifies a signed token offline', () => {
    const result = verifyActivationToken(token(), pubPem, { nowSec: NOW_SEC });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.payload.plan).toBe('pro');
  });

  it('rejects tampered, expired, wrong-domain tokens', () => {
    expect(verifyActivationToken(`${token()}x`, pubPem, { nowSec: NOW_SEC }).ok).toBe(false);
    expect(verifyActivationToken(token({ expiresAt: NOW_SEC - 1 }), pubPem, { nowSec: NOW_SEC })).toEqual({
      ok: false,
      reason: 'expired',
    });
    expect(
      verifyActivationToken(token(), pubPem, { nowSec: NOW_SEC, expectedDomain: 'other.app' }),
    ).toEqual({ ok: false, reason: 'domain_mismatch' });
  });

  it('detects premium sources', () => {
    expect(isPremiumSource('premium-ecosystem/premium_plugins/acme/pro')).toBe(true);
    expect(isPremiumSource('github:aurora-ember-bio-lab/splatstudio@main/premium-ecosystem/premium_plugins/x')).toBe(true);
    expect(isPremiumSource('plugins/community/free-thing')).toBe(false);
    // The bundled official design system named "premium" must NOT be gated.
    expect(isPremiumSource('/app/plugins/_official/design-systems/premium')).toBe(false);
    expect(isPremiumSource(undefined)).toBe(false);
  });
});

describe('licensing store', () => {
  it('stores, reads and deletes plugin licenses', () => {
    const db = new Database(':memory:');
    migrateLicensing(db);
    upsertPluginLicense(db, {
      plugin_id: 'premium-x',
      token: 'SCX1.a.b',
      plan: 'pro',
      domain: 'splatstudio.app',
      license_id: 'lic-1',
      expires_at: NOW_MS + 1000,
      activated_at: NOW_MS,
    });
    expect(getPluginLicense(db, 'premium-x')?.plan).toBe('pro');
    expect(listPluginLicenses(db)).toHaveLength(1);
    deletePluginLicense(db, 'premium-x');
    expect(getPluginLicense(db, 'premium-x')).toBeUndefined();
  });
});

describe('licensing routes (HTTP + gate)', () => {
  let server: Server;
  let base: string;
  let db: Database.Database;
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  const pubPem = publicKey.export({ type: 'spki', format: 'pem' }).toString();

  const mockFetch = (async (url: string | URL | Request) => {
    const href = typeof url === 'string' ? url : url.toString();
    if (href.endsWith('/pubkey')) {
      return new Response(JSON.stringify({ publicKeyPem: pubPem }), { status: 200, headers: { 'content-type': 'application/json' } });
    }
    if (href.endsWith('/activate')) {
      const payload = {
        licenseId: 'lic-http',
        domain: 'splatstudio.app',
        plan: 'pro',
        workspace: 'local',
        seats: 1,
        issuedAt: NOW_SEC - 1,
        expiresAt: NOW_SEC + 3600,
      };
      const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
      const sig = sign(null, Buffer.from(body, 'utf8'), privateKey).toString('base64url');
      return new Response(JSON.stringify({ token: `SCX1.${body}.${sig}`, license: { plan: 'pro', domain: 'splatstudio.app' } }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }
    return new Response('{}', { status: 404, headers: { 'content-type': 'application/json' } });
  }) as unknown as typeof fetch;

  beforeAll(async () => {
    db = new Database(':memory:');
    migrateLicensing(db);
    db.exec(`CREATE TABLE installed_plugins (id TEXT PRIMARY KEY, source TEXT)`);
    db.prepare(`INSERT INTO installed_plugins (id, source) VALUES (?, ?)`).run('premium-x', 'premium-ecosystem/premium_plugins/acme/pro');
    db.prepare(`INSERT INTO installed_plugins (id, source) VALUES (?, ?)`).run('free-y', 'plugins/community/free-thing');
    db.exec(`CREATE TABLE applied_plugin_snapshots (id TEXT PRIMARY KEY, project_id TEXT NOT NULL, plugin_id TEXT NOT NULL)`);
    db.prepare(`INSERT INTO applied_plugin_snapshots (id, project_id, plugin_id) VALUES (?,?,?)`).run('snap-premium', 'proj-1', 'premium-x');
    db.prepare(`INSERT INTO applied_plugin_snapshots (id, project_id, plugin_id) VALUES (?,?,?)`).run('snap-community', 'proj-1', 'free-y');

    const app = express();
    app.use(express.json());
    registerLicensingRoutes(app, {
      db,
      env: { LICENSE_SERVER_URL: 'https://lic.test' } as NodeJS.ProcessEnv,
      now: () => NOW_MS,
      fetchImpl: mockFetch,
    });
    // Placeholder handler registered AFTER the gate → the gate runs first.
    app.post(['/api/plugins/:id/apply', '/api/plugins/:id/apply-local'], (_req, res) => res.json({ applied: true }));
    app.post('/api/applied-plugins/export', (_req, res) => res.json({ exported: true }));

    server = createServer(app);
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const addr = server.address();
    base = `http://127.0.0.1:${typeof addr === 'object' && addr ? addr.port : 0}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  async function post(path: string, body: unknown) {
    const res = await fetch(`${base}${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    return { status: res.status, body: (await res.json()) as Record<string, unknown> };
  }
  async function get(path: string) {
    const res = await fetch(`${base}${path}`);
    return { status: res.status, body: (await res.json()) as Record<string, unknown> };
  }

  it('gates a premium plugin before activation', async () => {
    const res = await post('/api/plugins/premium-x/apply', {});
    expect(res.status).toBe(402);
    expect((res.body.error as { code: string }).code).toBe('LICENSE_REQUIRED');
  });

  it('lets a non-premium plugin through the gate', async () => {
    expect((await post('/api/plugins/free-y/apply', {})).status).toBe(200);
  });

  it('gates premium export before activation but not community export', async () => {
    const premium = await post('/api/applied-plugins/export', { snapshotId: 'snap-premium' });
    expect(premium.status).toBe(402);
    expect((premium.body.error as { code: string }).code).toBe('LICENSE_REQUIRED');
    expect((await post('/api/applied-plugins/export', { snapshotId: 'snap-community' })).status).toBe(200);
  });

  it('activates a license key and then unlocks the plugin', async () => {
    const activate = await post('/api/plugins/premium-x/activate-license', { key: VALID_KEY });
    expect(activate.status).toBe(200);
    expect(activate.body).toMatchObject({ activated: true, plan: 'pro' });

    const status = await get('/api/plugins/premium-x/license');
    expect(status.body).toMatchObject({ licensed: true, plan: 'pro' });

    expect((await post('/api/plugins/premium-x/apply', {})).status).toBe(200);
    // Export of the premium snapshot is now unlocked too.
    expect((await post('/api/applied-plugins/export', { snapshotId: 'snap-premium' })).status).toBe(200);
  });

  it('rejects an invalid key and reports entitlement', async () => {
    expect((await post('/api/plugins/premium-x/activate-license', { key: 'bad' })).status).toBe(400);
    const ent = await get('/api/licensing/entitlement');
    expect(ent.body).toMatchObject({ premium: true, serverUrl: 'https://lic.test' });
  });
});
