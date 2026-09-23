# Dion Technologies — Company Site & Client Platform

Full-stack web application for **Dion Technologies**, a web development company:
marketing site, client accounts, contact/project-request inbox, Stripe subscriptions
with a paywall, and an admin dashboard with Connect Express payouts and an audit log.

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 15 (App Router, React 19) + Tailwind CSS |
| Backend | Next.js API routes (Node runtime) |
| Database | PostgreSQL via Prisma ORM |
| Auth | Auth.js (NextAuth v5) — email/password, bcrypt (cost 12) |
| Payments | Stripe — Checkout, Customer Portal, Connect Express |
| Email | SMTP via Nodemailer (console fallback in dev) |

## Project structure

```
prisma/                  schema, migrations, seed
src/app/(marketing)/     home, services, process, past-work, contact, pricing
src/app/(auth)/          login, signup, verify-email, forgot/reset password
src/app/dashboard/       client area (requests, subscription, billing portal)
src/app/premium/         paywalled content (server-side gate)
src/app/admin/           RBAC area: inbox, subscriptions/MRR, payouts, audit log
src/app/api/             auth, contact, billing, stripe webhook, admin APIs
src/components/          UI components (incl. admin/)
src/lib/                 db, auth, session, security, stripe, tokens, mail…
src/middleware.ts        security headers, CSP nonce, CSRF origin check,
                         rate limits, route guards
```

## Quick start

```bash
# 1. Dependencies (Node 20+)
npm install

# 2. Environment
cp .env.example .env    # then edit — see table below

# 3. Database (PostgreSQL must be running)
npx prisma migrate dev --name init
npm run db:seed         # creates the first admin + demo inbox data

# 4. Run
npm run dev             # http://localhost:3000
```

### Default admin (development seed)

| Email | Password |
|---|---|
| `admin@dion.local` | `ChangeMe-2026!` |

Override via `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` before seeding in production.

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `AUTH_SECRET` | ✅ | Auth.js session signing secret (`openssl rand -base64 32`) |
| `APP_URL` | ✅ | Public base URL, used in emails and Stripe redirects |
| `AUTH_TRUST_HOST` | dev | Set `true` on localhost or behind a proxy |
| `SMTP_HOST/PORT/USER/PASSWORD/FROM` | optional | Leave empty in dev — emails print to the server console |
| `STRIPE_SECRET_KEY` | optional | Leave empty → billing disabled with clear UI messages |
| `STRIPE_WEBHOOK_SECRET` | with Stripe | Verifies every webhook signature |
| `STRIPE_PRICE_ID` | with Stripe | Recurring price for the premium subscription |
| `STRIPE_CONNECT_ACCOUNT_ID` | optional | Preset Express account (else created on first onboarding) |
| `STRIPE_CONNECT_COUNTRY` | optional | Express account country, default `US` |

`.env` is gitignored. Only `.env.example` is committed.

## Stripe setup

1. **Keys** — put your test-mode `STRIPE_SECRET_KEY` in `.env`.
2. **Product & price** — create a recurring price (e.g. $49/month) in the Stripe
   dashboard and set `STRIPE_PRICE_ID`.
3. **Webhook** — `stripe listen --forward-to localhost:3000/api/stripe/webhook`
   (or add an endpoint in the dashboard for `checkout.session.completed`,
   `customer.subscription.created|updated|deleted`, `invoice.payment_failed`)
   and set `STRIPE_WEBHOOK_SECRET`. Every event is signature-verified before use;
   subscription state is synced into Postgres so the paywall never calls Stripe
   per page load.
4. **Customer Portal** — enable the portal in Stripe settings (At least one test
   price must exist); users manage payment methods/cancellation there.
5. **Connect Express (admin payouts)** — visit `/admin/payouts` → "Set up payouts".
   The Express account ID is stored locally; **bank details live only in Stripe**.

## Email verification & password reset

- SMTP unset → links are printed to the dev console (`DEV_MAIL` log lines).
- SMTP set → real emails; verification links expire after 24h, reset links
  after 60 minutes, and all tokens are single-use (SHA-256 hashes stored, raw
  tokens only exist in the email).

## Branding

The header/nav uses a blue gradient text wordmark ("Dion Technologies") defined
in `src/components/Logo.tsx` — no image assets required. To use a custom logo
file instead, replace that component with an `<Image>` pointing at a file in
`public/`.

## Security model

- **Passwords**: bcrypt cost 12; never logged (logger redacts credential fields).
- **Sessions**: Auth.js JWT in an httpOnly, SameSite=Lax cookie; `secure` in
  production. `sessionVersion` invalidates all sessions on password reset.
- **CSRF**: middleware rejects state-changing API calls whose Origin does not
  match the site; cookies are SameSite=Lax.
- **Rate limiting**: login (per-IP + per-account), signup, password reset,
  contact, and Stripe actions; plus a coarse per-IP limit across `/api/auth/*`.
  In-memory per instance — swap in Redis (e.g. Upstash) for multi-instance deploys.
- **Validation**: every request body parsed with zod schemas server-side.
- **RBAC**: `/admin` + `/api/admin/*` blocked by role in middleware (JWT) and
  re-checked against the DB in `guardAdmin()`; clients cannot reach admin routes
  even by guessing URLs.
- **Paywall**: `hasActiveSubscription()` checked server-side on every premium
  page render and API call; status comes from webhook-synced DB state.
- **SQL**: Prisma parameterized queries only — no string-concatenated SQL.
- **Headers**: CSP with per-request nonce + `strict-dynamic`, HSTS,
  `X-Frame-Options: DENY`, `X-Content-Type-Options`, Referrer-Policy,
  Permissions-Policy, COOP — applied in middleware to every matched response.
- **Secrets**: only in environment variables; `.env` gitignored; no keys in code.
- **Audit log**: admin actions, auth events, premium access, message changes —
  with actor, IP, target, and timestamp.

## Deployment (Vercel)

### Pre-launch checklist

- [ ] `npm run build` passes locally (production bundle compiles)
- [ ] `npm run test:smoke` — 54/54 end-to-end checks green
- [ ] Initialize git and push to GitHub (repo is not initialized yet):
      `git init && git add -A && git commit -m "Initial release"`
- [ ] Provision PostgreSQL (Vercel Postgres, Neon, Supabase…) → note the
      connection string for `DATABASE_URL`
- [ ] Generate secrets: `AUTH_SECRET` (`openssl rand -base64 32`), a real
      `SEED_ADMIN_PASSWORD`
- [ ] Stripe: create the product/price → `STRIPE_PRICE_ID`; webhook endpoint
      `https://your-domain/api/stripe/webhook` (events: checkout.session
      completed, customer.subscription.*) → `STRIPE_WEBHOOK_SECRET`
- [ ] SMTP credentials for transactional email (or leave empty to start and
      read links from logs — not recommended in production)

### Deploy steps

1. Push to GitHub and import the repo in Vercel.
2. Add all environment variables from `.env.example` (Production + Preview).
3. Run `npx prisma migrate deploy` against the production database — the
   initial migration ships in `prisma/migrations/` — then seed the admin:
   `SEED_ADMIN_EMAIL=... SEED_ADMIN_PASSWORD=... npm run db:seed`.
4. Point the Stripe webhook at `https://your-domain/api/stripe/webhook` and set
   `STRIPE_WEBHOOK_SECRET`.
5. Set `APP_URL` to the production URL; HTTPS is automatic on Vercel.
6. Immediately log in as the admin and change the seeded password.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` / `start` | Production build / serve |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:migrate` | Create/apply a dev migration |
| `npm run db:deploy` | Apply migrations (CI/prod) |
| `npm run db:seed` | Seed first admin + demo data |
| `npm run db:studio` | Prisma Studio DB browser |
| `npm run test:smoke` | Full end-to-end test: boots an in-memory PostgreSQL (PGlite WASM), pushes the schema, seeds, starts the production server, and exercises every flow (54 checks). Use `SMOKE_PG_PORT` / `SMOKE_APP_PORT` to avoid clashing with a running instance |
