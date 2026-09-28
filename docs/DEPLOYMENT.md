# Deployment (Vercel, Railway, Docker)

SaaSCodex is a monorepo with two runnable apps:

- **web** (`apps/web`) — Next.js app; builds to a static export in
  `apps/web/out`.
- **daemon** (`apps/daemon`) — Express server that serves the HTTP API **and**
  the built web export.

Because the daemon serves both, there are two supported topologies.

| Topology | Web | API + DB | When to use |
|---|---|---|---|
| **A — single service** (recommended first) | served by the daemon | Railway (one service + Postgres) | Simplest; the repo's Docker image is built for this |
| **B — split** | Vercel (static export) | Railway (daemon + Postgres) | Independent web/CDN scaling |

## Environment variables

| Variable | Where | Meaning |
|---|---|---|
| `OD_API_TOKEN` | daemon | Bearer/Basic token required for `/api` (see [AUTH.md](./AUTH.md)) |
| `OD_BIND_HOST` | daemon | Bind address; `0.0.0.0` in containers |
| `OD_PORT` / `--port` | daemon | Listen port (Railway injects `PORT`) |
| `OD_PUBLIC_BASE_URL` | daemon | Public origin for checkout redirects and absolute links |
| `SAASCODEX_ALLOWED_ORIGINS` | daemon | Comma-separated browser origins allowed to call `/api` |
| `SAASCODEX_DISABLE_API_AUTH` | daemon | `1` only behind a trusted, already-authenticated proxy |
| `DATABASE_URL` | daemon, migrate | Postgres + pgvector (see [DATABASE.md](./DATABASE.md)) |
| `JWT_SECRET` | daemon (hosted) | Signing secret for hosted sessions (see [AUTH.md](./AUTH.md)) |
| `STRIPE_*` | daemon | Billing (see [BILLING.md](./BILLING.md)) |

Start from [`deploy/.env.example`](../deploy/.env.example).

## Topology A — Railway (single service)

1. **Create the Postgres service**: `New → Database → PostgreSQL`. Railway
   provides `DATABASE_URL` and the image includes pgvector.
2. **Apply migrations** once (from your machine, against the Railway URL):
   ```bash
   docker run --rm -v "$PWD/db:/work" -w /work arigaio/atlas:latest \
     migrate apply --dir file://migrations --url "$DATABASE_URL"
   ```
   (Or add a one-shot Railway service — see below.)
3. **Create the app service** from this repo. Railway reads
   [`railway.toml`](../railway.toml): it builds `deploy/Dockerfile` and starts
   `node apps/daemon/dist/cli.js --no-open --host 0.0.0.0 --port $PORT`.
4. **Set variables** on the app service: `OD_API_TOKEN`, `JWT_SECRET`,
   `OD_PUBLIC_BASE_URL=https://<your-domain>`, `DATABASE_URL` (reference the
   Postgres service), and the `STRIPE_*` keys you use.
5. **Generate a domain** and open it. The same origin serves the web UI and the
   API.

### Optional: a migration service

Add a second Railway service from the `arigaio/atlas:latest` image with the repo
mounted, start command:

```
atlas migrate apply --dir file://migrations --url $DATABASE_URL
```

Run it manually (or as a deploy gate) after the Postgres service is healthy.

## Topology B — Vercel (web) + Railway (API)

[`vercel.json`](../vercel.json) is already configured for the static export:
`buildCommand` runs `pnpm --filter @saascodex/web build` and the output
directory is `apps/web/out`.

1. Deploy the repo to Vercel (framework preset: **Other**; the `vercel.json`
   governs build/output).
2. Deploy the daemon to Railway as in Topology A.
3. Point the web at the daemon. Add a rewrite to `vercel.json` so `/api/*` on
   the Vercel domain proxies to the daemon:
   ```json
   {
     "rewrites": [
       { "source": "/api/:path*", "destination": "https://<daemon>.up.railway.app/api/:path*" }
     ]
   }
   ```
   Replace `<daemon>` with your Railway domain and redeploy.
4. Set `SAASCODEX_ALLOWED_ORIGINS` on the daemon to your Vercel domain so the
   origin guard accepts browser calls.

> The web defaults to same-origin `/api`. In the split topology the rewrite
> above is what makes that hold; without it the web's API calls 404 on Vercel.

## Docker (self-hosted)

```bash
cp deploy/.env.example deploy/.env
# edit deploy/.env (token, origins, DATABASE_URL, …)
docker compose -f deploy/docker-compose.yml up -d postgres
docker compose -f deploy/docker-compose.yml run --rm migrate   # apply migrations
docker compose -f deploy/docker-compose.yml up -d saascodex
```

The image is also published by this repo's Docker workflow
(`deploy/Dockerfile`). Compose services: `saascodex`, `postgres`, `migrate`,
and `atlas` (profile `tools`).

## Verify a deployment

```bash
curl -fsS https://<your-domain>/api/health          # 200
curl -fsS -H "Authorization: Bearer $OD_API_TOKEN" \
  https://<your-domain>/api/skills | head -c 200    # catalog JSON
```

## Checklist

- [ ] `DATABASE_URL` set and migrations applied
- [ ] `OD_API_TOKEN` set (or auth consciously disabled behind a trusted proxy)
- [ ] `JWT_SECRET` set (hosted sessions)
- [ ] `OD_PUBLIC_BASE_URL` matches the public origin
- [ ] `SAASCODEX_ALLOWED_ORIGINS` includes the web origin (split topology)
- [ ] Stripe keys + webhook endpoint configured ([BILLING.md](./BILLING.md))
- [ ] `/api/health` returns 200 from the public URL
