# Aurora Ember license server

One license server for the whole Aurora Ember ecosystem: it mints
`PREFIX-TAG-XXXXX-XXXXX-XXXXX-XXXX` keys for every domain and returns
Ed25519-signed activation tokens (`SCX1.<payload>.<sig>`) that each product
verifies **offline** with the published public key.

Zero dependencies — `node:http` + `node:crypto` + a JSON store, run via Node's
TypeScript type-stripping (Node ≥ 22.6, or Node 24 default).

## Run locally

```bash
cd services/license-server
LICENSE_ADMIN_TOKEN=dev-admin LICENSE_DATA_DIR=./data LICENSE_PORT=8787 node src/server.ts
node scripts/selftest.ts     # 10 offline checks
```

## Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/health` | — | Liveness |
| `GET` | `/pubkey` | — | Ed25519 public key (PEM) for offline verification |
| `POST` | `/activate` | — | `{ key, workspace? }` → `{ token, license }` |
| `GET` | `/revocations` | — | Revoked license ids |
| `POST` | `/licenses` | admin | `{ prefix, domain, tier, seats?, email? }` → `{ id, key, … }` |
| `GET` | `/licenses` | admin | List licenses |
| `POST` | `/revoke` | admin | `{ licenseId }` |

Admin auth is `Authorization: Bearer <LICENSE_ADMIN_TOKEN>`.

## Env

| Var | Meaning |
|---|---|
| `PORT` / `LICENSE_PORT` | Listen port (Railway injects `PORT`) |
| `LICENSE_ADMIN_TOKEN` | Bearer for admin endpoints (required to mint) |
| `LICENSE_DATA_DIR` | Where `licenses.json` + the keypair live (mount a volume) |
| `LICENSE_PRIVATE_KEY` / `LICENSE_PUBLIC_KEY` | Optional fixed Ed25519 keypair (PEM) |
| `TOKEN_TTL_SECONDS` | Activation token lifetime (default 30 days) |

> The signing keypair is generated on first boot and stored in
> `LICENSE_DATA_DIR/ed25519-keypair.json`. **Mount a persistent volume** or set
> `LICENSE_PRIVATE_KEY`, otherwise a redeploy re-keys and every previously
> issued token stops verifying.

## Verify a token (any product)

```js
import { createPublicKey, verify } from 'node:crypto';
const pub = createPublicKey(await (await fetch(`${BASE}/pubkey`)).json().then(j => j.publicKeyPem));
const [tag, body, sig] = token.split('.');
const ok = tag === 'SCX1' && verify(null, Buffer.from(body), pub, Buffer.from(sig, 'base64url'));
const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
```

## Deploy (Railway)

The service is deployed in the `splatstudio` project. Because it shares the
repo root build, its start command is pinned with
[`railpack.license.json`](../../railpack.license.json) via the service variable
`RAILPACK_CONFIG_FILE=railpack.license.json`.
