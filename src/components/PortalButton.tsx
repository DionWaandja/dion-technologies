'use client'

import { useState } from 'react'

/**
 * Redirects the user to the Stripe Customer Portal (payment methods, invoices,
 * cancellation) — per spec, no custom billing UI is built.
 */
export default function PortalButton({
  label = 'Manage billing in Stripe',
  className = 'btn-ghost',
}: {
  label?: string
  className?: string
}) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setPending(true)
    setError(null)
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' })
      const json = (await res.json().catch(() => ({}))) as { url?: string; error?: string }
      if (res.ok && json.url) {
        window.location.href = json.url
        return
      }
      setError(json.error ?? 'Could not open the billing portal.')
    } catch {
      setError('Network error. Please try again.')
    }
    setPending(false)
  }

  return (
    <div>
      <button type="button" onClick={handleClick} disabled={pending} className={className}>
        {pending ? 'Opening…' : label}
      </button>
      {error && (
        <p className="mt-3 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-xs text-amber-200">
          {error}
        </p>
      )}
    </div>
  )
}
