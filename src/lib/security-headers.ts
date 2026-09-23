import type { NextResponse } from 'next/server'

/**
 * Security headers shared by middleware. The CSP uses a per-request nonce
 * (set by middleware on the `x-nonce` request header so React picks it up
 * for its bootstrap scripts) plus strict-dynamic.
 */
export function buildCsp(nonce: string): string {
  const dev = process.env.NODE_ENV !== 'production'
  const scriptSrc = `'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ''}`

  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(dev ? [] : ['upgrade-insecure-requests']),
  ].join('; ')
}

export function applySecurityHeaders(res: NextResponse, csp: string): void {
  res.headers.set('Content-Security-Policy', csp)
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(self "https://js.stripe.com")',
  )
  res.headers.set('Cross-Origin-Opener-Policy', 'same-origin')
  // Enforced by browsers on HTTPS deployments; harmless over http on localhost.
  res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
}
