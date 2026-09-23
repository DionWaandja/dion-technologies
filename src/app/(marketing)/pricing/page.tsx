import type { Metadata } from 'next'
import Link from 'next/link'
import { currentUser } from '@/lib/session'
import { hasActiveSubscription } from '@/lib/subscription'
import { PREMIUM_PERKS } from '@/lib/site'
import CheckoutButton from '@/components/CheckoutButton'

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Project quotes and the Dion Technologies premium care subscription.',
}

const included = [
  'Fixed-scope proposal with timeline',
  'Design, build, and launch',
  'Performance & SEO baseline',
  '30 days of post-launch fixes',
] as const

export default async function PricingPage() {
  const user = await currentUser()
  const active = user ? hasActiveSubscription(user) : false

  return (
    <section className="section">
      <div className="container-page">
        <h1 className="heading-xl text-center">Pricing</h1>
        <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-slate-400">
          Projects are quoted fixed-scope after a short call. The subscription below is for
          clients who want us on retainer after launch.
        </p>

        <div className="mx-auto mt-14 grid max-w-5xl gap-6 lg:grid-cols-2">
          {/* Project builds */}
          <div className="glass flex flex-col p-8">
            <h2 className="text-lg font-semibold text-white">Project builds</h2>
            <p className="mt-2 text-sm text-slate-400">
              Custom websites and web apps, quoted per project.
            </p>
            <p className="mt-6">
              <span className="text-4xl font-bold text-white">$2k–$25k</span>
              <span className="ml-2 text-sm text-slate-500">typical range</span>
            </p>
            <ul className="mt-6 flex-1 space-y-3 text-sm text-slate-300">
              {included.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-emerald-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0l-3.5-3.5a1 1 0 1 1 1.4-1.4l2.8 2.8 6.8-6.8a1 1 0 0 1 1.4 0z" clipRule="evenodd" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/contact" className="btn-ghost mt-8">Request a quote</Link>
          </div>

          {/* Premium subscription */}
          <div className="glass relative flex flex-col overflow-hidden border-indigo-400/30 p-8">
            <div className="bg-glow absolute inset-0" aria-hidden="true" />
            <div className="relative flex h-full flex-col">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Premium care</h2>
                <span className="badge border-indigo-400/40 bg-indigo-400/10 text-indigo-200">Subscription</span>
              </div>
              <p className="mt-2 text-sm text-slate-400">Priority support, resources, and quarterly audits.</p>
              <p className="mt-6">
                <span className="text-4xl font-bold text-white">$49</span>
                <span className="ml-1 text-sm text-slate-500">/ month</span>
              </p>
              <ul className="mt-6 flex-1 space-y-3 text-sm text-slate-300">
                {PREMIUM_PERKS.map((perk) => (
                  <li key={perk.title} className="flex items-start gap-2">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm1-11a1 1 0 1 0-2 0v1H8a1 1 0 1 0 0 2h1v1a1 1 0 1 0 2 0v-1h1a1 1 0 1 0 0-2h-1V7z" clipRule="evenodd" />
                    </svg>
                    <span>
                      <span className="font-medium text-white">{perk.title}</span> — {perk.description}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                {active ? (
                  <Link href="/premium" className="btn-primary w-full">Open premium content →</Link>
                ) : user ? (
                  <CheckoutButton label="Subscribe to Premium care" />
                ) : (
                  <div className="space-y-3">
                    <Link href="/signup" className="btn-primary w-full">Create an account to subscribe</Link>
                    <p className="text-center text-xs text-slate-500">
                      Already have one? <Link href="/login?callbackUrl=/pricing" className="text-indigo-300 hover:text-indigo-200">Log in</Link>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <p className="mx-auto mt-10 max-w-2xl text-center text-xs text-slate-600">
          Subscriptions are billed securely by Stripe. Manage or cancel anytime from the billing
          portal in your dashboard.
        </p>
      </div>
    </section>
  )
}
