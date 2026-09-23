/* eslint-disable no-console */
import { PGlite } from '@electric-sql/pglite'
import { PGLiteSocketServer } from '@electric-sql/pglite-socket'

const port = Number(process.argv[2]) || 54329
const debug = process.argv.includes('--debug')
const db = await PGlite.create()
// maxConnections > 1: Prisma pools connections and the default (1) rejects the rest.
const server = new PGLiteSocketServer({ db, port, host: '127.0.0.1', maxConnections: 20, debug, inspect: debug })
await server.start()
console.log(`PGREADY on ${port}`)
process.on('SIGTERM', async () => {
  await server.stop().catch(() => {})
  await db.close().catch(() => {})
  process.exit(0)
})
// Stay alive for clients.
setInterval(() => {}, 60_000)
