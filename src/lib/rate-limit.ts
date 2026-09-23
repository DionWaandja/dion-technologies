/**
 * Fixed-window in-memory rate limiter for auth and public endpoints.
 * Suitable for a single Node process; on Vercel serverless each instance
 * limits independently — add a shared store (e.g. Upstash Redis) if you
 * need a global ceiling.
 */
type Entry = { count: number; resetAt: number }

const buckets = new Map<string, Entry>()
let lastSweep = Date.now()

function sweep() {
  const now = Date.now()
  if (now - lastSweep < 60_000) return
  lastSweep = now
  for (const [key, entry] of buckets) {
    if (entry.resetAt <= now) buckets.delete(key)
  }
}

export type RateLimitResult = { allowed: true } | { allowed: false; retryAfterSeconds: number }

export function rateLimit(
  key: string,
  opts: { limit: number; windowSeconds: number },
): RateLimitResult {
  sweep()
  const now = Date.now()
  const entry = buckets.get(key)

  if (!entry || entry.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + opts.windowSeconds * 1000 })
    return { allowed: true }
  }

  entry.count += 1
  if (entry.count > opts.limit) {
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)) }
  }
  return { allowed: true }
}

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) {
    const first = fwd.split(',')[0]?.trim()
    if (first) return first
  }
  return req.headers.get('x-real-ip')?.trim() || 'unknown'
}

export const LIMITS = {
  login: { limit: 8, windowSeconds: 300 },
  signup: { limit: 4, windowSeconds: 3600 },
  forgotPassword: { limit: 4, windowSeconds: 3600 },
  resetPassword: { limit: 6, windowSeconds: 3600 },
  contact: { limit: 5, windowSeconds: 3600 },
  resendVerification: { limit: 4, windowSeconds: 3600 },
  stripeAction: { limit: 10, windowSeconds: 300 },
} as const
