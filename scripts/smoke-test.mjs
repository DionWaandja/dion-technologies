/* eslint-disable no-console */
/**
 * End-to-end smoke test (local, self-contained):
 *   1. Boots a throwaway in-process PostgreSQL (PGlite WASM, wire protocol)
 *   2. Runs prisma migrate + seed against it
 *   3. Starts the production Next.js server
 *   4. Exercises signup → verify → login → contact → dashboard → admin → paywall
 *   5. Tears everything down
 *
 * Run:  node scripts/smoke-test.mjs
 */
import { spawn, execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const PG_PORT = Number(process.env.SMOKE_PG_PORT) || 54329
const APP_PORT = Number(process.env.SMOKE_APP_PORT) || 3000
const BASE = `http://localhost:${APP_PORT}`
const N = process.execPath // node binary

let passed = 0
let failed = 0
function check(name, cond, extra = '') {
  if (cond) {
    passed++
    console.log(`  ✓ ${name}`)
  } else {
    failed++
    console.log(`  ✗ ${name} ${extra}`)
  }
}

async function waitFor(fn, timeoutMs = 60_000, label = 'condition') {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      if (await fn()) return true
    } catch {}
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error(`timeout waiting for ${label}`)
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function main() {
  // ── 1. Embedded Postgres (PGlite WASM over the wire protocol) ──────
  // Runs as a SEPARATE process: execSync below blocks this process's event
  // loop, which would deadlock an in-process socket server.
  console.log('\n▶ starting embedded PostgreSQL (PGlite WASM)…')
  if (!existsSync('scripts/pglite-server.mjs')) throw new Error('scripts/pglite-server.mjs missing')
  const pgProc = spawn(N, ['scripts/pglite-server.mjs', String(PG_PORT)], { stdio: ['ignore', 'pipe', 'pipe'] })
  const pgLog = []
  pgProc.stdout.on('data', (d) => pgLog.push(d))
  pgProc.stderr.on('data', (d) => pgLog.push(d))
  await waitFor(() => Buffer.concat(pgLog).toString().includes(`PGREADY on ${PG_PORT}`), 60_000, 'PGlite readiness')
  console.log(`  ✓ postgres wire server on :${PG_PORT}`)

  // pgbouncer=true: Prisma skips named prepared statements, which collide on
  // PGlite's single multiplexed backend ("prepared statement s0 already exists").
  const DATABASE_URL = `postgresql://postgres:postgres@127.0.0.1:${PG_PORT}/postgres?sslmode=disable&connection_limit=5&pgbouncer=true`

  // ── 2. Sync schema + seed (db push: no shadow DB needed) ────────────
  console.log('\n▶ syncing Prisma schema (db push)…')
  execSync(`${N} node_modules/prisma/build/index.js db push --skip-generate`, {
    env: { ...process.env, DATABASE_URL },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  console.log('  ✓ schema synced')

  console.log('\n▶ seeding admin + demo data…')
  execSync(`${N} node_modules/tsx/dist/cli.mjs prisma/seed.ts`, {
    env: { ...process.env, DATABASE_URL },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  console.log('  ✓ seed complete (admin@dion.local / ChangeMe-2026!)')

  // ── 3. Production server ────────────────────────────────────────────
  console.log('\n▶ starting Next.js production server…')
  const server = spawn(N, ['node_modules/next/dist/bin/next', 'start', '-p', String(APP_PORT)], {
    env: { ...process.env, DATABASE_URL, NODE_ENV: 'production' },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  const logChunks = []
  server.stdout.on('data', (d) => logChunks.push(d))
  server.stderr.on('data', (d) => logChunks.push(d))
  const serverLog = () => Buffer.concat(logChunks).toString()

  await waitFor(async () => {
    const res = await fetch(BASE)
    return res.ok
  }, 60_000, 'server readiness')
  console.log(`  ✓ server up on :${APP_PORT}`)

  try {
    await runTests({ serverLog })
  } catch (e) {
    console.error('\n✗ test crashed:', e.message)
    console.error('\n════ last 60 lines of server log ════')
    console.error(serverLog().split('\n').slice(-60).join('\n'))
    process.exitCode = 1
  } finally {
    server.kill()
    pgProc.kill()
    await sleep(800)
    console.log('\n▶ server + postgres stopped')
  }
  if (process.exitCode === 1) return

  console.log(`\n════════════════════════════════════`)
  console.log(`  ${passed} passed, ${failed} failed`)
  console.log(`════════════════════════════════════\n`)
  process.exit(failed > 0 ? 1 : 0)
}

async function runTests({ serverLog }) {
  // ── Public marketing pages ──────────────────────────────────────────
  console.log('\n■ public site')
  for (const path of ['/', '/services', '/process', '/past-work', '/pricing', '/contact']) {
    const res = await fetch(BASE + path)
    check(`GET ${path} → 200`, res.status === 200)
  }
  const home = await (await fetch(BASE + '/')).text()
  check('home renders company name', home.includes('Dion Technologies'))
  check('home renders hero CTA', home.includes('Start your project'))

  // Security headers
  const homeRes = await fetch(BASE + '/')
  check('CSP header present', homeRes.headers.get('content-security-policy')?.includes('nonce-'))
  check('X-Frame-Options DENY', homeRes.headers.get('x-frame-options') === 'DENY')
  check('X-Content-Type-Options nosniff', homeRes.headers.get('x-content-type-options') === 'nosniff')
  check('HSTS present', homeRes.headers.get('strict-transport-security')?.includes('max-age'))
  check('Referrer-Policy set', homeRes.headers.get('referrer-policy') === 'strict-origin-when-cross-origin')

  // ── Guards (unauthenticated) ────────────────────────────────────────
  console.log('\n■ route guards (unauthenticated)')
  const dash = await fetch(BASE + '/dashboard', { redirect: 'manual' })
  check('/dashboard redirects to login', dash.status === 307 && dash.headers.get('location')?.includes('/login'))
  const admin = await fetch(BASE + '/admin', { redirect: 'manual' })
  check('/admin redirects to login', admin.status === 307 && admin.headers.get('location')?.includes('/login'))
  check('GET /api/premium/data → 401', (await fetch(BASE + '/api/premium/data')).status === 401)
  check('GET /api/admin/messages → 401', (await fetch(BASE + '/api/admin/messages')).status === 401)
  check('GET /api/billing/checkout → 401', (await fetch(BASE + '/api/billing/checkout', { method: 'POST' })).status === 401)
  check('webhook without config → 503', (await fetch(BASE + '/api/stripe/webhook', { method: 'POST', body: 'x' })).status === 503)

  // ── CSRF origin check ───────────────────────────────────────────────
  const csrfRes = await fetch(BASE + '/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'https://evil.example' },
    body: JSON.stringify({ name: 'X', email: 'x@x.com', description: 'x'.repeat(40), budgetRange: '$25,000+' }),
  })
  check('cross-origin POST → 403', csrfRes.status === 403)

  // ── Signup + email verification ─────────────────────────────────────
  console.log('\n■ signup & verification')
  const signupRes = await fetch(BASE + '/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test Client', email: 'client@test.local', password: 'Sup3r-Secret!' }),
  })
  const signupJson = await signupRes.json()
  check('signup accepted', signupRes.status === 200 && signupJson.ok === true)

  const weak = await fetch(BASE + '/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'T', email: 'weak@test.local', password: 'short' }),
  })
  check('weak password rejected (400)', weak.status === 400)

  await waitFor(() => serverLog().includes('verify-email?token='), 15_000, 'dev mail with verification link')
  const verifyToken = serverLog().match(/verify-email\?token=([a-f0-9]{64})/)?.[1]
  check('verification link printed to console (dev mail)', Boolean(verifyToken))

  const badVerify = await fetch(BASE + '/api/auth/verify-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: 'f'.repeat(64) }),
  })
  check('invalid verification token → 400', badVerify.status === 400)

  // Login blocked before verification
  const preVerifyLogin = await credentialsLogin('client@test.local', 'Sup3r-Secret!')
  check('login blocked before email verification', preVerifyLogin.sessionCookie === null)

  const verifyRes = await fetch(BASE + '/api/auth/verify-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: verifyToken }),
  })
  check('email verified', verifyRes.status === 200)

  // ── Client session ──────────────────────────────────────────────────
  console.log('\n■ client session')
  const clientLogin = await credentialsLogin('client@test.local', 'Sup3r-Secret!')
  check('login after verification works', Boolean(clientLogin.sessionCookie))
  const clientCookie = clientLogin.sessionCookie

  const dashAuthed = await fetch(BASE + '/dashboard', { headers: { Cookie: clientCookie }, redirect: 'manual' })
  check('GET /dashboard (authed) → 200', dashAuthed.status === 200)

  // RBAC: client must never reach admin
  const clientAdmin = await fetch(BASE + '/admin', { headers: { Cookie: clientCookie }, redirect: 'manual' })
  check('client → /admin redirected to /dashboard', clientAdmin.status === 307 && clientAdmin.headers.get('location')?.includes('/dashboard'))
  const clientAdminApi = await fetch(BASE + '/api/admin/messages', { headers: { Cookie: clientCookie } })
  check('client → admin API 403', clientAdminApi.status === 403)

  // Contact form (authed → linked to user)
  const contactRes = await fetch(BASE + '/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: clientCookie },
    body: JSON.stringify({
      name: 'Test Client',
      email: 'client@test.local',
      company: 'TestCo',
      description: 'I need a five-page marketing website with a booking form for my bakery business.',
      budgetRange: '$5,000 – $10,000',
    }),
  })
  check('contact submission stored (200)', contactRes.status === 200)

  const badContact = await fetch(BASE + '/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: clientCookie },
    body: JSON.stringify({ name: '', email: 'nope', description: 'short', budgetRange: 'Bogus' }),
  })
  check('invalid contact → 400 with field errors', badContact.status === 400)

  // Subscription status (unpaid)
  const subRes = await fetch(BASE + '/api/subscription', { headers: { Cookie: clientCookie } })
  const subJson = await subRes.json()
  check('subscription status endpoint works', subRes.status === 200 && subJson.subscriptionStatus === 'NONE' && subJson.stripeConfigured === false)

  // Paywall
  const premiumPage = await fetch(BASE + '/premium', { headers: { Cookie: clientCookie } })
  const premiumHtml = await premiumPage.text()
  check('premium page gated (no resources leaked)', premiumPage.status === 200 && premiumHtml.includes('for subscribers') && !premiumHtml.includes('Launch Readiness'))
  const premiumApi = await fetch(BASE + '/api/premium/data', { headers: { Cookie: clientCookie } })
  check('premium API 403 without subscription', premiumApi.status === 403)

  // Billing graceful mode
  const checkoutRes = await fetch(BASE + '/api/billing/checkout', { method: 'POST', headers: { Cookie: clientCookie } })
  check('checkout → clear not-configured message', checkoutRes.status === 400)

  // ── Password reset flow ─────────────────────────────────────────────
  console.log('\n■ password reset')
  const forgotRes = await fetch(BASE + '/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'client@test.local' }),
  })
  const forgotJson = await forgotRes.json()
  check('forgot-password enumeration-safe response', forgotRes.status === 200 && forgotJson.ok)

  const forgotUnknown = await fetch(BASE + '/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'ghost@nowhere.test' }),
  })
  const forgotUnknownJson = await forgotUnknown.json()
  check('unknown email gets identical response', forgotUnknownJson.message === forgotJson.message)

  await waitFor(() => serverLog().includes('reset-password?token='), 15_000, 'reset link')
  const resetToken = serverLog().match(/reset-password\?token=([a-f0-9]{64})/)?.[1]
  check('reset link printed to console (dev mail)', Boolean(resetToken))

  const resetRes = await fetch(BASE + '/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: resetToken, password: 'N3w-Password-9!' }),
  })
  check('password reset succeeds', resetRes.status === 200)

  const oldPw = await credentialsLogin('client@test.local', 'Sup3r-Secret!')
  check('old password rejected after reset', oldPw.sessionCookie === null)
  const newPw = await credentialsLogin('client@test.local', 'N3w-Password-9!')
  check('new password works', Boolean(newPw.sessionCookie))
  const staleCookie = await fetch(BASE + '/dashboard', { headers: { Cookie: clientCookie }, redirect: 'manual' })
  check('pre-reset session invalidated (sessionVersion)', staleCookie.status === 307)

  // ── Admin ───────────────────────────────────────────────────────────
  console.log('\n■ admin')
  const adminLogin = await credentialsLogin('admin@dion.local', 'ChangeMe-2026!')
  check('admin login works', Boolean(adminLogin.sessionCookie))
  const adminCookie = adminLogin.sessionCookie

  const adminPage = await fetch(BASE + '/admin', { headers: { Cookie: adminCookie }, redirect: 'manual' })
  check('GET /admin (admin) → 200', adminPage.status === 200)

  const inboxRes = await fetch(BASE + '/api/admin/messages', { headers: { Cookie: adminCookie } })
  const inboxJson = await inboxRes.json()
  check('inbox lists seeded + submitted messages', inboxRes.status === 200 && inboxJson.total >= 4)
  check('inbox status counts present', inboxJson.counts && typeof inboxJson.counts.NEW === 'number')

  const searchRes = await fetch(BASE + '/api/admin/messages?q=bakery', { headers: { Cookie: adminCookie } })
  const searchJson = await searchRes.json()
  check('inbox search matches submitted request', searchRes.status === 200 && searchJson.items.length === 1)

  const target = inboxJson.items.find((m) => m.status === 'NEW')
  const patchRes = await fetch(`${BASE}/api/admin/messages/${target.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    body: JSON.stringify({ status: 'HANDLED', notes: 'Called back; proposal sent.' }),
  })
  check('message marked handled with notes', patchRes.status === 200)

  const filterRes = await fetch(BASE + '/api/admin/messages?status=HANDLED', { headers: { Cookie: adminCookie } })
  const filterJson = await filterRes.json()
  check('status filter works', filterJson.items.every((m) => m.status === 'HANDLED') && filterJson.items.length >= 1)

  const subsRes = await fetch(BASE + '/api/admin/subscriptions', { headers: { Cookie: adminCookie } })
  const subsJson = await subsRes.json()
  check('subscriptions endpoint (graceful mode)', subsRes.status === 200 && subsJson.configured === false)

  const connectRes = await fetch(BASE + '/api/admin/connect', { headers: { Cookie: adminCookie } })
  const connectJson = await connectRes.json()
  check('connect status endpoint (graceful mode)', connectRes.status === 200 && connectJson.connected === false)

  const auditPage = await fetch(BASE + '/admin/audit-log', { headers: { Cookie: adminCookie } })
  const auditHtml = await auditPage.text()
  check('audit log page renders entries', auditPage.status === 200 && auditHtml.includes('admin.message_updated'))

  // ── Rate limiting (last: poisons the IP bucket) ─────────────────────
  console.log('\n■ rate limiting')
  let saw429 = false
  for (let i = 0; i < 70; i++) {
    const res = await fetch(BASE + '/api/auth/session')
    if (res.status === 429) {
      saw429 = true
      break
    }
  }
  check('auth endpoints rate-limited under burst (429)', saw429)
}

/** Credentials login against Auth.js; returns the session cookie or null. */
async function credentialsLogin(email, password) {
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`)
  const csrfToken = (await csrfRes.json()).csrfToken
  const csrfCookies = csrfRes.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ')

  const res = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Cookie: csrfCookies,
      Origin: BASE,
    },
    body: new URLSearchParams({ email, password, csrfToken, callbackUrl: BASE, json: 'true' }),
    redirect: 'manual',
  })
  if (process.env.DEBUG_AUTH) {
    console.log(`    [debug] login ${email}: status=${res.status}`)
    console.log(`    [debug] set-cookies:`, res.headers.getSetCookie())
    const body = await res.clone().text()
    console.log(`    [debug] body:`, body.slice(0, 300))
  }
  const sessionCookie = res.headers
    .getSetCookie()
    .find((c) => c.startsWith('authjs.session-token'))
  return { status: res.status, sessionCookie: sessionCookie ? sessionCookie.split(';')[0] : null }
}

main().catch((e) => {
  console.error('smoke test crashed:', e)
  process.exit(1)
})
