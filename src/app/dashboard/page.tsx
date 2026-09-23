import Link from 'next/link'
import type { Metadata } from 'next'
import { currentUser } from '@/lib/session'
import { hasActiveSubscription, SUBSCRIPTION_LABELS } from '@/lib/subscription'
import { db } from '@/lib/db'
import PortalButton from '@/components/PortalButton'
import { stripeConfigured } from '@/lib/stripe'

export const metadata: Metadata = { title: 'Dashboard' }
export const dynamic = 'force-dynamic'

const MESSAGE_BADGE: Record<string, string> = {
  NEW: 'border-sky-400/40 bg-sky-400/10 text-sky-300',
  READ: 'border-slate-400/30 bg-slate-400/10 text-slate-300',
  ARCHIVED: 'border-slate-500/30 bg-slate-500/10 text-slate-500',
  HANDLED: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300',
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>
}) {
  const user = await currentUser()
  if (!user) return null // layout guarantees a user; satisfies the type checker

  const [{ checkout }, requests] = await Promise.all([
    searchParams,
    db.message.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
  ])

  const active = hasActiveSubscription(user)

  return (
    <div className="space-y-8">
      {checkout === 'success' && (
        <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
          Subscription started — welcome aboard! It may take a few seconds for your premium access
          to appear.
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-white">
          Welcome back{user.name ? `, ${user.name.split(' ')[0]}` : ''}
        </h1>
        <p className="mt-1 text-sm text-slate-500">{user.email}</p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {/* Subscription status — synced from Stripe webhooks */}
        <section className="glass p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white">Subscription</h2>
            <span
              className={`badge ${
                active
                  ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300'
                  : 'border-white/15 bg-white/5 text-slate-400'
              }`}
            >
              {SUBSCRIPTION_LABELS[user.subscriptionStatus]}
            </span>
          </div>

          {active ? (
            <p className="mt-3 text-sm text-slate-400">
              Premium care is active{user.currentPeriodEnd
                ? ` — renews ${user.currentPeriodEnd.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
                : ''}
              . You have full access to{' '}
              <Link href="/premium" className="text-indigo-300 hover:text-indigo-200">premium content</Link>.
            </p>
          ) : (
            <p className="mt-3 text-sm text-slate-400">
              {stripeConfigured()
                ? 'You are not subscribed to premium care yet.'
                : 'Billing is not configured on this deployment yet — subscription features are disabled.'}
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            {user.stripeCustomerId && <PortalButton label="Manage billing" />}
            {!active && (
              <Link href="/pricing" className="btn-primary">
                View plans
              </Link>
            )}
          </div>
          <p className="mt-4 text-xs text-slate-600">
            Payment methods, invoices, and cancellations are handled securely by Stripe — we never
            see or store your card details.
          </p>
        </section>

        {/* Quick actions */}
        <section className="glass p-6">
          <h2 className="font-semibold text-white">Quick actions</h2>
          <div className="mt-4 grid gap-3">
            <Link href="/contact" className="glass card-hover flex items-center justify-between p-4">
              <span>
                <span className="block text-sm font-medium text-white">Submit a new project request</span>
                <span className="text-xs text-slate-500">Describe what you want built</span>
              </span>
              <span aria-hidden="true">→</span>
            </Link>
            <Link href="/premium" className="glass card-hover flex items-center justify-between p-4">
              <span>
                <span className="block text-sm font-medium text-white">Premium resources</span>
                <span className="text-xs text-slate-500">
                  {active ? 'Your subscriber library' : 'Unlock with premium care'}
                </span>
              </span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>
      </div>

      {/* Project requests */}
      <section className="glass overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/5 p-6">
          <h2 className="font-semibold text-white">Your project requests</h2>
          <Link href="/contact" className="text-sm text-indigo-300 hover:text-indigo-200">
            + New request
          </Link>
        </div>

        {requests.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">
            No project requests yet. <Link href="/contact" className="text-indigo-300 hover:text-indigo-200">Tell us what you want built</Link> and it will show up here.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="border-b border-white/5">
                <tr>
                  <th className="th">Submitted</th>
                  <th className="th">Description</th>
                  <th className="th">Budget</th>
                  <th className="th">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {requests.map((r) => (
                  <tr key={r.id}>
                    <td className="td whitespace-nowrap text-slate-400">
                      {r.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="td max-w-md">
                      <span className="line-clamp-2">{r.description}</span>
                    </td>
                    <td className="td whitespace-nowrap">{r.budgetRange}</td>
                    <td className="td">
                      <span className={`badge ${MESSAGE_BADGE[r.status] ?? ''}`}>{r.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
