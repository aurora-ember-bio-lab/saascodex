#!/usr/bin/env node
/**
 * License-key generator for the Aurora Ember ecosystem domains.
 *
 * Format:  <PREFIX>-<TAG>-XXXXX-XXXXX-XXXXX-XXXX
 *   PREFIX  4-char domain id (e.g. SPLT)
 *   TAG     3-char tier id   (STR/PRO/STU/USG)
 *   body    19 Crockford base32 chars = 18 random + 1 checksum
 *
 * Crockford base32 alphabet excludes I, L, O, U (no look-alikes). The
 * checksum is a position-weighted mod-32 over the 18 random chars, so a
 * mistyped key fails parse before any server round-trip.
 *
 * TEST KEYS ONLY — the licensing service owns issuance; these are not stored
 * server-side. See docs/LICENSING or commercial-core/LICENSING.md.
 *
 * Run: pnpm exec tsx commercial-core/scripts/gen-license-keys.ts [--json]
 */
import { randomInt } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const BODY_RANDOM = 18;

interface DomainEntry {
  domain: string;
  prefix: string;
  tiers: string[];
}
interface DomainsFile {
  tiers: Record<string, string>;
  domains: DomainEntry[];
}

function checksumChar(chars: string): string {
  let sum = 0;
  for (let i = 0; i < chars.length; i += 1) {
    sum += ALPHABET.indexOf(chars[i]!) * (i + 1);
  }
  return ALPHABET[sum % ALPHABET.length]!;
}

export function generateKey(prefix: string, tag: string): string {
  let body = '';
  for (let i = 0; i < BODY_RANDOM; i += 1) body += ALPHABET[randomInt(0, ALPHABET.length)]!;
  const full = body + checksumChar(body);
  const groups = [full.slice(0, 5), full.slice(5, 10), full.slice(10, 15), full.slice(15, 19)];
  return `${prefix}-${tag}-${groups.join('-')}`;
}

export function verifyKey(key: string): boolean {
  const parts = key.split('-');
  if (parts.length !== 6) return false;
  const [prefix, tag, ...groups] = parts as [string, string, string, string, string, string];
  if (prefix.length !== 4 || tag.length !== 3) return false;
  const body = groups.join('');
  if (body.length !== BODY_RANDOM + 1) return false;
  if ([...body].some((c) => !ALPHABET.includes(c))) return false;
  return checksumChar(body.slice(0, BODY_RANDOM)) === body[BODY_RANDOM];
}

const here = path.dirname(fileURLToPath(import.meta.url));
const file = JSON.parse(readFileSync(path.resolve(here, '../domains.json'), 'utf8')) as DomainsFile;
const asJson = process.argv.includes('--json');

const rows: Array<{ domain: string; prefix: string; tier: string; key: string }> = [];
for (const d of file.domains) {
  for (const tier of d.tiers) {
    const tag = file.tiers[tier];
    if (!tag) continue;
    rows.push({ domain: d.domain, prefix: d.prefix, tier, key: generateKey(d.prefix, tag) });
  }
}

if (asJson) {
  console.log(JSON.stringify(rows, null, 2));
} else {
  console.log('Domain                 | Prefix | Tier    | Test Key');
  console.log('-----------------------|--------|---------|-------------------------------------------');
  for (const r of rows) {
    console.log(`${r.domain.padEnd(22)} | ${r.prefix}  | ${r.tier.padEnd(7)} | ${r.key}`);
  }
  console.log(`\n${rows.length} keys across ${file.domains.length} domains`);
}
