import { db } from './db'
import { clientIp } from './rate-limit'
import { log } from './logger'
import type { Prisma } from '@prisma/client'

type AuditInput = {
  action: string
  req?: Request
  actorId?: string | null
  actorEmail?: string | null
  targetType?: string
  targetId?: string
  metadata?: Record<string, unknown>
}

/**
 * Append-only audit trail for admin and security-relevant actions.
 * Never logs credentials or tokens — callers must not pass them in metadata.
 */
export async function audit({
  action,
  req,
  actorId,
  actorEmail,
  targetType,
  targetId,
  metadata,
}: AuditInput): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        action,
        actorId: actorId ?? null,
        actorEmail: actorEmail ?? null,
        ip: req ? clientIp(req) : null,
        targetType: targetType ?? null,
        targetId: targetId ?? null,
        ...(metadata ? { metadata: metadata as Prisma.InputJsonValue } : {}),
      },
    })
  } catch (e) {
    // Auditing must never take down the request path; log for operator attention.
    log.error('audit_write_failed', { action, error: e })
  }
}
