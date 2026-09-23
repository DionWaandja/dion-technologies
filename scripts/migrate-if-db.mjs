#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Runs `prisma migrate deploy` only when the configured PostgreSQL server is
 * reachable (e.g. during Vercel builds), and skips with a warning otherwise
 * (e.g. local builds with no database running) so the build never hard-fails
 * on migration connectivity.
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
    `[build] Skipping prisma migrate deploy: no PostgreSQL reachable at ${host || '(unset)'}:${port}.` +
      ' Deploy environments (Vercel) always run migrations; local builds without a DB skip them.',
  )
  process.exit(0)
}

console.log(`[build] PostgreSQL reachable at ${host}:${port} — running prisma migrate deploy…`)
const child = spawn(
  process.execPath,
  ['node_modules/prisma/build/index.js', 'migrate', 'deploy'],
  { stdio: 'inherit' },
)
child.on('exit', (code) => process.exit(code ?? 1))
