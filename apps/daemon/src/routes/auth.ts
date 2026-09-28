// Hosted auth routes: registration, login, JWT sessions, and API keys.
//
// Backed by the daemon's SQLite `auth_*` tables (src/auth/store.ts). Requires
// `JWT_SECRET`; without it every route here answers 501 so an unconfigured
// deployment fails closed. Docs: docs/AUTH.md, docs/PRICING.md.

import { randomBytes, randomUUID } from 'node:crypto';

import express, { type Express, type Request, type Response } from 'express';
import type Database from 'better-sqlite3';

import { gatingForPlan, isPlanId } from '../billing/plans.js';
import {
  hashPassword,
  isPasswordAcceptable,
  normalizeEmail,
  verifyPassword,
} from '../auth/passwords.js';
import { hashToken, signJwt, verifyJwt, type SessionClaims } from '../auth/jwt.js';
import {
  createApiKey,
  createSession,
  createUser,
  findApiKeyByHash,
  findSessionByTokenHash,
  findUserByEmail,
  findUserById,
  listApiKeys,
  revokeApiKey,
  revokeSession,
  type AuthUser,
} from '../auth/store.js';

type SqliteDb = Database.Database;

export interface RegisterAuthRoutesDeps {
  db: SqliteDb;
  env?: NodeJS.ProcessEnv;
  now?: () => number;
}

const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;
const MIN_SECRET_LENGTH = 16;

function publicUser(user: AuthUser) {
  return { id: user.id, email: user.email, name: user.name, plan: user.plan };
}

function bearerFrom(req: Request): string | null {
  const header = req.get('authorization');
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match ? match[1]!.trim() : null;
}

export function registerAuthRoutes(app: Express, deps: RegisterAuthRoutesDeps): void {
  const env = deps.env ?? process.env;
  const now = deps.now ?? Date.now;
  const db = deps.db;

  const readSecret = (): string | null => {
    const value = env.JWT_SECRET;
    return value && value.trim().length >= MIN_SECRET_LENGTH ? value.trim() : null;
  };

  const notConfigured = (res: Response): void => {
    res.status(501).json({
      error: {
        code: 'AUTH_NOT_CONFIGURED',
        message: 'Set JWT_SECRET (>= 16 chars) to enable hosted accounts',
      },
    });
  };

  function issueSession(req: Request, user: AuthUser): string {
    const secret = readSecret()!;
    const nowMs = now();
    const iat = Math.floor(nowMs / 1000);
    const exp = iat + SESSION_TTL_SECONDS;
    const id = randomUUID();
    const token = signJwt({ sub: user.id, plan: user.plan, jti: id, iat, exp }, secret);
    createSession(db, {
      id,
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: exp * 1000,
      userAgent: req.get('user-agent') ?? null,
      now: nowMs,
    });
    return token;
  }

  interface AuthedRequest {
    user: AuthUser;
    claims: SessionClaims;
  }

  function authenticate(req: Request): AuthedRequest | null {
    const secret = readSecret();
    if (!secret) return null;
    const token = bearerFrom(req);
    const verified = verifyJwt(token, secret, Math.floor(now() / 1000));
    if (!verified.ok || !token) return null;
    const session = findSessionByTokenHash(db, hashToken(token));
    if (!session || session.revoked_at != null || session.expires_at <= now()) return null;
    const user = findUserById(db, verified.claims.sub);
    if (!user) return null;
    return { user, claims: verified.claims };
  }

  app.post('/api/auth/register', express.json({ limit: '16kb' }), (req: Request, res: Response) => {
    const secret = readSecret();
    if (!secret) return notConfigured(res);

    const email = normalizeEmail(req.body?.email);
    if (!email) {
      return res.status(400).json({ error: { code: 'INVALID_EMAIL', message: 'A valid email is required' } });
    }
    if (!isPasswordAcceptable(req.body?.password)) {
      return res.status(400).json({
        error: { code: 'WEAK_PASSWORD', message: 'Password must be at least 8 characters' },
      });
    }
    const requestedPlan = req.body?.plan;
    const wantsPaid = typeof requestedPlan === 'string' && requestedPlan !== 'free' && isPlanId(requestedPlan);

    if (findUserByEmail(db, email)) {
      return res.status(409).json({ error: { code: 'EMAIL_TAKEN', message: 'That email is already registered' } });
    }

    const name = typeof req.body?.name === 'string' && req.body.name.trim() ? req.body.name.trim().slice(0, 200) : null;
    let user: AuthUser;
    try {
      user = createUser(db, { email, name, passwordHash: hashPassword(req.body.password), plan: 'free' });
    } catch (err) {
      // Unique-constraint race: another request registered the same email.
      if (String(err).includes('UNIQUE')) {
        return res.status(409).json({ error: { code: 'EMAIL_TAKEN', message: 'That email is already registered' } });
      }
      throw err;
    }
    const token = issueSession(req, user);
    res.status(201).json({
      token,
      user: publicUser(user),
      // Paid plans continue into Stripe Checkout; the free plan opens the app.
      next: wantsPaid ? 'checkout' : 'app',
      plan: wantsPaid ? requestedPlan : 'free',
    });
  });

  app.post('/api/auth/login', express.json({ limit: '16kb' }), (req: Request, res: Response) => {
    const secret = readSecret();
    if (!secret) return notConfigured(res);

    const email = normalizeEmail(req.body?.email);
    const user = email ? findUserByEmail(db, email) : undefined;
    // Verify even when the user is missing keeps the response time flat.
    const ok = user
      ? verifyPassword(typeof req.body?.password === 'string' ? req.body.password : '', user.password_hash)
      : verifyPassword('', '$scrypt$16384$8$1$AAAA$AAAA') && false;
    if (!user || !ok) {
      return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect' } });
    }
    const token = issueSession(req, user);
    res.json({ token, user: publicUser(user) });
  });

  app.get('/api/auth/session', (req: Request, res: Response) => {
    if (!readSecret()) return notConfigured(res);
    const authed = authenticate(req);
    if (!authed) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'A valid session is required' } });
    }
    res.json({ user: publicUser(authed.user) });
  });

  app.post('/api/auth/logout', (req: Request, res: Response) => {
    if (!readSecret()) return notConfigured(res);
    const authed = authenticate(req);
    if (!authed) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'A valid session is required' } });
    }
    revokeSession(db, authed.claims.jti, now());
    res.json({ ok: true });
  });

  app.get('/api/auth/api-keys', (req: Request, res: Response) => {
    if (!readSecret()) return notConfigured(res);
    const authed = authenticate(req);
    if (!authed) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'A valid session is required' } });
    }
    res.json({
      keys: listApiKeys(db, authed.user.id).map((key) => ({
        id: key.id,
        name: key.name,
        prefix: key.prefix,
        createdAt: key.created_at,
        lastUsedAt: key.last_used_at,
      })),
    });
  });

  app.post('/api/auth/api-keys', express.json({ limit: '4kb' }), (req: Request, res: Response) => {
    if (!readSecret()) return notConfigured(res);
    const authed = authenticate(req);
    if (!authed) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'A valid session is required' } });
    }
    if (!gatingForPlan(isPlanId(authed.user.plan) ? authed.user.plan : 'free').apiAccess) {
      return res.status(403).json({
        error: { code: 'PLAN_REQUIRED', message: 'API access requires the Pro or Studios plan' },
      });
    }
    const name = typeof req.body?.name === 'string' && req.body.name.trim() ? req.body.name.trim().slice(0, 100) : 'API key';
    const raw = `scx_live_${randomBytes(24).toString('base64url')}`;
    const prefix = raw.slice(0, 12);
    const created = createApiKey(db, { userId: authed.user.id, name, prefix, keyHash: hashToken(raw) });
    // The raw key is returned exactly once.
    res.status(201).json({ id: created.id, name: created.name, prefix, key: raw });
  });

  app.delete('/api/auth/api-keys/:id', (req: Request, res: Response) => {
    if (!readSecret()) return notConfigured(res);
    const authed = authenticate(req);
    if (!authed) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'A valid session is required' } });
    }
    const keyId = typeof req.params.id === 'string' ? req.params.id : '';
    revokeApiKey(db, keyId, authed.user.id, now());
    res.json({ ok: true });
  });
}

/**
 * Validate an API key (`Authorization: Bearer scx_…`) against the store.
 * Exported for the daemon's API-token middleware and tests.
 */
export function authenticateApiKey(db: SqliteDb, rawKey: string): AuthUser | null {
  const record = findApiKeyByHash(db, hashToken(rawKey));
  if (!record || record.revoked_at != null) return null;
  return findUserById(db, record.user_id) ?? null;
}
