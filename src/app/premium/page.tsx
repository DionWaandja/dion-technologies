import Link from 'next/link'
import type { Metadata } from 'next'
import { currentUser } from '@/lib/session'
import { hasActiveSubscription, SUBSCRIPTION_LABELS } from '@/lib/subscription'
import { PREMIUM_PERKS } from '@/lib/site'
import PortalButton from '@/components/PortalButton'

export const metadata: Metadata = { title: 'Premium' }
export const dynamic = 'force-dynamic'

const RESOURCES = [
  { title: 'Launch Readiness Checklist (2026 edition)', type: 'PDF', size: '412 KB' },
  { title: 'SEO Setup Playbook for Local Businesses', type: 'PDF', size: '1.2 MB' },
  { title: 'Conversion Copy Frameworks', type: 'DOCX', size: '88 KB' },
  { title: 'Analytics & Event Tracking Starter', type: 'ZIP', size: '230 KB' },
] as const

/**
 * Paywall gate: the subscription check happens in this server component on
 * every request (backed by webhook-synced DB state) — never just hidden
 * client-side. The matching API route (/api/premium/data) enforces the same
 * rule for programmatic access.
 */
export default async function PremiumPage() {
  const user = await currentUser()
  if (!user) return null

  const active = hasActiveSubscription(user)

  if (!active) {
    return (
      <div className="mx-auto max-w-xl">
        <div className="glass p-9 text-center">
          <span className="badge border-indigo-400/30 bg-indigo-400/10 text-indigo-200">Premium</span>
          <h1 className="mt-4 text-2xl font-bold text-white">This content is for subscribers</h1>
          <p className="mt-3 text-slate-400">
            Premium care unlocks the resource library, priority support, and quarterly audits.
            Your current status: <span className="text-slate-200">{SUBSCRIPTION_LABELS[user.subscriptionStatus]}</span>.
          </p>
          <Link href="/pricing" className="btn-primary mt-7">See premium plans</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Premium resources</h1>
          <p className="mt-1 text-sm text-slate-500">Exclusive to active premium care subscribers.</p>
        </div>
        {user.stripeCustomerId && <PortalButton label="Manage billing" />}
      </div>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Resource library</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {RESOURCES.map((r) => (
            <article key={r.title} className="glass card-hover flex items-center gap-4 p-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-500/20 text-xs font-bold text-indigo-300">
                {r.type}
              </span>
              <div className="min-w-0">
                <h3 className="truncate font-medium text-white">{r.title}</h3>
                <p className="text-xs text-slate-500">{r.size}</p>
              </div>
            </article>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-600">
          Downloads are served from this page in production deployments; this demo lists the catalog.
        </p>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Your included services</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {PREMIUM_PERKS.map((perk) => (
            <article key={perk.title} className="glass p-5">
              <h3 className="font-medium text-white">{perk.title}</h3>
              <p className="mt-2 text-sm text-slate-400">{perk.description}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
