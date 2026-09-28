import Database from 'better-sqlite3';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  hashPassword,
  isPasswordAcceptable,
  normalizeEmail,
  verifyPassword,
} from '../src/auth/passwords.js';
import { hashToken, signJwt, verifyJwt } from '../src/auth/jwt.js';
import {
  createApiKey,
  createSession,
  createUser,
  findSessionByTokenHash,
  findUserByEmail,
  findUserById,
  listApiKeys,
  migrateAuth,
  revokeApiKey,
  revokeSession,
  updateUserPlan,
} from '../src/auth/store.js';
import { authenticateApiKey } from '../src/routes/auth.js';
import { gatingForPlan } from '../src/billing/plans.js';

describe('password hashing', () => {
  it('round-trips a password and rejects the wrong one', () => {
    const stored = hashPassword('correct horse battery staple');
    expect(stored.startsWith('scrypt$')).toBe(true);
    expect(verifyPassword('correct horse battery staple', stored)).toBe(true);
    expect(verifyPassword('wrong password', stored)).toBe(false);
  });

  it('produces a different hash per call (random salt)', () => {
    expect(hashPassword('same')).not.toBe(hashPassword('same'));
  });

  it('fails closed on malformed or missing stored hashes', () => {
    expect(verifyPassword('x', null)).toBe(false);
    expect(verifyPassword('x', '')).toBe(false);
    expect(verifyPassword('x', 'plaintext')).toBe(false);
    expect(verifyPassword('x', 'scrypt$1$2$3$notbase64$zzz')).toBe(false);
  });

  it('enforces the password policy and email normalization', () => {
    expect(isPasswordAcceptable('short')).toBe(false);
    expect(isPasswordAcceptable('longenough')).toBe(true);
    expect(normalizeEmail('  User@Example.COM ')).toBe('user@example.com');
    expect(normalizeEmail('not-an-email')).toBeNull();
    expect(normalizeEmail(42)).toBeNull();
  });
});

describe('JWT sessions', () => {
  const secret = 'test-secret-at-least-16-chars';
  const claims = { sub: 'user-1', plan: 'pro', jti: 'sess-1', iat: 1000, exp: 2000 };

  it('signs and verifies claims', () => {
    const token = signJwt(claims, secret);
    const result = verifyJwt(token, secret, 1500);
    expect(result).toEqual({ ok: true, claims });
  });

  it('rejects a tampered token and a wrong secret', () => {
    const token = signJwt(claims, secret);
    const tampered = `${token.split('.').slice(0, 2).join('.')}.AAAA`;
    expect(verifyJwt(tampered, secret, 1500)).toEqual({ ok: false, reason: 'bad_signature' });
    expect(verifyJwt(token, 'another-secret-16-plus-chars', 1500)).toEqual({
      ok: false,
      reason: 'bad_signature',
    });
  });

  it('rejects expired and malformed tokens', () => {
    const token = signJwt(claims, secret);
    expect(verifyJwt(token, secret, 3000)).toEqual({ ok: false, reason: 'expired' });
    expect(verifyJwt('a.b', secret, 1500)).toEqual({ ok: false, reason: 'malformed' });
    expect(verifyJwt(undefined, secret, 1500)).toEqual({ ok: false, reason: 'malformed' });
  });

  it('hashes tokens deterministically', () => {
    expect(hashToken('abc')).toBe(hashToken('abc'));
    expect(hashToken('abc')).not.toBe(hashToken('abd'));
    expect(hashToken('abc')).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('auth store', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = new Database(':memory:');
    migrateAuth(db);
  });

  it('creates users and finds them by email/id, then updates the plan', () => {
    const user = createUser(db, { email: 'a@b.com', passwordHash: hashPassword('pw12345678'), plan: 'free' });
    expect(findUserByEmail(db, 'a@b.com')?.id).toBe(user.id);
    expect(findUserById(db, user.id)?.email).toBe('a@b.com');
    updateUserPlan(db, user.id, 'pro');
    expect(findUserById(db, user.id)?.plan).toBe('pro');
  });

  it('rejects a duplicate email', () => {
    createUser(db, { email: 'dup@b.com', passwordHash: 'x' });
    expect(() => createUser(db, { email: 'dup@b.com', passwordHash: 'y' })).toThrow();
  });

  it('creates, looks up, and revokes sessions', () => {
    const user = createUser(db, { email: 's@b.com', passwordHash: 'x' });
    const session = createSession(db, {
      id: 'jti-1',
      userId: user.id,
      tokenHash: hashToken('token-1'),
      expiresAt: Date.now() + 60_000,
    });
    expect(findSessionByTokenHash(db, hashToken('token-1'))?.id).toBe(session.id);
    revokeSession(db, session.id);
    expect(findSessionByTokenHash(db, hashToken('token-1'))?.revoked_at).not.toBeNull();
  });

  it('creates API keys, lists them, and authenticates by hash', () => {
    const user = createUser(db, { email: 'k@b.com', passwordHash: 'x', plan: 'pro' });
    const raw = 'scx_live_testkey';
    const created = createApiKey(db, { userId: user.id, name: 'CI', prefix: 'scx_live_tes', keyHash: hashToken(raw) });
    expect(listApiKeys(db, user.id)).toHaveLength(1);
    expect(authenticateApiKey(db, raw)?.id).toBe(user.id);
    revokeApiKey(db, created.id, user.id);
    expect(listApiKeys(db, user.id)).toHaveLength(0);
    expect(authenticateApiKey(db, raw)).toBeNull();
  });

  it('scopes API access to paid plans', () => {
    expect(gatingForPlan('free').apiAccess).toBe(false);
    expect(gatingForPlan('pro').apiAccess).toBe(true);
    expect(gatingForPlan('studios').apiAccess).toBe(true);
  });
});
