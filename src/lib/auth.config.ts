import type { NextAuthConfig } from 'next-auth'
import type { Role } from '@prisma/client'

/**
 * Edge-safe Auth.js configuration used by middleware. It deliberately contains
 * NO database or bcrypt imports: middleware only decodes and verifies the
 * signed JWT. Credential verification against the database happens in the
 * Node-runtime config in src/lib/auth.ts, which spreads this base config.
 */
export const authConfig = {
  trustHost: true,
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    // 30 days, sliding on activity.
    maxAge: 60 * 60 * 24 * 30,
  },
  providers: [], // credentials provider added in the Node config (src/lib/auth.ts)
  callbacks: {
    // Map custom JWT fields onto the session the middleware sees. The Node
    // runtime config (src/lib/auth.ts) spreads this base config, so these are
    // shared by both instances. Type-only import keeps this edge-safe.
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? ''
        session.user.role = (token.role ?? 'CLIENT') as Role
        session.user.sessionVersion =
          typeof token.sessionVersion === 'number' ? token.sessionVersion : 0
      }
      return session
    },
    authorized() {
      // Route-level decisions are made in middleware itself; this hook stays
      // permissive so guards below fully control access.
      return true
    },
  },
} satisfies NextAuthConfig
