# Domains

Decision record for SplatStudio hostnames.

## Decision

**SplatStudio runs on one apex: `splatstudio.app`.** Everything else is a
subdomain of it. `ascodex.com` — and `ide./des./ai.ascodex.com` — is a
**separate project** (may be a different project entirely) and stays **out of
scope** for this repo.

| Hostname | Serves | Notes |
|---|---|---|
| `splatstudio.app` | Marketing site (`marketing/`) | landing, pricing, register — cookie-free |
| `app.splatstudio.app` | The app + API | web export **and** daemon `/api` on the same origin |
| `docs.splatstudio.app` | Documentation (`docs/`) | optional; can be a Vercel/Pages deploy |
| `status.splatstudio.app` | Uptime/status | optional |
| `cdn.splatstudio.app` | Static assets | optional; only if you outgrow Vercel's CDN |

### Out of scope: `ascodex.com`

`ascodex.com` and its subdomains — `ide.ascodex.com`, `des.ascodex.com`,
`ai.ascodex.com` — may be a **separate project**, not SplatStudio. They are not
part of this domain plan and must not be linked from the SplatStudio marketing
site or app. Inside SplatStudio the editor lives under `app.splatstudio.app`.

### Subdomain ideas: `app` / `ai` / `des`

| Idea | Verdict | Use |
|---|---|---|
| `app.splatstudio.app` | **Yes** | The app + `/api` (one origin, shared session) |
| `ai.splatstudio.app` | **Later** | Only if the hosted model gateway ("SplatStudio Cloud" / agent API) runs as its own service. Until then it duplicates the app; keep model routing under `app.splatstudio.app/api`. |
| `des.…` | **No** | Cryptic — nothing tells a reader whether it means *design* or *desktop*. Use the two real ones below instead of one ambiguous one. |
| `desktop.splatstudio.app` | **Maybe** | A downloads page for the Tauri/Electron installers, 302→ GitHub Releases. Only when installers ship. |
| `design.splatstudio.app` | **No** | The whole product *is* design; a `design.` host suggests a separate lesser product. |

Rules of thumb:

- One subdomain per **distinct service**, never per feature. Features live under
  `app.splatstudio.app` paths.
- No cryptic three-letter hosts (`des`, `adm`, `web`). A hostname should say
  what it is.
- Don't create a hostname before the thing exists — an empty `ai.` or `desktop.`
  reads as abandoned.
- Alias, don't duplicate: a "download" host should 302 to GitHub Releases
  rather than mirror bytes.

Casual form for talking to users: "open the app at **app.splatstudio.app**" and
"**splatstudio.app** for plans" — keep `des`/`ai` out of marketing copy.

### Same-origin API

Serve the API from `app.splatstudio.app/api` (the daemon already serves the web
export and the API from one process). That keeps cookies same-origin and removes
the Vercel→Railway proxy hop. Split hosts (`api.splatstudio.app`) only if the web
moves fully to Vercel independently — then `app.splatstudio.app` rewrites
`/api/*` to `api.splatstudio.app` (see [DEPLOYMENT.md](./DEPLOYMENT.md)).

## Why one apex

- **Brand**: `splatstudio.app` matches the product name everywhere it already
  appears (`package.json`, i18n `app.brand`, docs, Stripe metadata).
- **Cost of change**: the repo just completed a `open-design.ai → splatstudio.app`
  sweep (707 files); a second apex would re-open that surface.
- **Ops**: one apex = one set of DNS records, one certificate wildcard, one
  email domain, one cookie scope.
- Other Aurora Ember domains (`ascodex.com`, `ide.ascodex.com`) are **different
  projects** — keep their DNS, cookies, and email separate from SplatStudio.

## Wiring checklist

- [ ] `splatstudio.app` → marketing site (Vercel project from `marketing/`)
- [ ] `app.splatstudio.app` → daemon (Railway custom domain) serving app + `/api`
- [ ] `OD_PUBLIC_BASE_URL=https://app.splatstudio.app`
- [ ] Stripe: webhook `https://app.splatstudio.app/api/billing/webhook`; Checkout
      `success_url`/`cancel_url` on the same host (already built from
      `OD_PUBLIC_BASE_URL`)
- [ ] `SPLATSTUDIO_ALLOWED_ORIGINS=https://splatstudio.app,https://app.splatstudio.app`
- [ ] Cookies: set the session cookie on `.splatstudio.app` so `app.` and `docs.`
      share it; keep the marketing apex cookie-free
- [ ] Email: `hello@`, `support@`, `security@splatstudio.app`

## If you change the app host later

The repo builds app URLs from `OD_PUBLIC_BASE_URL` (Stripe redirects) and the
marketing site from `API_BASE`/`APP_URL` constants in `marketing/register.html`.
Changing hosts is those two values plus the checklist above — no code sweep
needed, because the domain sweep already made `splatstudio.app` the single brand
domain.
