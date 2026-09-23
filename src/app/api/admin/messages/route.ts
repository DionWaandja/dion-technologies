import { db } from '@/lib/db'
import { ok, serverError } from '@/lib/http'
import { guardAdmin } from '@/lib/session'
import type { Prisma, MessageStatus } from '@prisma/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const STATUSES = ['NEW', 'READ', 'ARCHIVED', 'HANDLED'] as const

/** Inbox listing: ?status=NEW|READ|ARCHIVED|HANDLED|ALL&q=search&page=1 */
export async function GET(req: Request) {
  try {
    const guard = await guardAdmin()
    if ('error' in guard) return guard.error

    const url = new URL(req.url)
    const statusParam = url.searchParams.get('status') ?? 'ALL'
    const q = (url.searchParams.get('q') ?? '').trim().slice(0, 200)
    const page = Math.max(1, Math.min(1000, Number(url.searchParams.get('page')) || 1))
    const pageSize = 25

    const where: Prisma.MessageWhereInput = {}
    if (STATUSES.includes(statusParam as (typeof STATUSES)[number])) {
      where.status = statusParam as MessageStatus
    }
    if (q) {
      where.OR = ['name', 'email', 'company', 'description'].map((field) => ({
        [field]: { contains: q, mode: 'insensitive' as const },
      }))
    }

    const [items, total, countNew, countRead, countArchived, countHandled] = await Promise.all([
      db.message.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          name: true,
          email: true,
          company: true,
          description: true,
          budgetRange: true,
          status: true,
          notes: true,
          handledAt: true,
          createdAt: true,
          userId: true,
        },
      }),
      db.message.count({ where }),
      db.message.count({ where: { status: 'NEW' } }),
      db.message.count({ where: { status: 'READ' } }),
      db.message.count({ where: { status: 'ARCHIVED' } }),
      db.message.count({ where: { status: 'HANDLED' } }),
    ])

    return ok({
      items,
      total,
      page,
      pageSize,
      pages: Math.max(1, Math.ceil(total / pageSize)),
      counts: { NEW: countNew, READ: countRead, ARCHIVED: countArchived, HANDLED: countHandled },
    })
  } catch (e) {
    return serverError(e, 'admin-messages-list')
  }
}
