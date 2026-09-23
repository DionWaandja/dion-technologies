import { db } from '@/lib/db'
import { badRequest, ok, serverError, tooManyRequests } from '@/lib/http'
import { emailSchema } from '@/lib/validation'
import { rateLimit, clientIp, LIMITS } from '@/lib/rate-limit'
import { verifySameOrigin } from '@/lib/csrf'
import { createEmailVerificationToken } from '@/lib/tokens'
import { verificationEmail } from '@/lib/mail'
import { getAppUrl } from '@/lib/stripe'
import { log } from '@/lib/logger'

export async function POST(req: Request) {
  try {
    if (!verifySameOrigin(req)) return badRequest('Invalid origin')

    const rl = rateLimit(`resend-verify:${clientIp(req)}`, LIMITS.resendVerification)
    if (!rl.allowed) return tooManyRequests(rl.retryAfterSeconds)

    const body = (await req.json().catch(() => null)) as { email?: string } | null
    const parsed = emailSchema.safeParse(body?.email)
    if (!parsed.success) return badRequest('Enter a valid email address')
    const email = parsed.data

    // Always respond the same way to avoid account enumeration.
    const respond = () =>
      ok({ ok: true, message: 'If that account needs verification, a new link has been sent.' })

    const user = await db.user.findUnique({ where: { email } })
    if (!user || user.emailVerified) return respond()

    const token = await createEmailVerificationToken(user.id)
    const url = `${getAppUrl()}/verify-email?token=${token}`
    await verificationEmail(user.email, url)
    log.info('verification_email_resent', { userId: user.id })

    return respond()
  } catch (e) {
    return serverError(e, 'resend-verification')
  }
}
