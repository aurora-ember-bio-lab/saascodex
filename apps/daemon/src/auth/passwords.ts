// Password hashing for hosted accounts.
//
// scrypt from node:crypto — no external dependency. Stored format:
//   scrypt$<N>$<r>$<p>$<saltB64url>$<hashB64url>
// Verification is timing-safe.

import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const N = 16384;
const R = 8;
const P = 1;
const KEYLEN = 32;
const SALT_BYTES = 16;

export function hashPassword(password: string): string {
  const salt = randomBytes(SALT_BYTES);
  const hash = scryptSync(password, salt, KEYLEN, { N, r: R, p: P });
  return `scrypt$${N}$${R}$${P}$${salt.toString('base64url')}$${hash.toString('base64url')}`;
}

export function verifyPassword(password: string, stored: string | null | undefined): boolean {
  if (!stored) return false;
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const n = Number.parseInt(parts[1]!, 10);
  const r = Number.parseInt(parts[2]!, 10);
  const p = Number.parseInt(parts[3]!, 10);
  if (!Number.isFinite(n) || !Number.isFinite(r) || !Number.isFinite(p)) return false;
  // scrypt requires N a power of two > 1, and r/p >= 1; a malformed stored
  // hash must fail closed, never throw.
  if (n < 2 || (n & (n - 1)) !== 0 || r < 1 || p < 1) return false;
  let salt: Buffer;
  let expected: Buffer;
  try {
    salt = Buffer.from(parts[4]!, 'base64url');
    expected = Buffer.from(parts[5]!, 'base64url');
  } catch {
    return false;
  }
  if (expected.length === 0) return false;
  let actual: Buffer;
  try {
    actual = scryptSync(password, salt, expected.length, { N: n, r, p });
  } catch {
    return false;
  }
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

/** Minimum viable password policy shared by the API and the marketing site. */
export const PASSWORD_MIN_LENGTH = 8;

export function isPasswordAcceptable(password: unknown): password is string {
  return typeof password === 'string' && password.length >= PASSWORD_MIN_LENGTH;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email: unknown): string | null {
  if (typeof email !== 'string') return null;
  const trimmed = email.trim().toLowerCase();
  return EMAIL_RE.test(trimmed) && trimmed.length <= 254 ? trimmed : null;
}
