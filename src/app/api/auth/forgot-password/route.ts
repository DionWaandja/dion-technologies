import { db } from '@/lib/db'
import { badRequest, ok, serverError, tooManyRequests } from '@/lib/http'
import { forgotPasswordSchema } from '@/lib/validation'
import { rateLimit, clientIp, LIMITS } from '@/lib/rate-limit'
import { verifySameOrigin } from '@/lib/csrf'
import { createPasswordResetToken } from '@/lib/tokens'
import { passwordResetEmail } from '@/lib/mail'
import { getAppUrl } from '@/lib/stripe'
import { audit } from '@/lib/audit'

export async function POST(req: Request) {
  try {
    if (!verifySameOrigin(req)) return badRequest('Invalid origin')

    const rl = rateLimit(`forgot:${clientIp(req)}`, LIMITS.forgotPassword)
    if (!rl.allowed) return tooManyRequests(rl.retryAfterSeconds)

    const body = (await req.json().catch(() => null)) as { email?: string } | null
    const parsed = forgotPasswordSchema.safeParse(body)
    if (!parsed.success) {
      // Same response shape regardless — never reveal whether an account exists.
      return ok({ ok: true, message: 'If an account exists for that email, a reset link has been sent.' })
    }

    const user = await db.user.findUnique({ where: { email: parsed.data.email } })
    if (user) {
      const token = await createPasswordResetToken(user.id)
      const url = `${getAppUrl()}/reset-password?token=${token}`
      await passwordResetEmail(user.email, url)
      await audit({
        action: 'user.password_reset_requested',
        req,
        actorId: user.id,
        actorEmail: user.email,
        targetType: 'user',
        targetId: user.id,
      })
    }

    return ok({ ok: true, message: 'If an account exists for that email, a reset link has been sent.' })
  } catch (e) {
    return serverError(e, 'forgot-password')
  }
}
