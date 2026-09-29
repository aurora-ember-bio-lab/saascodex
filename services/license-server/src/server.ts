// Aurora Ember ecosystem license server.
//
// Zero-dependency HTTP service: mints prefix-tag license keys and returns
// Ed25519-signed activation tokens (SCX1.<payload>.<sig>) that each product
// verifies offline with the public key at GET /pubkey.
//
// Env:
//   PORT / LICENSE_PORT        listen port (default 8787)
//   LICENSE_ADMIN_TOKEN        required bearer for /licenses, /revoke
//   LICENSE_DATA_DIR           where licenses.json + the keypair live (default ./data)
//   LICENSE_PRIVATE_KEY        optional fixed Ed25519 private key (PEM) + LICENSE_PUBLIC_KEY
//   TOKEN_TTL_SECONDS          activation token lifetime (default 30 days)
//
// Run: node src/server.ts   (Node >= 22 with type stripping)

import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';

import { generateKey, parseKey, signToken, tagForTier } from './license.ts';
import { createStore } from './store.ts';

const PORT = Number(process.env.PORT ?? process.env.LICENSE_PORT ?? 8787);
const TTL = Number(process.env.TOKEN_TTL_SECONDS ?? 30 * 24 * 60 * 60);
const ADMIN = (process.env.LICENSE_ADMIN_TOKEN ?? '').trim();

const store = createStore(process.env.LICENSE_DATA_DIR ?? './data');

function json(res: ServerResponse, status: number, body: unknown): void {
  const text = JSON.stringify(body);
  res.writeHead(status, { 'content-type': 'application/json', 'content-length': Buffer.byteLength(text) });
  res.end(text);
}

async function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 64 * 1024) throw new Error('body too large');
    chunks.push(chunk as Buffer);
  }
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as Record<string, unknown>;
}

function isAdmin(req: IncomingMessage): boolean {
  if (!ADMIN) return false;
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  return token.length > 0 && token === ADMIN;
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);
  const path = url.pathname;

  try {
    if (req.method === 'GET' && (path === '/health' || path === '/')) {
      return json(res, 200, { ok: true, service: 'aurora-ember-license-server' });
    }

    if (req.method === 'GET' && path === '/pubkey') {
      return json(res, 200, { algorithm: 'ed25519', publicKeyPem: store.publicKeyPem() });
    }

    if (req.method === 'POST' && path === '/activate') {
      const body = await readJson(req);
      const key = typeof body.key === 'string' ? body.key : '';
      const workspace = typeof body.workspace === 'string' && body.workspace ? body.workspace : 'default';
      const parsed = parseKey(key);
      if (!key) return json(res, 400, { error: { code: 'KEY_REQUIRED' } });
      if (!parsed.valid) return json(res, 400, { error: { code: 'KEY_INVALID' } });

      const row = store.activate(key, workspace);
      if (!row) return json(res, 404, { error: { code: 'LICENSE_NOT_FOUND' } });

      const nowSec = Math.floor(Date.now() / 1000);
      const token = signToken(
        {
          licenseId: row.id,
          domain: row.domain,
          plan: row.tier,
          workspace,
          seats: row.seats,
          issuedAt: nowSec,
          expiresAt: nowSec + TTL,
        },
        store.privateKey(),
      );
      return json(res, 200, { token, license: { id: row.id, domain: row.domain, tier: row.tier, seats: row.seats } });
    }

    if (req.method === 'GET' && path === '/revocations') {
      return json(res, 200, { revocations: store.revocations() });
    }

    // Admin-only endpoints.
    if (path === '/licenses' || path === '/revoke') {
      if (!ADMIN) return json(res, 501, { error: { code: 'ADMIN_NOT_CONFIGURED' } });
      if (!isAdmin(req)) return json(res, 401, { error: { code: 'UNAUTHORIZED' } });

      if (req.method === 'POST' && path === '/licenses') {
        const body = await readJson(req);
        const prefix = typeof body.prefix === 'string' ? body.prefix.toUpperCase() : '';
        const domain = typeof body.domain === 'string' ? body.domain : '';
        const tier = typeof body.tier === 'string' ? body.tier : '';
        const seats = typeof body.seats === 'number' && body.seats > 0 ? Math.floor(body.seats) : 1;
        if (!prefix || !domain || !tagForTier(tier)) {
          return json(res, 400, { error: { code: 'INVALID_LICENSE', message: 'prefix, domain, and a valid tier are required' } });
        }
        const key = generateKey(prefix, tier);
        const row = store.insert({
          key,
          prefix,
          domain,
          tier: tier.toLowerCase(),
          tag: tagForTier(tier)!,
          seats,
          workspace: typeof body.workspace === 'string' ? body.workspace : null,
          email: typeof body.email === 'string' ? body.email : null,
        });
        return json(res, 201, { id: row.id, key: row.key, domain: row.domain, tier: row.tier, seats: row.seats });
      }

      if (req.method === 'GET' && path === '/licenses') {
        return json(res, 200, { licenses: store.list().map((l) => ({ id: l.id, key: l.key, domain: l.domain, tier: l.tier, status: l.status, seats: l.seats, createdAt: l.createdAt, activations: l.activations.length })) });
      }

      if (req.method === 'POST' && path === '/revoke') {
        const body = await readJson(req);
        const id = typeof body.licenseId === 'string' ? body.licenseId : '';
        const row = id ? store.revoke(id) : undefined;
        if (!row) return json(res, 404, { error: { code: 'LICENSE_NOT_FOUND' } });
        return json(res, 200, { id: row.id, status: row.status });
      }
    }

    return json(res, 404, { error: { code: 'NOT_FOUND' } });
  } catch (err) {
    return json(res, 500, { error: { code: 'INTERNAL', message: err instanceof Error ? err.message : String(err) } });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[license-server] listening on http://0.0.0.0:${PORT} (data: ${store.dataDir}, admin: ${ADMIN ? 'on' : 'off'})`);
});
