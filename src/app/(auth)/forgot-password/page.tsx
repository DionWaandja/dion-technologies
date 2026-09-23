'use client'

import Link from 'next/link'
import { useState } from 'react'
import AuthCard, { FormMessage } from '@/components/AuthCard'

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    const data = Object.fromEntries(new FormData(e.currentTarget).entries())

    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = (await res.json().catch(() => ({}))) as { message?: string; error?: string }
    setSent(true)
    setMessage(json.message ?? json.error ?? 'If an account exists, a reset link has been sent.')
    setPending(false)
  }

  return (
    <AuthCard
      title="Reset your password"
      subtitle="Enter your account email and we will send a secure reset link."
      footer={<Link href="/login" className="text-indigo-300 hover:text-indigo-200">← Back to log in</Link>}
    >
      {sent ? (
        <FormMessage kind="success" text={message} />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div>
            <label htmlFor="fp-email" className="label">Email</label>
            <input id="fp-email" name="email" type="email" className="input" autoComplete="email" required />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={pending}>
            {pending ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      )}
    </AuthCard>
  )
}
