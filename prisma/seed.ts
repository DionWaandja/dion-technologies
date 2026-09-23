/**
 * Seeds the first admin account and demo content.
 *
 * Usage:
 *   npm run db:seed
 *
 * Credentials come from env (never hardcoded):
 *   SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD  → first admin account
 *
 * Default in development: admin@dion.local / ChangeMe-2026!
 * (development only — set real values in production)
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'

const prisma = new PrismaClient()

async function main() {
  const email = (process.env.SEED_ADMIN_EMAIL || 'admin@dion.local').toLowerCase()
  const password = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe-2026!'

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    if (existing.role !== 'ADMIN') {
      await prisma.user.update({ where: { id: existing.id }, data: { role: 'ADMIN' } })
      console.log(`✓ promoted existing user ${email} to ADMIN`)
    } else {
      console.log(`• admin already exists: ${email}`)
    }
  } else {
    const passwordHash = await bcrypt.hash(password, 12)
    const admin = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: 'Dion Admin',
        role: 'ADMIN',
        emailVerified: new Date(),
      },
    })
    console.log(`✓ created admin: ${email}`)
    if (!process.env.SEED_ADMIN_PASSWORD) {
      console.log(`  dev password: ${password}`)
      console.log('  (set SEED_ADMIN_PASSWORD in .env to override)')
    }
    void admin
  }

  // Demo client + sample inbox messages (development convenience).
  if (process.env.NODE_ENV !== 'production') {
    const clientEmail = 'client@example.com'
    let client = await prisma.user.findUnique({ where: { email: clientEmail } })
    if (!client) {
      client = await prisma.user.create({
        data: {
          email: clientEmail,
          passwordHash: await bcrypt.hash(randomBytes(16).toString('hex'), 12), // random unusable password
          name: 'Demo Client',
          company: 'Example Co',
          role: 'CLIENT',
          emailVerified: new Date(),
        },
      })
      console.log('✓ created demo client: client@example.com (password unusable by design)')
    }

    const count = await prisma.message.count()
    if (count === 0) {
      await prisma.message.createMany({
        data: [
          {
            name: 'Dana Whitfield',
            email: 'dana@harborvine.example',
            company: 'Harbor & Vine Events',
            description:
              'We need a venue site with a photo gallery and an availability calendar that our coordinator can update without calling a developer.',
            budgetRange: '$10,000 – $25,000',
            status: 'NEW',
          },
          {
            name: 'Marcus Reed',
            email: 'marcus@northgatedental.example',
            company: 'Northgate Dental',
            description:
              'Six clinic locations, each needs its own page with online booking integration. Our current site takes 6 seconds to load.',
            budgetRange: '$5,000 – $10,000',
            status: 'READ',
          },
          {
            name: 'Demo Client',
            email: clientEmail,
            company: 'Example Co',
            description:
              'A client portal where our customers can log in and see order status. Needs email/password login and an admin view for our staff.',
            budgetRange: '$25,000+',
            status: 'HANDLED',
            userId: client.id,
          },
        ],
      })
      console.log('✓ seeded 3 sample inbox messages')
    }
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
