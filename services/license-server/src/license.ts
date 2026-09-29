// Pure license logic: prefix-tag keys, Ed25519 signed activation tokens.
//
// Key format (matches commercial-core/domains.json):
//   <PREFIX>-<TAG>-XXXXX-XXXXX-XXXXX-XXXX   (Crockford base32, I L O U excluded)
// Token format:
//   SCX1.<base64url(payload-json)>.<base64url(ed25519 signature)>

import {
  generateKeyPairSync,
  randomInt,
  sign as cryptoSign,
  verify as cryptoVerify,
  createPrivateKey,
  createPublicKey,
  type KeyObject,
} from 'node:crypto';

export const KEY_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const BODY_RANDOM = 18;

const TIERS: Record<string, string> = { starter: 'STR', pro: 'PRO', studio: 'STU', usage: 'USG' };

export function tagForTier(tier: string): string | null {
  return TIERS[tier.toLowerCase()] ?? null;
}

function checksumChar(chars: string): string {
  let sum = 0;
  for (let i = 0; i < chars.length; i += 1) sum += KEY_ALPHABET.indexOf(chars[i]!) * (i + 1);
  return KEY_ALPHABET[sum % KEY_ALPHABET.length]!;
}

export function generateKey(prefix: string, tier: string): string {
  const tag = tagForTier(tier);
  if (!tag) throw new Error(`unknown tier: ${tier}`);
  let body = '';
  for (let i = 0; i < BODY_RANDOM; i += 1) body += KEY_ALPHABET[randomInt(0, KEY_ALPHABET.length)]!;
  const full = body + checksumChar(body);
  return `${prefix.toUpperCase()}-${tag}-${full.slice(0, 5)}-${full.slice(5, 10)}-${full.slice(10, 15)}-${full.slice(15, 19)}`;
}

export interface ParsedKey {
  prefix: string;
  tag: string;
  valid: boolean;
}

export function parseKey(key: string): ParsedKey {
  const parts = key.trim().toUpperCase().split('-');
  if (parts.length !== 6) return { prefix: '', tag: '', valid: false };
  const [prefix, tag, ...groups] = parts as [string, string, string, string, string, string];
  const body = groups.join('');
  const shapeOk = prefix.length === 4 && tag.length === 3 && body.length === BODY_RANDOM + 1;
  const charsetOk = [...body].every((c) => KEY_ALPHABET.includes(c));
  const checksumOk = shapeOk && charsetOk && checksumChar(body.slice(0, BODY_RANDOM)) === body[BODY_RANDOM];
  return { prefix, tag, valid: shapeOk && charsetOk && checksumOk };
}

export interface LicensePayload {
  licenseId: string;
  domain: string;
  plan: string;
  workspace: string;
  seats: number;
  issuedAt: number;
  expiresAt: number;
}

export function b64url(buf: Buffer | string): string {
  return Buffer.from(buf).toString('base64url');
}

export function signToken(payload: LicensePayload, privateKey: KeyObject): string {
  const body = b64url(JSON.stringify(payload));
  const signature = cryptoSign(null, Buffer.from(body, 'utf8'), privateKey);
  return `SCX1.${body}.${b64url(signature)}`;
}

export type TokenVerification =
  | { ok: true; payload: LicensePayload }
  | { ok: false; reason: 'malformed' | 'bad_signature' | 'expired' };

export function verifyToken(
  token: string,
  publicKey: KeyObject,
  nowSec = Math.floor(Date.now() / 1000),
): TokenVerification {
  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== 'SCX1') return { ok: false, reason: 'malformed' };
  const [, body, sig] = parts as [string, string, string];
  const signature = Buffer.from(sig, 'base64url');
  if (!cryptoVerify(null, Buffer.from(body, 'utf8'), publicKey, signature)) {
    return { ok: false, reason: 'bad_signature' };
  }
  let payload: LicensePayload;
  try {
    payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as LicensePayload;
  } catch {
    return { ok: false, reason: 'malformed' };
  }
  if (typeof payload.expiresAt !== 'number' || payload.expiresAt <= nowSec) {
    return { ok: false, reason: 'expired' };
  }
  return { ok: true, payload };
}

export function generateSigningKeyPair(): { privateKeyPem: string; publicKeyPem: string } {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  return {
    privateKeyPem: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
    publicKeyPem: publicKey.export({ type: 'spki', format: 'pem' }).toString(),
  };
}

export function loadPrivateKey(pem: string): KeyObject {
  return createPrivateKey(pem);
}
export function loadPublicKey(pem: string): KeyObject {
  return createPublicKey(pem);
}
