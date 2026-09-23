import { db } from '@/lib/db'
import { ok, badRequest, tooManyRequests, serverError } from '@/lib/http'
import { rateLimit, clientIp, LIMITS } from '@/lib/rate-limit'
import { verifySameOrigin } from '@/lib/csrf'
import { consumeEmailVerificationToken } from '@/lib/tokens'
import { audit } from '@/lib/audit'

export async function POST(req: Request) {
  try {
    if (!verifySameOrigin(req)) return badRequest('Invalid origin')

    const rl = rateLimit(`verify:${clientIp(req)}`, { limit: 20, windowSeconds: 3600 })
    if (!rl.allowed) return tooManyRequests(rl.retryAfterSeconds)

    const body = (await req.json().catch(() => null)) as { token?: string } | null
    if (!body?.token || typeof body.token !== 'string') {
      return badRequest('Verification token is required')
    }

    const userId = await consumeEmailVerificationToken(body.token)
    if (!userId) {
      return badRequest('This verification link is invalid or has expired. Please request a new one.')
    }

    await db.user.update({
      where: { id: userId },
      data: { emailVerified: new Date() },
    })

    await audit({ action: 'user.email_verified', req, actorId: userId, targetType: 'user', targetId: userId })

    return ok({ ok: true, message: 'Email verified. You can now sign in.' })
  } catch (e) {
    return serverError(e, 'verify-email')
  }
}
