// Premium-plugin license verification for the daemon.
//
// Mirrors commercial-core/src/verifier.ts (the canonical, product-agnostic
// module) so the daemon has no cross-package runtime coupling. Verify an
// `SCX1` activation token OFFLINE with the license server's published public
// key (`GET /pubkey`) and resolve whether the plan grants premium access.

import { createPublicKey, verify, type KeyObject } from 'node:crypto';

export const DEFAULT_LICENSE_SERVER_URL = 'https://license-server-production-784b.up.railway.app';

export interface ActivationPayload {
  licenseId: string;
  domain: string;
  plan: string;
  workspace: string;
  seats: number;
  issuedAt: number;
  expiresAt: number;
}

export type VerifyResult =
  | { ok: true; payload: ActivationPayload }
  | { ok: false; reason: 'malformed' | 'bad_signature' | 'expired' | 'domain_mismatch' };

const KEY_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const BODY_RANDOM = 18;

// Plan -> premium access. Mirrors commercial-core/entitlements.json.
const PREMIUM_PLANS = new Set(['pro', 'studios', 'studio']);

export function planGrantsPremium(plan: string): boolean {
  return PREMIUM_PLANS.has(plan.toLowerCase());
}

function checksumChar(chars: string): string {
  let sum = 0;
  for (let i = 0; i < chars.length; i += 1) sum += KEY_ALPHABET.indexOf(chars[i]!) * (i + 1);
  return KEY_ALPHABET[sum % KEY_ALPHABET.length]!;
}

export interface ParsedLicenseKey {
  prefix: string;
  tag: string;
  valid: boolean;
}

export function parseLicenseKey(key: string): ParsedLicenseKey {
  const parts = key.trim().toUpperCase().split('-');
  if (parts.length !== 6) return { prefix: '', tag: '', valid: false };
  const [prefix, tag, ...groups] = parts as [string, string, string, string, string, string];
  const body = groups.join('');
  const shapeOk = prefix.length === 4 && tag.length === 3 && body.length === BODY_RANDOM + 1;
  const charsetOk = [...body].every((c) => KEY_ALPHABET.includes(c));
  const checksumOk = shapeOk && charsetOk && checksumChar(body.slice(0, BODY_RANDOM)) === body[BODY_RANDOM];
  return { prefix, tag, valid: shapeOk && charsetOk && checksumOk };
}

export function licenseServerUrl(env: NodeJS.ProcessEnv = process.env): string {
  return (env.LICENSE_SERVER_URL?.trim() || DEFAULT_LICENSE_SERVER_URL).replace(/\/+$/, '');
}

export async function fetchLicensingPublicKey(
  baseUrl: string,
  fetchImpl: typeof fetch = fetch,
): Promise<string> {
  const res = await fetchImpl(`${baseUrl.replace(/\/+$/, '')}/pubkey`);
  if (!res.ok) throw new Error(`license server /pubkey failed: ${res.status}`);
  const body = (await res.json()) as { publicKeyPem?: string };
  if (!body.publicKeyPem) throw new Error('license server /pubkey returned no publicKeyPem');
  return body.publicKeyPem;
}

export async function activateLicenseKey(
  baseUrl: string,
  key: string,
  workspace: string,
  fetchImpl: typeof fetch = fetch,
): Promise<{ token: string; plan: string; domain: string } | { error: string }> {
  const res = await fetchImpl(`${baseUrl.replace(/\/+$/, '')}/activate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ key, workspace }),
  });
  if (!res.ok) return { error: `activate failed: ${res.status}` };
  const body = (await res.json()) as { token?: string; license?: { plan?: string; domain?: string } };
  if (!body.token) return { error: 'activate returned no token' };
  return { token: body.token, plan: body.license?.plan ?? '', domain: body.license?.domain ?? '' };
}

export function verifyActivationToken(
  token: string,
  publicKeyPem: string,
  options: { nowSec?: number; expectedDomain?: string } = {},
): VerifyResult {
  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== 'SCX1') return { ok: false, reason: 'malformed' };
  const [, body, sig] = parts as [string, string, string];
  let publicKey: KeyObject;
  try {
    publicKey = createPublicKey(publicKeyPem);
  } catch {
    return { ok: false, reason: 'malformed' };
  }
  let signatureOk: boolean;
  try {
    signatureOk = verify(null, Buffer.from(body, 'utf8'), publicKey, Buffer.from(sig, 'base64url'));
  } catch {
    return { ok: false, reason: 'bad_signature' };
  }
  if (!signatureOk) return { ok: false, reason: 'bad_signature' };
  let payload: ActivationPayload;
  try {
    payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as ActivationPayload;
  } catch {
    return { ok: false, reason: 'malformed' };
  }
  const now = options.nowSec ?? Math.floor(Date.now() / 1000);
  if (typeof payload.expiresAt !== 'number' || payload.expiresAt <= now) {
    return { ok: false, reason: 'expired' };
  }
  if (options.expectedDomain && payload.domain !== options.expectedDomain) {
    return { ok: false, reason: 'domain_mismatch' };
  }
  return { ok: true, payload };
}
