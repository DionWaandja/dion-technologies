import { db } from '@/lib/db'
import { ok, badRequest, notFound, serverError } from '@/lib/http'
import { guardAdmin } from '@/lib/session'
import { verifySameOrigin } from '@/lib/csrf'
import { adminMessageUpdateSchema } from '@/lib/validation'
import { audit } from '@/lib/audit'
import type { MessageStatus } from '@prisma/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** PATCH /api/admin/messages/:id — update status and/or internal notes. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!verifySameOrigin(req)) return badRequest('Invalid origin')

    const guard = await guardAdmin()
    if ('error' in guard) return guard.error

    const { id } = await params
    const body = await req.json().catch(() => null)
    const parsed = adminMessageUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return badRequest('Invalid update', parsed.error.flatten().fieldErrors)
    }

    const existing = await db.message.findUnique({ where: { id }, select: { id: true } })
    if (!existing) return notFound('Message not found')

    const data: { status?: MessageStatus; notes?: string; handledAt?: Date | null } = {}
    if (parsed.data.status !== undefined) {
      data.status = parsed.data.status
      data.handledAt = parsed.data.status === 'HANDLED' ? new Date() : null
    }
    if (parsed.data.notes !== undefined) data.notes = parsed.data.notes

    const updated = await db.message.update({
      where: { id },
      data,
      select: { id: true, status: true, notes: true, handledAt: true },
    })

    await audit({
      action: 'admin.message_updated',
      req,
      actorId: guard.user.id,
      actorEmail: guard.user.email,
      targetType: 'message',
      targetId: id,
      metadata: { status: data.status ?? undefined, notesEdited: data.notes !== undefined },
    })

    return ok({ ok: true, message: updated })
  } catch (e) {
    return serverError(e, 'admin-message-update')
  }
}
