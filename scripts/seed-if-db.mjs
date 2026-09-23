#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Seeds the database (first admin account) during builds — but only when:
 *   1. a PostgreSQL server is reachable (Vercel builds / local with DB up), and
 *   2. SEED_ADMIN_EMAIL + SEED_ADMIN_PASSWORD are both configured.
 *
 * Skipping in every other case keeps default development credentials
 * (admin@dion.local) out of production and local builds without a DB green.
 */
import net from 'node:net'
import { spawn } from 'node:child_process'
import { URL } from 'node:url'

const url = process.env.DATABASE_URL || ''
let host = null
let port = 5432
try {
  const parsed = new URL(url)
  host = parsed.hostname
  port = Number(parsed.port) || 5432
} catch {
  // fall through — treated as unreachable
}

function reachable(h, p, timeoutMs = 2500) {
  if (!h) return Promise.resolve(false)
  return new Promise((resolve) => {
    const socket = net.connect({ host: h, port: p })
    const done = (ok) => {
      socket.destroy()
      resolve(ok)
    }
    socket.setTimeout(timeoutMs)
    socket.once('connect', () => done(true))
    socket.once('timeout', () => done(false))
    socket.once('error', () => done(false))
  })
}

const up = await reachable(host, port)
if (!up) {
  console.warn(
    `[build] Skipping seed: no PostgreSQL reachable at ${host || '(unset)'}:${port}.`,
  )
  process.exit(0)
}

if (!process.env.SEED_ADMIN_EMAIL || !process.env.SEED_ADMIN_PASSWORD) {
  console.warn('[build] Skipping seed: SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not configured.')
  process.exit(0)
}

console.log(`[build] Seeding database (admin: ${process.env.SEED_ADMIN_EMAIL})…`)
const child = spawn(
  process.execPath,
  ['--experimental-strip-types', 'prisma/seed.ts'],
  { stdio: 'inherit', env: { ...process.env, NODE_ENV: 'production' } },
)
child.on('exit', (code) => process.exit(code ?? 1))
