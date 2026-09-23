import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { forbidden, unauthorized } from '@/lib/http'
import type { NextResponse } from 'next/server'
import type { User } from '@prisma/client'

/**
 * Authoritative session helpers. Unlike middleware (fast JWT checks), these
 * re-read the user from the database on every call, so revoked roles, changed
 * passwords (sessionVersion bump) and deleted accounts take effect immediately.
 */

/** Full DB user for the current session, or null (incl. stale sessions). */
export async function currentUser(): Promise<User | null> {
  const session = await auth()
  const id = session?.user?.id
  if (!id) return null

  const user = await db.user.findUnique({ where: { id } })
  if (!user) return null

  // Session issued before a password change / forced logout → treat as signed out.
  if ((session.user.sessionVersion ?? 0) !== user.sessionVersion) return null

  return user
}

/** 401 response when unauthenticated, else null (route continues). */
export async function guardAuthed(): Promise<NextResponse | null> {
  const user = await currentUser()
  if (!user) return unauthorized()
  return null
}

/** 401/403 responses unless the caller is an ADMIN (DB-verified). */
export async function guardAdmin(): Promise<{ user: User } | { error: NextResponse }> {
  const user = await currentUser()
  if (!user) return { error: unauthorized() }
  if (user.role !== 'ADMIN') return { error: forbidden('Admin access required') }
  return { user }
}

export function isVerified(user: User): boolean {
  return user.emailVerified !== null
}
