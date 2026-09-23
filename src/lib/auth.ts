import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { authConfig } from './auth.config'
import { db } from './db'
import { loginSchema } from './validation'
import { rateLimit, clientIp, LIMITS } from './rate-limit'
import { log } from './logger'
import type { Role } from '@prisma/client'

/**
 * Full Auth.js instance for the Node runtime (API route handlers).
 * - Credentials login with bcrypt comparison; never logs passwords
 * - Per-IP + per-account rate limiting inside authorize()
 * - JWT carries role/sessionVersion; server routes re-verify everything
 *   against the database (see src/lib/session.ts)
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: 'Email & password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(rawCredentials, request) {
        // Brute-force guard: per IP…
        const ip = clientIp(request)
        const ipLimit = rateLimit(`login:ip:${ip}`, LIMITS.login)
        if (!ipLimit.allowed) return null

        const parsed = loginSchema.safeParse(rawCredentials)
        if (!parsed.success) return null
        const { email, password } = parsed.data

        // …and per account.
        const emailLimit = rateLimit(`login:email:${email}`, LIMITS.login)
        if (!emailLimit.allowed) return null

        const user = await db.user.findUnique({ where: { email } })
        if (!user) return null

        const valid = await bcrypt.compare(password, user.passwordHash)
        if (!valid) return null

        if (!user.emailVerified) {
          log.info('login_blocked_unverified', { email: user.email })
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          sessionVersion: user.sessionVersion,
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        const u = user as typeof user & { role?: Role; sessionVersion?: number }
        if (u.role) token.role = u.role
        token.sessionVersion = typeof u.sessionVersion === 'number' ? u.sessionVersion : 0
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? ''
        session.user.role = (token.role ?? 'CLIENT') as Role
        session.user.sessionVersion =
          typeof token.sessionVersion === 'number' ? token.sessionVersion : 0
      }
      return session
    },
  },
  events: {
    async signIn({ user }) {
      log.info('user_signed_in', { userId: user?.id })
    },
  },
})
