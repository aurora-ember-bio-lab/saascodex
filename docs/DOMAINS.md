# Domains

Decision record for SaaSCodex hostnames.

## Recommendation

**Keep one apex: `saascodex.com`. Put everything on subdomains.**

Do **not** make `ascodex.com` a second product apex. It is shorter but drops
"SaaS" and "Code" — the two words that say what the product is — and a second
apex splits SEO, brand recall, cookies, email, and TLS/DNS config for zero gain.
If you want the short form, register `ascodex.com` **only** as a 301 redirect to
`saascodex.com` (brand defense), never as a product.

| Hostname | Serves | Notes |
|---|---|---|
| `saascodex.com` | Marketing site (`marketing/`) | landing, pricing, register — cookie-free |
| `app.saascodex.com` | The app + API | web export **and** daemon `/api` on the same origin |
| `docs.saascodex.com` | Documentation (`docs/`) | optional; can be a Vercel/Pages deploy |
| `ide.saascodex.com` | In-browser editor surface | **only when a real IDE ships** — see below |
| `status.saascodex.com` | Uptime/status | optional |
| `cdn.saascodex.com` | Static assets | optional; only if you outgrow Vercel's CDN |

### `ide.ascodex.com` → don't

Two problems: wrong apex (`ascodex.com`) and a subdomain with no product behind
it. An empty `ide.*` reads as abandoned. If the "IDE" is the app's editor, it
belongs at `app.saascodex.com` (same origin, shared session). If it becomes a
separate product, host it at `ide.saascodex.com` **when it ships**, and only
then.

### Subdomain ideas: `app` / `ai` / `des`

| Idea | Verdict | Use |
|---|---|---|
| `app.saascodex.com` | **Yes** | The app + `/api` (one origin, shared session) |
| `ai.saascodex.com` | **Later** | Only if the hosted model gateway ("SaaSCodex Cloud" / agent API) runs as its own service. Until then it duplicates the app; keep model routing under `app.saascodex.com/api`. |
| `des.…` | **No** | Cryptic — nothing tells a reader whether it means *design* or *desktop*. Use the two real ones below instead of one ambiguous one. |
| `desktop.saascodex.com` | **Maybe** | A downloads page for the Tauri/Electron installers, 302→ GitHub Releases. Only when installers ship. |
| `design.saascodex.com` | **No** | The whole product *is* design; a `design.` host suggests a separate lesser product. |

Rules of thumb:

- One subdomain per **distinct service**, never per feature. Features live under
  `app.saascodex.com` paths.
- No cryptic three-letter hosts (`des`, `adm`, `web`). A hostname should say
  what it is.
- Don't create a hostname before the thing exists — an empty `ai.` or `desktop.`
  reads as abandoned.
- Alias, don't duplicate: a "download" host should 302 to GitHub Releases
  rather than mirror bytes.

Casual form for talking to users: "open the app at **app.saascodex.com**" and
"**saascodex.com** for plans" — keep `des`/`ai` out of marketing copy.

### Same-origin API

Serve the API from `app.saascodex.com/api` (the daemon already serves the web
export and the API from one process). That keeps cookies same-origin and removes
the Vercel→Railway proxy hop. Split hosts (`api.saascodex.com`) only if the web
moves fully to Vercel independently — then `app.saascodex.com` rewrites
`/api/*` to `api.saascodex.com` (see [DEPLOYMENT.md](./DEPLOYMENT.md)).

## Why not a second apex

- **Brand**: `saascodex.com` matches the product name everywhere it already
  appears (`package.json`, i18n `app.brand`, docs, Stripe metadata).
- **Cost of change**: the repo just completed a `open-design.ai → saascodex.com`
  sweep (707 files). A second apex would re-open that surface.
- **Ops**: one apex = one set of DNS records, one certificate wildcard, one
  email domain, one cookie scope.

## Wiring checklist

- [ ] `saascodex.com` → marketing site (Vercel project from `marketing/`)
- [ ] `app.saascodex.com` → daemon (Railway custom domain) serving app + `/api`
- [ ] `OD_PUBLIC_BASE_URL=https://app.saascodex.com`
- [ ] Stripe: webhook `https://app.saascodex.com/api/billing/webhook`; Checkout
      `success_url`/`cancel_url` on the same host (already built from
      `OD_PUBLIC_BASE_URL`)
- [ ] `SAASCODEX_ALLOWED_ORIGINS=https://saascodex.com,https://app.saascodex.com`
- [ ] `ascodex.com` (if bought) → 301 to `https://saascodex.com`
- [ ] Cookies: set the session cookie on `.saascodex.com` so `app.` and `docs.`
      share it; keep the marketing apex cookie-free
- [ ] Email: `hello@`, `support@`, `security@saascodex.com`

## If you change the app host later

The repo builds app URLs from `OD_PUBLIC_BASE_URL` (Stripe redirects) and the
marketing site from `API_BASE`/`APP_URL` constants in `marketing/register.html`.
Changing hosts is those two values plus the checklist above — no code sweep
needed, because the domain sweep already made `saascodex.com` the single brand
domain.
