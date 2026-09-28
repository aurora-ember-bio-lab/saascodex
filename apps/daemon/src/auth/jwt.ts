// Minimal HS256 JWT for hosted sessions — node:crypto only, no dependency.
//
// Claims: sub (user id), plan, jti (session id), iat, exp.

import { createHmac, timingSafeEqual } from 'node:crypto';

export interface SessionClaims {
  sub: string;
  plan: string;
  jti: string;
  iat: number;
  exp: number;
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url');
}

function sign(input: string, secret: string): string {
  return createHmac('sha256', secret).update(input).digest('base64url');
}

export function signJwt(claims: SessionClaims, secret: string): string {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = b64url(JSON.stringify(claims));
  const body = `${header}.${payload}`;
  return `${body}.${sign(body, secret)}`;
}

export type JwtVerification =
  | { ok: true; claims: SessionClaims }
  | { ok: false; reason: 'malformed' | 'bad_signature' | 'expired' };

export function verifyJwt(
  token: string | null | undefined,
  secret: string,
  nowSec: number = Math.floor(Date.now() / 1000),
): JwtVerification {
  if (typeof token !== 'string') return { ok: false, reason: 'malformed' };
  const parts = token.split('.');
  if (parts.length !== 3) return { ok: false, reason: 'malformed' };
  const [header, payload, signature] = parts as [string, string, string];
  const expected = Buffer.from(sign(`${header}.${payload}`, secret), 'utf8');
  const actual = Buffer.from(signature, 'utf8');
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return { ok: false, reason: 'bad_signature' };
  }
  let claims: SessionClaims;
  try {
    claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as SessionClaims;
  } catch {
    return { ok: false, reason: 'malformed' };
  }
  if (
    typeof claims.sub !== 'string' ||
    typeof claims.jti !== 'string' ||
    typeof claims.exp !== 'number'
  ) {
    return { ok: false, reason: 'malformed' };
  }
  if (claims.exp <= nowSec) return { ok: false, reason: 'expired' };
  return { ok: true, claims };
}

/** Hash a token for at-rest storage (sessions.token_hash). */
export function hashToken(token: string): string {
  return createHmac('sha256', 'saascodex-session').update(token).digest('hex');
}
