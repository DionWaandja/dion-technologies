'use client'

import { useEffect, useState } from 'react'

type Status = {
  configured: boolean
  connected: boolean
  accountId: string | null
  chargesEnabled?: boolean
  payoutsEnabled?: boolean
  detailsSubmitted?: boolean
  dashboardUrl: string | null
}

/**
 * Admin payouts: onboards the admin's Stripe Connect Express account and
 * links to Stripe's own dashboard. Bank account details are entered in
 * Stripe's UI only — this database never stores them.
 */
export default function ConnectPanel() {
  const [status, setStatus] = useState<Status | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    try {
      const res = await fetch('/api/admin/connect')
      const json = (await res.json()) as Status & { error?: string }
      if (!res.ok) throw new Error(json.error ?? 'Failed to load Connect status')
      setStatus(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load Connect status')
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function startOnboarding() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/connect', { method: 'POST' })
      const json = (await res.json()) as { url?: string; error?: string }
      if (res.ok && json.url) {
        window.location.href = json.url
        return
      }
      setError(json.error ?? 'Could not start onboarding.')
    } catch {
      setError('Network error. Please try again.')
    }
    setBusy(false)
  }

  if (error && !status) {
    return <p className="glass p-6 text-sm text-rose-200">{error}</p>
  }
  if (!status) return <p className="text-sm text-slate-500">Loading Connect status…</p>

  if (!status.configured) {
    return (
      <div className="glass p-6 text-sm text-slate-400">
        <p className="font-medium text-white">Stripe not connected</p>
        <p className="mt-2">
          Set <code className="text-indigo-300">STRIPE_SECRET_KEY</code> in your environment to
          enable payouts via Stripe Connect Express.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="glass p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-white">Payout account</h2>
            <p className="mt-1 text-sm text-slate-400">
              {status.connected
                ? `Connected — account ${status.accountId}`
                : 'Not onboarded yet. Connect Express handles your bank details and payouts.'}
            </p>
          </div>
          {status.connected ? (
            <div className="flex flex-wrap gap-2">
              {status.dashboardUrl ? (
                <a className="btn-primary" href={status.dashboardUrl} target="_blank" rel="noopener noreferrer">
                  Open Stripe Express dashboard ↗
                </a>
              ) : (
                <button type="button" className="btn-ghost" onClick={load} disabled={busy}>
                  Refresh link
                </button>
              )}
            </div>
          ) : (
            <button type="button" className="btn-primary" onClick={startOnboarding} disabled={busy}>
              {busy ? 'Preparing…' : 'Set up payouts'}
            </button>
          )}
        </div>

        {error && <p className="mt-4 text-sm text-rose-200">{error}</p>}

        {status.connected && (
          <dl className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <dt className="text-xs uppercase tracking-wider text-slate-500">Charges</dt>
              <dd className={`mt-1 text-sm font-medium ${status.chargesEnabled ? 'text-emerald-300' : 'text-amber-300'}`}>
                {status.chargesEnabled ? 'Enabled' : 'Pending'}
              </dd>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <dt className="text-xs uppercase tracking-wider text-slate-500">Payouts</dt>
              <dd className={`mt-1 text-sm font-medium ${status.payoutsEnabled ? 'text-emerald-300' : 'text-amber-300'}`}>
                {status.payoutsEnabled ? 'Enabled' : 'Pending'}
              </dd>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <dt className="text-xs uppercase tracking-wider text-slate-500">Details submitted</dt>
              <dd className={`mt-1 text-sm font-medium ${status.detailsSubmitted ? 'text-emerald-300' : 'text-amber-300'}`}>
                {status.detailsSubmitted ? 'Complete' : 'Incomplete'}
              </dd>
            </div>
          </dl>
        )}
      </div>

      <p className="text-xs text-slate-600">
        Bank account numbers, routing details, and payout schedules live exclusively in Stripe —
        this application never stores them (verified: the Setting store only holds the account ID).
      </p>
    </div>
  )
}
