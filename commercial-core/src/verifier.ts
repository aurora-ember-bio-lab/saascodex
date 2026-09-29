// SplatStudio-side license verification.
//
// Premium plugins activate from the Aurora Ember license server: a user pastes
// a `PREFIX-TAG-…` key, POSTs it to `/activate`, and receives an
// `SCX1.<payload>.<sig>` token. This module verifies that token OFFLINE with
// the server's published public key (`GET /pubkey`) — no round-trip at use.
//
// See services/license-server, docs/PLUGIN-ECOSYSTEM.md, commercial-core/LICENSING.md.

import { createPublicKey, verify, type KeyObject } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

export const DEFAULT_LICENSE_SERVER_URL = 'https://license-server-production-784b.up.railway.app';

const KEY_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const BODY_RANDOM = 18;

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

/** Validate the human key format + checksum (no server needed). */
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

/** Fetch the server's Ed25519 public key (cache it in production). */
export async function fetchLicensingPublicKey(
  baseUrl: string = DEFAULT_LICENSE_SERVER_URL,
  fetchImpl: typeof fetch = fetch,
): Promise<string> {
  const res = await fetchImpl(`${baseUrl.replace(/\/+$/, '')}/pubkey`);
  if (!res.ok) throw new Error(`license server /pubkey failed: ${res.status}`);
  const body = (await res.json()) as { publicKeyPem?: string };
  if (!body.publicKeyPem) throw new Error('license server /pubkey returned no publicKeyPem');
  return body.publicKeyPem;
}

/** Verify an `SCX1` token offline against the public key. */
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

interface Entitlements {
  plans: Record<string, { premiumPlugins: boolean; seats: number }>;
}

/** Read the plan -> premium access map (commercial-core/entitlements.json). */
export function entitlementForPlan(plan: string): { premiumPlugins: boolean; seats: number } {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const file = JSON.parse(readFileSync(path.resolve(here, '../entitlements.json'), 'utf8')) as Entitlements;
  return file.plans[plan] ?? file.plans.free ?? { premiumPlugins: false, seats: 1 };
}

/** One call: verify a token and resolve premium-plugin access. */
export function resolvePremiumAccess(
  token: string,
  publicKeyPem: string,
  options: { nowSec?: number; expectedDomain?: string } = {},
): { premium: boolean; plan: string; reason?: string } {
  const result = verifyActivationToken(token, publicKeyPem, options);
  if (!result.ok) return { premium: false, plan: 'free', reason: result.reason };
  return { premium: entitlementForPlan(result.payload.plan).premiumPlugins, plan: result.payload.plan };
}
