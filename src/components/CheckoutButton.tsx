'use client'

import { useEffect, useState } from 'react'

type Status = 'loading' | 'ready' | 'error'

/**
 * Buy button for the subscription plan. Creates a Stripe Checkout session and
 * redirects; surfaces a clear message when billing isn't configured yet.
 */
export default function CheckoutButton({
  label = 'Subscribe',
  className = 'btn-primary w-full',
}: {
  label?: string
  className?: string
}) {
  const [status, setStatus] = useState<Status>('ready')
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (status !== 'error') return
    const t = setTimeout(() => setStatus('ready'), 6000)
    return () => clearTimeout(t)
  }, [status])

  async function handleClick() {
    setStatus('loading')
    setMessage(null)
    try {
      const res = await fetch('/api/billing/checkout', { method: 'POST' })
      const json = (await res.json().catch(() => ({}))) as { url?: string; error?: string }

      if (res.ok && json.url) {
        window.location.href = json.url
        return
      }
      setStatus('error')
      setMessage(json.error ?? 'Could not start checkout. Please try again.')
    } catch {
      setStatus('error')
      setMessage('Network error. Please try again.')
    }
  }

  return (
    <div>
      <button type="button" className={className} onClick={handleClick} disabled={status === 'loading'}>
        {status === 'loading' ? 'Redirecting…' : label}
      </button>
      {message && (
        <p className="mt-3 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-xs text-amber-200">
          {message}
        </p>
      )}
    </div>
  )
}
