import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { signupSchema } from '@/lib/validation'
import { badRequest, conflict, ok, serverError, tooManyRequests } from '@/lib/http'
import { rateLimit, clientIp, LIMITS } from '@/lib/rate-limit'
import { verifySameOrigin } from '@/lib/csrf'
import { createEmailVerificationToken } from '@/lib/tokens'
import { verificationEmail } from '@/lib/mail'
import { getAppUrl } from '@/lib/stripe'
import { audit } from '@/lib/audit'
import { log } from '@/lib/logger'

const BCRYPT_COST = 12

export async function POST(req: Request) {
  try {
    if (!verifySameOrigin(req)) return badRequest('Invalid origin')

    const rl = rateLimit(`signup:${clientIp(req)}`, LIMITS.signup)
    if (!rl.allowed) return tooManyRequests(rl.retryAfterSeconds)

    const body = await req.json().catch(() => null)
    const parsed = signupSchema.safeParse(body)
    if (!parsed.success) {
      return badRequest('Please check the form for errors', parsed.error.flatten().fieldErrors)
    }
    const { name, email, password } = parsed.data

    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      // No account enumeration: same message as the rate-limited path.
      return conflict('If this email can be registered, a verification link is on its way.')
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_COST)
    const user = await db.user.create({
      data: { name, email, passwordHash, role: 'CLIENT' },
      select: { id: true, email: true, name: true },
    })

    const token = await createEmailVerificationToken(user.id)
    const url = `${getAppUrl()}/verify-email?token=${token}`
    await verificationEmail(user.email, url)

    await audit({
      action: 'user.signup',
      req,
      actorId: user.id,
      actorEmail: user.email,
      targetType: 'user',
      targetId: user.id,
    })

    return ok({ ok: true, message: 'Account created. Check your email to verify your address.' })
  } catch (e) {
    return serverError(e, 'signup')
  }
}
