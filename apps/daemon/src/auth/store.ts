// SQLite persistence for hosted accounts, sessions, and API keys.
//
// The local daemon keeps its own SQLite store; these `auth_*` tables back
// registration, login, JWT sessions, and programmatic keys for self-host and
// single-service hosted deployments. The Postgres control-plane schema in
// `db/migrations/` is the multi-tenant target (docs/DATABASE.md); this store
// mirrors its shape so the API surface is the same.
//
// Timestamps are epoch milliseconds (INTEGER).

import { randomUUID } from 'node:crypto';
import type Database from 'better-sqlite3';

type SqliteDb = Database.Database;

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  password_hash: string | null;
  plan: string;
  created_at: number;
  updated_at: number;
}

export interface AuthSession {
  id: string;
  user_id: string;
  token_hash: string;
  user_agent: string | null;
  issued_at: number;
  expires_at: number;
  revoked_at: number | null;
}

export interface AuthApiKey {
  id: string;
  user_id: string;
  name: string;
  prefix: string;
  key_hash: string;
  last_used_at: number | null;
  revoked_at: number | null;
  created_at: number;
}

export function migrateAuth(db: SqliteDb): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS auth_users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT,
      password_hash TEXT,
      plan TEXT NOT NULL DEFAULT 'free',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS auth_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      user_agent TEXT,
      issued_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      revoked_at INTEGER
    );
    CREATE INDEX IF NOT EXISTS auth_sessions_user_id_idx ON auth_sessions (user_id);
    CREATE TABLE IF NOT EXISTS auth_api_keys (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      prefix TEXT NOT NULL,
      key_hash TEXT NOT NULL UNIQUE,
      last_used_at INTEGER,
      revoked_at INTEGER,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS auth_api_keys_user_id_idx ON auth_api_keys (user_id);
  `);
}

export function createUser(
  db: SqliteDb,
  input: { email: string; name?: string | null; passwordHash: string; plan?: string; now?: number },
): AuthUser {
  const now = input.now ?? Date.now();
  const row: AuthUser = {
    id: randomUUID(),
    email: input.email,
    name: input.name ?? null,
    password_hash: input.passwordHash,
    plan: input.plan ?? 'free',
    created_at: now,
    updated_at: now,
  };
  db.prepare(
    `INSERT INTO auth_users (id, email, name, password_hash, plan, created_at, updated_at)
     VALUES (@id, @email, @name, @password_hash, @plan, @created_at, @updated_at)`,
  ).run(row);
  return row;
}

export function findUserByEmail(db: SqliteDb, email: string): AuthUser | undefined {
  return db.prepare(`SELECT * FROM auth_users WHERE email = ?`).get(email) as AuthUser | undefined;
}

export function findUserById(db: SqliteDb, id: string): AuthUser | undefined {
  return db.prepare(`SELECT * FROM auth_users WHERE id = ?`).get(id) as AuthUser | undefined;
}

export function updateUserPlan(db: SqliteDb, id: string, plan: string, now = Date.now()): void {
  db.prepare(`UPDATE auth_users SET plan = ?, updated_at = ? WHERE id = ?`).run(plan, now, id);
}

export function createSession(
  db: SqliteDb,
  input: {
    userId: string;
    tokenHash: string;
    expiresAt: number;
    userAgent?: string | null;
    now?: number;
    /** Session id (= JWT `jti`). Generated when omitted. */
    id?: string;
  },
): AuthSession {
  const now = input.now ?? Date.now();
  const row: AuthSession = {
    id: input.id ?? randomUUID(),
    user_id: input.userId,
    token_hash: input.tokenHash,
    user_agent: input.userAgent ?? null,
    issued_at: now,
    expires_at: input.expiresAt,
    revoked_at: null,
  };
  db.prepare(
    `INSERT INTO auth_sessions (id, user_id, token_hash, user_agent, issued_at, expires_at, revoked_at)
     VALUES (@id, @user_id, @token_hash, @user_agent, @issued_at, @expires_at, @revoked_at)`,
  ).run(row);
  return row;
}

export function findSessionByTokenHash(db: SqliteDb, tokenHash: string): AuthSession | undefined {
  return db.prepare(`SELECT * FROM auth_sessions WHERE token_hash = ?`).get(tokenHash) as
    | AuthSession
    | undefined;
}

export function revokeSession(db: SqliteDb, sessionId: string, now = Date.now()): void {
  db.prepare(`UPDATE auth_sessions SET revoked_at = ? WHERE id = ? AND revoked_at IS NULL`).run(
    now,
    sessionId,
  );
}

export function createApiKey(
  db: SqliteDb,
  input: { userId: string; name: string; prefix: string; keyHash: string; now?: number },
): AuthApiKey {
  const row: AuthApiKey = {
    id: randomUUID(),
    user_id: input.userId,
    name: input.name,
    prefix: input.prefix,
    key_hash: input.keyHash,
    last_used_at: null,
    revoked_at: null,
    created_at: input.now ?? Date.now(),
  };
  db.prepare(
    `INSERT INTO auth_api_keys (id, user_id, name, prefix, key_hash, last_used_at, revoked_at, created_at)
     VALUES (@id, @user_id, @name, @prefix, @key_hash, @last_used_at, @revoked_at, @created_at)`,
  ).run(row);
  return row;
}

export function listApiKeys(db: SqliteDb, userId: string): AuthApiKey[] {
  return db
    .prepare(`SELECT * FROM auth_api_keys WHERE user_id = ? AND revoked_at IS NULL ORDER BY created_at DESC`)
    .all(userId) as AuthApiKey[];
}

export function revokeApiKey(db: SqliteDb, id: string, userId: string, now = Date.now()): void {
  db.prepare(
    `UPDATE auth_api_keys SET revoked_at = ? WHERE id = ? AND user_id = ? AND revoked_at IS NULL`,
  ).run(now, id, userId);
}

export function findApiKeyByHash(db: SqliteDb, keyHash: string): AuthApiKey | undefined {
  return db.prepare(`SELECT * FROM auth_api_keys WHERE key_hash = ?`).get(keyHash) as
    | AuthApiKey
    | undefined;
}
