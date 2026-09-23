import { createHash, randomBytes } from 'crypto'
import { db } from './db'

/**
 * Opaque single-use tokens. Only the SHA-256 hash is stored, so a database
 * leak cannot be replayed against verification or reset endpoints.
 */

const TOKEN_BYTES = 32

export function newToken(): { raw: string; hash: string } {
  const raw = randomBytes(TOKEN_BYTES).toString('hex')
  return { raw, hash: hashToken(raw) }
}

export function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex')
}

const VERIFICATION_TTL_HOURS = 24
const RESET_TTL_MINUTES = 60

export async function createEmailVerificationToken(userId: string): Promise<string> {
  // Replace any outstanding tokens for this user.
  await db.emailVerificationToken.deleteMany({ where: { userId } })
  const { raw, hash } = newToken()
  await db.emailVerificationToken.create({
    data: {
      tokenHash: hash,
      userId,
      expiresAt: new Date(Date.now() + VERIFICATION_TTL_HOURS * 3_600_000),
    },
  })
  return raw
}

/** Returns the userId on success; null if invalid/expired. Always consumes the token. */
export async function consumeEmailVerificationToken(raw: string): Promise<string | null> {
  const record = await db.emailVerificationToken.findUnique({
    where: { tokenHash: hashToken(raw) },
  })
  if (!record) return null
  await db.emailVerificationToken.delete({ where: { id: record.id } })
  if (record.expiresAt.getTime() < Date.now()) return null
  return record.userId
}

export async function createPasswordResetToken(userId: string): Promise<string> {
  await db.passwordResetToken.deleteMany({ where: { userId } })
  const { raw, hash } = newToken()
  await db.passwordResetToken.create({
    data: {
      tokenHash: hash,
      userId,
      expiresAt: new Date(Date.now() + RESET_TTL_MINUTES * 60_000),
    },
  })
  return raw
}

/** Single-use: rejects tokens already consumed, and deletes on success. */
export async function consumePasswordResetToken(raw: string): Promise<string | null> {
  const record = await db.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(raw) },
  })
  if (!record) return null
  await db.passwordResetToken.delete({ where: { id: record.id } })
  if (record.expiresAt.getTime() < Date.now()) return null
  if (record.usedAt) return null
  return record.userId
}
