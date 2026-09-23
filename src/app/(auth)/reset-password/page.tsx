'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import AuthCard, { FormMessage, FieldError } from '@/components/AuthCard'

type FieldErrors = Record<string, string[]>

function ResetInner() {
  const params = useSearchParams()
  const token = params.get('token') ?? ''

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    setError(null)
    setFieldErrors({})

    const data = Object.fromEntries(new FormData(e.currentTarget).entries())
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, token }),
    })
    const json = (await res.json().catch(() => ({}))) as {
      ok?: boolean
      message?: string
      error?: string
      details?: FieldErrors
    }

    if (res.ok && json.ok) {
      setDone(json.message ?? 'Password updated.')
    } else {
      setError(json.error ?? 'Could not reset your password.')
      setFieldErrors(json.details ?? {})
    }
    setPending(false)
  }

  return (
    <AuthCard
      title="Choose a new password"
      subtitle="Your new password must be at least 10 characters."
      footer={<Link href="/login" className="text-indigo-300 hover:text-indigo-200">← Back to log in</Link>}
    >
      {done ? (
        <>
          <FormMessage kind="success" text={done} />
          <Link href="/login" className="btn-primary mt-5 w-full">Log in</Link>
        </>
      ) : !token ? (
        <FormMessage
          kind="error"
          text="This link is missing its token. Request a new reset link from the forgot-password page."
        />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {error && <FormMessage kind="error" text={error} />}

          <div>
            <label htmlFor="rp-password" className="label">New password</label>
            <input
              id="rp-password"
              name="password"
              type="password"
              className="input"
              autoComplete="new-password"
              required
              minLength={10}
              maxLength={128}
            />
            <FieldError messages={fieldErrors.password} />
          </div>

          <button type="submit" className="btn-primary w-full" disabled={pending}>
            {pending ? 'Updating…' : 'Update password'}
          </button>
        </form>
      )}
    </AuthCard>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetInner />
    </Suspense>
  )
}
