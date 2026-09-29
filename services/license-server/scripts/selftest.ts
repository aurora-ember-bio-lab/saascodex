// Self-test: mint a license, activate it, verify the signed token, and prove
// tampered/revoked/expired tokens fail. Runs entirely offline.
//
// Run: node scripts/selftest.ts

import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { generateKey, parseKey, signToken, verifyToken } from '../src/license.ts';
import { createStore } from '../src/store.ts';

const dir = mkdtempSync(path.join(tmpdir(), 'license-selftest-'));
let passed = 0;
function ok(label: string, cond: boolean): void {
  assert.ok(cond, label);
  passed += 1;
  console.log(`  ok  ${label}`);
}

try {
  const store = createStore(dir, {});

  // key format + checksum
  const key = generateKey('SPLT', 'pro');
  const parsed = parseKey(key);
  ok('key shape PREFIX-TAG-...', /^SPLT-PRO-[0-9A-Z]{5}-[0-9A-Z]{5}-[0-9A-Z]{5}-[0-9A-Z]{4}$/.test(key));
  ok('key parses + checksum valid', parsed.valid && parsed.prefix === 'SPLT' && parsed.tag === 'PRO');
  ok('tampered key fails', !parseKey(key.slice(0, -1) + (key.endsWith('Z') ? 'Y' : 'Z')).valid);

  // mint + activate via the store
  const row = store.insert({ key, prefix: 'SPLT', domain: 'splatstudio.app', tier: 'pro', tag: 'PRO', seats: 3, workspace: null, email: 'owner@splatstudio.app' });
  const activated = store.activate(key, 'ws-1');
  ok('activation resolves the license', activated?.id === row.id);
  ok('unknown key does not activate', store.activate('SPLT-PRO-AAAAA-AAAAA-AAAAA-AAAA', 'ws-1') === undefined);

  // signed token round-trip
  const nowSec = Math.floor(Date.now() / 1000);
  const token = signToken(
    { licenseId: row.id, domain: row.domain, plan: row.tier, workspace: 'ws-1', seats: row.seats, issuedAt: nowSec, expiresAt: nowSec + 3600 },
    store.privateKey(),
  );
  const { loadPublicKey } = await import('../src/license.ts');
  const pub = loadPublicKey(store.publicKeyPem());
  ok('token verifies', verifyToken(token, pub).ok === true);
  ok('tampered token fails', verifyToken(`${token}x`, pub).ok === false);

  // expiry
  const expired = signToken(
    { licenseId: row.id, domain: row.domain, plan: row.tier, workspace: 'ws-1', seats: 1, issuedAt: nowSec - 7200, expiresAt: nowSec - 10 },
    store.privateKey(),
  );
  assert.deepEqual(verifyToken(expired, pub), { ok: false, reason: 'expired' });
  passed += 1;
  console.log('  ok  expired token rejected');

  // revocation
  store.revoke(row.id);
  ok('revoked license does not activate', store.activate(key, 'ws-1') === undefined);
  ok('revocation list contains the id', store.revocations().includes(row.id));

  console.log(`\nSELFTEST PASS (${passed} checks)`);
} finally {
  rmSync(dir, { recursive: true, force: true });
}
