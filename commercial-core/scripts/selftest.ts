// Live wiring test: mint on the license server, activate, then verify the
// token OFFLINE with the server's published public key through the verifier.
//
// Env: LICENSE_SERVER_URL (default the deployed server), LICENSE_ADMIN_TOKEN.
// Run: node commercial-core/scripts/selftest.ts

import assert from 'node:assert/strict';

import {
  DEFAULT_LICENSE_SERVER_URL,
  entitlementForPlan,
  fetchLicensingPublicKey,
  parseLicenseKey,
  resolvePremiumAccess,
  verifyActivationToken,
} from '../src/verifier.ts';

const base = (process.env.LICENSE_SERVER_URL ?? DEFAULT_LICENSE_SERVER_URL).replace(/\/+$/, '');
const admin = (process.env.LICENSE_ADMIN_TOKEN ?? '').trim();

let passed = 0;
function ok(label: string, cond: boolean): void {
  assert.ok(cond, label);
  passed += 1;
  console.log(`  ok  ${label}`);
}

const health = await fetch(`${base}/health`);
ok('server /health 200', health.status === 200);

const publicKeyPem = await fetchLicensingPublicKey(base);
ok('fetched /pubkey PEM', publicKeyPem.includes('BEGIN PUBLIC KEY'));

// offline key checks (no server)
ok('parseLicenseKey accepts a well-formed key', parseLicenseKey('SPLT-PRO-HP2RG-KRXWH-TGK1S-X275').valid);
ok('parseLicenseKey rejects a bad checksum', !parseLicenseKey('SPLT-PRO-AAAAA-AAAAA-AAAAA-AAAA').valid);

// no token -> free
ok('no token is not premium', entitlementForPlan('free').premiumPlugins === false);

// full flow via the live server
if (admin) {
  const mintRes = await fetch(`${base}/licenses`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${admin}` },
    body: JSON.stringify({ prefix: 'SPLT', domain: 'splatstudio.app', tier: 'pro', seats: 3 }),
  });
  ok('mint /licenses 201', mintRes.status === 201);
  const issued = (await mintRes.json()) as { key: string };

  const actRes = await fetch(`${base}/activate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ key: issued.key, workspace: 'ws-verifier' }),
  });
  ok('activate 200', actRes.status === 200);
  const { token } = (await actRes.json()) as { token: string };

  const verified = verifyActivationToken(token, publicKeyPem, { expectedDomain: 'splatstudio.app' });
  ok('token verifies offline', verified.ok === true);
  if (verified.ok) {
    ok('payload domain + plan', verified.payload.domain === 'splatstudio.app' && verified.payload.plan === 'pro');
  }
  ok('tampered token rejected', verifyActivationToken(`${token}x`, publicKeyPem).ok === false);
  ok('wrong-domain rejected', resolvePremiumAccess(token, publicKeyPem, { expectedDomain: 'other.app' }).reason === 'domain_mismatch');
  ok('premium resolved from token', resolvePremiumAccess(token, publicKeyPem).premium === true);
} else {
  console.log('  --  LICENSE_ADMIN_TOKEN not set; skipped mint/activate');
}

console.log(`\nVERIFIER SELFTEST PASS (${passed} checks) against ${base}`);
