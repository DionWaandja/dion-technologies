import { getToken } from 'next-auth/jwt'
import { buildCsp, applySecurityHeaders } from '@/lib/security-headers'
import { rateLimit, clientIp } from '@/lib/rate-limit'
import { verifySameOrigin } from '@/lib/csrf'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Edge middleware — runs before every matched request:
 *  1. Security headers incl. a per-request CSP nonce passed to React
 *  2. Origin (CSRF) check on every state-changing API call
 *  3. Coarse per-IP rate limit across the auth surface
 *  4. Route guards: /admin requires the ADMIN role, /dashboard & /premium
 *     require a session — checked against the signed session JWT
 *
 * Implementation note: this middleware deliberately does NOT use the NextAuth
 * `auth()` wrapper. Wrapping breaks NextAuth's own CSRF handling on
 * /api/auth/* routes; `getToken` verifies the same JWT without interfering.
 * JWT claims are a fast first line of defense — every server route re-checks
 * role/subscription against the database via src/lib/session.ts.
 */

const ADMIN_PREFIXES = ['/admin', '/api/admin']
const PROTECTED_PAGES = ['/dashboard', '/premium']
const PROTECTED_APIS = ['/api/admin', '/api/billing', '/api/premium', '/api/subscription']
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

/** Decode + verify the Auth.js session JWT from the request's cookie. */
async function getSession(req: NextRequest) {
  const secret = process.env.AUTH_SECRET
  if (!secret) return null

  // The cookie is __Secure-prefixed on HTTPS deployments.
  const salt = req.cookies.has('__Secure-authjs.session-token')
    ? '__Secure-authjs.session-token'
    : 'authjs.session-token'
  if (!req.cookies.has(salt)) return null

  try {
    return await getToken({ req, secret, salt })
  } catch {
    return null
  }
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const nonce = crypto.randomUUID()
  const csp = buildCsp(nonce)

  // Attach headers (incl. CSP) to every possible response we return below.
  const finish = (res: NextResponse): NextResponse => {
    applySecurityHeaders(res, csp)
    return res
  }

  // 1) CSRF: state-changing API requests must originate from this site.
  if (pathname.startsWith('/api/') && !SAFE_METHODS.has(req.method)) {
    if (!verifySameOrigin(req)) {
      return finish(NextResponse.json({ error: 'Invalid origin' }, { status: 403 }))
    }
  }

  // 2) Coarse per-IP rate limit across the auth surface (fine-grained limits
  //    live in each route handler / the credentials authorize() callback).
  //    /api/auth passes through WITHOUT header rewriting — NextAuth reads the
  //    raw Cookie header for its own CSRF check.
  if (pathname.startsWith('/api/auth/')) {
    const rl = rateLimit(`mw-auth:${clientIp(req)}`, { limit: 60, windowSeconds: 300 })
    if (!rl.allowed) {
      return finish(
        NextResponse.json(
          { error: 'Too many requests' },
          { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } },
        ),
      )
    }
    return finish(NextResponse.next())
  }

  const isApi = pathname.startsWith('/api/')
  const token = await getSession(req)
  const role = token?.role

  // 3) Admin area — must hold the ADMIN role even if the URL is guessed.
  if (ADMIN_PREFIXES.some((p) => pathname.startsWith(p))) {
    if (!token) {
      if (isApi) {
        return finish(NextResponse.json({ error: 'Authentication required' }, { status: 401 }))
      }
      return finish(
        NextResponse.redirect(
          new URL(`/login?callbackUrl=${encodeURIComponent(pathname)}`, req.url),
        ),
      )
    }
    if (role !== 'ADMIN') {
      if (isApi) {
        return finish(NextResponse.json({ error: 'Forbidden' }, { status: 403 }))
      }
      return finish(NextResponse.redirect(new URL('/dashboard', req.url)))
    }
  }

  // 4) Protected client pages & APIs.
  const needsAuth =
    PROTECTED_PAGES.some((p) => pathname.startsWith(p)) ||
    PROTECTED_APIS.some((p) => pathname.startsWith(p))
  if (needsAuth && !token) {
    if (isApi) {
      return finish(NextResponse.json({ error: 'Authentication required' }, { status: 401 }))
    }
    return finish(
      NextResponse.redirect(
        new URL(`/login?callbackUrl=${encodeURIComponent(pathname)}`, req.url),
      ),
    )
  }

  // 5) Signed-in users skip the login/signup pages.
  if (token && (pathname === '/login' || pathname === '/signup')) {
    const dest = role === 'ADMIN' ? '/admin' : '/dashboard'
    return finish(NextResponse.redirect(new URL(dest, req.url)))
  }

  // 6) Continue with security headers; forward the nonce AND the CSP itself to
  //    the server render. Next.js reads the nonce from the request CSP header
  //    and stamps its framework scripts with it — required for 'strict-dynamic'
  //    to allow the bootstrap chain (see the Next.js CSP guide).
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('Content-Security-Policy', csp)
  const res = NextResponse.next({ request: { headers: requestHeaders } })
  return finish(res)
}

export const config = {
  // Skip static assets and public files. /api/auth stays matched for rate
  // limiting, but passes through untouched (see above).
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|svg|webp|ico|txt|xml)$).*)',
  ],
}
