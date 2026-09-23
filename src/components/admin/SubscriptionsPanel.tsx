'use client'

import { useEffect, useState } from 'react'

type Subscriber = {
  id: string
  email: string | null
  name: string | null
  status: string
  amountMonthly: number
  currency: string
  currentPeriodEnd: string | null
}

type Response = {
  configured: boolean
  summary: { active: number; trialing: number; pastDue: number; canceled: number; mrr: number }
  subscribers: Subscriber[]
  note?: string
}

const STATUS_BADGE: Record<string, string> = {
  active: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300',
  trialing: 'border-sky-400/40 bg-sky-400/10 text-sky-300',
  past_due: 'border-amber-400/40 bg-amber-400/10 text-amber-300',
  unpaid: 'border-amber-400/40 bg-amber-400/10 text-amber-300',
  canceled: 'border-rose-400/40 bg-rose-400/10 text-rose-300',
}

export default function SubscriptionsPanel() {
  const [data, setData] = useState<Response | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/subscriptions')
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to load subscriptions')
        setData((await res.json()) as Response)
      })
      .catch((e: Error) => setError(e.message))
  }, [])

  if (error) return <p className="glass p-6 text-sm text-rose-200">{error}</p>
  if (!data) return <p className="text-sm text-slate-500">Loading Stripe data…</p>

  if (!data.configured) {
    return (
      <div className="glass p-6 text-sm text-slate-400">
        <p className="font-medium text-white">Stripe not connected</p>
        <p className="mt-2">{data.note}</p>
      </div>
    )
  }

  const cards = [
    { label: 'Active', value: data.summary.active },
    { label: 'Trialing', value: data.summary.trialing },
    { label: 'Past due', value: data.summary.pastDue },
    { label: 'MRR', value: `$${data.summary.mrr.toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="glass p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{c.label}</p>
            <p className="mt-2 text-2xl font-bold text-white">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead className="border-b border-white/5">
              <tr>
                <th className="th">Customer</th>
                <th className="th">Status</th>
                <th className="th">Monthly</th>
                <th className="th">Renews</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data.subscribers.length === 0 && (
                <tr>
                  <td colSpan={4} className="td text-center text-slate-500">
                    No subscriptions yet.
                  </td>
                </tr>
              )}
              {data.subscribers.map((s) => (
                <tr key={s.id}>
                  <td className="td">
                    <span className="block font-medium text-white">{s.name ?? '—'}</span>
                    <span className="text-xs text-slate-500">{s.email ?? s.id}</span>
                  </td>
                  <td className="td">
                    <span className={`badge ${STATUS_BADGE[s.status] ?? ''}`}>{s.status}</span>
                  </td>
                  <td className="td whitespace-nowrap">
                    {s.currency} {s.amountMonthly.toFixed(2)}
                  </td>
                  <td className="td whitespace-nowrap text-slate-400">
                    {s.currentPeriodEnd
                      ? new Date(s.currentPeriodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-xs text-slate-600">
        Data is pulled live from the Stripe API on each page load — there is no local billing ledger.
      </p>
    </div>
  )
}
