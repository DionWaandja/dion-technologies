import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { badRequest, ok, serverError, tooManyRequests } from '@/lib/http'
import { resetPasswordSchema } from '@/lib/validation'
import { rateLimit, clientIp, LIMITS } from '@/lib/rate-limit'
import { verifySameOrigin } from '@/lib/csrf'
import { consumePasswordResetToken } from '@/lib/tokens'
import { audit } from '@/lib/audit'
import { log } from '@/lib/logger'

const BCRYPT_COST = 12

export async function POST(req: Request) {
  try {
    if (!verifySameOrigin(req)) return badRequest('Invalid origin')

    const rl = rateLimit(`reset:${clientIp(req)}`, LIMITS.resetPassword)
    if (!rl.allowed) return tooManyRequests(rl.retryAfterSeconds)

    const body = await req.json().catch(() => null)
    const parsed = resetPasswordSchema.safeParse(body)
    if (!parsed.success) {
      return badRequest('Please check the form for errors', parsed.error.flatten().fieldErrors)
    }
    const { token, password } = parsed.data

    const userId = await consumePasswordResetToken(token)
    if (!userId) {
      return badRequest('This reset link is invalid or has expired. Please request a new one.')
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_COST)
    const user = await db.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        // Invalidate every existing session across devices.
        sessionVersion: { increment: 1 },
      },
      select: { email: true },
    })

    log.info('password_reset_completed', { userId })
    await audit({
      action: 'user.password_reset_completed',
      actorId: userId,
      actorEmail: user.email,
      targetType: 'user',
      targetId: userId,
    })

    return ok({ ok: true, message: 'Password updated. You can now sign in with your new password.' })
  } catch (e) {
    return serverError(e, 'reset-password')
  }
}
