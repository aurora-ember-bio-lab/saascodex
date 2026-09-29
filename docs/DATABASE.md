# Database (PostgreSQL + pgvector + Atlas)

SplatStudio has two data layers:

- **Local daemon** — SQLite, per-installation, no setup. This is the local-first
  workspace and needs nothing from this document.
- **Hosted control plane** — **PostgreSQL 16 with pgvector**, used by the
  deployed web app and daemon on Railway/Vercel for accounts, sessions, API
  keys, subscriptions, hosted project metadata, and semantic search.

The hosted schema is versioned with [Atlas](https://github.com/ariga/atlas)
("schema as code") in [`db/migrations/`](../db/migrations/).

## Schema

| Table | Purpose |
|---|---|
| `users` | Accounts (email, optional password hash, Stripe customer, plan) |
| `sessions` | JWT login state (hashed token, expiry, revocation) |
| `api_keys` | Paid-tier programmatic keys (`prefix` + hashed key) |
| `subscriptions` | Stripe subscription mirror (plan, status, period end) |
| `projects` | Hosted metadata mirror of daemon projects |
| `skill_embeddings` | pgvector index (`vector(1536)`) over skills / templates / design systems / docs |

Extensions installed by the migration: `vector` (pgvector) and `pgcrypto`.
The embedding dimension is pinned to **1536** (`text-embedding-3-small` /
`ada-002`); the similarity index is HNSW with cosine distance.

## Local setup

```bash
# 1. Start pgvector (and the rest of the stack)
docker compose -f deploy/docker-compose.yml up -d postgres

# 2. Apply migrations
pnpm db:migrate           # docker compose run --rm migrate

# 3. (optional) open psql
docker compose -f deploy/docker-compose.yml exec postgres psql -U postgres -d splatstudio
```

Default connection string:
`postgres://postgres:postgres@localhost:5432/splatstudio?sslmode=disable`

## Migrations with Atlas

The migration directory is `db/migrations/` and `db/migrations/atlas.sum`
pins the checksum of every file. After editing or adding SQL:

```bash
pnpm db:hash               # atlas migrate hash --dir file://migrations
pnpm db:lint               # atlas migrate lint (needs a dev database)
pnpm db:migrate            # atlas migrate apply against the compose postgres
```

To apply against any database (e.g. Railway), pass the URL:

```bash
docker run --rm -v "$PWD/db:/work" -w /work arigaio/atlas:latest \
  migrate apply --dir file://migrations --url "$DATABASE_URL"
```

The config lives in [`db/atlas.hcl`](../db/atlas.hcl) (`local` and
`production` environments both read the `database_url` variable).

### Adding a migration

1. Add a new `<timestamp>_<name>.sql` file under `db/migrations/` (never edit an
   applied migration).
2. `pnpm db:hash` to refresh `atlas.sum`.
3. `pnpm db:lint` to check it against the dev database.
4. Apply with `pnpm db:migrate` (or the CI/CD step below).

## Railway / production

1. Add the **Postgres** plugin to the Railway project; it provides
   `DATABASE_URL`.
2. Point migrations at it — either run the `migrate` service once, or add a
   release/deploy step:
   ```bash
   atlas migrate apply --dir file://migrations --url "$DATABASE_URL"
   ```
3. Set `DATABASE_URL` on the web and daemon services.

`pgvector` is available on Railway's Postgres; the migration enables the
extension itself, so no manual provisioning step is needed.

## Environment variables

| Variable | Used by | Meaning |
|---|---|---|
| `DATABASE_URL` | web, daemon, migrate | Postgres connection string |
| `STRIPE_SECRET_KEY`, `STRIPE_PRICE_PRO_EUR`, `STRIPE_PRICE_STUDIOS_EUR`, `STRIPE_WEBHOOK_SECRET` | daemon | Stripe billing (see [`BILLING.md`](./BILLING.md)) |

## Compose services

| Service | Role |
|---|---|
| `postgres` | `pgvector/pgvector:pg16` with a persistent volume |
| `atlas` | Atlas CLI with `db/` mounted (profile `tools`, ad-hoc commands) |
| `migrate` | One-shot `atlas migrate apply` runner (depends on healthy postgres) |
