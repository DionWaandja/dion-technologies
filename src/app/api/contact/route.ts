import { db } from '@/lib/db'
import { contactSchema } from '@/lib/validation'
import { badRequest, ok, serverError, tooManyRequests } from '@/lib/http'
import { rateLimit, clientIp, LIMITS } from '@/lib/rate-limit'
import { verifySameOrigin } from '@/lib/csrf'
import { currentUser } from '@/lib/session'
import { audit } from '@/lib/audit'

/**
 * Public contact / project-request form. Stored in the database for the admin
 * inbox; if a logged-in client submits, the message is linked to their account.
 */
export async function POST(req: Request) {
  try {
    if (!verifySameOrigin(req)) return badRequest('Invalid origin')

    const rl = rateLimit(`contact:${clientIp(req)}`, LIMITS.contact)
    if (!rl.allowed) return tooManyRequests(rl.retryAfterSeconds)

    const body = await req.json().catch(() => null)
    const parsed = contactSchema.safeParse(body)
    if (!parsed.success) {
      return badRequest('Please check the form for errors', parsed.error.flatten().fieldErrors)
    }
    const { name, email, company, description, budgetRange } = parsed.data

    const user = await currentUser()

    const message = await db.message.create({
      data: {
        name,
        email,
        company: company || null,
        description,
        budgetRange,
        userId: user?.id ?? null,
        status: 'NEW',
      },
      select: { id: true },
    })

    await audit({
      action: 'message.submitted',
      req,
      actorId: user?.id,
      actorEmail: email,
      targetType: 'message',
      targetId: message.id,
      metadata: { budgetRange },
    })

    return ok({
      ok: true,
      message: 'Thanks — your project request is in. We reply to every inquiry within one business day.',
    })
  } catch (e) {
    return serverError(e, 'contact-submit')
  }
}
