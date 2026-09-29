// Premium-plugin licensing: verify activation tokens and gate premium plugins.
//
// A user pastes a `PREFIX-TAG-…` key; the daemon activates it on the license
// server, verifies the returned `SCX1` token OFFLINE with the server's cached
// public key, and stores the activation. Premium plugins then unlock for
// `POST /api/plugins/:id/apply` while the token is valid.
//
// The gate middleware is registered BEFORE the plugin routes so it runs first.

import express, { type Express, type Request, type Response } from 'express';
import type Database from 'better-sqlite3';

import {
  activateLicenseKey,
  fetchLicensingPublicKey,
  licenseServerUrl,
  parseLicenseKey,
  planGrantsPremium,
  verifyActivationToken,
} from '../licensing/verifier.js';
import {
  deletePluginLicense,
  getInstalledPluginSource,
  getPluginLicense,
  isPremiumSource,
  listPluginLicenses,
  upsertPluginLicense,
} from '../licensing/store.js';

type SqliteDb = Database.Database;

export interface RegisterLicensingRoutesDeps {
  db: SqliteDb;
  env?: NodeJS.ProcessEnv;
  now?: () => number;
  fetchImpl?: typeof fetch;
}

const PUBKEY_CACHE = new Map<string, string>();

export function registerLicensingRoutes(app: Express, deps: RegisterLicensingRoutesDeps): void {
  const env = deps.env ?? process.env;
  const now = deps.now ?? Date.now;
  const db = deps.db;
  const baseUrl = () => licenseServerUrl(env);

  async function publicKey(): Promise<string> {
    const url = baseUrl();
    const cached = PUBKEY_CACHE.get(url);
    if (cached) return cached;
    const pem = await fetchLicensingPublicKey(url, deps.fetchImpl ?? fetch);
    PUBKEY_CACHE.set(url, pem);
    return pem;
  }

  function licenseStatus(pluginId: string): { licensed: boolean; plan?: string; expiresAt?: number } {
    const row = getPluginLicense(db, pluginId);
    if (!row) return { licensed: false };
    if (row.expires_at <= now()) return { licensed: false, plan: row.plan, expiresAt: row.expires_at };
    return { licensed: true, plan: row.plan, expiresAt: row.expires_at };
  }

  // ── Gate: premium plugins require a valid license to apply ────────────
  app.post(['/api/plugins/:id/apply', '/api/plugins/:id/apply-local'], (req: Request, res: Response, next) => {
    try {
      const pluginId = typeof req.params.id === 'string' ? req.params.id : '';
      if (!pluginId) return next();
      const source = getInstalledPluginSource(db, pluginId);
      if (!isPremiumSource(source)) return next();
      const status = licenseStatus(pluginId);
      if (status.licensed) return next();
      return res.status(402).json({
        error: {
          code: 'LICENSE_REQUIRED',
          message: 'This premium plugin needs an activation license. Add your key with POST /api/plugins/:id/activate-license.',
          pluginId,
        },
      });
    } catch (err) {
      return res.status(500).json({ error: String(err) });
    }
  });

  // ── Gate: exporting premium content requires a valid license ──────────
  // Community plugins/templates export freely; a premium snapshot (or a
  // premium plugin applied in the project) needs an activation key.
  app.post('/api/applied-plugins/export', (req: Request, res: Response, next) => {
    try {
      const body = req.body && typeof req.body === 'object' ? (req.body as Record<string, unknown>) : {};
      const pluginIds = new Set<string>();
      if (typeof body.snapshotId === 'string' && body.snapshotId) {
        const row = db
          .prepare(`SELECT plugin_id FROM applied_plugin_snapshots WHERE id = ?`)
          .get(body.snapshotId) as { plugin_id?: string } | undefined;
        if (row?.plugin_id) pluginIds.add(row.plugin_id);
      } else if (typeof body.projectId === 'string' && body.projectId) {
        const rows = db
          .prepare(`SELECT DISTINCT plugin_id FROM applied_plugin_snapshots WHERE project_id = ?`)
          .all(body.projectId) as Array<{ plugin_id?: string }>;
        for (const row of rows) if (row.plugin_id) pluginIds.add(row.plugin_id);
      }
      const unlicensed = [...pluginIds].filter(
        (id) => isPremiumSource(getInstalledPluginSource(db, id)) && !licenseStatus(id).licensed,
      );
      if (unlicensed.length > 0) {
        return res.status(402).json({
          error: {
            code: 'LICENSE_REQUIRED',
            message: 'Exporting premium content requires an activation license.',
            pluginIds: unlicensed,
          },
        });
      }
      return next();
    } catch (err) {
      return res.status(500).json({ error: String(err) });
    }
  });

  // ── Activate a license key for a plugin ───────────────────────────────
  app.post('/api/plugins/:id/activate-license', express.json({ limit: '8kb' }), async (req: Request, res: Response) => {
    const pluginId = typeof req.params.id === 'string' ? req.params.id : '';
    const key = typeof req.body?.key === 'string' ? req.body.key.trim() : '';
    if (!pluginId) return res.status(400).json({ error: { code: 'PLUGIN_REQUIRED' } });
    if (!key) return res.status(400).json({ error: { code: 'KEY_REQUIRED' } });

    const parsed = parseLicenseKey(key);
    if (!parsed.valid) return res.status(400).json({ error: { code: 'KEY_INVALID' } });
    const source = getInstalledPluginSource(db, pluginId);
    if (!isPremiumSource(source)) {
      return res.status(400).json({ error: { code: 'NOT_PREMIUM', message: 'This plugin does not require a license' } });
    }

    const workspace = (req.get('x-splatstudio-workspace') ?? 'local').trim() || 'local';
    try {
      const activated = await activateLicenseKey(baseUrl(), key, workspace, deps.fetchImpl ?? fetch);
      if ('error' in activated) {
        return res.status(502).json({ error: { code: 'ACTIVATE_FAILED', message: activated.error } });
      }
      const pem = await publicKey();
      const verified = verifyActivationToken(activated.token, pem, { nowSec: Math.floor(now() / 1000) });
      if (!verified.ok) {
        return res.status(402).json({ error: { code: 'TOKEN_INVALID', reason: verified.reason } });
      }
      if (!planGrantsPremium(verified.payload.plan)) {
        return res.status(402).json({ error: { code: 'PLAN_NOT_PREMIUM', plan: verified.payload.plan } });
      }
      upsertPluginLicense(db, {
        plugin_id: pluginId,
        token: activated.token,
        plan: verified.payload.plan,
        domain: verified.payload.domain,
        license_id: verified.payload.licenseId,
        expires_at: verified.payload.expiresAt * 1000,
        activated_at: now(),
      });
      return res.json({
        activated: true,
        plan: verified.payload.plan,
        domain: verified.payload.domain,
        expiresAt: verified.payload.expiresAt * 1000,
      });
    } catch (err) {
      return res.status(502).json({ error: { code: 'LICENSE_SERVER_UNREACHABLE', message: err instanceof Error ? err.message : String(err) } });
    }
  });

  app.get('/api/plugins/:id/license', async (req: Request, res: Response) => {
    const pluginId = typeof req.params.id === 'string' ? req.params.id : '';
    const row = getPluginLicense(db, pluginId);
    if (!row) return res.json({ licensed: false, premium: isPremiumSource(getInstalledPluginSource(db, pluginId)) });
    const nowMs = now();
    let signatureOk: boolean;
    let reason: string | undefined;
    try {
      const verified = verifyActivationToken(row.token, await publicKey(), { nowSec: Math.floor(nowMs / 1000) });
      signatureOk = verified.ok;
      reason = verified.ok ? undefined : verified.reason;
    } catch {
      // License server unreachable: trust the stored expiry we verified at activation.
      signatureOk = true;
    }
    return res.json({
      licensed: signatureOk && row.expires_at > nowMs,
      premium: true,
      plan: row.plan,
      domain: row.domain,
      expiresAt: row.expires_at,
      activatedAt: row.activated_at,
      reason,
    });
  });

  app.delete('/api/plugins/:id/license', (req: Request, res: Response) => {
    const pluginId = typeof req.params.id === 'string' ? req.params.id : '';
    deletePluginLicense(db, pluginId);
    res.json({ ok: true });
  });

  app.get('/api/licensing/entitlement', (_req: Request, res: Response) => {
    const nowMs = now();
    const active = listPluginLicenses(db).filter((l) => l.expires_at > nowMs);
    res.json({
      premium: active.length > 0,
      licenses: active.map((l) => ({ pluginId: l.plugin_id, plan: l.plan, expiresAt: l.expires_at })),
      serverUrl: baseUrl(),
    });
  });
}
